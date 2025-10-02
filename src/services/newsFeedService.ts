import { supabase } from '../lib/supabase'

export interface NewsArticle {
  id?: string
  ticker: string
  headline: string
  summary?: string
  content?: string
  source: string
  author?: string
  url?: string
  published_at: string
  fetched_at?: string
  provider: string
  relevance_score?: number
  keywords?: string[]
  entities?: any
  created_at?: string
}

export interface NewsProvider {
  name: string
  fetchNews: (ticker: string, daysBack?: number) => Promise<NewsArticle[]>
  isAvailable: () => boolean
}

export class NewsFeedService {
  private static readonly POLYGON_API_KEY = import.meta.env.VITE_POLYGON_API_KEY
  private static readonly ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY
  private static readonly FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY
  private static readonly NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY

  private static providers: NewsProvider[] = [
    {
      name: 'polygon',
      fetchNews: this.fetchFromPolygon.bind(this),
      isAvailable: () => !!this.POLYGON_API_KEY && this.POLYGON_API_KEY !== 'demo_api_key'
    },
    {
      name: 'alphavantage',
      fetchNews: this.fetchFromAlphaVantage.bind(this),
      isAvailable: () => !!this.ALPHA_VANTAGE_KEY && this.ALPHA_VANTAGE_KEY !== 'demo_api_key'
    },
    {
      name: 'finnhub',
      fetchNews: this.fetchFromFinnhub.bind(this),
      isAvailable: () => !!this.FINNHUB_API_KEY && this.FINNHUB_API_KEY !== 'demo_api_key'
    },
    {
      name: 'newsapi',
      fetchNews: this.fetchFromNewsAPI.bind(this),
      isAvailable: () => !!this.NEWS_API_KEY && this.NEWS_API_KEY !== 'demo_api_key'
    }
  ]

  static async fetchNewsForTicker(ticker: string, daysBack: number = 7): Promise<NewsArticle[]> {
    const allArticles: NewsArticle[] = []

    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        console.log(`Provider ${provider.name} not available, skipping`)
        continue
      }

