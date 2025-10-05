import { formatPrice } from '../utils/priceSync'

interface Coupon {
  id: string
  code: string
  name: string
  description: string
  type: 'percentage' | 'fixed_amount'
  value: number
  minAmount?: number
  maxDiscount?: number
  validFrom: Date
  validUntil: Date
  usageLimit?: number
  usedCount: number
  isActive: boolean
  applicablePlans: string[]
  isFirstTimeOnly: boolean
  createdAt: Date
}

interface CouponValidation {
  isValid: boolean
  coupon?: Coupon
  discountAmount: number
  finalAmount: number
  error?: string
}

interface Deal {
  id: string
  name: string
  description: string
  couponCode: string
  originalPrice: number
  discountedPrice: number
  discountPercentage: number
  validFrom: Date
  validUntil: Date
  isActive: boolean
  isFeatured: boolean
  plan: 'monthly' | 'yearly'
}

export class CouponService {
  /**
   * Validate coupon code
   * Note: In production, this should call your backend API to validate coupons
   */
  static validateCoupon(
    code: string, 
    plan: 'monthly' | 'yearly' | 'enterprise' | 'pro', 
    amount: number,
    isFirstTime: boolean = false
  ): CouponValidation {
    // In production, this should make an API call to your backend
    // For now, return invalid for all coupons since we don't have a backend
    return {
      isValid: false,
      discountAmount: 0,
      finalAmount: amount,
      error: 'Coupon validation requires backend integration'
    }
  }

  /**
   * Apply coupon (should increment usage count on backend)
   * Note: In production, this should call your backend API
   */
  static applyCoupon(code: string): void {
    // In production, this should make an API call to your backend
    // to increment the usage count for the coupon
    console.warn('Coupon application requires backend integration')
  }

  /**
   * Get coupon by code
   * Note: In production, this should call your backend API
   */
  static getCouponByCode(code: string): Coupon | null {
    // In production, this should make an API call to your backend
    return null
  }

  /**
   * Get active deals
   * Note: In production, this should call your backend API
   */
  static getActiveDeals(): Deal[] {
    // Return a simple static promotional deal
    return [
      {
        id: 'launch_special',
        name: 'Launch Special',
        description: 'Get started with options trading today!',
        couponCode: 'LAUNCH',
        originalPrice: 29,
        discountedPrice: 19,
        discountPercentage: 34,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31'),
        isActive: true,
        isFeatured: true,
        plan: 'monthly'
      }
    ]
  }

  /**
   * Get featured deal
   * Note: In production, this should call your backend API
   */
  static getFeaturedDeal(): Deal | null {
    const deals = this.getActiveDeals()
    return deals.find(deal => deal.isFeatured) || null
  }

  /**
   * Check if there are any active deals
   */
  static hasActiveDeals(): boolean {
    return this.getActiveDeals().length > 0
  }

  /**
   * Get deal by plan
   */
  static getDealByPlan(plan: 'monthly' | 'yearly'): Deal | null {
    const deals = this.getActiveDeals()
    return deals.find(deal => deal.plan === plan) || null
  }

  /**
   * Format discount display
   */
  static formatDiscount(coupon: Coupon): string {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% OFF`
    } else {
      return `${formatPrice(coupon.value)} OFF`
    }
  }
}