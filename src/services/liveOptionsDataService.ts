import { supabase } from '../supabaseClient'

export interface LiveOptionsContract {
  contract_ticker: string
  underlying_ticker: string
  contract_type: 'call' | 'put'
  strike_price: number
  expiration_date: string
  bid: number
  ask: number
  last: number
  mark: number
  volume: number
  open_interest: number
  implied_volatility: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  intrinsic_value: number
  time_value: number
  bid_ask_spread: number
  last_trade_timestamp?: string
}

export interface LiquidTicker {
  ticker: string
  name: string
  sector?: string
  current_price?: number
  avg_daily_volume: number
  avg_open_interest: number
  is_active: boolean
  last_update: string
}

export interface OptionsExpiry {
  expiration_date: string
  underlying_ticker: string
  expiry_type: '0DTE' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'LEAPS'
  days_to_expiry: number
  business_days_to_expiry?: number
  total_call_volume: number
  total_put_volume: number
  total_call_open_interest: number
  total_put_open_interest: number
}

const POLYGON_API_KEY = import.meta.env.VITE_POLYGON_API_KEY

export class LiveOptionsDataService {
  private static instance: LiveOptionsDataService
  private wsConnection: WebSocket | null = null
  private subscribedTickers: Set<string> = new Set()

  private constructor() {}

  static getInstance(): LiveOptionsDataService {
    if (!LiveOptionsDataService.instance) {
      LiveOptionsDataService.instance = new LiveOptionsDataService()
    }
    return LiveOptionsDataService.instance
  }

  async fetchLiquidTickers(): Promise<LiquidTicker[]> {
    const { data, error } = await supabase
      .from('liquid_tickers')
      .select('*')
      .eq('is_active', true)
      .order('ticker')

    if (error) {
      console.error('Error fetching liquid tickers:', error)
      return []
    }

    return data || []
  }

  async updateTickerPrice(ticker: string, price: number): Promise<void> {
    const { error } = await supabase
      .from('liquid_tickers')
      .update({
        current_price: price,
        last_update: new Date().toISOString()
      })
      .eq('ticker', ticker)

    if (error) {
      console.error(`Error updating price for ${ticker}:`, error)
    }
  }

  async fetchOptionsContractsFromPolygon(ticker: string): Promise<any[]> {
    if (!POLYGON_API_KEY) {
      console.warn('Polygon API key not configured')
      return []
    }

    try {
      const contracts: any[] = []
      let url = `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${ticker}&limit=1000&apiKey=${POLYGON_API_KEY}`

      while (url) {
        const response = await fetch(url)
        const data = await response.json()

        if (data.results) {
          contracts.push(...data.results)
        }

        url = data.next_url ? `${data.next_url}&apiKey=${POLYGON_API_KEY}` : ''

        if (contracts.length > 10000) break
      }

      return contracts
    } catch (error) {
      console.error(`Error fetching contracts for ${ticker}:`, error)
      return []
    }
  }

  async fetchOptionsSnapshot(ticker: string): Promise<any[]> {
    if (!POLYGON_API_KEY) {
      console.warn('Polygon API key not configured')
      return []
    }

    try {
      const response = await fetch(
        `https://api.polygon.io/v3/snapshot/options/${ticker}?apiKey=${POLYGON_API_KEY}`
      )
      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error(`Error fetching snapshot for ${ticker}:`, error)
      return []
    }
  }

