import { supabase } from '../lib/supabase'

export interface AnalystRecommendation {
  id?: string
  ticker: string
  analyst_firm: string
  analyst_name?: string
  rating: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
  previous_rating?: string
  price_target?: number
  previous_price_target?: number
  rating_date: string
  rating_change_type?: 'upgrade' | 'downgrade' | 'maintained' | 'new_coverage' | 'reiterated'
  confidence_score?: number
  accuracy_score?: number
  notes?: string
  created_at?: string
}

export interface ConsensusRating {
  ticker: string
  consensus_rating: string
  consensus_score: number
  strong_buy_count: number
  buy_count: number
  hold_count: number
  sell_count: number
  strong_sell_count: number
  total_analysts: number
  average_price_target: number
  high_price_target: number
  low_price_target: number
  last_updated: string
}

export interface RatingChange {
  ticker: string
  analyst_firm: string
  old_rating: string
  new_rating: string
  change_type: 'upgrade' | 'downgrade'
  change_date: string
  price_target?: number
}

export class AnalystRecommendationsService {
  private static readonly FINANCIAL_API_KEY = import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY || import.meta.env.VITE_ALPHA_VANTAGE_API_KEY

  static readonly RATING_SCORES = {
    strong_buy: 5,
    buy: 4,
    hold: 3,
    sell: 2,
    strong_sell: 1
  }

  static async fetchAnalystRecommendations(ticker: string): Promise<AnalystRecommendation[]> {
    try {
      if (!this.FINANCIAL_API_KEY || this.FINANCIAL_API_KEY === 'demo_api_key') {
        console.log('Using mock analyst data for', ticker)
        return this.generateMockRecommendations(ticker)
      }

      const url = `https://financialmodelingprep.com/api/v3/analyst-stock-recommendations/${ticker}?apikey=${this.FINANCIAL_API_KEY}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch analyst recommendations: ${response.status}`)
      }

      const data = await response.json()

