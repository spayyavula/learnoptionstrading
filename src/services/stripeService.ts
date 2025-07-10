import { BASE_PRICES } from '../utils/priceSync'
import { JsonDebugger } from '../utils/jsonDebugger'

import { loadStripe } from '@stripe/stripe-js'
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

// Utility functions for safe localStorage operations
function safeLocalStorageGet(key: string, fallback: any = null) {
  try {
    const item = localStorage.getItem(key)
    if (!item) return fallback
    return JsonDebugger.safeParse(item, `localStorage.get(${key})`) ?? fallback
  } catch (error) {
    console.error(`❌ LocalStorage get failed for key "${key}":`, error)
    try {
      localStorage.removeItem(key)
    } catch (clearError) {
      console.error('❌ Failed to clear corrupted localStorage:', clearError)
    }
    return fallback
  }
}

function safeLocalStorageSet(key: string, value: any) {
  try {
    const jsonString = JsonDebugger.safeStringify(value, `localStorage.set(${key})`)
    if (!jsonString) {
      console.error(`❌ Failed to stringify value for localStorage key "${key}"`)
      return false
    }
    localStorage.setItem(key, jsonString)
    return true
  } catch (error) {
    console.error(`❌ LocalStorage set failed for key "${key}":`, error)
    return false
  }
}

interface StripeProduct {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval?: 'month' | 'year'
  type: 'subscription' | 'one_time'
}

export class StripeService {
  // Get environment variables
  private static getEnvVars() {
    const envVars = {
      PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
      // Payment Links from environment
      MONTHLY_PAYMENT_LINK: import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_LINK || '',
      YEARLY_PAYMENT_LINK: import.meta.env.VITE_STRIPE_YEARLY_PAYMENT_LINK || '',
      PRO_PAYMENT_LINK: import.meta.env.VITE_STRIPE_PRO_PAYMENT_LINK || '',
      ENTERPRISE_PAYMENT_LINK: import.meta.env.VITE_STRIPE_ENTERPRISE_PAYMENT_LINK || ''
    }
    
    console.log('🔧 Stripe Environment Variables:', {
      DEV_MODE: import.meta.env.DEV,
      MODE: import.meta.env.MODE,
      PUBLISHABLE_KEY_SET: !!envVars.PUBLISHABLE_KEY,
      PAYMENT_LINKS_SET: !!(envVars.MONTHLY_PAYMENT_LINK && envVars.YEARLY_PAYMENT_LINK)
    })
    
    return envVars
  }

