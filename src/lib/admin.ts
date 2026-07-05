import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Hardcoded admin allowlist for MVP (legacy phone check).
 * Prefer public.users.is_admin — set via migration or Supabase dashboard.
 */
export const ADMIN_PHONES = ["+254700000000", "254700000000"] as const;

export function isAdminPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const normalized = phone.replace(/\s/g, "");
  return ADMIN_PHONES.some(
    (adminPhone) =>
      normalized === adminPhone || normalized === adminPhone.replace("+", "")
  );
}

export async function isAdminUser(
  supabase: SupabaseClient,
  userId: string,
  options?: { phone?: string | null; email?: string | null }
): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (data?.is_admin) {
    return true;
  }

  return isAdminPhone(options?.phone);
}
