import React, { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Download, Filter, ZoomIn, ZoomOut, Info, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { SentimentHeatmapService, type HeatmapData, type HeatmapFilters } from '../services/sentimentHeatmapService'
import { LiquidOptionsSentimentService } from '../services/liquidOptionsSentimentService'
import { PolygonService } from '../services/polygonService'

interface SentimentHeatMapViewerProps {
  defaultTickers?: string[]
  defaultExpiryType?: 'All' | '0DTE' | 'Daily' | 'Weekly' | 'Monthly' | 'LEAPS'
  defaultSentimentMode?: 'composite' | 'news_only' | 'analyst_only' | 'momentum'
  onCellClick?: (contractTicker: string) => void
  height?: number
}

export default function SentimentHeatMapViewer({
  defaultTickers,
  defaultExpiryType = 'Weekly',
  defaultSentimentMode = 'composite',
  onCellClick,
  height = 800
}: SentimentHeatMapViewerProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<HeatmapFilters>({
    tickers: defaultTickers,
    expiry_type: defaultExpiryType,
    sentiment_mode: defaultSentimentMode,
    min_confidence: 30
  })
  const [showFilters, setShowFilters] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [selectedCell, setSelectedCell] = useState<string | null>(null)

  const liquidTickers = LiquidOptionsSentimentService.getLiquidTickers()

  useEffect(() => {
    loadHeatmap()
  }, [filters])

  const loadHeatmap = async () => {
    setLoading(true)
    setError(null)
    try {
      const contracts = PolygonService.getAllOptionsContracts()
      const data = await SentimentHeatmapService.getHeatmapData(contracts, filters)
      setHeatmapData(data)
    } catch (err) {
      console.error('Error loading heatmap:', err)
      setError(err instanceof Error ? err.message : 'Failed to load heatmap data')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!heatmapData) return

    const csvRows = []
    csvRows.push(['Ticker', 'Expiry', 'Type', 'Strike', 'Sentiment', 'Trend', 'Confidence', 'News Count', 'Analyst Count'])

    heatmapData.rows.forEach(row => {
      [...row.calls, ...row.puts].forEach(cell => {
        csvRows.push([
          cell.underlying_ticker,
          cell.expiration_date,
          cell.contract_type,
          cell.strike_price.toString(),
          cell.sentiment_score.toFixed(2),
          cell.sentiment_trend,
          cell.confidence.toString(),
          cell.news_count.toString(),
          cell.analyst_count.toString()
        ])
      })
    })

    const csvContent = csvRows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sentiment-heatmap-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCellClick = (contractTicker: string) => {
    setSelectedCell(contractTicker)
    onCellClick?.(contractTicker)
  }

  const filteredStats = useMemo(() => {
    if (!heatmapData) return null

    const bullishCells = heatmapData.rows.flatMap(r => [...r.calls, ...r.puts]).filter(c => c.sentiment_score > 30)
    const bearishCells = heatmapData.rows.flatMap(r => [...r.calls, ...r.puts]).filter(c => c.sentiment_score < -30)
    const neutralCells = heatmapData.rows.flatMap(r => [...r.calls, ...r.puts]).filter(c => Math.abs(c.sentiment_score) <= 30)

    return {
      bullish: bullishCells.length,
      bearish: bearishCells.length,
      neutral: neutralCells.length,
      totalCells: heatmapData.total_cells
    }
  }, [heatmapData])

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-white rounded-lg shadow-lg p-8" style={{ height: `${height}px` }}>
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading sentiment heatmap...</p>
          <p className="text-gray-400 text-sm mt-2">Analyzing market sentiment across liquid options</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 text-red-800">
          <Info className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Error Loading Heatmap</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!heatmapData || heatmapData.rows.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No sentiment data available</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or refresh the data</p>
        <button
          onClick={loadHeatmap}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Refresh Data
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sentiment HeatMap</h2>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered sentiment analysis for {heatmapData.total_cells} liquid options contracts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-gray-300 mx-2" />

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Toggle Filters"
            >
              <Filter className="w-5 h-5" />
            </button>

            <button
              onClick={handleExportCSV}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export CSV"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={loadHeatmap}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Type</label>
              <select
                value={filters.expiry_type}
                onChange={(e) => setFilters({ ...filters, expiry_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Expiries</option>
                <option value="0DTE">0DTE</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="LEAPS">LEAPS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sentiment Mode</label>
              <select
                value={filters.sentiment_mode}
                onChange={(e) => setFilters({ ...filters, sentiment_mode: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="composite">Composite Score</option>
                <option value="news_only">News Sentiment Only</option>
                <option value="analyst_only">Analyst Ratings Only</option>
                <option value="momentum">Sentiment Momentum</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Confidence</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.min_confidence || 0}
                onChange={(e) => setFilters({ ...filters, min_confidence: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tickers</label>
              <select
                multiple
                value={filters.tickers || []}
                onChange={(e) => setFilters({ ...filters, tickers: Array.from(e.target.selectedOptions, option => option.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                size={3}
              >
                {liquidTickers.map(ticker => (
                  <option key={ticker} value={ticker}>{ticker}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600 font-medium">Bullish</p>
                <p className="text-lg font-bold text-green-900">{filteredStats?.bullish || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-xs text-red-600 font-medium">Bearish</p>
                <p className="text-lg font-bold text-red-900">{filteredStats?.bearish || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-xs text-yellow-600 font-medium">Neutral</p>
                <p className="text-lg font-bold text-yellow-900">{filteredStats?.neutral || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600 font-medium">Last Updated</p>
                <p className="text-xs font-medium text-blue-900">
                  {new Date(heatmapData.last_updated).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 overflow-x-auto" style={{ maxHeight: `${height - 200}px`, overflowY: 'auto' }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          {heatmapData.rows.map((row) => (
            <div key={`${row.ticker}-${row.expiry_date}`} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-bold text-gray-900">{row.ticker}</h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {row.expiry_date} ({row.days_to_expiry}d)
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {row.expiry_type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Calls ({row.calls.length})
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {row.calls.slice(0, 10).map((cell) => (
                      <div
                        key={cell.contract_ticker}
                        onClick={() => handleCellClick(cell.contract_ticker)}
                        className={`${SentimentHeatmapService.getSentimentGradient(
                          cell.sentiment_score,
                          heatmapData.min_sentiment,
                          heatmapData.max_sentiment
                        )} rounded-lg p-3 text-center cursor-pointer hover:scale-105 hover:shadow-lg transition-all ${
                          selectedCell === cell.contract_ticker ? 'ring-4 ring-blue-500' : ''
                        }`}
                        style={{ opacity: SentimentHeatmapService.getConfidenceOpacity(cell.confidence) }}
                        title={`${cell.sentiment_label}\nScore: ${cell.sentiment_score.toFixed(1)}\nConfidence: ${cell.confidence}%\nNews: ${cell.news_count} | Analyst: ${cell.analyst_count}`}
                      >
                        <div className="text-xs font-bold">${cell.strike_price}</div>
                        <div className="text-base font-bold">{cell.sentiment_score.toFixed(0)}</div>
                        {cell.trend_icon && <div className="text-lg">{cell.trend_icon}</div>}
                        {cell.volume !== undefined && cell.volume !== null && <div className="text-xs mt-1">Vol: {cell.volume}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Puts ({row.puts.length})
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {row.puts.slice(0, 10).map((cell) => (
                      <div
                        key={cell.contract_ticker}
                        onClick={() => handleCellClick(cell.contract_ticker)}
                        className={`${SentimentHeatmapService.getSentimentGradient(
                          cell.sentiment_score,
                          heatmapData.min_sentiment,
                          heatmapData.max_sentiment
                        )} rounded-lg p-3 text-center cursor-pointer hover:scale-105 hover:shadow-lg transition-all ${
                          selectedCell === cell.contract_ticker ? 'ring-4 ring-blue-500' : ''
                        }`}
                        style={{ opacity: SentimentHeatmapService.getConfidenceOpacity(cell.confidence) }}
                        title={`${cell.sentiment_label}\nScore: ${cell.sentiment_score.toFixed(1)}\nConfidence: ${cell.confidence}%\nNews: ${cell.news_count} | Analyst: ${cell.analyst_count}`}
                      >
                        <div className="text-xs font-bold">${cell.strike_price}</div>
                        <div className="text-base font-bold">{cell.sentiment_score.toFixed(0)}</div>
                        {cell.trend_icon && <div className="text-lg">{cell.trend_icon}</div>}
                        {cell.volume !== undefined && cell.volume !== null && <div className="text-xs mt-1">Vol: {cell.volume}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-600 rounded"></div>
              <span className="text-gray-700">Very Bearish (-100 to -60)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-yellow-300 rounded"></div>
              <span className="text-gray-700">Neutral (-10 to 10)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-600 rounded"></div>
              <span className="text-gray-700">Very Bullish (60 to 100)</span>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Sentiment Mode: {filters.sentiment_mode ? filters.sentiment_mode.replace('_', ' ').toUpperCase() : 'COMPOSITE'}
          </div>
        </div>
      </div>
    </div>
  )
}
