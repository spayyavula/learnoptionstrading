import React, { useState, useEffect } from 'react'
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ExternalLink,
  Clock,
  Eye,
  ThumbsUp,
  MessageSquare,
  Filter,
  Bell,
  BellOff,
  X,
  ChevronRight,
  Radio
} from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  summary: string
  source: string
  url: string
  published_at: string
  category: string
  sentiment: 'bullish_yes' | 'bullish_no' | 'neutral' | 'bearish_yes' | 'bearish_no'
  impact_level: 'high' | 'medium' | 'low'
  affected_markets: string[]
  price_change?: {
    market_ticker: string
    before_price: number
    after_price: number
    change_percent: number
  }[]
  views?: number
  reactions?: number
  comments?: number
}

interface PredictionMarketPosition {
  id: string
  market_ticker: string
  market_title: string
  side: 'yes' | 'no'
  quantity: number
  avg_price: number
  current_price: number
  pnl: number
  pnl_percent: number
}

interface NewsIntegrationPanelProps {
  news: NewsArticle[]
  positions?: PredictionMarketPosition[]
  onViewMarket: (marketTicker: string) => void
  onClosePosition?: (positionId: string) => void
  onToggleAlert?: (marketTicker: string) => void
  enabledAlerts?: Set<string>
}

export const NewsIntegrationPanel: React.FC<NewsIntegrationPanelProps> = ({
  news,
  positions = [],
  onViewMarket,
  onClosePosition,
  onToggleAlert,
  enabledAlerts = new Set()
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedImpact, setSelectedImpact] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)

  // Get unique categories from news
  const categories = ['all', ...Array.from(new Set(news.map(n => n.category)))]

  // Filter news
  const filteredNews = news.filter(article => {
    if (selectedCategory !== 'all' && article.category !== selectedCategory) return false
    if (selectedImpact !== 'all' && article.impact_level !== selectedImpact) return false
    return true
  })

  // Check if article affects user's positions
  const getAffectedPositions = (article: NewsArticle): PredictionMarketPosition[] => {
    return positions.filter(pos =>
      article.affected_markets.includes(pos.market_ticker)
    )
  }

  // Get sentiment icon and color
  const getSentimentDisplay = (sentiment: NewsArticle['sentiment']) => {
    switch (sentiment) {
      case 'bullish_yes':
        return {
          icon: TrendingUp,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-900/20',
          label: 'Bullish YES',
          description: 'Likely to increase YES probability'
        }
      case 'bullish_no':
        return {
          icon: TrendingUp,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/20',
          label: 'Bullish NO',
          description: 'Likely to increase NO probability'
        }
      case 'bearish_yes':
        return {
          icon: TrendingDown,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/20',
          label: 'Bearish YES',
          description: 'Likely to decrease YES probability'
        }
      case 'bearish_no':
        return {
          icon: TrendingDown,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-900/20',
          label: 'Bearish NO',
          description: 'Likely to decrease NO probability'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          label: 'Neutral',
          description: 'No clear directional impact'
        }
    }
  }

  // Get impact badge
  const getImpactBadge = (level: NewsArticle['impact_level']) => {
    switch (level) {
      case 'high':
        return {
          label: 'HIGH IMPACT',
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          icon: '🔥'
        }
      case 'medium':
        return {
          label: 'MEDIUM IMPACT',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          icon: '⚡'
        }
      default:
        return {
          label: 'LOW IMPACT',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          icon: 'ℹ️'
        }
    }
  }

  // Format time ago
  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime()
    const published = new Date(timestamp).getTime()
    const diff = now - published

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Check if news is breaking (< 1 hour old and high impact)
  const isBreakingNews = (article: NewsArticle) => {
    const ageInHours = (Date.now() - new Date(article.published_at).getTime()) / 3600000
    return ageInHours < 1 && article.impact_level === 'high'
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Newspaper className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-xl font-bold dark:text-white">Market News</h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Filter className="w-5 h-5 dark:text-gray-300" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 animate-fadeIn">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Impact Level
              </label>
              <div className="flex gap-2">
                {['all', 'high', 'medium', 'low'].map(impact => (
                  <button
                    key={impact}
                    onClick={() => setSelectedImpact(impact)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      selectedImpact === impact
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {impact.charAt(0).toUpperCase() + impact.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {(selectedCategory !== 'all' || selectedImpact !== 'all') && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                {selectedCategory}
              </span>
            )}
            {selectedImpact !== 'all' && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                {selectedImpact} impact
              </span>
            )}
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedImpact('all')
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* News Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredNews.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No news articles found</p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedImpact('all')
              }}
              className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredNews.map(article => {
            const sentiment = getSentimentDisplay(article.sentiment)
            const impact = getImpactBadge(article.impact_level)
            const affectedPositions = getAffectedPositions(article)
            const isExpanded = expandedArticle === article.id
            const hasAlert = article.affected_markets.some(ticker => enabledAlerts.has(ticker))

            return (
              <div
                key={article.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all ${
                  isBreakingNews(article) ? 'ring-2 ring-red-500 dark:ring-red-400' : ''
                }`}
              >
                {/* Breaking News Badge */}
                {isBreakingNews(article) && (
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 flex items-center">
                    <Radio className="w-4 h-4 text-white mr-2 animate-pulse" />
                    <span className="text-white font-bold text-sm">BREAKING NEWS</span>
                  </div>
                )}

                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {/* Impact Badge */}
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${impact.color}`}>
                          {impact.icon} {impact.label}
                        </span>

                        {/* Category */}
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                          {article.category}
                        </span>

                        {/* Alert Indicator */}
                        {hasAlert && (
                          <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>

                      <h3 className="font-bold text-lg mb-1 dark:text-white leading-tight">
                        {article.title}
                      </h3>

                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>{article.source}</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeAgo(article.published_at)}
                        </div>
                      </div>
                    </div>

                    {/* Sentiment Badge */}
                    <div className={`${sentiment.bg} rounded-lg p-2 ml-3`}>
                      <sentiment.icon className={`w-6 h-6 ${sentiment.color}`} />
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                    {article.summary}
                  </p>

                  {/* Sentiment Description */}
                  <div className={`${sentiment.bg} rounded-lg p-3 mb-3`}>
                    <div className="flex items-center mb-1">
                      <sentiment.icon className={`w-4 h-4 ${sentiment.color} mr-2`} />
                      <span className={`font-semibold text-sm ${sentiment.color}`}>
                        {sentiment.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {sentiment.description}
                    </p>
                  </div>

                  {/* Price Changes */}
                  {article.price_change && article.price_change.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {article.price_change.map(change => (
                        <div
                          key={change.market_ticker}
                          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium dark:text-white mb-1">
                              {change.market_ticker}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {change.before_price.toFixed(3)} → {change.after_price.toFixed(3)}
                            </div>
                          </div>
                          <div className={`text-right ${
                            change.change_percent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            <div className="font-bold">
                              {change.change_percent >= 0 ? '+' : ''}{change.change_percent.toFixed(1)}%
                            </div>
                            <div className="text-xs">
                              {change.change_percent >= 0 ? '↗' : '↘'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Affected Positions Alert */}
                  {affectedPositions.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                            This affects {affectedPositions.length} of your position{affectedPositions.length > 1 ? 's' : ''}
                          </div>
                          <div className="space-y-2">
                            {affectedPositions.map(pos => (
                              <div
                                key={pos.id}
                                className="bg-white dark:bg-gray-800 rounded-lg p-2 flex items-center justify-between"
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-medium dark:text-white">
                                    {pos.market_title}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {pos.side.toUpperCase()} • {pos.quantity} contracts @ ${pos.avg_price.toFixed(3)}
                                  </div>
                                </div>
                                <div className={`text-right ml-2 ${
                                  pos.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  <div className="font-bold text-sm">
                                    {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                                  </div>
                                  <div className="text-xs">
                                    {pos.pnl_percent >= 0 ? '+' : ''}{pos.pnl_percent.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions for Affected Positions */}
                      {onClosePosition && affectedPositions.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          {affectedPositions.map(pos => (
                            <button
                              key={pos.id}
                              onClick={() => onClosePosition(pos.id)}
                              className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                                pos.pnl >= 0
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            >
                              {pos.pnl >= 0 ? 'Take Profit' : 'Cut Loss'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Affected Markets */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {article.affected_markets.map(ticker => (
                      <button
                        key={ticker}
                        onClick={() => onViewMarket(ticker)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        {ticker}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      {article.views !== undefined && (
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {article.views >= 1000 ? `${(article.views / 1000).toFixed(1)}K` : article.views}
                        </div>
                      )}
                      {article.reactions !== undefined && (
                        <div className="flex items-center">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {article.reactions}
                        </div>
                      )}
                      {article.comments !== undefined && (
                        <div className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {article.comments}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Alert Toggle */}
                      {onToggleAlert && article.affected_markets.length > 0 && (
                        <button
                          onClick={() => onToggleAlert(article.affected_markets[0])}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title={hasAlert ? 'Disable alerts' : 'Enable alerts'}
                        >
                          {hasAlert ? (
                            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <BellOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      )}

                      {/* Read More */}
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Read More
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Live Update Indicator */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live updates • {filteredNews.length} articles</span>
        </div>
      </div>
    </div>
  )
}
