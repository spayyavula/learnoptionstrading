import { supabase } from '../lib/supabase'
import { NewsFeedService } from './newsFeedService'
import { FinBERTSentimentService, type SentimentAnalysisResult } from './finbertSentimentService'
import { PolygonService } from './polygonService'
import type { OptionsContract } from '../types/options'

export interface OptionsSentimentScore {
  id?: string
  ticker: string
  option_ticker: string
  date: string
  overall_sentiment_score: number
  finbert_sentiment_score: number
  news_count: number
  positive_count: number
  negative_count: number
  neutral_count: number
  sentiment_momentum: number
  sentiment_trend: 'rising' | 'falling' | 'stable'
  high_impact_news_count: number
  average_confidence: number
  created_at?: string
}

export interface SentimentTrend {
  ticker: string
  date: string
  hour: number
  sentiment_score: number
  sentiment_category: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
  volume: number
  momentum: number
}

export class OptionsSentimentService {
  static async calculateSentimentForOption(
    underlyingTicker: string,
    optionTicker: string
  ): Promise<OptionsSentimentScore | null> {
    try {
      const newsArticles = await NewsFeedService.getStoredNews(underlyingTicker, 7)

      if (newsArticles.length === 0) {
        console.log(`No news articles found for ${underlyingTicker}, fetching...`)
        await NewsFeedService.fetchNewsForTicker(underlyingTicker, 7)
        return this.calculateSentimentForOption(underlyingTicker, optionTicker)
      }

      const sentiments: SentimentAnalysisResult[] = []
      for (const article of newsArticles) {
        let sentiment = await FinBERTSentimentService.getSentimentForArticle(article.id!)
        if (!sentiment) {
          sentiment = await FinBERTSentimentService.analyzeArticle(article)
        }
        sentiments.push(sentiment)
      }

      const aggregate = FinBERTSentimentService.calculateAggregateSentiment(sentiments)

      const previousSentiment = await this.getPreviousSentiment(optionTicker)
      const momentum = previousSentiment
        ? aggregate.averageScore * 100 - previousSentiment.overall_sentiment_score
        : 0

      const trend = this.determineTrend(momentum)

      const highImpactCount = sentiments.filter(s =>
        s.confidence > 0.8 && Math.abs(s.finbert_score) > 0.5
      ).length

      const sentimentScore: OptionsSentimentScore = {
        ticker: underlyingTicker,
        option_ticker: optionTicker,
        date: new Date().toISOString().split('T')[0],
        overall_sentiment_score: aggregate.averageScore * 100,
        finbert_sentiment_score: aggregate.averageScore * 100,
        news_count: newsArticles.length,
        positive_count: aggregate.positiveCount,
        negative_count: aggregate.negativeCount,
        neutral_count: aggregate.neutralCount,
        sentiment_momentum: momentum,
        sentiment_trend: trend,
        high_impact_news_count: highImpactCount,
        average_confidence: aggregate.confidence
      }

      await this.storeSentimentScore(sentimentScore)
      await this.updateSentimentTrend(underlyingTicker, aggregate.averageScore * 100, sentiments.length)

      return sentimentScore
    } catch (error) {
      console.error('Error calculating sentiment for option:', error)
      return null
    }
  }

