import Image from "next/image";

import { formatKickoffEat } from "@/lib/events";
import type { DiscoverableTeam } from "@/lib/teams-admin";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export function TeamLogo({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={32}
        height={32}
        className={cn(
          "size-8 rounded-md border border-border bg-background object-contain",
          className
        )}
        unoptimized
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-md border border-border bg-muted text-xs font-semibold text-muted-foreground",
        className
      )}
      aria-hidden
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function MatchLabel({ team }: { team: DiscoverableTeam }) {
  const fixture = `${team.next_match.home_team} vs ${team.next_match.away_team}`;

  return (
    <p className="text-xs text-muted-foreground">
      {team.competition} · {fixture} · {formatKickoffEat(team.next_match.utc_date)}
    </p>
  );
}

export function DecisionBadge({ approved }: { approved: boolean }) {
  if (approved) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-success/35 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        <Check className="size-3" aria-hidden />
        Approved
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-destructive/35 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
      <X className="size-3" aria-hidden />
      Rejected
    </span>
  );
}
