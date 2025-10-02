import { supabase } from '../lib/supabase'
import type { NewsArticle } from './newsFeedService'

export interface SentimentAnalysisResult {
  id?: string
  article_id?: string
  ticker: string
  finbert_score: number
  finbert_label: 'positive' | 'negative' | 'neutral'
  confidence: number
  positive_probability: number
  negative_probability: number
  neutral_probability: number
  sentiment_magnitude: number
  analyzed_at?: string
  model_version: string
  created_at?: string
}

export interface FinBERTResponse {
  label: string
  score: number
}

export class FinBERTSentimentService {
  private static readonly HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY
  private static readonly FINBERT_MODEL = 'ProsusAI/finbert'
  private static readonly API_URL = `https://api-inference.huggingface.co/models/${this.FINBERT_MODEL}`

  private static readonly POSITIVE_KEYWORDS = [
    'surge', 'beat', 'exceed', 'growth', 'profit', 'gain', 'rise', 'bullish',
    'strong', 'upgrade', 'outperform', 'buy', 'optimistic', 'positive', 'record',
    'breakthrough', 'innovation', 'success', 'recovery', 'expansion', 'soar',
    'rally', 'boom', 'momentum', 'breakout', 'upside', 'bullish', 'advance'
  ]

  private static readonly NEGATIVE_KEYWORDS = [
    'plunge', 'miss', 'drop', 'loss', 'decline', 'fall', 'bearish', 'weak',
    'downgrade', 'underperform', 'sell', 'pessimistic', 'negative', 'concern',
    'risk', 'warning', 'shortage', 'delay', 'lawsuit', 'investigation', 'crash',
    'slump', 'tumble', 'struggle', 'plummet', 'downside', 'bearish', 'decline'
  ]

  static async analyzeSentiment(text: string, ticker: string, articleId?: string): Promise<SentimentAnalysisResult> {
    try {
      if (this.HUGGINGFACE_API_KEY && this.HUGGINGFACE_API_KEY !== 'demo_api_key') {
        return await this.analyzeWithFinBERT(text, ticker, articleId)
      } else {
        console.log('Using fallback sentiment analysis')
        return this.analyzeWithKeywords(text, ticker, articleId)
      }
    } catch (error) {
      console.error('FinBERT analysis failed, using fallback:', error)
      return this.analyzeWithKeywords(text, ticker, articleId)
    }
  }

