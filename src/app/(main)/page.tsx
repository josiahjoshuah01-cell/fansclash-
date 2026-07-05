import { CalendarDays, Trophy } from "lucide-react";

import { OpenMatchesList } from "@/components/open-matches-list";
import { createClient } from "@/lib/supabase/server";
import type { SportingEvent } from "@/lib/events";

export default async function Home() {
  const supabase = createClient();

  const { data: events } = await supabase
    .from("sporting_events")
    .select("id, team_a, team_b, kickoff_time, status")
    .eq("status", "scheduled")
    .order("kickoff_time", { ascending: true });

  const openMatches = (events ?? []) as SportingEvent[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Open Matches
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pick a side, stake your KES, and match with other fans before kickoff.
        </p>
      </div>

      {openMatches.length > 0 ? (
        <OpenMatchesList events={openMatches} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <Trophy className="size-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No open matches yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Sporting events will appear here once they are scheduled. Check back
            soon to place your first bet.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>Matches listed in East Africa Time (EAT)</span>
          </div>
        </div>
      )}
    </div>
  );
}
