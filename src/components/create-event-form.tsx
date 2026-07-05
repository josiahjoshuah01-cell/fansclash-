"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Panel } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { eatLocalInputToIso, type TeamRef } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

export function CreateEventForm({
  approvedTeams,
}: {
  approvedTeams: TeamRef[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!teamAId || !teamBId || !kickoff) {
      setError("All fields are required.");
      return;
    }

    if (teamAId === teamBId) {
      setError("Team A and Team B must be different.");
      return;
    }

    setLoading(true);

    const { error: rpcError } = await supabase.rpc("create_sporting_event", {
      p_team_a_id: teamAId,
      p_team_b_id: teamBId,
      p_kickoff_time: eatLocalInputToIso(kickoff),
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const teamA = approvedTeams.find((team) => team.id === teamAId);
    const teamB = approvedTeams.find((team) => team.id === teamBId);

    setSuccess(`Created ${teamA?.name ?? "Team A"} vs ${teamB?.name ?? "Team B"}.`);
    setTeamAId("");
    setTeamBId("");
    setKickoff("");
    router.refresh();
  };

  if (approvedTeams.length < 2) {
    return (
      <Panel
        title="Create sporting event"
        description="Approve at least two teams with upcoming fixtures on the Manage teams page."
      >
        <p className="text-sm text-muted-foreground">
          No eligible teams yet. Search football-data.org for clubs with scheduled
          matches, then approve the ones you want to offer for betting.
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Create sporting event"
      description="Admin only. Kickoff time is interpreted as East Africa Time (EAT)."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="team-a" className="text-sm font-medium">
              Team A
            </label>
            <select
              id="team-a"
              value={teamAId}
              onChange={(e) => setTeamAId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select team…</option>
              {approvedTeams.map((team) => (
                <option key={team.id} value={team.id} disabled={team.id === teamBId}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="team-b" className="text-sm font-medium">
              Team B
            </label>
            <select
              id="team-b"
              value={teamBId}
              onChange={(e) => setTeamBId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select team…</option>
              {approvedTeams.map((team) => (
                <option key={team.id} value={team.id} disabled={team.id === teamAId}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="kickoff" className="text-sm font-medium">
            Kickoff (EAT)
          </label>
          <Input
            id="kickoff"
            type="datetime-local"
            value={kickoff}
            onChange={(e) => setKickoff(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create event"}
        </Button>

        {error ? (
          <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            {success}
          </p>
        ) : null}
      </form>
    </Panel>
  );
}
