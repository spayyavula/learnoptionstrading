import React, { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Filter, Info, TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react'
import { PolygonService } from '../services/polygonService'
import { SentimentHeatmapService, type HeatmapData, type HeatmapCell, type HeatmapFilters } from '../services/sentimentHeatmapService'
import { LiquidOptionsSentimentService } from '../services/liquidOptionsSentimentService'

interface LiquidOptionsSentimentHeatmapProps {
  className?: string
  onCellClick?: (cell: HeatmapCell) => void
  initialTickers?: string[]
  showControls?: boolean
  compact?: boolean
}

export default function LiquidOptionsSentimentHeatmap({
  className = '',
  onCellClick,
  initialTickers,
  showControls = true,
  compact = false
}: LiquidOptionsSentimentHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null)

  const [filters, setFilters] = useState<HeatmapFilters>({
    tickers: initialTickers,
    expiry_type: 'All',
    sentiment_mode: 'composite',
    min_confidence: 0
  })

  const liquidTickers = useMemo(() => LiquidOptionsSentimentService.getLiquidTickers(), [])

  useEffect(() => {
    loadHeatmap()
  }, [filters])

  const loadHeatmap = async () => {
    try {
      setLoading(true)
      const allContracts = PolygonService.getAllOptionsContracts()
      const data = await SentimentHeatmapService.getHeatmapData(allContracts, filters)
      setHeatmapData(data)
    } catch (error) {
      console.error('Error loading heatmap:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await SentimentHeatmapService.cleanExpiredCache()
    await loadHeatmap()
    setRefreshing(false)
  }

  const handleCellClick = (cell: HeatmapCell) => {
    setSelectedCell(cell)
    if (onCellClick) {
      onCellClick(cell)
    }
  }

  const handleFilterChange = (key: keyof HeatmapFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading sentiment heatmap...</p>
        </div>
      </div>
    )
  }

  if (!heatmapData || heatmapData.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">No sentiment data available</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Data
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {showControls && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-600" />
                Liquid Options Sentiment Heatmap
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Real-time sentiment analysis combining news, analyst ratings, and market events
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  showFilters
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Type
                </label>
                <select
                  value={filters.expiry_type}
                  onChange={(e) => handleFilterChange('expiry_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Expiries</option>
                  <option value="0DTE">0DTE (Today)</option>
                  <option value="Daily">Daily (1-3 days)</option>
                  <option value="Weekly">Weekly (4-7 days)</option>
                  <option value="Monthly">Monthly (8-45 days)</option>
                  <option value="LEAPS">LEAPS (365+ days)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sentiment Mode
                </label>
                <select
                  value={filters.sentiment_mode}
                  onChange={(e) => handleFilterChange('sentiment_mode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="composite">Composite (All Sources)</option>
                  <option value="news_only">News Only (FinBERT)</option>
                  <option value="analyst_only">Analyst Ratings Only</option>
                  <option value="momentum">Sentiment Momentum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Confidence ({filters.min_confidence}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.min_confidence}
                  onChange={(e) => handleFilterChange('min_confidence', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Tickers
                </label>
                <div className="text-sm text-gray-600">
                  {filters.tickers?.length || liquidTickers.length} tickers
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">Total Contracts</p>
              <p className="text-2xl font-bold text-blue-900">{heatmapData.total_cells}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-600 font-medium mb-1">Avg Sentiment</p>
              <p className="text-2xl font-bold text-green-900">
                {heatmapData.avg_sentiment.toFixed(1)}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-600 font-medium mb-1">Active Tickers</p>
              <p className="text-2xl font-bold text-purple-900">{heatmapData.tickers.length}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-600 font-medium mb-1">Last Updated</p>
              <p className="text-sm font-medium text-orange-900">
                {new Date(heatmapData.last_updated).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 overflow-x-auto">
        <div className="min-w-max">
          {heatmapData.rows.map((row, rowIndex) => (
            <div key={`${row.ticker}-${row.expiry_date}`} className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-gray-900">{row.ticker}</h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  {row.expiry_date} ({row.days_to_expiry}d) - {row.expiry_type}
                </span>
              </div>

              <div className="flex gap-6">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Calls
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {row.calls.slice(0, compact ? 5 : 10).map((cell) => (
                      <HeatmapCellComponent
                        key={cell.contract_ticker}
                        cell={cell}
                        onClick={() => handleCellClick(cell)}
                        selected={selectedCell?.contract_ticker === cell.contract_ticker}
                        compact={compact}
                        minSentiment={heatmapData.min_sentiment}
                        maxSentiment={heatmapData.max_sentiment}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    Puts
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {row.puts.slice(0, compact ? 5 : 10).map((cell) => (
                      <HeatmapCellComponent
                        key={cell.contract_ticker}
                        cell={cell}
                        onClick={() => handleCellClick(cell)}
                        selected={selectedCell?.contract_ticker === cell.contract_ticker}
                        compact={compact}
                        minSentiment={heatmapData.min_sentiment}
                        maxSentiment={heatmapData.max_sentiment}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="font-semibold">Legend:</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-xs">Very Bearish</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                  <span className="text-xs">Neutral</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className="text-xs">Very Bullish</span>
                </div>
              </div>
            </div>
            <div className="text-sm">
              <span className="font-semibold">Trends:</span>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <span>⏫ Accelerating</span>
                <span>📈 Rising</span>
                <span>➡️ Stable</span>
                <span>📉 Falling</span>
                <span>⏬ Decelerating</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <Info className="w-4 h-4 inline mr-1" />
            Click any cell for detailed sentiment breakdown
          </div>
        </div>
      </div>
    </div>
  )
}

interface HeatmapCellComponentProps {
  cell: HeatmapCell
  onClick: () => void
  selected: boolean
  compact: boolean
  minSentiment: number
  maxSentiment: number
}

function HeatmapCellComponent({
  cell,
  onClick,
  selected,
  compact,
  minSentiment,
  maxSentiment
}: HeatmapCellComponentProps) {
  const gradientClass = SentimentHeatmapService.getSentimentGradient(
    cell.sentiment_score,
    minSentiment,
    maxSentiment
  )

  const opacity = SentimentHeatmapService.getConfidenceOpacity(cell.confidence)

  return (
    <div
      onClick={onClick}
      className={`
        ${gradientClass}
        ${selected ? 'ring-4 ring-blue-500 ring-offset-2' : ''}
        rounded-lg p-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg
        ${compact ? 'text-xs' : 'text-sm'}
      `}
      style={{ opacity }}
      title={`${cell.sentiment_label} (${cell.sentiment_score.toFixed(1)}) - Strike: $${cell.strike_price}`}
    >
      <div className="font-bold">${cell.strike_price}</div>
      {!compact && (
        <>
          <div className="text-xs mt-1">{cell.sentiment_score.toFixed(0)}</div>
          <div className="text-lg">{cell.trend_icon}</div>
        </>
      )}
    </div>
  )
}
