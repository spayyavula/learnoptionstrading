import React, { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { PolygonService } from '../services/polygonService'
import { SentimentHeatmapService, type HeatmapData } from '../services/sentimentHeatmapService'

export default function ScreenerHeatMap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHeatmap()
  }, [])

  const loadHeatmap = async () => {
    setLoading(true)
    try {
      const contracts = PolygonService.getAllOptionsContracts()
      const data = await SentimentHeatmapService.getHeatmapData(contracts, {
        expiry_type: 'Weekly',
        sentiment_mode: 'composite'
      })
      setHeatmapData(data)
    } catch (error) {
      console.error('Error loading heatmap:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!heatmapData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No sentiment data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sentiment Heatmap</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered sentiment for liquid options
          </p>
        </div>
        <button
          onClick={loadHeatmap}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Contracts</p>
          <p className="text-2xl font-bold text-blue-900">{heatmapData.total_cells}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Avg Sentiment</p>
          <p className="text-2xl font-bold text-green-900">{heatmapData.avg_sentiment.toFixed(1)}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Active Tickers</p>
          <p className="text-2xl font-bold text-purple-900">{heatmapData.tickers.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        {heatmapData.rows.map((row) => (
          <div key={row.ticker + row.expiry_date} className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              {row.ticker} - {row.expiry_date} ({row.days_to_expiry}d)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Calls
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {row.calls.slice(0, 10).map((cell) => (
                    <div
                      key={cell.contract_ticker}
                      className={`${SentimentHeatmapService.getSentimentGradient(
                        cell.sentiment_score,
                        heatmapData.min_sentiment,
                        heatmapData.max_sentiment
                      )} rounded p-2 text-center cursor-pointer hover:scale-105 transition-transform`}
                      style={{ opacity: SentimentHeatmapService.getConfidenceOpacity(cell.confidence) }}
                      title={cell.sentiment_label}
                    >
                      <div className="text-xs font-bold">${cell.strike_price}</div>
                      <div className="text-xs">{cell.sentiment_score.toFixed(0)}</div>
                      <div className="text-sm">{cell.trend_icon}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  Puts
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {row.puts.slice(0, 10).map((cell) => (
                    <div
                      key={cell.contract_ticker}
                      className={`${SentimentHeatmapService.getSentimentGradient(
                        cell.sentiment_score,
                        heatmapData.min_sentiment,
                        heatmapData.max_sentiment
                      )} rounded p-2 text-center cursor-pointer hover:scale-105 transition-transform`}
                      style={{ opacity: SentimentHeatmapService.getConfidenceOpacity(cell.confidence) }}
                      title={cell.sentiment_label}
                    >
                      <div className="text-xs font-bold">${cell.strike_price}</div>
                      <div className="text-xs">{cell.sentiment_score.toFixed(0)}</div>
                      <div className="text-sm">{cell.trend_icon}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span>Very Bearish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-300 rounded"></div>
            <span>Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>Very Bullish</span>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          Last updated: {new Date(heatmapData.last_updated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
