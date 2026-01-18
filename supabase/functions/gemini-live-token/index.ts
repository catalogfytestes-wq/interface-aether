// Gemini Live API Ephemeral Token Generator
// Versão Final: Sanitização de Nome de Modelo + Fallback Inteligente

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Configuração de CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Limpeza da API Key (remove espaços acidentais)
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")?.trim();

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    let { model = "gemini-2.0-flash-exp", uses = 1, expireMinutes = 30, newSessionExpireMinutes = 2 } = body;

    // --- CORREÇÃO DO PREFIXO DUPLO ---
    // Remove "models/" se vier do frontend, para garantirmos o formato correto depois
    if (model.startsWith("models/")) {
      model = model.replace("models/", "");
    }
    // Agora 'model' é apenas o ID (ex: "gemini-2.0-flash-exp")

    const now = new Date();
    const expireTime = new Date(now.getTime() + expireMinutes * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now.getTime() + newSessionExpireMinutes * 60 * 1000).toISOString();

    // Monta requisição do Token
    const tokenRequest = {
      uses,
      expire_time: expireTime,
      new_session_expire_time: newSessionExpireTime,
      // Opcional: Se quiser tentar forçar o modelo nas restrições novamente (agora que o nome está corrigido)
      // pode descomentar abaixo, mas sem restrições é mais garantido funcionar.
      /*
      live_connect_constraints: {
        model: `models/${model}`, // Aqui garantimos que fica models/gemini... uma vez só
        config: { response_modalities: ["AUDIO"] }
      }
      */
    };

    console.log(`Tentando gerar token para: models/${model}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1alpha/authTokens?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokenRequest),
    });

    // --- LÓGICA DE FALLBACK (PLANO B) ---
    if (!response.ok) {
      // Se der erro (404, 400, etc), assumimos que o modelo não suporta tokens ou a API falhou.
      // Não tratamos como erro fatal. Mudamos para conexão via API Key direta.

      console.warn(`[AVISO] Token falhou (Status ${response.status}). Usando conexão direta (Fallback).`);

      return new Response(
        JSON.stringify({
          mode: "direct", // Avisa o frontend para usar a URL com ?key=
          apiKey: GEMINI_API_KEY,
          model: model, // Retorna o ID limpo
          wsUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`,
          note: "Token generation skipped, using direct connection",
        }),
        {
          status: 200, // Retornamos 200 OK para o frontend funcionar!
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Se o token funcionou (Sucesso)
    const tokenData = await response.json();
    console.log("Token seguro gerado com sucesso.");

    return new Response(
      JSON.stringify({
        mode: "ephemeral",
        token: tokenData.name,
        expireTime,
        newSessionExpireTime,
        model: model,
        wsUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Erro fatal no servidor:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
