// src/services/stripeCheckout.ts
import { loadStripe } from '@stripe/stripe-js'

// Only initialize Stripe if we have a publishable key
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

export const createCheckoutSession = async (priceId: string, planName: string) => {
  // In development, just simulate the checkout
  if (import.meta.env.DEV) {
    console.log('🔧 Development mode - simulating checkout:', { priceId, planName })
    alert(`Development Mode\n\nWould redirect to Stripe checkout for:\n• Plan: ${planName}\n• Price: ${priceId}\n\nThis will work in production!`)
    return
  }

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        planName,
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/`,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const session = await response.json()

    if (stripePromise) {
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
    } else {
      throw new Error('Stripe not initialized - missing publishable key')
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}