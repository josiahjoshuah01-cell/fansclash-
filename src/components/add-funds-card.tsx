"use client";

import { Loader2 } from "lucide-react";
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
import { Toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import {
  isValidKenyanPhone,
  normalizeKenyanDigits,
  toE164KenyanPhone,
} from "@/lib/phone";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;

type DepositPhase = "idle" | "pushing" | "waiting";

export function AddFundsCard({
  onDepositComplete,
}: {
  onDepositComplete?: () => void;
}) {
  const supabase = createClient();

  const [amount, setAmount] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phase, setPhase] = useState<DepositPhase>("idle");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.phone) {
        setPhoneDigits(normalizeKenyanDigits(user.phone));
      }
    });
  }, [supabase.auth]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const pollDepositStatus = (checkoutRequestId: string) => {
    const startedAt = Date.now();

    const intervalId = window.setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        window.clearInterval(intervalId);
        setPhase("idle");
        setStatusMessage(null);
        setToast({
          type: "error",
          message: "Deposit timed out. If you completed payment, check your balance shortly.",
        });
        return;
      }

      const { data, error } = await supabase
        .from("pending_deposits")
        .select("status, result_description")
        .eq("checkout_request_id", checkoutRequestId)
        .maybeSingle();

      if (error || !data) return;

      if (data.status === "completed") {
        window.clearInterval(intervalId);
        setPhase("idle");
        setStatusMessage(null);
        setToast({
          type: "success",
          message: "Deposit successful. Your wallet has been credited.",
        });
        onDepositComplete?.();
      }

      if (data.status === "failed") {
        window.clearInterval(intervalId);
        setPhase("idle");
        setStatusMessage(null);
        setToast({
          type: "error",
          message:
            data.result_description ||
            "M-Pesa payment failed or was cancelled.",
        });
      }
    }, POLL_INTERVAL_MS);

    return intervalId;
  };

  const handleDeposit = async () => {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      setToast({ type: "error", message: "Enter a valid amount (minimum KES 1)." });
      return;
    }

    if (!isValidKenyanPhone(phoneDigits)) {
      setToast({
        type: "error",
        message: "Enter a valid Kenyan mobile number (9 digits after +254).",
      });
      return;
    }

    setPhase("pushing");
    setToast(null);
    setStatusMessage(null);

    const { data, error } = await supabase.functions.invoke("initiate-deposit", {
      body: {
        amount: parsedAmount,
        phone_number: toE164KenyanPhone(phoneDigits),
      },
    });

    if (error || data?.error) {
      setPhase("idle");
      setToast({
        type: "error",
        message: data?.error || error?.message || "Could not start M-Pesa deposit.",
      });
      return;
    }

    setPhase("waiting");
    setStatusMessage(
      data.customer_message ||
        "STK Push sent. Enter your M-Pesa PIN on your phone to complete the payment."
    );

    pollDepositStatus(data.checkout_request_id);
  };

  const isBusy = phase !== "idle";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add funds</CardTitle>
          <CardDescription>
            Deposit via M-Pesa STK Push. Sandbox mode — use Daraja test credentials
            and the Safaricom sandbox test number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="deposit-amount" className="text-sm font-medium">
              Amount (KES)
            </label>
            <Input
              id="deposit-amount"
              type="number"
              min={1}
              step={1}
              placeholder="100"
              value={amount}
              disabled={isBusy}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="deposit-phone" className="text-sm font-medium">
              M-Pesa phone number
            </label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                +254
              </span>
              <Input
                id="deposit-phone"
                type="tel"
                inputMode="numeric"
                placeholder="712345678"
                value={phoneDigits}
                disabled={isBusy}
                onChange={(event) =>
                  setPhoneDigits(normalizeKenyanDigits(event.target.value).slice(0, 9))
                }
                className="rounded-l-none"
              />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleDeposit}
            disabled={isBusy}
          >
            {phase === "pushing" ? (
              <>
                <Loader2 className="animate-spin" />
                Sending STK Push…
              </>
            ) : phase === "waiting" ? (
              <>
                <Loader2 className="animate-spin" />
                Waiting for M-Pesa…
              </>
            ) : (
              "Deposit via M-Pesa"
            )}
          </Button>

          {statusMessage ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              {statusMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </>
  );
}
