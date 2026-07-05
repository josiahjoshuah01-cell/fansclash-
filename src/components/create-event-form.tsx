"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { eatLocalInputToIso } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

export function CreateEventForm() {
  const router = useRouter();
  const supabase = createClient();

  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!teamA.trim() || !teamB.trim() || !kickoff) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);

    const { data, error: rpcError } = await supabase.rpc("create_sporting_event", {
      p_team_a: teamA.trim(),
      p_team_b: teamB.trim(),
      p_kickoff_time: eatLocalInputToIso(kickoff),
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setSuccess(`Created ${data.team_a} vs ${data.team_b}.`);
    setTeamA("");
    setTeamB("");
    setKickoff("");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create sporting event</CardTitle>
        <CardDescription>
          Admin only. Kickoff time is interpreted as East Africa Time (EAT).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="team-a" className="text-sm font-medium">
                Team A
              </label>
              <Input
                id="team-a"
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                placeholder="Gor Mahia"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="team-b" className="text-sm font-medium">
                Team B
              </label>
              <Input
                id="team-b"
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                placeholder="AFC Leopards"
              />
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
      </CardContent>
    </Card>
  );
}
