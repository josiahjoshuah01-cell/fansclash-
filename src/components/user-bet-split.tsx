import { cn } from "@/lib/utils";
import { formatKes } from "@/lib/events";

export type UserBet = {
  id: string;
  side: "team_a" | "team_b";
  stake_amount: number;
  matched_amount: number;
  unmatched_amount: number;
  status: string;
};

export function UserBetSplit({
  bet,
  teamAName,
  teamBName,
}: {
  bet: UserBet;
  teamAName: string;
  teamBName: string;
}) {
  const stake = Number(bet.stake_amount);
  const matched = Number(bet.matched_amount);
  const unmatched = Number(bet.unmatched_amount);
  const matchedPercent = stake > 0 ? (matched / stake) * 100 : 0;
  const unmatchedPercent = stake > 0 ? (unmatched / stake) * 100 : 0;
  const sideLabel = bet.side === "team_a" ? teamAName : teamBName;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Your bet on{" "}
          <span className="text-primary">{sideLabel}</span>
        </p>
        <p className="text-sm tabular-nums text-muted-foreground">
          {formatKes(stake)} staked
        </p>
      </div>

      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {matched > 0 ? (
          <div
            className="bg-success transition-all duration-500"
            style={{ width: `${matchedPercent}%` }}
          />
        ) : null}
        {unmatched > 0 ? (
          <div
            className="bg-warning transition-all duration-500"
            style={{ width: `${unmatchedPercent}%` }}
          />
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-md bg-success/10 px-3 py-2">
          <p className="text-xs font-medium text-success">Locked until full time</p>
          <p className="text-sm font-semibold tabular-nums text-success">
            {formatKes(matched)}
          </p>
        </div>
        <div className="rounded-md bg-warning/10 px-3 py-2">
          <p className="text-xs font-medium text-warning">
            Refunded if not matched by kickoff
          </p>
          <p className="text-sm font-semibold tabular-nums text-warning">
            {formatKes(unmatched)}
          </p>
        </div>
      </div>

      <p className={cn("text-xs capitalize text-muted-foreground")}>
        Status: {bet.status.replace(/_/g, " ")}
      </p>
    </div>
  );
}
