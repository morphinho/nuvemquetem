import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    console.log("🔔 GhostsPays webhook received:", JSON.stringify(payload, null, 2));

    const webhookType = payload.type || "";
    const transactionData = payload.data || payload;

    const transactionId = transactionData.id?.toString() || transactionData.objectId?.toString();
    const status = transactionData.status?.toLowerCase();

    console.log("📋 Webhook details:", {
      webhookType,
      transactionId,
      status,
      hasData: !!payload.data,
      dataKeys: Object.keys(payload.data || payload)
    });

    if (!transactionId) {
      console.error("❌ No transaction ID in webhook payload");
      return new Response(
        JSON.stringify({ error: "No transaction ID provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🔍 Processing transaction ${transactionId} with status ${status}`);

    console.log(`🔎 Searching for transaction with genesys_transaction_id=${transactionId} and provider=ghostspays`);

    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("genesys_transaction_id", transactionId)
      .eq("provider", "ghostspays")
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Error fetching transaction:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch transaction" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!transaction) {
      console.log(`⚠️ Transaction ${transactionId} not found in database`);
      return new Response(
        JSON.stringify({ status: "transaction not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Transaction found in database:`, {
      id: transaction.id,
      currentStatus: transaction.status,
      genesysTransactionId: transaction.genesys_transaction_id
    });

    const statusMap: Record<string, string> = {
      pending: "pending",
      waiting_payment: "pending",
      paid: "approved",
      authorized: "approved",
      approved: "approved",
      refused: "failed",
      canceled: "cancelled",
      cancelled: "cancelled",
      refunded: "cancelled",
      chargeback: "cancelled",
      failed: "failed",
      expired: "cancelled",
      in_analysis: "pending",
      in_protest: "pending",
    };

    const mappedStatus = statusMap[status] || "pending";

    console.log(`🔄 Status mapping: "${status}" -> "${mappedStatus}"`);
    console.log(`💾 Updating transaction ${transaction.id} to status: ${mappedStatus}`);

    const updateData: any = {
      status: mappedStatus,
      updated_at: new Date().toISOString(),
      updated_via_webhook: true,
      webhook_updated_at: new Date().toISOString(),
    };

    if (mappedStatus === "approved" && !transaction.completed_at) {
      updateData.completed_at = new Date().toISOString();
      console.log(`✨ Setting completed_at timestamp`);
    }

    const { error: updateError } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", transaction.id);

    if (updateError) {
      console.error("❌ Error updating transaction:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update transaction" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Transaction ${transaction.id} updated successfully to status: ${mappedStatus}`);

    if (mappedStatus === "approved") {
      const { error: receiptError } = await supabase
        .from("payment_receipts")
        .update({
          status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("transaction_id", transaction.id)
        .eq("status", "pending_receipt");

      if (receiptError) {
        console.error("Error updating receipt:", receiptError);
      }
    }

    console.log("Transaction updated successfully");

    return new Response(
      JSON.stringify({ status: "success", updatedStatus: mappedStatus }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});