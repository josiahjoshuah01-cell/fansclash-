/*
 * LEGAL / COMPLIANCE — M-Pesa B2C withdrawal callback
 * ---------------------------------------------------------------------------
 * This feature MUST remain WITHDRAWALS_ENABLED=false in any environment real
 * users can reach until legal counsel confirms KYC threshold and GRA licensing
 * status. Do not enable in production without that sign-off.
 * ---------------------------------------------------------------------------
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/daraja.ts";

interface B2CResultParameter {
  Key?: string;
  Value?: number | string;
}

interface B2CCallbackBody {
  Result?: {
    ResultType?: number;
    ResultCode?: number | string;
    ResultDesc?: string;
    OriginatorConversationID?: string;
    ConversationID?: string;
    TransactionID?: string;
    ResultParameters?: {
      ResultParameter?: B2CResultParameter | B2CResultParameter[];
    };
  };
}

type PendingWithdrawalRow = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  conversation_id: string | null;
  originator_conversation_id: string;
};

function normalizeResultParameters(
  items?: B2CResultParameter | B2CResultParameter[]
): B2CResultParameter[] {
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

function logUnmatchedCallback(
  reason: string,
  payload: B2CCallbackBody,
  extra?: Record<string, unknown>
) {
  console.error("[mpesa-b2c-callback] Rejected unmatched callback", {
    reason,
    originatorConversationId: payload.Result?.OriginatorConversationID,
    conversationId: payload.Result?.ConversationID,
    resultCode: payload.Result?.ResultCode,
    resultDesc: payload.Result?.ResultDesc,
    ...extra,
  });
}

async function recordRejectedCallbackFlag(
  supabaseAdmin: ReturnType<typeof createClient>,
  rejectionReason: string,
  payload: B2CCallbackBody,
  userId: string | null,
  extra?: Record<string, unknown>
) {
  logUnmatchedCallback(rejectionReason, payload, extra);

  const { error } = await supabaseAdmin.from("compliance_flags").insert({
    user_id: userId,
    flag_type: "suspicious_pattern",
    details: {
      source: "mpesa-b2c-callback",
      rejection_reason: rejectionReason,
      payload,
      ...extra,
    },
  });

  if (error) {
    console.error(
      "[mpesa-b2c-callback] Failed to insert compliance_flags row",
      error.message
    );
  }
}

async function findPendingWithdrawal(
  supabaseAdmin: ReturnType<typeof createClient>,
  originatorConversationId?: string,
  conversationId?: string
): Promise<PendingWithdrawalRow | null> {
  if (originatorConversationId) {
    const { data, error } = await supabaseAdmin
      .from("pending_withdrawals")
      .select(
        "id, user_id, amount, status, conversation_id, originator_conversation_id"
      )
      .eq("originator_conversation_id", originatorConversationId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as PendingWithdrawalRow;
  }

  if (conversationId) {
    const { data, error } = await supabaseAdmin
      .from("pending_withdrawals")
      .select(
        "id, user_id, amount, status, conversation_id, originator_conversation_id"
      )
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as PendingWithdrawalRow;
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let payload: B2CCallbackBody | null = null;

  try {
    payload = (await req.json()) as B2CCallbackBody;
    const result = payload.Result;
    const originatorConversationId = result?.OriginatorConversationID?.trim();
    const conversationId = result?.ConversationID?.trim();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!originatorConversationId && !conversationId) {
      await recordRejectedCallbackFlag(
        supabaseAdmin,
        "missing_conversation_identifiers",
        payload,
        null
      );
      return new Response(
        JSON.stringify({
          ResultCode: 1,
          ResultDesc: "Missing OriginatorConversationID and ConversationID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const resultCode = Number(result?.ResultCode ?? 1);
    const resultDesc = result?.ResultDesc ?? "Unknown result";

    const pendingWithdrawal = await findPendingWithdrawal(
      supabaseAdmin,
      originatorConversationId,
      conversationId
    );

    if (!pendingWithdrawal) {
      await recordRejectedCallbackFlag(
        supabaseAdmin,
        "no_match",
        payload,
        null
      );
      return new Response(
        JSON.stringify({
          ResultCode: 1,
          ResultDesc: "Unknown withdrawal reference",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (pendingWithdrawal.status !== "pending") {
      console.warn("[mpesa-b2c-callback] Ignoring callback for non-pending row", {
        pendingWithdrawalId: pendingWithdrawal.id,
        status: pendingWithdrawal.status,
        originatorConversationId:
          pendingWithdrawal.originator_conversation_id,
        conversationId,
      });
      return new Response(
        JSON.stringify({
          ResultCode: 0,
          ResultDesc:
            pendingWithdrawal.status === "completed"
              ? "Already processed"
              : "Already finalized",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      originatorConversationId &&
      originatorConversationId !==
        pendingWithdrawal.originator_conversation_id
    ) {
      await recordRejectedCallbackFlag(
        supabaseAdmin,
        "id_mismatch",
        payload,
        pendingWithdrawal.user_id,
        {
          mismatch_field: "originator_conversation_id",
          stored_originator_conversation_id:
            pendingWithdrawal.originator_conversation_id,
          pending_withdrawal_id: pendingWithdrawal.id,
        }
      );
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: "Originator ID mismatch" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (
      pendingWithdrawal.conversation_id &&
      conversationId &&
      conversationId !== pendingWithdrawal.conversation_id
    ) {
      await recordRejectedCallbackFlag(
        supabaseAdmin,
        "id_mismatch",
        payload,
        pendingWithdrawal.user_id,
        {
          mismatch_field: "conversation_id",
          stored_conversation_id: pendingWithdrawal.conversation_id,
          pending_withdrawal_id: pendingWithdrawal.id,
        }
      );
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: "Conversation ID mismatch" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const resolvedOriginatorId =
      pendingWithdrawal.originator_conversation_id;

    if (resultCode === 0) {
      const params = normalizeResultParameters(
        result?.ResultParameters?.ResultParameter
      );
      const callbackAmount = params.find(
        (item) => item.Key === "TransactionAmount"
      )?.Value;

      if (
        callbackAmount !== undefined &&
        Number(callbackAmount) !== Number(pendingWithdrawal.amount)
      ) {
        await supabaseAdmin.rpc("fail_pending_withdrawal_refund", {
          p_originator_conversation_id: resolvedOriginatorId,
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

      const { error: completeError } = await supabaseAdmin.rpc(
        "complete_pending_withdrawal",
        { p_originator_conversation_id: resolvedOriginatorId }
      );

      if (completeError) {
        return new Response(JSON.stringify({ error: completeError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      await supabaseAdmin.rpc("fail_pending_withdrawal_refund", {
        p_originator_conversation_id: resolvedOriginatorId,
        p_result_description: resultDesc,
      });
    }

    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (payload) {
      logUnmatchedCallback("handler error", payload, { error: message });
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
