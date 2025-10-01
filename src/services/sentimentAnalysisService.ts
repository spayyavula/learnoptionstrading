import { supabase } from '../lib/supabase'
import { AnalystRecommendationsService, ConsensusRating } from './analystRecommendationsService'
import { MarketEventsService } from './marketEventsService'

export interface NewsArticle {
  id?: string
  ticker: string
  headline: string
  summary?: string
  source: string
  author?: string
  url?: string
  published_at: string
  sentiment_score?: number
  sentiment_magnitude?: number
  keywords?: string[]
  entities?: any
  relevance_score?: number
  created_at?: string
}

export interface SentimentScore {
  id?: string
  ticker: string
  date: string
  overall_sentiment_score: number
  news_sentiment_score: number
  analyst_sentiment_score: number
  social_sentiment_score: number
  sentiment_momentum: number
  positive_news_count: number
  negative_news_count: number
  neutral_news_count: number
  analyst_buy_count: number
  analyst_hold_count: number
  analyst_sell_count: number
  sentiment_category: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
  created_at?: string
}

export interface SentimentTrend {
  date: string
  score: number
  category: string
}

export class SentimentAnalysisService {
  private static readonly NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY
  private static readonly ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY

  private static readonly POSITIVE_KEYWORDS = [
    'surge', 'beat', 'exceed', 'growth', 'profit', 'gain', 'rise', 'bullish',
    'strong', 'upgrade', 'outperform', 'buy', 'optimistic', 'positive', 'record',
    'breakthrough', 'innovation', 'success', 'recovery', 'expansion'
  ]

  private static readonly NEGATIVE_KEYWORDS = [
    'plunge', 'miss', 'drop', 'loss', 'decline', 'fall', 'bearish', 'weak',
    'downgrade', 'underperform', 'sell', 'pessimistic', 'negative', 'concern',
    'risk', 'warning', 'shortage', 'delay', 'lawsuit', 'investigation'
  ]

  static async fetchNewsArticles(ticker: string, daysBack: number = 7): Promise<NewsArticle[]> {
    try {
      if (!this.NEWS_API_KEY || this.NEWS_API_KEY === 'demo_api_key') {
        console.log('Using mock news data for', ticker)
        return this.generateMockNews(ticker, daysBack)
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)
      const fromDate = startDate.toISOString().split('T')[0]

      const url = `https://newsapi.org/v2/everything?q=${ticker}&from=${fromDate}&sortBy=publishedAt&apiKey=${this.NEWS_API_KEY}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`)
      }

      const data = await response.json()

