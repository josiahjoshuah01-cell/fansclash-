import Link from "next/link";

import { LandingFooter } from "@/components/landing/landing-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-primary text-[11px] font-bold tracking-tight text-primary-foreground lg:size-10 lg:rounded-xl lg:text-xs",
        className
      )}
    >
      FC
    </span>
  );
}

export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-shell relative flex min-h-dvh flex-col overflow-x-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--primary)/8,transparent)]"
      />

      <header className="relative z-10 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-[3.75rem] max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-[5rem] lg:px-10">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-80 lg:gap-3"
          >
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-tight lg:text-lg">
              FansClash
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground lg:h-10 lg:px-4 lg:text-[15px]"
              asChild
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              size="sm"
              className="hidden rounded-full px-4 sm:inline-flex lg:h-10 lg:px-6 lg:text-[15px]"
              asChild
            >
              <Link href="/sign-in?mode=sign_up">Get started</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative flex-1">{children}</main>

      <LandingFooter />
    </div>
  );
}
