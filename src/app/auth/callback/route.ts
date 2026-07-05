import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }

  return next;
}

async function redirectAfterAuth(
  supabase: ReturnType<typeof createClient>,
  origin: string,
  next: string | null
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const destination =
    safeNextPath(next) ?? (wallet ? "/matches" : "/onboarding");

  return NextResponse.redirect(`${origin}${destination}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");
  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const response = await redirectAfterAuth(supabase, origin, next);
      if (response) {
        return response;
      }
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      const response = await redirectAfterAuth(supabase, origin, next);
      if (response) {
        return response;
      }
    }
  }

  return NextResponse.redirect(
    `${origin}/sign-in?error=auth_callback_failed`
  );
}
