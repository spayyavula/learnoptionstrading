import { supabase } from '../lib/supabase'
import { FinBERTSentimentService, type SentimentAnalysisResult } from './finbertSentimentService'
import { AnalystRecommendationsService, type ConsensusRating } from './analystRecommendationsService'
import { NewsFeedService, type NewsArticle } from './newsFeedService'
import type { OptionsContract } from '../types/options'

export interface LiquidOptionSentimentScore {
  id?: string
  contract_ticker: string
  underlying_ticker: string
  strike_price: number
  contract_type: 'call' | 'put'
  expiration_date: string
  date: string
  composite_sentiment_score: number
  finbert_sentiment_score: number
  analyst_sentiment_score: number
  event_sentiment_score: number
  sentiment_confidence: number
  sentiment_momentum: number
  sentiment_trend: 'rising' | 'falling' | 'stable' | 'accelerating' | 'decelerating'
  news_article_count: number
  positive_news_count: number
  negative_news_count: number
  neutral_news_count: number
  analyst_rating_count: number
  recent_upgrade_count: number
  recent_downgrade_count: number
  last_major_event?: string
  sentiment_volatility: number
  created_at?: string
  updated_at?: string
}

export interface SentimentWeights {
  finbert: number
  analyst: number
  events: number
}

export interface SentimentTrendData {
  current_score: number
  previous_score: number
  momentum: number
  trend: 'rising' | 'falling' | 'stable' | 'accelerating' | 'decelerating'
  volatility: number
}

export class LiquidOptionsSentimentService {
  private static readonly DEFAULT_WEIGHTS: SentimentWeights = {
    finbert: 0.5,
    analyst: 0.35,
    events: 0.15
  }

  private static readonly LIQUID_TICKERS = [
    'SPY', 'SPX', 'QQQ', 'AAPL', 'MSFT', 'NVDA',
    'TSLA', 'AMZN', 'GOOGL', 'META', 'IWM', 'DIA'
  ]

  static async calculateSentimentForContract(
    contract: OptionsContract,
    weights: SentimentWeights = this.DEFAULT_WEIGHTS
  ): Promise<LiquidOptionSentimentScore> {
    const ticker = contract.underlying_ticker

    const finbertScore = await this.calculateFinBERTScore(ticker)
    const analystScore = await this.calculateAnalystScore(ticker)
    const eventScore = await this.calculateEventScore(ticker)

    const compositeScore = (
      finbertScore.score * weights.finbert +
      analystScore.score * weights.analyst +
      eventScore.score * weights.events
    )

    const confidence = (
      finbertScore.confidence * weights.finbert +
      analystScore.confidence * weights.analyst +
      eventScore.confidence * weights.events
    )

    const trendData = await this.calculateSentimentTrend(ticker, compositeScore)

    const sentimentScore: LiquidOptionSentimentScore = {
      contract_ticker: contract.ticker,
      underlying_ticker: ticker,
      strike_price: contract.strike_price,
      contract_type: contract.contract_type,
      expiration_date: contract.expiration_date,
      date: new Date().toISOString().split('T')[0],
      composite_sentiment_score: compositeScore,
      finbert_sentiment_score: finbertScore.score,
      analyst_sentiment_score: analystScore.score,
      event_sentiment_score: eventScore.score,
      sentiment_confidence: confidence,
      sentiment_momentum: trendData.momentum,
      sentiment_trend: trendData.trend,
      news_article_count: finbertScore.article_count,
      positive_news_count: finbertScore.positive_count,
      negative_news_count: finbertScore.negative_count,
      neutral_news_count: finbertScore.neutral_count,
      analyst_rating_count: analystScore.rating_count,
      recent_upgrade_count: analystScore.upgrade_count,
      recent_downgrade_count: analystScore.downgrade_count,
      last_major_event: eventScore.last_event,
      sentiment_volatility: trendData.volatility
    }

    return sentimentScore
  }

