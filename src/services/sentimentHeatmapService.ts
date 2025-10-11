import { supabase } from '../lib/supabase'
import { LiquidOptionsSentimentService, type LiquidOptionSentimentScore } from './liquidOptionsSentimentService'
import type { OptionsContract } from '../types/options'

export interface HeatmapCell {
  contract_ticker: string
  underlying_ticker: string
  strike_price: number
  contract_type: 'call' | 'put'
  expiration_date: string
  sentiment_score: number
  sentiment_label: string
  sentiment_color: string
  sentiment_trend: string
  trend_icon: string
  momentum: number
  confidence: number
  volume?: number
  open_interest?: number
  implied_volatility?: number
  news_count: number
  analyst_count: number
}

export interface HeatmapData {
  rows: HeatmapRow[]
  tickers: string[]
  expiry_dates: string[]
  min_sentiment: number
  max_sentiment: number
  avg_sentiment: number
  total_cells: number
  last_updated: string
}

export interface HeatmapRow {
  ticker: string
  expiry_date: string
  expiry_type: string
  days_to_expiry: number
  calls: HeatmapCell[]
  puts: HeatmapCell[]
}

export interface HeatmapFilters {
  tickers?: string[]
  expiry_type?: 'All' | '0DTE' | 'Daily' | 'Weekly' | 'Monthly' | 'LEAPS'
  sentiment_mode?: 'composite' | 'news_only' | 'analyst_only' | 'momentum'
  min_sentiment?: number
  max_sentiment?: number
  min_confidence?: number
  strike_range?: { min: number; max: number }
}

export class SentimentHeatmapService {
  private static readonly CACHE_DURATION_MINUTES = 15

  static async getHeatmapData(
    contracts: OptionsContract[],
    filters: HeatmapFilters = {}
  ): Promise<HeatmapData> {
    const cacheKey = this.generateCacheKey(filters)
    const cached = await this.getCachedHeatmap(cacheKey)
    if (cached) {
      console.log('Using cached heatmap data')
      return cached
    }

    console.log('Computing fresh heatmap data')
    const heatmapData = await this.computeHeatmapData(contracts, filters)
    await this.cacheHeatmapData(cacheKey, heatmapData, filters)
    return heatmapData
  }

  private static async computeHeatmapData(
    contracts: OptionsContract[],
    filters: HeatmapFilters
  ): Promise<HeatmapData> {
    const liquidTickers = filters.tickers || LiquidOptionsSentimentService.getLiquidTickers()
    const filteredContracts = contracts.filter(c => liquidTickers.includes(c.underlying_ticker))
    
    let sentimentScores = await LiquidOptionsSentimentService.getSentimentScores(liquidTickers, 1)
    if (sentimentScores.length === 0) {
      console.log('No cached sentiment scores, computing fresh...')
      sentimentScores = await LiquidOptionsSentimentService.calculateSentimentForAllLiquidOptions(filteredContracts)
      await LiquidOptionsSentimentService.storeSentimentScores(sentimentScores)
    }

    const scoreMap = new Map<string, LiquidOptionSentimentScore>()
    sentimentScores.forEach(score => scoreMap.set(score.contract_ticker, score))
    const rows = this.buildHeatmapRows(filteredContracts, scoreMap, filters)
    const allScores = rows.flatMap(row => [
      ...row.calls.map(c => c.sentiment_score),
      ...row.puts.map(p => p.sentiment_score)
    ])

    return {
      rows,
      tickers: Array.from(new Set(rows.map(r => r.ticker))),
      expiry_dates: Array.from(new Set(rows.map(r => r.expiry_date))),
      min_sentiment: allScores.length > 0 ? Math.min(...allScores) : -100,
      max_sentiment: allScores.length > 0 ? Math.max(...allScores) : 100,
      avg_sentiment: allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0,
      total_cells: allScores.length,
      last_updated: new Date().toISOString()
    }
  }

  private static buildHeatmapRows(
    contracts: OptionsContract[],
    scoreMap: Map<string, LiquidOptionSentimentScore>,
    filters: HeatmapFilters
  ): HeatmapRow[] {
    const groupedByTickerAndExpiry = new Map<string, OptionsContract[]>()
    contracts.forEach(contract => {
      const key = `${contract.underlying_ticker}|${contract.expiration_date}`
      if (!groupedByTickerAndExpiry.has(key)) groupedByTickerAndExpiry.set(key, [])
      groupedByTickerAndExpiry.get(key)!.push(contract)
    })

    const rows: HeatmapRow[] = []
    groupedByTickerAndExpiry.forEach((contracts, key) => {
      const [ticker, expiryDate] = key.split('|')
      const expiryType = this.categorizeExpiry(expiryDate)
      if (filters.expiry_type && filters.expiry_type !== 'All' && expiryType !== filters.expiry_type) return

      const calls = contracts
        .filter(c => c.contract_type === 'call')
        .map(c => this.contractToHeatmapCell(c, scoreMap, filters))
        .filter((cell): cell is HeatmapCell => cell !== null)
        .sort((a, b) => a.strike_price - b.strike_price)

      const puts = contracts
        .filter(c => c.contract_type === 'put')
        .map(c => this.contractToHeatmapCell(c, scoreMap, filters))
        .filter((cell): cell is HeatmapCell => cell !== null)
        .sort((a, b) => a.strike_price - b.strike_price)

      if (calls.length > 0 || puts.length > 0) {
        rows.push({
          ticker,
          expiry_date: expiryDate,
          expiry_type: expiryType,
          days_to_expiry: this.calculateDaysToExpiry(expiryDate),
          calls,
          puts
        })
      }
    })

    return rows.sort((a, b) => {
      if (a.ticker !== b.ticker) return a.ticker.localeCompare(b.ticker)
      return a.days_to_expiry - b.days_to_expiry
    })
  }

