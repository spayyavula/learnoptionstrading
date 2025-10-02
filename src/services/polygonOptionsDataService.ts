import { PolygonService } from './polygonService'
import { HistoricalDataService } from './historicalDataService'

interface PolygonOptionsSnapshot {
  contract_ticker: string
  underlying_ticker: string
  strike_price: number
  expiration_date: string
  contract_type: 'call' | 'put'
  bid: number
  ask: number
  last: number
  volume: number
  open_interest: number
  implied_volatility: number
  delta: number
  gamma: number
  theta: number
  vega: number
  timestamp: string
}

interface PolygonOptionsChainResponse {
  status: string
  results: {
    underlying_ticker: string
    contract_ticker: string
    strike_price: number
    expiration_date: string
    contract_type: 'call' | 'put'
    last_quote?: {
      bid: number
      ask: number
      last: number
      volume: number
      timestamp: number
    }
    greeks?: {
      delta: number
      gamma: number
      theta: number
      vega: number
    }
    implied_volatility?: number
    open_interest?: number
  }[]
}

export class PolygonOptionsDataService {
  private static readonly POLYGON_API_KEY = import.meta.env.VITE_POLYGON_API_KEY
  private static readonly BASE_URL = 'https://api.polygon.io'
  private static readonly ENABLE_REAL_TIME_DATA = import.meta.env.VITE_ENABLE_REAL_TIME_DATA === 'true'
  
  // Top liquid options tickers to track
  private static readonly TRACKED_OPTIONS = [
    'SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL'
  ]

  /**
   * Fetch and store options data for the last 2 weeks
   */
  static async fetchAndStoreOptionsData(): Promise<void> {
    console.log('Starting options data fetch and store process...')
    
    if (!this.ENABLE_REAL_TIME_DATA || !this.POLYGON_API_KEY || this.POLYGON_API_KEY === 'demo_api_key') {
      console.log('Real-time data disabled or API key not configured, using mock data')
      await this.generateAndStoreMockData()
      return
    }

    try {
      for (const underlying of this.TRACKED_OPTIONS) {
        console.log(`Fetching options data for ${underlying}...`)
        await this.fetchOptionsForUnderlying(underlying)
        
        // Add delay between requests to respect rate limits
        await this.delay(1000)
      }
      
      console.log('Options data fetch and store completed successfully')
    } catch (error) {
      console.error('Error in fetchAndStoreOptionsData:', error)
      // Fallback to mock data if real API fails
      await this.generateAndStoreMockData()
    }
  }

  /**
   * Fetch options data for a specific underlying ticker
   */
  private static async fetchOptionsForUnderlying(underlying: string): Promise<void> {
    try {
      // Get options contracts for the underlying
      const contractsUrl = `${this.BASE_URL}/v3/reference/options/contracts?underlying_ticker=${underlying}&limit=1000&apikey=${this.POLYGON_API_KEY}`
      
      const contractsResponse = await fetch(contractsUrl)
      if (!contractsResponse.ok) {
        throw new Error(`Failed to fetch contracts for ${underlying}: ${contractsResponse.status}`)
      }
      
      const contractsData = await contractsResponse.json()
      
      if (!contractsData.results || contractsData.results.length === 0) {
        console.log(`No contracts found for ${underlying}`)
        return
      }

      // Filter for liquid options (near-term expirations, near-the-money strikes)
      const liquidContracts = this.filterLiquidContracts(contractsData.results, underlying)
      
      console.log(`Found ${liquidContracts.length} liquid contracts for ${underlying}`)

      // Fetch historical data for each contract (last 14 days)
      for (const contract of liquidContracts.slice(0, 20)) { // Limit to top 20 most liquid
        await this.fetchContractHistoricalData(contract)
        await this.delay(500) // Rate limiting
      }
      
    } catch (error) {
      console.error(`Error fetching options for ${underlying}:`, error)
    }
  }

