// src/services/stripeCheckout.ts
import { loadStripe } from '@stripe/stripe-js'

// Only initialize Stripe if we have a publishable key
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

export const redirectToCheckout = async (sessionId: string) => {
  if (!stripePromise) {
    throw new Error('Stripe.js has not been loaded.')
  }

  const stripe = await stripePromise

  const { error } = await stripe.redirectToCheckout({ sessionId })

  if (error) {
    throw new Error(error.message)
  }
}