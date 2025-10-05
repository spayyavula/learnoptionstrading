/**
 * Price Synchronization Utility
 * 
 * This utility ensures consistent pricing across the application,
 * particularly between the Landing page and Subscription page.
 */

// Base prices for all subscription plans
export const BASE_PRICES = {
  monthly: 29,
  yearly: 290,
  pro: 49,
  enterprise: 199
};

// Calculate yearly savings percentage
export const YEARLY_SAVINGS_PERCENT = Math.round(
  ((BASE_PRICES.monthly * 12) - BASE_PRICES.yearly) / (BASE_PRICES.monthly * 12) * 100
);

/**
 * Get the formatted price for display
 * @param price - The price to format
 * @param currency - The currency to use (default: USD)
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2
  }).format(price);
}

/**
 * Calculate discounted price
 * @param basePrice - The original price
 * @param discountPercent - The discount percentage
 * @returns The discounted price
 */
export function calculateDiscountedPrice(basePrice: number, discountPercent: number): number {
  return basePrice * (1 - discountPercent / 100);
}

/**
 * Format discount percentage for display
 * @param percent - The discount percentage
 * @returns Formatted discount string
 */
export function formatDiscount(percent: number): string {
  return `${percent}% OFF`;
}

/**
 * Get savings amount between original and discounted price
 * @param originalPrice - The original price
 * @param discountedPrice - The discounted price
 * @returns The savings amount
 */
export function getSavingsAmount(originalPrice: number, discountedPrice: number): number {
  return originalPrice - discountedPrice;
}

/**
 * Get plan details including pricing information
 * @param planId - The plan ID ('monthly', 'yearly', 'enterprise', 'pro', or 'basic')
 * @returns Plan details object
 */
export function getPlanDetails(planId: 'monthly' | 'yearly' | 'enterprise' | 'pro' | 'basic') {
  let basePrice;
  let interval;
  let name;
  
  if (planId === 'basic' || planId === 'monthly') {
    basePrice = BASE_PRICES.monthly; // $29
    interval = 'month';
    name = 'Monthly Plan';
  } else if (planId === 'yearly') {
    basePrice = BASE_PRICES.yearly; // $290
    interval = 'year';
    name = 'Annual Plan';
  } else if (planId === 'enterprise') {
    basePrice = BASE_PRICES.enterprise; // $25
    interval = 'month';
    name = 'Enterprise Plan';
  } else if (planId === 'pro') {
    basePrice = BASE_PRICES.pro; // $75
    interval = 'month';
    name = 'Pro Plan';
  } else {
    basePrice = BASE_PRICES.monthly; // Default to monthly/basic
    interval = 'month';
    name = 'Monthly Plan';
  }
  
  return {
    id: planId,
    name,
    price: basePrice,
    interval,
    features: [
      'Full access to all trading features',
      'Advanced analytics and reporting',
      'Community integration features',
      'Priority support',
      ...(planId === 'yearly' || planId === 'enterprise' ? ['Exclusive webinars and tutorials'] : []),
      ...(planId === 'enterprise' ? ['Custom branding options', 'Dedicated account manager'] : [])
    ]
  };
}

// Add debug logging
console.log('🔍 priceSync.ts - BASE_PRICES:', BASE_PRICES);
console.log('🔍 priceSync.ts - YEARLY_SAVINGS_PERCENT:', YEARLY_SAVINGS_PERCENT);