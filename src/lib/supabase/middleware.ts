import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAdminUser } from "@/lib/admin";
import { isPublicMarketingPath } from "@/lib/marketing";
import { assertFansClashSupabaseUrl } from "@/lib/supabase/project";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  assertFansClashSupabaseUrl(url);

  const supabase = createServerClient(
    url!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isSignIn = pathname.startsWith("/sign-in");
  const isForgotPassword = pathname.startsWith("/forgot-password");
  const isResetPassword = pathname.startsWith("/reset-password");
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isAuthConfirm = pathname.startsWith("/auth/confirm");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicRoute =
    isSignIn ||
    isForgotPassword ||
    isAuthCallback ||
    isAuthConfirm ||
    isPublicMarketingPath(pathname);

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const hasCompletedOnboarding = Boolean(wallet);

    if (!hasCompletedOnboarding && !isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (
      hasCompletedOnboarding &&
      (isSignIn || isOnboarding || isForgotPassword) &&
      !isResetPassword
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/matches";
      return NextResponse.redirect(url);
    }

    if (isAdminRoute) {
      const admin = await isAdminUser(supabase, user.id, {
        phone: user.phone,
        email: user.email,
      });
      if (!admin) {
        const url = request.nextUrl.clone();
        url.pathname = "/matches";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
