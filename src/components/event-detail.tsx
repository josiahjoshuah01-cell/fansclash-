"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PlaceBetForm } from "@/components/place-bet-form";
import { PoolSplitBar } from "@/components/pool-split-bar";
import { UserBetSplit, type UserBet } from "@/components/user-bet-split";
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

    setPool(sumPools((data ?? []) as { side: "team_a" | "team_b"; stake_amount: number }[]));
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {event.team_a}{" "}
          <span className="text-muted-foreground">vs</span> {event.team_b}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Kickoff {formatKickoffEat(event.kickoff_time)} EAT
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Market pool</CardTitle>
        </CardHeader>
        <CardContent>
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
              teamAName={event.team_a}
              teamBName={event.team_b}
              teamA={pool.teamA}
              teamB={pool.teamB}
            />
          )}
        </CardContent>
      </Card>

      {loadingBets ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : userBets.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your bets</h2>
          {userBets.map((bet) => (
            <UserBetSplit
              key={bet.id}
              bet={bet}
              teamAName={event.team_a}
              teamBName={event.team_b}
            />
          ))}
        </div>
      ) : null}

      {isOpen ? (
        <PlaceBetForm
          event={event}
          balance={balance}
          onBetPlaced={refreshAll}
        />
      ) : (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          This event is no longer open for betting.
        </p>
      )}
    </div>
  );
}
