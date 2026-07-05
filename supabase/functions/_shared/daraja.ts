// Shared Daraja helpers — SANDBOX endpoints.
// Production: replace base URL with https://api.safaricom.co.ke and swap
// CONSUMER_KEY / CONSUMER_SECRET / SHORTCODE / PASSKEY for live credentials.

const DARAJA_SANDBOX_BASE = "https://sandbox.safaricom.co.ke";

export function getDarajaConfig() {
  const consumerKey = Deno.env.get("CONSUMER_KEY");
  const consumerSecret = Deno.env.get("CONSUMER_SECRET");
  const shortcode = Deno.env.get("SHORTCODE");
  const passkey = Deno.env.get("PASSKEY");
  const callbackUrl = Deno.env.get("CALLBACK_URL");

  if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
    throw new Error("Missing Daraja environment variables");
  }

  return { consumerKey, consumerSecret, shortcode, passkey, callbackUrl };
}

export function formatDarajaTimestamp(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

export function generateStkPassword(
  shortcode: string,
  passkey: string,
  timestamp: string
): string {
  return btoa(shortcode + passkey + timestamp);
}

/** Normalize to 254XXXXXXXXX for Daraja PartyA / PhoneNumber fields. */
export function toDarajaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `254${digits}`;
  }

  return digits;
}

export async function getDarajaAccessToken(
  consumerKey: string,
  consumerSecret: string
): Promise<string> {
  const credentials = btoa(`${consumerKey}:${consumerSecret}`);

  const response = await fetch(
    `${DARAJA_SANDBOX_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Daraja OAuth failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Daraja OAuth response missing access_token");
  }

  return data.access_token as string;
}

export async function initiateStkPush(params: {
  accessToken: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
}): Promise<{
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}> {
  const timestamp = formatDarajaTimestamp();
  const password = generateStkPassword(params.shortcode, params.passkey, timestamp);
  const phone = toDarajaPhone(params.phoneNumber);

  const response = await fetch(
    `${DARAJA_SANDBOX_BASE}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: params.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(params.amount),
        PartyA: phone,
        PartyB: params.shortcode,
        PhoneNumber: phone,
        CallBackURL: params.callbackUrl,
        AccountReference: params.accountReference,
        TransactionDesc: params.transactionDesc,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.errorMessage || data.error || `STK Push failed: ${response.status}`
    );
  }

  return data;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