  async syncOptionsDataForTicker(ticker: string): Promise<number> {
    console.log(`Starting sync for ${ticker}...`)

    const [contracts, snapshots] = await Promise.all([
      this.fetchOptionsContractsFromPolygon(ticker),
      this.fetchOptionsSnapshot(ticker)
    ])

    const snapshotMap = new Map<string, any>()
    snapshots.forEach(snap => {
      if (snap.details?.ticker) {
        snapshotMap.set(snap.details.ticker, snap)
      }
    })

    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

    const liveContracts: LiveOptionsContract[] = []
    const expiriesSet = new Set<string>()

    for (const contract of contracts) {
      const expiryDate = new Date(contract.expiration_date)
      if (expiryDate > threeMonthsFromNow) continue

      const snapshot = snapshotMap.get(contract.ticker)
      const underlyingPrice = snapshot?.underlying_asset?.price || 0

      const strikePrice = contract.strike_price
      const intrinsicValue = contract.contract_type === 'call'
        ? Math.max(0, underlyingPrice - strikePrice)
        : Math.max(0, strikePrice - underlyingPrice)

      const lastPrice = snapshot?.last_trade?.price || 0
      const timeValue = Math.max(0, lastPrice - intrinsicValue)
      const bid = snapshot?.last_quote?.bid || 0
      const ask = snapshot?.last_quote?.ask || 0

      liveContracts.push({
        contract_ticker: contract.ticker,
        underlying_ticker: ticker,
        contract_type: contract.contract_type,
        strike_price: strikePrice,
        expiration_date: contract.expiration_date,
        bid,
        ask,
        last: lastPrice,
        mark: bid && ask ? (bid + ask) / 2 : lastPrice,
        volume: snapshot?.day?.volume || 0,
        open_interest: snapshot?.open_interest || 0,
        implied_volatility: snapshot?.implied_volatility || 0,
        delta: snapshot?.greeks?.delta || 0,
        gamma: snapshot?.greeks?.gamma || 0,
        theta: snapshot?.greeks?.theta || 0,
        vega: snapshot?.greeks?.vega || 0,
        rho: snapshot?.greeks?.rho || 0,
        intrinsic_value: intrinsicValue,
        time_value: timeValue,
        bid_ask_spread: ask - bid,
        last_trade_timestamp: snapshot?.last_trade?.sip_timestamp
          ? new Date(snapshot.last_trade.sip_timestamp / 1000000).toISOString()
          : undefined
      })

      expiriesSet.add(contract.expiration_date)
    }

    if (liveContracts.length > 0) {
      await this.batchUpsertContracts(liveContracts)
      await this.syncExpiries(ticker, Array.from(expiriesSet))
    }

    console.log(`Synced ${liveContracts.length} contracts for ${ticker}`)
    return liveContracts.length
  }

