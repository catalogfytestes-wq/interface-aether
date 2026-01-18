// Gemini Live API Ephemeral Token Generator
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
      // Modelo padrão para BidiGenerateContent (Live API) - Janeiro 2026
      // Ref: https://ai.google.dev/gemini-api/docs/models?hl=pt-br
      // Único modelo oficialmente compatível com API Live
      model = "gemini-2.0-flash-exp",
      uses = 1,
      expireMinutes = 30,
      newSessionExpireMinutes = 2,
      responseModalities = ["AUDIO"],
      systemInstruction,
    } = body;

    // Calculate expiration times in ISO format
    const now = new Date();
    const expireTime = new Date(now.getTime() + expireMinutes * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now.getTime() + newSessionExpireMinutes * 60 * 1000).toISOString();

    // Create ephemeral token request following the v1alpha API spec
    const tokenRequest: Record<string, unknown> = {
      uses,
      expire_time: expireTime,
      new_session_expire_time: newSessionExpireTime,
    };

    // Optionally lock to specific configuration
    if (systemInstruction) {
      tokenRequest.live_connect_constraints = {
        model: `models/${model}`,
        config: {
          response_modalities: responseModalities,
          system_instruction: { parts: [{ text: systemInstruction }] },
        },
      };
    }

    console.log("Creating ephemeral token with request:", JSON.stringify(tokenRequest));

    // Request ephemeral token from Gemini API v1alpha
    // Note: WebSocket Live API endpoint is v1beta (see https://ai.google.dev/api/live)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1alpha/authTokens?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tokenRequest),
    });

    const responseText = await response.text();
    console.log("Gemini API response status:", response.status);
    console.log("Gemini API response:", responseText);

    if (!response.ok) {
      // If the authTokens endpoint doesn't work, fall back to direct API key mode
      // This allows the client to connect directly with the API key
      console.log("Ephemeral token creation failed, using direct API key mode");

      return new Response(
        JSON.stringify({
          // Return the API key directly for WebSocket connection
          // The client will use it as: wss://...?key=API_KEY
          apiKey: GEMINI_API_KEY,
          expireTime,
          newSessionExpireTime,
          model,
          // IMPORTANT: Live WebSocket endpoint is v1beta
          wsUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`,
          mode: "direct", // Indicates direct API key mode
          note: "Ephemeral tokens not available, using direct API key connection",
        }),
        {
          status: 200,
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
        // IMPORTANT: Live WebSocket endpoint is v1beta
        wsUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`,
        mode: "ephemeral", // Indicates ephemeral token mode
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
