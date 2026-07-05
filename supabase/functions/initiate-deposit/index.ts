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
  phone_number: string;
  amount: number;
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

    const body = (await req.json()) as InitiateDepositBody;
    const amount = Number(body.amount);
    const phoneNumber = body.phone_number?.trim();

    if (!phoneNumber || !Number.isFinite(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Valid phone_number and amount are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (amount < 1) {
      return new Response(JSON.stringify({ error: "Minimum deposit is KES 1" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const darajaPhone = toDarajaPhone(phoneNumber);
    if (!/^254[17]\d{8}$/.test(darajaPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid Kenyan phone number format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // SANDBOX credentials from Supabase Edge Function secrets.
    // Production: replace with live Daraja credentials in project secrets.
    const { consumerKey, consumerSecret, shortcode, passkey, callbackUrl } =
      getDarajaConfig();

    const accessToken = await getDarajaAccessToken(consumerKey, consumerSecret);

    const stkResponse = await initiateStkPush({
      accessToken,
      shortcode,
      passkey,
      callbackUrl,
      amount,
      phoneNumber: darajaPhone,
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: pendingDeposit, error: insertError } = await supabaseAdmin
      .from("pending_deposits")
      .insert({
        user_id: user.id,
        checkout_request_id: stkResponse.CheckoutRequestID,
        merchant_request_id: stkResponse.MerchantRequestID,
        amount,
        phone_number: darajaPhone,
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
