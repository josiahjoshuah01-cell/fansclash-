"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export function AuthModeTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSignUp = searchParams.get("mode") === "sign_up";
  const onSignIn = pathname === "/sign-in" && !isSignUp;
  const onSignUp = pathname === "/sign-in" && isSignUp;

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background/80 p-1 shadow-sm backdrop-blur-sm">
      <Link
        href="/sign-in"
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          onSignIn
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-current={onSignIn ? "page" : undefined}
      >
        Sign in
      </Link>
      <Link
        href="/sign-in?mode=sign_up"
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          onSignUp
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-current={onSignUp ? "page" : undefined}
      >
        Sign up
      </Link>
    </div>
  );
}
