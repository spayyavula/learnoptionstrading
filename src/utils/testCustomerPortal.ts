/**
 * Test utility for customer portal functionality
 */

import { StripeService } from '../services/stripeService'

export async function testCustomerPortal() {
  console.log('🧪 Testing customer portal functionality...')
  
  // First, create a mock subscription if none exists
  const status = StripeService.getSubscriptionStatus()
  
  if (!status.active) {
    console.log('📝 Creating mock subscription for testing...')
    
    // Simulate a mock checkout to create subscription data
    const mockSubscription = {
      id: `sub_test_${Date.now()}`,
      plan: 'monthly',
      status: 'active',
      created: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      coupon_applied: null,
      amount_paid: 29,
      customer_id: `cus_test_${Date.now()}`
    }
    
    localStorage.setItem('mock_subscription', JSON.stringify(mockSubscription))
    console.log('✅ Mock subscription created:', mockSubscription)
  }
  
  // Test customer portal access
  try {
    const updatedStatus = StripeService.getSubscriptionStatus()
    console.log('📊 Current subscription status:', updatedStatus)
    
    if (updatedStatus.subscription?.customer_id) {
      console.log('🏪 Testing customer portal access...')
      const portalUrl = await StripeService.createCustomerPortalSession(updatedStatus.subscription.customer_id)
      console.log('✅ Portal URL generated:', portalUrl)
      return { success: true, portalUrl, subscription: updatedStatus.subscription }
    } else {
      console.error('❌ No customer ID found')
      return { success: false, error: 'No customer ID found' }
    }
  } catch (error) {
    console.error('❌ Portal test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Add to window for easy testing in console
if (typeof window !== 'undefined') {
  (window as any).testCustomerPortal = testCustomerPortal
}
