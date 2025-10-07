import { supabase } from '../lib/supabase'

export interface MarketEvent {
  id?: string
  ticker: string
  event_type: 'earnings' | 'fda_approval' | 'economic_data' | 'merger' | 'dividend' | 'stock_split' | 'product_launch' | 'guidance_update' | 'regulatory' | 'other'
  event_date: string
  event_title: string
  event_description?: string
  impact_severity: 'low' | 'medium' | 'high' | 'critical'
  actual_outcome?: any
  expected_outcome?: any
  surprise_factor?: number
  source?: string
  is_future_event: boolean
  created_at?: string
  updated_at?: string
}

export interface EarningsData {
  ticker: string
  quarter: string
  fiscal_year: number
  eps_actual?: number
  eps_estimate?: number
  eps_surprise?: number
  revenue_actual?: number
  revenue_estimate?: number
  revenue_surprise?: number
  announcement_date: string
}

export interface EconomicEvent {
  event_type: string
  event_name: string
  scheduled_date: string
  previous_value?: number
  consensus_estimate?: number
  actual_value?: number
  impact_level: 'low' | 'medium' | 'high'
}

export class MarketEventsService {
  private static readonly FINANCIAL_API_KEY = import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY || import.meta.env.VITE_ALPHA_VANTAGE_API_KEY
  private static readonly POLYGON_API_KEY = import.meta.env.VITE_POLYGON_API_KEY

  static async fetchEarningsCalendar(startDate: Date, endDate: Date): Promise<EarningsData[]> {
    try {
      if (!this.FINANCIAL_API_KEY || this.FINANCIAL_API_KEY === 'demo_api_key') {
        console.log('Using mock earnings data')
        return this.generateMockEarnings(startDate, endDate)
      }

      const startStr = startDate.toISOString().split('T')[0]
      const endStr = endDate.toISOString().split('T')[0]

      const url = `https://financialmodelingprep.com/api/v3/earning_calendar?from=${startStr}&to=${endStr}&apikey=${this.FINANCIAL_API_KEY}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch earnings: ${response.status}`)
      }

      const data = await response.json()

