import {
  Receipt,
  Shield,
  Trophy,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type MainNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  adminOnly?: boolean;
};

export const mainNavItems: MainNavItem[] = [
  {
    href: "/matches",
    label: "Matches",
    icon: Trophy,
    match: (pathname) =>
      pathname === "/matches" || pathname.startsWith("/events/"),
  },
  {
    href: "/bets",
    label: "My Bets",
    icon: Receipt,
    match: (pathname) => pathname === "/bets" || pathname.startsWith("/bets/"),
  },
  {
    href: "/wallet",
    label: "Wallet",
    icon: Wallet,
    match: (pathname) =>
      pathname === "/wallet" || pathname.startsWith("/wallet/"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    match: (pathname) =>
      pathname === "/profile" || pathname.startsWith("/profile/"),
  },
];

export const adminNavItem: MainNavItem = {
  href: "/admin",
  label: "Admin",
  icon: Shield,
  match: (pathname) => pathname.startsWith("/admin"),
  adminOnly: true,
};

export function getVisibleNavItems(showAdmin: boolean) {
  return showAdmin ? [...mainNavItems, adminNavItem] : mainNavItems;
}

export function isNavActive(item: MainNavItem, pathname: string) {
  return item.match(pathname);
}
