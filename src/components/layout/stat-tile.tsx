import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  className,
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-sm",
          className
        )}
      >
        <div className="flex items-center gap-2.5">
          <Icon
            className="size-[18px] shrink-0 text-muted-foreground"
            strokeWidth={1.75}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
            <p className="truncate leading-tight">
              <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                {value}
              </span>
              {hint ? (
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                  {hint}
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-2xl font-bold tabular-nums tracking-tight">
            {value}
          </p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
