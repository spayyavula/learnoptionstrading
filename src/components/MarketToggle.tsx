import React from 'react'
import { Globe, TrendingUp } from 'lucide-react'

export type Market = 'US' | 'INDIA'

interface MarketToggleProps {
  currentMarket: Market
  onMarketChange: (market: Market) => void
  className?: string
}

export default function MarketToggle({ currentMarket, onMarketChange, className = '' }: MarketToggleProps) {
  return (
    <div className={`inline-flex items-center bg-white border-2 border-gray-300 rounded-lg p-1 shadow-sm ${className}`}>
      <button
        onClick={() => onMarketChange('US')}
        className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-all ${
          currentMarket === 'US'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Globe className="h-4 w-4 mr-2" />
        US Markets
      </button>
      <button
        onClick={() => onMarketChange('INDIA')}
        className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold transition-all ${
          currentMarket === 'INDIA'
            ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        <span className="flex items-center">
          Indian Markets
          <span className="ml-1 text-xs">🇮🇳</span>
        </span>
      </button>
    </div>
  )
}

/**
 * Compact version for mobile
 */
export function MarketToggleCompact({ currentMarket, onMarketChange, className = '' }: MarketToggleProps) {
  return (
    <div className={`inline-flex items-center bg-white border-2 border-gray-300 rounded-lg shadow-sm ${className}`}>
      <button
        onClick={() => onMarketChange('US')}
        className={`px-3 py-2 text-xs font-bold transition-all ${
          currentMarket === 'US'
            ? 'bg-blue-600 text-white rounded-l-md'
            : 'text-gray-600'
        }`}
      >
        US
      </button>
      <button
        onClick={() => onMarketChange('INDIA')}
        className={`px-3 py-2 text-xs font-bold transition-all ${
          currentMarket === 'INDIA'
            ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white rounded-r-md'
            : 'text-gray-600'
        }`}
      >
        IN 🇮🇳
      </button>
    </div>
  )
}
