import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Called by pg_cron or an external scheduler every few minutes.
 * Uses service role — protect this endpoint at the gateway/cron layer.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: events, error: queryError } = await supabaseAdmin
      .from("sporting_events")
      .select("id")
      .eq("status", "scheduled")
      .lte("kickoff_time", new Date().toISOString());

    if (queryError) {
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const locked: string[] = [];
    const errors: { event_id: string; error: string }[] = [];

    for (const event of events ?? []) {
      const { error } = await supabaseAdmin.rpc("lock_event", {
        p_event_id: event.id,
      });

      if (error) {
        errors.push({ event_id: event.id, error: error.message });
      } else {
        locked.push(event.id);
      }
    }

    return new Response(
      JSON.stringify({
        checked: events?.length ?? 0,
        locked_count: locked.length,
        locked_event_ids: locked,
        errors,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
