import type { Metadata } from "next";

import { MyBetsList } from "@/components/my-bets-list";
import { PageContent } from "@/components/layout/page-content";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";

export const metadata: Metadata = {
  title: "My Bets — FansClash",
  description: "Track open matching, locked stakes, and settled outcomes.",
};

export default function BetsPage() {
  return (
    <PageContent>
      <PageHeader
        title="My bets"
        description="Track open matching, locked stakes, and settled outcomes."
      />

      <Panel
        title="Your activity"
        description="Bets grouped by lifecycle — open, locked, and settled."
        contentClassName="p-5 sm:p-6"
      >
        <MyBetsList />
      </Panel>
    </PageContent>
  );
}
