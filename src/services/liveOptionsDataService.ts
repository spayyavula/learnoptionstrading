import { supabase } from '../lib/supabase'
import { isContractExpired } from './optionsChainGenerator'

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

export interface DataServiceStatus {
  hasApiKey: boolean
  isConfigured: boolean
  message: string
}

export class LiveOptionsDataService {
  private static instance: LiveOptionsDataService
  private wsConnection: WebSocket | null = null
  private subscribedTickers: Set<string> = new Set()

  private constructor() {
    this.logApiKeyStatus()
  }

  private logApiKeyStatus(): void {
    console.log('=== Polygon API Key Detection ===')
    console.log('Raw API Key Value:', POLYGON_API_KEY ? this.maskApiKey(POLYGON_API_KEY) : 'undefined')
    console.log('API Key Type:', typeof POLYGON_API_KEY)
    console.log('API Key Length:', POLYGON_API_KEY?.length || 0)

    const checks = {
      'Key exists': !!POLYGON_API_KEY,
      'Not empty after trim': POLYGON_API_KEY?.trim() !== '',
      'Not "demo_api_key"': POLYGON_API_KEY !== 'demo_api_key',
      'Not "undefined" string': POLYGON_API_KEY !== 'undefined',
      'Not "null" string': POLYGON_API_KEY !== 'null',
      'Not "YOUR_POLYGON_API_KEY_HERE"': POLYGON_API_KEY !== 'YOUR_POLYGON_API_KEY_HERE'
    }

    console.log('Validation Checks:')
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✓' : '✗'} ${check}`)
    })

    const hasApiKey = Object.values(checks).every(v => v)
    console.log(`Final Status: ${hasApiKey ? '✓ API Key Valid' : '✗ API Key Invalid'}`)
    console.log('=================================')
  }

  private maskApiKey(key: string): string {
    if (!key || key.length < 8) return '***'
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
  }

  getStatus(): DataServiceStatus {
    const hasApiKey = !!POLYGON_API_KEY &&
                      POLYGON_API_KEY.trim() !== '' &&
                      POLYGON_API_KEY !== 'demo_api_key' &&
                      POLYGON_API_KEY !== 'undefined' &&
                      POLYGON_API_KEY !== 'null' &&
                      POLYGON_API_KEY !== 'YOUR_POLYGON_API_KEY_HERE'

    if (import.meta.env.DEV) {
      console.log(`[LiveOptionsDataService] API Key Status: ${hasApiKey ? 'VALID ✓' : 'INVALID ✗'}`)
    }

    return {
      hasApiKey,
      isConfigured: hasApiKey,
      message: hasApiKey
        ? 'Polygon API configured - Live data available'
        : 'No API key configured. Add VITE_POLYGON_API_KEY to your .env file to enable live data sync from Polygon.io'
    }
  }

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
      return this.getMockLiquidTickers()
    }

    if (!data || data.length === 0) {
      return this.getMockLiquidTickers()
    }

    return data || []
  }

  private getMockLiquidTickers(): LiquidTicker[] {
    return [
      { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'ETF', current_price: 550.0, avg_daily_volume: 50000000, avg_open_interest: 5000000, is_active: true, last_update: new Date().toISOString() },
      { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', current_price: 175.0, avg_daily_volume: 30000000, avg_open_interest: 2000000, is_active: true, last_update: new Date().toISOString() },
      { ticker: 'TSLA', name: 'Tesla, Inc.', sector: 'Automotive', current_price: 250.0, avg_daily_volume: 45000000, avg_open_interest: 3000000, is_active: true, last_update: new Date().toISOString() }
    ]
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
      return this.generateMockOptionsData(ticker, expiryDate)
    }

    if (!data || data.length === 0) {
      return this.generateMockOptionsData(ticker, expiryDate)
    }

    let filteredData = (data || []).filter(contract => !isContractExpired(contract.expiration_date))

    if (expiryType && !expiryDate) {
      const { data: expiries } = await supabase
        .from('options_expiries')
        .select('expiration_date')
        .eq('underlying_ticker', ticker)
        .eq('expiry_type', expiryType)

      if (expiries && expiries.length > 0) {
        const expiryDates = expiries.map(e => e.expiration_date)
        filteredData = filteredData.filter(contract =>
          expiryDates.includes(contract.expiration_date)
        )
      }
    }

    return filteredData
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
      return this.generateMockExpiries(ticker)
    }

    if (!data || data.length === 0) {
      return this.generateMockExpiries(ticker)
    }

    return (data || []).filter(expiry => !isContractExpired(expiry.expiration_date))
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
    const { data } = await supabase
      .from('liquid_tickers')
      .select('current_price')
      .eq('ticker', ticker)
      .maybeSingle()

    if (data?.current_price) {
      return data.current_price
    }

    if (!POLYGON_API_KEY) {
      return this.getMockPrice(ticker)
    }

    try {
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
      )
      const data = await response.json()
      const price = data.results?.[0]?.c || null
      if (price) {
        await this.updateTickerPrice(ticker, price)
      }
      return price
    } catch (error) {
      console.error(`Error fetching price for ${ticker}:`, error)
      return this.getMockPrice(ticker)
    }
  }

  private getMockPrice(ticker: string): number {
    const mockPrices: Record<string, number> = {
      'SPY': 550.0,
      'AAPL': 175.0,
      'TSLA': 250.0,
      'MSFT': 380.0,
      'NVDA': 500.0,
      'AMZN': 145.0,
      'GOOGL': 140.0,
      'META': 485.0,
      'QQQ': 450.0,
      'IWM': 200.0,
      'DIA': 385.0
    }
    return mockPrices[ticker] || 100.0
  }

  private generateMockExpiries(ticker: string): OptionsExpiry[] {
    const today = new Date()
    const expiries: OptionsExpiry[] = []

    const addDays = (date: Date, days: number) => {
      const result = new Date(date)
      result.setDate(result.getDate() + days)
      return result
    }

    const expiryConfigs = [
      { days: 7, type: 'Weekly' as const },
      { days: 14, type: 'Weekly' as const },
      { days: 21, type: 'Weekly' as const },
      { days: 30, type: 'Monthly' as const }
    ]

    expiryConfigs.forEach(config => {
      const expiryDate = addDays(today, config.days)
      expiries.push({
        expiration_date: expiryDate.toISOString().split('T')[0],
        underlying_ticker: ticker,
        expiry_type: config.type,
        days_to_expiry: config.days,
        total_call_volume: Math.floor(Math.random() * 50000) + 10000,
        total_put_volume: Math.floor(Math.random() * 50000) + 10000,
        total_call_open_interest: Math.floor(Math.random() * 100000) + 20000,
        total_put_open_interest: Math.floor(Math.random() * 100000) + 20000
      })
    })

    return expiries
  }

  private generateMockOptionsData(ticker: string, expiryDate?: string): LiveOptionsContract[] {
    const underlyingPrice = this.getMockPrice(ticker)
    const contracts: LiveOptionsContract[] = []

    const expiry = expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const strikeRange = 15
    const strikeStep = underlyingPrice < 100 ? 5 : (underlyingPrice < 300 ? 10 : 25)
    const baseStrike = Math.floor(underlyingPrice / strikeStep) * strikeStep

    for (let i = -strikeRange; i <= strikeRange; i++) {
      const strike = baseStrike + (i * strikeStep)

      const callITM = strike < underlyingPrice
      const putITM = strike > underlyingPrice

      const callIntrinsic = Math.max(0, underlyingPrice - strike)
      const putIntrinsic = Math.max(0, strike - underlyingPrice)

      const callTimeValue = Math.max(1, strike * 0.02 * Math.abs(i) / 10)
      const putTimeValue = Math.max(1, strike * 0.02 * Math.abs(i) / 10)

      const callPrice = callIntrinsic + callTimeValue
      const putPrice = putIntrinsic + putTimeValue

      const callVolume = callITM ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 2000) + 100
      const putVolume = putITM ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 2000) + 100

      contracts.push({
        contract_ticker: `O:${ticker}${expiry.replace(/-/g, '')}C${strike.toFixed(0).padStart(8, '0')}`,
        underlying_ticker: ticker,
        contract_type: 'call',
        strike_price: strike,
        expiration_date: expiry,
        bid: callPrice * 0.98,
        ask: callPrice * 1.02,
        last: callPrice,
        mark: callPrice,
        volume: callVolume,
        open_interest: callVolume * 3,
        implied_volatility: 0.15 + (Math.abs(i) * 0.01),
        delta: callITM ? 0.5 + (i * 0.03) : 0.5 + (i * 0.03),
        gamma: 0.01,
        theta: -0.05,
        vega: 0.1,
        rho: 0.01,
        intrinsic_value: callIntrinsic,
        time_value: callTimeValue,
        bid_ask_spread: callPrice * 0.04
      })

      contracts.push({
        contract_ticker: `O:${ticker}${expiry.replace(/-/g, '')}P${strike.toFixed(0).padStart(8, '0')}`,
        underlying_ticker: ticker,
        contract_type: 'put',
        strike_price: strike,
        expiration_date: expiry,
        bid: putPrice * 0.98,
        ask: putPrice * 1.02,
        last: putPrice,
        mark: putPrice,
        volume: putVolume,
        open_interest: putVolume * 3,
        implied_volatility: 0.15 + (Math.abs(i) * 0.01),
        delta: putITM ? -0.5 - (i * 0.03) : -0.5 - (i * 0.03),
        gamma: 0.01,
        theta: -0.05,
        vega: 0.1,
        rho: -0.01,
        intrinsic_value: putIntrinsic,
        time_value: putTimeValue,
        bid_ask_spread: putPrice * 0.04
      })
    }

    return contracts
  }
}

export const liveOptionsDataService = LiveOptionsDataService.getInstance()