  static async calculateSentimentForLiquidOptions(): Promise<Map<string, OptionsSentimentScore>> {
    const liquidOptions = PolygonService.getTopLiquidOptions()
    const results = new Map<string, OptionsSentimentScore>()

    for (const option of liquidOptions) {
      try {
        const sentiment = await this.calculateSentimentForOption(
          option.underlying_ticker,
          option.ticker
        )

        if (sentiment) {
          results.set(option.ticker, sentiment)
          console.log(`Calculated sentiment for ${option.ticker}: ${sentiment.overall_sentiment_score.toFixed(2)}`)
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error calculating sentiment for ${option.ticker}:`, error)
      }
    }

    return results
  }

  private static determineTrend(momentum: number): 'rising' | 'falling' | 'stable' {
    if (momentum > 5) return 'rising'
    if (momentum < -5) return 'falling'
    return 'stable'
  }

  private static async getPreviousSentiment(optionTicker: string): Promise<OptionsSentimentScore | null> {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { data, error } = await supabase
        .from('options_sentiment_scores')
        .select('*')
        .eq('option_ticker', optionTicker)
        .lte('date', yesterday.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        return null
      }

      return data as OptionsSentimentScore | null
    } catch (error) {
      return null
    }
  }

  private static async storeSentimentScore(score: OptionsSentimentScore): Promise<void> {
    try {
      const { error } = await supabase
        .from('options_sentiment_scores')
        .upsert({
          ticker: score.ticker,
          option_ticker: score.option_ticker,
          date: score.date,
          overall_sentiment_score: score.overall_sentiment_score,
          finbert_sentiment_score: score.finbert_sentiment_score,
          news_count: score.news_count,
          positive_count: score.positive_count,
          negative_count: score.negative_count,
          neutral_count: score.neutral_count,
          sentiment_momentum: score.sentiment_momentum,
          sentiment_trend: score.sentiment_trend,
          high_impact_news_count: score.high_impact_news_count,
          average_confidence: score.average_confidence
        }, {
          onConflict: 'option_ticker,date'
        })

      if (error) {
        console.error('Error storing sentiment score:', error)
      }
    } catch (error) {
      console.error('Failed to store sentiment score:', error)
    }
  }

  static async getSentimentScore(optionTicker: string, date?: string): Promise<OptionsSentimentScore | null> {
    try {
      const queryDate = date || new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('options_sentiment_scores')
        .select('*')
        .eq('option_ticker', optionTicker)
        .eq('date', queryDate)
        .maybeSingle()

      if (error) {
        console.error('Error fetching sentiment score:', error)
        return null
      }

      return data as OptionsSentimentScore | null
    } catch (error) {
      console.error('Failed to get sentiment score:', error)
      return null
    }
  }

  static async getSentimentScoresByTicker(ticker: string, daysBack: number = 30): Promise<OptionsSentimentScore[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const { data, error } = await supabase
        .from('options_sentiment_scores')
        .select('*')
        .eq('ticker', ticker)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching sentiment scores:', error)
        return []
      }

      return data as OptionsSentimentScore[]
    } catch (error) {
      console.error('Failed to get sentiment scores:', error)
      return []
    }
  }

  private static async updateSentimentTrend(
    ticker: string,
    sentimentScore: number,
    volume: number
  ): Promise<void> {
    try {
      const now = new Date()
      const date = now.toISOString().split('T')[0]
      const hour = now.getHours()

      const category = this.categorizeSentiment(sentimentScore)

      const previousTrend = await this.getPreviousTrend(ticker, date, hour - 1)
      const momentum = previousTrend ? sentimentScore - previousTrend.sentiment_score : 0

      const { error } = await supabase
        .from('sentiment_trends')
        .upsert({
          ticker,
          date,
          hour,
          sentiment_score: sentimentScore,
          sentiment_category: category,
          volume,
          momentum
        }, {
          onConflict: 'ticker,date,hour'
        })

      if (error) {
        console.error('Error updating sentiment trend:', error)
      }
    } catch (error) {
      console.error('Failed to update sentiment trend:', error)
    }
  }

  private static async getPreviousTrend(
    ticker: string,
    date: string,
    hour: number
  ): Promise<SentimentTrend | null> {
    try {
      const { data, error } = await supabase
        .from('sentiment_trends')
        .select('*')
        .eq('ticker', ticker)
        .eq('date', date)
        .eq('hour', hour)
        .maybeSingle()

      if (error) {
        return null
      }

      return data as SentimentTrend | null
    } catch (error) {
      return null
    }
  }

  static async getSentimentTrends(ticker: string, daysBack: number = 7): Promise<SentimentTrend[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const { data, error } = await supabase
        .from('sentiment_trends')
        .select('*')
        .eq('ticker', ticker)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('hour', { ascending: true })

      if (error) {
        console.error('Error fetching sentiment trends:', error)
        return []
      }

      return data as SentimentTrend[]
    } catch (error) {
      console.error('Failed to get sentiment trends:', error)
      return []
    }
  }

  private static categorizeSentiment(score: number): 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' {
    if (score >= 50) return 'very_positive'
    if (score >= 15) return 'positive'
    if (score >= -15) return 'neutral'
    if (score >= -50) return 'negative'
    return 'very_negative'
  }

  static getSentimentColor(score: number): string {
    if (score >= 50) return '#16a34a'
    if (score >= 15) return '#22c55e'
    if (score >= -15) return '#eab308'
    if (score >= -50) return '#f97316'
    return '#dc2626'
  }

  static getSentimentEmoji(trend: string): string {
    const emojis: Record<string, string> = {
      rising: '🚀',
      falling: '📉',
      stable: '➡️'
    }
    return emojis[trend] || '📊'
  }

  static getSentimentRecommendation(score: OptionsSentimentScore): string {
    if (score.overall_sentiment_score > 50 && score.sentiment_trend === 'rising') {
      return 'Strong bullish sentiment with positive momentum. Consider call options.'
    }
    if (score.overall_sentiment_score < -50 && score.sentiment_trend === 'falling') {
      return 'Strong bearish sentiment with negative momentum. Consider put options.'
    }
    if (Math.abs(score.sentiment_momentum) > 20) {
      return 'High sentiment volatility detected. Monitor for trading opportunities.'
    }
    if (score.overall_sentiment_score > 15 && score.sentiment_trend !== 'falling') {
      return 'Moderately positive sentiment. Favorable for bullish strategies.'
    }
    if (score.overall_sentiment_score < -15 && score.sentiment_trend !== 'rising') {
      return 'Moderately negative sentiment. Favorable for bearish strategies.'
    }
    return 'Neutral sentiment. Consider waiting for clearer directional signals.'
  }

  static async syncAllSentiments(): Promise<void> {
    console.log('Starting full sentiment sync for liquid options...')

    await NewsFeedService.syncNewsForLiquidOptions()

    const liquidOptions = PolygonService.getTopLiquidOptions()
    const underlyingTickers = [...new Set(liquidOptions.map(o => o.underlying_ticker))]

    for (const ticker of underlyingTickers) {
      const articles = await NewsFeedService.getStoredNews(ticker, 7)
      console.log(`Analyzing ${articles.length} articles for ${ticker}`)

      if (articles.length > 0) {
        await FinBERTSentimentService.analyzeBatch(articles, 10)
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const sentimentResults = await this.calculateSentimentForLiquidOptions()

    console.log(`Sentiment sync completed. Processed ${sentimentResults.size} options.`)
  }
}
