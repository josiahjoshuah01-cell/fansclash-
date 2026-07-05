/*
 * LEGAL / COMPLIANCE — M-Pesa B2C withdrawals
 * ---------------------------------------------------------------------------
 * This feature MUST remain WITHDRAWALS_ENABLED=false in any environment real
 * users can reach until legal counsel confirms KYC threshold and GRA licensing
 * status. Do not enable in production without that sign-off.
 * ---------------------------------------------------------------------------
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  corsHeaders,
  getB2CConfig,
  getDarajaAccessToken,
  initiateB2CPayment,
  isWithdrawalsEnabled,
  toDarajaPhone,
} from "../_shared/daraja.ts";

interface InitiateWithdrawalBody {
  amount: number;
}

function generateOriginatorConversationId(): string {
  return `fc_${crypto.randomUUID().replace(/-/g, "")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!isWithdrawalsEnabled()) {
    return new Response(JSON.stringify({ error: "Withdrawals are not enabled" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as InitiateWithdrawalBody;
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: "Valid amount is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (amount < 1) {
      return new Response(
        JSON.stringify({ error: "Minimum withdrawal is KES 1" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("phone_number, is_suspended")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile?.is_suspended) {
      return new Response(
        JSON.stringify({
          error: "Your account is suspended. Contact support for assistance.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const phoneNumber = profile?.phone_number?.trim();
    if (!phoneNumber) {
      return new Response(
        JSON.stringify({
          error:
            "No verified M-Pesa number on your account. Make a deposit first to verify your payout phone.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const darajaPhone = toDarajaPhone(phoneNumber);
    if (!/^254[17]\d{8}$/.test(darajaPhone)) {
      return new Response(
        JSON.stringify({ error: "Verified phone number is not a valid Kenyan mobile" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const originatorConversationId = generateOriginatorConversationId();

    const { data: locked, error: lockError } = await supabaseAdmin.rpc(
      "lock_funds_for_withdrawal",
      {
        p_user_id: user.id,
        p_originator_conversation_id: originatorConversationId,
        p_amount: amount,
        p_phone_number: darajaPhone,
      }
    );

    if (lockError) {
      const message = lockError.message.includes("Insufficient")
        ? "Insufficient wallet balance"
        : lockError.message.includes("suspended")
          ? "Your account is suspended. Contact support for assistance."
          : lockError.message;
      const status = lockError.message.includes("Insufficient")
        ? 400
        : lockError.message.includes("suspended")
          ? 403
          : 500;
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lockRow = Array.isArray(locked) ? locked[0] : locked;

    // SANDBOX credentials from Supabase Edge Function secrets.
    const {
      consumerKey,
      consumerSecret,
      initiatorName,
      securityCredential,
      shortcode,
      resultUrl,
      timeoutUrl,
    } = getB2CConfig();

    const accessToken = await getDarajaAccessToken(consumerKey, consumerSecret);

    let b2cResponse;
    try {
      b2cResponse = await initiateB2CPayment({
        accessToken,
        initiatorName,
        securityCredential,
        shortcode,
        resultUrl,
        timeoutUrl,
        originatorConversationId,
        amount,
        phoneNumber: darajaPhone,
      });
    } catch (b2cError) {
      const message =
        b2cError instanceof Error ? b2cError.message : "B2C request failed";
      await supabaseAdmin.rpc("fail_pending_withdrawal_refund", {
        p_originator_conversation_id: originatorConversationId,
        p_result_description: message,
      });
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (b2cResponse.ResponseCode !== "0") {
      await supabaseAdmin.rpc("fail_pending_withdrawal_refund", {
        p_originator_conversation_id: originatorConversationId,
        p_result_description:
          b2cResponse.ResponseDescription || "B2C payment request rejected",
      });
      return new Response(
        JSON.stringify({
          error: b2cResponse.ResponseDescription || "B2C payment request rejected",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (b2cResponse.ConversationID) {
      await supabaseAdmin.rpc("attach_withdrawal_conversation_id", {
        p_originator_conversation_id: originatorConversationId,
        p_conversation_id: b2cResponse.ConversationID,
      });
    }

    return new Response(
      JSON.stringify({
        pending_withdrawal_id: lockRow?.pending_withdrawal_id,
        transaction_id: lockRow?.transaction_id,
        originator_conversation_id: originatorConversationId,
        conversation_id: b2cResponse.ConversationID,
        response_description: b2cResponse.ResponseDescription,
        status: "pending",
        destination_phone: darajaPhone,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
