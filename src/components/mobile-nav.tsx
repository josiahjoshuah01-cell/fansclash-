"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getVisibleNavItems, isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileNav({ showAdmin = false }: { showAdmin?: boolean }) {
  const pathname = usePathname();
  const items = getVisibleNavItems(showAdmin);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:hidden"
      aria-label="Mobile navigation"
    >
      <div
        className={cn(
          "mx-auto grid max-w-lg",
          items.length === 5 ? "grid-cols-5" : "grid-cols-4"
        )}
      >
        {items.map((item) => {
          const active = isNavActive(item, pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1.5 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl border transition-colors sm:size-9",
                  active
                    ? "border-primary/20 bg-primary/10"
                    : "border-transparent bg-transparent"
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
