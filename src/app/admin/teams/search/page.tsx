import type { Metadata } from "next";

import { SearchTeamsPanel } from "@/components/teams/search-teams-panel";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Admin · Search teams — FansClash",
};

export default function AdminTeamsSearchPage() {
  return (
    <>
      <PageHeader
        title="Search teams"
        description="Find clubs with upcoming fixtures on football-data.org, then approve or reject them for betting."
      />

      <SearchTeamsPanel />
    </>
  );
}
