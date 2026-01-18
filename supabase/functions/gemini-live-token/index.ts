// Gemini Live API Ephemeral Token Generator - VERSÃO CORRIGIDA E FINAL
// This edge function creates short-lived tokens for secure client-side WebSocket connections

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY not configured",
          setup_instructions: "Add GEMINI_API_KEY to your Supabase secrets",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      // Modelo correto para a Live API (Jan 2026)
      model = "gemini-2.0-flash-exp",
      uses = 1,
      expireMinutes = 30,
      newSessionExpireMinutes = 2,
    } = body;

    // Calculate expiration times in ISO format
    const now = new Date();
    const expireTime = new Date(now.getTime() + expireMinutes * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now.getTime() + newSessionExpireMinutes * 60 * 1000).toISOString();

    // Criação do pedido do token
    // NOTA: Removidas as 'live_connect_constraints' para evitar o erro de desconexão imediata (Handshake Failure)
    const tokenRequest: Record<string, unknown> = {
      uses,
      expire_time: expireTime,
      new_session_expire_time: newSessionExpireTime,
    };

    console.log("Creating ephemeral token (NO CONSTRAINTS) for:", model);

    // Request ephemeral token from Gemini API v1alpha
    const response = await fetch(`https://generativelanguage.googleapis.com/v1alpha/authTokens?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tokenRequest),
    });

    const responseText = await response.text();

    // LOG APENAS PARA DEBUG (Pode remover depois se quiser limpar o console)
    // console.log("Gemini API response status:", response.status);

    if (!response.ok) {
      console.error("Failed to generate token:", responseText);

      // SEGURANÇA: Retornamos erro 502 em vez de expor a API Key
      return new Response(
        JSON.stringify({
          error: "Failed to generate ephemeral token from Google",
          details: responseText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse token response:", responseText);
      throw new Error("Invalid response from Gemini API");
    }

    console.log("Token created successfully:", tokenData.name);

    // Return the token with connection info
    return new Response(
      JSON.stringify({
        token: tokenData.name,
        expireTime,
        newSessionExpireTime,
        model,
        // URL oficial do WebSocket v1beta
        wsUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`,
        mode: "ephemeral",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error creating ephemeral token:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
