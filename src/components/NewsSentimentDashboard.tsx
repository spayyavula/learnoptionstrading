import React, { useState, useEffect } from 'react'
import { NewsFeedService, type NewsArticle } from '../services/newsFeedService'
import { FinBERTSentimentService, type SentimentAnalysisResult } from '../services/finbertSentimentService'
import { TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, Clock } from 'lucide-react'

interface NewsSentimentDashboardProps {
  ticker: string
  maxArticles?: number
}

export function NewsSentimentDashboard({ ticker, maxArticles = 10 }: NewsSentimentDashboardProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [sentiments, setSentiments] = useState<Map<string, SentimentAnalysisResult>>(new Map())
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all')

  useEffect(() => {
    loadNews()
  }, [ticker])

  const loadNews = async () => {
    setLoading(true)
    try {
      let newsArticles = await NewsFeedService.getStoredNews(ticker, 7)

      if (newsArticles.length === 0) {
        newsArticles = await NewsFeedService.fetchNewsForTicker(ticker, 7)
      }

      setArticles(newsArticles.slice(0, maxArticles))

      const sentimentMap = new Map<string, SentimentAnalysisResult>()
      for (const article of newsArticles.slice(0, maxArticles)) {
        if (article.id) {
          const sentiment = await FinBERTSentimentService.getSentimentForArticle(article.id)
          if (sentiment) {
            sentimentMap.set(article.id, sentiment)
          }
        }
      }
      setSentiments(sentimentMap)
    } catch (error) {
      console.error('Error loading news:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeSentiments = async () => {
    setAnalyzing(true)
    try {
      const newSentiments = new Map(sentiments)

      for (const article of articles) {
        if (!article.id || newSentiments.has(article.id)) continue

        const sentiment = await FinBERTSentimentService.analyzeArticle(article)
        newSentiments.set(article.id!, sentiment)
        setSentiments(new Map(newSentiments))

        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error('Error analyzing sentiments:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const getFilteredArticles = () => {
    if (filter === 'all') return articles

    return articles.filter(article => {
      if (!article.id) return false
      const sentiment = sentiments.get(article.id)
      return sentiment?.finbert_label === filter
    })
  }

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-500" />
      default:
        return <Minus className="w-5 h-5 text-yellow-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const aggregateSentiment = React.useMemo(() => {
    const sentimentArray = Array.from(sentiments.values())
    return FinBERTSentimentService.calculateAggregateSentiment(sentimentArray)
  }, [sentiments])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            News Sentiment Analysis
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {ticker} - Last 7 days
          </p>
        </div>
        <button
          onClick={analyzeSentiments}
          disabled={analyzing || articles.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Analyze All'}
        </button>
      </div>

      {sentiments.size > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Sentiment</div>
            <div className="text-2xl font-bold" style={{ color: FinBERTSentimentService.getSentimentColor(aggregateSentiment.averageScore) }}>
              {(aggregateSentiment.averageScore * 100).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {FinBERTSentimentService.getSentimentLabel(aggregateSentiment.label)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Positive</div>
            <div className="text-2xl font-bold text-green-600">{aggregateSentiment.positiveCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {((aggregateSentiment.positiveCount / sentiments.size) * 100).toFixed(0)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Negative</div>
            <div className="text-2xl font-bold text-red-600">{aggregateSentiment.negativeCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {((aggregateSentiment.negativeCount / sentiments.size) * 100).toFixed(0)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Neutral</div>
            <div className="text-2xl font-bold text-yellow-600">{aggregateSentiment.neutralCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {((aggregateSentiment.neutralCount / sentiments.size) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(['all', 'positive', 'negative', 'neutral'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {getFilteredArticles().map((article, index) => {
          const sentiment = article.id ? sentiments.get(article.id) : null

          return (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {sentiment && getSentimentIcon(sentiment.finbert_label)}
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {article.source}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(article.published_at)}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {article.headline}
                  </h3>

                  {article.summary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {article.summary}
                    </p>
                  )}

                  {sentiment && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Sentiment:</span>
                        <span
                          className="font-semibold"
                          style={{ color: FinBERTSentimentService.getSentimentColor(sentiment.finbert_score) }}
                        >
                          {FinBERTSentimentService.getSentimentLabel(sentiment.finbert_label)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(sentiment.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Score:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(sentiment.finbert_score * 100).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {article.url && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          )
        })}

        {getFilteredArticles().length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No articles found matching the selected filter.
          </div>
        )}
      </div>
    </div>
  )
}
