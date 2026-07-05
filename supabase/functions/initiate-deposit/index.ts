import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  corsHeaders,
  getDarajaAccessToken,
  getDarajaConfig,
  initiateStkPush,
  toDarajaPhone,
} from "../_shared/daraja.ts";

interface InitiateDepositBody {
  amount: number;
  phone_number?: string;
}

function isValidDarajaMsisdn(phone: string): boolean {
  return /^254[17]\d{8}$/.test(toDarajaPhone(phone));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const body = (await req.json()) as InitiateDepositBody;
    const amount = Number(body.amount);
    const verifiedPhone = profile?.phone_number?.trim() || null;
    const requestPhone = body.phone_number?.trim() || null;

    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: "Valid amount is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (amount < 1) {
      return new Response(JSON.stringify({ error: "Minimum deposit is KES 1" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let stkPhone: string;

    if (verifiedPhone) {
      if (requestPhone) {
        return new Response(
          JSON.stringify({
            error:
              "Verified M-Pesa number is locked to your account. Remove phone_number from the request.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      stkPhone = toDarajaPhone(verifiedPhone);
    } else {
      if (!requestPhone) {
        return new Response(
          JSON.stringify({
            error:
              "Enter your M-Pesa number for your first deposit. It will be verified and locked after a successful payment.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      stkPhone = toDarajaPhone(requestPhone);
    }

    if (!isValidDarajaMsisdn(stkPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid Kenyan phone number format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { consumerKey, consumerSecret, shortcode, passkey, callbackUrl } =
      getDarajaConfig();

    const accessToken = await getDarajaAccessToken(consumerKey, consumerSecret);

    const stkResponse = await initiateStkPush({
      accessToken,
      shortcode,
      passkey,
      callbackUrl,
      amount,
      phoneNumber: stkPhone,
      accountReference: "FansClash",
      transactionDesc: "Wallet deposit",
    });

    if (stkResponse.ResponseCode !== "0") {
      return new Response(
        JSON.stringify({
          error: stkResponse.ResponseDescription || "STK Push request rejected",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: pendingDeposit, error: insertError } = await supabaseAdmin
      .from("pending_deposits")
      .insert({
        user_id: user.id,
        checkout_request_id: stkResponse.CheckoutRequestID,
        merchant_request_id: stkResponse.MerchantRequestID,
        amount,
        phone_number: stkPhone,
        status: "pending",
      })
      .select("id, checkout_request_id, status")
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        pending_deposit_id: pendingDeposit.id,
        checkout_request_id: pendingDeposit.checkout_request_id,
        merchant_request_id: stkResponse.MerchantRequestID,
        customer_message: stkResponse.CustomerMessage,
        status: pendingDeposit.status,
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
