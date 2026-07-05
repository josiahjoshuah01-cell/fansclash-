"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Panel } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isAtLeast18 } from "@/lib/phone";

function FansClashMark() {
  return (
    <div
      aria-hidden
      className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold tracking-tight text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/20"
    >
      FC
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!dateOfBirth) {
      setError("Please enter your date of birth.");
      return;
    }

    const dob = new Date(`${dateOfBirth}T00:00:00`);
    if (Number.isNaN(dob.getTime())) {
      setError("Please enter a valid date of birth.");
      return;
    }

    if (!isAtLeast18(dob)) {
      setError(
        "You must be at least 18 years old to use FansClash. Betting is restricted to adults only."
      );
      return;
    }

    setLoading(true);

    const { error: rpcError } = await supabase.rpc("complete_user_onboarding", {
      p_date_of_birth: dateOfBirth,
    });

    setLoading(false);

    if (rpcError) {
      if (rpcError.message.includes("18")) {
        setError(
          "You must be at least 18 years old to use FansClash. Betting is restricted to adults only."
        );
      } else {
        setError(rpcError.message);
      }
      return;
    }

    router.refresh();
    router.replace("/matches");
  };

  return (
    <div className="w-full max-w-[420px]">
      <Panel
        className="overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20"
        contentClassName="p-0"
      >
        <div className="space-y-6 border-b border-border bg-muted/30 px-6 py-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <FansClashMark />
            <div className="space-y-1">
              <p className="text-2xl font-bold tracking-tight">Almost there</p>
              <p className="text-sm text-muted-foreground">
                Confirm you are 18 or older to start betting.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-8">
          <div className="space-y-2">
            <label htmlFor="dob" className="text-sm font-medium">
              Date of birth
            </label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              max={new Date().toISOString().split("T")[0]}
              onChange={(event) => {
                setDateOfBirth(event.target.value);
                setError(null);
              }}
              className="h-11"
              required
            />
            <p className="text-xs text-muted-foreground">
              FansClash is for adults only. Your date of birth is stored for
              compliance.
            </p>
          </div>

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Continue to matches"
            )}
          </Button>

          {error ? (
            <p className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2.5 text-sm text-warning">
              {error}
            </p>
          ) : null}
        </form>
      </Panel>
    </div>
  );
}
