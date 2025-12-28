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
    console.log("ParadisePays webhook received:", JSON.stringify(payload, null, 2));

    const transactionId = payload.transaction_id || payload.external_id;
    const status = payload.status?.toLowerCase();

    if (!transactionId) {
      console.error("No transaction ID in webhook payload");
      return new Response(
        JSON.stringify({ error: "No transaction ID provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing transaction ${transactionId} with status ${status}`);

    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("genesys_transaction_id", transactionId.toString())
      .eq("provider", "paradisepays")
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching transaction:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch transaction" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!transaction) {
      console.log(`Transaction ${transactionId} not found in database`);
      return new Response(
        JSON.stringify({ status: "transaction not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const statusMap: Record<string, string> = {
      pending: "pending",
      approved: "approved",
      failed: "failed",
      refunded: "cancelled",
    };

    const mappedStatus = statusMap[status] || "pending";

    console.log(`Updating transaction status to: ${mappedStatus}`);

    const updateData: any = {
      status: mappedStatus,
      updated_at: new Date().toISOString(),
      updated_via_webhook: true,
      webhook_updated_at: new Date().toISOString(),
      webhook_payload: payload,
    };

    if (mappedStatus === "approved" && !transaction.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", transaction.id);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update transaction" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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