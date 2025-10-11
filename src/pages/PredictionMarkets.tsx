import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  BarChart3,
  Trophy,
  Newspaper,
  Users,
  Smartphone,
  Settings,
  Zap,
  ChevronDown
} from 'lucide-react'
import { KalshiService, PredictionMarket, PredictionMarketPosition, PredictionMarketOrder } from '../services/kalshiService'
import { supabase } from '../lib/supabase'
import { PredictionMarketsSetupWizard } from '../components/PredictionMarketsSetupWizard'
import { MarketFeedCard } from '../components/prediction-markets/MarketFeedCard'
import { QuickTradeModal } from '../components/prediction-markets/QuickTradeModal'
import { EnhancedPortfolioDashboard } from '../components/prediction-markets/EnhancedPortfolioDashboard'
import { GamificationPanel } from '../components/prediction-markets/GamificationPanel'
import { AdvancedTradingMode } from '../components/prediction-markets/AdvancedTradingMode'
import { SocialFeaturesPanel } from '../components/prediction-markets/SocialFeaturesPanel'
import { SwipeTradingInterface } from '../components/prediction-markets/SwipeTradingInterface'
import { NewsIntegrationPanel } from '../components/prediction-markets/NewsIntegrationPanel'

type ViewMode = 'discover' | 'swipe' | 'portfolio' | 'achievements' | 'news' | 'social'
type TradingMode = 'beginner' | 'advanced'

