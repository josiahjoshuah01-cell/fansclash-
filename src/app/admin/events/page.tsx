import type { Metadata } from "next";

import { CreateEventForm } from "@/components/create-event-form";
import { PageHeader } from "@/components/layout/page-header";
import { SettleEventsPanel } from "@/components/settle-events-panel";
import { requireAdmin } from "@/lib/admin-server";
import { scheduledTeamExternalIds } from "@/lib/football-data";

export const metadata: Metadata = {
  title: "Admin · Events — FansClash",
};

export default async function AdminEventsPage() {
  const { supabase } = await requireAdmin();

  let scheduledIds: string[] = [];
  let scheduleWarning: string | null = null;

  try {
    scheduledIds = Array.from(await scheduledTeamExternalIds());
  } catch {
    scheduleWarning =
      "Could not load upcoming fixtures from football-data.org. Event team lists may be empty until the API is reachable.";
  }

  const { data: allApproved } = await supabase
    .from("teams")
    .select("id, name, logo_url, external_id")
    .eq("approved", true)
    .eq("rejected", false)
    .order("name");

  const scheduledSet = new Set(scheduledIds);
  const approvedTeams = (allApproved ?? []).filter((team) =>
    scheduledSet.has(team.external_id)
  );

  return (
    <>
      <PageHeader
        title="Event management"
        description="Create scheduled matches for the open pool and settle locked fixtures."
      />

      {scheduleWarning ? (
        <p className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-sm text-warning">
          {scheduleWarning}
        </p>
      ) : null}

      <CreateEventForm approvedTeams={approvedTeams ?? []} />
      <SettleEventsPanel />
    </>
  );
}
