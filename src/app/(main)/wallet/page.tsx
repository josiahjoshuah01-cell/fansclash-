"use client";

import { useCallback, useEffect, useState } from "react";

import { AddFundsCard } from "@/components/add-funds-card";
import { TransactionHistory } from "@/components/transaction-history";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { TransactionRow } from "@/lib/transactions";

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function WalletPage() {
  const supabase = createClient();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);

  const loadWallet = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const [walletResult, transactionsResult] = await Promise.all([
      supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("transactions")
        .select("id, type, amount, balance_after, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setBalance(Number(walletResult.data?.balance ?? 0));
    setTransactions((transactionsResult.data ?? []) as TransactionRow[]);
    setLoadingBalance(false);
    setLoadingTransactions(false);
  }, [supabase]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const handleDepositComplete = () => {
    setShowDeposit(false);
    loadWallet();
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wallet</h1>
        <p className="mt-1 text-muted-foreground">
          Top up with M-Pesa and track your betting balance.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Available balance</p>
        {loadingBalance ? (
          <Skeleton className="mt-2 h-10 w-48" />
        ) : (
          <p className="mt-2 text-4xl font-bold tabular-nums">
            {formatKes(Number(balance ?? 0))}
          </p>
        )}
        <Button
          className="mt-6 w-full sm:w-auto"
          onClick={() => setShowDeposit((open) => !open)}
        >
          {showDeposit ? "Hide deposit form" : "Add funds"}
        </Button>
      </div>

      {showDeposit ? (
        <AddFundsCard onDepositComplete={handleDepositComplete} />
      ) : null}

      <TransactionHistory
        transactions={transactions}
        loading={loadingTransactions}
      />
    </div>
  );
}
