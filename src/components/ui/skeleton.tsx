import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card px-[18px] py-3">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <div className="space-y-1">
            <div className="flex justify-between gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-[5px] w-full rounded-full" />
          </div>
        </div>
        <div className="shrink-0 space-y-1 text-right">
          <Skeleton className="ml-auto h-3 w-14" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-3 w-24 ml-auto" />
      </div>
    </div>
  );
}
