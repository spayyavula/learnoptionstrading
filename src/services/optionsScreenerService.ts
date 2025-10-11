import { supabase } from '../lib/supabase'
import { PolygonService } from './polygonService'

export interface ScreenerResult {
  stock: string
  sector: string
  futPrice: number
  priceChgPct: number
  atmIv: number
  ivChg: number
  ivp: number
  result: string
  oiChgPct: number
  pcr: number
  maxPain: number
  oiAction?: string
  hasUpcomingEvent?: boolean
  isLiquid?: boolean
}

export interface ScreenerFilters {
  expiry?: string
  sector?: string
  liquidOnly?: boolean
  upcomingEvents?: boolean
  oiAction?: 'bullish' | 'bearish'
}

interface ScreenerDBRow {
  ticker: string
  expiry_date: string
  fut_price: number
  price_chg_pct: number
  atm_iv: number
  iv_chg: number
  ivp: number
  result_date: string | null
  oi_chg_pct: number
  pcr: number
  max_pain: number
  oi_action: string | null
  has_upcoming_event: boolean
  screener_stocks: {
    sector: string
    is_liquid: boolean
  }
}

export class OptionsScreenerService {
  static async getScreenerData(filters: ScreenerFilters = {}): Promise<ScreenerResult[]> {
    try {
      let query = supabase
        .from('screener_data')
        .select(`
          ticker,
          expiry_date,
          fut_price,
          price_chg_pct,
          atm_iv,
          iv_chg,
          ivp,
          result_date,
          oi_chg_pct,
          pcr,
          max_pain,
          oi_action,
          has_upcoming_event,
          screener_stocks!inner (
            sector,
            is_liquid
          )
        `)
        .order('ticker', { ascending: true })

      if (filters.liquidOnly) {
        query = query.eq('screener_stocks.is_liquid', true)
      }

      if (filters.sector) {
        query = query.eq('screener_stocks.sector', filters.sector)
      }

      if (filters.upcomingEvents) {
        query = query.eq('has_upcoming_event', true)
      }

      if (filters.expiry) {
        const expiryDate = this.getExpiryDateFromMonth(filters.expiry)
        if (expiryDate) {
          query = query.eq('expiry_date', expiryDate)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching screener data:', error)
        return this.getMockData(filters)
      }

      if (!data || data.length === 0) {
        return this.getMockData(filters)
      }

      return data.map((row: ScreenerDBRow) => ({
        stock: row.ticker,
        sector: row.screener_stocks.sector,
        futPrice: Number(row.fut_price),
        priceChgPct: Number(row.price_chg_pct),
        atmIv: Number(row.atm_iv),
        ivChg: Number(row.iv_chg),
        ivp: Number(row.ivp),
        result: row.result_date || 'TBA',
        oiChgPct: Number(row.oi_chg_pct),
        pcr: Number(row.pcr),
        maxPain: Number(row.max_pain),
        oiAction: row.oi_action || undefined,
        hasUpcomingEvent: row.has_upcoming_event,
        isLiquid: row.screener_stocks.is_liquid
      }))
    } catch (error) {
      console.error('Error in getScreenerData:', error)
      return this.getMockData(filters)
    }
  }

  static async syncScreenerData(tickers: string[]): Promise<void> {
    const ENABLE_REAL_TIME = import.meta.env.VITE_ENABLE_REAL_TIME_DATA === 'true'

    if (!ENABLE_REAL_TIME) {
      console.log('Real-time data disabled, skipping screener sync')
      return
    }

    for (const ticker of tickers) {
      try {
        await this.syncTickerData(ticker)
      } catch (error) {
        console.error(`Error syncing ${ticker}:`, error)
      }
    }
  }

  private static async syncTickerData(ticker: string): Promise<void> {
    try {
      const quote = await PolygonService.getQuote(ticker)
      const optionsChain = await PolygonService.getOptionsChain(ticker)

      if (!quote || !optionsChain || optionsChain.length === 0) {
        return
      }

      const atmOptions = this.findATMOptions(optionsChain, quote.price)
      const atmIV = atmOptions.call?.impliedVolatility || 0

      const totalCallOI = optionsChain
        .filter(o => o.type === 'call')
        .reduce((sum, o) => sum + (o.openInterest || 0), 0)

      const totalPutOI = optionsChain
        .filter(o => o.type === 'put')
        .reduce((sum, o) => sum + (o.openInterest || 0), 0)

      const pcr = this.calculatePCR(totalPutOI, totalCallOI)

      const strikes = [...new Set(optionsChain.map(o => o.strikePrice))].sort((a, b) => a - b)
      const callOIByStrike = new Map<number, number>()
      const putOIByStrike = new Map<number, number>()

      optionsChain.forEach(opt => {
        if (opt.type === 'call') {
          callOIByStrike.set(opt.strikePrice, (callOIByStrike.get(opt.strikePrice) || 0) + (opt.openInterest || 0))
        } else {
          putOIByStrike.set(opt.strikePrice, (putOIByStrike.get(opt.strikePrice) || 0) + (opt.openInterest || 0))
        }
      })

      const callOI = strikes.map(s => callOIByStrike.get(s) || 0)
      const putOI = strikes.map(s => putOIByStrike.get(s) || 0)
      const maxPain = this.calculateMaxPain(strikes, callOI, putOI)

      const expiry = optionsChain[0]?.expirationDate || new Date().toISOString().split('T')[0]

      const { error } = await supabase
        .from('screener_data')
        .upsert({
          ticker,
          expiry_date: expiry,
          fut_price: quote.price,
          price_chg_pct: quote.changePercent || 0,
          atm_iv: atmIV * 100,
          iv_chg: 0,
          ivp: 50,
          oi_chg_pct: 0,
          pcr,
          max_pain: maxPain,
          total_call_oi: totalCallOI,
          total_put_oi: totalPutOI,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'ticker,expiry_date'
        })

      if (error) {
        console.error(`Error upserting screener data for ${ticker}:`, error)
      }
    } catch (error) {
      console.error(`Error syncing ticker ${ticker}:`, error)
    }
  }

  private static findATMOptions(chain: any[], spotPrice: number) {
    let closestStrike = chain[0]?.strikePrice || spotPrice
    let minDiff = Math.abs(closestStrike - spotPrice)

    chain.forEach(opt => {
      const diff = Math.abs(opt.strikePrice - spotPrice)
      if (diff < minDiff) {
        minDiff = diff
        closestStrike = opt.strikePrice
      }
    })

    const call = chain.find(o => o.strikePrice === closestStrike && o.type === 'call')
    const put = chain.find(o => o.strikePrice === closestStrike && o.type === 'put')

    return { call, put, strike: closestStrike }
  }

  private static getExpiryDateFromMonth(month: string): string | null {
    const monthMap: Record<string, string> = {
      'October': '2025-10-31',
      'November': '2025-11-28',
      'December': '2025-12-26',
      'January': '2026-01-30',
      'February': '2026-02-27'
    }
    return monthMap[month] || null
  }

  private static getMockData(filters: ScreenerFilters): ScreenerResult[] {
    const mockData: ScreenerResult[] = [
      {
        stock: 'SPX',
        sector: 'INDEX',
        futPrice: 5780.50,
        priceChgPct: 0.4,
        atmIv: 11.2,
        ivChg: -0.3,
        ivp: 12,
        result: 'N/A',
        oiChgPct: -0.8,
        pcr: 1.15,
        maxPain: 5750,
        oiAction: 'Short Cover',
        isLiquid: true
      },
      {
        stock: 'NDX',
        sector: 'INDEX',
        futPrice: 20125.80,
        priceChgPct: 0.7,
        atmIv: 13.5,
        ivChg: -0.5,
        ivp: 8,
        result: 'N/A',
        oiChgPct: 2.4,
        pcr: 1.08,
        maxPain: 20000,
        oiAction: 'Long Buildup',
        isLiquid: true
      },
      {
        stock: 'AAPL',
        sector: 'TECHNOLOGY',
        futPrice: 225.90,
        priceChgPct: 1.2,
        atmIv: 21.3,
        ivChg: -0.8,
        ivp: 35,
        result: '31 Oct',
        oiChgPct: 3.5,
        pcr: 0.62,
        maxPain: 222.5,
        oiAction: 'Long Buildup',
        isLiquid: true
      },
      {
        stock: 'MSFT',
        sector: 'TECHNOLOGY',
        futPrice: 415.20,
        priceChgPct: 0.8,
        atmIv: 19.5,
        ivChg: -0.6,
        ivp: 28,
        result: '25 Oct',
        oiChgPct: 2.1,
        pcr: 0.68,
        maxPain: 412.5,
        oiAction: 'Long Buildup',
        isLiquid: true
      },
      {
        stock: 'GOOGL',
        sector: 'TECHNOLOGY',
        futPrice: 172.45,
        priceChgPct: 1.5,
        atmIv: 22.8,
        ivChg: -0.4,
        ivp: 42,
        result: '24 Oct',
        oiChgPct: 4.2,
        pcr: 0.55,
        maxPain: 170,
        oiAction: 'Long Buildup',
        isLiquid: true
      },
      {
        stock: 'AMZN',
        sector: 'TECHNOLOGY',
        futPrice: 185.30,
        priceChgPct: 2.1,
        atmIv: 24.5,
        ivChg: 0.8,
        ivp: 55,
        result: '26 Oct',
        oiChgPct: 5.3,
        pcr: 0.48,
        maxPain: 182.5,
        oiAction: 'Long Buildup',
        isLiquid: true
      },
      {
        stock: 'NVDA',
        sector: 'TECHNOLOGY',
        futPrice: 138.75,
        priceChgPct: 3.2,
        atmIv: 35.2,
        ivChg: 2.1,
        ivp: 72,
        result: '20 Nov',
        oiChgPct: 8.5,
        pcr: 0.42,
        maxPain: 135,
        oiAction: 'Long Buildup',
        isLiquid: true
      },
      {
        stock: 'META',
        sector: 'TECHNOLOGY',
        futPrice: 568.90,
        priceChgPct: 1.8,
        atmIv: 28.3,
        ivChg: 0.5,
        ivp: 48,
        result: '30 Oct',
        oiChgPct: 3.7,
        pcr: 0.51,
        maxPain: 565,
        oiAction: 'Long Buildup',
        isLiquid: true
      },
      {
        stock: 'TSLA',
        sector: 'AUTO',
        futPrice: 242.80,
        priceChgPct: 4.5,
        atmIv: 42.7,
        ivChg: 3.2,
        ivp: 85,
        result: '23 Oct',
        oiChgPct: 12.3,
        pcr: 0.38,
        maxPain: 237.5,
        oiAction: 'Long Buildup',
        isLiquid: true
      },
      {
        stock: 'JPM',
        sector: 'FINANCE',
        futPrice: 215.60,
        priceChgPct: 0.6,
        atmIv: 18.9,
        ivChg: -0.8,
        ivp: 32,
        result: '11 Oct',
        oiChgPct: 1.5,
        pcr: 0.75,
        maxPain: 215,
        oiAction: 'Short Cover',
        isLiquid: true
      },
      {
        stock: 'V',
        sector: 'FINANCE',
        futPrice: 285.40,
        priceChgPct: 0.4,
        atmIv: 16.2,
        ivChg: -0.5,
        ivp: 25,
        result: 'TBA',
        oiChgPct: -0.8,
        pcr: 0.82,
        maxPain: 285,
        oiAction: 'Short Cover',
        isLiquid: true
      },
      {
        stock: 'WMT',
        sector: 'CONSUMER',
        futPrice: 82.15,
        priceChgPct: 0.3,
        atmIv: 14.8,
        ivChg: -0.3,
        ivp: 18,
        result: '19 Nov',
        oiChgPct: 0.5,
        pcr: 0.88,
        maxPain: 82,
        oiAction: 'Neutral',
        isLiquid: true
      },
      {
        stock: 'JNJ',
        sector: 'HEALTHCARE',
        futPrice: 158.30,
        priceChgPct: -0.2,
        atmIv: 13.5,
        ivChg: 0.2,
        ivp: 22,
        result: '15 Oct',
        oiChgPct: -1.2,
        pcr: 0.95,
        maxPain: 158.5,
        oiAction: 'Long Unwind',
        isLiquid: true
      },
      {
        stock: 'UNH',
        sector: 'HEALTHCARE',
        futPrice: 582.40,
        priceChgPct: 1.1,
        atmIv: 17.3,
        ivChg: -0.4,
        ivp: 35,
        result: '15 Oct',
        oiChgPct: 2.8,
        pcr: 0.63,
        maxPain: 580,
        oiAction: 'Long Buildup',
        isLiquid: true
      },
      {
        stock: 'XOM',
        sector: 'ENERGY',
        futPrice: 118.65,
        priceChgPct: -0.8,
        atmIv: 20.1,
        ivChg: 1.2,
        ivp: 58,
        result: 'TBA',
        oiChgPct: -3.5,
        pcr: 1.15,
        maxPain: 119,
        oiAction: 'Short Buildup',
        isLiquid: true
      },
      {
        stock: 'CVX',
        sector: 'ENERGY',
        futPrice: 158.90,
        priceChgPct: -0.6,
        atmIv: 19.4,
        ivChg: 0.9,
        ivp: 52,
        result: 'TBA',
        oiChgPct: -2.8,
        pcr: 1.08,
        maxPain: 160,
        oiAction: 'Short Buildup',
        isLiquid: true
      },
      {
        stock: 'DIS',
        sector: 'ENTERTAINMENT',
        futPrice: 95.20,
        priceChgPct: 0.9,
        atmIv: 26.5,
        ivChg: -0.7,
        ivp: 45,
        result: '7 Nov',
        oiChgPct: 3.2,
        pcr: 0.58,
        maxPain: 94,
        oiAction: 'Long Buildup',
        isLiquid: true
      },
      {
        stock: 'NFLX',
        sector: 'ENTERTAINMENT',
        futPrice: 692.80,
        priceChgPct: 2.4,
        atmIv: 31.2,
        ivChg: 1.5,
        ivp: 68,
        result: '17 Oct',
        oiChgPct: 6.8,
        pcr: 0.45,
        maxPain: 685,
        oiAction: 'Long Buildup',
        isLiquid: true
      },
      {
        stock: 'BA',
        sector: 'INDUSTRIAL',
        futPrice: 152.40,
        priceChgPct: -1.5,
        atmIv: 32.8,
        ivChg: 2.3,
        ivp: 75,
        result: '23 Oct',
        oiChgPct: -4.2,
        pcr: 1.22,
        maxPain: 155,
        oiAction: 'Long Unwind',
        isLiquid: true
      },
      {
        stock: 'AMD',
        sector: 'TECHNOLOGY',
        futPrice: 162.35,
        priceChgPct: 2.8,
        atmIv: 38.5,
        ivChg: 1.8,
        ivp: 78,
        result: '29 Oct',
        oiChgPct: 7.5,
        pcr: 0.47,
        maxPain: 160,
        oiAction: 'Long Buildup',
        isLiquid: true
      }
    ]

    let filteredData = [...mockData]

    if (filters.liquidOnly) {
      filteredData = filteredData.filter(item => item.isLiquid)
    }

    if (filters.sector) {
      filteredData = filteredData.filter(item => item.sector === filters.sector)
    }

    if (filters.upcomingEvents) {
      filteredData = filteredData.filter(item => item.hasUpcomingEvent)
    }

    return filteredData
  }

  static getOIActionColor(action?: string): string {
    switch (action) {
      case 'Long Buildup':
        return 'text-green-600'
      case 'Short Cover':
        return 'text-green-500'
      case 'Long Unwind':
        return 'text-red-500'
      case 'Short Buildup':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  static calculateMaxPain(strikes: number[], callOI: number[], putOI: number[]): number {
    let minPain = Infinity
    let maxPainStrike = strikes[0]

    strikes.forEach((strike, index) => {
      let pain = 0

      strikes.forEach((s, i) => {
        if (s > strike) {
          pain += callOI[i] * (s - strike) * 100
        }
      })

      strikes.forEach((s, i) => {
        if (s < strike) {
          pain += putOI[i] * (strike - s) * 100
        }
      })

      if (pain < minPain) {
        minPain = pain
        maxPainStrike = strike
      }
    })

    return maxPainStrike
  }

  static calculatePCR(putOI: number, callOI: number): number {
    return callOI === 0 ? 0 : putOI / callOI
  }

  static getIVPColor(ivp: number): string {
    if (ivp >= 75) return 'text-red-600 font-semibold'
    if (ivp >= 50) return 'text-orange-600'
    if (ivp >= 25) return 'text-yellow-600'
    return 'text-green-600'
  }
}
