"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isAtLeast18 } from "@/lib/phone";

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
    router.replace("/");
  };

  return (
    <div className="w-full max-w-[400px]">
      <Card className="w-full border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Confirm your age</CardTitle>
        <CardDescription>
          FansClash is for adults only. You must be{" "}
          <strong className="text-foreground">18 or older</strong> to create an
          account and place bets. Enter your date of birth to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Continue"}
          </Button>

          {error ? (
            <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
              {error}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
