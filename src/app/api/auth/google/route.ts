import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function mapGoogleAuthError(message: string): string {
  if (message.toLowerCase().includes("not enabled")) {
    return "Google sign-in is not enabled yet. Turn on the Google provider in Supabase (Authentication → Providers → Google) and add your OAuth client ID/secret.";
  }

  return message;
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return NextResponse.json(
      { error: mapGoogleAuthError(error.message) },
      { status: 400 }
    );
  }

  if (!data.url) {
    return NextResponse.json(
      { error: "Could not start Google sign-in." },
      { status: 400 }
    );
  }

  const probe = await fetch(data.url, { redirect: "manual" });
  if (probe.status >= 400) {
    const payload = (await probe.json().catch(() => null)) as {
      msg?: string;
    } | null;

    return NextResponse.json(
      {
        error: mapGoogleAuthError(
          payload?.msg ?? "Could not start Google sign-in."
        ),
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ url: data.url });
}
