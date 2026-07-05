"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/layout/empty-state";
import { UserBetSplit, type UserBet } from "@/components/user-bet-split";
import { MatchCardSkeleton } from "@/components/ui/skeleton";
import { formatKickoffEat, formatKes } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

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
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/30 px-3.5 py-2.5 sm:px-4 sm:py-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/events/${bet.event_id}`}
            className="text-sm font-semibold hover:text-primary sm:text-base"
          >
            {teamA} vs {teamB}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {sideName} · {formatKickoffEat(event.kickoff_time)} EAT
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">
            {formatKes(Number(bet.stake_amount))}
          </p>
          <span className="mt-0.5 inline-flex rounded-md border border-border bg-card px-2 py-0.5 text-[10px] capitalize text-muted-foreground sm:text-xs">
            {statusLabel(bet.status)}
          </span>
        </div>
      </div>

      <div className="px-3.5 py-2.5 sm:px-4 sm:py-3">
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
}: {
  title: string;
  description: string;
  bets: BetWithEvent[];
}) {
  if (bets.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="pb-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2">
        {bets.map((bet) => (
          <BetSummaryCard key={bet.id} bet={bet} />
        ))}
      </div>
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
        compact
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
    <div className="space-y-4">
      <BetGroup
        title="Open"
        description="Matching still in progress before kickoff."
        bets={openBets}
      />
      <BetGroup
        title="Locked"
        description="Waiting for full time — matched stake is active."
        bets={lockedBets}
      />
      <BetGroup
        title="Settled"
        description="Completed outcomes — win, loss, or void."
        bets={settledBets}
      />
    </div>
  );
}
