"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { UserBetSplit, type UserBet } from "@/components/user-bet-split";
import { MatchCardSkeleton } from "@/components/ui/skeleton";
import { formatKickoffEat, formatKes } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

type BetWithEvent = UserBet & {
  event_id: string;
  payout_amount: number | null;
  created_at: string;
  sporting_events: {
    team_a: string;
    team_b: string;
    kickoff_time: string;
    status: string;
  } | null;
};

const OPEN_STATUSES = ["open", "partially_matched", "fully_matched"];
const LOCKED_STATUSES = ["locked"];
const SETTLED_STATUSES = ["settled", "voided"];

function BetSummaryCard({ bet }: { bet: BetWithEvent }) {
  const event = bet.sporting_events;
  if (!event) return null;

  const sideName = bet.side === "team_a" ? event.team_a : event.team_b;
  const showSplit = OPEN_STATUSES.includes(bet.status);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/events/${bet.event_id}`}
            className="font-medium hover:text-primary"
          >
            {event.team_a} vs {event.team_b}
          </Link>
          <p className="text-sm text-muted-foreground">
            {sideName} · {formatKickoffEat(event.kickoff_time)} EAT
          </p>
        </div>
        <p className="text-sm tabular-nums">{formatKes(Number(bet.stake_amount))}</p>
      </div>

      {showSplit ? (
        <UserBetSplit bet={bet} teamAName={event.team_a} teamBName={event.team_b} />
      ) : (
        <div className="text-sm text-muted-foreground space-y-1">
          {bet.status === "locked" ? (
            <p>
              Locked stake:{" "}
              <span className="font-medium text-foreground">
                {formatKes(Number(bet.matched_amount))}
              </span>
            </p>
          ) : null}
          {bet.payout_amount != null && Number(bet.payout_amount) > 0 ? (
            <p>
              Payout:{" "}
              <span className="font-medium text-success">
                {formatKes(Number(bet.payout_amount))}
              </span>
            </p>
          ) : null}
          {bet.status === "settled" && Number(bet.matched_amount) > 0 && !bet.payout_amount ? (
            <p className="text-warning">Lost</p>
          ) : null}
          {bet.status === "voided" ? <p>Voided (draw)</p> : null}
          <p className="capitalize">{bet.status.replace(/_/g, " ")}</p>
        </div>
      )}
    </div>
  );
}

function BetGroup({
  title,
  description,
  bets,
  emptyMessage,
}: {
  title: string;
  description: string;
  bets: BetWithEvent[];
  emptyMessage: string;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {bets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3">
          {bets.map((bet) => (
            <BetSummaryCard key={bet.id} bet={bet} />
          ))}
        </div>
      )}
    </section>
  );
}

export function MyBetsList() {
  const supabase = createClient();
  const [bets, setBets] = useState<BetWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBets = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("bets")
      .select(
        `
        id,
        side,
        stake_amount,
        matched_amount,
        unmatched_amount,
        status,
        payout_amount,
        created_at,
        event_id,
        sporting_events (team_a, team_b, kickoff_time, status)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setBets((data ?? []) as unknown as BetWithEvent[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadBets();
  }, [loadBets]);

  if (loading) {
    return (
      <div className="space-y-3">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
      </div>
    );
  }

  const openBets = bets.filter((b) => OPEN_STATUSES.includes(b.status));
  const lockedBets = bets.filter((b) => LOCKED_STATUSES.includes(b.status));
  const settledBets = bets.filter((b) => SETTLED_STATUSES.includes(b.status));

  const hasAny = bets.length > 0;

  if (!hasAny) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
        <p className="font-medium">No bets yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse open matches and place your first bet.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          View open matches
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BetGroup
        title="Open"
        description="Matching still in progress before kickoff."
        bets={openBets}
        emptyMessage="No open bets."
      />
      <BetGroup
        title="Locked"
        description="Waiting for full time — matched stake is active."
        bets={lockedBets}
        emptyMessage="No locked bets."
      />
      <BetGroup
        title="Settled"
        description="Completed outcomes — win, loss, or void."
        bets={settledBets}
        emptyMessage="No settled bets yet."
      />
    </div>
  );
}
