"use client";

import { useCallback, useEffect, useState } from "react";

import { AddFundsCard } from "@/components/add-funds-card";
import { WithdrawFundsCard } from "@/components/withdraw-funds-card";
import { isWithdrawalsEnabled } from "@/lib/features";
import { PageContent } from "@/components/layout/page-content";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
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
  const [showWithdraw, setShowWithdraw] = useState(false);
  const withdrawalsEnabled = isWithdrawalsEnabled();

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
        .select("id, type, amount, balance_after, status, created_at")
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

  const handleWithdrawComplete = () => {
    setShowWithdraw(false);
    loadWallet();
  };

  return (
    <PageContent className="space-y-4">
      <PageHeader
        compact
        title="Wallet"
        description="Top up with M-Pesa and track your betting balance."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] md:items-start">
        <div className="flex flex-col gap-4">
          <Panel
            compact
            title="Available balance"
            description="Funds are held in KES until matched or settled."
          >
            {loadingBalance ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <p className="text-[28px] font-bold leading-none tabular-nums tracking-tight">
                {formatKes(Number(balance ?? 0))}
              </p>
            )}
            <Button
              className="mt-4 w-full"
              onClick={() => setShowDeposit((open) => !open)}
            >
              {showDeposit ? "Hide deposit form" : "Add funds"}
            </Button>

            <Button
              className="mt-2 w-full"
              variant="outline"
              disabled={!withdrawalsEnabled}
              onClick={() => {
                if (!withdrawalsEnabled) return;
                setShowWithdraw((open) => !open);
              }}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span>
                  {withdrawalsEnabled && showWithdraw
                    ? "Hide withdrawal form"
                    : "Withdraw funds"}
                </span>
                {!withdrawalsEnabled ? (
                  <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Coming soon
                  </span>
                ) : null}
              </span>
            </Button>
          </Panel>

          {showDeposit ? (
            <AddFundsCard onDepositComplete={handleDepositComplete} />
          ) : null}

          {withdrawalsEnabled && showWithdraw ? (
            <WithdrawFundsCard onWithdrawComplete={handleWithdrawComplete} />
          ) : null}
        </div>

        <TransactionHistory
          transactions={transactions}
          loading={loadingTransactions}
        />
      </div>
    </PageContent>
  );
}
