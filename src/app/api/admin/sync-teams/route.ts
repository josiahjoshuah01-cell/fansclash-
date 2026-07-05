import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin";
import {
  PREMIER_LEAGUE_CODE,
  SyncTeamsError,
  fetchPremierLeagueTeams,
  type TeamUpsertPayload,
} from "@/lib/sync-teams";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

async function upsertTeamsWithServiceRole(teams: TeamUpsertPayload[]) {
  const admin = createServiceRoleClient();
  let synced = 0;

  for (const team of teams) {
    const { error } = await admin.rpc("upsert_team_from_api", {
      p_external_id: team.external_id,
      p_name: team.name,
      p_competition: team.competition,
      p_logo_url: team.logo_url,
    });

    if (error) {
      throw error;
    }

    synced += 1;
  }

  return synced;
}

async function upsertTeamsWithSessionRpc(
  supabase: ReturnType<typeof createClient>,
  teams: TeamUpsertPayload[]
) {
  const { data, error } = await supabase.rpc("admin_bulk_upsert_teams", {
    p_teams: teams,
  });

  if (error) {
    throw error;
  }

  return data ?? teams.length;
}

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await isAdminUser(supabase, user.id, {
    phone: user.phone,
    email: user.email,
  });

  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const apiToken = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json(
      {
        error:
          "FOOTBALL_DATA_API_TOKEN is not configured. Add it to .env.local and restart the dev server.",
      },
      { status: 500 }
    );
  }

  try {
    const teams = await fetchPremierLeagueTeams(apiToken);

    let synced: number;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      synced = await upsertTeamsWithServiceRole(teams);
    } else {
      synced = await upsertTeamsWithSessionRpc(supabase, teams);
    }

    return NextResponse.json({
      synced,
      competition: PREMIER_LEAGUE_CODE,
    });
  } catch (error) {
    if (error instanceof SyncTeamsError) {
      return NextResponse.json(
        {
          error: error.message,
          status: error.status,
          detail: error.detail,
        },
        { status: 502 }
      );
    }

    const message = error instanceof Error ? error.message : "Sync failed";
    const hint =
      message.includes("admin_bulk_upsert_teams") ||
      message.includes("Could not find the function")
        ? " Run `npx supabase db push` to apply migrations, or add SUPABASE_SERVICE_ROLE_KEY to .env.local."
        : "";

    return NextResponse.json({ error: message + hint }, { status: 500 });
  }
}
