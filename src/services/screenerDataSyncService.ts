import { supabase } from '../lib/supabase'
import { OptionsScreenerService } from './optionsScreenerService'

interface StockConfig {
  ticker: string
  name: string
  sector: string
  exchange?: string
  isLiquid?: boolean
}

export class ScreenerDataSyncService {
  private static readonly STOCKS: StockConfig[] = [
    { ticker: 'AXISBANK', name: 'Axis Bank', sector: 'BANK', isLiquid: true },
    { ticker: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'FINANCE', isLiquid: true },
    { ticker: 'BEL', name: 'Bharat Electronics', sector: 'DEFENSE', isLiquid: false },
    { ticker: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'TELECOM', isLiquid: true },
    { ticker: 'BSE', name: 'BSE Limited', sector: 'FINANCE', isLiquid: true },
    { ticker: 'CANBK', name: 'Canara Bank', sector: 'BANK', isLiquid: true },
    { ticker: 'CDSL', name: 'CDSL', sector: 'FINANCE', isLiquid: true },
    { ticker: 'DIVISLAB', name: 'Divi\'s Laboratories', sector: 'PHARMA', isLiquid: true },
    { ticker: 'HDFCBANK', name: 'HDFC Bank', sector: 'BANK', isLiquid: true },
    { ticker: 'ICICIBANK', name: 'ICICI Bank', sector: 'BANK', isLiquid: true },
    { ticker: 'INFY', name: 'Infosys', sector: 'IT', isLiquid: true },
    { ticker: 'ITC', name: 'ITC Limited', sector: 'FMCG', isLiquid: true },
    { ticker: 'RELIANCE', name: 'Reliance Industries', sector: 'ENERGY', isLiquid: true },
    { ticker: 'SBIN', name: 'State Bank of India', sector: 'BANK', isLiquid: true },
    { ticker: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', isLiquid: true },
    { ticker: 'TATAMOTORS', name: 'Tata Motors', sector: 'AUTO', isLiquid: true },
    { ticker: 'TATASTEEL', name: 'Tata Steel', sector: 'METAL', isLiquid: true },
    { ticker: 'WIPRO', name: 'Wipro', sector: 'IT', isLiquid: true }
  ]

  static async initializeStocks(): Promise<void> {
    console.log('Initializing screener stocks...')

    try {
      const stocksToInsert = this.STOCKS.map(stock => ({
        ticker: stock.ticker,
        name: stock.name,
        sector: stock.sector,
        exchange: stock.exchange || 'NSE',
        is_liquid: stock.isLiquid !== undefined ? stock.isLiquid : true
      }))

      const { error } = await supabase
        .from('screener_stocks')
        .upsert(stocksToInsert, {
          onConflict: 'ticker',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error initializing stocks:', error)
        throw error
      }

      console.log(`Successfully initialized ${this.STOCKS.length} stocks`)
    } catch (error) {
      console.error('Error in initializeStocks:', error)
      throw error
    }
  }

  static async syncAllScreenerData(): Promise<void> {
    console.log('Starting screener data sync...')

    try {
      await this.initializeStocks()

      const tickers = this.STOCKS.map(s => s.ticker)

      await OptionsScreenerService.syncScreenerData(tickers)

      console.log('Screener data sync completed successfully')
    } catch (error) {
      console.error('Error syncing screener data:', error)
      throw error
    }
  }

  static async syncSingleTicker(ticker: string): Promise<void> {
    console.log(`Syncing data for ${ticker}...`)

    try {
      const stockConfig = this.STOCKS.find(s => s.ticker === ticker)

      if (!stockConfig) {
        throw new Error(`Stock ${ticker} not found in configuration`)
      }

      await supabase
        .from('screener_stocks')
        .upsert({
          ticker: stockConfig.ticker,
          name: stockConfig.name,
          sector: stockConfig.sector,
          exchange: stockConfig.exchange || 'NSE',
          is_liquid: stockConfig.isLiquid !== undefined ? stockConfig.isLiquid : true
        }, {
          onConflict: 'ticker'
        })

      await OptionsScreenerService.syncScreenerData([ticker])

      console.log(`Successfully synced ${ticker}`)
    } catch (error) {
      console.error(`Error syncing ${ticker}:`, error)
      throw error
    }
  }

  static async getStockList(): Promise<StockConfig[]> {
    return this.STOCKS
  }

  static async schedulePeriodicSync(intervalMinutes: number = 15): Promise<void> {
    console.log(`Scheduling periodic sync every ${intervalMinutes} minutes`)

    await this.syncAllScreenerData()

    setInterval(async () => {
      try {
        await this.syncAllScreenerData()
      } catch (error) {
        console.error('Error in scheduled sync:', error)
      }
    }, intervalMinutes * 60 * 1000)
  }

  static async clearScreenerData(): Promise<void> {
    console.log('Clearing screener data...')

    try {
      const { error: dataError } = await supabase
        .from('screener_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (dataError) {
        console.error('Error clearing screener_data:', dataError)
      }

      const { error: historyError } = await supabase
        .from('screener_iv_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (historyError) {
        console.error('Error clearing screener_iv_history:', historyError)
      }

      const { error: oiError } = await supabase
        .from('screener_oi_chain')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (oiError) {
        console.error('Error clearing screener_oi_chain:', oiError)
      }

      console.log('Screener data cleared successfully')
    } catch (error) {
      console.error('Error clearing screener data:', error)
      throw error
    }
  }
}
