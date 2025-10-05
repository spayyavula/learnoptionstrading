import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Newspaper, Users, BarChart3 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { SentimentAnalysisService, SentimentScore, NewsArticle } from '../services/sentimentAnalysisService'

interface SentimentDashboardProps {
  ticker: string
}

export default function SentimentDashboard({ ticker }: SentimentDashboardProps) {
  const [currentSentiment, setCurrentSentiment] = useState<SentimentScore | null>(null)
  const [sentimentTrend, setSentimentTrend] = useState<any[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSentimentData()
  }, [ticker])

  const loadSentimentData = async () => {
    setLoading(true)

    const [sentiment, trend, articles] = await Promise.all([
      SentimentAnalysisService.getSentimentScore(ticker),
      SentimentAnalysisService.getSentimentTrend(ticker, 30),
      SentimentAnalysisService.getNewsArticles(ticker, 7)
    ])

    setCurrentSentiment(sentiment)
    setSentimentTrend(trend.map(t => ({
      date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: t.score,
      category: t.category
    })))
    setNews(articles.slice(0, 5))
    setLoading(false)
  }

  const getSentimentGaugeColor = (score: number) => {
    if (score >= 50) return '#16a34a'
    if (score >= 15) return '#22c55e'
    if (score >= -15) return '#eab308'
    if (score >= -50) return '#f97316'
    return '#dc2626'
  }

  const renderSentimentGauge = (score: number, label: string) => {
    const normalizedScore = ((score + 100) / 200) * 100
    const color = getSentimentGaugeColor(score)

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm font-medium text-gray-600 mb-2">{label}</div>
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full transition-all duration-500"
            style={{ width: `${normalizedScore}%`, backgroundColor: color }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">Bearish</span>
          <span className="text-lg font-bold" style={{ color }}>
            {score.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500">Bullish</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!currentSentiment) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No sentiment data available for {ticker}</p>
      </div>
    )
  }

  const momentumDirection = currentSentiment.sentiment_momentum >= 0

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Sentiment Analysis</h3>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: getSentimentGaugeColor(currentSentiment.overall_sentiment_score) }}>
              {SentimentAnalysisService.getSentimentIcon(currentSentiment.sentiment_category)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {SentimentAnalysisService.getSentimentLabel(currentSentiment.sentiment_category)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {renderSentimentGauge(currentSentiment.overall_sentiment_score, 'Overall Sentiment')}
          {renderSentimentGauge(currentSentiment.news_sentiment_score, 'News Sentiment')}
          {renderSentimentGauge(currentSentiment.analyst_sentiment_score, 'Analyst Sentiment')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">News Coverage</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Positive
                </span>
                <span className="font-bold text-green-600">{currentSentiment.positive_news_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Neutral</span>
                <span className="font-bold text-gray-600">{currentSentiment.neutral_news_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-600 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  Negative
                </span>
                <span className="font-bold text-red-600">{currentSentiment.negative_news_count}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Analyst Ratings</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Buy</span>
                <span className="font-bold text-green-600">{currentSentiment.analyst_buy_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hold</span>
                <span className="font-bold text-gray-600">{currentSentiment.analyst_hold_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-600">Sell</span>
                <span className="font-bold text-red-600">{currentSentiment.analyst_sell_count}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg">
          {momentumDirection ? (
            <TrendingUp className="w-5 h-5 text-green-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm font-medium text-gray-700">
            Sentiment Momentum: {momentumDirection ? '+' : ''}{currentSentiment.sentiment_momentum.toFixed(1)}
            <span className={momentumDirection ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
              {momentumDirection ? '(Improving)' : '(Declining)'}
            </span>
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">30-Day Sentiment Trend</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sentimentTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis domain={[-100, 100]} tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Recent News</h4>
        {news.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent news articles</p>
        ) : (
          <div className="space-y-3">
            {news.map((article, index) => (
              <div key={article.id || index} className="border-l-4 pl-4 py-2" style={{ borderColor: getSentimentGaugeColor(article.sentiment_score || 0) }}>
                <h5 className="font-semibold text-gray-900 mb-1">{article.headline}</h5>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{article.source}</span>
                  <span>•</span>
                  <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  {article.sentiment_score !== undefined && (
                    <>
                      <span>•</span>
                      <span className="font-medium" style={{ color: getSentimentGaugeColor(article.sentiment_score) }}>
                        Sentiment: {article.sentiment_score.toFixed(0)}
                      </span>
                    </>
                  )}
                </div>
                {article.summary && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.summary}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
