import React, { useState, useEffect } from 'react'
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Activity, RefreshCw, Filter } from 'lucide-react'
import { NewsFeedService, type NewsArticle } from '../services/newsFeedService'
import { FinBERTSentimentService, type SentimentAnalysisResult } from '../services/finbertSentimentService'

interface SentimentNewsPanelProps {
  ticker: string
  maxArticles?: number
  daysBack?: number
  sentimentFilter?: 'all' | 'positive' | 'negative' | 'neutral'
}

export default function SentimentNewsPanel({
  ticker,
  maxArticles = 10,
  daysBack = 7,
  sentimentFilter = 'all'
}: SentimentNewsPanelProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [sentiments, setSentiments] = useState<Map<string, SentimentAnalysisResult>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>(sentimentFilter)
  const [sortBy, setSortBy] = useState<'date' | 'sentiment' | 'relevance'>('date')

  useEffect(() => {
    loadNews()
  }, [ticker, daysBack])

  const loadNews = async () => {
    setLoading(true)
    setError(null)
    try {
      const newsArticles = await NewsFeedService.fetchNewsForTicker(ticker, daysBack)
      setArticles(newsArticles.slice(0, maxArticles))

      const sentimentMap = new Map<string, SentimentAnalysisResult>()
      for (const article of newsArticles.slice(0, maxArticles)) {
        if (article.id) {
          const sentiment = await FinBERTSentimentService.getSentimentForArticle(article.id)
          if (!sentiment && article.headline) {
            const newSentiment = await FinBERTSentimentService.analyzeSentiment(
              article.headline + ' ' + (article.summary || ''),
              ticker,
              article.id
            )
            sentimentMap.set(article.id, newSentiment)
          } else if (sentiment) {
            sentimentMap.set(article.id, sentiment)
          }
        }
      }
      setSentiments(sentimentMap)
    } catch (err) {
      console.error('Error loading news:', err)
      setError(err instanceof Error ? err.message : 'Failed to load news')
    } finally {
      setLoading(false)
    }
  }

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getSentimentBadgeClass = (label: string): string => {
    switch (label) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredArticles = articles.filter(article => {
    if (activeFilter === 'all') return true
    if (!article.id) return false
    const sentiment = sentiments.get(article.id)
    return sentiment?.finbert_label === activeFilter
  })

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    }
    if (sortBy === 'sentiment' && a.id && b.id) {
      const sentA = sentiments.get(a.id)
      const sentB = sentiments.get(b.id)
      return (sentB?.finbert_score || 0) - (sentA?.finbert_score || 0)
    }
    if (sortBy === 'relevance') {
      return (b.relevance_score || 0) - (a.relevance_score || 0)
    }
    return 0
  })

  const sentimentStats = {
    positive: articles.filter(a => a.id && sentiments.get(a.id)?.finbert_label === 'positive').length,
    negative: articles.filter(a => a.id && sentiments.get(a.id)?.finbert_label === 'negative').length,
    neutral: articles.filter(a => a.id && sentiments.get(a.id)?.finbert_label === 'neutral').length
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mr-3" />
          <p className="text-gray-600">Loading news articles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <Newspaper className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">News Sentiment</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {ticker} • {articles.length} articles from last {daysBack} days
            </p>
          </div>

          <button
            onClick={loadNews}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-gray-600" />
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({articles.length})
            </button>
            <button
              onClick={() => setActiveFilter('positive')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'positive'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Positive ({sentimentStats.positive})
            </button>
            <button
              onClick={() => setActiveFilter('negative')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'negative'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Negative ({sentimentStats.negative})
            </button>
            <button
              onClick={() => setActiveFilter('neutral')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'neutral'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Neutral ({sentimentStats.neutral})
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Date</option>
              <option value="sentiment">Sentiment</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {sortedArticles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Newspaper className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No articles found for the selected filter</p>
          </div>
        ) : (
          sortedArticles.map((article) => {
            const sentiment = article.id ? sentiments.get(article.id) : null
            const publishedDate = new Date(article.published_at)
            const timeAgo = getTimeAgo(publishedDate)

            return (
              <div
                key={article.id || article.url}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 leading-tight">
                      {article.headline}
                    </h4>
                    {article.summary && (
                      <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                    )}
                  </div>

                  {sentiment && (
                    <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 whitespace-nowrap ${getSentimentBadgeClass(sentiment.finbert_label)}`}>
                      {getSentimentIcon(sentiment.finbert_label)}
                      {sentiment.finbert_label}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-medium">{article.source}</span>
                    <span>{timeAgo}</span>
                    {article.relevance_score != null && (
                      <span>Relevance: {article.relevance_score.toFixed(0)}%</span>
                    )}
                    {sentiment && sentiment.confidence != null && (
                      <span>Confidence: {(sentiment.confidence * 100).toFixed(0)}%</span>
                    )}
                  </div>

                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Read More
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