  private static async analyzeWithFinBERT(text: string, ticker: string, articleId?: string): Promise<SentimentAnalysisResult> {
    const truncatedText = text.substring(0, 512)

    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: truncatedText,
        options: {
          wait_for_model: true
        }
      })
    })

    if (!response.ok) {
      throw new Error(`FinBERT API error: ${response.status}`)
    }

    const results = await response.json()

    if (!results || !Array.isArray(results) || results.length === 0) {
      throw new Error('Invalid FinBERT response')
    }

    const sentiments = results[0]
    const positiveProb = sentiments.find((s: any) => s.label === 'positive')?.score || 0
    const negativeProb = sentiments.find((s: any) => s.label === 'negative')?.score || 0
    const neutralProb = sentiments.find((s: any) => s.label === 'neutral')?.score || 0

    const maxProb = Math.max(positiveProb, negativeProb, neutralProb)
    let label: 'positive' | 'negative' | 'neutral' = 'neutral'
    if (positiveProb === maxProb) label = 'positive'
    else if (negativeProb === maxProb) label = 'negative'

    const score = positiveProb - negativeProb
    const magnitude = Math.max(positiveProb, negativeProb, neutralProb)

    const result: SentimentAnalysisResult = {
      article_id: articleId,
      ticker,
      finbert_score: score,
      finbert_label: label,
      confidence: maxProb,
      positive_probability: positiveProb,
      negative_probability: negativeProb,
      neutral_probability: neutralProb,
      sentiment_magnitude: magnitude,
      model_version: this.FINBERT_MODEL
    }

    return result
  }

  private static analyzeWithKeywords(text: string, ticker: string, articleId?: string): SentimentAnalysisResult {
    if (!text) {
      return this.createNeutralResult(ticker, articleId)
    }

    const lowerText = text.toLowerCase()
    let positiveCount = 0
    let negativeCount = 0

    this.POSITIVE_KEYWORDS.forEach(keyword => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length
      positiveCount += matches
    })

    this.NEGATIVE_KEYWORDS.forEach(keyword => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length
      negativeCount += matches
    })

    const totalCount = positiveCount + negativeCount
    if (totalCount === 0) {
      return this.createNeutralResult(ticker, articleId)
    }

    const positiveProb = positiveCount / totalCount
    const negativeProb = negativeCount / totalCount
    const neutralProb = 0.1

    let label: 'positive' | 'negative' | 'neutral' = 'neutral'
    if (positiveProb > negativeProb && positiveProb > 0.4) {
      label = 'positive'
    } else if (negativeProb > positiveProb && negativeProb > 0.4) {
      label = 'negative'
    }

    const score = (positiveProb - negativeProb)
    const maxProb = Math.max(positiveProb, negativeProb, neutralProb)

    return {
      article_id: articleId,
      ticker,
      finbert_score: score,
      finbert_label: label,
      confidence: maxProb,
      positive_probability: positiveProb,
      negative_probability: negativeProb,
      neutral_probability: neutralProb,
      sentiment_magnitude: maxProb,
      model_version: 'keyword-based-fallback'
    }
  }

  private static createNeutralResult(ticker: string, articleId?: string): SentimentAnalysisResult {
    return {
      article_id: articleId,
      ticker,
      finbert_score: 0,
      finbert_label: 'neutral',
      confidence: 0.5,
      positive_probability: 0.33,
      negative_probability: 0.33,
      neutral_probability: 0.34,
      sentiment_magnitude: 0.34,
      model_version: 'fallback'
    }
  }

  static async analyzeArticle(article: NewsArticle): Promise<SentimentAnalysisResult> {
    const text = `${article.headline}. ${article.summary || ''}`
    const result = await this.analyzeSentiment(text, article.ticker, article.id)

    await this.storeSentimentAnalysis(result)

    return result
  }

  static async analyzeMultipleArticles(articles: NewsArticle[]): Promise<SentimentAnalysisResult[]> {
    const results: SentimentAnalysisResult[] = []

    for (const article of articles) {
      try {
        const result = await this.analyzeArticle(article)
        results.push(result)

        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error('Error analyzing article:', error)
      }
    }

    return results
  }

  static async analyzeBatch(articles: NewsArticle[], batchSize: number = 10): Promise<SentimentAnalysisResult[]> {
    const results: SentimentAnalysisResult[] = []

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize)
      console.log(`Analyzing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(articles.length / batchSize)}`)

      const batchResults = await this.analyzeMultipleArticles(batch)
      results.push(...batchResults)

      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  private static async storeSentimentAnalysis(result: SentimentAnalysisResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('sentiment_analysis')
        .insert({
          article_id: result.article_id,
          ticker: result.ticker,
          finbert_score: result.finbert_score,
          finbert_label: result.finbert_label,
          confidence: result.confidence,
          positive_probability: result.positive_probability,
          negative_probability: result.negative_probability,
          neutral_probability: result.neutral_probability,
          sentiment_magnitude: result.sentiment_magnitude,
          model_version: result.model_version
        })

      if (error) {
        console.error('Error storing sentiment analysis:', error)
      }
    } catch (error) {
      console.error('Failed to store sentiment analysis:', error)
    }
  }

  static async getSentimentForArticle(articleId: string): Promise<SentimentAnalysisResult | null> {
    try {
      const { data, error } = await supabase
        .from('sentiment_analysis')
        .select('*')
        .eq('article_id', articleId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching sentiment:', error)
        return null
      }

      return data as SentimentAnalysisResult | null
    } catch (error) {
      console.error('Failed to get sentiment:', error)
      return null
    }
  }

  static async getSentimentForTicker(ticker: string, daysBack: number = 7): Promise<SentimentAnalysisResult[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const { data, error } = await supabase
        .from('sentiment_analysis')
        .select('*')
        .eq('ticker', ticker)
        .gte('analyzed_at', startDate.toISOString())
        .order('analyzed_at', { ascending: false })

      if (error) {
        console.error('Error fetching sentiment for ticker:', error)
        return []
      }

      return data as SentimentAnalysisResult[]
    } catch (error) {
      console.error('Failed to get sentiment for ticker:', error)
      return []
    }
  }

  static calculateAggregateSentiment(sentiments: SentimentAnalysisResult[]): {
    averageScore: number
    label: 'positive' | 'negative' | 'neutral'
    confidence: number
    positiveCount: number
    negativeCount: number
    neutralCount: number
  } {
    if (sentiments.length === 0) {
      return {
        averageScore: 0,
        label: 'neutral',
        confidence: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0
      }
    }

    let totalScore = 0
    let totalConfidence = 0
    let positiveCount = 0
    let negativeCount = 0
    let neutralCount = 0

    sentiments.forEach(sentiment => {
      totalScore += sentiment.finbert_score * sentiment.confidence
      totalConfidence += sentiment.confidence

      if (sentiment.finbert_label === 'positive') positiveCount++
      else if (sentiment.finbert_label === 'negative') negativeCount++
      else neutralCount++
    })

    const averageScore = totalScore / totalConfidence
    const averageConfidence = totalConfidence / sentiments.length

    let label: 'positive' | 'negative' | 'neutral' = 'neutral'
    if (averageScore > 0.2) label = 'positive'
    else if (averageScore < -0.2) label = 'negative'

    return {
      averageScore,
      label,
      confidence: averageConfidence,
      positiveCount,
      negativeCount,
      neutralCount
    }
  }

  static getSentimentColor(score: number): string {
    if (score > 0.5) return '#16a34a'
    if (score > 0.2) return '#22c55e'
    if (score > -0.2) return '#eab308'
    if (score > -0.5) return '#f97316'
    return '#dc2626'
  }

  static getSentimentEmoji(label: string): string {
    const emojis: Record<string, string> = {
      positive: '📈',
      negative: '📉',
      neutral: '➡️'
    }
    return emojis[label] || '📊'
  }

  static getSentimentLabel(label: string): string {
    const labels: Record<string, string> = {
      positive: 'Positive',
      negative: 'Negative',
      neutral: 'Neutral'
    }
    return labels[label] || label
  }
}
