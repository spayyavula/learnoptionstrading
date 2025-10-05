import React, { useState, useEffect } from 'react'
import { OptionsSentimentService, type OptionsSentimentScore } from '../services/optionsSentimentService'
import { TrendingUp, TrendingDown, Minus, Info, Newspaper } from 'lucide-react'

interface OptionSentimentIndicatorProps {
  underlyingTicker: string
  optionTicker: string
  compact?: boolean
}

export function OptionSentimentIndicator({
  underlyingTicker,
  optionTicker,
  compact = false
}: OptionSentimentIndicatorProps) {
  const [sentiment, setSentiment] = useState<OptionsSentimentScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    loadSentiment()
  }, [underlyingTicker, optionTicker])

  const loadSentiment = async () => {
    setLoading(true)
    try {
      let score = await OptionsSentimentService.getSentimentScore(optionTicker)

      if (!score) {
        score = await OptionsSentimentService.calculateSentimentForOption(underlyingTicker, optionTicker)
      }

      setSentiment(score)
    } catch (error) {
      console.error('Error loading sentiment:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = () => {
    if (!sentiment) return <Minus className="w-4 h-4" />

    switch (sentiment.sentiment_trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    )
  }

  if (!sentiment) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${compact ? 'text-sm' : ''}`}>
        <Newspaper className="w-4 h-4" />
        <span>No sentiment data</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm relative">
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-md cursor-help"
          style={{
            backgroundColor: `${OptionsSentimentService.getSentimentColor(sentiment.overall_sentiment_score)}20`,
            borderLeft: `3px solid ${OptionsSentimentService.getSentimentColor(sentiment.overall_sentiment_score)}`
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {getTrendIcon()}
          <span className="font-semibold" style={{ color: OptionsSentimentService.getSentimentColor(sentiment.overall_sentiment_score) }}>
            {sentiment.overall_sentiment_score.toFixed(0)}
          </span>
        </div>

        {showTooltip && (
          <div className="absolute z-50 bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3">
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Sentiment Score:</span>
                <span className="font-semibold">{sentiment.overall_sentiment_score.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Trend:</span>
                <span className="font-semibold capitalize">{sentiment.sentiment_trend}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">News Count:</span>
                <span className="font-semibold">{sentiment.news_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Positive:</span>
                <span className="font-semibold">{sentiment.positive_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Negative:</span>
                <span className="font-semibold">{sentiment.negative_count}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Sentiment Analysis</h3>
        </div>
        <button
          onClick={loadSentiment}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overall Score</div>
          <div
            className="text-2xl font-bold"
            style={{ color: OptionsSentimentService.getSentimentColor(sentiment.overall_sentiment_score) }}
          >
            {sentiment.overall_sentiment_score.toFixed(1)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Trend</div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
              {sentiment.sentiment_trend}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="text-green-600 dark:text-green-400 font-semibold">{sentiment.positive_count}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Positive</div>
        </div>
        <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          <div className="text-yellow-600 dark:text-yellow-400 font-semibold">{sentiment.neutral_count}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Neutral</div>
        </div>
        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
          <div className="text-red-600 dark:text-red-400 font-semibold">{sentiment.negative_count}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Negative</div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {OptionsSentimentService.getSentimentRecommendation(sentiment)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex justify-between">
          <span>Momentum:</span>
          <span className={sentiment.sentiment_momentum > 0 ? 'text-green-600' : sentiment.sentiment_momentum < 0 ? 'text-red-600' : ''}>
            {sentiment.sentiment_momentum > 0 ? '+' : ''}{sentiment.sentiment_momentum.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>High Impact:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {sentiment.high_impact_news_count}
          </span>
        </div>
      </div>
    </div>
  )
}
