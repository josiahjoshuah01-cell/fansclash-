"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
    <div className="flex flex-col gap-2 md:gap-3">
      {events.map((event) => {
        const pool = pools[event.id] ?? { teamA: 0, teamB: 0 };
        const totalPool = pool.teamA + pool.teamB;
        const loading = loadingPools && !(event.id in pools);

        return (
          <Link key={event.id} href={`/events/${event.id}`} className="group block w-full">
            <Card className="w-full overflow-hidden border-border/70 px-3.5 py-3 transition-colors duration-200 active:bg-muted/30 max-md:rounded-lg max-md:shadow-none sm:px-4 md:px-[18px] md:py-3 md:hover:border-primary/50 md:hover:shadow-md">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                  <Skeleton className="h-[5px] w-full rounded-full" />
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground sm:text-[15px]">
                      <span className="break-words">{teamAName(event)}</span>
                      <span className="font-normal text-muted-foreground"> vs </span>
                      <span className="break-words">{teamBName(event)}</span>
                    </p>

                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[11px] text-muted-foreground sm:text-xs">
                        {formatKickoffEat(event.kickoff_time)} EAT
                      </p>
                      <p className="shrink-0 text-[11px] font-semibold tabular-nums text-foreground sm:text-xs">
                        {formatKes(totalPool)}
                      </p>
                    </div>

                    <div className="mt-2.5">
                      <PoolSplitBar
                        compact
                        teamAName={teamAName(event)}
                        teamBName={teamBName(event)}
                        teamA={pool.teamA}
                        teamB={pool.teamB}
                      />
                    </div>
                  </div>

                  <ChevronRight
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground/70 transition-transform group-active:translate-x-0.5 md:hidden"
                    aria-hidden
                  />
                </div>
              )}
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
