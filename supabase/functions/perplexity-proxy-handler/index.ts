import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.200.0/http/server.ts";

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const PERPLEXITY_API_URL = Deno.env.get("PERPLEXITY_API_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Considere restringir isso em produção
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Lidar com a requisição OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!PERPLEXITY_API_KEY || !PERPLEXITY_API_URL) {
    return new Response(
      JSON.stringify({ error: "Variáveis de ambiente da API Perplexity não configuradas no servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const clientPayload = await req.json();

    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(clientPayload), // O payload do cliente é repassado
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro da API Perplexity:", data);
      return new Response(
        JSON.stringify({ error: data.error || "Erro ao comunicar com a API Perplexity." }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro interno na função proxy Perplexity:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}); 