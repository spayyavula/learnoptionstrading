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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing environment variables")
    }

    // Initialize Stripe
    const stripe = new (await import("npm:stripe@12.0.0")).default(STRIPE_SECRET_KEY)
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Get request body
    const { customer_id, return_url } = await req.json()

    if (!customer_id) {
      throw new Error("Customer ID is required")
    }

    // Get user ID from auth header
    const authHeader = req.headers.get("Authorization")
    let userId = null
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "")
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error) {
        console.error("Error getting user:", error)
      } else if (user) {
        userId = user.id
      }
    }

    // Verify the customer belongs to this user
    if (userId) {
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("customer_id, user_id")
        .eq("customer_id", customer_id)
        .single()
      
      if (error) {
        console.error("Error fetching subscription:", error)
      } else if (subscription && subscription.user_id !== userId) {
        throw new Error("Unauthorized access to customer portal")
      }
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: return_url || `${req.headers.get("origin")}/app/settings`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error creating customer portal session:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})