import type { Metadata } from "next";

import { RosterTeamsPanel } from "@/components/teams/roster-teams-panel";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Admin · Rejected teams — FansClash",
};

export default function AdminTeamsRejectedPage() {
  return (
    <>
      <PageHeader
        title="Rejected teams"
        description="Hidden from event creation. Move teams back to approved when you change your mind."
      />

      <RosterTeamsPanel
        filter="rejected"
        emptyMessage="No rejected teams."
        undoLabel="Move to approved"
        undoAction="approve"
      />
    </>
  );
}
