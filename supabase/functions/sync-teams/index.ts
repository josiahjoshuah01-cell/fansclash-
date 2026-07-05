import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";
const COMPETITION_CODE = "PL";

type FootballDataTeam = {
  id: number;
  name: string;
  crest?: string | null;
};

type FootballDataTeamsResponse = {
  teams?: FootballDataTeam[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiToken = Deno.env.get("FOOTBALL_DATA_API_TOKEN");
    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: "FOOTBALL_DATA_API_TOKEN is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.is_admin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiResponse = await fetch(
      `${FOOTBALL_DATA_BASE}/competitions/${COMPETITION_CODE}/teams`,
      {
        headers: {
          "X-Auth-Token": apiToken,
        },
      }
    );

    if (!apiResponse.ok) {
      const body = await apiResponse.text();
      return new Response(
        JSON.stringify({
          error: "football-data.org request failed",
          status: apiResponse.status,
          detail: body,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload = (await apiResponse.json()) as FootballDataTeamsResponse;
    const teams = payload.teams ?? [];

    let upserted = 0;
    for (const team of teams) {
      const { error: upsertError } = await supabaseAdmin.rpc(
        "upsert_team_from_api",
        {
          p_external_id: String(team.id),
          p_name: team.name,
          p_competition: COMPETITION_CODE,
          p_logo_url: team.crest ?? null,
        }
      );

      if (upsertError) {
        throw upsertError;
      }

      upserted += 1;
    }

    return new Response(
      JSON.stringify({
        synced: upserted,
        competition: COMPETITION_CODE,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
