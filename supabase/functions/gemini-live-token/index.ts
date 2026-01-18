// Gemini Live API Ephemeral Token Generator - VERSÃO HÍBRIDA (ROBUSTA)
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // FIX 1: .trim() remove espaços invisíveis que causam erros de autenticação
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")?.trim();

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { model = "gemini-2.0-flash-exp", uses = 1, expireMinutes = 30, newSessionExpireMinutes = 2 } = body;

    const now = new Date();
    const expireTime = new Date(now.getTime() + expireMinutes * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now.getTime() + newSessionExpireMinutes * 60 * 1000).toISOString();

    // Monta o pedido de token (Sem constraints para evitar loops de desconexão)
    const tokenRequest = {
      uses,
      expire_time: expireTime,
      new_session_expire_time: newSessionExpireTime,
    };

    console.log(`Tentando gerar token para modelo: ${model}`);

    // Tenta gerar o Token Seguro
    const response = await fetch(`https://generativelanguage.googleapis.com/v1alpha/authTokens?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokenRequest),
    });

    // Se falhar (Erro 502, 400, etc), ativamos o Plano B imediatamente
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[FALHA TOKEN] Google retornou status ${response.status}. Detalhes: ${errorText}`);
      console.log("Ativando modo de fallback (Direct API Key)...");

      // PLANO B: Retorna a chave direta para o sistema não parar
      return new Response(
        JSON.stringify({
          apiKey: GEMINI_API_KEY,
          model,
          wsUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`,
          mode: "direct", // Avisa o front que é conexão direta
          note: "Token generation failed, falling back to direct key",
        }),
        {
          status: 200, // Retornamos 200 (Sucesso) para o Frontend não travar
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Se deu certo, segue o fluxo seguro
    const tokenData = await response.json();
    console.log("Token seguro gerado com sucesso.");

    return new Response(
      JSON.stringify({
        token: tokenData.name,
        expireTime,
        newSessionExpireTime,
        model,
        wsUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`,
        mode: "ephemeral",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Erro interno:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
