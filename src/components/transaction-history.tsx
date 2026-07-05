"use client";

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
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold">Transaction history</h2>
        </div>
        <div className="divide-y divide-border">
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
        <p className="font-medium">No transactions yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Deposits and bets will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-semibold">Transaction history</h2>
      </div>
      <ul className="divide-y divide-border">
        {transactions.map((tx) => {
          const credit = isCreditTransaction(tx.type);

          return (
            <li
              key={tx.id}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div className="min-w-0">
                <p className="font-medium">{getTransactionLabel(tx.type)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTransactionDate(tx.created_at)}
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
    </div>
  );
}
