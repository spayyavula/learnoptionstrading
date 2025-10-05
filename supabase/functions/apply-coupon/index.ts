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
    const { subscription_id, coupon_id } = await req.json()

    if (!subscription_id || !coupon_id) {
      throw new Error("Subscription ID and Coupon ID are required")
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

    // Verify the subscription belongs to this user
    if (userId) {
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("id, user_id")
        .eq("id", subscription_id)
        .single()
      
      if (error) {
        console.error("Error fetching subscription:", error)
      } else if (subscription && subscription.user_id !== userId) {
        throw new Error("Unauthorized access to subscription")
      }
    }

    // Apply coupon to subscription
    const updatedSubscription = await stripe.subscriptions.update(subscription_id, {
      coupon: coupon_id,
    })

    return new Response(JSON.stringify({ success: true, subscription: updatedSubscription }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error applying coupon:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})