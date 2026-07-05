"use client";

import { Receipt } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { Panel } from "@/components/layout/panel";
import {
  formatTransactionAmount,
  formatTransactionDate,
  getTransactionLabel,
  isCreditTransaction,
  type TransactionRow,
} from "@/lib/transactions";
import { formatKes } from "@/lib/events";
import { cn } from "@/lib/utils";
import { ListRowSkeleton } from "@/components/ui/skeleton";

export function TransactionHistory({
  transactions,
  loading,
}: {
  transactions: TransactionRow[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Panel
        title="Transaction history"
        compact
        contentClassName="divide-y divide-border p-0"
      >
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
      </Panel>
    );
  }

  if (transactions.length === 0) {
    return (
      <Panel title="Transaction history" compact>
        <EmptyState
          compact
          icon={Receipt}
          title="No transactions yet"
          description="Deposits and bets will appear here once you add funds or place a stake."
        />
      </Panel>
    );
  }

  return (
    <Panel
      title="Transaction history"
      description="Deposits, stakes, payouts, and refunds."
      compact
      contentClassName="divide-y divide-border p-0"
    >
      <ul>
        {transactions.map((tx) => {
          const credit = isCreditTransaction(tx.type);

          return (
            <li
              key={tx.id}
              className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
            >
              <div className="min-w-0">
                <p className="font-medium">{getTransactionLabel(tx.type)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTransactionDate(tx.created_at)}
                  {tx.type === "withdrawal" && tx.status === "pending"
                    ? " · Pending"
                    : tx.type === "withdrawal" && tx.status === "failed"
                      ? " · Failed"
                      : null}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "font-semibold tabular-nums",
                    credit ? "text-success" : "text-warning"
                  )}
                >
                  {formatTransactionAmount(tx.type, tx.amount)}
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  Balance {formatKes(Number(tx.balance_after))}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
