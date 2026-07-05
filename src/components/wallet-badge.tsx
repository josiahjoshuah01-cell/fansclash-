"use client";

import { Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function WalletBadge({ className }: { className?: string }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      setBalance(Number(data?.balance ?? 0));
      setLoading(false);
    });
  }, []);

  return (
    <Link
      href="/wallet"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium tabular-nums shadow-sm transition-colors hover:bg-muted/60",
        className
      )}
      aria-label="Wallet balance"
    >
      <Wallet className="size-4 text-primary" strokeWidth={1.75} />
      {loading ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <span>{formatKes(balance ?? 0)}</span>
      )}
    </Link>
  );
}
