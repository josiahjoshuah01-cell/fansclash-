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
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex justify-between gap-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
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
