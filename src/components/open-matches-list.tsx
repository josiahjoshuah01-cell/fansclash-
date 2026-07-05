"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PoolSplitBar } from "@/components/pool-split-bar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatKickoffEat,
  sumPools,
  type PoolTotals,
  type SportingEvent,
} from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

type BetRow = {
  event_id: string;
  side: "team_a" | "team_b";
  stake_amount: number;
};

export function OpenMatchesList({ events }: { events: SportingEvent[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [pools, setPools] = useState<Record<string, PoolTotals>>({});
  const [loadingPools, setLoadingPools] = useState(true);

  const loadPools = useCallback(
    async (eventIds: string[], options?: { silent?: boolean }) => {
      if (eventIds.length === 0) {
        setPools({});
        setLoadingPools(false);
        return;
      }

      if (!options?.silent) {
        setLoadingPools(true);
      }

      const { data, error } = await supabase
        .from("bets")
        .select("event_id, side, stake_amount")
        .in("event_id", eventIds);

      if (error) {
        console.error("Failed to load pool totals", error);
        setLoadingPools(false);
        return;
      }

      const next: Record<string, PoolTotals> = {};
      for (const eventId of eventIds) {
        next[eventId] = sumPools(
          (data ?? []).filter((bet) => bet.event_id === eventId) as BetRow[]
        );
      }
      setPools(next);
      setLoadingPools(false);
    },
    [supabase]
  );

  useEffect(() => {
    const eventIds = events.map((event) => event.id);
    loadPools(eventIds);

    const channels = eventIds.map((eventId) =>
      supabase
        .channel(`bets-pool-${eventId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bets",
            filter: `event_id=eq.${eventId}`,
          },
          () => {
            loadPools([eventId], { silent: true });
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [events, loadPools, supabase]);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4">
      {events.map((event) => {
        const pool = pools[event.id] ?? { teamA: 0, teamB: 0 };

        return (
          <Link key={event.id} href={`/events/${event.id}`} className="block">
            <Card className="transition-colors hover:border-primary/40">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <CardTitle className="text-lg">
                    {event.team_a}{" "}
                    <span className="text-muted-foreground">vs</span>{" "}
                    {event.team_b}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatKickoffEat(event.kickoff_time)} EAT
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPools && !(event.id in pools) ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ) : (
                  <PoolSplitBar
                    teamAName={event.team_a}
                    teamBName={event.team_b}
                    teamA={pool.teamA}
                    teamB={pool.teamB}
                  />
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
