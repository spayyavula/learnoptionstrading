import type { HistoricalData } from '../types/options'

// Lazy load environment variables
const getEnvVars = () => ({
  ENABLE_DATA_PERSISTENCE: import.meta.env.VITE_ENABLE_DATA_PERSISTENCE === 'true',
  RETENTION_DAYS: parseInt(import.meta.env.VITE_HISTORICAL_DATA_RETENTION_DAYS || '30')
})

interface StorageStats {
  stockDataPoints: number
  optionsDataPoints: number
  oldestDate: string | null
  newestDate: string | null
}

interface OptionsHistoricalDataPoint {
  date: string
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
}

export class HistoricalDataService {
  /**
   * Store historical data for a ticker in Supabase
   */
  static async storeHistoricalData(ticker: string, data: HistoricalData[]): Promise<void> {
    const { ENABLE_DATA_PERSISTENCE } = getEnvVars()
    
    if (!ENABLE_DATA_PERSISTENCE) {
      console.log('Data persistence disabled, skipping data storage')
      return
    }

    try {
      // Import supabase dynamically to avoid build issues
      const { supabase } = await import('../lib/supabase')
      
      if (!supabase) {
        console.log('Supabase not configured, using local storage fallback')
        this.storeInLocalStorage(`historical_${ticker}`, data)
        return
      }

      // Prepare data for insertion
      const insertData = data.map(item => ({
        ticker,
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }))

      // Insert data (upsert to handle duplicates)
      const { error } = await supabase
        .from('historical_data')
        .upsert(insertData, { 
          onConflict: 'ticker,date',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error storing historical data:', error)
        // Fallback to local storage
        this.storeInLocalStorage(`historical_${ticker}`, data)
        return
      }

      console.log(`Stored ${data.length} historical data points for ${ticker}`)
    } catch (error) {
      console.error('Failed to store historical data:', error)
      // Fallback to local storage
      this.storeInLocalStorage(`historical_${ticker}`, data)
    }
  }

  /**
   * Retrieve historical data for a ticker from Supabase
   */
  static async getHistoricalData(ticker: string, days: number = 14): Promise<HistoricalData[]> {
    const { ENABLE_DATA_PERSISTENCE } = getEnvVars()
    
    if (!ENABLE_DATA_PERSISTENCE) {
      console.log('Data persistence disabled, returning empty data')
      return []
    }

    try {
      // Import supabase dynamically to avoid build issues
      const { supabase } = await import('../lib/supabase')
      
      if (!supabase) {
        console.log('Supabase not configured, checking local storage')
        return this.getFromLocalStorage(`historical_${ticker}`) || []
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('historical_data')
        .select('*')
        .eq('ticker', ticker)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching historical data:', error)
        // Fallback to local storage
        return this.getFromLocalStorage(`historical_${ticker}`) || []
      }

      return data?.map(item => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      })) || []
    } catch (error) {
      console.error('Failed to fetch historical data:', error)
      // Fallback to local storage
      return this.getFromLocalStorage(`historical_${ticker}`) || []
    }
  }

  /**
   * Store options historical data
   */
  static async storeOptionsHistoricalData(
    contractTicker: string, 
    underlyingTicker: string, 
    data: OptionsHistoricalDataPoint[]
  ): Promise<void> {
    const { ENABLE_DATA_PERSISTENCE } = getEnvVars()
    
    if (!ENABLE_DATA_PERSISTENCE) {
      console.log('Data persistence disabled, skipping options data storage')
      return
    }

    try {
      // Import supabase dynamically to avoid build issues
      const { supabase } = await import('../lib/supabase')
      
      if (!supabase) {
        console.log('Supabase not configured, using local storage fallback')
        this.storeInLocalStorage(`options_${contractTicker}`, data)
        return
      }

      const insertData = data.map(item => ({
        contract_ticker: contractTicker,
        underlying_ticker: underlyingTicker,
        date: item.date,
        bid: item.bid,
        ask: item.ask,
        last: item.last,
        volume: item.volume,
        open_interest: item.open_interest,
        implied_volatility: item.implied_volatility,
        delta: item.delta,
        gamma: item.gamma,
        theta: item.theta,
        vega: item.vega
      }))

      const { error } = await supabase
        .from('options_historical_data')
        .upsert(insertData, { 
          onConflict: 'contract_ticker,date',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error storing options historical data:', error)
        this.storeInLocalStorage(`options_${contractTicker}`, data)
        return
      }

      console.log(`Stored ${data.length} options historical data points for ${contractTicker}`)
    } catch (error) {
      console.error('Failed to store options historical data:', error)
      this.storeInLocalStorage(`options_${contractTicker}`, data)
    }
  }

  /**
   * Get options historical data
   */
  static async getOptionsHistoricalData(
    contractTicker: string, 
    days: number = 14
  ): Promise<OptionsHistoricalDataPoint[]> {
    const { ENABLE_DATA_PERSISTENCE } = getEnvVars()
    
    if (!ENABLE_DATA_PERSISTENCE) {
      console.log('Data persistence disabled, returning empty options data')
      return []
    }

    try {
      // Import supabase dynamically to avoid build issues
      const { supabase } = await import('../lib/supabase')
      
      if (!supabase) {
        console.log('Supabase not configured, checking local storage')
        return this.getFromLocalStorage(`options_${contractTicker}`) || []
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('options_historical_data')
        .select('*')
        .eq('contract_ticker', contractTicker)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching options historical data:', error)
        return this.getFromLocalStorage(`options_${contractTicker}`) || []
      }

      return data?.map(item => ({
        date: item.date,
        bid: item.bid,
        ask: item.ask,
        last: item.last,
        volume: item.volume,
        open_interest: item.open_interest,
        implied_volatility: item.implied_volatility,
        delta: item.delta,
        gamma: item.gamma,
        theta: item.theta,
        vega: item.vega
      })) || []
    } catch (error) {
      console.error('Failed to fetch options historical data:', error)
      return this.getFromLocalStorage(`options_${contractTicker}`) || []
    }
  }

  /**
   * Clean up old historical data based on retention policy
   */
  static async cleanupOldData(): Promise<void> {
    const { ENABLE_DATA_PERSISTENCE, RETENTION_DAYS } = getEnvVars()
    
    if (!ENABLE_DATA_PERSISTENCE) {
      return
    }

    try {
      // Import supabase dynamically to avoid build issues
      const { supabase } = await import('../lib/supabase')
      
      if (!supabase) {
        console.log('Supabase not configured, skipping cleanup')
        return
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

      // Clean up stock historical data
      const { error: stockError } = await supabase
        .from('historical_data')
        .delete()
        .lt('date', cutoffDate.toISOString().split('T')[0])

      if (stockError) {
        console.error('Error cleaning up stock historical data:', stockError)
      }

      // Clean up options historical data
      const { error: optionsError } = await supabase
        .from('options_historical_data')
        .delete()
        .lt('date', cutoffDate.toISOString().split('T')[0])

      if (optionsError) {
        console.error('Error cleaning up options historical data:', optionsError)
      }

      console.log(`Cleaned up historical data older than ${RETENTION_DAYS} days`)
    } catch (error) {
      console.error('Failed to cleanup old data:', error)
    }
  }

  /**
   * Get data storage statistics
   */
  static async getStorageStats(): Promise<StorageStats> {
    const { ENABLE_DATA_PERSISTENCE } = getEnvVars()
    
    if (!ENABLE_DATA_PERSISTENCE) {
      return {
        stockDataPoints: 0,
        optionsDataPoints: 0,
        oldestDate: null,
        newestDate: null
      }
    }

    try {
      // Import supabase dynamically to avoid build issues
      const supabaseModule = await import('../lib/supabase')
      const supabase = supabaseModule.supabase
      
      if (!supabase) {
        // Return local storage stats
        return this.getLocalStorageStats()
      }

      // Get stock data count
      const { count: stockCount } = await supabase
        .from('historical_data')
        .select('*', { count: 'exact', head: true })

      // Get options data count
      const { count: optionsCount } = await supabase
        .from('options_historical_data')
        .select('*', { count: 'exact', head: true })

      // Get date range
      const { data: dateRange } = await supabase
        .from('historical_data')
        .select('date')
        .order('date', { ascending: true })
        .limit(1)

      const { data: latestDate } = await supabase
        .from('historical_data')
        .select('date')
        .order('date', { ascending: false })
        .limit(1)

      return {
        stockDataPoints: stockCount || 0,
        optionsDataPoints: optionsCount || 0,
        oldestDate: dateRange?.[0]?.date || null,
        newestDate: latestDate?.[0]?.date || null
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return this.getLocalStorageStats()
    }
  }

  // Local storage fallback methods
  private static storeInLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to store in local storage:', error)
    }
  }

  private static getFromLocalStorage(key: string): any {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to get from local storage:', error)
      return null
    }
  }

  private static getLocalStorageStats(): StorageStats {
    let stockDataPoints = 0
    let optionsDataPoints = 0
    let oldestDate: string | null = null
    let newestDate: string | null = null

    try {
      // Count local storage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('historical_')) {
          const data = this.getFromLocalStorage(key)
          if (data && Array.isArray(data)) {
            stockDataPoints += data.length
          }
        } else if (key?.startsWith('options_')) {
          const data = this.getFromLocalStorage(key)
          if (data && Array.isArray(data)) {
            optionsDataPoints += data.length
          }
        }
      }
    } catch (error) {
      console.error('Failed to get local storage stats:', error)
    }

    return {
      stockDataPoints,
      optionsDataPoints,
      oldestDate,
      newestDate
    }
  }
}