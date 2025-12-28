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
      .eq("provider", "paradisepays")
      .eq("is_active", true)
      .maybeSingle();

    if (settingsError || !settings) {
      console.error("ParadisePays settings not found:", settingsError);
      return new Response(
        JSON.stringify({ error: "ParadisePays provider not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!settings.api_key) {
      console.error("ParadisePays API Key missing");
      return new Response(
        JSON.stringify({ error: "ParadisePays API Key must be configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data: CreateTransactionRequest = await req.json();

    const cleanCpf = data.cpf.replace(/\D/g, "");
    const amountInCents = Math.round(data.amount * 100);

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existingTransaction, error: checkError } = await supabase
      .from("transactions")
      .select("*")
      .eq("cpf", cleanCpf)
      .eq("amount", data.amount)
      .eq("provider", "paradisepays")
      .in("status", ["pending", "authorized", "approved", "completed"])
      .gte("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingTransaction && !checkError) {
      console.log("Reusing existing ParadisePays transaction:", existingTransaction.id);
      return new Response(JSON.stringify(existingTransaction), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const externalRef = `paradise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payload: any = {
      amount: amountInCents,
      description: data.productName || "Produto Digital",
      reference: externalRef,
      customer: {
        name: data.customerName || "Cliente",
        email: data.customerEmail || `${cleanCpf}@cliente.com`,
        document: cleanCpf,
        phone: data.customerPhone || "11999999999",
      },
    };

    if (settings.product_hash) {
      payload.productHash = settings.product_hash;
    }

    if (data.utmSource || data.utmMedium || data.utmCampaign || data.utmContent || data.utmTerm || data.src || data.sck) {
      payload.tracking = {
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
        utm_content: data.utmContent,
        utm_term: data.utmTerm,
        src: data.src,
        sck: data.sck,
      };
    }

    if (settings.recipient_id) {
      const recipientIdNum = parseInt(settings.recipient_id, 10);
      if (!isNaN(recipientIdNum) && recipientIdNum > 0) {
        payload.splits = [
          {
            recipientId: recipientIdNum,
            amount: Math.round(amountInCents * 0.1)
          }
        ];
      }
    }

    console.log("Creating ParadisePays transaction:", {
      url: `${settings.api_url}/transaction.php`,
      hasApiKey: !!settings.api_key,
      hasProductHash: !!settings.product_hash,
      hasSplits: !!settings.recipient_id,
      isStandalonePix: !settings.product_hash,
    });

    console.log("ParadisePays payload:", JSON.stringify(payload, null, 2));

    let response: Response;
    let lastError: any;
    const maxRetries = 3;
    const baseDelay = 2000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        response = await fetch(`${settings.api_url}/transaction.php`, {
          method: "POST",
          headers: {
            "X-API-Key": settings.api_key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        console.log(`ParadisePays response status (attempt ${attempt + 1}):`, response.status);

        if (response.status === 429) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Rate limited. Retrying in ${delay}ms...`);

          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        if (response.ok || response.status !== 429) {
          break;
        }
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Request failed. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!response!) {
      return new Response(
        JSON.stringify({
          error: "Falha ao conectar com o processador de pagamentos",
          details: lastError?.message
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const responseText = await response.text();
    console.log("ParadisePays raw response:", responseText);

    if (!response.ok) {
      console.error("ParadisePays error response:", responseText);

      let error;
      try {
        error = JSON.parse(responseText);
      } catch {
        error = { message: responseText || "Failed to create ParadisePays transaction" };
      }

      return new Response(
        JSON.stringify({ 
          error: error.message || error.error || "Failed to create ParadisePays transaction",
          details: error,
          status: response.status
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const paradisepaysResponse = JSON.parse(responseText);
    console.log("ParadisePays transaction created:", JSON.stringify(paradisepaysResponse, null, 2));

    const transactionId = paradisepaysResponse.transaction_id || paradisepaysResponse.id || externalRef;
    const qrCodeText = paradisepaysResponse.qr_code || paradisepaysResponse.qr_code_base64 || "";
    const qrCodeImage = qrCodeText
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeText)}`
      : "";

    const { data: transaction, error: dbError } = await supabase
      .from("transactions")
      .insert({
        genesys_transaction_id: transactionId.toString(),
        provider: "paradisepays",
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
    console.error("Error creating ParadisePays transaction:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});