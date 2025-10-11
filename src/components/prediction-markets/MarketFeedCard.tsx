import React from 'react'
import { TrendingUp, TrendingDown, Users, MessageCircle, Newspaper, Clock, Flame, Zap } from 'lucide-react'
import { PredictionMarket } from '../../services/kalshiService'

interface MarketFeedCardProps {
  market: PredictionMarket
  onQuickTrade: (market: PredictionMarket) => void
  onViewDetails: (market: PredictionMarket) => void
  showBadges?: boolean
}

export const MarketFeedCard: React.FC<MarketFeedCardProps> = ({
  market,
  onQuickTrade,
  onViewDetails,
  showBadges = true
}) => {
  const yesProb = (market.yes_price || 0.5) * 100
  const noProb = (market.no_price || 0.5) * 100
  const volume24h = market.volume || 0
  const isHighVolume = volume24h > 50000
  const isExpiringSoon = market.expiration_time &&
    new Date(market.expiration_time).getTime() - Date.now() < 24 * 60 * 60 * 1000

  // Calculate price movement (mock - would be real in production)
  const priceChange = Math.random() * 20 - 10 // -10 to +10
  const isRising = priceChange > 0

  // Category emoji mapping
  const categoryEmoji: Record<string, string> = {
    politics: '🏛️',
    economics: '📊',
    sports: '⚽',
    entertainment: '🎬',
    technology: '💻',
    weather: '🌤️',
    default: '📈'
  }

  const emoji = categoryEmoji[market.category?.toLowerCase() || 'default'] || categoryEmoji.default

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`
    return vol.toString()
  }

  const getExpiryText = () => {
    if (!market.expiration_time) return null
    const now = new Date()
    const expiry = new Date(market.expiration_time)
    const diff = expiry.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d`
    if (hours > 0) return `${hours}h`
    return 'Soon'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {market.category || 'General'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {showBadges && isHighVolume && (
              <span className="flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-semibold">
                <Flame className="w-3 h-3 mr-1" />
                Hot
              </span>
            )}
            {showBadges && isExpiringSoon && (
              <span className="flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold">
                <Clock className="w-3 h-3 mr-1" />
                {getExpiryText()}
              </span>
            )}
          </div>
        </div>

        {/* Question */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 leading-tight line-clamp-2 min-h-[3.5rem]">
          {market.title}
        </h3>

        {/* Probability Meter */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Market says:</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {yesProb.toFixed(0)}%
            </span>
          </div>

          {/* Visual Probability Bar */}
          <div className="relative h-3 bg-gradient-to-r from-red-100 via-gray-100 to-green-100 dark:from-red-900/30 dark:via-gray-700 dark:to-green-900/30 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
              style={{ width: `${yesProb}%` }}
            />
            {/* Pointer */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-900 dark:bg-white rounded-full shadow-lg transition-all duration-500"
              style={{ left: `calc(${yesProb}% - 2px)` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400">0% (Won't happen)</span>
            <span className="text-gray-500 dark:text-gray-400">100% (Will happen)</span>
          </div>
        </div>

        {/* YES/NO Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* YES Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 rounded-lg p-3 border-2 border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-green-700 dark:text-green-400">YES</span>
              {isRising && (
                <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {yesProb.toFixed(1)}%
            </div>
            <div className="text-xs text-green-600 dark:text-green-500">
              ${(market.yes_price || 0).toFixed(2)}
            </div>
          </div>

          {/* NO Card */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30 rounded-lg p-3 border-2 border-red-200 dark:border-red-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-red-700 dark:text-red-400">NO</span>
              {!isRising && (
                <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {noProb.toFixed(1)}%
            </div>
            <div className="text-xs text-red-600 dark:text-red-500">
              ${(market.no_price || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {formatVolume(market.volume || 0)}
            </span>
            <span className="flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {formatVolume(market.open_interest || 0)} OI
            </span>
          </div>

          {priceChange !== 0 && (
            <span className={`flex items-center font-semibold ${
              isRising ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isRising ? '+' : ''}{priceChange.toFixed(1)}% (24h)
            </span>
          )}
        </div>

        {/* Mock engagement stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pb-3 border-b border-gray-200 dark:border-gray-700">
          <span className="flex items-center">
            <MessageCircle className="w-3 h-3 mr-1" />
            {Math.floor(Math.random() * 500)} comments
          </span>
          <span className="flex items-center">
            <Newspaper className="w-3 h-3 mr-1" />
            {Math.floor(Math.random() * 10)} news
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-0 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onQuickTrade(market)}
          className="flex items-center justify-center py-3 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-r border-gray-200 dark:border-gray-700"
        >
          <Zap className="w-4 h-4 mr-2" />
          Quick Trade
        </button>
        <button
          onClick={() => onViewDetails(market)}
          className="flex items-center justify-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Details →
        </button>
      </div>
    </div>
  )
}
