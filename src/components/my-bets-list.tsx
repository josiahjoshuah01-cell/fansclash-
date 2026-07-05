"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/layout/empty-state";
import { UserBetSplit, type UserBet } from "@/components/user-bet-split";
import { MatchCardSkeleton } from "@/components/ui/skeleton";
import { formatKickoffEat, formatKes } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type BetWithEvent = UserBet & {
  event_id: string;
  payout_amount: number | null;
  created_at: string;
  sporting_events: {
    kickoff_time: string;
    status: string;
    team_a: { name: string } | null;
    team_b: { name: string } | null;
  } | null;
};

const OPEN_STATUSES = ["open", "partially_matched", "fully_matched"];
const LOCKED_STATUSES = ["locked"];
const SETTLED_STATUSES = ["settled", "voided"];

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function BetSummaryCard({ bet }: { bet: BetWithEvent }) {
  const event = bet.sporting_events;
  if (!event) return null;

  const teamA = event.team_a?.name ?? "Team A";
  const teamB = event.team_b?.name ?? "Team B";
  const sideName = bet.side === "team_a" ? teamA : teamB;
  const showSplit = OPEN_STATUSES.includes(bet.status);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/events/${bet.event_id}`}
            className="font-semibold hover:text-primary"
          >
            {teamA} vs {teamB}
          </Link>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {sideName} · {formatKickoffEat(event.kickoff_time)} EAT
          </p>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
          <p className="text-sm font-semibold tabular-nums">
            {formatKes(Number(bet.stake_amount))}
          </p>
          <span className="inline-flex rounded-md border border-border bg-card px-2 py-0.5 text-xs capitalize text-muted-foreground">
            {statusLabel(bet.status)}
          </span>
        </div>
      </div>

      <div className="px-4 py-3">
        {showSplit ? (
          <UserBetSplit bet={bet} teamAName={teamA} teamBName={teamB} />
        ) : (
          <div className="space-y-1 text-sm text-muted-foreground">
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
            {bet.status === "settled" &&
            Number(bet.matched_amount) > 0 &&
            !bet.payout_amount ? (
              <p className="font-medium text-warning">Lost</p>
            ) : null}
            {bet.status === "voided" ? <p>Voided (draw)</p> : null}
          </div>
        )}
      </div>
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
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {bets.length === 0 ? (
        <p
          className={cn(
            "rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground"
          )}
        >
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
        sporting_events (
          kickoff_time,
          status,
          team_a:teams!sporting_events_team_a_id_fkey (name),
          team_b:teams!sporting_events_team_b_id_fkey (name)
        )
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
      <EmptyState
        icon={Receipt}
        title="No bets yet"
        description="Browse open matches and place your first stake before kickoff."
        action={
          <Link
            href="/matches"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View open matches
          </Link>
        }
      />
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
