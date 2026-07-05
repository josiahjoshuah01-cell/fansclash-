export type MarketingLink = {
  href: string;
  label: string;
};

export const marketingFooterLinks: MarketingLink[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/responsible-play", label: "Responsible play" },
];

export const publicMarketingPaths = new Set([
  "/",
  "/about",
  "/how-it-works",
  "/terms",
  "/privacy",
  "/responsible-play",
  "/contact",
]);

export function isPublicMarketingPath(pathname: string) {
  return publicMarketingPaths.has(pathname);
}