  private static contractToHeatmapCell(
    contract: OptionsContract,
    scoreMap: Map<string, LiquidOptionSentimentScore>,
    filters: HeatmapFilters
  ): HeatmapCell | null {
    const sentimentData = scoreMap.get(contract.ticker)
    let sentimentScore = 0, confidence = 50, momentum = 0, trend = 'stable', newsCount = 0, analystCount = 0

    if (sentimentData) {
      switch (filters.sentiment_mode) {
        case 'news_only': sentimentScore = sentimentData.finbert_sentiment_score; break
        case 'analyst_only': sentimentScore = sentimentData.analyst_sentiment_score; break
        case 'momentum': sentimentScore = sentimentData.sentiment_momentum; break
        default: sentimentScore = sentimentData.composite_sentiment_score
      }
      confidence = sentimentData.sentiment_confidence
      momentum = sentimentData.sentiment_momentum
      trend = sentimentData.sentiment_trend
      newsCount = sentimentData.news_article_count
      analystCount = sentimentData.analyst_rating_count
    }

    if (filters.min_sentiment !== undefined && sentimentScore < filters.min_sentiment) return null
    if (filters.max_sentiment !== undefined && sentimentScore > filters.max_sentiment) return null
    if (filters.min_confidence !== undefined && confidence < filters.min_confidence) return null
    if (filters.strike_range) {
      if (contract.strike_price < filters.strike_range.min || contract.strike_price > filters.strike_range.max) return null
    }

    return {
      contract_ticker: contract.ticker,
      underlying_ticker: contract.underlying_ticker,
      strike_price: contract.strike_price,
      contract_type: contract.contract_type,
      expiration_date: contract.expiration_date,
      sentiment_score: sentimentScore,
      sentiment_label: LiquidOptionsSentimentService.getSentimentLabel(sentimentScore),
      sentiment_color: LiquidOptionsSentimentService.getSentimentColor(sentimentScore),
      sentiment_trend: trend,
      trend_icon: LiquidOptionsSentimentService.getTrendIcon(trend),
      momentum,
      confidence,
      volume: contract.volume,
      open_interest: contract.open_interest,
      implied_volatility: contract.implied_volatility,
      news_count: newsCount,
      analyst_count: analystCount
    }
  }

  private static categorizeExpiry(expiryDate: string): string {
    const expiry = new Date(expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysToExpiry = Math.floor((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

    if (daysToExpiry === 0) return '0DTE'
    if (daysToExpiry <= 3) return 'Daily'
    if (daysToExpiry <= 7) return 'Weekly'
    if (daysToExpiry <= 45) return 'Monthly'
    if (daysToExpiry > 365) return 'LEAPS'
    return 'Monthly'
  }

  private static calculateDaysToExpiry(expiryDate: string): number {
    const expiry = new Date(expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.floor((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  }

  private static generateCacheKey(filters: HeatmapFilters): string {
    const parts = [
      filters.tickers?.sort().join(',') || 'all',
      filters.expiry_type || 'all',
      filters.sentiment_mode || 'composite',
      filters.min_sentiment?.toString() || '',
      filters.max_sentiment?.toString() || '',
      filters.min_confidence?.toString() || ''
    ]
    return 'heatmap_' + parts.join('_')
  }

  private static async getCachedHeatmap(cacheKey: string): Promise<HeatmapData | null> {
    try {
      const { data, error } = await supabase
        .from('sentiment_heatmap_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()
      if (error || !data) return null
      return data.heatmap_data as HeatmapData
    } catch (error) {
      console.error('Error fetching cached heatmap:', error)
      return null
    }
  }

  private static async cacheHeatmapData(
    cacheKey: string,
    heatmapData: HeatmapData,
    filters: HeatmapFilters
  ): Promise<void> {
    try {
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + this.CACHE_DURATION_MINUTES)

      await supabase.from('sentiment_heatmap_cache').upsert({
        cache_key: cacheKey,
        underlying_tickers: filters.tickers || LiquidOptionsSentimentService.getLiquidTickers(),
        expiry_type: filters.expiry_type || 'All',
        sentiment_mode: filters.sentiment_mode || 'composite',
        heatmap_data: heatmapData as any,
        row_count: heatmapData.rows.length,
        cell_count: heatmapData.total_cells,
        min_sentiment: heatmapData.min_sentiment,
        max_sentiment: heatmapData.max_sentiment,
        avg_sentiment: heatmapData.avg_sentiment,
        computed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      }, { onConflict: 'cache_key' })
    } catch (error) {
      console.error('Failed to cache heatmap data:', error)
    }
  }

  static async cleanExpiredCache(): Promise<void> {
    try {
      await supabase.from('sentiment_heatmap_cache').delete().lt('expires_at', new Date().toISOString())
      console.log('Expired cache cleaned successfully')
    } catch (error) {
      console.error('Failed to clean expired cache:', error)
    }
  }

  static getSentimentGradient(score: number, min: number, max: number): string {
    const normalized = (score - min) / (max - min)
    if (normalized < 0.2) return 'bg-red-600 text-white'
    if (normalized < 0.35) return 'bg-red-400 text-white'
    if (normalized < 0.45) return 'bg-orange-400 text-white'
    if (normalized < 0.55) return 'bg-yellow-300 text-gray-900'
    if (normalized < 0.65) return 'bg-lime-300 text-gray-900'
    if (normalized < 0.8) return 'bg-green-400 text-white'
    return 'bg-green-600 text-white'
  }

  static getConfidenceOpacity(confidence: number): number {
    return Math.max(0.3, Math.min(1.0, confidence / 100))
  }
}
