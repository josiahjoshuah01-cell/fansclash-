import { Suspense } from "react";

import { AuthModeTabs } from "@/components/auth-mode-tabs";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--primary)/18,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-primary/10 blur-3xl dark:bg-primary/5"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-1/4 size-72 rounded-full bg-primary/10 blur-3xl dark:bg-primary/5"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-3 sm:px-6 sm:py-6">
        <Suspense fallback={<div className="h-9 w-40 rounded-lg border border-border bg-background/80" />}>
          <AuthModeTabs />
        </Suspense>
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] w-full items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