      try {
        console.log(`Fetching news from ${provider.name} for ${ticker}`)
        const articles = await provider.fetchNews(ticker, daysBack)

        if (articles.length > 0) {
          allArticles.push(...articles)
          await this.updateProviderStats(provider.name, articles.length, null)
        }
      } catch (error) {
        console.error(`Error fetching from ${provider.name}:`, error)
        await this.updateProviderStats(provider.name, 0, error instanceof Error ? error.message : 'Unknown error')
      }
    }

    if (allArticles.length === 0) {
      console.log('No news from any provider, using mock data')
      return this.generateMockNews(ticker, daysBack)
    }

    const deduplicated = this.deduplicateArticles(allArticles)
    await this.storeArticles(deduplicated)

    return deduplicated
  }

  static async fetchNewsForMultipleTickers(tickers: string[], daysBack: number = 7): Promise<Map<string, NewsArticle[]>> {
    const results = new Map<string, NewsArticle[]>()

    for (const ticker of tickers) {
      const articles = await this.fetchNewsForTicker(ticker, daysBack)
      results.set(ticker, articles)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return results
  }

  private static async fetchFromPolygon(ticker: string, daysBack: number): Promise<NewsArticle[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    const url = `https://api.polygon.io/v2/reference/news?ticker=${ticker}&published_utc.gte=${startDate.toISOString()}&limit=100&apiKey=${this.POLYGON_API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`)
    }

    const data = await response.json()

    return (data.results || []).map((article: any) => ({
      ticker,
      headline: article.title,
      summary: article.description,
      source: article.publisher?.name || 'Polygon',
      author: article.author,
      url: article.article_url,
      published_at: article.published_utc,
      provider: 'polygon',
      relevance_score: this.calculateRelevance(ticker, article.title + ' ' + (article.description || ''))
    }))
  }

  private static async fetchFromAlphaVantage(ticker: string, daysBack: number): Promise<NewsArticle[]> {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&apikey=${this.ALPHA_VANTAGE_KEY}&limit=100`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.feed) {
      return []
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysBack)

    return data.feed
      .filter((article: any) => {
        const publishedDate = new Date(article.time_published)
        return publishedDate >= cutoffDate
      })
      .map((article: any) => ({
        ticker,
        headline: article.title,
        summary: article.summary,
        source: article.source,
        author: article.authors?.join(', '),
        url: article.url,
        published_at: article.time_published,
        provider: 'alphavantage',
        relevance_score: article.relevance_score ? parseFloat(article.relevance_score) * 100 : 50
      }))
  }

  private static async fetchFromFinnhub(ticker: string, daysBack: number): Promise<NewsArticle[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    const fromDate = startDate.toISOString().split('T')[0]
    const toDate = endDate.toISOString().split('T')[0]

    const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${this.FINNHUB_API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`)
    }

    const data = await response.json()

    return (data || []).map((article: any) => ({
      ticker,
      headline: article.headline,
      summary: article.summary,
      source: article.source,
      url: article.url,
      published_at: new Date(article.datetime * 1000).toISOString(),
      provider: 'finnhub',
      relevance_score: this.calculateRelevance(ticker, article.headline + ' ' + (article.summary || ''))
    }))
  }

  private static async fetchFromNewsAPI(ticker: string, daysBack: number): Promise<NewsArticle[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)
    const fromDate = startDate.toISOString().split('T')[0]

    const url = `https://newsapi.org/v2/everything?q=${ticker}&from=${fromDate}&sortBy=publishedAt&apiKey=${this.NEWS_API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`)
    }

    const data = await response.json()

    return (data.articles || []).slice(0, 50).map((article: any) => ({
      ticker,
      headline: article.title,
      summary: article.description,
      content: article.content,
      source: article.source.name,
      author: article.author,
      url: article.url,
      published_at: article.publishedAt,
      provider: 'newsapi',
      relevance_score: this.calculateRelevance(ticker, article.title + ' ' + (article.description || ''))
    }))
  }

  private static deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>()
    const unique: NewsArticle[] = []

    for (const article of articles) {
      const key = article.url || article.headline
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(article)
      }
    }

    return unique.sort((a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )
  }

  private static async storeArticles(articles: NewsArticle[]): Promise<void> {
    for (const article of articles) {
      try {
        const { error } = await supabase
          .from('news_articles')
          .upsert({
            ticker: article.ticker,
            headline: article.headline,
            summary: article.summary,
            content: article.content,
            source: article.source,
            author: article.author,
            url: article.url,
            published_at: article.published_at,
            provider: article.provider,
            relevance_score: article.relevance_score,
            keywords: article.keywords,
            entities: article.entities
          }, {
            onConflict: 'url',
            ignoreDuplicates: true
          })

        if (error && !error.message.includes('duplicate')) {
          console.error('Error storing article:', error)
        }
      } catch (error) {
        console.error('Failed to store article:', error)
      }
    }
  }

  static async getStoredNews(ticker: string, daysBack: number = 7): Promise<NewsArticle[]> {
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
        console.error('Error fetching stored news:', error)
        return []
      }

      return data as NewsArticle[]
    } catch (error) {
      console.error('Failed to get stored news:', error)
      return []
    }
  }

  private static async updateProviderStats(provider: string, articlesCount: number, error: string | null): Promise<void> {
    try {
      const updates: any = {
        last_fetch_at: new Date().toISOString()
      }

      if (articlesCount > 0) {
        const { data: currentData } = await supabase
          .from('news_feed_sources')
          .select('total_articles_fetched')
          .eq('provider', provider)
          .single()

        if (currentData) {
          updates.total_articles_fetched = (currentData.total_articles_fetched || 0) + articlesCount
        }
      }

      if (error) {
        const { data: currentData } = await supabase
          .from('news_feed_sources')
          .select('error_count')
          .eq('provider', provider)
          .single()

        if (currentData) {
          updates.error_count = (currentData.error_count || 0) + 1
          updates.last_error = error
        }
      }

      await supabase
        .from('news_feed_sources')
        .update(updates)
        .eq('provider', provider)
    } catch (error) {
      console.error('Failed to update provider stats:', error)
    }
  }

  private static calculateRelevance(ticker: string, text: string): number {
    if (!text) return 50

    const lowerText = text.toLowerCase()
    const tickerLower = ticker.toLowerCase()
    const tickerCount = (lowerText.match(new RegExp(tickerLower, 'g')) || []).length

    const relevantTerms = [
      'earnings', 'profit', 'revenue', 'growth', 'loss', 'beat', 'miss',
      'upgrade', 'downgrade', 'acquisition', 'merger', 'launch', 'product',
      'ceo', 'cfo', 'executive', 'guidance', 'forecast', 'outlook'
    ]

    let relevanceBoost = 0
    for (const term of relevantTerms) {
      if (lowerText.includes(term)) {
        relevanceBoost += 5
      }
    }

    const baseScore = Math.min(100, tickerCount * 25 + 30 + relevanceBoost)
    return Math.max(0, Math.min(100, baseScore))
  }

  private static generateMockNews(ticker: string, daysBack: number): NewsArticle[] {
    const headlines = [
      `${ticker} Reports Strong Quarterly Earnings, Beats Wall Street Expectations`,
      `${ticker} Announces Major Product Launch, Stock Surges on Innovation`,
      `Analysts Upgrade ${ticker} Following Positive Market Developments`,
      `${ticker} Faces Regulatory Scrutiny as Industry Challenges Mount`,
      `${ticker} CEO Discusses Long-Term Growth Strategy in Investor Call`,
      `Institutional Investors Significantly Increase Stakes in ${ticker}`,
      `${ticker} Unveils Breakthrough Technology Initiative, Market Reacts Positively`,
      `Market Volatility Impacts ${ticker} Trading Volume and Option Prices`,
      `${ticker} Expands Global Operations with New International Markets`,
      `Industry Analysts Debate ${ticker}'s Competitive Position in Changing Market`
    ]

    const sources = ['Bloomberg', 'Reuters', 'CNBC', 'Financial Times', 'Wall Street Journal', 'MarketWatch']
    const articles: NewsArticle[] = []

    for (let i = 0; i < Math.min(15, daysBack * 3); i++) {
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * daysBack))
      date.setHours(Math.floor(Math.random() * 24))

      const headline = headlines[Math.floor(Math.random() * headlines.length)]

      articles.push({
        ticker,
        headline,
        summary: `${headline}. Market analysts and industry experts are closely monitoring developments as trading activity increases across related securities and options contracts.`,
        source: sources[Math.floor(Math.random() * sources.length)],
        published_at: date.toISOString(),
        provider: 'mock',
        relevance_score: 70 + Math.random() * 30
      })
    }

    return articles.sort((a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )
  }

  static async syncNewsForLiquidOptions(): Promise<void> {
    const liquidTickers = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA']

    console.log('Starting news sync for liquid options tickers:', liquidTickers)

    const newsMap = await this.fetchNewsForMultipleTickers(liquidTickers, 7)

    let totalArticles = 0
    newsMap.forEach((articles, ticker) => {
      console.log(`Fetched ${articles.length} articles for ${ticker}`)
      totalArticles += articles.length
    })

    console.log(`News sync completed. Total articles: ${totalArticles}`)
  }
}
