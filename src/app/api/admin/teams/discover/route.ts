import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin";
import {
  FootballDataError,
  discoverScheduledTeams,
} from "@/lib/football-data";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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

  const query = new URL(request.url).searchParams.get("q") ?? undefined;

  try {
    const candidates = await discoverScheduledTeams(query);

    const externalIds = candidates.map((team) => team.external_id);
    const { data: storedTeams } = externalIds.length
      ? await supabase
          .from("teams")
          .select("id, external_id, approved, rejected")
          .in("external_id", externalIds)
      : { data: [] };

    const storedByExternalId = new Map(
      (storedTeams ?? []).map((team) => [team.external_id, team])
    );

    const teams = candidates.map((candidate) => {
      const stored = storedByExternalId.get(candidate.external_id);
      return {
        ...candidate,
        db_id: stored?.id ?? null,
        approved: stored?.approved ?? false,
        rejected: stored?.rejected ?? false,
      };
    });

    return NextResponse.json({
      teams,
      count: teams.length,
      lookahead_days: 30,
    });
  } catch (error) {
    if (error instanceof FootballDataError) {
      return NextResponse.json(
        {
          error: error.message,
          status: error.status,
          detail: error.detail,
        },
        { status: error.status === 500 ? 500 : 502 }
      );
    }

    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
