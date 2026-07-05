"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PoolSplitBar } from "@/components/pool-split-bar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatKickoffEat,
  formatKes,
  sumPools,
  teamAName,
  teamBName,
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
    <div className="flex flex-col gap-3">
      {events.map((event) => {
        const pool = pools[event.id] ?? { teamA: 0, teamB: 0 };
        const totalPool = pool.teamA + pool.teamB;
        const loading = loadingPools && !(event.id in pools);

        return (
          <Link key={event.id} href={`/events/${event.id}`} className="group block">
            <Card className="overflow-hidden px-[18px] py-3 transition-all duration-200 hover:border-primary/50 hover:shadow-md">
              {loading ? (
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <div className="space-y-1">
                      <div className="flex justify-between gap-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-[5px] w-full rounded-full" />
                    </div>
                  </div>
                  <div className="shrink-0 space-y-1 text-right">
                    <Skeleton className="ml-auto h-3 w-14" />
                    <Skeleton className="ml-auto h-4 w-16" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 leading-snug">
                      <span className="text-[15px] font-normal text-foreground">
                        {teamAName(event)}
                      </span>
                      <span className="text-xs text-muted-foreground">vs</span>
                      <span className="text-[15px] font-normal text-foreground">
                        {teamBName(event)}
                      </span>
                      <span className="text-xs text-muted-foreground" aria-hidden>
                        ·
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatKickoffEat(event.kickoff_time)} EAT
                      </span>
                    </div>

                    <PoolSplitBar
                      compact
                      teamAName={teamAName(event)}
                      teamBName={teamBName(event)}
                      teamA={pool.teamA}
                      teamB={pool.teamB}
                    />
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Total pool
                    </p>
                    <p className="text-sm font-bold tabular-nums leading-tight text-foreground">
                      {formatKes(totalPool)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      View →
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
