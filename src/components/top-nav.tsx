import { Ticket, User, Wallet } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          FansClash
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/bets"
            className="hidden items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            <Ticket className="size-4" />
            <span>My bets</span>
          </Link>

          <Link
            href="/wallet"
            className="hidden items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            <Wallet className="size-4" />
            <span>Wallet</span>
          </Link>

          <ThemeToggle />

          <Button variant="ghost" size="icon" aria-label="Profile" asChild>
            <Link href="/profile">
              <User className="size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
