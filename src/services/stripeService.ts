import { BASE_PRICES } from '../utils/priceSync'
import { JsonDebugger } from '../utils/jsonDebugger'

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
    plan: 'monthly' | 'yearly' | 'pro' | 'enterprise'
  ): Promise<void> {
    console.log('🛒 StripeService.redirectToCheckout called with plan:', plan)
    console.log('🔍 Current URL:', window.location.href)
    console.log('🔍 Environment mode:', import.meta.env.MODE)
    
    const { 
      PUBLISHABLE_KEY,
      MONTHLY_PAYMENT_LINK,
      YEARLY_PAYMENT_LINK,
      PRO_PAYMENT_LINK,
      ENTERPRISE_PAYMENT_LINK
    } = this.getEnvVars()
    
    console.log('🔧 Environment check:', {
      DEV_MODE: import.meta.env.DEV,
      HAS_PUBLISHABLE_KEY: !!PUBLISHABLE_KEY,
      HAS_PAYMENT_LINKS: !!(MONTHLY_PAYMENT_LINK && YEARLY_PAYMENT_LINK)
    })
    
    try {
      // Production: Use Payment Links
      console.log('💳 Production mode - Using Stripe Payment Links')
      
      const paymentLinks = {
        monthly: MONTHLY_PAYMENT_LINK,
        yearly: YEARLY_PAYMENT_LINK,
        pro: PRO_PAYMENT_LINK,
        enterprise: ENTERPRISE_PAYMENT_LINK
      }
      
      const paymentLink = paymentLinks[plan]
      
      if (!paymentLink) {
        console.error('❌ No payment link for plan:', plan)
        console.error('Available payment links:', paymentLinks)
        throw new Error(`Payment link not configured for plan: ${plan}. Please contact support.`)
      }
      
      console.log('🚀 Redirecting to Stripe Payment Link:', paymentLink)
      
      // Direct redirect to Payment Link - NO API CALLS
      window.location.href = paymentLink
      
    } catch (error) {
      console.error('❌ Checkout error:', error)
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
   * Customer portal (requires backend in production)
   */
  static async createCustomerPortalSession(customerId: string): Promise<string> {
    throw new Error('Customer portal requires backend integration in production')
  }

  /**
   * Check subscription status (requires backend in production)
   */
  static getSubscriptionStatus(): { active: boolean; plan?: string; subscription?: any; termsAccepted?: boolean } {
    return { active: false, termsAccepted: false }
  }
}