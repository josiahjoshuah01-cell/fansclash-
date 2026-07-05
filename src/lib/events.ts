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

export type TeamRef = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type Team = TeamRef & {
  external_id: string;
  competition: string;
  approved: boolean;
  rejected?: boolean;
  created_at: string;
};

export type SportingEvent = {
  id: string;
  team_a_id: string;
  team_b_id: string;
  team_a: TeamRef;
  team_b: TeamRef;
  kickoff_time: string;
  status: string;
};

export function normalizeTeamRef(
  value: TeamRef | TeamRef[] | null | undefined
): TeamRef | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function normalizeSportingEvent(raw: unknown): SportingEvent {
  const row = raw as Omit<SportingEvent, "team_a" | "team_b"> & {
    team_a: TeamRef | TeamRef[] | null;
    team_b: TeamRef | TeamRef[] | null;
  };

  const teamA = normalizeTeamRef(row.team_a);
  const teamB = normalizeTeamRef(row.team_b);

  return {
    ...row,
    team_a: teamA ?? { id: row.team_a_id, name: "Team A", logo_url: null },
    team_b: teamB ?? { id: row.team_b_id, name: "Team B", logo_url: null },
  };
}

export const SPORTING_EVENT_SELECT = `
  id,
  team_a_id,
  team_b_id,
  kickoff_time,
  status,
  team_a:teams!sporting_events_team_a_id_fkey (id, name, logo_url),
  team_b:teams!sporting_events_team_b_id_fkey (id, name, logo_url)
`;

export function teamAName(event: SportingEvent): string {
  return event.team_a?.name ?? "Team A";
}

export function teamBName(event: SportingEvent): string {
  return event.team_b?.name ?? "Team B";
}

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
