import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, AlertCircle, Newspaper, RefreshCw } from 'lucide-react'
import SentimentHeatMapViewer from '../components/SentimentHeatMapViewer'
import SentimentScoreCard from '../components/SentimentScoreCard'
import SentimentBreakdownPanel from '../components/SentimentBreakdownPanel'
import SentimentNewsPanel from '../components/SentimentNewsPanel'
import { LiquidOptionsSentimentService, type LiquidOptionSentimentScore } from '../services/liquidOptionsSentimentService'
import { PolygonService } from '../services/polygonService'

export default function LiquidOptionsSentimentHeatMap() {
  const [selectedContractTicker, setSelectedContractTicker] = useState<string | null>(null)
  const [sentimentData, setSentimentData] = useState<LiquidOptionSentimentScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const liquidTickers = LiquidOptionsSentimentService.getLiquidTickers()

  useEffect(() => {
    if (selectedContractTicker) {
      loadSentimentData(selectedContractTicker)
    }
  }, [selectedContractTicker])

  const loadSentimentData = async (contractTicker: string) => {
    setLoading(true)
    try {
      const data = await LiquidOptionsSentimentService.getSentimentScoreForContract(contractTicker)
      setSentimentData(data)
    } catch (error) {
      console.error('Error loading sentiment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAllSentiment = async () => {
    setSyncing(true)
    try {
      const contracts = PolygonService.getAllOptionsContracts()
      const liquidContracts = contracts.filter(c => liquidTickers.includes(c.underlying_ticker))

      console.log(`Syncing sentiment for ${liquidContracts.length} liquid options contracts...`)
      const scores = await LiquidOptionsSentimentService.calculateSentimentForAllLiquidOptions(liquidContracts)
      await LiquidOptionsSentimentService.storeSentimentScores(scores)

      alert(`Successfully synced sentiment for ${scores.length} contracts!`)
      window.location.reload()
    } catch (error) {
      console.error('Error syncing sentiment:', error)
      alert('Failed to sync sentiment data. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1920px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-10 h-10 text-blue-600" />
                Liquid Options Sentiment HeatMap
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Real-time sentiment analysis combining FinBERT AI, analyst ratings, and market events
              </p>
            </div>

            <button
              onClick={handleSyncAllSentiment}
              disabled={syncing}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Sentiment Data'}
            </button>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">About This HeatMap</p>
                <p>
                  This advanced sentiment heatmap visualizes composite sentiment scores for liquid options contracts across major tickers
                  (SPY, QQQ, AAPL, TSLA, NVDA, and more). Sentiment is calculated using a weighted combination of:
                </p>
                <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                  <li><strong>FinBERT AI Analysis</strong> - Natural language processing on financial news</li>
                  <li><strong>Analyst Ratings</strong> - Professional recommendations from major financial firms</li>
                  <li><strong>Market Events</strong> - Impact of earnings reports, M&A activity, and regulatory changes</li>
                </ul>
                <p className="mt-2">
                  Click any cell to see detailed breakdown including news articles, analyst ratings, and sentiment trends.
                  Use filters to customize the view by expiration type and sentiment mode.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <SentimentHeatMapViewer
            defaultTickers={liquidTickers}
            defaultExpiryType="Weekly"
            defaultSentimentMode="composite"
            onCellClick={(contractTicker) => setSelectedContractTicker(contractTicker)}
            height={900}
          />
        </div>

        {selectedContractTicker && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Contract Details: {selectedContractTicker}
              </h2>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Loading sentiment details...</p>
              </div>
            ) : sentimentData ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <SentimentScoreCard
                    compositeScore={sentimentData.composite_sentiment_score}
                    finbertScore={sentimentData.finbert_sentiment_score}
                    analystScore={sentimentData.analyst_sentiment_score}
                    eventScore={sentimentData.event_sentiment_score}
                    confidence={sentimentData.sentiment_confidence}
                    momentum={sentimentData.sentiment_momentum}
                    trend={sentimentData.sentiment_trend}
                    newsCount={sentimentData.news_article_count}
                    analystCount={sentimentData.analyst_rating_count}
                    showBreakdown={true}
                  />
                </div>

                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 gap-6">
                    <SentimentBreakdownPanel
                      ticker={sentimentData.underlying_ticker}
                      contractTicker={sentimentData.contract_ticker}
                      finbertScore={sentimentData.finbert_sentiment_score}
                      analystScore={sentimentData.analyst_sentiment_score}
                      eventScore={sentimentData.event_sentiment_score}
                      newsArticleCount={sentimentData.news_article_count}
                      positiveNewsCount={sentimentData.positive_news_count}
                      negativeNewsCount={sentimentData.negative_news_count}
                      neutralNewsCount={sentimentData.neutral_news_count}
                      analystRatingCount={sentimentData.analyst_rating_count}
                      recentUpgradeCount={sentimentData.recent_upgrade_count}
                      recentDowngradeCount={sentimentData.recent_downgrade_count}
                      lastMajorEvent={sentimentData.last_major_event}
                      sentimentVolatility={sentimentData.sentiment_volatility}
                    />

                    <SentimentNewsPanel
                      ticker={sentimentData.underlying_ticker}
                      maxArticles={10}
                      daysBack={7}
                      sentimentFilter="all"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No sentiment data available for this contract</p>
                <p className="text-sm text-gray-500 mt-2">Click "Sync Sentiment Data" to generate fresh analysis</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Important Disclaimers</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Educational Purpose:</strong> This sentiment analysis tool is provided for educational and informational
                  purposes only. It should not be considered as financial advice or a recommendation to buy or sell any securities.
                </p>
                <p>
                  <strong>Sentiment vs. Performance:</strong> Historical sentiment scores do not guarantee future price movements.
                  Market sentiment is one of many factors that influence options pricing, including implied volatility, time decay,
                  interest rates, and underlying asset price movements.
                </p>
                <p>
                  <strong>Data Accuracy:</strong> While we strive for accuracy, sentiment analysis is inherently subjective and
                  may not capture all market nuances. Always conduct your own research and consult with financial advisors before
                  making investment decisions.
                </p>
                <p>
                  <strong>Options Trading Risks:</strong> Options trading involves substantial risk and is not suitable for all
                  investors. You can lose more than your initial investment. Please understand the risks before trading options.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