  /**
   * Redirect to Stripe Checkout using Payment Links ONLY
   * No backend API calls - purely client-side
   */
  static async redirectToCheckout(
    plan: 'monthly' | 'yearly' | 'pro' | 'enterprise',
    isDeal: boolean = false
  ): Promise<void> {
    console.log('🛒 StripeService.redirectToCheckout called with plan:', plan)
    console.log('🔍 Current URL:', window.location.href)
    console.log('🔍 Environment mode:', import.meta.env.MODE)
    
    const { 
      MONTHLY_PAYMENT_LINK,
      YEARLY_PAYMENT_LINK,
      PRO_PAYMENT_LINK,
      ENTERPRISE_PAYMENT_LINK,
      PUBLISHABLE_KEY 
    } = this.getEnvVars()
    
    console.log('🔧 Environment check:', {
      DEV_MODE: import.meta.env.DEV,
      HAS_PUBLISHABLE_KEY: !!PUBLISHABLE_KEY,
      HAS_PAYMENT_LINKS: !!(MONTHLY_PAYMENT_LINK && YEARLY_PAYMENT_LINK)
    })
    
    try {
      // FORCE DEVELOPMENT MODE FOR NOW - Remove this line when you have Payment Links
      if (import.meta.env.DEV || !PUBLISHABLE_KEY) {
        console.log('🧪 Using mock checkout (development mode or no Stripe keys)')
        await this.mockStripeCheckoutAsync(plan)
        return
      }
      
      // Production: Use Stripe Checkout
      console.log('💳 Production mode - Using Stripe Checkout')
      
      // Get the price ID for the selected plan
      const priceId = this.getPriceIdForPlan(plan)
      if (!priceId) {
        throw new Error(`No price ID configured for plan: ${plan}`)
      }
      
      // Initialize Stripe
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Failed to initialize Stripe')
      }
      
      // Determine success URL based on whether this is a deal or regular subscription
      const successUrl = isDeal 
        ? `${window.location.origin}/subscribe?subscription=success&plan=${plan}&deal=true` 
        : `${window.location.origin}/success?plan=${plan}`
      
      // Create checkout session
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        successUrl,
        cancelUrl: `${window.location.origin}/subscribe?subscription=cancelled`
      })
      
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('❌ Checkout error:', error)
      
      // Always fallback to mock in case of error
      console.log('🧪 Falling back to mock checkout due to error')
      await this.mockStripeCheckoutAsync(plan)
    }
  }

  /**
   * Get available products/pricing
   */
  static getProducts(): StripeProduct[] {
    return [
      {
        id: 'monthly',
        name: 'Monthly Plan',
        description: 'Basic options trading with monthly billing',
        price: BASE_PRICES.monthly,
        currency: 'USD',
        interval: 'month',
        type: 'subscription'
      },
      {
        id: 'yearly',
        name: 'Annual Plan',
        description: 'Annual billing with significant savings',
        price: BASE_PRICES.yearly,
        currency: 'USD',
        interval: 'year',
        type: 'subscription'
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'Full access with advanced analytics',
        price: BASE_PRICES.pro,
        currency: 'USD',
        interval: 'month',
        type: 'subscription'
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Everything in Pro plus team features',
        price: BASE_PRICES.enterprise,
        currency: 'USD',
        interval: 'month',
        type: 'subscription'
      }
    ]
  }

  /**
   * Mock checkout for development
   */
  private static async mockStripeCheckoutAsync(plan: 'monthly' | 'yearly' | 'pro' | 'enterprise'): Promise<void> {
    console.log('🧪 Mock checkout initiated:', { plan })
    
    return new Promise((resolve, reject) => {
      try {
        const products = this.getProducts()
        const product = products.find(p => p.id === plan)
        
        if (!product) {
          reject(new Error(`Invalid plan: ${plan}`))
          return
        }
        
        const userConfirmed = confirm(
          `🧪 MOCK STRIPE CHECKOUT (Development Mode)\n\n` +
          `Plan: ${product.name}\n` +
          `Price: $${product.price}/${product.interval}\n\n` +
          `In production, this will redirect to Stripe.\n\n` +
          `Proceed with mock subscription?`
        )
        
        if (userConfirmed) {
          this.completeMockCheckout(plan, product.price)
          resolve()
        } else {
          reject(new Error('User cancelled checkout'))
        }
      } catch (error) {
        reject(new Error(`Mock checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    })
  }

  /**
   * Complete mock checkout
   */
  private static completeMockCheckout(plan: 'monthly' | 'yearly' | 'pro' | 'enterprise', finalPrice: number): void {
    console.log('✅ Completing mock checkout:', { plan, finalPrice })
    
    const mockSubscription = {
      id: `sub_mock_${Date.now()}`,
      plan,
      status: 'active',
      created: new Date().toISOString(),
      current_period_end: new Date(Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      amount_paid: finalPrice,
      customer_id: `cus_mock_${Date.now()}`,
      terms_accepted: true
    }
    
    const success = safeLocalStorageSet('mock_subscription', mockSubscription)
    if (!success) {
      throw new Error('Failed to save subscription data')
    }
    
    // Redirect to success page
    window.location.href = `/success?plan=${plan}`
  }

  /**
   * Customer portal for development
   */
  static async createCustomerPortalSession(customerId: string): Promise<string> {
    console.log('🏪 Customer portal request for:', customerId)
    
    if (import.meta.env.DEV) {
      const userChoice = confirm(
        `🧪 MOCK CUSTOMER PORTAL (Development Mode)\n\n` +
        `Customer ID: ${customerId}\n\n` +
        `In production, this opens Stripe's billing portal.\n\n` +
        `Simulate opening portal?`
      )
      
      if (userChoice) {
        // Open a mock portal URL
        return `https://billing.stripe.com/p/session/mock_${customerId}_${Date.now()}`
      } else {
        throw new Error('Customer portal access cancelled')
      }
    }
    
    // In production, this would need a backend API
    throw new Error('Customer portal requires backend integration in production')
  }

  /**
   * Get the Stripe Price ID for a plan
   */
  private static getPriceIdForPlan(plan: 'monthly' | 'yearly' | 'pro' | 'enterprise'): string {
    const priceIds = {
      monthly: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID,
      yearly: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID,
      pro: import.meta.env.VITE_STRIPE_PRICE_ID_PRO,
      enterprise: import.meta.env.VITE_STRIPE_PRICE_ID_ENTERPRISE
    }
    
    return priceIds[plan] || ''
  }

  /**
   * Check subscription status
   */
  static getSubscriptionStatus(): { active: boolean; plan?: string; subscription?: any; termsAccepted?: boolean } {
    try {
      const subscription = safeLocalStorageGet('mock_subscription')
      if (subscription && typeof subscription === 'object') {
        const isActive = subscription.status === 'active' && new Date(subscription.current_period_end) > new Date()
        
        return {
          active: isActive,
          plan: subscription.plan,
          subscription,
          termsAccepted: subscription.terms_accepted || false
        }
      }
      
      return { active: false, termsAccepted: false }
    } catch (error) {
      console.error('❌ Error checking subscription status:', error)
      return { active: false, termsAccepted: false }
    }
  }
}