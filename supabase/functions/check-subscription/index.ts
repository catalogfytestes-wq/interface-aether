import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Plan mapping
const PLAN_MAP: Record<string, string> = {
  "prod_Tms35MHEzolpvU": "starter",
  "prod_Tms3uWEAIsHvEf": "pro",
  "prod_Tms3DCHIZA9BD6": "business",
  "prod_Tms4YUGymMxC6z": "enterprise",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First, check if user has a manual subscription in the database (without Stripe)
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If there's a manual subscription (no stripe_customer_id but has plan_id and is active)
    if (existingSub && 
        existingSub.status === 'active' && 
        existingSub.plan_id && 
        !existingSub.stripe_customer_id) {
      
      const periodEnd = existingSub.current_period_end ? new Date(existingSub.current_period_end) : null;
      const isValid = !periodEnd || periodEnd > new Date();
      
      if (isValid) {
        logStep("Found valid manual subscription", { 
          planId: existingSub.plan_id, 
          endDate: existingSub.current_period_end 
        });
        
        return new Response(JSON.stringify({
          subscribed: true,
          plan_id: existingSub.plan_id,
          plan_name: existingSub.plan_id,
          subscription_end: existingSub.current_period_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Check Stripe for subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      
      // Don't update if there's an existing manual subscription
      if (!existingSub || existingSub.stripe_customer_id) {
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            plan_id: null,
            status: 'inactive',
            stripe_customer_id: null,
            stripe_subscription_id: null,
            current_period_end: null,
          }, { onConflict: 'user_id' });
      }

      return new Response(JSON.stringify({ 
        subscribed: false,
        plan_id: null,
        plan_name: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let planId = null;
    let planName = null;
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;
    let stripePriceId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const productId = subscription.items.data[0].price.product as string;
      stripePriceId = subscription.items.data[0].price.id;
      planId = productId;
      planName = PLAN_MAP[productId] || "unknown";
      logStep("Active Stripe subscription found", { 
        subscriptionId: subscription.id, 
        productId,
        planName,
        endDate: subscriptionEnd 
      });

      // Update database with Stripe subscription info
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: planName,
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_price_id: stripePriceId,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: subscriptionEnd,
        }, { onConflict: 'user_id' });

    } else {
      logStep("No active Stripe subscription found");
      
      // Only update to inactive if there's no manual subscription
      if (!existingSub || existingSub.stripe_customer_id) {
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            plan_id: null,
            status: 'inactive',
            stripe_customer_id: customerId,
            stripe_subscription_id: null,
            current_period_end: null,
          }, { onConflict: 'user_id' });
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_id: planId,
      plan_name: planName,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
