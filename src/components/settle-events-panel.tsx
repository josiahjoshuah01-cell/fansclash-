"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Panel } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { formatKickoffEat } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";
import { MatchCardSkeleton } from "@/components/ui/skeleton";

type AdminEvent = {
  id: string;
  kickoff_time: string;
  status: string;
  team_a: { name: string } | null;
  team_b: { name: string } | null;
};

export function SettleEventsPanel() {
  const router = useRouter();
  const supabase = createClient();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("sporting_events")
      .select(
        `
        id,
        kickoff_time,
        status,
        team_a:teams!sporting_events_team_a_id_fkey (name),
        team_b:teams!sporting_events_team_b_id_fkey (name)
      `
      )
      .in("status", ["locked"])
      .order("kickoff_time", { ascending: true })
      .then(({ data }) => {
        setEvents(
          (data ?? []).map((row) => ({
            ...row,
            team_a: Array.isArray(row.team_a) ? row.team_a[0] ?? null : row.team_a,
            team_b: Array.isArray(row.team_b) ? row.team_b[0] ?? null : row.team_b,
          })) as AdminEvent[]
        );
        setLoadingEvents(false);
      });
  }, [supabase]);

  const settle = async (
    eventId: string,
    result: "team_a" | "team_b" | "draw"
  ) => {
    setLoadingId(eventId);
    setMessage(null);
    setError(null);

    const { error: rpcError } = await supabase.rpc("settle_event", {
      p_event_id: eventId,
      p_result: result,
    });

    setLoadingId(null);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setMessage("Event settled successfully.");
    setEvents((current) => current.filter((event) => event.id !== eventId));
    router.refresh();
  };

  if (loadingEvents) {
    return (
      <Panel
        title="Settle events"
        description="Loading locked events…"
        contentClassName="p-5 sm:p-6"
      >
        <MatchCardSkeleton />
      </Panel>
    );
  }

  if (events.length === 0) {
    return (
      <Panel
        title="Settle events"
        description="No locked events waiting for a result. Events lock automatically at kickoff via the lock-event-at-kickoff job."
      />
    );
  }

  return (
    <Panel
      title="Settle events"
      description="Locked events only. Settlement is idempotent — already completed or voided events are rejected."
      contentClassName="space-y-4 p-5 sm:p-6"
    >
      {events.map((event) => {
        const teamA = event.team_a?.name ?? "Team A";
        const teamB = event.team_b?.name ?? "Team B";

        return (
          <div
            key={event.id}
            className="space-y-3 rounded-lg border border-border bg-muted/20 p-4"
          >
            <div>
              <p className="font-medium">
                {teamA} vs {teamB}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatKickoffEat(event.kickoff_time)} EAT · {event.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={loadingId === event.id}
                onClick={() => settle(event.id, "team_a")}
              >
                {teamA} wins
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={loadingId === event.id}
                onClick={() => settle(event.id, "team_b")}
              >
                {teamB} wins
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loadingId === event.id}
                onClick={() => settle(event.id, "draw")}
              >
                Draw (void)
              </Button>
            </div>
          </div>
        );
      })}

      {error ? (
        <p className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-sm text-warning">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
      ) : null}
    </Panel>
  );
}
