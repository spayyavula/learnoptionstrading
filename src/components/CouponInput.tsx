import React, { useState } from 'react'
import { Tag, Check, X, Loader } from 'lucide-react'
import { CouponService } from '../services/couponService'

type PlanType = 'monthly' | 'yearly' | 'enterprise' | 'pro'

interface CouponInputProps {
  plan: PlanType
  originalAmount: number
  onCouponApplied: (validation: any) => void
  onCouponRemoved: () => void
  appliedCoupon?: any
  className?: string
}

export default function CouponInput({
  plan,
  originalAmount,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
  className = ''
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setIsValidating(true)
    setError('')

    if (!couponCode.trim()) {
      setError('Please enter a coupon code')
      setIsValidating(false)
      return
    }

    // Simulate API delay
    await new Promise(resolve => globalThis.setTimeout(resolve, 500))
    
    const validation = CouponService.validateCoupon(
      couponCode.trim(),
      plan,
      originalAmount,
      true // Mark as first time for testing purposes
    )
    
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log('Coupon validation result:', {
        code: couponCode.trim(),
        plan,
        originalAmount,
        validation
      })
    }
    
    if (validation.isValid) {
      onCouponApplied(validation)
      setCouponCode('')
    } else {
      setError(validation.error || 'Invalid coupon code')
    }
    
    setIsValidating(false)
  }

  const handleRemoveCoupon = () => {
    onCouponRemoved()
    setError('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon()
    }
  }

  if (appliedCoupon) {
    return (
      <div className={`flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-green-600" />
          <div>
            <span className="text-sm font-medium text-green-800">
              {appliedCoupon.coupon.code} Applied
            </span>
            <p className="text-xs text-green-600">
              {CouponService.formatDiscount(appliedCoupon.coupon)} - {appliedCoupon.coupon.description}
            </p>
          </div>
        </div>
        <button
          onClick={handleRemoveCoupon}
          className="text-green-600 hover:text-green-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isValidating}
          />
        </div>
        <button
          onClick={handleApplyCoupon}
          disabled={!couponCode.trim() || isValidating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isValidating ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </button>
      </div>
      
      {error && (
        <div className="mt-2 flex items-center space-x-1 text-red-600">
          <X className="h-3 w-3" />
          <span className="text-xs">{error}</span>
        </div>
      )}
    </div>
  )
}