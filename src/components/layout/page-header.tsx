import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
  compact = false,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <header
      className={cn(
        "border-b border-border",
        compact ? "pb-4" : "pb-6",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-end sm:justify-between",
          compact ? "gap-2" : "gap-4"
        )}
      >
        <div className={compact ? "space-y-1" : "space-y-1.5"}>
          <h1
            className={cn(
              "font-bold tracking-tight",
              compact ? "text-2xl" : "text-2xl sm:text-3xl"
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={cn(
                "max-w-2xl text-muted-foreground",
                compact ? "text-sm" : "text-sm sm:text-base"
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {children ? (
          <div className="flex shrink-0 items-center gap-2">{children}</div>
        ) : null}
      </div>
    </header>
  );
}
