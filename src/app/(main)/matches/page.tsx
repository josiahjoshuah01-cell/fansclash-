import { CalendarDays, Clock, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/layout/empty-state";
import { PageContent } from "@/components/layout/page-content";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { StatTile } from "@/components/layout/stat-tile";
import { OpenMatchesList } from "@/components/open-matches-list";
import { SPORTING_EVENT_SELECT, normalizeSportingEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Open Matches — FansClash",
  description: "Browse open fixtures and place P2P fan bets before kickoff.",
};

export default async function MatchesPage() {
  const supabase = createClient();

  const { data: events } = await supabase
    .from("sporting_events")
    .select(SPORTING_EVENT_SELECT)
    .eq("status", "scheduled")
    .order("kickoff_time", { ascending: true });

  const openEvents = (events ?? []).map(normalizeSportingEvent);
  const matchCount = openEvents.length;

  return (
    <PageContent className="space-y-4">
      <PageHeader
        compact
        title="Open Matches"
        description="Pick a side, stake your KES, and match with other fans before kickoff."
      />

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
      >
        <StatTile
          compact
          label="Open matches"
          value={String(matchCount)}
          hint={matchCount === 1 ? "ready to bet" : "available now"}
          icon={Trophy}
        />
        <StatTile
          compact
          label="Matching"
          value="P2P"
          hint="fan vs fan pools"
          icon={Users}
        />
        <StatTile
          compact
          label="Timezone"
          value="EAT"
          hint="UTC+3 · Nairobi"
          icon={Clock}
        />
      </div>

      <Panel
        compact
        title="Match board"
        description="Tap a fixture to view pools and place your stake."
        contentClassName="pt-3"
        footer={
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-3.5" />
            Kickoff times shown in East Africa Time
          </span>
        }
      >
        {openEvents.length > 0 ? (
          <OpenMatchesList events={openEvents} />
        ) : (
          <EmptyState
            icon={Trophy}
            title="No open matches yet"
            description="Sporting events will appear here once they are scheduled. Check back soon to place your first bet."
          />
        )}
      </Panel>
    </PageContent>
  );
}
