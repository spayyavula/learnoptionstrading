import React from 'react'
import { Newspaper, Users, Calendar, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { LiquidOptionsSentimentService } from '../services/liquidOptionsSentimentService'

interface SentimentBreakdownPanelProps {
  ticker: string
  contractTicker?: string
  finbertScore: number
  analystScore: number
  eventScore: number
  newsArticleCount: number
  positiveNewsCount: number
  negativeNewsCount: number
  neutralNewsCount: number
  analystRatingCount: number
  recentUpgradeCount: number
  recentDowngradeCount: number
  lastMajorEvent?: string
  sentimentVolatility: number
}

export default function SentimentBreakdownPanel({
  ticker,
  contractTicker,
  finbertScore,
  analystScore,
  eventScore,
  newsArticleCount,
  positiveNewsCount,
  negativeNewsCount,
  neutralNewsCount,
  analystRatingCount,
  recentUpgradeCount,
  recentDowngradeCount,
  lastMajorEvent,
  sentimentVolatility
}: SentimentBreakdownPanelProps) {
  const getNewsDistribution = () => {
    const total = newsArticleCount || 1
    return {
      positive: ((positiveNewsCount / total) * 100).toFixed(0),
      negative: ((negativeNewsCount / total) * 100).toFixed(0),
      neutral: ((neutralNewsCount / total) * 100).toFixed(0)
    }
  }

  const distribution = getNewsDistribution()

  const getVolatilityLevel = (): { level: string; color: string; description: string } => {
    if (sentimentVolatility < 10) return {
      level: 'Low',
      color: 'text-green-600 bg-green-100',
      description: 'Stable sentiment with minimal fluctuations'
    }
    if (sentimentVolatility < 20) return {
      level: 'Moderate',
      color: 'text-yellow-600 bg-yellow-100',
      description: 'Some sentiment variation, monitor for changes'
    }
    return {
      level: 'High',
      color: 'text-red-600 bg-red-100',
      description: 'Volatile sentiment, rapid changes likely'
    }
  }

  const volatility = getVolatilityLevel()

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Sentiment Breakdown</h3>
        <p className="text-sm text-gray-600">
          {ticker} {contractTicker && `• ${contractTicker}`}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Newspaper className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">News Sentiment</h4>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">FinBERT Analysis Score</span>
              <span className="text-2xl font-bold" style={{ color: LiquidOptionsSentimentService.getSentimentColor(finbertScore) }}>
                {finbertScore > 0 ? '+' : ''}{finbertScore.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-blue-700">
              Based on {newsArticleCount} articles analyzed with AI sentiment model
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Positive</span>
              </div>
              <p className="text-xl font-bold text-green-900">{positiveNewsCount}</p>
              <p className="text-xs text-green-600 mt-1">{distribution.positive}%</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600 font-medium">Negative</span>
              </div>
              <p className="text-xl font-bold text-red-900">{negativeNewsCount}</p>
              <p className="text-xs text-red-600 mt-1">{distribution.negative}%</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-600 font-medium">Neutral</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{neutralNewsCount}</p>
              <p className="text-xs text-gray-600 mt-1">{distribution.neutral}%</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-900">Analyst Ratings</h4>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">Consensus Score</span>
              <span className="text-2xl font-bold" style={{ color: LiquidOptionsSentimentService.getSentimentColor(analystScore) }}>
                {analystScore > 0 ? '+' : ''}{analystScore.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-green-700">
              Aggregated from {analystRatingCount} analyst ratings
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-600 font-medium mb-1">Recent Upgrades</p>
              <p className="text-2xl font-bold text-green-900">{recentUpgradeCount}</p>
              <p className="text-xs text-green-600 mt-1">Last 30 days</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 font-medium mb-1">Recent Downgrades</p>
              <p className="text-2xl font-bold text-red-900">{recentDowngradeCount}</p>
              <p className="text-xs text-red-600 mt-1">Last 30 days</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h4 className="text-lg font-semibold text-gray-900">Market Events</h4>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-900">Event Impact Score</span>
              <span className="text-2xl font-bold" style={{ color: LiquidOptionsSentimentService.getSentimentColor(eventScore) }}>
                {eventScore > 0 ? '+' : ''}{eventScore.toFixed(1)}
              </span>
            </div>
            {lastMajorEvent ? (
              <p className="text-xs text-orange-700">
                Latest: {lastMajorEvent}
              </p>
            ) : (
              <p className="text-xs text-orange-700">
                No major events in the last 30 days
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-gray-600" />
            <h4 className="text-lg font-semibold text-gray-900">Sentiment Volatility</h4>
          </div>

          <div className={`border rounded-lg p-4 ${volatility.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Volatility Level</span>
              <span className="text-2xl font-bold">{sentimentVolatility.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{volatility.level}</span>
              <span className="text-xs">{volatility.description}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800 font-medium mb-2">Understanding Sentiment Scores</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>FinBERT:</strong> AI model trained on financial text for accurate news sentiment</li>
            <li>• <strong>Analyst Ratings:</strong> Professional recommendations from major financial firms</li>
            <li>• <strong>Market Events:</strong> Impact of earnings, M&A, regulatory changes</li>
            <li>• <strong>Volatility:</strong> Measures consistency of sentiment over time</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
