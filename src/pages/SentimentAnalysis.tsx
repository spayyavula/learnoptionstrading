import React, { useState, useEffect } from 'react'
import { NewsSentimentDashboard } from '../components/NewsSentimentDashboard'
import { OptionSentimentIndicator } from '../components/OptionSentimentIndicator'
import { SentimentTrendChart } from '../components/SentimentTrendChart'
import { PolygonService } from '../services/polygonService'
import { SentimentSyncScheduler } from '../services/sentimentSyncScheduler'
import { Newspaper, TrendingUp, RefreshCw, Settings } from 'lucide-react'
import type { OptionsContract } from '../types/options'

export function SentimentAnalysis() {
  const [selectedTicker, setSelectedTicker] = useState<string>('SPY')
  const [liquidOptions, setLiquidOptions] = useState<OptionsContract[]>([])
  const [syncing, setSyncing] = useState(false)
  const [schedulerStatus, setSchedulerStatus] = useState(SentimentSyncScheduler.getStatus())

  useEffect(() => {
    const options = PolygonService.getTopLiquidOptions()
    setLiquidOptions(options)
  }, [])

  const uniqueTickers = React.useMemo(() => {
    return [...new Set(liquidOptions.map(option => option.underlying_ticker))]
  }, [liquidOptions])

  const selectedOption = React.useMemo(() => {
    return liquidOptions.find(option => option.underlying_ticker === selectedTicker)
  }, [liquidOptions, selectedTicker])

  const handleManualSync = async () => {
    setSyncing(true)
    try {
      await SentimentSyncScheduler.syncSpecificTicker(selectedTicker)
      window.location.reload()
    } catch (error) {
      console.error('Error syncing sentiment:', error)
    } finally {
      setSyncing(false)
    }
  }

  const toggleScheduler = () => {
    if (schedulerStatus.isRunning) {
      SentimentSyncScheduler.stop()
    } else {
      SentimentSyncScheduler.start()
    }
    setSchedulerStatus(SentimentSyncScheduler.getStatus())
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Newspaper className="w-8 h-8 text-blue-600" />
                News Sentiment Analysis
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Real-time sentiment analysis powered by FinBERT for liquid options
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleScheduler}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  schedulerStatus.isRunning
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Settings className="w-4 h-4" />
                {schedulerStatus.isRunning ? 'Auto-Sync On' : 'Auto-Sync Off'}
              </button>

              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {uniqueTickers.map(ticker => (
              <button
                key={ticker}
                onClick={() => setSelectedTicker(ticker)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTicker === ticker
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {ticker}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            {selectedOption && (
              <OptionSentimentIndicator
                underlyingTicker={selectedOption.underlying_ticker}
                optionTicker={selectedOption.ticker}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            <SentimentTrendChart ticker={selectedTicker} daysBack={7} height={300} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <NewsSentimentDashboard ticker={selectedTicker} maxArticles={20} />
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                About Sentiment Analysis
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <p>
                  Our sentiment analysis system uses <strong>FinBERT</strong>, a state-of-the-art natural language processing model
                  specifically trained on financial text. FinBERT analyzes news headlines and articles to determine whether the sentiment
                  is positive, negative, or neutral for each stock and its associated options.
                </p>
                <p>
                  <strong>How to interpret sentiment scores:</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Scores range from -100 (very negative) to +100 (very positive)</li>
                  <li>Positive sentiment (15 to 100) may favor bullish options strategies</li>
                  <li>Negative sentiment (-100 to -15) may favor bearish options strategies</li>
                  <li>Neutral sentiment (-15 to 15) suggests waiting for clearer signals</li>
                  <li>High momentum indicates rapidly changing sentiment</li>
                  <li>Rising trend shows improving sentiment over time</li>
                </ul>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                  <strong>Note:</strong> Sentiment analysis is one tool among many for options trading. Always combine sentiment data
                  with technical analysis, fundamental analysis, and proper risk management. Past sentiment does not guarantee future price movements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
