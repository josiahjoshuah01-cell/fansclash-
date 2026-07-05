import type { Metadata } from "next";

import { Panel } from "@/components/layout/panel";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/admin-server";
import {
  formatTransactionAmount,
  formatTransactionDate,
  getTransactionLabel,
} from "@/lib/transactions";

export const metadata: Metadata = {
  title: "Admin · Payments — FansClash",
};

export default async function AdminPaymentsPage() {
  const { supabase } = await requireAdmin();

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("id, user_id, type, amount, balance_after, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <PageHeader
        title="Payments"
        description="Recent wallet ledger activity across all users."
      />

      <Panel
        title="Transaction ledger"
        description="Deposits, stakes, refunds, and payouts."
        contentClassName="divide-y divide-border p-0"
      >
        {error ? (
          <p className="p-5 text-sm text-warning sm:p-6">{error.message}</p>
        ) : !transactions?.length ? (
          <p className="p-5 text-sm text-muted-foreground sm:p-6">
            No transactions yet.
          </p>
        ) : (
          <ul>
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div>
                  <p className="font-medium">{getTransactionLabel(tx.type)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTransactionDate(tx.created_at)} · User{" "}
                    {tx.user_id.slice(0, 8)}…
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold tabular-nums">
                    {formatTransactionAmount(tx.type, Number(tx.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Balance {Number(tx.balance_after).toLocaleString("en-KE")} KES
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
