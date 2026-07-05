"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { BackLink } from "@/components/layout/back-link";
import { PageContent } from "@/components/layout/page-content";
import { PageHeader } from "@/components/layout/page-header";
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
    <PageContent>
      <BackLink href="/matches" label="Back to matches" />

      <PageHeader
        title={`${teamAName(event)} vs ${teamBName(event)}`}
        description={`Kickoff ${formatKickoffEat(event.kickoff_time)} EAT`}
      />

      <Panel
        title="Market pool"
        description="Live fan stakes on each side before kickoff."
        footer={
          <span>
            Total pool{" "}
            <span className="font-medium tabular-nums text-foreground">
              {formatKes(totalPool)}
            </span>
          </span>
        }
      >
        {loadingPool ? (
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
            teamAName={teamAName(event)}
            teamBName={teamBName(event)}
            teamA={pool.teamA}
            teamB={pool.teamB}
          />
        )}
      </Panel>

      {loadingBets ? (
        <Panel title="Your bets" contentClassName="p-5 sm:p-6">
          <Skeleton className="h-24 w-full rounded-lg" />
        </Panel>
      ) : userBets.length > 0 ? (
        <Panel
          title="Your bets"
          description="Open stakes still matching before kickoff."
          contentClassName="space-y-3 p-5 sm:p-6"
        >
          {userBets.map((bet) => (
            <div
              key={bet.id}
              className="rounded-lg border border-border bg-muted/20 p-4"
            >
              <UserBetSplit
                bet={bet}
                teamAName={teamAName(event)}
                teamBName={teamBName(event)}
              />
            </div>
          ))}
        </Panel>
      ) : null}

      {isOpen ? (
        <PlaceBetForm
          event={event}
          balance={balance}
          onBetPlaced={refreshAll}
        />
      ) : (
        <Panel contentClassName="p-5 sm:p-6">
          <p className="text-sm text-muted-foreground">
            This event is no longer open for betting.
          </p>
        </Panel>
      )}
    </PageContent>
  );
}
