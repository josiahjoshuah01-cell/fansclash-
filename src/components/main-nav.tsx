"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getVisibleNavItems, isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MainNav({ showAdmin = false }: { showAdmin?: boolean }) {
  const pathname = usePathname();
  const items = getVisibleNavItems(showAdmin);

  return (
    <nav
      className="hidden items-center gap-1 md:flex"
      aria-label="Main navigation"
    >
      {items.map((item) => {
        const active = isNavActive(item, pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
