import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAGMA_API_TOKEN = "d7c5436286e44288a459ca98de0e140bd32fe9717dcadb1c6bd13526f24a78b9";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const cpfParam = url.searchParams.get("cpf");

    if (!cpfParam) {
      return new Response(
        JSON.stringify({ error: "CPF é obrigatório" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Remove qualquer caractere não numérico do CPF
    const cpf = cpfParam.replace(/\D/g, "");

    if (cpf.length !== 11) {
      return new Response(
        JSON.stringify({ error: "CPF deve conter 11 dígitos" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const apiUrl = `https://magmadatahub.com/api.php?token=${MAGMA_API_TOKEN}&cpf=${cpf}`;
    console.log("Consultando API Magma:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    console.log("Status da resposta:", response.status);
    console.log("Resposta bruta:", responseText);

    if (!response.ok) {
      let errorMessage = "Erro ao consultar CPF";
      
      if (response.status === 400) {
        errorMessage = "Parâmetros obrigatórios ausentes";
      } else if (response.status === 403) {
        errorMessage = "Token inválido, plano expirado ou limite atingido";
      } else if (response.status === 502) {
        errorMessage = "Erro na base externa";
      }

      return new Response(
        JSON.stringify({ error: errorMessage, status: response.status }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
      
      // Valida se a resposta contém os dados esperados
      if (!data || !data.nome) {
        console.error("Resposta da API não contém dados válidos:", data);
        return new Response(
          JSON.stringify({ error: "CPF não encontrado ou dados inválidos" }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON:", parseError);
      console.error("Resposta bruta:", responseText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar resposta da API" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Retorna os dados no formato esperado
    return new Response(
      JSON.stringify({
        cpf: data.cpf || cpf,
        nome: data.nome,
        sexo: data.sexo || "",
        nascimento: data.nascimento || "",
        nome_mae: data.nome_mae || "",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", details: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});