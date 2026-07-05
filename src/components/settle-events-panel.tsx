"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatKickoffEat } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";
import { MatchCardSkeleton } from "@/components/ui/skeleton";

type AdminEvent = {
  id: string;
  team_a: string;
  team_b: string;
  kickoff_time: string;
  status: string;
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
      .select("id, team_a, team_b, kickoff_time, status")
      .in("status", ["locked"])
      .order("kickoff_time", { ascending: true })
      .then(({ data }) => {
        setEvents((data ?? []) as AdminEvent[]);
        setLoadingEvents(false);
      });
  }, [supabase]);

  if (loadingEvents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settle events</CardTitle>
          <CardDescription>Loading locked events…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <MatchCardSkeleton />
        </CardContent>
      </Card>
    );
  }

  const settle = async (eventId: string, result: "team_a" | "team_b" | "draw") => {
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

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settle events</CardTitle>
          <CardDescription>
            No locked events waiting for a result. Events lock automatically at
            kickoff via the lock-event-at-kickoff job.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settle events</CardTitle>
        <CardDescription>
          Locked events only. Settlement is idempotent — already completed or
          voided events are rejected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border border-border p-4 space-y-3"
          >
            <div>
              <p className="font-medium">
                {event.team_a} vs {event.team_b}
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
                {event.team_a} wins
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={loadingId === event.id}
                onClick={() => settle(event.id, "team_b")}
              >
                {event.team_b} wins
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
        ))}

        {error ? (
          <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
