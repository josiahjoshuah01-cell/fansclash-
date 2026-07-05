import { cn } from "@/lib/utils";
import { formatKes } from "@/lib/events";

export function PoolSplitBar({
  teamAName,
  teamBName,
  teamA,
  teamB,
  compact = false,
}: {
  teamAName: string;
  teamBName: string;
  teamA: number;
  teamB: number;
  compact?: boolean;
}) {
  const total = teamA + teamB;
  const teamAPercent = total > 0 ? (teamA / total) * 100 : 50;
  const teamBPercent = total > 0 ? (teamB / total) * 100 : 50;

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between gap-3 text-xs leading-tight text-muted-foreground">
          <span className="min-w-0 truncate">
            <span className="text-foreground">{teamAName}</span>
            <span aria-hidden> · </span>
            <span className="tabular-nums">{formatKes(teamA)}</span>
          </span>
          <span className="min-w-0 truncate text-right">
            <span className="text-foreground">{teamBName}</span>
            <span aria-hidden> · </span>
            <span className="tabular-nums">{formatKes(teamB)}</span>
          </span>
        </div>

        <div className="flex h-[5px] overflow-hidden rounded-full bg-muted/80">
          <div
            className={cn("bg-primary transition-all duration-500")}
            style={{ width: `${teamAPercent}%` }}
          />
          <div
            className={cn("bg-muted-foreground/25 transition-all duration-500")}
            style={{ width: `${teamBPercent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span className="truncate text-primary">{teamAName}</span>
        <span className="truncate text-muted-foreground">{teamBName}</span>
      </div>

      <div className="flex h-3 overflow-hidden rounded-full border border-border bg-muted/80">
        <div
          className={cn("bg-primary transition-all duration-500")}
          style={{ width: `${teamAPercent}%` }}
        />
        <div
          className={cn("bg-muted-foreground/25 transition-all duration-500")}
          style={{ width: `${teamBPercent}%` }}
        />
      </div>

      <div className="flex justify-between text-sm tabular-nums">
        <span className="text-primary">{formatKes(teamA)}</span>
        <span className="text-muted-foreground">{formatKes(teamB)}</span>
      </div>
    </div>
  );
}
