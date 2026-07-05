import { formatKes } from "@/lib/events";

export type TransactionRow = {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  created_at: string;
};

const TRANSACTION_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  stake_lock: "Bet placed",
  unmatched_refund: "Unmatched refund",
  payout: "Payout",
  fee: "Platform fee",
  ctr_flag: "Compliance flag",
};

export function getTransactionLabel(type: string): string {
  return TRANSACTION_LABELS[type] ?? type.replace(/_/g, " ");
}

export function isCreditTransaction(type: string): boolean {
  return ["deposit", "payout", "unmatched_refund"].includes(type);
}

export function formatTransactionAmount(type: string, amount: number): string {
  const value = Number(amount);
  if (isCreditTransaction(type)) {
    return `+${formatKes(value)}`;
  }
  return `−${formatKes(value)}`;
}

export function formatTransactionDate(iso: string): string {
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}
