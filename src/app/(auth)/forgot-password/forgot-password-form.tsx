"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
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
import { isValidEmail, normalizeEmail } from "@/lib/email";
import {
  mapEmailValidationError,
  mapPasswordAuthError,
} from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const normalizedEmail = normalizeEmail(email);
  const emailValid = isValidEmail(normalizedEmail);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!emailValid) {
      setError(mapEmailValidationError());
      return;
    }

    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      }
    );

    setLoading(false);

    if (resetError) {
      setError(mapPasswordAuthError(resetError.message));
      return;
    }

    setSent(true);
  };

  return (
    <Card className="w-full overflow-hidden border-border/80 bg-card/95 shadow-xl shadow-black/5 backdrop-blur-sm supports-[backdrop-filter]:bg-card/90 dark:shadow-black/20">
      <CardHeader className="space-y-0 border-b border-border/60 p-4 pb-3 sm:px-5">
        <CardTitle className="text-lg leading-tight">Reset your password</CardTitle>
        <CardDescription className="text-pretty text-xs leading-snug">
          Enter your email and we will send you a link to choose a new password.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3.5 p-4 sm:px-5 sm:py-4">
        {sent ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
            <p>
              If an account exists for{" "}
              <span className="font-medium text-foreground">{normalizedEmail}</span>,
              you will receive a reset link shortly.
            </p>
            <p className="text-xs">
              Check your inbox and spam folder. The email comes from{" "}
              <span className="font-medium text-foreground">
                noreply@mail.app.supabase.io
              </span>
              .
            </p>
          </div>
        ) : (
          <form className="space-y-2.5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="reset-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                className="h-10 text-sm"
              />
            </div>

            <Button
              type="submit"
              className="h-10 w-full gap-2 text-sm"
              disabled={loading || !emailValid}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Sending reset link…
                </>
              ) : (
                <>
                  <Mail className="size-4" aria-hidden />
                  Send reset link
                </>
              )}
            </Button>
          </form>
        )}

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
