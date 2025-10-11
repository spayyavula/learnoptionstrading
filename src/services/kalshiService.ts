import { supabase } from '../lib/supabase'

const KALSHI_API_BASE_URL = 'https://trading-api.kalshi.com/trade-api/v2'
const KALSHI_DEMO_API_BASE_URL = 'https://demo-api.kalshi.co/trade-api/v2'

export interface KalshiCredentials {
  id: string
  user_id: string
  api_key_encrypted: string
  encryption_iv: string
  environment: 'live' | 'demo'
  is_active: boolean
  last_validated_at?: string
  created_at: string
  updated_at: string
}

export interface KalshiAccount {
  member_id: string
  balance: number
  available_balance: number
  portfolio_value: number
}

export interface PredictionMarket {
  ticker: string
  title: string
  category?: string
  series_ticker?: string
  event_ticker?: string
  description?: string
  status: 'active' | 'closed' | 'settled' | 'expired'
  yes_bid?: number
  yes_ask?: number
  yes_price?: number
  no_bid?: number
  no_ask?: number
  no_price?: number
  volume?: number
  open_interest?: number
  open_time?: string
  close_time?: string
  expiration_time?: string
  settlement_value?: number
  settlement_date?: string
  floor_strike?: number
  cap_strike?: number
  metadata?: any
}

export interface PredictionMarketPosition {
  id: string
  user_id: string
  market_ticker: string
  position_side: 'yes' | 'no'
  quantity: number
  average_price: number
  total_cost: number
  current_value?: number
  unrealized_pnl?: number
  realized_pnl: number
}

export interface PredictionMarketOrder {
  market_ticker: string
  order_type: 'market' | 'limit'
  side: 'yes' | 'no'
  action: 'buy' | 'sell'
  quantity: number
  limit_price?: number
  time_in_force?: 'gtc' | 'ioc' | 'fok'
  client_order_id?: string
}

export interface PredictionMarketOrderResponse {
  id: string
  kalshi_order_id?: string
  market_ticker: string
  order_type: string
  side: string
  action: string
  quantity: number
  limit_price?: number
  filled_quantity: number
  remaining_quantity: number
  average_fill_price?: number
  status: string
  submitted_at: string
}

export interface MarketSeries {
  series_ticker: string
  title: string
  category?: string
  description?: string
  frequency?: string
  tags?: string[]
}

export class KalshiService {
  private static tokenCache = new Map<string, { token: string; expires_at: number }>()

  // =====================================================
  // Credential Management
  // =====================================================

  private static async getCredentials(userId: string, environment: 'live' | 'demo'): Promise<KalshiCredentials | null> {
    const { data, error } = await supabase
      .from('kalshi_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('environment', environment)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error fetching Kalshi credentials:', error)
      return null
    }

