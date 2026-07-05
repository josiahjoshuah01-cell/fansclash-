import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  footer,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/25 px-4 py-6 text-center",
          className
        )}
      >
        <Icon
          className="mb-2 size-[22px] text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden
        />
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 max-w-sm text-sm leading-snug text-muted-foreground">
          {description}
        </p>
        {action ? <div className="mt-4">{action}</div> : null}
        {footer ? (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/25 px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
        <Icon className="size-7 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
      {footer ? (
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
