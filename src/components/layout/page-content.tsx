import { cn } from "@/lib/utils";

export function PageContent({
  children,
  className,
  width = "default",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "default" | "narrow";
}) {
  return (
    <div
      className={cn(
        "space-y-8",
        width === "narrow" && "mx-auto max-w-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}
