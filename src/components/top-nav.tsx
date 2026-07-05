import Link from "next/link";

import { AuthHeaderActions } from "@/components/auth-header-actions";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAccountMenu } from "@/components/user-account-menu";
import { WalletBadge } from "@/components/wallet-badge";
import { getAdminAccess } from "@/lib/admin-server";

function LogoMark() {
  return (
    <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary text-xs font-bold text-primary-foreground shadow-sm">
      FC
    </span>
  );
}

export async function TopNav() {
  const { isAdmin, user } = await getAdminAccess();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/matches"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <LogoMark />
            <span className="truncate text-lg font-bold tracking-tight">
              FansClash
            </span>
          </Link>
          <MainNav showAdmin={isAdmin} />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <WalletBadge className="hidden sm:inline-flex" />
              <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />
            </>
          ) : null}
          <ThemeToggle />
          {user ? (
            <UserAccountMenu email={user.email ?? null} />
          ) : (
            <AuthHeaderActions />
          )}
        </div>
      </div>
    </header>
  );
}
