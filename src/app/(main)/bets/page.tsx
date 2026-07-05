import type { Metadata } from "next";

import { MyBetsList } from "@/components/my-bets-list";
import { PageContent } from "@/components/layout/page-content";

export const metadata: Metadata = {
  title: "My Bets — FansClash",
  description: "Track open matching, locked stakes, and settled outcomes.",
};

export default function BetsPage() {
  return (
    <PageContent className="mx-auto max-w-2xl space-y-3">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">My bets</h1>
        <p className="text-sm text-muted-foreground">
          Track open matching, locked stakes, and settled outcomes.
        </p>
      </div>

      <MyBetsList />
    </PageContent>
  );
}
