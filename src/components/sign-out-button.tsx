"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  variant = "outline",
  size = "default",
  showIcon = true,
}: {
  className?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.replace("/sign-in");
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : showIcon ? (
        <LogOut className="size-4" aria-hidden />
      ) : null}
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
