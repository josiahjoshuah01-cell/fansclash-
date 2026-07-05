import type { Team } from "@/lib/events";

export const TEAMS_ROSTER_CHANGED_EVENT = "teams-roster-changed";

export type DiscoverableTeam = {
  external_id: string;
  name: string;
  competition: string;
  logo_url: string | null;
  db_id: string | null;
  approved: boolean;
  rejected: boolean;
  next_match: {
    utc_date: string;
    home_team: string;
    away_team: string;
    opponent: string;
  };
};

export type TeamRow = Team & { rejected: boolean };

export type ReviewAction = "approve" | "reject";

export type ReviewPayload = {
  external_id: string;
  name: string;
  competition: string;
  logo_url: string | null;
};

export function notifyTeamsRosterChanged() {
  window.dispatchEvent(new CustomEvent(TEAMS_ROSTER_CHANGED_EVENT));
}

export function sortTeamsByName<T extends { name: string }>(teams: T[]) {
  return [...teams].sort((a, b) => a.name.localeCompare(b.name));
}

export function hasTeamDecision(team: { approved: boolean; rejected: boolean }) {
  return team.approved || team.rejected;
}

export function toTeamRow(
  payload: ReviewPayload,
  action: ReviewAction,
  existing?: Partial<TeamRow>
): TeamRow {
  return {
    id: existing?.id ?? payload.external_id,
    external_id: payload.external_id,
    name: payload.name,
    competition: payload.competition,
    logo_url: payload.logo_url,
    approved: action === "approve",
    rejected: action === "reject",
    created_at: existing?.created_at ?? new Date().toISOString(),
  };
}

export async function postTeamReview(payload: ReviewPayload, action: ReviewAction) {
  const response = await fetch("/api/admin/teams/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, action }),
  });

  const data = (await response.json().catch(() => null)) as {
    error?: string;
    team?: TeamRow;
  } | null;

  if (!response.ok) {
    throw new Error(data?.error ?? "Could not update team");
  }

  notifyTeamsRosterChanged();
  return data?.team ?? null;
}
