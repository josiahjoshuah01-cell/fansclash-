import { BackLink } from "@/components/layout/back-link";
import { cn } from "@/lib/utils";

export function MarketingPage({
  title,
  description,
  lastUpdated = "July 2026",
  children,
  className,
}: {
  title: string;
  description?: string;
  lastUpdated?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14", className)}>
      <BackLink href="/" label="Back to home" />

      <header className="mt-6 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">
          Last updated {lastUpdated}
        </p>
      </header>

      <article
        className={cn(
          "mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground",
          "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground",
          "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground",
          "[&_p+p]:mt-4",
          "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
          "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5",
          "[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline"
        )}
      >
        {children}
      </article>
    </div>
  );
}
