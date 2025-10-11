import { supabase } from '../lib/supabase'

export class IVPercentileService {
  static async calculateIVPercentile(ticker: string, currentIV: number): Promise<number> {
    try {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      const { data, error } = await supabase
        .from('screener_iv_history')
        .select('atm_iv')
        .eq('ticker', ticker)
        .gte('date', oneYearAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error || !data || data.length === 0) {
        return 50
      }

      const historicalIVs = data.map(row => Number(row.atm_iv))
      const lowerCount = historicalIVs.filter(iv => iv < currentIV).length
      const percentile = Math.round((lowerCount / historicalIVs.length) * 100)

      return Math.min(100, Math.max(0, percentile))
    } catch (error) {
      console.error('Error calculating IV percentile:', error)
      return 50
    }
  }

  static async storeHistoricalIV(ticker: string, atmIV: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { error } = await supabase
        .from('screener_iv_history')
        .upsert({
          ticker,
          date: today,
          atm_iv: atmIV
        }, {
          onConflict: 'ticker,date'
        })

      if (error) {
        console.error('Error storing IV history:', error)
      }
    } catch (error) {
      console.error('Error in storeHistoricalIV:', error)
    }
  }

  static async bulkCalculateIVPercentiles(tickers: string[]): Promise<Map<string, number>> {
    const percentiles = new Map<string, number>()

    for (const ticker of tickers) {
      try {
        const { data } = await supabase
          .from('screener_data')
          .select('atm_iv')
          .eq('ticker', ticker)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data) {
          const ivp = await this.calculateIVPercentile(ticker, Number(data.atm_iv))
          percentiles.set(ticker, ivp)
        }
      } catch (error) {
        console.error(`Error calculating IVP for ${ticker}:`, error)
      }
    }

    return percentiles
  }

  static getIVPColor(ivp: number): string {
    if (ivp >= 75) return 'text-red-600 font-semibold'
    if (ivp >= 50) return 'text-orange-600'
    if (ivp >= 25) return 'text-yellow-600'
    return 'text-green-600'
  }

  static getIVPIndicator(ivp: number): { label: string; description: string } {
    if (ivp >= 75) {
      return {
        label: 'Very High',
        description: 'IV is in the top 25% of its 52-week range. Consider selling premium.'
      }
    }
    if (ivp >= 50) {
      return {
        label: 'High',
        description: 'IV is above the median. Premium selling strategies may be favorable.'
      }
    }
    if (ivp >= 25) {
      return {
        label: 'Low',
        description: 'IV is below the median. Premium buying strategies may be favorable.'
      }
    }
    return {
      label: 'Very Low',
      description: 'IV is in the bottom 25% of its 52-week range. Consider buying premium.'
    }
  }
}
