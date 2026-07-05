import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  compact = false,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  compact?: boolean;
}) {
  const hasHeader = Boolean(title || description);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className
      )}
    >
      {hasHeader ? (
        <div
          className={cn(
            "border-b border-border bg-muted/40",
            compact ? "px-4 py-3" : "px-5 py-4 sm:px-6"
          )}
        >
          {title ? (
            <h2
              className={cn(
                "font-semibold tracking-tight",
                compact && "text-sm"
              )}
            >
              {title}
            </h2>
          ) : null}
          {description ? (
            <p
              className={cn(
                "text-muted-foreground",
                compact ? "mt-0.5 text-xs" : "mt-0.5 text-sm"
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          hasHeader && (compact ? "p-4" : "p-5 sm:p-6"),
          contentClassName
        )}
      >
        {children}
      </div>

      {footer ? (
        <div className="border-t border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground sm:px-6">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
