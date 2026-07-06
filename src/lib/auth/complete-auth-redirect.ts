import type { SupabaseClient } from "@supabase/supabase-js";

function readHashParams(): URLSearchParams | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;

  return new URLSearchParams(hash.slice(1));
}

function stripHashFromUrl() {
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}

export async function completeAuthRedirect(
  supabase: SupabaseClient,
  options?: { next?: string | null }
): Promise<{ destination: string; error?: string }> {
  const searchParams = new URLSearchParams(window.location.search);
  const next = options?.next ?? searchParams.get("next");
  const hashParams = readHashParams();
  const code = searchParams.get("code");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return { destination: "/sign-in", error: error.message };
    }
  } else {
    const accessToken = hashParams?.get("access_token");
    const refreshToken = hashParams?.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return { destination: "/sign-in", error: "Invalid or expired link." };
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return { destination: "/sign-in", error: error.message };
    }
  }

  stripHashFromUrl();

  const hashType = hashParams?.get("type");
  if (hashType === "recovery" || next === "/reset-password") {
    return { destination: "/reset-password" };
  }

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return { destination: next };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { destination: "/sign-in" };
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return { destination: wallet ? "/matches" : "/onboarding" };
}

export function hasAuthRedirectTokens(): boolean {
  if (typeof window === "undefined") return false;

  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("code")) return true;

  const hashParams = readHashParams();
  return Boolean(hashParams?.get("access_token"));
}
