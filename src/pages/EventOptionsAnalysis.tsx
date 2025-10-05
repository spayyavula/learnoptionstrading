import React, { useState, useEffect } from 'react'
import { Search, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react'
import MarketEventsTimeline from '../components/MarketEventsTimeline'
import SentimentDashboard from '../components/SentimentDashboard'
import AnalystRatingsDisplay from '../components/AnalystRatingsDisplay'
import { EventAdjustedPricingService } from '../services/eventAdjustedPricingService'
import { MarketEventsService } from '../services/marketEventsService'
import { SentimentAnalysisService } from '../services/sentimentAnalysisService'
import { AnalystRecommendationsService } from '../services/analystRecommendationsService'

export default function EventOptionsAnalysis() {
  const [ticker, setTicker] = useState('AAPL')
  const [searchTicker, setSearchTicker] = useState('AAPL')
  const [spotPrice, setSpotPrice] = useState(180)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [pricingExample, setPricingExample] = useState<any>(null)
  const [autoPopulated, setAutoPopulated] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [showSyncMessage, setShowSyncMessage] = useState(false)

  useEffect(() => {
    loadPricingExample()
    autoPopulateEvents()
  }, [ticker])

  const autoPopulateEvents = async () => {
    if (autoPopulated) return

    try {
      // Auto-populate events for common tickers on first load
      const popularTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META']
      console.log('Auto-populating events for popular tickers...')
      await MarketEventsService.syncEarningsData(popularTickers)
      setAutoPopulated(true)
    } catch (error) {
      console.error('Error auto-populating events:', error)
    }
  }

  const loadPricingExample = async () => {
    setLoading(true)
    try {
      const pricing = await EventAdjustedPricingService.calculateEventAdjustedPrice(
        ticker,
        spotPrice,
        spotPrice,
        30 / 365,
        0.05,
        0.25,
        true
      )
      setPricingExample(pricing)
    } catch (error) {
      console.error('Error loading pricing example:', error)
    }
    setLoading(false)
  }

  const handleSearch = () => {
    setTicker(searchTicker.toUpperCase())
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage('Syncing market data...')
    setShowSyncMessage(true)
    try {
      await Promise.all([
        MarketEventsService.syncEarningsData([ticker]),
        SentimentAnalysisService.syncSentimentData([ticker]),
        AnalystRecommendationsService.syncRecommendations([ticker])
      ])
      await loadPricingExample()
      setSyncMessage(`✓ Successfully synced data for ${ticker}`)
      setTimeout(() => setShowSyncMessage(false), 3000)
    } catch (error) {
      console.error('Error syncing data:', error)
      setSyncMessage('✗ Error syncing data. Using cached/mock data.')
      setTimeout(() => setShowSyncMessage(false), 5000)
    }
    setSyncing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event-Driven Options Analysis</h1>
          <p className="text-gray-600">
            Comprehensive market intelligence combining events, sentiment, and analyst ratings with Black-Scholes pricing
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Ticker</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTicker}
                  onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter ticker symbol..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Data'}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4" />
            <span>
              Popular tickers: SPY, QQQ, AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META
            </span>
          </div>

          {showSyncMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              syncMessage.startsWith('✓')
                ? 'bg-green-100 text-green-800 border border-green-300'
                : syncMessage.startsWith('✗')
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}>
              {syncMessage}
            </div>
          )}
        </div>

        {pricingExample && !loading && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 mb-6 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Event-Adjusted Pricing Example</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Base Price (BS Model)</div>
                <div className="text-2xl font-bold text-gray-900">${pricingExample.basePrice.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">IV: {(pricingExample.baseVolatility * 100).toFixed(1)}%</div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Event Adjusted</div>
                <div className="text-2xl font-bold text-orange-600">${pricingExample.eventAdjustedPrice.toFixed(2)}</div>
                <div className="text-xs text-orange-600 mt-1">
                  +${pricingExample.eventPremium.toFixed(2)} premium
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Sentiment Adjusted</div>
                <div className="text-2xl font-bold text-blue-600">${pricingExample.sentimentAdjustedPrice.toFixed(2)}</div>
                <div className="text-xs text-blue-600 mt-1">
                  {pricingExample.sentimentImpact >= 0 ? '+' : ''}${pricingExample.sentimentImpact.toFixed(2)} impact
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Recommended Entry</div>
                <div className="text-2xl font-bold text-green-600">${pricingExample.recommendedEntryPrice.toFixed(2)}</div>
                <div className="text-xs text-green-600 mt-1">
                  {pricingExample.confidence.toUpperCase()} confidence
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Price Range Scenarios</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-600">Optimistic</div>
                  <div className="text-lg font-bold text-green-600">
                    ${pricingExample.priceRange.optimistic.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Realistic</div>
                  <div className="text-lg font-bold text-blue-600">
                    ${pricingExample.priceRange.realistic.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Pessimistic</div>
                  <div className="text-lg font-bold text-red-600">
                    ${pricingExample.priceRange.pessimistic.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 text-white rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Trading Recommendation</div>
                  <div className="text-sm opacity-90">{pricingExample.recommendation}</div>
                  {pricingExample.daysToEvent < 999 && (
                    <div className="text-xs opacity-75 mt-2">
                      Next major event in {pricingExample.daysToEvent} day{pricingExample.daysToEvent === 1 ? '' : 's'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Event Data Information</p>
              <p>
                Events are automatically populated with realistic mock data for demonstration.
                Click "Sync Data" to attempt fetching real market events from external APIs.
                For production use, configure API keys in your .env file (Financial Modeling Prep or Alpha Vantage).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <MarketEventsTimeline
            ticker={ticker}
            daysAhead={60}
            daysBack={90}
          />

          <AnalystRatingsDisplay
            ticker={ticker}
            currentPrice={spotPrice}
          />
        </div>

        <SentimentDashboard ticker={ticker} />

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">How Event-Adjusted Pricing Works</h3>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Base Black-Scholes Pricing</div>
                <div className="text-sm">
                  Standard option pricing using spot price, strike, time to expiry, risk-free rate, and implied volatility
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 rounded-full p-2 mt-1">
                <span className="text-orange-600 font-bold">2</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Event Volatility Adjustment</div>
                <div className="text-sm">
                  Adjusts implied volatility based on proximity to major events like earnings. IV typically expands 30-50% before earnings and crushes 40% after
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Sentiment Layer</div>
                <div className="text-sm">
                  Incorporates market sentiment from news articles and analyst ratings to adjust pricing further based on market psychology
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-2 mt-1">
                <span className="text-green-600 font-bold">4</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Optimal Entry Calculation</div>
                <div className="text-sm">
                  Recommends entry prices that balance event premium with timing, helping you avoid overpaying for inflated IV
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