      return data.articles.slice(0, 50).map((article: any) => ({
        ticker,
        headline: article.title,
        summary: article.description,
        source: article.source.name,
        author: article.author,
        url: article.url,
        published_at: article.publishedAt,
        sentiment_score: this.analyzeTextSentiment(article.title + ' ' + (article.description || '')),
        relevance_score: this.calculateRelevance(ticker, article.title + ' ' + (article.description || ''))
      }))
    } catch (error) {
      console.error('Error fetching news articles:', error)
      return this.generateMockNews(ticker, daysBack)
    }
  }

  static async storeNewsArticle(article: NewsArticle): Promise<void> {
    try {
      const { error } = await supabase
        .from('news_articles')
        .upsert({
          ticker: article.ticker,
          headline: article.headline,
          summary: article.summary,
          source: article.source,
          author: article.author,
          url: article.url,
          published_at: article.published_at,
          sentiment_score: article.sentiment_score,
          sentiment_magnitude: article.sentiment_magnitude,
          keywords: article.keywords,
          entities: article.entities,
          relevance_score: article.relevance_score
        }, {
          onConflict: 'url'
        })

      if (error) {
        console.error('Error storing news article:', error)
      }
    } catch (error) {
      console.error('Failed to store news article:', error)
    }
  }

  static async getNewsArticles(ticker: string, daysBack: number = 7): Promise<NewsArticle[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('ticker', ticker)
        .gte('published_at', startDate.toISOString())
        .order('published_at', { ascending: false })

      if (error) {
        console.error('Error fetching news articles:', error)
        return []
      }

      return data as NewsArticle[]
    } catch (error) {
      console.error('Failed to get news articles:', error)
      return []
    }
  }

  static async calculateSentimentScore(ticker: string): Promise<SentimentScore | null> {
    try {
      const newsArticles = await this.getNewsArticles(ticker, 7)
      const consensus = await AnalystRecommendationsService.getConsensusRating(ticker)

      let newsSentiment = 0
      let positiveCount = 0
      let negativeCount = 0
      let neutralCount = 0

      newsArticles.forEach(article => {
        const score = article.sentiment_score || 0
        newsSentiment += score

        if (score > 20) positiveCount++
        else if (score < -20) negativeCount++
        else neutralCount++
      })

      newsSentiment = newsArticles.length > 0 ? newsSentiment / newsArticles.length : 0

      let analystSentiment = 0
      let buyCount = 0
      let holdCount = 0
      let sellCount = 0

      if (consensus) {
        analystSentiment = AnalystRecommendationsService.calculateAnalystSentiment(consensus)
        buyCount = consensus.strong_buy_count + consensus.buy_count
        holdCount = consensus.hold_count
        sellCount = consensus.sell_count + consensus.strong_sell_count
      }

      const overallSentiment = (newsSentiment * 0.6 + analystSentiment * 0.4)

      const previousSentiment = await this.getPreviousSentiment(ticker)
      const momentum = previousSentiment
        ? overallSentiment - previousSentiment.overall_sentiment_score
        : 0

      const sentimentScore: SentimentScore = {
        ticker,
        date: new Date().toISOString().split('T')[0],
        overall_sentiment_score: overallSentiment,
        news_sentiment_score: newsSentiment,
        analyst_sentiment_score: analystSentiment,
        social_sentiment_score: 0,
        sentiment_momentum: momentum,
        positive_news_count: positiveCount,
        negative_news_count: negativeCount,
        neutral_news_count: neutralCount,
        analyst_buy_count: buyCount,
        analyst_hold_count: holdCount,
        analyst_sell_count: sellCount,
        sentiment_category: this.categorizeSentiment(overallSentiment)
      }

      return sentimentScore
    } catch (error) {
      console.error('Failed to calculate sentiment score:', error)
      return null
    }
  }

  static async storeSentimentScore(score: SentimentScore): Promise<void> {
    try {
      const { error } = await supabase
        .from('stock_sentiment_scores')
        .upsert({
          ticker: score.ticker,
          date: score.date,
          overall_sentiment_score: score.overall_sentiment_score,
          news_sentiment_score: score.news_sentiment_score,
          analyst_sentiment_score: score.analyst_sentiment_score,
          social_sentiment_score: score.social_sentiment_score,
          sentiment_momentum: score.sentiment_momentum,
          positive_news_count: score.positive_news_count,
          negative_news_count: score.negative_news_count,
          neutral_news_count: score.neutral_news_count,
          analyst_buy_count: score.analyst_buy_count,
          analyst_hold_count: score.analyst_hold_count,
          analyst_sell_count: score.analyst_sell_count,
          sentiment_category: score.sentiment_category
        }, {
          onConflict: 'ticker,date'
        })

      if (error) {
        console.error('Error storing sentiment score:', error)
      }
    } catch (error) {
      console.error('Failed to store sentiment score:', error)
    }
  }

  static async getSentimentScore(ticker: string, date?: string): Promise<SentimentScore | null> {
    try {
      const queryDate = date || new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('stock_sentiment_scores')
        .select('*')
        .eq('ticker', ticker)
        .eq('date', queryDate)
        .single()

      if (error) {
        console.error('Error fetching sentiment score:', error)
        return null
      }

      return data as SentimentScore
    } catch (error) {
      console.error('Failed to get sentiment score:', error)
      return null
    }
  }

  static async getSentimentTrend(ticker: string, daysBack: number = 30): Promise<SentimentTrend[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const { data, error } = await supabase
        .from('stock_sentiment_scores')
        .select('date, overall_sentiment_score, sentiment_category')
        .eq('ticker', ticker)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching sentiment trend:', error)
        return []
      }

      return data.map((item: any) => ({
        date: item.date,
        score: item.overall_sentiment_score,
        category: item.sentiment_category
      }))
    } catch (error) {
      console.error('Failed to get sentiment trend:', error)
      return []
    }
  }

  static async syncSentimentData(tickers: string[]): Promise<void> {
    console.log('Syncing sentiment data for', tickers.length, 'tickers')

    for (const ticker of tickers) {
      const newsArticles = await this.fetchNewsArticles(ticker, 7)

      for (const article of newsArticles) {
        await this.storeNewsArticle(article)
      }

      const sentimentScore = await this.calculateSentimentScore(ticker)
      if (sentimentScore) {
        await this.storeSentimentScore(sentimentScore)
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('Sentiment data sync completed')
  }

  private static async getPreviousSentiment(ticker: string): Promise<SentimentScore | null> {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { data, error } = await supabase
        .from('stock_sentiment_scores')
        .select('*')
        .eq('ticker', ticker)
        .lte('date', yesterday.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        return null
      }

      return data as SentimentScore
    } catch (error) {
      return null
    }
  }

  private static analyzeTextSentiment(text: string): number {
    if (!text) return 0

    const lowerText = text.toLowerCase()
    let score = 0

    this.POSITIVE_KEYWORDS.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        score += 10
      }
    })

    this.NEGATIVE_KEYWORDS.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        score -= 10
      }
    })

    return Math.max(-100, Math.min(100, score))
  }

  private static calculateRelevance(ticker: string, text: string): number {
    const lowerText = text.toLowerCase()
    const tickerCount = (lowerText.match(new RegExp(ticker.toLowerCase(), 'g')) || []).length

    return Math.min(100, tickerCount * 20 + 30)
  }

  private static categorizeSentiment(score: number): 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' {
    if (score >= 50) return 'very_positive'
    if (score >= 15) return 'positive'
    if (score >= -15) return 'neutral'
    if (score >= -50) return 'negative'
    return 'very_negative'
  }

  private static generateMockNews(ticker: string, daysBack: number): NewsArticle[] {
    const headlines = [
      `${ticker} Reports Strong Quarterly Earnings, Beats Expectations`,
      `${ticker} Announces New Product Launch, Stock Surges`,
      `Analysts Upgrade ${ticker} Following Positive Market Trends`,
      `${ticker} Faces Headwinds as Market Conditions Weaken`,
      `${ticker} CEO Discusses Growth Strategy in Recent Interview`,
      `Institutional Investors Increase Stakes in ${ticker}`,
      `${ticker} Unveils Innovation Initiative, Investors Optimistic`,
      `Market Volatility Impacts ${ticker} Trading Volume`,
      `${ticker} Expands Operations, Eyes International Markets`,
      `Regulatory Changes May Affect ${ticker} Business Model`
    ]

    const sources = ['Bloomberg', 'Reuters', 'CNBC', 'Financial Times', 'Wall Street Journal']
    const articles: NewsArticle[] = []

    for (let i = 0; i < Math.min(10, daysBack * 2); i++) {
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * daysBack))

      const headline = headlines[Math.floor(Math.random() * headlines.length)]

      articles.push({
        ticker,
        headline,
        summary: `${headline}. Market analysts are closely watching developments...`,
        source: sources[Math.floor(Math.random() * sources.length)],
        published_at: date.toISOString(),
        sentiment_score: this.analyzeTextSentiment(headline),
        relevance_score: 75 + Math.random() * 25
      })
    }

    return articles
  }

  static getSentimentColor(score: number): string {
    if (score >= 50) return '#16a34a'
    if (score >= 15) return '#22c55e'
    if (score >= -15) return '#eab308'
    if (score >= -50) return '#f97316'
    return '#dc2626'
  }

  static getSentimentLabel(category: string): string {
    const labels: Record<string, string> = {
      very_positive: 'Very Positive',
      positive: 'Positive',
      neutral: 'Neutral',
      negative: 'Negative',
      very_negative: 'Very Negative'
    }
    return labels[category] || category
  }

  static getSentimentIcon(category: string): string {
    const icons: Record<string, string> = {
      very_positive: '🚀',
      positive: '📈',
      neutral: '➡️',
      negative: '📉',
      very_negative: '⚠️'
    }
    return icons[category] || '📊'
  }
}