      return data.map((item: any) => ({
        ticker: item.symbol,
        analyst_firm: item.analystName || 'Unknown Firm',
        analyst_name: item.analystCompany,
        rating: this.normalizeRating(item.newGrade),
        previous_rating: item.previousGrade ? this.normalizeRating(item.previousGrade) : undefined,
        price_target: item.priceTarget,
        previous_price_target: item.priceWhenPosted,
        rating_date: item.date,
        rating_change_type: this.determineChangeType(
          this.normalizeRating(item.previousGrade),
          this.normalizeRating(item.newGrade)
        ),
        confidence_score: 75,
        notes: `${item.action || ''}`
      }))
    } catch (error) {
      console.error('Error fetching analyst recommendations:', error)
      return this.generateMockRecommendations(ticker)
    }
  }

  static async storeRecommendation(recommendation: AnalystRecommendation): Promise<void> {
    try {
      const { error } = await supabase
        .from('analyst_recommendations')
        .insert({
          ticker: recommendation.ticker,
          analyst_firm: recommendation.analyst_firm,
          analyst_name: recommendation.analyst_name,
          rating: recommendation.rating,
          previous_rating: recommendation.previous_rating,
          price_target: recommendation.price_target,
          previous_price_target: recommendation.previous_price_target,
          rating_date: recommendation.rating_date,
          rating_change_type: recommendation.rating_change_type,
          confidence_score: recommendation.confidence_score || 50,
          accuracy_score: recommendation.accuracy_score,
          notes: recommendation.notes
        })

      if (error) {
        console.error('Error storing analyst recommendation:', error)
      }
    } catch (error) {
      console.error('Failed to store analyst recommendation:', error)
    }
  }

  static async getRecommendations(ticker: string, daysBack: number = 90): Promise<AnalystRecommendation[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const { data, error } = await supabase
        .from('analyst_recommendations')
        .select('*')
        .eq('ticker', ticker)
        .gte('rating_date', startDate.toISOString())
        .order('rating_date', { ascending: false })

      if (error) {
        console.error('Error fetching recommendations:', error)
        return []
      }

      return data as AnalystRecommendation[]
    } catch (error) {
      console.error('Failed to get recommendations:', error)
      return []
    }
  }

  static async getConsensusRating(ticker: string): Promise<ConsensusRating | null> {
    try {
      const recommendations = await this.getRecommendations(ticker, 90)

      if (recommendations.length === 0) {
        return null
      }

      const latestByFirm = new Map<string, AnalystRecommendation>()
      recommendations.forEach(rec => {
        if (!latestByFirm.has(rec.analyst_firm) ||
            new Date(rec.rating_date) > new Date(latestByFirm.get(rec.analyst_firm)!.rating_date)) {
          latestByFirm.set(rec.analyst_firm, rec)
        }
      })

      const currentRecommendations = Array.from(latestByFirm.values())

      const counts = {
        strong_buy: 0,
        buy: 0,
        hold: 0,
        sell: 0,
        strong_sell: 0
      }

      let totalScore = 0
      const priceTargets: number[] = []

      currentRecommendations.forEach(rec => {
        counts[rec.rating]++
        totalScore += this.RATING_SCORES[rec.rating]
        if (rec.price_target && rec.price_target > 0) {
          priceTargets.push(rec.price_target)
        }
      })

      const totalAnalysts = currentRecommendations.length
      const averageScore = totalScore / totalAnalysts

      const consensusRating = this.getConsensusFromScore(averageScore)

      return {
        ticker,
        consensus_rating: consensusRating,
        consensus_score: averageScore,
        strong_buy_count: counts.strong_buy,
        buy_count: counts.buy,
        hold_count: counts.hold,
        sell_count: counts.sell,
        strong_sell_count: counts.strong_sell,
        total_analysts: totalAnalysts,
        average_price_target: priceTargets.length > 0
          ? priceTargets.reduce((a, b) => a + b, 0) / priceTargets.length
          : 0,
        high_price_target: priceTargets.length > 0 ? Math.max(...priceTargets) : 0,
        low_price_target: priceTargets.length > 0 ? Math.min(...priceTargets) : 0,
        last_updated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get consensus rating:', error)
      return null
    }
  }

  static async getRecentRatingChanges(ticker: string, daysBack: number = 30): Promise<RatingChange[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const { data, error } = await supabase
        .from('analyst_recommendations')
        .select('*')
        .eq('ticker', ticker)
        .gte('rating_date', startDate.toISOString())
        .in('rating_change_type', ['upgrade', 'downgrade'])
        .order('rating_date', { ascending: false })

      if (error) {
        console.error('Error fetching rating changes:', error)
        return []
      }

      return data.map((rec: any) => ({
        ticker: rec.ticker,
        analyst_firm: rec.analyst_firm,
        old_rating: rec.previous_rating || 'unknown',
        new_rating: rec.rating,
        change_type: rec.rating_change_type,
        change_date: rec.rating_date,
        price_target: rec.price_target
      }))
    } catch (error) {
      console.error('Failed to get rating changes:', error)
      return []
    }
  }

  static async syncRecommendations(tickers: string[]): Promise<void> {
    console.log('Syncing analyst recommendations for', tickers.length, 'tickers')

    for (const ticker of tickers) {
      const recommendations = await this.fetchAnalystRecommendations(ticker)

      for (const rec of recommendations) {
        await this.storeRecommendation(rec)
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('Analyst recommendations sync completed')
  }

  static calculateAnalystSentiment(consensus: ConsensusRating): number {
    const score = consensus.consensus_score

    return ((score - 1) / 4) * 100 - 50
  }

  private static normalizeRating(rating: string): 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' {
    if (!rating) return 'hold'

    const normalized = rating.toLowerCase().replace(/\s+/g, '_')

    if (normalized.includes('strong_buy') || normalized.includes('outperform')) {
      return 'strong_buy'
    } else if (normalized.includes('buy') || normalized.includes('overweight')) {
      return 'buy'
    } else if (normalized.includes('sell') || normalized.includes('underweight')) {
      return 'sell'
    } else if (normalized.includes('strong_sell') || normalized.includes('underperform')) {
      return 'strong_sell'
    } else {
      return 'hold'
    }
  }

  private static determineChangeType(
    previousRating: string | undefined,
    newRating: string
  ): 'upgrade' | 'downgrade' | 'maintained' | 'new_coverage' | 'reiterated' {
    if (!previousRating) return 'new_coverage'

    const prevScore = this.RATING_SCORES[previousRating as keyof typeof this.RATING_SCORES] || 3
    const newScore = this.RATING_SCORES[newRating as keyof typeof this.RATING_SCORES] || 3

    if (newScore > prevScore) return 'upgrade'
    if (newScore < prevScore) return 'downgrade'
    return 'reiterated'
  }

  private static getConsensusFromScore(score: number): string {
    if (score >= 4.5) return 'Strong Buy'
    if (score >= 3.5) return 'Buy'
    if (score >= 2.5) return 'Hold'
    if (score >= 1.5) return 'Sell'
    return 'Strong Sell'
  }

  private static generateMockRecommendations(ticker: string): AnalystRecommendation[] {
    const firms = [
      'Goldman Sachs',
      'Morgan Stanley',
      'JP Morgan',
      'Bank of America',
      'Citigroup',
      'Wells Fargo',
      'Credit Suisse',
      'Barclays'
    ]

    const ratings: Array<'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'> = [
      'strong_buy',
      'buy',
      'hold',
      'sell',
      'strong_sell'
    ]

    const recommendations: AnalystRecommendation[] = []

    for (let i = 0; i < 5; i++) {
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 60))

      const rating = ratings[Math.floor(Math.random() * ratings.length)]
      const priceTarget = 400 + Math.random() * 200

      recommendations.push({
        ticker,
        analyst_firm: firms[i],
        rating,
        price_target: priceTarget,
        rating_date: date.toISOString().split('T')[0],
        rating_change_type: 'maintained',
        confidence_score: 60 + Math.random() * 30,
        accuracy_score: 50 + Math.random() * 40
      })
    }

    return recommendations
  }

  static getRatingColor(rating: string): string {
    switch (rating.toLowerCase()) {
      case 'strong_buy':
      case 'strong buy':
        return '#16a34a'
      case 'buy':
        return '#22c55e'
      case 'hold':
        return '#eab308'
      case 'sell':
        return '#f97316'
      case 'strong_sell':
      case 'strong sell':
        return '#dc2626'
      default:
        return '#6b7280'
    }
  }

  static getRatingLabel(rating: string): string {
    const labels: Record<string, string> = {
      strong_buy: 'Strong Buy',
      buy: 'Buy',
      hold: 'Hold',
      sell: 'Sell',
      strong_sell: 'Strong Sell'
    }
    return labels[rating] || rating
  }
}
