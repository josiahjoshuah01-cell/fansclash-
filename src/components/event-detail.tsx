"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { BackLink } from "@/components/layout/back-link";
import { PageContent } from "@/components/layout/page-content";
import { Panel } from "@/components/layout/panel";
import { PlaceBetForm } from "@/components/place-bet-form";
import { PoolSplitBar } from "@/components/pool-split-bar";
import { UserBetSplit, type UserBet } from "@/components/user-bet-split";
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

export function EventDetail({
  event,
  initialBalance,
}: {
  event: SportingEvent;
  initialBalance: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [balance, setBalance] = useState(initialBalance);
  const [pool, setPool] = useState<PoolTotals>({ teamA: 0, teamB: 0 });
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [loadingPool, setLoadingPool] = useState(true);
  const [loadingBets, setLoadingBets] = useState(true);

  const loadPool = useCallback(async () => {
    const { data } = await supabase
      .from("bets")
      .select("side, stake_amount")
      .eq("event_id", event.id);

    setPool(
      sumPools(
        (data ?? []) as { side: "team_a" | "team_b"; stake_amount: number }[]
      )
    );
    setLoadingPool(false);
  }, [event.id, supabase]);

  const loadUserBets = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("bets")
      .select(
        "id, side, stake_amount, matched_amount, unmatched_amount, status"
      )
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .in("status", ["open", "partially_matched", "fully_matched"])
      .order("created_at", { ascending: false });

    setUserBets((data ?? []) as UserBet[]);
    setLoadingBets(false);
  }, [event.id, supabase]);

  const refreshAll = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await Promise.all([loadPool(), loadUserBets()]);

    if (!user) return;

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (wallet) setBalance(Number(wallet.balance));
  }, [loadPool, loadUserBets, supabase]);

  useEffect(() => {
    refreshAll();

    const channel = supabase
      .channel(`event-bets-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bets",
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          refreshAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, refreshAll, supabase]);

  const isOpen = event.status === "scheduled";
  const totalPool = pool.teamA + pool.teamB;

  return (
    <PageContent className="mx-auto max-w-2xl space-y-3">
      <BackLink
        href="/matches"
        label="Back to matches"
        className="text-xs max-md:mb-0"
      />

      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {teamAName(event)} vs {teamBName(event)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Kickoff {formatKickoffEat(event.kickoff_time)} EAT
        </p>
      </div>

      <Panel compact contentClassName="space-y-4 p-4 sm:px-5 sm:py-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Market pool</p>
            <p className="text-xs text-muted-foreground">
              Total{" "}
              <span className="font-medium tabular-nums text-foreground">
                {formatKes(totalPool)}
              </span>
            </p>
          </div>

          {loadingPool ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ) : (
            <PoolSplitBar
              compact
              teamAName={teamAName(event)}
              teamBName={teamBName(event)}
              teamA={pool.teamA}
              teamB={pool.teamB}
            />
          )}
        </div>

        {loadingBets ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : userBets.length > 0 ? (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground">Your bets</p>
            {userBets.map((bet) => (
              <UserBetSplit
                key={bet.id}
                bet={bet}
                teamAName={teamAName(event)}
                teamBName={teamBName(event)}
              />
            ))}
          </div>
        ) : null}

        {isOpen ? (
          <div className="border-t border-border pt-4">
            <PlaceBetForm
              embedded
              event={event}
              balance={balance}
              onBetPlaced={refreshAll}
            />
          </div>
        ) : (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">
            This event is no longer open for betting.
          </p>
        )}
      </Panel>
    </PageContent>
  );
}
