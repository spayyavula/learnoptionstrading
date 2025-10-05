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
        return this.generateMockEventsForTicker(ticker, daysAhead, daysBack)
      }

      // If no events found in database, generate mock events
      if (!data || data.length === 0) {
        console.log(`No events found in database for ${ticker}, generating mock events`)
        return this.generateMockEventsForTicker(ticker, daysAhead, daysBack)
      }

      return data as MarketEvent[]
    } catch (error) {
      console.error('Failed to get market events:', error)
      return this.generateMockEventsForTicker(ticker, daysAhead, daysBack)
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
    const tickers = ['SPY', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'QQQ']
    const earnings: EarningsData[] = []

    // Generate realistic earnings dates for major tickers
    const earningsSchedule = [
      { ticker: 'AAPL', quarter: 'Q4', eps_estimate: 1.89, revenue_estimate: 119.6e9, dayOffset: 7 },
      { ticker: 'AAPL', quarter: 'Q3', eps_estimate: 1.82, revenue_estimate: 117.2e9, dayOffset: -45 },
      { ticker: 'MSFT', quarter: 'Q4', eps_estimate: 2.76, revenue_estimate: 61.4e9, dayOffset: 14 },
      { ticker: 'MSFT', quarter: 'Q3', eps_estimate: 2.65, revenue_estimate: 59.8e9, dayOffset: -38 },
      { ticker: 'GOOGL', quarter: 'Q4', eps_estimate: 1.52, revenue_estimate: 76.5e9, dayOffset: 10 },
      { ticker: 'GOOGL', quarter: 'Q3', eps_estimate: 1.45, revenue_estimate: 74.2e9, dayOffset: -52 },
      { ticker: 'AMZN', quarter: 'Q4', eps_estimate: 1.03, revenue_estimate: 166.2e9, dayOffset: 5 },
      { ticker: 'AMZN', quarter: 'Q3', eps_estimate: 0.98, revenue_estimate: 162.4e9, dayOffset: -60 },
      { ticker: 'TSLA', quarter: 'Q4', eps_estimate: 0.73, revenue_estimate: 25.4e9, dayOffset: 21 },
      { ticker: 'TSLA', quarter: 'Q3', eps_estimate: 0.68, revenue_estimate: 23.8e9, dayOffset: -30 },
      { ticker: 'NVDA', quarter: 'Q4', eps_estimate: 5.28, revenue_estimate: 32.5e9, dayOffset: 18 },
      { ticker: 'NVDA', quarter: 'Q3', eps_estimate: 4.92, revenue_estimate: 30.1e9, dayOffset: -42 },
      { ticker: 'META', quarter: 'Q4', eps_estimate: 4.96, revenue_estimate: 39.2e9, dayOffset: 12 },
      { ticker: 'META', quarter: 'Q3', eps_estimate: 4.82, revenue_estimate: 38.1e9, dayOffset: -48 },
    ]

    const today = new Date()

    earningsSchedule.forEach(schedule => {
      const earningsDate = new Date(today)
      earningsDate.setDate(earningsDate.getDate() + schedule.dayOffset)

      if (earningsDate >= startDate && earningsDate <= endDate) {
        const isFuture = schedule.dayOffset > 0
        const eps_actual = isFuture ? undefined : schedule.eps_estimate * (0.92 + Math.random() * 0.16)
        const revenue_actual = isFuture ? undefined : schedule.revenue_estimate * (0.95 + Math.random() * 0.1)

        earnings.push({
          ticker: schedule.ticker,
          quarter: schedule.quarter,
          fiscal_year: earningsDate.getFullYear(),
          eps_actual,
          eps_estimate: schedule.eps_estimate,
          eps_surprise: eps_actual ? ((eps_actual - schedule.eps_estimate) / schedule.eps_estimate) * 100 : undefined,
          revenue_actual,
          revenue_estimate: schedule.revenue_estimate,
          revenue_surprise: revenue_actual ? ((revenue_actual - schedule.revenue_estimate) / schedule.revenue_estimate) * 100 : undefined,
          announcement_date: earningsDate.toISOString().split('T')[0]
        })
      }
    })

    return earnings
  }

  private static generateMockEventsForTicker(ticker: string, daysAhead: number, daysBack: number): MarketEvent[] {
    const events: MarketEvent[] = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + daysAhead)

    // Generate earnings events
    const earnings = this.generateMockEarnings(startDate, endDate)
    const tickerEarnings = earnings.filter(e => e.ticker === ticker)

    tickerEarnings.forEach(earning => {
      const isFuture = new Date(earning.announcement_date) > new Date()
      let impactSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium'

      if (earning.eps_surprise !== undefined) {
        const absSuprise = Math.abs(earning.eps_surprise)
        if (absSuprise > 20) impactSeverity = 'critical'
        else if (absSuprise > 10) impactSeverity = 'high'
        else if (absSuprise > 5) impactSeverity = 'medium'
        else impactSeverity = 'low'
      }

      events.push({
        ticker: earning.ticker,
        event_type: 'earnings',
        event_date: earning.announcement_date,
        event_title: `${earning.ticker} ${earning.quarter} ${earning.fiscal_year} Earnings`,
        event_description: earning.eps_actual
          ? `EPS: $${earning.eps_actual.toFixed(2)} (Est: $${earning.eps_estimate?.toFixed(2) || 'N/A'}), Revenue: $${earning.revenue_actual ? (earning.revenue_actual / 1e9).toFixed(2) + 'B' : 'N/A'}`
          : `Expected EPS: $${earning.eps_estimate?.toFixed(2) || 'N/A'}, Revenue Est: $${earning.revenue_estimate ? (earning.revenue_estimate / 1e9).toFixed(2) + 'B' : 'N/A'}`,
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
        source: 'mock_data',
        is_future_event: isFuture
      })
    })

    // Add additional event types for major tickers
    const additionalEvents = this.generateAdditionalMockEvents(ticker, startDate, endDate)
    events.push(...additionalEvents)

    return events.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
  }

  private static generateAdditionalMockEvents(ticker: string, startDate: Date, endDate: Date): MarketEvent[] {
    const events: MarketEvent[] = []
    const today = new Date()

    // Product launches and major events for specific companies
    const companyEvents: Record<string, Array<{type: MarketEvent['event_type'], title: string, description: string, dayOffset: number, severity: MarketEvent['impact_severity']}>> = {
      'AAPL': [
        { type: 'product_launch', title: 'iPhone 16 Launch Event', description: 'Annual iPhone and product announcement', dayOffset: -15, severity: 'high' },
        { type: 'product_launch', title: 'WWDC 2025', description: 'Worldwide Developers Conference', dayOffset: 25, severity: 'medium' },
      ],
      'TSLA': [
        { type: 'product_launch', title: 'Model 2 Unveiling', description: 'Next-generation affordable EV reveal', dayOffset: 35, severity: 'critical' },
        { type: 'guidance_update', title: 'Production Update', description: 'Q4 vehicle delivery numbers', dayOffset: -5, severity: 'high' },
      ],
      'NVDA': [
        { type: 'product_launch', title: 'RTX 5000 Series Launch', description: 'Next-gen GPU announcement', dayOffset: 20, severity: 'high' },
        { type: 'regulatory', title: 'AI Export Restrictions Review', description: 'US Commerce Department review of China exports', dayOffset: 15, severity: 'medium' },
      ],
      'META': [
        { type: 'regulatory', title: 'EU Privacy Compliance Deadline', description: 'GDPR compliance review deadline', dayOffset: 12, severity: 'medium' },
        { type: 'product_launch', title: 'Meta Quest 4 Reveal', description: 'New VR headset announcement', dayOffset: 30, severity: 'medium' },
      ],
      'AMZN': [
        { type: 'other', title: 'Prime Day 2025', description: 'Annual Prime member shopping event', dayOffset: 45, severity: 'high' },
        { type: 'guidance_update', title: 'AWS Growth Update', description: 'Cloud services revenue update', dayOffset: -8, severity: 'medium' },
      ],
      'MSFT': [
        { type: 'product_launch', title: 'Windows 12 Preview', description: 'Next Windows OS preview release', dayOffset: 28, severity: 'medium' },
        { type: 'other', title: 'Azure AI Expansion', description: 'New AI datacenter announcements', dayOffset: 22, severity: 'high' },
      ],
      'GOOGL': [
        { type: 'product_launch', title: 'Pixel 10 Launch', description: 'New Pixel phone and hardware event', dayOffset: 18, severity: 'medium' },
        { type: 'regulatory', title: 'Antitrust Hearing', description: 'DOJ antitrust case proceedings', dayOffset: 10, severity: 'high' },
      ],
    }

    const tickerEvents = companyEvents[ticker] || []

    tickerEvents.forEach(event => {
      const eventDate = new Date(today)
      eventDate.setDate(eventDate.getDate() + event.dayOffset)

      if (eventDate >= startDate && eventDate <= endDate) {
        events.push({
          ticker,
          event_type: event.type,
          event_date: eventDate.toISOString().split('T')[0],
          event_title: event.title,
          event_description: event.description,
          impact_severity: event.severity,
          source: 'mock_data',
          is_future_event: event.dayOffset > 0
        })
      }
    })

    // Add dividend events for established companies
    if (['AAPL', 'MSFT', 'GOOGL', 'META'].includes(ticker)) {
      const dividendDate = new Date(today)
      dividendDate.setDate(dividendDate.getDate() + 40)

      if (dividendDate >= startDate && dividendDate <= endDate) {
        events.push({
          ticker,
          event_type: 'dividend',
          event_date: dividendDate.toISOString().split('T')[0],
          event_title: `${ticker} Quarterly Dividend`,
          event_description: 'Ex-dividend date for quarterly dividend payment',
          impact_severity: 'low',
          source: 'mock_data',
          is_future_event: true
        })
      }
    }

    return events
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
