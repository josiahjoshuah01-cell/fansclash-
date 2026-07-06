"use client";

import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
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
import { isValidPassword, MIN_PASSWORD_LENGTH } from "@/lib/email";
import {
  mapPasswordAuthError,
  mapPasswordValidationError,
} from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordValid = isValidPassword(password);
  const confirmPasswordValid =
    confirmPassword.length > 0 && confirmPassword === password;
  const canSubmit = passwordValid && confirmPasswordValid;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!passwordValid) {
      setError(mapPasswordValidationError());
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(mapPasswordAuthError(updateError.message));
      return;
    }

    router.replace("/matches");
    router.refresh();
  };

  return (
    <Card className="w-full overflow-hidden border-border/80 bg-card/95 shadow-xl shadow-black/5 backdrop-blur-sm supports-[backdrop-filter]:bg-card/90 dark:shadow-black/20">
      <CardHeader className="space-y-0 border-b border-border/60 p-4 pb-3 sm:px-5">
        <CardTitle className="text-lg leading-tight">Set a new password</CardTitle>
        <CardDescription className="text-pretty text-xs leading-snug">
          Choose a new password for your account.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3.5 p-4 sm:px-5 sm:py-4">
        <form className="space-y-2.5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-sm font-medium">
              New password
            </label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                className="h-10 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-new-password" className="text-sm font-medium">
              Confirm new password
            </label>
            <div className="relative">
              <Input
                id="confirm-new-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError(null);
                }}
                className="h-10 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="h-10 w-full text-sm"
            disabled={loading || !canSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Updating password…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning"
          >
            {error}
          </p>
        ) : null}

        <Button
          asChild
          variant="ghost"
          className="h-9 w-full gap-2 text-sm text-muted-foreground"
        >
          <Link href="/sign-in">
            <ArrowLeft className="size-4" aria-hidden />
            Back to sign in
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
