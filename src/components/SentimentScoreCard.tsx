import React from 'react'
import { TrendingUp, TrendingDown, BarChart3, Activity, AlertCircle } from 'lucide-react'
import { LiquidOptionsSentimentService } from '../services/liquidOptionsSentimentService'

interface SentimentScoreCardProps {
  compositeScore: number
  finbertScore: number
  analystScore: number
  eventScore: number
  confidence: number
  momentum: number
  trend: 'rising' | 'falling' | 'stable' | 'accelerating' | 'decelerating'
  newsCount: number
  analystCount: number
  showBreakdown?: boolean
}

export default function SentimentScoreCard({
  compositeScore,
  finbertScore,
  analystScore,
  eventScore,
  confidence,
  momentum,
  trend,
  newsCount,
  analystCount,
  showBreakdown = true
}: SentimentScoreCardProps) {
  const sentimentLabel = LiquidOptionsSentimentService.getSentimentLabel(compositeScore)
  const sentimentColor = LiquidOptionsSentimentService.getSentimentColor(compositeScore)
  const trendIcon = LiquidOptionsSentimentService.getTrendIcon(trend)

  const getScoreBarColor = (score: number): string => {
    if (score >= 60) return 'bg-green-500'
    if (score >= 30) return 'bg-green-400'
    if (score >= 10) return 'bg-lime-400'
    if (score >= -10) return 'bg-yellow-400'
    if (score >= -30) return 'bg-orange-400'
    if (score >= -60) return 'bg-red-400'
    return 'bg-red-500'
  }

  const getScorePercentage = (score: number): number => {
    return ((score + 100) / 200) * 100
  }

  const getTrendColor = (): string => {
    if (trend === 'accelerating' || trend === 'rising') return 'text-green-600 bg-green-100'
    if (trend === 'decelerating' || trend === 'falling') return 'text-red-600 bg-red-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getMomentumColor = (): string => {
    const absMomentum = Math.abs(momentum)
    if (absMomentum > 20) return 'text-orange-600 bg-orange-100'
    if (absMomentum > 10) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: sentimentColor }}
            />
            <h3 className="text-2xl font-bold text-gray-900">{sentimentLabel}</h3>
          </div>
          <p className="text-sm text-gray-600">Composite Sentiment Analysis</p>
        </div>

        <div className="text-right">
          <div className="text-4xl font-bold" style={{ color: sentimentColor }}>
            {compositeScore.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Score Range: -100 to +100</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Overall Sentiment</span>
          <span className="font-medium" style={{ color: sentimentColor }}>
            {compositeScore > 0 ? '+' : ''}{compositeScore.toFixed(1)}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getScoreBarColor(compositeScore)} transition-all duration-300`}
            style={{ width: `${getScorePercentage(compositeScore)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-600 font-medium">Confidence</p>
          </div>
          <p className="text-xl font-bold text-blue-900">{confidence.toFixed(0)}%</p>
        </div>

        <div className={`border rounded-lg p-3 ${getTrendColor()}`}>
          <div className="flex items-center gap-2 mb-1">
            {trend === 'rising' || trend === 'accelerating' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <p className="text-xs font-medium">Trend</p>
          </div>
          <p className="text-xl font-bold">{trendIcon} {trend}</p>
        </div>

        <div className={`border rounded-lg p-3 ${getMomentumColor()}`}>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4" />
            <p className="text-xs font-medium">Momentum</p>
          </div>
          <p className="text-xl font-bold">{momentum > 0 ? '+' : ''}{momentum.toFixed(1)}</p>
        </div>
      </div>

      {showBreakdown && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Sentiment Breakdown
          </h4>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-gray-600">News Sentiment (FinBERT)</span>
                  <span className="text-xs text-gray-400">({newsCount} articles)</span>
                </div>
                <span className="font-medium" style={{ color: LiquidOptionsSentimentService.getSentimentColor(finbertScore) }}>
                  {finbertScore > 0 ? '+' : ''}{finbertScore.toFixed(1)}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreBarColor(finbertScore)} transition-all duration-300`}
                  style={{ width: `${getScorePercentage(finbertScore)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-600">Analyst Ratings</span>
                  <span className="text-xs text-gray-400">({analystCount} ratings)</span>
                </div>
                <span className="font-medium" style={{ color: LiquidOptionsSentimentService.getSentimentColor(analystScore) }}>
                  {analystScore > 0 ? '+' : ''}{analystScore.toFixed(1)}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreBarColor(analystScore)} transition-all duration-300`}
                  style={{ width: `${getScorePercentage(analystScore)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span className="text-gray-600">Market Events</span>
                </div>
                <span className="font-medium" style={{ color: LiquidOptionsSentimentService.getSentimentColor(eventScore) }}>
                  {eventScore > 0 ? '+' : ''}{eventScore.toFixed(1)}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreBarColor(eventScore)} transition-all duration-300`}
                  style={{ width: `${getScorePercentage(eventScore)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Composite Score</span> combines news sentiment, analyst ratings, and market events
              using weighted averages for comprehensive market analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
