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
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const transactionId = url.searchParams.get("transactionId");

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: "Transaction ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: settings, error: settingsError } = await supabase
      .from("pix_provider_settings")
      .select("*")
      .eq("provider", "ghostspays")
      .eq("is_active", true)
      .maybeSingle();

    if (settingsError || !settings) {
      console.error("GhostsPays settings not found:", settingsError);
      return new Response(
        JSON.stringify({ error: "GhostsPays provider not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!settings.secret_key || !settings.company_id) {
      console.error("GhostsPays credentials missing");
      return new Response(
        JSON.stringify({ error: "GhostsPays credentials not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const auth = "Basic " + btoa(`${settings.secret_key}:${settings.company_id}`);

    console.log("Checking GhostsPays transaction status:", transactionId);

    const response = await fetch(`${settings.api_url}/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        "Authorization": auth,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GhostsPays status check error:", errorText);
      return new Response(
        JSON.stringify({
          error: `GhostsPays API error: ${response.status}`,
          details: errorText
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ghostspaysResponse = await response.json();
    console.log("GhostsPays transaction status:", ghostspaysResponse);

    const transactionData = ghostspaysResponse.data || ghostspaysResponse;
    const status = transactionData.status || "pending";

    const statusMap: Record<string, string> = {
      "pending": "pending",
      "waiting_payment": "pending",
      "paid": "approved",
      "authorized": "approved",
      "approved": "approved",
      "refused": "failed",
      "canceled": "cancelled",
      "cancelled": "cancelled",
      "refunded": "cancelled",
      "chargeback": "cancelled",
      "failed": "failed",
      "expired": "cancelled",
      "in_analysis": "pending",
      "in_protest": "pending",
    };

    const mappedStatus = statusMap[status.toLowerCase()] || "pending";

    return new Response(
      JSON.stringify({
        status: mappedStatus,
        originalStatus: status,
        transactionData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error checking GhostsPays transaction status:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
