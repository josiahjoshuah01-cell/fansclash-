import type { Metadata } from "next";

import { Panel } from "@/components/layout/panel";
import { PageHeader } from "@/components/layout/page-header";
import { formatVerifiedMsisdn } from "@/lib/phone-display";
import { requireAdmin } from "@/lib/admin-server";

export const metadata: Metadata = {
  title: "Admin · Users — FansClash",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, phone_number, kyc_status, is_admin, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <PageHeader
        title="Users"
        description="Registered accounts and verification status."
      />

      <Panel
        title="All users"
        description="Most recent sign-ups first."
        contentClassName="divide-y divide-border p-0"
      >
        {error ? (
          <p className="p-5 text-sm text-warning sm:p-6">{error.message}</p>
        ) : !users?.length ? (
          <p className="p-5 text-sm text-muted-foreground sm:p-6">
            No users found.
          </p>
        ) : (
          <ul>
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div>
                  <p className="font-medium">
                    {formatVerifiedMsisdn(user.phone_number)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(user.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md border border-border bg-muted/50 px-2 py-1 font-medium uppercase tracking-wide text-muted-foreground">
                    KYC · {user.kyc_status}
                  </span>
                  {user.is_admin ? (
                    <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-1 font-medium text-primary">
                      Admin
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