      return data.map((item: any) => ({
        ticker: item.symbol,
        quarter: `Q${item.quarter}`,
        fiscal_year: item.fiscalDateEnding ? new Date(item.fiscalDateEnding).getFullYear() : new Date().getFullYear(),
        eps_actual: item.eps,
        eps_estimate: item.epsEstimated,
        eps_surprise: item.eps && item.epsEstimated ? ((item.eps - item.epsEstimated) / Math.abs(item.epsEstimated)) * 100 : undefined,
        revenue_actual: item.revenue,
        revenue_estimate: item.revenueEstimated,
        revenue_surprise: item.revenue && item.revenueEstimated ? ((item.revenue - item.revenueEstimated) / item.revenueEstimated) * 100 : undefined,
        announcement_date: item.date
      }))
    } catch (error) {
      console.error('Error fetching earnings calendar:', error)
      return this.generateMockEarnings(startDate, endDate)
    }
  }

  static async storeMarketEvent(event: MarketEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('market_events')
        .upsert({
          ticker: event.ticker,
          event_type: event.event_type,
          event_date: event.event_date,
          event_title: event.event_title,
          event_description: event.event_description,
          impact_severity: event.impact_severity,
          actual_outcome: event.actual_outcome,
          expected_outcome: event.expected_outcome,
          surprise_factor: event.surprise_factor,
          source: event.source || 'system',
          is_future_event: event.is_future_event
        }, {
          onConflict: 'ticker,event_date,event_type'
        })

      if (error) {
        console.error('Error storing market event:', error)
      }
    } catch (error) {
      console.error('Failed to store market event:', error)
    }
  }

  static async storeEarningsEvents(earningsData: EarningsData[]): Promise<void> {
    const events: MarketEvent[] = earningsData.map(earning => {
      const isFuture = new Date(earning.announcement_date) > new Date()

      let impactSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
      if (earning.eps_surprise !== undefined) {
        const absSuprise = Math.abs(earning.eps_surprise)
        if (absSuprise > 20) impactSeverity = 'critical'
        else if (absSuprise > 10) impactSeverity = 'high'
        else if (absSuprise > 5) impactSeverity = 'medium'
        else impactSeverity = 'low'
      }

      return {
        ticker: earning.ticker,
        event_type: 'earnings',
        event_date: earning.announcement_date,
        event_title: `${earning.ticker} ${earning.quarter} ${earning.fiscal_year} Earnings`,
        event_description: earning.eps_actual
          ? `EPS: $${earning.eps_actual} (Est: $${earning.eps_estimate || 'N/A'}), Revenue: $${earning.revenue_actual ? (earning.revenue_actual / 1e9).toFixed(2) + 'B' : 'N/A'}`
          : `Expected EPS: $${earning.eps_estimate || 'N/A'}`,
        impact_severity: impactSeverity,
        actual_outcome: earning.eps_actual ? {
          eps: earning.eps_actual,
          revenue: earning.revenue_actual,
          eps_surprise: earning.eps_surprise,
          revenue_surprise: earning.revenue_surprise
        } : undefined,
        expected_outcome: {
          eps: earning.eps_estimate,
          revenue: earning.revenue_estimate
        },
        surprise_factor: earning.eps_surprise,
        source: 'earnings_api',
        is_future_event: isFuture
      }
    })

    for (const event of events) {
      await this.storeMarketEvent(event)
    }
  }

  static async getMarketEvents(ticker: string, daysAhead: number = 30, daysBack: number = 90): Promise<MarketEvent[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const endDate = new Date()
      endDate.setDate(endDate.getDate() + daysAhead)

      const { data, error } = await supabase
        .from('market_events')
        .select('*')
        .eq('ticker', ticker)
        .gte('event_date', startDate.toISOString())
        .lte('event_date', endDate.toISOString())
        .order('event_date', { ascending: true })

      if (error) {
        console.error('Error fetching market events:', error)
        return []
      }

      return data as MarketEvent[]
    } catch (error) {
      console.error('Failed to get market events:', error)
      return []
    }
  }

  static async getUpcomingEvents(ticker?: string, daysAhead: number = 30): Promise<MarketEvent[]> {
    try {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + daysAhead)

      let query = supabase
        .from('market_events')
        .select('*')
        .eq('is_future_event', true)
        .gte('event_date', new Date().toISOString())
        .lte('event_date', endDate.toISOString())
        .order('event_date', { ascending: true })

      if (ticker) {
        query = query.eq('ticker', ticker)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching upcoming events:', error)
        return []
      }

      return data as MarketEvent[]
    } catch (error) {
      console.error('Failed to get upcoming events:', error)
      return []
    }
  }

  static async getHistoricalEvents(ticker: string, daysBack: number = 90): Promise<MarketEvent[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const { data, error } = await supabase
        .from('market_events')
        .select('*')
        .eq('ticker', ticker)
        .eq('is_future_event', false)
        .gte('event_date', startDate.toISOString())
        .lte('event_date', new Date().toISOString())
        .order('event_date', { ascending: false })

      if (error) {
        console.error('Error fetching historical events:', error)
        return []
      }

      return data as MarketEvent[]
    } catch (error) {
      console.error('Failed to get historical events:', error)
      return []
    }
  }

  static async syncEarningsData(tickers: string[]): Promise<void> {
    console.log('Syncing earnings data for', tickers.length, 'tickers')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 60)

    const earningsData = await this.fetchEarningsCalendar(startDate, endDate)

    const filteredData = earningsData.filter(e => tickers.includes(e.ticker))

    await this.storeEarningsEvents(filteredData)

    console.log(`Synced ${filteredData.length} earnings events`)
  }

  static async markPastEventsAsHistorical(): Promise<void> {
    try {
      const { error } = await supabase
        .from('market_events')
        .update({ is_future_event: false })
        .eq('is_future_event', true)
        .lt('event_date', new Date().toISOString())

      if (error) {
        console.error('Error marking past events:', error)
      }
    } catch (error) {
      console.error('Failed to mark past events:', error)
    }
  }

  static async getEventsByType(eventType: string, daysAhead: number = 30): Promise<MarketEvent[]> {
    try {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + daysAhead)

      const { data, error } = await supabase
        .from('market_events')
        .select('*')
        .eq('event_type', eventType)
        .gte('event_date', new Date().toISOString())
        .lte('event_date', endDate.toISOString())
        .order('event_date', { ascending: true })

      if (error) {
        console.error('Error fetching events by type:', error)
        return []
      }

      return data as MarketEvent[]
    } catch (error) {
      console.error('Failed to get events by type:', error)
      return []
    }
  }

  static async getHighImpactEvents(daysAhead: number = 30): Promise<MarketEvent[]> {
    try {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + daysAhead)

      const { data, error } = await supabase
        .from('market_events')
        .select('*')
        .in('impact_severity', ['high', 'critical'])
        .gte('event_date', new Date().toISOString())
        .lte('event_date', endDate.toISOString())
        .order('event_date', { ascending: true })

      if (error) {
        console.error('Error fetching high impact events:', error)
        return []
      }

      return data as MarketEvent[]
    } catch (error) {
      console.error('Failed to get high impact events:', error)
      return []
    }
  }

  private static generateMockEarnings(startDate: Date, endDate: Date): EarningsData[] {
    const tickers = ['SPY', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META']
    const earnings: EarningsData[] = []

    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      if (Math.random() > 0.7) {
        const ticker = tickers[Math.floor(Math.random() * tickers.length)]
        const eps_estimate = 2 + Math.random() * 3
        const eps_actual = eps_estimate * (0.9 + Math.random() * 0.2)

        earnings.push({
          ticker,
          quarter: `Q${Math.floor(Math.random() * 4) + 1}`,
          fiscal_year: currentDate.getFullYear(),
          eps_actual,
          eps_estimate,
          eps_surprise: ((eps_actual - eps_estimate) / eps_estimate) * 100,
          revenue_actual: (10 + Math.random() * 50) * 1e9,
          revenue_estimate: (10 + Math.random() * 50) * 1e9,
          announcement_date: currentDate.toISOString().split('T')[0]
        })
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return earnings
  }

  static getDaysUntilEvent(eventDate: string): number {
    const now = new Date()
    const event = new Date(eventDate)
    const diffTime = event.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  static getEventImpactColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#dc2626'
      case 'high':
        return '#f97316'
      case 'medium':
        return '#eab308'
      case 'low':
        return '#22c55e'
      default:
        return '#6b7280'
    }
  }
}