  static async calculateSentimentForAllLiquidOptions(
    contracts: OptionsContract[]
  ): Promise<LiquidOptionSentimentScore[]> {
    const scores: LiquidOptionSentimentScore[] = []

    const contractsByTicker = this.groupContractsByTicker(contracts)

    for (const [ticker, tickerContracts] of contractsByTicker) {
      console.log(`Calculating sentiment for ${tickerContracts.length} ${ticker} contracts...`)

      const finbertScore = await this.calculateFinBERTScore(ticker)
      const analystScore = await this.calculateAnalystScore(ticker)
      const eventScore = await this.calculateEventScore(ticker)

      const compositeScore = (
        finbertScore.score * this.DEFAULT_WEIGHTS.finbert +
        analystScore.score * this.DEFAULT_WEIGHTS.analyst +
        eventScore.score * this.DEFAULT_WEIGHTS.events
      )

      const confidence = (
        finbertScore.confidence * this.DEFAULT_WEIGHTS.finbert +
        analystScore.confidence * this.DEFAULT_WEIGHTS.analyst +
        eventScore.confidence * this.DEFAULT_WEIGHTS.events
      )

      const trendData = await this.calculateSentimentTrend(ticker, compositeScore)

      for (const contract of tickerContracts) {
        const sentimentScore: LiquidOptionSentimentScore = {
          contract_ticker: contract.ticker,
          underlying_ticker: ticker,
          strike_price: contract.strike_price,
          contract_type: contract.contract_type,
          expiration_date: contract.expiration_date,
          date: new Date().toISOString().split('T')[0],
          composite_sentiment_score: compositeScore,
          finbert_sentiment_score: finbertScore.score,
          analyst_sentiment_score: analystScore.score,
          event_sentiment_score: eventScore.score,
          sentiment_confidence: confidence,
          sentiment_momentum: trendData.momentum,
          sentiment_trend: trendData.trend,
          news_article_count: finbertScore.article_count,
          positive_news_count: finbertScore.positive_count,
          negative_news_count: finbertScore.negative_count,
          neutral_news_count: finbertScore.neutral_count,
          analyst_rating_count: analystScore.rating_count,
          recent_upgrade_count: analystScore.upgrade_count,
          recent_downgrade_count: analystScore.downgrade_count,
          last_major_event: eventScore.last_event,
          sentiment_volatility: trendData.volatility
        }

        scores.push(sentimentScore)
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return scores
  }

  private static async calculateFinBERTScore(ticker: string): Promise<{
    score: number
    confidence: number
    article_count: number
    positive_count: number
    negative_count: number
    neutral_count: number
  }> {
    try {
      const sentiments = await FinBERTSentimentService.getSentimentForTicker(ticker, 7)

      if (sentiments.length === 0) {
        const articles = await NewsFeedService.fetchNewsForTicker(ticker, 7)
        if (articles.length > 0) {
          const analyzed = await FinBERTSentimentService.analyzeBatch(articles.slice(0, 20), 5)
          sentiments.push(...analyzed)
        }
      }

      if (sentiments.length === 0) {
        return {
          score: 0,
          confidence: 0,
          article_count: 0,
          positive_count: 0,
          negative_count: 0,
          neutral_count: 0
        }
      }

      const aggregate = FinBERTSentimentService.calculateAggregateSentiment(sentiments)

      const score = aggregate.averageScore * 100

      return {
        score,
        confidence: aggregate.confidence * 100,
        article_count: sentiments.length,
        positive_count: aggregate.positiveCount,
        negative_count: aggregate.negativeCount,
        neutral_count: aggregate.neutralCount
      }
    } catch (error) {
      console.error(`Error calculating FinBERT score for ${ticker}:`, error)
      return {
        score: 0,
        confidence: 0,
        article_count: 0,
        positive_count: 0,
        negative_count: 0,
        neutral_count: 0
      }
    }
  }

  private static async calculateAnalystScore(ticker: string): Promise<{
    score: number
    confidence: number
    rating_count: number
    upgrade_count: number
    downgrade_count: number
  }> {
    try {
      const consensus = await AnalystRecommendationsService.getConsensusRating(ticker)

      if (!consensus) {
        return {
          score: 0,
          confidence: 50,
          rating_count: 0,
          upgrade_count: 0,
          downgrade_count: 0
        }
      }

      const score = AnalystRecommendationsService.calculateAnalystSentiment(consensus)

      const recentChanges = await AnalystRecommendationsService.getRecentRatingChanges(ticker, 30)
      const upgrades = recentChanges.filter(c => c.change_type === 'upgrade').length
      const downgrades = recentChanges.filter(c => c.change_type === 'downgrade').length

      const confidence = Math.min(100, (consensus.total_analysts / 5) * 100)

      return {
        score,
        confidence,
        rating_count: consensus.total_analysts,
        upgrade_count: upgrades,
        downgrade_count: downgrades
      }
    } catch (error) {
      console.error(`Error calculating analyst score for ${ticker}:`, error)
      return {
        score: 0,
        confidence: 50,
        rating_count: 0,
        upgrade_count: 0,
        downgrade_count: 0
      }
    }
  }

  private static async calculateEventScore(ticker: string): Promise<{
    score: number
    confidence: number
    last_event?: string
  }> {
    try {
      const { data: recentEvents, error } = await supabase
        .from('market_events')
        .select('*')
        .eq('ticker', ticker)
        .gte('event_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('event_date', { ascending: false })
        .limit(5)

      if (error || !recentEvents || recentEvents.length === 0) {
        return { score: 0, confidence: 0 }
      }

      let totalScore = 0
      let totalWeight = 0

      recentEvents.forEach((event, index) => {
        const daysSinceEvent = Math.floor((Date.now() - new Date(event.event_date).getTime()) / (24 * 60 * 60 * 1000))
        const timeWeight = Math.max(0.1, 1 - (daysSinceEvent / 30))

        let eventScore = 0
        if (event.surprise_factor !== null) {
          eventScore = event.surprise_factor * 10
        } else {
          switch (event.impact_severity) {
            case 'critical': eventScore = 50; break
            case 'high': eventScore = 30; break
            case 'medium': eventScore = 10; break
            case 'low': eventScore = 5; break
          }
        }

        totalScore += eventScore * timeWeight
        totalWeight += timeWeight
      })

      const score = totalWeight > 0 ? totalScore / totalWeight : 0
      const confidence = Math.min(100, recentEvents.length * 20)

      return {
        score,
        confidence,
        last_event: recentEvents[0]?.event_title
      }
    } catch (error) {
      console.error(`Error calculating event score for ${ticker}:`, error)
      return { score: 0, confidence: 0 }
    }
  }

  private static async calculateSentimentTrend(
    ticker: string,
    currentScore: number
  ): Promise<SentimentTrendData> {
    try {
      const { data: historicalScores, error } = await supabase
        .from('liquid_options_sentiment_scores')
        .select('composite_sentiment_score, date')
        .eq('underlying_ticker', ticker)
        .order('date', { ascending: false })
        .limit(7)

      if (error || !historicalScores || historicalScores.length < 2) {
        return {
          current_score: currentScore,
          previous_score: currentScore,
          momentum: 0,
          trend: 'stable',
          volatility: 0
        }
      }

      const scores = [currentScore, ...historicalScores.map(s => s.composite_sentiment_score)]

      const previousScore = scores[1]
      const momentum = currentScore - previousScore

      let trend: SentimentTrendData['trend'] = 'stable'
      if (scores.length >= 3) {
        const previousMomentum = previousScore - scores[2]
        const acceleration = momentum - previousMomentum

        if (Math.abs(momentum) < 5) {
          trend = 'stable'
        } else if (momentum > 0) {
          trend = acceleration > 5 ? 'accelerating' : 'rising'
        } else {
          trend = acceleration < -5 ? 'decelerating' : 'falling'
        }
      } else {
        if (momentum > 5) trend = 'rising'
        else if (momentum < -5) trend = 'falling'
      }

      const mean = scores.reduce((a, b) => a + b, 0) / scores.length
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
      const volatility = Math.sqrt(variance)

      return {
        current_score: currentScore,
        previous_score: previousScore,
        momentum,
        trend,
        volatility
      }
    } catch (error) {
      console.error(`Error calculating sentiment trend for ${ticker}:`, error)
      return {
        current_score: currentScore,
        previous_score: currentScore,
        momentum: 0,
        trend: 'stable',
        volatility: 0
      }
    }
  }

  static async storeSentimentScores(scores: LiquidOptionSentimentScore[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('liquid_options_sentiment_scores')
        .upsert(
          scores.map(score => ({
            contract_ticker: score.contract_ticker,
            underlying_ticker: score.underlying_ticker,
            strike_price: score.strike_price,
            contract_type: score.contract_type,
            expiration_date: score.expiration_date,
            date: score.date,
            composite_sentiment_score: score.composite_sentiment_score,
            finbert_sentiment_score: score.finbert_sentiment_score,
            analyst_sentiment_score: score.analyst_sentiment_score,
            event_sentiment_score: score.event_sentiment_score,
            sentiment_confidence: score.sentiment_confidence,
            sentiment_momentum: score.sentiment_momentum,
            sentiment_trend: score.sentiment_trend,
            news_article_count: score.news_article_count,
            positive_news_count: score.positive_news_count,
            negative_news_count: score.negative_news_count,
            neutral_news_count: score.neutral_news_count,
            analyst_rating_count: score.analyst_rating_count,
            recent_upgrade_count: score.recent_upgrade_count,
            recent_downgrade_count: score.recent_downgrade_count,
            last_major_event: score.last_major_event,
            sentiment_volatility: score.sentiment_volatility
          })),
          {
            onConflict: 'contract_ticker,date'
          }
        )

      if (error) {
        console.error('Error storing sentiment scores:', error)
      } else {
        console.log(`Successfully stored ${scores.length} sentiment scores`)
      }
    } catch (error) {
      console.error('Failed to store sentiment scores:', error)
    }
  }

  static async getSentimentScores(
    tickers?: string[],
    daysBack: number = 1
  ): Promise<LiquidOptionSentimentScore[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.setDate() - daysBack)

      let query = supabase
        .from('liquid_options_sentiment_scores')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('composite_sentiment_score', { ascending: false })

      if (tickers && tickers.length > 0) {
        query = query.in('underlying_ticker', tickers)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching sentiment scores:', error)
        return []
      }

      return data as LiquidOptionSentimentScore[]
    } catch (error) {
      console.error('Failed to get sentiment scores:', error)
      return []
    }
  }

  static async getSentimentScoreForContract(
    contractTicker: string,
    date?: string
  ): Promise<LiquidOptionSentimentScore | null> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('liquid_options_sentiment_scores')
        .select('*')
        .eq('contract_ticker', contractTicker)
        .eq('date', targetDate)
        .maybeSingle()

      if (error) {
        console.error('Error fetching sentiment score:', error)
        return null
      }

      return data as LiquidOptionSentimentScore | null
    } catch (error) {
      console.error('Failed to get sentiment score for contract:', error)
      return null
    }
  }

  private static groupContractsByTicker(
    contracts: OptionsContract[]
  ): Map<string, OptionsContract[]> {
    const grouped = new Map<string, OptionsContract[]>()

    contracts.forEach(contract => {
      const ticker = contract.underlying_ticker
      if (!grouped.has(ticker)) {
        grouped.set(ticker, [])
      }
      grouped.get(ticker)!.push(contract)
    })

    return grouped
  }

  static getSentimentColor(score: number): string {
    if (score >= 60) return '#16a34a'
    if (score >= 30) return '#22c55e'
    if (score >= 10) return '#84cc16'
    if (score >= -10) return '#eab308'
    if (score >= -30) return '#f97316'
    if (score >= -60) return '#ef4444'
    return '#dc2626'
  }

  static getSentimentLabel(score: number): string {
    if (score >= 60) return 'Very Bullish'
    if (score >= 30) return 'Bullish'
    if (score >= 10) return 'Slightly Bullish'
    if (score >= -10) return 'Neutral'
    if (score >= -30) return 'Slightly Bearish'
    if (score >= -60) return 'Bearish'
    return 'Very Bearish'
  }

  static getTrendIcon(trend: string): string {
    switch (trend) {
      case 'accelerating': return '⏫'
      case 'rising': return '📈'
      case 'stable': return '➡️'
      case 'falling': return '📉'
      case 'decelerating': return '⏬'
      default: return '❓'
    }
  }

  static getLiquidTickers(): string[] {
    return [...this.LIQUID_TICKERS]
  }
}
