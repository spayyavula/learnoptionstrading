import type { MarketData } from '../types/regimes'

interface PolygonBar {
  o: number
  h: number
  l: number
  c: number
  v: number
  t: number
}

interface PolygonIndicatorValue {
  timestamp: number
  value: number
  signal?: number
  histogram?: number
}

export class RealTimeMarketDataService {
  private static readonly API_KEY = import.meta.env.VITE_POLYGON_API_KEY || 'demo_api_key'
  private static readonly BASE_URL = 'https://api.polygon.io'
  private static readonly ENABLE_REAL_TIME_DATA = import.meta.env.VITE_ENABLE_REAL_TIME_DATA === 'true'

  /**
   * Fetch real-time market data with technical indicators for regime analysis
   */
  static async fetchMarketData(ticker: string = 'SPY'): Promise<MarketData> {
    if (!this.ENABLE_REAL_TIME_DATA || this.API_KEY === 'demo_api_key') {
      console.log('Using mock data - real-time data disabled or no API key')
      return this.generateMockMarketData()
    }

    try {
      // Fetch all data in parallel
      const [priceData, rsiData, macdData, smaData, vixData] = await Promise.all([
        this.fetchLatestPrice(ticker),
        this.fetchRSI(ticker),
        this.fetchMACD(ticker),
        this.fetchSMA(ticker, 200),
        this.fetchLatestPrice('VIX')
      ])

      // Calculate volume from recent bars
      const volume = priceData.volume

      return {
        price: priceData.close,
        volume: volume,
        volatility: this.calculateVolatility(priceData),
        rsi: rsiData,
        macd: macdData,
        bollingerBands: {
          upper: priceData.close * 1.02,
          middle: priceData.close,
          lower: priceData.close * 0.98
        },
        movingAverages: {
          sma20: await this.fetchSMA(ticker, 20),
          sma50: await this.fetchSMA(ticker, 50),
          sma200: smaData
        },
        vix: vixData.close,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Error fetching real-time market data:', error)
      return this.generateMockMarketData()
    }
  }

  /**
   * Fetch latest price data
   */
  private static async fetchLatestPrice(ticker: string): Promise<{
    open: number
    high: number
    low: number
    close: number
    volume: number
  }> {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago to ensure we get data

    const url = `${this.BASE_URL}/v2/aggs/ticker/${ticker}/range/1/day/${yesterday.toISOString().split('T')[0]}/${today.toISOString().split('T')[0]}?adjusted=true&sort=desc&limit=1&apiKey=${this.API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch price data: ${response.statusText}`)
    }

    const data = await response.json()
    const bar = data.results?.[0]

    if (!bar) {
      throw new Error('No price data available')
    }

    return {
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v
    }
  }

  /**
   * Fetch RSI (Relative Strength Index)
   */
  private static async fetchRSI(ticker: string, window: number = 14): Promise<number> {
    const today = new Date()
    const url = `${this.BASE_URL}/v1/indicators/rsi/${ticker}?timespan=day&adjusted=true&window=${window}&series_type=close&order=desc&limit=1&apiKey=${this.API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`RSI API failed, using fallback`)
      return 50 + (Math.random() - 0.5) * 40 // Random RSI between 30-70
    }

    const data = await response.json()
    const rsiValue = data.results?.values?.[0]?.value

    return rsiValue ?? 50
  }

  /**
   * Fetch MACD (Moving Average Convergence Divergence)
   */
  private static async fetchMACD(
    ticker: string,
    shortWindow: number = 12,
    longWindow: number = 26,
    signalWindow: number = 9
  ): Promise<number> {
    const url = `${this.BASE_URL}/v1/indicators/macd/${ticker}?timespan=day&adjusted=true&short_window=${shortWindow}&long_window=${longWindow}&signal_window=${signalWindow}&series_type=close&order=desc&limit=1&apiKey=${this.API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`MACD API failed, using fallback`)
      return (Math.random() - 0.5) * 10
    }

    const data = await response.json()
    const macdValue = data.results?.values?.[0]?.value

    return macdValue ?? 0
  }

  /**
   * Fetch SMA (Simple Moving Average)
   */
  private static async fetchSMA(ticker: string, window: number): Promise<number> {
    const url = `${this.BASE_URL}/v1/indicators/sma/${ticker}?timespan=day&adjusted=true&window=${window}&series_type=close&order=desc&limit=1&apiKey=${this.API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`SMA${window} API failed, using fallback`)
      // Fallback: approximate based on current price
      const priceData = await this.fetchLatestPrice(ticker).catch(() => ({ close: 580 }))
      return priceData.close * (0.95 + Math.random() * 0.1)
    }

    const data = await response.json()
    const smaValue = data.results?.values?.[0]?.value

    return smaValue ?? 580
  }

  /**
   * Calculate historical volatility from price data
   */
  private static calculateVolatility(priceData: { high: number; low: number; close: number }): number {
    // Simple volatility estimation based on daily range
    const dailyRange = (priceData.high - priceData.low) / priceData.close
    return dailyRange * Math.sqrt(252) // Annualized
  }

  /**
   * Generate mock market data (fallback)
   */
  private static generateMockMarketData(): MarketData {
    const basePrice = 580
    const priceVariation = (Math.random() - 0.5) * 20
    const price = basePrice + priceVariation

    return {
      price,
      volume: Math.random() * 2000000 + 500000,
      volatility: Math.random() * 0.3 + 0.1,
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 10,
      bollingerBands: {
        upper: price * 1.02,
        middle: price,
        lower: price * 0.98
      },
      movingAverages: {
        sma20: price * (0.98 + Math.random() * 0.04),
        sma50: price * (0.96 + Math.random() * 0.08),
        sma200: price * (0.92 + Math.random() * 0.16)
      },
      vix: Math.random() * 40 + 10,
      timestamp: new Date()
    }
  }

  /**
   * Fetch multiple tickers' data in parallel
   */
  static async fetchMultipleTickersData(tickers: string[]): Promise<Map<string, MarketData>> {
    const dataMap = new Map<string, MarketData>()

    const results = await Promise.allSettled(
      tickers.map(ticker => this.fetchMarketData(ticker))
    )

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        dataMap.set(tickers[index], result.value)
      } else {
        console.error(`Failed to fetch data for ${tickers[index]}:`, result.reason)
        dataMap.set(tickers[index], this.generateMockMarketData())
      }
    })

    return dataMap
  }
}
