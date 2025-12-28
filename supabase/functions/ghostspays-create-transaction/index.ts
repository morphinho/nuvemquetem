import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateTransactionRequest {
  cpf: string;
  amount: number;
  pixKey: string;
  productName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  externalCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  src?: string;
  sck?: string;
  productId?: string;
  userAgent?: string;
  userIp?: string;
}

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

    const data: CreateTransactionRequest = await req.json();

    const cleanCpf = data.cpf.replace(/\D/g, "");
    const amountInCents = Math.round(data.amount * 100);
    const externalRef = `ghostspays_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const auth = "Basic " + btoa(`${settings.secret_key}:${settings.company_id}`);

    const payload: any = {
      amount: amountInCents,
      paymentMethod: "PIX",
      customer: {
        name: data.customerName || "Cliente",
        email: data.customerEmail || `${cleanCpf}@cliente.com`,
        phone: data.customerPhone || "11999999999",
        document: cleanCpf,
      },
      items: [
        {
          title: data.productName || "Produto Digital",
          unitPrice: amountInCents,
          quantity: 1,
          externalRef: `item_${Date.now()}`,
        },
      ],
      postbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/ghostspays-webhook`,
      metadata: {
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
        utm_term: data.utmTerm,
        utm_content: data.utmContent,
        src: data.src,
        sck: data.sck,
        product_id: data.productId,
        user_agent: data.userAgent,
        external_ref: externalRef,
      },
    };

    console.log("Creating GhostsPays transaction:", {
      url: `${settings.api_url}/transactions`,
      hasSecretKey: !!settings.secret_key,
      hasCompanyId: !!settings.company_id,
    });

    console.log("GhostsPays payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${settings.api_url}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("GhostsPays response status:", response.status);

    const responseText = await response.text();
    console.log("GhostsPays raw response:", responseText);

    if (!response.ok) {
      console.error("GhostsPays error response:", responseText);

      let error;
      try {
        error = JSON.parse(responseText);
      } catch {
        error = { message: responseText || "Failed to create GhostsPays transaction" };
      }

      return new Response(
        JSON.stringify({ 
          error: error.message || error.error || "Failed to create GhostsPays transaction",
          details: error,
          status: response.status
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ghostspaysResponse = JSON.parse(responseText);
    console.log("GhostsPays transaction created:", JSON.stringify(ghostspaysResponse, null, 2));

    const transactionData = ghostspaysResponse.data || ghostspaysResponse;
    console.log("GhostsPays transactionData:", JSON.stringify(transactionData, null, 2));

    const pixData = transactionData.pix;
    console.log("GhostsPays pixData:", JSON.stringify(pixData, null, 2));

    const qrCodeText = pixData?.qrcode || pixData?.qrCode || pixData?.emv || pixData?.brcode || "";

    console.log("Extracted QR Code:", {
      length: qrCodeText.length,
      starts_with: qrCodeText.substring(0, 20),
      has_qrcode: !!pixData?.qrcode,
      has_qrCode: !!pixData?.qrCode,
      has_emv: !!pixData?.emv,
      has_brcode: !!pixData?.brcode,
      all_pixData_keys: pixData ? Object.keys(pixData) : []
    });

    if (!qrCodeText || qrCodeText.length < 50) {
      console.error("Invalid or empty QR code:", {
        qrCodeText,
        pixData,
        fullResponse: ghostspaysResponse
      });
      return new Response(
        JSON.stringify({
          error: "Failed to extract valid QR code from GhostsPays response",
          details: "QR code is empty or too short",
          pixData: pixData,
          availableFields: pixData ? Object.keys(pixData) : []
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!qrCodeText.startsWith("00020126") && !qrCodeText.startsWith("00020101")) {
      console.error("QR code does not have valid PIX EMV format:", qrCodeText.substring(0, 50));
      return new Response(
        JSON.stringify({
          error: "Invalid PIX QR code format",
          details: "QR code does not start with valid EMV header",
          qrCodePreview: qrCodeText.substring(0, 50)
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeText)}`;

    const { data: transaction, error: dbError } = await supabase
      .from("transactions")
      .insert({
        genesys_transaction_id: transactionData.id?.toString() || transactionData.objectId || externalRef,
        provider: "ghostspays",
        cpf: cleanCpf,
        amount: data.amount,
        pix_key: data.pixKey,
        qr_code: qrCodeText,
        qr_code_image: qrCodeImage,
        status: "pending",
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
        utm_term: data.utmTerm,
        utm_content: data.utmContent,
        src: data.src,
        sck: data.sck,
        product_id: data.productId,
        user_agent: data.userAgent,
        user_ip: data.userIp,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Database error", details: dbError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Transaction saved to database:", transaction.id);

    return new Response(JSON.stringify(transaction), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error creating GhostsPays transaction:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
