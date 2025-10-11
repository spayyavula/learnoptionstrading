import React, { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Activity, FileText, Users, Calendar, ExternalLink } from 'lucide-react'
import { LiquidOptionsSentimentService, type LiquidOptionSentimentScore } from '../services/liquidOptionsSentimentService'
import { FinBERTSentimentService, type SentimentAnalysisResult } from '../services/finbertSentimentService'
import { AnalystRecommendationsService, type ConsensusRating, type RatingChange } from '../services/analystRecommendationsService'
import { NewsFeedService, type NewsArticle } from '../services/newsFeedService'
import type { HeatmapCell } from '../services/sentimentHeatmapService'

interface SentimentDetailPanelProps {
  cell: HeatmapCell
  onClose: () => void
}

export default function SentimentDetailPanel({ cell, onClose }: SentimentDetailPanelProps) {
  const [sentimentData, setSentimentData] = useState<LiquidOptionSentimentScore | null>(null)
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [consensus, setConsensus] = useState<ConsensusRating | null>(null)
  const [ratingChanges, setRatingChanges] = useState<RatingChange[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'analysts' | 'technicals'>('overview')

  useEffect(() => {
    loadDetailedData()
  }, [cell.contract_ticker])

  const loadDetailedData = async () => {
    setLoading(true)
    try {
      const [sentiment, news, consensusData, changes] = await Promise.all([
        LiquidOptionsSentimentService.getSentimentScoreForContract(cell.contract_ticker),
        NewsFeedService.getStoredNews(cell.underlying_ticker, 7),
        AnalystRecommendationsService.getConsensusRating(cell.underlying_ticker),
        AnalystRecommendationsService.getRecentRatingChanges(cell.underlying_ticker, 30)
      ])

      setSentimentData(sentiment)
      setNewsArticles(news.slice(0, 10))
      setConsensus(consensusData)
      setRatingChanges(changes)
    } catch (error) {
      console.error('Error loading detail data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className={`p-6 ${cell.sentiment_color.split(' ')[0]} border-b`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {cell.underlying_ticker}
                </h2>
                <span className="px-3 py-1 bg-white bg-opacity-90 rounded-full text-sm font-semibold">
                  ${cell.strike_price} {cell.contract_type.toUpperCase()}
                </span>
                <span className="text-3xl">{cell.trend_icon}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Expires: {cell.expiration_date}
                </div>
                <div className="font-semibold">
                  Sentiment: {cell.sentiment_label} ({cell.sentiment_score.toFixed(1)})
                </div>
                <div>
                  Confidence: {cell.confidence.toFixed(0)}%
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          {['overview', 'news', 'analysts', 'technicals'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 px-6 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Activity className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading detailed data...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab cell={cell} sentimentData={sentimentData} />
              )}
              {activeTab === 'news' && (
                <NewsTab articles={newsArticles} ticker={cell.underlying_ticker} />
              )}
              {activeTab === 'analysts' && (
                <AnalystsTab consensus={consensus} ratingChanges={ratingChanges} />
              )}
              {activeTab === 'technicals' && (
                <TechnicalsTab cell={cell} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({
  cell,
  sentimentData
}: {
  cell: HeatmapCell
  sentimentData: LiquidOptionSentimentScore | null
}) {
  if (!sentimentData) {
    return <div className="text-gray-600">No sentiment data available</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <SentimentComponentCard
          title="FinBERT News Sentiment"
          score={sentimentData.finbert_sentiment_score}
          icon={<FileText className="w-5 h-5" />}
          details={`${sentimentData.news_article_count} articles analyzed`}
        />
        <SentimentComponentCard
          title="Analyst Ratings"
          score={sentimentData.analyst_sentiment_score}
          icon={<Users className="w-5 h-5" />}
          details={`${sentimentData.analyst_rating_count} ratings`}
        />
        <SentimentComponentCard
          title="Market Events"
          score={sentimentData.event_sentiment_score}
          icon={<Activity className="w-5 h-5" />}
          details={sentimentData.last_major_event || 'No recent events'}
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">News Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{sentimentData.positive_news_count}</div>
            <div className="text-sm text-green-600">Positive</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">{sentimentData.neutral_news_count}</div>
            <div className="text-sm text-yellow-600">Neutral</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{sentimentData.negative_news_count}</div>
            <div className="text-sm text-red-600">Negative</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Analyst Activity</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Recent Upgrades:</span>
            <span className="font-bold text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {sentimentData.recent_upgrade_count}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Recent Downgrades:</span>
            <span className="font-bold text-red-600 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              {sentimentData.recent_downgrade_count}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Sentiment Dynamics</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Momentum:</span>
            <span className={`font-bold ${sentimentData.sentiment_momentum > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {sentimentData.sentiment_momentum > 0 ? '+' : ''}{sentimentData.sentiment_momentum.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Trend:</span>
            <span className="font-bold text-blue-600 capitalize">
              {sentimentData.sentiment_trend}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Volatility:</span>
            <span className="font-bold text-purple-600">
              {sentimentData.sentiment_volatility.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SentimentComponentCard({
  title,
  score,
  icon,
  details
}: {
  title: string
  score: number
  icon: React.ReactNode
  details: string
}) {
  const color = LiquidOptionsSentimentService.getSentimentColor(score)
  const label = LiquidOptionsSentimentService.getSentimentLabel(score)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2 text-gray-700">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color }}>
        {score.toFixed(1)}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-xs text-gray-500 mt-2">{details}</div>
    </div>
  )
}

function NewsTab({ articles, ticker }: { articles: NewsArticle[]; ticker: string }) {
  if (articles.length === 0) {
    return <div className="text-gray-600">No recent news articles available</div>
  }

  return (
    <div className="space-y-4">
      {articles.map((article, index) => (
        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">{article.headline}</h4>
              {article.summary && (
                <p className="text-sm text-gray-600 mb-2">{article.summary}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{article.source}</span>
                <span>{new Date(article.published_at).toLocaleDateString()}</span>
                {article.relevance_score && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Relevance: {article.relevance_score.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AnalystsTab({
  consensus,
  ratingChanges
}: {
  consensus: ConsensusRating | null
  ratingChanges: RatingChange[]
}) {
  if (!consensus) {
    return <div className="text-gray-600">No analyst data available</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Consensus Rating</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {consensus.consensus_rating}
            </div>
            <div className="text-sm text-gray-600">
              Based on {consensus.total_analysts} analysts
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Price Target Range</div>
            <div className="text-lg font-semibold text-gray-900">
              ${consensus.low_price_target.toFixed(2)} - ${consensus.high_price_target.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              Avg: ${consensus.average_price_target.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Rating Distribution</h3>
        <div className="space-y-2">
          {[
            { label: 'Strong Buy', count: consensus.strong_buy_count, color: 'bg-green-600' },
            { label: 'Buy', count: consensus.buy_count, color: 'bg-green-400' },
            { label: 'Hold', count: consensus.hold_count, color: 'bg-yellow-400' },
            { label: 'Sell', count: consensus.sell_count, color: 'bg-red-400' },
            { label: 'Strong Sell', count: consensus.strong_sell_count, color: 'bg-red-600' }
          ].map((rating) => {
            const percentage = (rating.count / consensus.total_analysts) * 100
            return (
              <div key={rating.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24">{rating.label}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className={`${rating.color} h-full flex items-center justify-center text-white text-xs font-medium`}
                    style={{ width: `${percentage}%` }}
                  >
                    {rating.count > 0 && `${rating.count}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {ratingChanges.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Recent Rating Changes</h3>
          <div className="space-y-2">
            {ratingChanges.map((change, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">{change.analyst_firm}</div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    change.change_type === 'upgrade'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {change.change_type.toUpperCase()}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {change.old_rating} → {change.new_rating}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(change.change_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TechnicalsTab({ cell }: { cell: HeatmapCell }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Volume</div>
          <div className="text-2xl font-bold text-gray-900">
            {cell.volume?.toLocaleString() || 'N/A'}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Open Interest</div>
          <div className="text-2xl font-bold text-gray-900">
            {cell.open_interest?.toLocaleString() || 'N/A'}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Implied Volatility</div>
          <div className="text-2xl font-bold text-gray-900">
            {cell.implied_volatility ? `${(cell.implied_volatility * 100).toFixed(1)}%` : 'N/A'}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Strike Price</div>
          <div className="text-2xl font-bold text-gray-900">
            ${cell.strike_price}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Sentiment-Technical Alignment:</strong> When sentiment is strongly positive/negative
          and matches with high volume and open interest, it suggests strong market conviction.
        </p>
      </div>
    </div>
  )
}
