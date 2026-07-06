"use client";

import { Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  isValidEmail,
  isValidPassword,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
} from "@/lib/email";
import {
  mapEmailValidationError,
  mapPasswordAuthError,
  mapPasswordValidationError,
} from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "sign_in" | "sign_up";

function FansClashMark() {
  return (
    <div
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold tracking-tight text-primary-foreground shadow-md shadow-primary/20 ring-1 ring-primary/20"
    >
      FC
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<
    string | null
  >(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  const normalizedEmail = normalizeEmail(email);
  const emailValid = isValidEmail(normalizedEmail);
  const passwordValid =
    mode === "sign_in" ? password.length > 0 : isValidPassword(password);
  const confirmPasswordValid =
    mode === "sign_in" ||
    (confirmPassword.length > 0 && confirmPassword === password);
  const canSubmit = emailValid && passwordValid && confirmPasswordValid;

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError === "auth_callback_failed") {
      setError(
        "Email verification link expired or was already used. Sign in with your password, or resend a new verification email below."
      );
    }

    const requestedMode = searchParams.get("mode");
    if (requestedMode === "sign_up") {
      setMode("sign_up");
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setResendSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const routeAfterSignIn = async (userId: string) => {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    router.refresh();

    if (wallet) {
      router.replace("/matches");
    } else {
      router.replace("/onboarding");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/auth/google", { method: "POST" });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.url) {
        setGoogleLoading(false);
        setError(payload.error ?? "Could not start Google sign-in.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setGoogleLoading(false);
      setError("Could not reach the sign-in service. Try again.");
    }
  };

  const resendConfirmationEmail = async () => {
    const targetEmail = pendingConfirmationEmail ?? normalizedEmail;

    if (!isValidEmail(targetEmail)) {
      setError(mapEmailValidationError());
      return;
    }

    setEmailLoading(true);
    setError(null);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setEmailLoading(false);

    if (resendError) {
      setError(mapPasswordAuthError(resendError.message));
      return;
    }

    setPendingConfirmationEmail(targetEmail);
    setResendSeconds(60);
    setInfo(
      `Verification email sent to ${targetEmail}. Check your inbox and spam folder (from noreply@mail.app.supabase.io).`
    );
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!emailValid) {
      setError(mapEmailValidationError());
      return;
    }

    if (mode === "sign_up" && !isValidPassword(password)) {
      setError(mapPasswordValidationError());
      return;
    }

    if (mode === "sign_up" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (mode === "sign_in" && !password) {
      setError("Enter your password.");
      return;
    }

    setEmailLoading(true);
    setError(null);
    setInfo(null);

    if (mode === "sign_in") {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      setEmailLoading(false);

      if (signInError) {
        const message = mapPasswordAuthError(signInError.message);
        setError(message);
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setPendingConfirmationEmail(normalizedEmail);
        }
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError("Sign-in succeeded but no session was created.");
        return;
      }

      await routeAfterSignIn(userId);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setEmailLoading(false);

    if (signUpError) {
      setError(mapPasswordAuthError(signUpError.message));
      return;
    }

    const userId = data.user?.id;
    if (data.session && userId) {
      setPendingConfirmationEmail(null);
      await routeAfterSignIn(userId);
      return;
    }

    setPendingConfirmationEmail(normalizedEmail);
    setResendSeconds(60);
    setInfo(
      data.user?.identities?.length === 0
        ? `If ${normalizedEmail} is new, check your inbox (and spam) for a verification link from noreply@mail.app.supabase.io. If you already registered, sign in instead.`
        : `We sent a verification link to ${normalizedEmail}. Check your inbox and spam folder, then sign in.`
    );
    setMode("sign_in");
    setPassword("");
    setConfirmPassword("");
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setInfo(null);
    if (nextMode === "sign_up") {
      setPendingConfirmationEmail(null);
    }
  };

  const busy = googleLoading || emailLoading;

  return (
    <Card className="w-full overflow-hidden border-border/80 bg-card/95 shadow-xl shadow-black/5 backdrop-blur-sm supports-[backdrop-filter]:bg-card/90 dark:shadow-black/20">
      <CardHeader className="space-y-0 border-b border-border/60 p-4 pb-3 sm:px-5">
        <div className="flex items-start gap-3">
          <FansClashMark />
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg leading-tight">
              {mode === "sign_in" ? "Sign in" : "Create account"}
            </CardTitle>
            <CardDescription className="text-pretty text-xs leading-snug">
              Use email and password, or Google.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5 p-4 sm:px-5 sm:py-4">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full cursor-pointer gap-2.5 text-sm"
          onClick={handleGoogleSignIn}
          disabled={busy}
        >
          {googleLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Connecting…
            </>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form className="space-y-2.5" onSubmit={handleEmailAuth}>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
                setInfo(null);
              }}
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              {mode === "sign_in" ? (
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              ) : null}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "sign_in" ? "current-password" : "new-password"
                }
                placeholder={
                  mode === "sign_in"
                    ? "Your password"
                    : `At least ${MIN_PASSWORD_LENGTH} characters`
                }
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                  setInfo(null);
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

          {mode === "sign_up" ? (
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium text-foreground"
              >
                Confirm password
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError(null);
                    setInfo(null);
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
          ) : null}

          <Button
            type="submit"
            className="h-10 w-full gap-2 text-sm"
            disabled={busy || !canSubmit}
          >
            {emailLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {mode === "sign_in" ? "Signing in…" : "Creating account…"}
              </>
            ) : mode === "sign_in" ? (
              <>
                <LogIn className="size-4" aria-hidden />
                Sign in
              </>
            ) : (
              <>
                <UserPlus className="size-4" aria-hidden />
                Create account
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {mode === "sign_in" ? (
            <>
              No account yet?{" "}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-primary"
                onClick={() => switchMode("sign_up")}
              >
                Create one
              </Button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-primary"
                onClick={() => switchMode("sign_in")}
              >
                Sign in
              </Button>
            </>
          )}
        </p>

        {pendingConfirmationEmail ? (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <p>
              Waiting for verification at{" "}
              <span className="font-medium text-foreground">
                {pendingConfirmationEmail}
              </span>
              .
            </p>
            <Button
              type="button"
              variant="link"
              className="mt-1 h-auto p-0 text-primary"
              onClick={resendConfirmationEmail}
              disabled={busy || resendSeconds > 0}
            >
              {resendSeconds > 0
                ? `Resend verification email in ${resendSeconds}s`
                : "Resend verification email"}
            </Button>
          </div>
        ) : null}

        {info ? (
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {info}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning"
          >
            {error}
          </p>
        ) : null}

        <p className="text-center text-[11px] leading-snug text-muted-foreground">
          By continuing you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            terms
          </Link>{" "}
          and confirm you are 18+.{" "}
          <Link href="/responsible-play" className="text-primary hover:underline">
            Responsible play
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
