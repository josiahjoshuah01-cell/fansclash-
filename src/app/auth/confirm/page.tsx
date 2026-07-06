"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { completeAuthRedirect } from "@/lib/auth/complete-auth-redirect";
import { createClient } from "@/lib/supabase/client";

function AuthConfirmContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    void completeAuthRedirect(supabase, {
      next: searchParams.get("next"),
    }).then(({ destination, error: redirectError }) => {
      if (redirectError) {
        setError(redirectError);
        return;
      }

      window.location.assign(destination);
    });
  }, [searchParams]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-warning">{error}</p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">Confirming your link…</p>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        }
      >
        <AuthConfirmContent />
      </Suspense>
    </div>
  );
}
