import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY not configured");
      throw new Error("ElevenLabs API key not configured");
    }

    // Get agent_id from request body or use default
    let agentId: string | undefined;
    
    try {
      const body = await req.json();
      agentId = body.agent_id;
    } catch {
      // No body or invalid JSON, will use default
    }

    if (!agentId) {
      // You need to create an agent at https://elevenlabs.io/app/conversational-ai
      // and set the agent ID here or pass it in the request
      console.error("No agent_id provided and no default configured");
      throw new Error("Agent ID is required. Create an agent at ElevenLabs and provide the agent_id.");
    }

    console.log(`Getting conversation token for agent: ${agentId}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Successfully obtained conversation token");

    // The API returns signed_url, but we need to format it as a token for WebRTC
    return new Response(
      JSON.stringify({ 
        token: data.signed_url,
        signed_url: data.signed_url 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting conversation token:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