export const PredictionMarkets: React.FC = () => {
  // Configuration states
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [environment, setEnvironment] = useState<'live' | 'demo'>('demo')

  // View states
  const [viewMode, setViewMode] = useState<ViewMode>('discover')
  const [tradingMode, setTradingMode] = useState<TradingMode>('beginner')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Data states
  const [account, setAccount] = useState<any>(null)
  const [markets, setMarkets] = useState<PredictionMarket[]>([])
  const [positions, setPositions] = useState<PredictionMarketPosition[]>([])
  const [orders, setOrders] = useState<any[]>([])

  // Modal states
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null)
  const [showQuickTrade, setShowQuickTrade] = useState(false)
  const [showAdvancedTrade, setShowAdvancedTrade] = useState(false)

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Orderbook state for advanced trading
  const [orderbook, setOrderbook] = useState<any>(null)

  // Gamification states (mock for now)
  const [userLevel, setUserLevel] = useState(5)
  const [userXP, setUserXP] = useState(2340)
  const [userStreak, setUserStreak] = useState(3)

  // News states (mock for now)
  const [newsArticles, setNewsArticles] = useState<any[]>([])
  const [enabledAlerts, setEnabledAlerts] = useState<Set<string>>(new Set())

  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkConfiguration()
  }, [])

  useEffect(() => {
    if (isConfigured) {
      loadData()
      const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isConfigured, environment])

  // Generate mock gamification data
  useEffect(() => {
    if (positions.length > 0) {
      // Increment XP based on activity
      const tradesCount = orders.length
      const newXP = 2340 + (tradesCount * 25)
      setUserXP(newXP)
      setUserLevel(Math.floor(newXP / 1000) + 1)
    }
  }, [orders.length, positions.length])

  // Generate mock news articles
  useEffect(() => {
    if (markets.length > 0) {
      const mockNews = markets.slice(0, 5).map((market, idx) => ({
        id: `news-${idx}`,
        title: `Breaking: New developments in ${market.title.substring(0, 50)}...`,
        summary: `Recent analysis suggests significant implications for this market. Traders are repositioning based on new information.`,
        source: ['Bloomberg', 'Reuters', 'WSJ', 'CNBC', 'FT'][idx % 5],
        url: '#',
        published_at: new Date(Date.now() - idx * 3600000).toISOString(),
        category: market.category || 'General',
        sentiment: (['bullish_yes', 'bullish_no', 'neutral', 'bearish_yes', 'bearish_no'] as const)[idx % 5],
        impact_level: (['high', 'medium', 'low'] as const)[idx % 3],
        affected_markets: [market.ticker],
        price_change: [{
          market_ticker: market.ticker,
          before_price: market.yes_price || 0.5,
          after_price: (market.yes_price || 0.5) * (1 + (Math.random() - 0.5) * 0.1),
          change_percent: (Math.random() - 0.5) * 10
        }],
        views: Math.floor(Math.random() * 10000),
        reactions: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 100)
      }))
      setNewsArticles(mockNews)
    }
  }, [markets])

  const checkConfiguration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const configured = await KalshiService.isConfigured(user.id, environment)
      setIsConfigured(configured)

      if (!configured) {
        setShowSetup(true)
      }
    } catch (error) {
      console.error('Error checking configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load account info
      const accountData = await KalshiService.getAccount(user.id, environment)
      setAccount(accountData)

      // Load markets
      const marketsData = await KalshiService.getMarkets(user.id, environment, {
        status: 'active',
        limit: 100
      })
      setMarkets(marketsData.markets)

      // Load positions
      const positionsData = await KalshiService.getPositions(user.id, environment)
      setPositions(positionsData)

      // Load orders
      const ordersData = await KalshiService.getOrders(user.id, environment)
      setOrders(ordersData)

    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await KalshiService.syncMarkets(user.id, environment)
      await KalshiService.syncPortfolio(user.id, environment)
      await loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleQuickTrade = (market: PredictionMarket) => {
    setSelectedMarket(market)
    if (tradingMode === 'beginner') {
      setShowQuickTrade(true)
    } else {
      loadOrderbookAndShowAdvanced(market)
    }
  }

  const loadOrderbookAndShowAdvanced = async (market: PredictionMarket) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ob = await KalshiService.getMarketOrderbook(user.id, environment, market.ticker)
      setOrderbook(ob)
      setShowAdvancedTrade(true)
    } catch (err) {
      console.error('Error loading orderbook:', err)
      setShowAdvancedTrade(true) // Show anyway with empty orderbook
    }
  }

  const handleViewDetails = (market: PredictionMarket) => {
    setSelectedMarket(market)
    setViewMode('social')
  }

  const handlePlaceTrade = async (side: 'yes' | 'no', amount: number) => {
    if (!selectedMarket) return

    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const price = side === 'yes' ? selectedMarket.yes_ask : selectedMarket.no_ask
      const quantity = Math.floor(amount / (price || 0.5))

      const orderRequest: PredictionMarketOrder = {
        market_ticker: selectedMarket.ticker,
        order_type: 'market',
        side: side,
        action: 'buy',
        quantity: quantity,
        time_in_force: 'gtc'
      }

      await KalshiService.placeOrder(user.id, environment, orderRequest)

      // Refresh data
      await loadData()
      setShowQuickTrade(false)
      setSelectedMarket(null)

      // Show success (you could add a toast notification here)
      console.log('Trade placed successfully!')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAdvancedOrder = async (order: any) => {
    if (!selectedMarket) return

    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const orderRequest: PredictionMarketOrder = {
        market_ticker: selectedMarket.ticker,
        order_type: order.type,
        side: order.side,
        action: 'buy',
        quantity: order.quantity,
        limit_price: order.type === 'limit' ? order.price : undefined,
        time_in_force: order.timeInForce
      }

      await KalshiService.placeOrder(user.id, environment, orderRequest)

      // Refresh data
      await loadData()
      setShowAdvancedTrade(false)
      setSelectedMarket(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSwipeTrade = async (market: PredictionMarket, side: 'yes' | 'no', amount: number) => {
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const price = side === 'yes' ? market.yes_ask : market.no_ask
      const quantity = Math.floor(amount / (price || 0.5))

      const orderRequest: PredictionMarketOrder = {
        market_ticker: market.ticker,
        order_type: 'market',
        side: side,
        action: 'buy',
        quantity: quantity,
        time_in_force: 'gtc'
      }

      await KalshiService.placeOrder(user.id, environment, orderRequest)
      await loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleClosePosition = async (positionId: string) => {
    // This would need to be implemented in the KalshiService
    console.log('Closing position:', positionId)
    // For now, just refresh data
    await loadData()
  }

  const handleAddToPosition = async (positionId: string) => {
    // Find position and open quick trade modal
    const position = positions.find(p => p.id === positionId)
    if (position) {
      const market = markets.find(m => m.ticker === position.market_ticker)
      if (market) {
        handleQuickTrade(market)
      }
    }
  }

  const handleFollowTrader = (traderId: string) => {
    console.log('Following trader:', traderId)
    // Would implement actual follow logic
  }

  const handleCopyTrade = (traderId: string, amount: number) => {
    console.log('Copying trade from:', traderId, 'amount:', amount)
    // Would implement actual copy trade logic
  }

  const handlePostComment = (text: string, position: 'yes' | 'no' | 'neutral') => {
    console.log('Posting comment:', text, position)
    // Would implement actual comment posting
  }

  const handleUpvote = (commentId: string) => {
    console.log('Upvoting comment:', commentId)
    // Would implement actual upvote logic
  }

  const handleToggleAlert = (marketTicker: string) => {
    const newAlerts = new Set(enabledAlerts)
    if (newAlerts.has(marketTicker)) {
      newAlerts.delete(marketTicker)
    } else {
      newAlerts.add(marketTicker)
    }
    setEnabledAlerts(newAlerts)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (showSetup) {
    return (
      <PredictionMarketsSetupWizard
        onComplete={() => {
          setShowSetup(false)
          setIsConfigured(true)
          loadData()
        }}
        onCancel={() => setShowSetup(false)}
      />
    )
  }

  const filteredMarkets = markets.filter(m => {
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const categories = ['all', ...Array.from(new Set(markets.map(m => m.category).filter(Boolean)))]

  // Calculate portfolio stats
  const totalPnL = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0)
  const totalValue = account?.portfolio_value || 0
  const winningPositions = positions.filter(p => (p.unrealized_pnl || 0) > 0).length
  const winRate = positions.length > 0 ? (winningPositions / positions.length) * 100 : 0

  // Mock achievements and challenges
  const achievements = [
    {
      id: '1',
      title: 'First Trade',
      description: 'Complete your first prediction market trade',
      emoji: '🎯',
      unlocked: orders.length > 0,
      reward: 100,
      progress: Math.min(orders.length, 1),
      total: 1
    },
    {
      id: '2',
      title: 'Portfolio Builder',
      description: 'Hold 5 different positions',
      emoji: '📊',
      unlocked: positions.length >= 5,
      reward: 250,
      progress: positions.length,
      total: 5
    },
    {
      id: '3',
      title: 'Profit Maker',
      description: 'Earn $100 in total profits',
      emoji: '💰',
      unlocked: totalPnL >= 100,
      reward: 500,
      progress: Math.min(totalPnL, 100),
      total: 100
    }
  ]

  const challenges = [
    {
      id: 'c1',
      title: 'Daily Trader',
      description: 'Make 3 trades today',
      type: 'daily',
      progress: Math.min(orders.filter(o => {
        const orderDate = new Date(o.submitted_at).toDateString()
        const today = new Date().toDateString()
        return orderDate === today
      }).length, 3),
      total: 3,
      reward: 50,
      timeRemaining: '8h 23m',
      completed: false
    }
  ]

  // Get current position for selected market (for advanced trading)
  const getCurrentPosition = (ticker: string) => {
    return positions.find(p => p.market_ticker === ticker)
  }

  // Get open orders for selected market
  const getOpenOrders = (ticker: string) => {
    return orders.filter(o => o.market_ticker === ticker && ['open', 'partially_filled'].includes(o.status))
  }

  // Navigation items
  const navItems = [
    { id: 'discover' as ViewMode, label: 'Discover', icon: TrendingUp },
    { id: 'swipe' as ViewMode, label: 'Swipe', icon: Smartphone },
    { id: 'portfolio' as ViewMode, label: 'Portfolio', icon: BarChart3 },
    { id: 'achievements' as ViewMode, label: 'Achievements', icon: Trophy },
    { id: 'news' as ViewMode, label: 'News', icon: Newspaper },
    { id: 'social' as ViewMode, label: 'Social', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Prediction Markets
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by Kalshi
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              {/* Account Balance */}
              {account && (
                <div className="hidden md:block bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg px-4 py-2 border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Balance</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    ${account.available_balance.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Trading Mode Toggle */}
              <button
                onClick={() => setTradingMode(tradingMode === 'beginner' ? 'advanced' : 'beginner')}
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium dark:text-white">
                  {tradingMode === 'beginner' ? 'Beginner' : 'Advanced'}
                </span>
              </button>

              {/* Environment Selector */}
              <select
                value={environment}
                onChange={(e) => {
                  setEnvironment(e.target.value as 'live' | 'demo')
                  checkConfiguration()
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="demo">🧪 Demo</option>
                <option value="live">💰 Live</option>
              </select>

              {/* Sync Button */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sync data"
              >
                <span className={isSyncing ? 'animate-spin inline-block' : ''}>🔄</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSetup(true)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                title="Settings"
              >
                <Settings className="w-5 h-5 dark:text-white" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                <ChevronDown className={`w-5 h-5 dark:text-white transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-2 space-y-2">
              {account && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Balance</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    ${account.available_balance.toFixed(2)}
                  </div>
                </div>
              )}
              <button
                onClick={() => setTradingMode(tradingMode === 'beginner' ? 'advanced' : 'beginner')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium dark:text-white">
                  {tradingMode === 'beginner' ? 'Switch to Advanced' : 'Switch to Beginner'}
                </span>
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="mt-4 flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setViewMode(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    viewMode === item.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.id === 'portfolio' && positions.length > 0 && (
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {positions.length}
                    </span>
                  )}
                  {item.id === 'news' && newsArticles.length > 0 && (
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {newsArticles.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Discover View */}
        {viewMode === 'discover' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Market Cards Grid */}
            {filteredMarkets.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No markets found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMarkets.map((market) => (
                  <MarketFeedCard
                    key={market.ticker}
                    market={market}
                    onQuickTrade={handleQuickTrade}
                    onViewDetails={handleViewDetails}
                    showBadges={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Swipe View */}
        {viewMode === 'swipe' && (
          <div className="-mx-4 -my-6">
            <SwipeTradingInterface
              markets={markets}
              accountBalance={account?.available_balance || 1000}
              onSwipeTrade={handleSwipeTrade}
              onSkip={(market) => console.log('Skipped:', market.ticker)}
              onViewDetails={handleViewDetails}
            />
          </div>
        )}

        {/* Portfolio View */}
        {viewMode === 'portfolio' && (
          <EnhancedPortfolioDashboard
            positions={positions.map(p => ({
              ...p,
              market_title: markets.find(m => m.ticker === p.market_ticker)?.title || p.market_ticker,
              side: p.position_side,
              quantity: p.quantity,
              avg_price: p.average_price,
              current_price: p.market_price || p.average_price,
              pnl: p.unrealized_pnl || 0,
              pnl_percent: p.unrealized_pnl ? (p.unrealized_pnl / (p.average_price * p.quantity)) * 100 : 0,
              total_cost: p.average_price * p.quantity
            }))}
            stats={{
              totalValue: totalValue,
              totalPnL: totalPnL,
              todayPnL: 0, // Would need to track this
              weekPnL: totalPnL * 0.6, // Mock
              winRate: winRate,
              activePositions: positions.length,
              avgHoldTime: 5 // Mock
            }}
            onClosePosition={handleClosePosition}
            onAddToPosition={handleAddToPosition}
          />
        )}

        {/* Achievements View */}
        {viewMode === 'achievements' && (
          <GamificationPanel
            userId="user-123"
            level={userLevel}
            xp={userXP}
            xpToNext={1000}
            streak={userStreak}
            achievements={achievements}
            challenges={challenges}
          />
        )}

        {/* News View */}
        {viewMode === 'news' && (
          <NewsIntegrationPanel
            news={newsArticles}
            positions={positions.map(p => ({
              ...p,
              market_title: markets.find(m => m.ticker === p.market_ticker)?.title || p.market_ticker,
              side: p.position_side,
              quantity: p.quantity,
              avg_price: p.average_price,
              current_price: p.market_price || p.average_price,
              pnl: p.unrealized_pnl || 0,
              pnl_percent: p.unrealized_pnl ? (p.unrealized_pnl / (p.average_price * p.quantity)) * 100 : 0
            }))}
            onViewMarket={(ticker) => {
              const market = markets.find(m => m.ticker === ticker)
              if (market) {
                setSelectedMarket(market)
                setViewMode('discover')
              }
            }}
            onClosePosition={handleClosePosition}
            onToggleAlert={handleToggleAlert}
            enabledAlerts={enabledAlerts}
          />
        )}

        {/* Social View */}
        {viewMode === 'social' && (
          <SocialFeaturesPanel
            marketTicker={selectedMarket?.ticker || markets[0]?.ticker || 'MARKET'}
            onFollowTrader={handleFollowTrader}
            onCopyTrade={handleCopyTrade}
            onPostComment={handlePostComment}
            onUpvote={handleUpvote}
          />
        )}
      </div>

      {/* Quick Trade Modal (Beginner Mode) */}
      {showQuickTrade && selectedMarket && (
        <QuickTradeModal
          market={selectedMarket}
          onClose={() => {
            setShowQuickTrade(false)
            setSelectedMarket(null)
          }}
          onPlaceTrade={handlePlaceTrade}
          accountBalance={account?.available_balance || 1000}
        />
      )}

      {/* Advanced Trading Modal (Pro Mode) */}
      {showAdvancedTrade && selectedMarket && (
        <AdvancedTradingMode
          market={selectedMarket}
          onClose={() => {
            setShowAdvancedTrade(false)
            setSelectedMarket(null)
            setOrderbook(null)
          }}
          onPlaceOrder={handleAdvancedOrder}
          currentPosition={getCurrentPosition(selectedMarket.ticker)}
          orderbook={orderbook}
          openOrders={getOpenOrders(selectedMarket.ticker)}
        />
      )}
    </div>
  )
}
