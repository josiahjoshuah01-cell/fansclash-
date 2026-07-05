import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/daraja.ts";

interface StkCallbackItem {
  Name: string;
  Value?: number | string;
}

interface MpesaCallbackBody {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: StkCallbackItem[];
      };
    };
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as MpesaCallbackBody;
    const callback = payload.Body?.stkCallback;

    if (!callback?.CheckoutRequestID) {
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: "Missing CheckoutRequestID" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode ?? 1;
    const resultDesc = callback.ResultDesc ?? "Unknown result";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: pendingDeposit, error: lookupError } = await supabaseAdmin
      .from("pending_deposits")
      .select("id, amount, status")
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle();

    if (lookupError) {
      return new Response(JSON.stringify({ error: lookupError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!pendingDeposit) {
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: "Unknown CheckoutRequestID" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (pendingDeposit.status === "completed") {
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Already processed" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (resultCode === 0) {
      const callbackAmount = callback.CallbackMetadata?.Item?.find(
        (item) => item.Name === "Amount"
      )?.Value;

      if (
        callbackAmount !== undefined &&
        Number(callbackAmount) !== Number(pendingDeposit.amount)
      ) {
        await supabaseAdmin.rpc("fail_pending_deposit", {
          p_checkout_request_id: checkoutRequestId,
          p_result_description: "Callback amount mismatch",
        });

        return new Response(
          JSON.stringify({ ResultCode: 1, ResultDesc: "Amount mismatch" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const { error: creditError } = await supabaseAdmin.rpc(
        "credit_wallet_deposit",
        { p_checkout_request_id: checkoutRequestId }
      );

      if (creditError) {
        return new Response(JSON.stringify({ error: creditError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      await supabaseAdmin.rpc("fail_pending_deposit", {
        p_checkout_request_id: checkoutRequestId,
        p_result_description: resultDesc,
      });
    }

    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
