import { cn } from "@/lib/utils";

export function Toast({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg",
        type === "success"
          ? "border-success/30 bg-success/10 text-success"
          : "border-warning/30 bg-warning/10 text-warning"
      )}
    >
      {message}
    </div>
  );
}
