const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";
export const PREMIER_LEAGUE_CODE = "PL";

type FootballDataTeam = {
  id: number;
  name: string;
  crest?: string | null;
};

type FootballDataTeamsResponse = {
  teams?: FootballDataTeam[];
};

export type TeamUpsertPayload = {
  external_id: string;
  name: string;
  competition: string;
  logo_url: string | null;
};

export async function fetchPremierLeagueTeams(apiToken: string) {
  const apiResponse = await fetch(
    `${FOOTBALL_DATA_BASE}/competitions/${PREMIER_LEAGUE_CODE}/teams`,
    {
      headers: {
        "X-Auth-Token": apiToken,
      },
      cache: "no-store",
    }
  );

  if (!apiResponse.ok) {
    const detail = await apiResponse.text();
    throw new SyncTeamsError(
      "football-data.org request failed",
      apiResponse.status,
      detail
    );
  }

  const payload = (await apiResponse.json()) as FootballDataTeamsResponse;
  const teams = payload.teams ?? [];

  return teams.map(
    (team): TeamUpsertPayload => ({
      external_id: String(team.id),
      name: team.name,
      competition: PREMIER_LEAGUE_CODE,
      logo_url: team.crest ?? null,
    })
  );
}

export class SyncTeamsError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string
  ) {
    super(message);
    this.name = "SyncTeamsError";
  }
}
