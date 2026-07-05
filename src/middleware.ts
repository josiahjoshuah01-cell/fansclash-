import { type NextRequest, NextResponse } from "next/server";

/** Scaffold mode — Supabase session handling will be wired in a later step. */
export function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