    return data
  }

  private static async decryptApiKey(encrypted: string, iv: string): Promise<string> {
    try {
      const cryptoKey = import.meta.env.VITE_ENCRYPTION_KEY
      if (!cryptoKey) {
        throw new Error('Encryption key not found in environment')
      }

      const encoder = new TextEncoder()
      const keyData = encoder.encode(cryptoKey.padEnd(32, '0').substring(0, 32))

      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      )

      const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0))
      const encryptedBuffer = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        key,
        encryptedBuffer
      )

      return new TextDecoder().decode(decrypted)
    } catch (error) {
      console.error('Error decrypting API key:', error)
      throw error
    }
  }

  private static async encryptApiKey(apiKey: string): Promise<{ encrypted: string; iv: string }> {
    const cryptoKey = import.meta.env.VITE_ENCRYPTION_KEY || 'default-encryption-key-change-in-production'

    const encoder = new TextEncoder()
    const keyData = encoder.encode(cryptoKey.padEnd(32, '0').substring(0, 32))

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    )

    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(apiKey)
    )

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
      iv: btoa(String.fromCharCode(...iv))
    }
  }

  static async saveCredentials(
    userId: string,
    apiKey: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<boolean> {
    try {
      const encrypted = await this.encryptApiKey(apiKey)

      const { error } = await supabase
        .from('kalshi_credentials')
        .upsert({
          user_id: userId,
          api_key_encrypted: encrypted.encrypted,
          encryption_iv: encrypted.iv,
          environment,
          is_active: true
        }, {
          onConflict: 'user_id,environment'
        })

      if (error) throw error

      await this.logActivity(userId, 'credentials_saved', environment, {
        action: 'Kalshi credentials saved'
      })

      return true
    } catch (error) {
      console.error('Error saving Kalshi credentials:', error)
      return false
    }
  }

  static async deleteCredentials(userId: string, environment: 'live' | 'demo'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('kalshi_credentials')
        .delete()
        .eq('user_id', userId)
        .eq('environment', environment)

      if (error) throw error

      // Clear token cache
      this.tokenCache.delete(`${userId}:${environment}`)

      await this.logActivity(userId, 'credentials_deleted', environment, {
        action: 'Kalshi credentials deleted'
      })

      return true
    } catch (error) {
      console.error('Error deleting credentials:', error)
      return false
    }
  }

  // =====================================================
  // Authentication
  // =====================================================

  private static async getAuthToken(userId: string, environment: 'live' | 'demo'): Promise<string> {
    const cacheKey = `${userId}:${environment}`
    const cached = this.tokenCache.get(cacheKey)

    // Check if we have a valid cached token (with 5 minute buffer)
    if (cached && cached.expires_at > Date.now() + 5 * 60 * 1000) {
      return cached.token
    }

    // Get new token
    const credentials = await this.getCredentials(userId, environment)
    if (!credentials) {
      throw new Error('Kalshi credentials not found')
    }

    const apiKey = await this.decryptApiKey(credentials.api_key_encrypted, credentials.encryption_iv)
    const baseUrl = environment === 'demo' ? KALSHI_DEMO_API_BASE_URL : KALSHI_API_BASE_URL

    const response = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: apiKey.split(':')[0], // Assuming format email:password or similar
        password: apiKey.split(':')[1]
      })
    })

    if (!response.ok) {
      throw new Error(`Kalshi authentication failed: ${response.status}`)
    }

    const data = await response.json()
    const token = data.token

    // Cache token (expires in 30 minutes per Kalshi docs)
    this.tokenCache.set(cacheKey, {
      token,
      expires_at: Date.now() + 29 * 60 * 1000 // 29 minutes to be safe
    })

    return token
  }

  private static async makeRequest(
    userId: string,
    environment: 'live' | 'demo',
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    const token = await this.getAuthToken(userId, environment)
    const baseUrl = environment === 'demo' ? KALSHI_DEMO_API_BASE_URL : KALSHI_API_BASE_URL
    const url = `${baseUrl}${endpoint}`

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const options: RequestInit = {
      method,
      headers
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Kalshi API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // =====================================================
  // Account Management
  // =====================================================

  static async getAccount(userId: string, environment: 'live' | 'demo'): Promise<KalshiAccount> {
    const data = await this.makeRequest(userId, environment, '/portfolio/balance')

    const account: KalshiAccount = {
      member_id: data.member_id || userId,
      balance: parseFloat(data.balance || '0'),
      available_balance: parseFloat(data.available_balance || data.balance || '0'),
      portfolio_value: parseFloat(data.portfolio_value || '0')
    }

    // Sync to database
    await supabase
      .from('kalshi_account_info')
      .upsert({
        user_id: userId,
        member_id: account.member_id,
        balance: account.balance,
        available_balance: account.available_balance,
        portfolio_value: account.portfolio_value,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    return account
  }

  static async validateCredentials(userId: string, environment: 'live' | 'demo'): Promise<boolean> {
    try {
      await this.getAccount(userId, environment)

      await supabase
        .from('kalshi_credentials')
        .update({ last_validated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('environment', environment)

      return true
    } catch (error) {
      console.error('Credential validation failed:', error)
      return false
    }
  }

  // =====================================================
  // Market Data
  // =====================================================

  static async getMarkets(
    userId: string,
    environment: 'live' | 'demo',
    filters?: {
      status?: string
      series_ticker?: string
      event_ticker?: string
      category?: string
      limit?: number
      cursor?: string
    }
  ): Promise<{ markets: PredictionMarket[]; cursor?: string }> {
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.series_ticker) params.append('series_ticker', filters.series_ticker)
    if (filters?.event_ticker) params.append('event_ticker', filters.event_ticker)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.cursor) params.append('cursor', filters.cursor)

    const endpoint = `/markets${params.toString() ? '?' + params.toString() : ''}`
    const data = await this.makeRequest(userId, environment, endpoint)

    const markets: PredictionMarket[] = (data.markets || []).map((m: any) => ({
      ticker: m.ticker,
      title: m.title,
      category: m.category,
      series_ticker: m.series_ticker,
      event_ticker: m.event_ticker,
      description: m.description,
      status: m.status,
      yes_bid: m.yes_bid ? parseFloat(m.yes_bid) / 100 : undefined,
      yes_ask: m.yes_ask ? parseFloat(m.yes_ask) / 100 : undefined,
      yes_price: m.yes_price ? parseFloat(m.yes_price) / 100 : undefined,
      no_bid: m.no_bid ? parseFloat(m.no_bid) / 100 : undefined,
      no_ask: m.no_ask ? parseFloat(m.no_ask) / 100 : undefined,
      no_price: m.no_price ? parseFloat(m.no_price) / 100 : undefined,
      volume: m.volume,
      open_interest: m.open_interest,
      open_time: m.open_time,
      close_time: m.close_time,
      expiration_time: m.expiration_time,
      settlement_value: m.settlement_value,
      settlement_date: m.settlement_date,
      floor_strike: m.floor_strike,
      cap_strike: m.cap_strike,
      metadata: m
    }))

    // Sync markets to database
    for (const market of markets) {
      await supabase
        .from('prediction_markets')
        .upsert({
          market_ticker: market.ticker,
          market_title: market.title,
          market_category: market.category,
          series_ticker: market.series_ticker,
          event_ticker: market.event_ticker,
          description: market.description,
          status: market.status,
          yes_bid: market.yes_bid,
          yes_ask: market.yes_ask,
          yes_price: market.yes_price,
          no_bid: market.no_bid,
          no_ask: market.no_ask,
          no_price: market.no_price,
          volume: market.volume,
          open_interest: market.open_interest,
          open_time: market.open_time,
          close_time: market.close_time,
          expiration_time: market.expiration_time,
          settlement_value: market.settlement_value,
          settlement_date: market.settlement_date,
          floor_strike: market.floor_strike,
          cap_strike: market.cap_strike,
          metadata: market.metadata,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'market_ticker'
        })
    }

    return {
      markets,
      cursor: data.cursor
    }
  }

  static async getMarket(
    userId: string,
    environment: 'live' | 'demo',
    ticker: string
  ): Promise<PredictionMarket> {
    const data = await this.makeRequest(userId, environment, `/markets/${ticker}`)

    const market: PredictionMarket = {
      ticker: data.ticker,
      title: data.title,
      category: data.category,
      series_ticker: data.series_ticker,
      event_ticker: data.event_ticker,
      description: data.description,
      status: data.status,
      yes_bid: data.yes_bid ? parseFloat(data.yes_bid) / 100 : undefined,
      yes_ask: data.yes_ask ? parseFloat(data.yes_ask) / 100 : undefined,
      yes_price: data.yes_price ? parseFloat(data.yes_price) / 100 : undefined,
      no_bid: data.no_bid ? parseFloat(data.no_bid) / 100 : undefined,
      no_ask: data.no_ask ? parseFloat(data.no_ask) / 100 : undefined,
      no_price: data.no_price ? parseFloat(data.no_price) / 100 : undefined,
      volume: data.volume,
      open_interest: data.open_interest,
      open_time: data.open_time,
      close_time: data.close_time,
      expiration_time: data.expiration_time,
      settlement_value: data.settlement_value,
      settlement_date: data.settlement_date,
      floor_strike: data.floor_strike,
      cap_strike: data.cap_strike,
      metadata: data
    }

    // Sync to database
    await supabase
      .from('prediction_markets')
      .upsert({
        market_ticker: market.ticker,
        market_title: market.title,
        market_category: market.category,
        series_ticker: market.series_ticker,
        event_ticker: market.event_ticker,
        description: market.description,
        status: market.status,
        yes_bid: market.yes_bid,
        yes_ask: market.yes_ask,
        yes_price: market.yes_price,
        no_bid: market.no_bid,
        no_ask: market.no_ask,
        no_price: market.no_price,
        volume: market.volume,
        open_interest: market.open_interest,
        open_time: market.open_time,
        close_time: market.close_time,
        expiration_time: market.expiration_time,
        settlement_value: market.settlement_value,
        settlement_date: market.settlement_date,
        floor_strike: market.floor_strike,
        cap_strike: market.cap_strike,
        metadata: market.metadata,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'market_ticker'
      })

    return market
  }

  static async getMarketOrderbook(
    userId: string,
    environment: 'live' | 'demo',
    ticker: string
  ): Promise<any> {
    return this.makeRequest(userId, environment, `/markets/${ticker}/orderbook`)
  }

  static async getSeries(
    userId: string,
    environment: 'live' | 'demo'
  ): Promise<MarketSeries[]> {
    const data = await this.makeRequest(userId, environment, '/series')

    const series: MarketSeries[] = (data.series || []).map((s: any) => ({
      series_ticker: s.series_ticker,
      title: s.title,
      category: s.category,
      description: s.description,
      frequency: s.frequency,
      tags: s.tags
    }))

    // Sync to database
    for (const s of series) {
      await supabase
        .from('prediction_market_series')
        .upsert({
          series_ticker: s.series_ticker,
          title: s.title,
          category: s.category,
          description: s.description,
          frequency: s.frequency,
          tags: s.tags
        }, {
          onConflict: 'series_ticker'
        })
    }

    return series
  }

  // =====================================================
  // Portfolio & Positions
  // =====================================================

  static async getPositions(
    userId: string,
    environment: 'live' | 'demo'
  ): Promise<PredictionMarketPosition[]> {
    const data = await this.makeRequest(userId, environment, '/portfolio/positions')

    const positions: PredictionMarketPosition[] = []

    for (const pos of data.positions || []) {
      const position: PredictionMarketPosition = {
        id: pos.position_id || `${userId}-${pos.market_ticker}-${pos.side}`,
        user_id: userId,
        market_ticker: pos.market_ticker,
        position_side: pos.side,
        quantity: pos.quantity || 0,
        average_price: pos.average_price ? parseFloat(pos.average_price) / 100 : 0,
        total_cost: pos.total_cost ? parseFloat(pos.total_cost) : 0,
        current_value: pos.market_value ? parseFloat(pos.market_value) : undefined,
        unrealized_pnl: pos.unrealized_pnl ? parseFloat(pos.unrealized_pnl) : undefined,
        realized_pnl: pos.realized_pnl ? parseFloat(pos.realized_pnl) : 0
      }

      positions.push(position)

      // Sync to database
      await supabase
        .from('prediction_market_positions')
        .upsert({
          user_id: userId,
          market_ticker: position.market_ticker,
          position_side: position.position_side,
          quantity: position.quantity,
          average_price: position.average_price,
          total_cost: position.total_cost,
          current_value: position.current_value,
          unrealized_pnl: position.unrealized_pnl,
          realized_pnl: position.realized_pnl,
          last_updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,market_ticker,position_side'
        })
    }

    return positions
  }

  // =====================================================
  // Orders & Trading
  // =====================================================

  static async placeOrder(
    userId: string,
    environment: 'live' | 'demo',
    orderRequest: PredictionMarketOrder
  ): Promise<PredictionMarketOrderResponse> {
    const requestBody = {
      ticker: orderRequest.market_ticker,
      type: orderRequest.order_type,
      side: orderRequest.side,
      action: orderRequest.action,
      count: orderRequest.quantity,
      yes_price: orderRequest.side === 'yes' && orderRequest.limit_price ? Math.round(orderRequest.limit_price * 100) : undefined,
      no_price: orderRequest.side === 'no' && orderRequest.limit_price ? Math.round(orderRequest.limit_price * 100) : undefined,
      expiration_ts: orderRequest.time_in_force === 'ioc' ? Date.now() + 60000 : undefined,
      client_order_id: orderRequest.client_order_id || `PM_${Date.now()}`
    }

    const data = await this.makeRequest(userId, environment, '/portfolio/orders', 'POST', requestBody)

    const order: PredictionMarketOrderResponse = {
      id: data.order_id,
      kalshi_order_id: data.order_id,
      market_ticker: orderRequest.market_ticker,
      order_type: orderRequest.order_type,
      side: orderRequest.side,
      action: orderRequest.action,
      quantity: orderRequest.quantity,
      limit_price: orderRequest.limit_price,
      filled_quantity: data.filled_count || 0,
      remaining_quantity: orderRequest.quantity - (data.filled_count || 0),
      average_fill_price: data.average_price ? parseFloat(data.average_price) / 100 : undefined,
      status: data.status,
      submitted_at: new Date().toISOString()
    }

    // Save to database
    await supabase
      .from('prediction_market_orders')
      .insert({
        user_id: userId,
        kalshi_order_id: order.kalshi_order_id,
        market_ticker: order.market_ticker,
        order_type: order.order_type,
        side: order.side,
        action: order.action,
        quantity: order.quantity,
        limit_price: order.limit_price,
        filled_quantity: order.filled_quantity,
        remaining_quantity: order.remaining_quantity,
        average_fill_price: order.average_fill_price,
        status: order.status,
        time_in_force: orderRequest.time_in_force || 'gtc',
        client_order_id: requestBody.client_order_id,
        submitted_at: order.submitted_at
      })

    await this.logActivity(userId, 'order_placed', environment, {
      order_id: order.id,
      market_ticker: order.market_ticker,
      side: order.side,
      action: order.action,
      quantity: order.quantity
    })

    return order
  }

  static async getOrders(
    userId: string,
    environment: 'live' | 'demo',
    ticker?: string
  ): Promise<PredictionMarketOrderResponse[]> {
    const endpoint = ticker ? `/portfolio/orders?ticker=${ticker}` : '/portfolio/orders'
    const data = await this.makeRequest(userId, environment, endpoint)

    return (data.orders || []).map((o: any) => ({
      id: o.order_id,
      kalshi_order_id: o.order_id,
      market_ticker: o.ticker,
      order_type: o.type,
      side: o.side,
      action: o.action,
      quantity: o.count,
      limit_price: o.yes_price ? parseFloat(o.yes_price) / 100 : (o.no_price ? parseFloat(o.no_price) / 100 : undefined),
      filled_quantity: o.filled_count || 0,
      remaining_quantity: o.remaining_count || 0,
      average_fill_price: o.average_price ? parseFloat(o.average_price) / 100 : undefined,
      status: o.status,
      submitted_at: o.created_time
    }))
  }

  static async cancelOrder(
    userId: string,
    environment: 'live' | 'demo',
    orderId: string
  ): Promise<void> {
    await this.makeRequest(userId, environment, `/portfolio/orders/${orderId}`, 'DELETE')

    await supabase
      .from('prediction_market_orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('kalshi_order_id', orderId)
      .eq('user_id', userId)

    await this.logActivity(userId, 'order_cancelled', environment, { order_id: orderId })
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  private static async logActivity(
    userId: string,
    activityType: string,
    environment: 'live' | 'demo',
    metadata: any
  ): Promise<void> {
    try {
      await supabase
        .from('prediction_markets_activity_log')
        .insert({
          user_id: userId,
          activity_type: activityType,
          environment,
          metadata,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }

  static async isConfigured(userId: string, environment: 'live' | 'demo' = 'demo'): Promise<boolean> {
    const credentials = await this.getCredentials(userId, environment)
    return credentials !== null && credentials.is_active
  }

  static async syncMarkets(userId: string, environment: 'live' | 'demo'): Promise<void> {
    try {
      await this.getMarkets(userId, environment, { status: 'active', limit: 100 })
      await this.getSeries(userId, environment)
      console.log('Markets synced successfully')
    } catch (error) {
      console.error('Error syncing markets:', error)
      throw error
    }
  }

  static async syncPortfolio(userId: string, environment: 'live' | 'demo'): Promise<void> {
    try {
      await this.getAccount(userId, environment)
      await this.getPositions(userId, environment)
      console.log('Portfolio synced successfully')
    } catch (error) {
      console.error('Error syncing portfolio:', error)
      throw error
    }
  }
}
