const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";
const SCHEDULED_LOOKAHEAD_DAYS = 30;

export type FootballDataTeamRef = {
  id: number;
  name: string;
  crest?: string | null;
};

export type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  competition?: { code?: string; name?: string };
  homeTeam: FootballDataTeamRef;
  awayTeam: FootballDataTeamRef;
};

type FootballDataMatchesResponse = {
  matches?: FootballDataMatch[];
};

export type ScheduledTeamCandidate = {
  external_id: string;
  name: string;
  competition: string;
  logo_url: string | null;
  next_match: {
    utc_date: string;
    home_team: string;
    away_team: string;
    opponent: string;
  };
};

export class FootballDataError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string
  ) {
    super(message);
    this.name = "FootballDataError";
  }
}

function apiToken(): string {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) {
    throw new FootballDataError(
      "FOOTBALL_DATA_API_TOKEN is not configured",
      500
    );
  }
  return token;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isUpcomingMatch(status: string): boolean {
  return status === "SCHEDULED" || status === "TIMED";
}

async function footballDataFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${FOOTBALL_DATA_BASE}${path}`, {
    headers: { "X-Auth-Token": apiToken() },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new FootballDataError(
      "football-data.org request failed",
      response.status,
      detail
    );
  }

  return (await response.json()) as T;
}

export async function fetchUpcomingMatches(): Promise<FootballDataMatch[]> {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + SCHEDULED_LOOKAHEAD_DAYS);

  const payload = await footballDataFetch<FootballDataMatchesResponse>(
    `/matches?dateFrom=${formatDate(from)}&dateTo=${formatDate(to)}`
  );

  return (payload.matches ?? []).filter((match) => isUpcomingMatch(match.status));
}

export function buildScheduledTeamCandidates(
  matches: FootballDataMatch[],
  query?: string
): ScheduledTeamCandidate[] {
  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  const byExternalId = new Map<string, ScheduledTeamCandidate>();

  for (const match of matches) {
    for (const side of [
      { team: match.homeTeam, opponent: match.awayTeam.name },
      { team: match.awayTeam, opponent: match.homeTeam.name },
    ]) {
      const externalId = String(side.team.id);
      const competition = match.competition?.code ?? "—";
      const candidate: ScheduledTeamCandidate = {
        external_id: externalId,
        name: side.team.name,
        competition,
        logo_url: side.team.crest ?? null,
        next_match: {
          utc_date: match.utcDate,
          home_team: match.homeTeam.name,
          away_team: match.awayTeam.name,
          opponent: side.opponent,
        },
      };

      const existing = byExternalId.get(externalId);
      if (
        !existing ||
        new Date(candidate.next_match.utc_date) <
          new Date(existing.next_match.utc_date)
      ) {
        byExternalId.set(externalId, candidate);
      }
    }
  }

  let teams = Array.from(byExternalId.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (normalizedQuery) {
    teams = teams.filter((team) =>
      team.name.toLowerCase().includes(normalizedQuery)
    );
  }

  return teams;
}

export async function discoverScheduledTeams(
  query?: string
): Promise<ScheduledTeamCandidate[]> {
  const matches = await fetchUpcomingMatches();
  return buildScheduledTeamCandidates(matches, query);
}

export async function scheduledTeamExternalIds(): Promise<Set<string>> {
  const matches = await fetchUpcomingMatches();
  const ids = new Set<string>();

  for (const match of matches) {
    ids.add(String(match.homeTeam.id));
    ids.add(String(match.awayTeam.id));
  }

  return ids;
}
