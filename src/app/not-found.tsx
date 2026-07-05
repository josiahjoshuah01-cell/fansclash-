import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="text-6xl font-bold tabular-nums text-muted-foreground/40">
          404
        </p>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/matches">Back to matches</Link>
        </Button>
      </div>
    </div>
  );
}
