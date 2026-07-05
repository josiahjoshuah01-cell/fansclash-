import { MobileNavGate } from "@/components/mobile-nav-gate";
import { TopNav } from "@/components/top-nav";
import { cn } from "@/lib/utils";

export function AppChrome({
  children,
  mainClassName,
}: {
  children: React.ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="app-shell relative min-h-dvh">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/[0.04] to-transparent"
      />

      <TopNav />

      <main
        className={cn(
          "relative mx-auto max-w-5xl px-4 pt-4 pb-24 sm:px-6 sm:pt-5 md:pb-10",
          mainClassName
        )}
      >
        {children}
      </main>

      <MobileNavGate />

      <footer className="relative hidden border-t border-border bg-background/80 md:block">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-5 text-center text-xs text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <p>FansClash · Peer-to-peer fan betting</p>
          <p>All times in East Africa Time (EAT)</p>
        </div>
      </footer>
    </div>
  );
}
