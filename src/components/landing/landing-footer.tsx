import Link from "next/link";

import { marketingFooterLinks } from "@/lib/marketing";

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-border/40">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm lg:justify-start"
          aria-label="Footer"
        >
          {marketingFooterLinks.map((link, index) => (
            <span key={link.href} className="inline-flex items-center">
              {index > 0 ? (
                <span aria-hidden className="mx-2 text-border">
                  ·
                </span>
              ) : null}
              <Link
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>

        <p className="mt-8 text-center text-[11px] tracking-wide text-muted-foreground/80 lg:text-left">
          © {new Date().getFullYear()} FansClash · 18+ · Play responsibly · EAT
        </p>
      </div>
    </footer>
  );
}
