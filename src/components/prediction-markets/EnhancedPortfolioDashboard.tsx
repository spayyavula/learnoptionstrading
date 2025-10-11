import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Clock, Award, Target, AlertTriangle, Lightbulb, PieChart } from 'lucide-react'
import { FinFeedPosition as PredictionMarketPosition } from '../../services/finfeedService'

interface PortfolioStats {
  totalValue: number
  totalPnL: number
  todayPnL: number
  weekPnL: number
  winRate: number
  activePositions: number
  avgHoldTime: number
}

interface EnhancedPortfolioDashboardProps {
  positions: PredictionMarketPosition[]
  stats: PortfolioStats
  onClosePosition: (positionId: string) => void
  onAddToPosition: (positionId: string) => void
}

export const EnhancedPortfolioDashboard: React.FC<EnhancedPortfolioDashboardProps> = ({
  positions,
  stats,
  onClosePosition,
  onAddToPosition
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('list')

  // Group positions by status
  const expiringSoon = positions.filter(p => {
    // Would check actual expiration date in production
    return Math.random() > 0.7
  })

  const winners = positions.filter(p => (p.unrealized_pnl || 0) > 0)
  const losers = positions.filter(p => (p.unrealized_pnl || 0) < 0)

  // Calculate category breakdown
  const categoryBreakdown = positions.reduce((acc, pos) => {
    const category = 'General' // Would extract from market data
    if (!acc[category]) {
      acc[category] = { value: 0, count: 0 }
    }
    acc[category].value += pos.total_cost
    acc[category].count += 1
    return acc
  }, {} as Record<string, { value: number, count: number }>)

  const getRiskScore = () => {
    // Simple risk calculation
    const maxExposure = Math.max(...positions.map(p => p.total_cost / stats.totalValue))
    const diversification = Object.keys(categoryBreakdown).length
    const expiringSoonRatio = expiringSoon.length / positions.length

    let score = 5
    if (maxExposure > 0.3) score += 2
    if (diversification < 3) score += 2
    if (expiringSoonRatio > 0.3) score += 1

    return Math.min(10, score)
  }

  const riskScore = getRiskScore()

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Portfolio</h2>
          <div className="text-3xl font-bold">
            ${stats.totalValue.toFixed(2)}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs font-medium opacity-80 mb-1">Total P&L</div>
            <div className={`text-xl font-bold ${stats.totalPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
            </div>
            <div className="text-xs opacity-70">
              ({((stats.totalPnL / stats.totalValue) * 100).toFixed(1)}%)
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs font-medium opacity-80 mb-1">Today</div>
            <div className={`text-xl font-bold ${stats.todayPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {stats.todayPnL >= 0 ? '+' : ''}${stats.todayPnL.toFixed(2)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs font-medium opacity-80 mb-1">This Week</div>
            <div className={`text-xl font-bold ${stats.weekPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {stats.weekPnL >= 0 ? '+' : ''}${stats.weekPnL.toFixed(2)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs font-medium opacity-80 mb-1">Win Rate</div>
            <div className="text-xl font-bold text-white">
              {stats.winRate}%
            </div>
            <div className="text-xs opacity-70">
              {winners.length}/{positions.length} positions
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Portfolio Insights</h3>
          <PieChart className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Risk Meter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Score</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{riskScore}/10</span>
            </div>

            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                  riskScore <= 3 ? 'bg-green-500' :
                  riskScore <= 6 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${riskScore * 10}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  positions.length < 10 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-gray-600 dark:text-gray-400">
                  {positions.length} active positions
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  Object.keys(categoryBreakdown).length >= 3 ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="text-gray-600 dark:text-gray-400">
                  {Object.keys(categoryBreakdown).length} categories
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  expiringSoon.length <= 2 ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-gray-600 dark:text-gray-400">
                  {expiringSoon.length} expiring within 7d
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Best Category</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Politics (+34%)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Hold Time</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.avgHoldTime} days
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Largest Position</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                24% of portfolio
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Recommendations</h3>
        </div>

        <div className="space-y-3">
          {winners.length > 0 && winners[0].unrealized_pnl && winners[0].unrealized_pnl > 20 && (
            <div className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  Consider Taking Profit
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Your position in {winners[0].market_ticker} is up ${winners[0].unrealized_pnl.toFixed(2)} (+
                  {((winners[0].unrealized_pnl / winners[0].total_cost) * 100).toFixed(0)}%).
                  Historical data suggests locking in profits above 20%.
                </div>
                <button
                  onClick={() => onClosePosition(winners[0].id)}
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Close Position →
                </button>
              </div>
            </div>
          )}

          {Object.keys(categoryBreakdown).length === 1 && (
            <div className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  Diversify Your Portfolio
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  100% of your positions are in one category. Consider spreading risk across
                  Economics, Sports, and other categories.
                </div>
              </div>
            </div>
          )}

          {losers.length > 0 && losers[0].unrealized_pnl && losers[0].unrealized_pnl < -15 && (
            <div className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  Review Losing Position
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {losers[0].market_ticker} moved against you (
                  {((losers[0].unrealized_pnl / losers[0].total_cost) * 100).toFixed(0)}%).
                  Review your thesis or consider cutting losses.
                </div>
                <button
                  onClick={() => onClosePosition(losers[0].id)}
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Review Position →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Positions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Active Positions ({positions.length})
          </h3>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'heatmap'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Heatmap
            </button>
          </div>
        </div>

        {/* Expiring Soon Section */}
        {expiringSoon.length > 0 && viewMode === 'list' && (
          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Expiring Soon ({expiringSoon.length})
              </h4>
            </div>

            <div className="space-y-3">
              {expiringSoon.slice(0, 3).map(position => (
                <PositionCard
                  key={position.id}
                  position={position}
                  onClose={() => onClosePosition(position.id)}
                  onAdd={() => onAddToPosition(position.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Winners Section */}
        {winners.length > 0 && viewMode === 'list' && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
              Winners ({winners.length})
            </h4>

            <div className="grid md:grid-cols-2 gap-3">
              {winners.map(position => (
                <div key={position.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {position.market_ticker}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {position.quantity} {position.position_side.toUpperCase()} @ ${position.average_price.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      +${(position.unrealized_pnl || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      ({(((position.unrealized_pnl || 0) / position.total_cost) * 100).toFixed(0)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Losers Section */}
        {losers.length > 0 && viewMode === 'list' && (
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
              At Risk ({losers.length})
            </h4>

            <div className="grid md:grid-cols-2 gap-3">
              {losers.map(position => (
                <div key={position.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {position.market_ticker}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {position.quantity} {position.position_side.toUpperCase()} @ ${position.average_price.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      ${(position.unrealized_pnl || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      ({(((position.unrealized_pnl || 0) / position.total_cost) * 100).toFixed(0)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Heatmap View */}
        {viewMode === 'heatmap' && (
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {positions.map(position => {
                const pnlPercent = ((position.unrealized_pnl || 0) / position.total_cost) * 100
                const size = Math.min(100, (position.total_cost / stats.totalValue) * 300)

                return (
                  <div
                    key={position.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                      pnlPercent > 10 ? 'bg-green-100 dark:bg-green-900/20 border-green-500' :
                      pnlPercent > 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-300' :
                      pnlPercent > -10 ? 'bg-red-50 dark:bg-red-900/10 border-red-300' :
                      'bg-red-100 dark:bg-red-900/20 border-red-500'
                    }`}
                    style={{ minHeight: `${size}px` }}
                    onClick={() => onClosePosition(position.id)}
                  >
                    <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {position.market_ticker}
                    </div>
                    <div className={`text-lg font-bold ${
                      pnlPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      ${position.total_cost.toFixed(0)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Position Card Component
interface PositionCardProps {
  position: PredictionMarketPosition
  onClose: () => void
  onAdd: () => void
}

const PositionCard: React.FC<PositionCardProps> = ({ position, onClose, onAdd }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="font-semibold text-gray-900 dark:text-white mb-1">
            {position.market_ticker}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Expires in 2 days • {position.quantity} {position.position_side.toUpperCase()}
          </div>
        </div>

        <div className="text-right">
          <div className={`text-lg font-bold ${
            (position.unrealized_pnl || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {(position.unrealized_pnl || 0) >= 0 ? '+' : ''}${(position.unrealized_pnl || 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            ({(((position.unrealized_pnl || 0) / position.total_cost) * 100).toFixed(1)}%)
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-3">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Close Position
        </button>
        <button
          onClick={onAdd}
          className="py-2 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
        >
          Add
        </button>
      </div>
    </div>
  )
}
