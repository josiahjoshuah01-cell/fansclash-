import type { Metadata } from "next";

import { RosterTeamsPanel } from "@/components/teams/roster-teams-panel";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Admin · Approved teams — FansClash",
};

export default function AdminTeamsApprovedPage() {
  return (
    <>
      <PageHeader
        title="Approved teams"
        description="These clubs can be used when creating events, as long as they still have a scheduled fixture."
      />

      <RosterTeamsPanel
        filter="approved"
        emptyMessage="No approved teams yet. Search for clubs with upcoming matches and approve them."
        undoLabel="Move to rejected"
        undoAction="reject"
      />
    </>
  );
}
