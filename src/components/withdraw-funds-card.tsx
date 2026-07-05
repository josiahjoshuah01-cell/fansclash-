"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Panel } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { formatVerifiedMsisdn, isVerifiedMsisdn } from "@/lib/phone-display";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;

type WithdrawPhase = "idle" | "confirming" | "submitting" | "waiting";

function formatDisplayPhone(phone: string | null): string {
  return formatVerifiedMsisdn(phone);
}

export function WithdrawFundsCard({
  onWithdrawComplete,
}: {
  onWithdrawComplete?: () => void;
}) {
  const supabase = createClient();

  const [amount, setAmount] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [phase, setPhase] = useState<WithdrawPhase>("idle");
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("phone_number")
        .eq("id", user.id)
        .maybeSingle();

      setVerifiedPhone(profile?.phone_number ?? null);
    });
  }, [supabase]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const pollWithdrawalStatus = (originatorConversationId: string) => {
    const startedAt = Date.now();

    const intervalId = window.setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        window.clearInterval(intervalId);
        setPhase("idle");
        setShowConfirm(false);
        setStatusMessage(null);
        setToast({
          type: "error",
          message:
            "Withdrawal timed out. If funds were sent, check your M-Pesa shortly or contact support.",
        });
        return;
      }

      const { data, error } = await supabase
        .from("pending_withdrawals")
        .select("status, result_description")
        .eq("originator_conversation_id", originatorConversationId)
        .maybeSingle();

      if (error || !data) return;

      if (data.status === "completed") {
        window.clearInterval(intervalId);
        setPhase("idle");
        setShowConfirm(false);
        setStatusMessage(null);
        setAmount("");
        setToast({
          type: "success",
          message: "Withdrawal successful. Funds have been sent to your M-Pesa.",
        });
        onWithdrawComplete?.();
      }

      if (data.status === "failed") {
        window.clearInterval(intervalId);
        setPhase("idle");
        setShowConfirm(false);
        setStatusMessage(null);
        setToast({
          type: "error",
          message:
            data.result_description ||
            "M-Pesa withdrawal failed. Your wallet balance has been refunded.",
        });
        onWithdrawComplete?.();
      }
    }, POLL_INTERVAL_MS);

    return intervalId;
  };

  const handleReview = () => {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      setToast({ type: "error", message: "Enter a valid amount (minimum KES 1)." });
      return;
    }

    if (!isVerifiedMsisdn(verifiedPhone)) {
      setToast({
        type: "error",
        message:
          "No verified M-Pesa number yet. Make a deposit first to verify your payout phone.",
      });
      return;
    }

    setShowConfirm(true);
    setPhase("confirming");
    setToast(null);
  };

  const handleWithdraw = async () => {
    const parsedAmount = Number(amount);

    setPhase("submitting");
    setToast(null);
    setStatusMessage(null);

    const { data, error } = await supabase.functions.invoke("initiate-withdrawal", {
      body: { amount: parsedAmount },
    });

    if (error || data?.error) {
      setPhase("idle");
      setShowConfirm(false);
      setToast({
        type: "error",
        message: data?.error || error?.message || "Could not start M-Pesa withdrawal.",
      });
      return;
    }

    setPhase("waiting");
    setStatusMessage(
      data.response_description ||
        "Withdrawal submitted. Waiting for M-Pesa to send funds to your phone."
    );

    pollWithdrawalStatus(data.originator_conversation_id);
  };

  const isBusy = phase === "submitting" || phase === "waiting";

  return (
    <>
      <Panel
        title="Withdraw funds"
        description="Payout via M-Pesa B2C to your verified deposit number. Sandbox mode — Daraja test credentials only."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="withdraw-amount" className="text-sm font-medium">
              Amount (KES)
            </label>
            <Input
              id="withdraw-amount"
              type="number"
              min={1}
              step={1}
              placeholder="100"
              value={amount}
              disabled={isBusy || showConfirm}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Destination M-Pesa number</p>
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm tabular-nums">
              {formatDisplayPhone(verifiedPhone)}
            </div>
            <p className="text-xs text-muted-foreground">
              Withdrawals always go to the phone verified by your first successful
              deposit. This cannot be changed here.
            </p>
          </div>

          {!showConfirm ? (
            <Button
              className="w-full"
              variant="outline"
              onClick={handleReview}
              disabled={isBusy}
            >
              Review withdrawal
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">Confirm withdrawal</p>
              <p className="text-sm text-muted-foreground">
                Send{" "}
                <span className="font-semibold text-foreground">
                  KES {Number(amount).toLocaleString("en-KE")}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                  {formatDisplayPhone(verifiedPhone)}
                </span>
                ?
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => {
                    setShowConfirm(false);
                    setPhase("idle");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleWithdraw}
                  disabled={isBusy}
                >
                  {phase === "submitting" ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Submitting…
                    </>
                  ) : phase === "waiting" ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Confirm withdrawal"
                  )}
                </Button>
              </div>
            </div>
          )}

          {statusMessage ? (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {statusMessage}
            </p>
          ) : null}
        </div>
      </Panel>

      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </>
  );
}
