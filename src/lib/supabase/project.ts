/** FansClash-only Supabase project. Do not point this app at other workspaces. */
export const FANSLASH_SUPABASE_PROJECT_REF = "hvogahprmyrneupsqttw";

export const FANSLASH_SUPABASE_URL = `https://${FANSLASH_SUPABASE_PROJECT_REF}.supabase.co`;

/** Blocked refs — other products; never migrate or deploy FansClash here via MCP/CLI. */
export const BLOCKED_SUPABASE_PROJECT_REFS = [
  "raneudpzisbqxfuxbmnu", // shared MCP default — Aruviah / Lunesa / Sealteam stack
] as const;

export function extractSupabaseProjectRef(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    const ref = hostname.split(".")[0];
    return ref || null;
  } catch {
    return null;
  }
}

export function assertFansClashSupabaseUrl(url: string | undefined): void {
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing. FansClash must use project hvogahprmyrneupsqttw."
    );
  }

  const ref = extractSupabaseProjectRef(url);

  if (ref === FANSLASH_SUPABASE_PROJECT_REF) {
    return;
  }

  if (ref && BLOCKED_SUPABASE_PROJECT_REFS.includes(ref as (typeof BLOCKED_SUPABASE_PROJECT_REFS)[number])) {
    throw new Error(
      `FansClash is configured for project ${FANSLASH_SUPABASE_PROJECT_REF}, not ${ref}. ` +
        "That Supabase project belongs to another product (Aruviah / Lunesa / Sealteam). " +
        "Update .env.local and reconnect the Supabase MCP to the FansClash project only."
    );
  }

  throw new Error(
    `Unexpected Supabase project "${ref ?? url}". FansClash must use ${FANSLASH_SUPABASE_URL}.`
  );
}
