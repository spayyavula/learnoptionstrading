import React, { useState } from 'react'
import { Activity, TrendingUp, BarChart3, Bell } from 'lucide-react'
import LiquidOptionsSentimentHeatmap from '../components/LiquidOptionsSentimentHeatmap'
import SentimentDetailPanel from '../components/SentimentDetailPanel'
import type { HeatmapCell } from '../services/sentimentHeatmapService'

export default function LiquidOptionsSentimentDashboard() {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null)
  const [view, setView] = useState<'heatmap' | 'trends' | 'alerts'>('heatmap')

  const handleCellClick = (cell: HeatmapCell) => {
    setSelectedCell(cell)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                Sentiment Intelligence Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                AI-powered sentiment analysis combining FinBERT news analysis, analyst ratings, and market events
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => setView('heatmap')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                view === 'heatmap'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Sentiment Heatmap
            </button>
            <button
              onClick={() => setView('trends')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                view === 'trends'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Sentiment Trends
            </button>
            <button
              onClick={() => setView('alerts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                view === 'alerts'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              Sentiment Alerts
            </button>
          </div>
        </div>

        {view === 'heatmap' && (
          <div>
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                About the Sentiment Heatmap
              </h2>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>Composite Sentiment Score:</strong> Combines FinBERT analysis of news articles (50%),
                  analyst ratings and recommendations (35%), and market event impact (15%) into a single score
                  ranging from -100 (very bearish) to +100 (very bullish).
                </p>
                <p>
                  <strong>Color Coding:</strong> Red shades indicate bearish sentiment, yellow represents neutral,
                  and green shades show bullish sentiment. Cell opacity reflects confidence level.
                </p>
                <p>
                  <strong>Trend Indicators:</strong> Icons show sentiment momentum - accelerating (⏫), rising (📈),
                  stable (➡️), falling (📉), or decelerating (⏬).
                </p>
                <p>
                  <strong>Interactive:</strong> Click any cell to view detailed sentiment breakdown including individual
                  news articles, analyst ratings, and technical metrics.
                </p>
              </div>
            </div>

            <LiquidOptionsSentimentHeatmap
              onCellClick={handleCellClick}
              showControls={true}
            />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  How It Works
                </h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>1. News Analysis:</strong> FinBERT AI model analyzes sentiment of recent news articles
                    from multiple sources
                  </p>
                  <p>
                    <strong>2. Analyst Ratings:</strong> Aggregates ratings from major financial institutions and
                    tracks upgrades/downgrades
                  </p>
                  <p>
                    <strong>3. Event Impact:</strong> Factors in earnings, FDA approvals, economic data, and other
                    market-moving events
                  </p>
                  <p>
                    <strong>4. Momentum Tracking:</strong> Monitors rate of sentiment change to identify acceleration
                    or deceleration
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Trading Applications</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>Bullish Sentiment + Low IV:</strong> Consider buying calls or bull call spreads
                  </p>
                  <p>
                    <strong>Bearish Sentiment + High IV:</strong> Look for put buying or bear put spread opportunities
                  </p>
                  <p>
                    <strong>Sentiment Divergence:</strong> When sentiment conflicts with price action, watch for reversals
                  </p>
                  <p>
                    <strong>Accelerating Momentum:</strong> Strong trend changes may signal breakout opportunities
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Best Practices</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>Confirm with Technicals:</strong> Use sentiment alongside price action and volume analysis
                  </p>
                  <p>
                    <strong>High Confidence Priority:</strong> Focus on contracts with confidence levels above 70%
                  </p>
                  <p>
                    <strong>Watch Momentum Shifts:</strong> Pay attention to trend changes and acceleration indicators
                  </p>
                  <p>
                    <strong>Time Horizon Alignment:</strong> Match sentiment data timeframe with your trading strategy
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'trends' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sentiment Trends</h2>
            <div className="text-gray-600">
              <p className="mb-4">
                Historical sentiment trend analysis coming soon. This section will display:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Sentiment evolution over time for each ticker</li>
                <li>Correlation between sentiment changes and price movements</li>
                <li>Sentiment momentum acceleration/deceleration charts</li>
                <li>Comparison of FinBERT vs Analyst sentiment trends</li>
                <li>Sentiment volatility indicators</li>
              </ul>
            </div>
          </div>
        )}

        {view === 'alerts' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sentiment Alerts</h2>
            <div className="text-gray-600">
              <p className="mb-4">
                Configure custom sentiment alerts. This section will allow you to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Set sentiment threshold alerts (e.g., notify when sentiment crosses 50)</li>
                <li>Track momentum alerts (e.g., alert on rapid sentiment acceleration)</li>
                <li>Monitor divergence alerts (e.g., sentiment vs price action conflicts)</li>
                <li>Get notified of analyst upgrades/downgrades</li>
                <li>Receive alerts for high-impact news events</li>
              </ul>
              <div className="mt-6">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedCell && (
        <SentimentDetailPanel
          cell={selectedCell}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  )
}
