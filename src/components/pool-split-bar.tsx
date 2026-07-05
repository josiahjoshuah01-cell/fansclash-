import { cn } from "@/lib/utils";
import { formatKes } from "@/lib/events";

export function PoolSplitBar({
  teamAName,
  teamBName,
  teamA,
  teamB,
}: {
  teamAName: string;
  teamBName: string;
  teamA: number;
  teamB: number;
}) {
  const total = teamA + teamB;
  const teamAPercent = total > 0 ? (teamA / total) * 100 : 50;
  const teamBPercent = total > 0 ? (teamB / total) * 100 : 50;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span className="truncate text-primary">{teamAName}</span>
        <span className="truncate text-muted-foreground">{teamBName}</span>
      </div>

      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("bg-primary transition-all duration-500")}
          style={{ width: `${teamAPercent}%` }}
        />
        <div
          className={cn("bg-secondary transition-all duration-500")}
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
