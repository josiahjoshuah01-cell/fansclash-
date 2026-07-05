"use client";

import { useCallback, useEffect, useState } from "react";

import { Panel } from "@/components/layout/panel";
import { TeamLogo } from "@/components/teams/team-admin-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  postTeamReview,
  sortTeamsByName,
  TEAMS_ROSTER_CHANGED_EVENT,
  type ReviewAction,
  type TeamRow,
} from "@/lib/teams-admin";

type RosterTeamsPanelProps = {
  emptyMessage: string;
  undoLabel: string;
  undoAction: ReviewAction;
  filter: "approved" | "rejected";
};

export function RosterTeamsPanel({
  emptyMessage,
  undoLabel,
  undoAction,
  filter,
}: RosterTeamsPanelProps) {
  const supabase = createClient();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("teams")
      .select(
        "id, external_id, name, competition, logo_url, approved, rejected, created_at"
      )
      .neq("competition", "Legacy")
      .eq(filter === "approved" ? "approved" : "rejected", true)
      .order("name");

    if (loadError) {
      setError(loadError.message);
    } else {
      setTeams((data ?? []) as TeamRow[]);
    }

    setLoading(false);
  }, [filter, supabase]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    const handleChange = () => {
      loadTeams();
    };

    window.addEventListener(TEAMS_ROSTER_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(TEAMS_ROSTER_CHANGED_EVENT, handleChange);
  }, [loadTeams]);

  const reviewTeam = async (team: TeamRow, action: ReviewAction) => {
    const snapshot = [...teams];
    const payload = {
      external_id: team.external_id,
      name: team.name,
      competition: team.competition,
      logo_url: team.logo_url,
    };

    setReviewingId(team.external_id);
    setError(null);
    setTeams((current) =>
      current.filter((row) => row.external_id !== team.external_id)
    );

    try {
      await postTeamReview(payload, action);
    } catch (reviewError) {
      setTeams(sortTeamsByName(snapshot));
      setError(
        reviewError instanceof Error ? reviewError.message : "Could not update team"
      );
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <Panel contentClassName="divide-y divide-border p-0">
      {error ? (
        <p className="border-b border-border p-5 text-sm text-warning sm:p-6">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-3 p-5 sm:p-6">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : teams.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground sm:p-6">{emptyMessage}</p>
      ) : (
        <ul>
          {teams.map((team) => {
            const busy = reviewingId === team.external_id;

            return (
              <li
                key={team.id}
                className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <TeamLogo name={team.name} logoUrl={team.logo_url} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.competition} · {team.external_id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => reviewTeam(team, undoAction)}
                  className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  {busy ? "Updating…" : undoLabel}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
