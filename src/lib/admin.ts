/**
 * Hardcoded admin allowlist for MVP.
 * TODO: replace with a proper role system before production launch.
 */
export const ADMIN_PHONES = ["+254700000000", "254700000000"] as const;

export function isAdminPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const normalized = phone.replace(/\s/g, "");
  return ADMIN_PHONES.some(
    (adminPhone) => normalized === adminPhone || normalized === adminPhone.replace("+", "")
  );
}
