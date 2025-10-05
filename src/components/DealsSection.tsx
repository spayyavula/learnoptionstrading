import React from 'react'
import { Clock, Tag, Zap, Gift } from 'lucide-react'
import { CouponService } from '../services/couponService'
import { formatPrice } from '../utils/priceSync'

type PlanType = 'monthly' | 'yearly' | 'enterprise' | 'pro'

interface DealsSectionProps {
  onSelectDeal?: (deal: any) => void
  onClaimDeal?: (deal: any) => void
  selectedPlan?: PlanType
  className?: string
}

export default function DealsSection({ onSelectDeal, onClaimDeal, selectedPlan, className = '' }: DealsSectionProps) {
  const deals = CouponService.getActiveDeals()
  const featuredDeal = CouponService.getFeaturedDeal()

  if (deals.length === 0) {
    return null
  }

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h left`
    } else if (hours > 0) {
      return `${hours}h left`
    } else {
      return 'Ending soon!'
    }
  }

  return (
    <div className={className}>
      {/* Featured Deal Banner */}
      {featuredDeal && (
        <div className="mb-6 p-6 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl text-white relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <Zap className="h-6 w-6 text-yellow-300" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <Gift className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">Featured Deal</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">{featuredDeal.name}</h3>
            <p className="text-red-100 mb-4">{featuredDeal.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold">
                  {formatPrice(featuredDeal.discountedPrice).replace('$', '')}
                  <span className="text-lg line-through text-red-200 ml-2">
                    {formatPrice(featuredDeal.originalPrice)}
                  </span>
                </div>
                <div className="bg-yellow-400 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                  {featuredDeal.discountPercentage}% OFF
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-red-100">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{formatTimeRemaining(featuredDeal.validUntil)}</span>
                </div>
                <button
                  onClick={() => onClaimDeal?.(featuredDeal)}
                  className="mt-2 bg-white text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                >
                  Claim Deal
                </button>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-white opacity-10 rounded-full"></div>
        </div>
      )}

      {/* Other Active Deals */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {deals.filter(deal => !deal.isFeatured).map((deal) => (
          <div
            key={deal.id}
            className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
              selectedPlan === deal.plan
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onClaimDeal?.(deal)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{deal.name}</h4>
                <p className="text-sm text-gray-600">{deal.description}</p>
              </div>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                {deal.discountPercentage}% OFF
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(deal.discountedPrice)}
                </span>
                <span className="text-sm line-through text-gray-500">
                  {formatPrice(deal.originalPrice)}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{formatTimeRemaining(deal.validUntil)}</span>
                </div>
                <div className="flex items-center space-x-1 text-blue-600 mt-1">
                  <Tag className="h-3 w-3" />
                  <span className="text-xs font-medium">{deal.couponCode}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deal Info */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Tag className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Limited Time Offers</p>
            <p>These deals are automatically applied at checkout. No additional coupon code needed!</p>
          </div>
        </div>
      </div>
    </div>
  )
}