  private async batchUpsertContracts(contracts: LiveOptionsContract[]): Promise<void> {
    const batchSize = 500
    for (let i = 0; i < contracts.length; i += batchSize) {
      const batch = contracts.slice(i, i + batchSize)

      const { error } = await supabase
        .from('options_contracts_live')
        .upsert(batch, {
          onConflict: 'contract_ticker',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error upserting contracts batch:', error)
      }
    }
  }

  private async syncExpiries(ticker: string, expiryDates: string[]): Promise<void> {
    const expiries: Partial<OptionsExpiry>[] = []

    for (const expiryDate of expiryDates) {
      const daysToExpiry = Math.ceil(
        (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      const { data: volumeData } = await supabase
        .from('options_contracts_live')
        .select('contract_type, volume, open_interest')
        .eq('underlying_ticker', ticker)
        .eq('expiration_date', expiryDate)

      let callVolume = 0, putVolume = 0, callOI = 0, putOI = 0

      volumeData?.forEach(row => {
        if (row.contract_type === 'call') {
          callVolume += row.volume || 0
          callOI += row.open_interest || 0
        } else {
          putVolume += row.volume || 0
          putOI += row.open_interest || 0
        }
      })

      const expiryType = await this.categorizeExpiry(expiryDate, ticker)

      expiries.push({
        expiration_date: expiryDate,
        underlying_ticker: ticker,
        expiry_type: expiryType,
        days_to_expiry: daysToExpiry,
        total_call_volume: callVolume,
        total_put_volume: putVolume,
        total_call_open_interest: callOI,
        total_put_open_interest: putOI
      })
    }

    if (expiries.length > 0) {
      const { error } = await supabase
        .from('options_expiries')
        .upsert(expiries, {
          onConflict: 'expiration_date,underlying_ticker',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error syncing expiries:', error)
      }
    }
  }

  private async categorizeExpiry(
    expiryDate: string,
    ticker: string
  ): Promise<'0DTE' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'LEAPS'> {
    const { data, error } = await supabase
      .rpc('categorize_expiry_type', {
        expiry_date: expiryDate,
        underlying: ticker
      })

    if (error || !data) {
      const daysDiff = Math.ceil(
        (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === 0) return '0DTE'
      if (daysDiff <= 3) return 'Daily'
      if (daysDiff <= 7) return 'Weekly'
      if (daysDiff <= 45) return 'Monthly'
      if (daysDiff <= 120) return 'Quarterly'
      return 'LEAPS'
    }

    return data
  }

  async fetchOptionsForTicker(
    ticker: string,
    expiryDate?: string,
    expiryType?: string
  ): Promise<LiveOptionsContract[]> {
    let query = supabase
      .from('options_contracts_live')
      .select('*')
      .eq('underlying_ticker', ticker)
      .order('strike_price')

    if (expiryDate) {
      query = query.eq('expiration_date', expiryDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching options:', error)
      return []
    }

    if (expiryType && !expiryDate) {
      const { data: expiries } = await supabase
        .from('options_expiries')
        .select('expiration_date')
        .eq('underlying_ticker', ticker)
        .eq('expiry_type', expiryType)

      if (expiries && expiries.length > 0) {
        const expiryDates = expiries.map(e => e.expiration_date)
        return (data || []).filter(contract =>
          expiryDates.includes(contract.expiration_date)
        )
      }
    }

    return data || []
  }

  async fetchExpiriesForTicker(
    ticker: string,
    expiryType?: string
  ): Promise<OptionsExpiry[]> {
    let query = supabase
      .from('options_expiries')
      .select('*')
      .eq('underlying_ticker', ticker)
      .order('expiration_date')

    if (expiryType) {
      query = query.eq('expiry_type', expiryType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching expiries:', error)
      return []
    }

    return data || []
  }

  connectWebSocket(tickers: string[], onMessage: (data: any) => void): void {
    if (!POLYGON_API_KEY) {
      console.warn('Cannot connect WebSocket: Polygon API key not configured')
      return
    }

    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.subscribeToTickers(tickers)
      return
    }

    this.wsConnection = new WebSocket('wss://socket.polygon.io/options')

    this.wsConnection.onopen = () => {
      console.log('WebSocket connected')
      this.wsConnection?.send(JSON.stringify({
        action: 'auth',
        params: POLYGON_API_KEY
      }))
      this.subscribeToTickers(tickers)
    }

    this.wsConnection.onmessage = (event) => {
      try {
        const messages = JSON.parse(event.data)
        if (Array.isArray(messages)) {
          messages.forEach(msg => {
            if (msg.ev === 'Q' || msg.ev === 'T') {
              onMessage(msg)
            }
          })
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.wsConnection.onclose = () => {
      console.log('WebSocket disconnected')
      this.wsConnection = null
      this.subscribedTickers.clear()
    }
  }

  private subscribeToTickers(tickers: string[]): void {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      return
    }

    const newTickers = tickers.filter(t => !this.subscribedTickers.has(t))

    if (newTickers.length > 0) {
      newTickers.forEach(ticker => {
        this.wsConnection?.send(JSON.stringify({
          action: 'subscribe',
          params: `Q.${ticker}.*,T.${ticker}.*`
        }))
        this.subscribedTickers.add(ticker)
      })
      console.log(`Subscribed to: ${newTickers.join(', ')}`)
    }
  }

  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = null
      this.subscribedTickers.clear()
      console.log('WebSocket disconnected')
    }
  }

  async getUnderlyingPrice(ticker: string): Promise<number | null> {
    if (!POLYGON_API_KEY) {
      return null
    }

    try {
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
      )
      const data = await response.json()
      return data.results?.[0]?.c || null
    } catch (error) {
      console.error(`Error fetching price for ${ticker}:`, error)
      return null
    }
  }
}

export const liveOptionsDataService = LiveOptionsDataService.getInstance()
