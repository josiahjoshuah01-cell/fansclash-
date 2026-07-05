"use client";

import { Check, Loader2, Search, X } from "lucide-react";
import { useState } from "react";

import { Panel } from "@/components/layout/panel";
import {
  DecisionBadge,
  MatchLabel,
  TeamLogo,
} from "@/components/teams/team-admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  hasTeamDecision,
  postTeamReview,
  type DiscoverableTeam,
  type ReviewAction,
} from "@/lib/teams-admin";

export function SearchTeamsPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DiscoverableTeam[]>([]);
  const [searching, setSearching] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setSearching(true);
    setError(null);
    setSearchMessage(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query.trim());
      }

      const response = await fetch(`/api/admin/teams/discover?${params}`);
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        detail?: string;
        teams?: DiscoverableTeam[];
        count?: number;
      } | null;

      if (!response.ok) {
        const parts = [data?.error ?? "Search failed"];
        if (data?.detail) {
          parts.push(data.detail);
        }
        setError(parts.join(" — "));
        setResults([]);
        return;
      }

      setResults(data?.teams ?? []);
      setSearchMessage(
        `${data?.count ?? 0} team${data?.count === 1 ? "" : "s"} with upcoming fixtures in the next 30 days.`
      );
    } catch (searchError) {
      setError(
        searchError instanceof Error ? searchError.message : "Search failed"
      );
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const reviewTeam = async (team: DiscoverableTeam, action: ReviewAction) => {
    const snapshot = [...results];
    const payload = {
      external_id: team.external_id,
      name: team.name,
      competition: team.competition,
      logo_url: team.logo_url,
    };

    setReviewingId(team.external_id);
    setError(null);
    setResults((current) =>
      current.map((row) =>
        row.external_id === team.external_id
          ? {
              ...row,
              approved: action === "approve",
              rejected: action === "reject",
            }
          : row
      )
    );

    try {
      const saved = await postTeamReview(payload, action);
      if (saved) {
        setResults((current) =>
          current.map((row) =>
            row.external_id === saved.external_id
              ? {
                  ...row,
                  db_id: saved.id,
                  approved: saved.approved,
                  rejected: saved.rejected ?? !saved.approved,
                }
              : row
          )
        );
      }
    } catch (reviewError) {
      setResults(snapshot);
      setError(
        reviewError instanceof Error ? reviewError.message : "Could not update team"
      );
    } finally {
      setReviewingId(null);
    }
  };

  const renderSearchActions = (team: DiscoverableTeam) => {
    const busy = reviewingId === team.external_id;

    if (hasTeamDecision(team)) {
      return (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <DecisionBadge approved={team.approved} />
          <button
            type="button"
            disabled={busy}
            onClick={() => reviewTeam(team, team.approved ? "reject" : "approve")}
            className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
          >
            {busy ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Updating…
              </span>
            ) : team.approved ? (
              "Reject instead"
            ) : (
              "Approve instead"
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => reviewTeam(team, "approve")}
          className="inline-flex items-center gap-1.5 rounded-md border border-success/40 bg-success/5 px-3 py-1.5 text-sm font-medium text-success transition-colors hover:bg-success/10 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => reviewTeam(team, "reject")}
          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" aria-hidden />
          )}
          Reject
        </button>
      </div>
    );
  };

  return (
    <Panel
      title="Search teams"
      description="Browse clubs from football-data.org that have an upcoming fixture in the next 30 days. Only scheduled teams appear here."
    >
      <form onSubmit={runSearch} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name, e.g. Arsenal, Real Madrid…"
          className="sm:flex-1"
        />
        <Button type="submit" disabled={searching}>
          {searching ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Searching…
            </>
          ) : (
            <>
              <Search className="size-4" />
              Search
            </>
          )}
        </Button>
      </form>

      {searchMessage ? (
        <p className="mt-3 text-sm text-muted-foreground">{searchMessage}</p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-sm text-warning">
          {error}
        </p>
      ) : null}

      {hasSearched && !searching ? (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {results.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">
              No scheduled teams match your search. Try another name or clear the
              filter to see all upcoming clubs.
            </li>
          ) : (
            results.map((team) => (
              <li
                key={team.external_id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <TeamLogo name={team.name} logoUrl={team.logo_url} />
                  <div className="min-w-0">
                    <p className="font-medium">{team.name}</p>
                    <MatchLabel team={team} />
                  </div>
                </div>
                {renderSearchActions(team)}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </Panel>
  );
}
