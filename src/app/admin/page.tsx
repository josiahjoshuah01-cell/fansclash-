import {
  CalendarPlus,
  CreditCard,
  Lock,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { StatTile } from "@/components/layout/stat-tile";
import { formatKes } from "@/lib/events";
import { requireAdmin } from "@/lib/admin-server";

export const metadata: Metadata = {
  title: "Admin · Overview — FansClash",
  description: "FansClash admin overview for managing matches and settlements.",
};

type DashboardStats = {
  scheduled_events: number;
  locked_events: number;
  total_pool_value: number;
  registered_users: number;
};

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();

  const { data: statsData, error } = await supabase.rpc("admin_dashboard_stats");
  const stats = (statsData ?? {
    scheduled_events: 0,
    locked_events: 0,
    total_pool_value: 0,
    registered_users: 0,
  }) as DashboardStats;

  if (error) {
    console.error("admin_dashboard_stats", error.message);
  }

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        description="Manage sporting events, monitor pools, and settle locked matches."
      >
        <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Admin · full control
        </span>
      </PageHeader>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        <StatTile
          label="Scheduled events"
          value={String(stats.scheduled_events ?? 0)}
          hint="Accepting bets"
          icon={Trophy}
        />
        <StatTile
          label="Locked events"
          value={String(stats.locked_events ?? 0)}
          hint="Awaiting results"
          icon={Lock}
        />
        <StatTile
          label="Total pool value"
          value={formatKes(Number(stats.total_pool_value ?? 0))}
          hint="Matched stakes (scheduled + locked)"
          icon={Wallet}
        />
        <StatTile
          label="Registered users"
          value={String(stats.registered_users ?? 0)}
          hint="All accounts"
          icon={Users}
        />
      </div>

      <Panel
        title="Quick actions"
        description="Jump straight into the tools you need."
        contentClassName="p-5 sm:p-6"
      >
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
        >
          <Link
            href="/admin/events"
            className="group rounded-xl border border-border bg-muted/20 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-background">
              <CalendarPlus className="size-5 text-primary" />
            </div>
            <h3 className="font-semibold tracking-tight">Manage events</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create fixtures and settle locked matches after full time.
            </p>
          </Link>

          <Link
            href="/admin/teams/search"
            className="group rounded-xl border border-border bg-muted/20 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-background">
              <Trophy className="size-5 text-primary" />
            </div>
            <h3 className="font-semibold tracking-tight">Manage teams</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Search scheduled clubs and approve teams for event creation.
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="group rounded-xl border border-border bg-muted/20 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-background">
              <Users className="size-5 text-primary" />
            </div>
            <h3 className="font-semibold tracking-tight">Users</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Review registered accounts and KYC status.
            </p>
          </Link>

          <Link
            href="/admin/payments"
            className="group rounded-xl border border-border bg-muted/20 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-background">
              <CreditCard className="size-5 text-primary" />
            </div>
            <h3 className="font-semibold tracking-tight">Payments</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor deposits, payouts, and wallet ledger activity.
            </p>
          </Link>
        </div>
      </Panel>
    </>
  );
}
