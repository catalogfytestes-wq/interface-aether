// Gemini Live API Ephemeral Token Generator
// This edge function creates short-lived tokens for secure client-side WebSocket connections

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'GEMINI_API_KEY not configured',
          setup_instructions: 'Add GEMINI_API_KEY to your Supabase secrets'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      model = 'gemini-2.0-flash-live-001',
      uses = 1,
      expireMinutes = 30,
      newSessionExpireMinutes = 2,
      responseModalities = ['AUDIO'],
      systemInstruction,
    } = body;

    // Calculate expiration times
    const now = new Date();
    const expireTime = new Date(now.getTime() + expireMinutes * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now.getTime() + newSessionExpireMinutes * 60 * 1000).toISOString();

    // Create ephemeral token request
    const tokenRequest: Record<string, unknown> = {
      uses,
      expire_time: expireTime,
      new_session_expire_time: newSessionExpireTime,
    };

    // Optionally lock to specific configuration
    if (systemInstruction) {
      tokenRequest.live_connect_constraints = {
        model,
        config: {
          response_modalities: responseModalities,
          system_instruction: systemInstruction,
        }
      };
    }

    // Request ephemeral token from Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/authTokens?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create ephemeral token',
          details: errorText,
          status: response.status
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const tokenData = await response.json();

    // Return the token with connection info
    return new Response(
      JSON.stringify({
        token: tokenData.name,
        expireTime,
        newSessionExpireTime,
        model,
        wsUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating ephemeral token:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
