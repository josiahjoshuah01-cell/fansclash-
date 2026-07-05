"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { TEAMS_ROSTER_CHANGED_EVENT } from "@/lib/teams-admin";
import { cn } from "@/lib/utils";

type SidebarItem = {
  href: string;
  label: string;
  exact?: boolean;
  disabled?: boolean;
  soon?: boolean;
};

type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

type TeamNavCounts = {
  approved: number;
  rejected: number;
};

const teamsSubItems = [
  { href: "/admin/teams/search", label: "Search teams" },
  {
    href: "/admin/teams/approved",
    label: "Approved",
    countKey: "approved" as const,
  },
  {
    href: "/admin/teams/rejected",
    label: "Rejected",
    countKey: "rejected" as const,
  },
];

const adminSections: SidebarSection[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Overview", exact: true },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/payments", label: "Payments" },
    ],
  },
  {
    label: "Content",
    items: [{ href: "/admin/events", label: "Events" }],
  },
  {
    label: "Oversight",
    items: [
      { href: "/admin/compliance", label: "Compliance", disabled: true, soon: true },
      { href: "/admin/analytics", label: "Analytics", disabled: true, soon: true },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/admins", label: "Admins", disabled: true, soon: true },
      { href: "/admin/settings", label: "Settings", disabled: true, soon: true },
    ],
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
      {count}
    </span>
  );
}

export function AdminSidebar({
  initialTeamCounts,
}: {
  initialTeamCounts: TeamNavCounts;
}) {
  const pathname = usePathname();
  const teamsActive = pathname.startsWith("/admin/teams");
  const [teamsExpanded, setTeamsExpanded] = useState(teamsActive);
  const [teamCounts, setTeamCounts] = useState(initialTeamCounts);

  useEffect(() => {
    if (teamsActive) {
      setTeamsExpanded(true);
    }
  }, [teamsActive]);

  const refreshTeamCounts = useCallback(async () => {
    const supabase = createClient();
    const [{ count: approved }, { count: rejected }] = await Promise.all([
      supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .eq("approved", true)
        .neq("competition", "Legacy"),
      supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .eq("rejected", true)
        .neq("competition", "Legacy"),
    ]);

    setTeamCounts({
      approved: approved ?? 0,
      rejected: rejected ?? 0,
    });
  }, []);

  useEffect(() => {
    const handleChange = () => {
      refreshTeamCounts();
    };

    window.addEventListener(TEAMS_ROSTER_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(TEAMS_ROSTER_CHANGED_EVENT, handleChange);
  }, [refreshTeamCounts]);

  const renderItem = (item: SidebarItem) => {
    const active = !item.disabled && isActive(pathname, item.href, item.exact);

    if (item.disabled) {
      return (
        <li key={item.label}>
          <span
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground/60"
            aria-disabled="true"
          >
            <span>{item.label}</span>
            {item.soon ? (
              <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Soon
              </span>
            ) : null}
          </span>
        </li>
      );
    }

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            "block rounded-lg px-2 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          aria-current={active ? "page" : undefined}
        >
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <aside className="hidden w-[220px] shrink-0 border-r border-border bg-card/40 md:block">
      <nav className="sticky top-14 flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-y-auto px-3 py-6">
        {adminSections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.label === "Content" ? (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => setTeamsExpanded((open) => !open)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium transition-colors",
                        teamsActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      aria-expanded={teamsExpanded}
                    >
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 transition-transform",
                          teamsExpanded ? "rotate-0" : "-rotate-90"
                        )}
                        aria-hidden
                      />
                      <span>Teams</span>
                    </button>
                  </li>
                  {teamsExpanded
                    ? teamsSubItems.map((item) => {
                        const active = isActive(pathname, item.href);
                        const count = item.countKey
                          ? teamCounts[item.countKey]
                          : null;

                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-2 rounded-lg py-2 pl-8 pr-2 text-sm transition-colors",
                                active
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                              aria-current={active ? "page" : undefined}
                            >
                              <span>{item.label}</span>
                              {count !== null ? <CountBadge count={count} /> : null}
                            </Link>
                          </li>
                        );
                      })
                    : null}
                  {section.items.map(renderItem)}
                </>
              ) : (
                section.items.map(renderItem)
              )}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
