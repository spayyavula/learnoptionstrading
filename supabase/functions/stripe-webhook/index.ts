import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2.38.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    })
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables")
    }

    // Initialize Stripe
    const stripe = new (await import("npm:stripe@12.0.0")).default(STRIPE_SECRET_KEY)
    
    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature")
    if (!signature) {
      throw new Error("No signature provided")
    }

    // Get the raw request body
    const body = await req.text()
    
    // Verify the webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        
        // Get customer details
        const customer = await stripe.customers.retrieve(session.customer)
        
        // Get subscription details if this is a subscription
        let subscription = null
        if (session.subscription) {
          subscription = await stripe.subscriptions.retrieve(session.subscription)
        }
        
        // Store subscription data in Supabase
        const { error } = await supabase
          .from("subscriptions")
          .upsert({
            id: session.subscription || session.id,
            customer_id: session.customer,
            user_id: session.client_reference_id, // Set during checkout creation
            status: subscription ? subscription.status : "completed",
            price_id: session.line_items?.data[0]?.price.id,
            quantity: session.line_items?.data[0]?.quantity || 1,
            cancel_at_period_end: subscription ? subscription.cancel_at_period_end : false,
            cancel_at: subscription?.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription?.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            current_period_start: subscription ? new Date(subscription.current_period_start * 1000).toISOString() : new Date().toISOString(),
            current_period_end: subscription ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            created: new Date(session.created * 1000).toISOString(),
            ended_at: subscription?.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
            trial_start: subscription?.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription?.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            metadata: session.metadata,
          })
        
        if (error) {
          console.error("Error storing subscription:", error)
          throw error
        }
        
        break
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object
        
        // Update subscription in Supabase
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            metadata: subscription.metadata,
          })
          .eq("id", subscription.id)
        
        if (error) {
          console.error("Error updating subscription:", error)
          throw error
        }
        
        break
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object
        
        // Update subscription in Supabase
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
          })
          .eq("id", subscription.id)
        
        if (error) {
          console.error("Error updating subscription:", error)
          throw error
        }
        
        break
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})