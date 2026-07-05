"use client";

import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
import { mapOtpError, mapPhoneValidationError } from "@/lib/errors";
import {
  isValidKenyanPhone,
  normalizeKenyanDigits,
  toE164KenyanPhone,
} from "@/lib/phone";
import { cn } from "@/lib/utils";

type Step = "phone" | "otp";

const RESEND_COOLDOWN_SECONDS = 30;

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

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span
        className={cn(
          "size-2 rounded-full transition-colors",
          step === "phone" ? "bg-primary" : "bg-primary/30"
        )}
        aria-hidden
      />
      <span className="h-px w-8 bg-border" aria-hidden />
      <span
        className={cn(
          "size-2 rounded-full transition-colors",
          step === "otp" ? "bg-primary" : "bg-muted-foreground/30"
        )}
        aria-hidden
      />
    </div>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("phone");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const phoneValid = isValidKenyanPhone(phoneDigits);
  const otpValid = /^\d{6}$/.test(otp);

  const e164Phone = phoneValid ? toE164KenyanPhone(phoneDigits) : null;

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setResendSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const handlePhoneChange = (value: string) => {
    setPhoneDigits(normalizeKenyanDigits(value).slice(0, 9));
    setError(null);
  };

  const sendCode = useCallback(async () => {
    if (!e164Phone) {
      setError(mapPhoneValidationError());
      return;
    }

    setLoading(true);
    setError(null);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: e164Phone,
    });

    setLoading(false);

    if (otpError) {
      setError(mapOtpError(otpError.message));
      return;
    }

    setStep("otp");
    setOtp("");
    setResendSeconds(RESEND_COOLDOWN_SECONDS);
  }, [e164Phone, supabase.auth]);

  const verifyCode = async () => {
    if (!e164Phone) {
      setError("Phone number is invalid.");
      return;
    }

    if (!otpValid) {
      setError("Enter the 6-digit code from your SMS.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: e164Phone,
      token: otp,
      type: "sms",
    });

    if (verifyError) {
      setLoading(false);
      setError(mapOtpError(verifyError.message));
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      setError("Verification succeeded but no session was created.");
      return;
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    setLoading(false);
    router.refresh();

    if (wallet) {
      router.replace("/");
    } else {
      router.replace("/onboarding");
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0) return;
    await sendCode();
  };

  return (
    <Card className="w-full overflow-hidden border-border/80 bg-card/95 shadow-xl shadow-black/5 backdrop-blur-sm supports-[backdrop-filter]:bg-card/90 dark:shadow-black/20">
      <CardHeader className="space-y-6 border-b border-border/60 pb-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <FansClashMark />
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              FansClash
            </p>
            <p className="text-sm text-muted-foreground">
              P2P fan betting · Kenya
            </p>
          </div>
          <StepIndicator step={step} />
        </div>

        <div className="space-y-1.5 text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl">
            {step === "phone" ? (
              <>
                <Phone className="size-5 text-primary" aria-hidden />
                Sign in
              </>
            ) : (
              <>
                <ShieldCheck className="size-5 text-primary" aria-hidden />
                Enter code
              </>
            )}
          </CardTitle>
          <CardDescription className="text-balance text-muted-foreground">
            {step === "phone"
              ? "Use your Kenyan mobile number. We'll text you a one-time code."
              : `We sent a 6-digit code to ${e164Phone ?? "+254…"}.`}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {step === "phone" ? (
          <>
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-foreground"
              >
                Phone number
              </label>
              <div className="flex w-full overflow-hidden rounded-lg shadow-sm ring-1 ring-border transition-shadow focus-within:ring-2 focus-within:ring-ring">
                <span className="inline-flex h-11 shrink-0 items-center border-r border-input bg-muted px-3.5 text-sm font-semibold tabular-nums text-muted-foreground">
                  +254
                </span>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="712345678"
                  value={phoneDigits}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  className="h-11 rounded-none border-0 bg-background text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Mobile numbers start with 7 or 1 (9 digits after +254).
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              className="h-11 w-full text-base"
              onClick={sendCode}
              disabled={loading || !phoneValid}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Sending…
                </>
              ) : (
                "Send code"
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label
                htmlFor="otp"
                className="text-sm font-medium text-foreground"
              >
                Verification code
              </label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                className={cn(
                  "h-12 border-border bg-background text-center text-lg tracking-[0.35em] tabular-nums sm:h-14 sm:text-xl",
                  "placeholder:tracking-normal placeholder:text-muted-foreground/50"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Enter all 6 digits from your SMS.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              className="h-11 w-full text-base"
              onClick={verifyCode}
              disabled={loading || !otpValid}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Verifying…
                </>
              ) : (
                "Verify"
              )}
            </Button>

            <div className="flex flex-col items-stretch gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="link"
                className="h-auto justify-start p-0 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                }}
              >
                Change number
              </Button>

              <Button
                type="button"
                variant="link"
                className={cn(
                  "h-auto justify-start p-0 text-sm sm:justify-end",
                  resendSeconds > 0
                    ? "text-muted-foreground"
                    : "text-primary hover:text-primary/90"
                )}
                onClick={handleResend}
                disabled={loading || resendSeconds > 0}
              >
                {resendSeconds > 0
                  ? `Resend in ${resendSeconds}s`
                  : "Resend code"}
              </Button>
            </div>
          </>
        )}

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2.5 text-sm text-warning"
          >
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
