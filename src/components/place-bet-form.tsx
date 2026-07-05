"use client";

import { useEffect, useState } from "react";

import { Panel } from "@/components/layout/panel";
import { Toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mapPlaceBetError } from "@/lib/errors";
import { formatKes, teamAName, teamBName, type SportingEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function PlaceBetForm({
  event,
  balance,
  onBetPlaced,
  embedded = false,
}: {
  event: SportingEvent;
  balance: number;
  onBetPlaced: () => void;
  embedded?: boolean;
}) {
  const supabase = createClient();
  const [side, setSide] = useState<"team_a" | "team_b">("team_a");
  const [amount, setAmount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const parsedAmount = Number(amount);

  const handleSubmit = async () => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setToast({ type: "error", message: "Enter a valid stake amount." });
      return;
    }

    if (parsedAmount > balance) {
      setToast({
        type: "error",
        message: "Insufficient balance. Add funds to your wallet first.",
      });
      return;
    }

    setLoading(true);
    setToast(null);

    const { error } = await supabase.rpc("place_bet", {
      p_event_id: event.id,
      p_side: side,
      p_amount: parsedAmount,
    });

    setLoading(false);
    setConfirming(false);

    if (error) {
      setToast({ type: "error", message: mapPlaceBetError(error.message) });
      return;
    }

    setAmount("");
    setToast({ type: "success", message: "Bet placed. Matching updates live below." });
    onBetPlaced();
  };

  const form = (
    <div className="space-y-3">
      {embedded ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Place a bet</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            Balance {formatKes(balance)}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={side === "team_a" ? "default" : "outline"}
          className={cn("h-10 py-2 text-sm")}
          onClick={() => setSide("team_a")}
          disabled={loading}
        >
          {teamAName(event)}
        </Button>
        <Button
          type="button"
          variant={side === "team_b" ? "default" : "outline"}
          className={cn("h-10 py-2 text-sm")}
          onClick={() => setSide("team_b")}
          disabled={loading}
        >
          {teamBName(event)}
        </Button>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="stake" className="text-sm font-medium">
          Stake
        </label>
        <Input
          id="stake"
          type="number"
          min={1}
          step={1}
          placeholder="100"
          value={amount}
          disabled={loading}
          className="h-10"
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {!confirming ? (
        <Button
          className="h-10 w-full"
          disabled={loading || !amount}
          onClick={() => setConfirming(true)}
        >
          Review bet
        </Button>
      ) : (
        <div className="space-y-2.5 rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-sm">
            Confirm{" "}
            <strong>{formatKes(parsedAmount)}</strong> on{" "}
            <strong>{side === "team_a" ? teamAName(event) : teamBName(event)}</strong>
            ?
          </p>
          <div className="flex gap-2">
            <Button
              className="h-10 flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Placing…" : "Confirm bet"}
            </Button>
            <Button
              variant="outline"
              className="h-10 flex-1"
              onClick={() => setConfirming(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {embedded ? (
        form
      ) : (
        <Panel
          compact
          title="Place a bet"
          description={`Balance ${formatKes(balance)}. Stakes match pro-rata until kickoff.`}
          contentClassName="p-4 sm:px-5"
        >
          {form}
        </Panel>
      )}

      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </>
  );
}
