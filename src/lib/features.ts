/**
 * M-Pesa B2C withdrawals — disabled by default.
 * Do not set NEXT_PUBLIC_WITHDRAWALS_ENABLED=true in production until KYC/ID
 * verification is confirmed with legal counsel and GRA licensing is in place.
 */
export function isWithdrawalsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WITHDRAWALS_ENABLED === "true";
}