  /**
   * Filter contracts to get the most liquid options
   */
  private static filterLiquidContracts(contracts: any[], underlying: string): any[] {
    const now = new Date()
    const maxExpiration = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // 60 days out
    
    return contracts
      .filter(contract => {
        const expDate = new Date(contract.expiration_date)
        return expDate > now && expDate <= maxExpiration
      })
      .sort((a, b) => {
        // Sort by expiration date (nearest first) and then by strike price
        const dateA = new Date(a.expiration_date)
        const dateB = new Date(b.expiration_date)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime()
        }
        return Math.abs(a.strike_price - 100) - Math.abs(b.strike_price - 100) // Prefer ATM
      })
  }

  /**
   * Fetch historical data for a specific options contract
   */
  private static async fetchContractHistoricalData(contract: any): Promise<void> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
      
      const historicalUrl = `${this.BASE_URL}/v2/aggs/ticker/${contract.ticker}/range/1/day/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}?apikey=${this.POLYGON_API_KEY}`
      
      const response = await fetch(historicalUrl)
      if (!response.ok) {
        console.warn(`Failed to fetch historical data for ${contract.ticker}: ${response.status}`)
        return
      }
      
      const data = await response.json()
      
      if (!data.results || data.results.length === 0) {
        console.log(`No historical data found for ${contract.ticker}`)
        return
      }

      // Transform and store the data
      const historicalData = data.results.map((bar: any) => ({
        date: new Date(bar.t).toISOString().split('T')[0],
        bid: bar.o * 0.98, // Approximate bid as 98% of open
        ask: bar.o * 1.02, // Approximate ask as 102% of open
        last: bar.c,
        volume: bar.v,
        open_interest: Math.floor(Math.random() * 10000) + 1000, // Mock OI
        implied_volatility: 0.2 + Math.random() * 0.3, // Mock IV
        delta: contract.contract_type === 'call' ? Math.random() * 0.8 : -Math.random() * 0.8,
        gamma: Math.random() * 0.1,
        theta: -Math.random() * 0.05,
        vega: Math.random() * 0.3
      }))

      // Store in Supabase
      await HistoricalDataService.storeOptionsHistoricalData(
        contract.ticker,
        contract.underlying_ticker,
        historicalData
      )
      
      console.log(`Stored ${historicalData.length} data points for ${contract.ticker}`)
      
    } catch (error) {
      console.error(`Error fetching historical data for ${contract.ticker}:`, error)
    }
  }

  /**
   * Generate and store mock data when real API is not available
   */
  private static async generateAndStoreMockData(): Promise<void> {
    console.log('Generating mock options data...')

    try {
      let topContracts

      try {
        topContracts = PolygonService.getTopLiquidOptions()
      } catch (error) {
        console.error('Error calling getTopLiquidOptions:', error)
        return
      }

      if (!topContracts || !Array.isArray(topContracts)) {
        console.error('getTopLiquidOptions did not return an array:', topContracts)
        return
      }

      if (topContracts.length === 0) {
        console.warn('No contracts available for mock data generation')
        return
      }

      console.log(`Generating mock data for ${topContracts.length} contracts...`)

      for (const contract of topContracts) {
        if (!contract || !contract.ticker || !contract.underlying_ticker) {
          console.warn('Invalid contract data, skipping:', contract)
          continue
        }

        const historicalData = this.generateMockHistoricalData(contract, 14)

        try {
          await HistoricalDataService.storeOptionsHistoricalData(
            contract.ticker,
            contract.underlying_ticker,
            historicalData
          )
          console.log(`Stored mock data for ${contract.ticker}`)
        } catch (error) {
          console.error(`Error storing mock data for ${contract.ticker}:`, error)
        }
      }

      console.log('Mock data generation completed')
    } catch (error) {
      console.error('Error in generateAndStoreMockData:', error)
    }
  }

  /**
   * Generate mock historical data for an options contract
   */
  private static generateMockHistoricalData(contract: any, days: number): any[] {
    const data: any[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate realistic options price movement
      const dailyChange = (Math.random() - 0.5) * 0.2 // ±10% daily change
      const basePrice = contract.last
      const price = Math.max(0.01, basePrice * (1 + dailyChange))
      
      data.push({
        date: date.toISOString().split('T')[0],
        bid: Math.max(0.01, price * 0.98),
        ask: price * 1.02,
        last: price,
        volume: Math.floor(Math.random() * contract.volume * 0.5) + 100,
        open_interest: contract.open_interest + Math.floor((Math.random() - 0.5) * 1000),
        implied_volatility: contract.implied_volatility * (1 + (Math.random() - 0.5) * 0.1),
        delta: contract.delta * (1 + (Math.random() - 0.5) * 0.05),
        gamma: contract.gamma * (1 + (Math.random() - 0.5) * 0.1),
        theta: contract.theta * (1 + (Math.random() - 0.5) * 0.1),
        vega: contract.vega * (1 + (Math.random() - 0.5) * 0.1)
      })
    }
    
    return data
  }

  /**
   * Schedule the data fetch to run after market hours
   */
  static scheduleAfterMarketDataFetch(): void {
    console.log('Setting up after-market options data scheduler...')
    
    const scheduleNextRun = () => {
      const now = new Date()
      const nextRun = new Date()
      
      // Set to midnight EST (5 AM UTC during standard time, 4 AM UTC during daylight time)
      nextRun.setUTCHours(5, 0, 0, 0) // Assuming EST
      
      // If it's already past midnight today, schedule for tomorrow
      if (now >= nextRun) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      
      const timeUntilRun = nextRun.getTime() - now.getTime()
      
      console.log(`Next options data fetch scheduled for: ${nextRun.toISOString()}`)
      console.log(`Time until next run: ${Math.round(timeUntilRun / 1000 / 60)} minutes`)
      
      setTimeout(async () => {
        console.log('Running scheduled options data fetch...')
        await this.fetchAndStoreOptionsData()
        
        // Schedule the next run
        scheduleNextRun()
      }, Math.max(1000, timeUntilRun))
    }
    
    // Start the scheduler
    scheduleNextRun()
    
    // Also run immediately on startup (for testing/initial data)
    setTimeout(() => {
      console.log('Running initial options data fetch...')
      this.fetchAndStoreOptionsData()
    }, 5000) // Wait 5 seconds after startup
  }

  /**
   * Check if market is closed (after 4 PM EST on weekdays)
   */
  private static isAfterMarketHours(): boolean {
    const now = new Date()
    const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}))
    const day = est.getDay() // 0 = Sunday, 6 = Saturday
    const hour = est.getHours()
    
    // Market is closed on weekends
    if (day === 0 || day === 6) {
      return true
    }
    
    // Market closes at 4 PM EST
    return hour >= 16 || hour < 9 // After 4 PM or before 9 AM
  }

  /**
   * Get the next market close time
   */
  private static getNextMarketClose(): Date {
    const now = new Date()
    const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}))
    const nextClose = new Date(est)
    
    // Set to 4 PM EST
    nextClose.setHours(16, 0, 0, 0)
    
    // If it's already past 4 PM today, set to next weekday
    if (est >= nextClose || est.getDay() === 0 || est.getDay() === 6) {
      do {
        nextClose.setDate(nextClose.getDate() + 1)
      } while (nextClose.getDay() === 0 || nextClose.getDay() === 6) // Skip weekends
      
      nextClose.setHours(16, 0, 0, 0)
    }
    
    return nextClose
  }

  /**
   * Utility function to add delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      try {
        globalThis.setTimeout(resolve, Math.max(100, ms || 1000))
      } catch (error) {
        console.error('Error in delay function:', error)
        resolve() // Resolve immediately if setTimeout fails
      }
    })
  }

  /**
   * Get data fetch statistics
   */
  static async getDataFetchStats(): Promise<{
    lastFetch: Date | null
    totalContracts: number
    dataPoints: number
    nextScheduledFetch: Date
  }> {
    try {
      const stats = await HistoricalDataService.getStorageStats()
      
      return {
        lastFetch: new Date(), // This would be stored in a separate table in production
        totalContracts: Math.floor(stats.optionsDataPoints / 14), // Approximate
        dataPoints: stats.optionsDataPoints,
        nextScheduledFetch: this.getNextMarketClose()
      }
    } catch (error) {
      console.error('Error getting data fetch stats:', error)
      return {
        lastFetch: null,
        totalContracts: 0,
        dataPoints: 0,
        nextScheduledFetch: this.getNextMarketClose()
      }
    }
  }

  /**
   * Manual trigger for data fetch (for testing)
   */
  static async triggerManualFetch(): Promise<void> {
    console.log('Manual options data fetch triggered...')
    await this.fetchAndStoreOptionsData()
  }
}