const EAT_TIMEZONE = "Africa/Nairobi";

export function formatKickoffEat(isoString: string): string {
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: EAT_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(isoString));
}

export function formatKes(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Parse datetime-local value as East Africa Time (+03:00). */
export function eatLocalInputToIso(localValue: string): string {
  return new Date(`${localValue}:00+03:00`).toISOString();
}

export type SportingEvent = {
  id: string;
  team_a: string;
  team_b: string;
  kickoff_time: string;
  status: string;
};

export type PoolTotals = {
  teamA: number;
  teamB: number;
};

export function sumPools(
  bets: { side: "team_a" | "team_b"; stake_amount: number }[]
): PoolTotals {
  return bets.reduce(
    (acc, bet) => {
      const amount = Number(bet.stake_amount);
      if (bet.side === "team_a") acc.teamA += amount;
      if (bet.side === "team_b") acc.teamB += amount;
      return acc;
    },
    { teamA: 0, teamB: 0 }
  );
}
