import { supabase } from '../lib/supabase'
import type { OptionsContract } from '../types/options'

const ALPACA_PAPER_URL = 'https://paper-api.alpaca.markets'
const ALPACA_LIVE_URL = 'https://api.alpaca.markets'

export interface AlpacaCredentials {
  id: string
  user_id: string
  api_key_encrypted: string
  api_secret_encrypted: string
  encryption_iv: string
  environment: 'paper' | 'live'
  is_active: boolean
  options_trading_level: number
  compliance_acknowledged: boolean
  compliance_acknowledged_at?: string
  last_validated_at?: string
  created_at: string
  updated_at: string
}

export interface AlpacaAccountInfo {
  account_number: string
  status: string
  currency: string
  buying_power: string
  cash: string
  portfolio_value: string
  equity: string
  last_equity: string
  multiplier: string
  options_buying_power: string
  options_approved_level: number
  options_trading_level: number
  pattern_day_trader: boolean
  daytrade_count: number
  daytrading_buying_power: string
}

export interface AlpacaPosition {
  asset_id: string
  symbol: string
  exchange: string
  asset_class: string
  avg_entry_price: string
  qty: string
  side: 'long' | 'short'
  market_value: string
  cost_basis: string
  unrealized_pl: string
  unrealized_plpc: string
  unrealized_intraday_pl: string
  unrealized_intraday_plpc: string
  current_price: string
  lastday_price: string
  change_today: string
  underlying_symbol?: string
  contract_type?: 'call' | 'put'
  strike_price?: string
  expiration_date?: string
}

export interface AlpacaOrder {
  id: string
  client_order_id: string
  created_at: string
  updated_at: string
  submitted_at: string
  filled_at?: string
  expired_at?: string
  canceled_at?: string
  failed_at?: string
  replaced_at?: string
  replaced_by?: string
  replaces?: string
  asset_id: string
  symbol: string
  asset_class: string
  qty: string
  filled_qty: string
  filled_avg_price?: string
  order_class: string
  order_type: 'market' | 'limit' | 'stop' | 'stop_limit'
  type: 'market' | 'limit' | 'stop' | 'stop_limit'
  side: 'buy' | 'sell'
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok'
  limit_price?: string
  stop_price?: string
  status: 'new' | 'partially_filled' | 'filled' | 'done_for_day' | 'canceled' | 'expired' | 'replaced' | 'pending_cancel' | 'pending_replace' | 'accepted' | 'pending_new' | 'accepted_for_bidding' | 'stopped' | 'rejected' | 'suspended' | 'calculated'
  extended_hours: boolean
  legs?: any[]
  trail_percent?: string
  trail_price?: string
  hwm?: string
}

export interface AlpacaOptionContract {
  id: string
  symbol: string
  name: string
  status: string
  tradable: boolean
  expiration_date: string
  root_symbol: string
  underlying_symbol: string
  underlying_asset_id: string
  type: 'call' | 'put'
  style: 'american' | 'european'
  strike_price: string
  multiplier: string
  size: string
  open_interest: string
  open_interest_date: string
  close_price: string
  close_price_date: string
}

export interface OrderRequest {
  symbol: string
  qty: number
  side: 'buy' | 'sell'
  type: 'market' | 'limit'
  time_in_force: 'day'
  limit_price?: number
  client_order_id?: string
}

export class AlpacaService {
  private static async getCredentials(userId: string, environment: 'paper' | 'live'): Promise<AlpacaCredentials | null> {
    const { data, error } = await supabase
      .from('alpaca_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('environment', environment)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error fetching Alpaca credentials:', error)
      return null
    }

    return data
  }

  private static async decryptCredentials(credentials: AlpacaCredentials): Promise<{apiKey: string, apiSecret: string} | null> {
    try {
      const cryptoKey = import.meta.env.VITE_ENCRYPTION_KEY
      if (!cryptoKey) {
        console.error('Encryption key not found in environment')
        return null
      }

      const apiKey = await this.decryptText(credentials.api_key_encrypted, credentials.encryption_iv, cryptoKey)
      const apiSecret = await this.decryptText(credentials.api_secret_encrypted, credentials.encryption_iv, cryptoKey)

      return { apiKey, apiSecret }
    } catch (error) {
      console.error('Error decrypting credentials:', error)
      return null
    }
  }

  private static async decryptText(encryptedText: string, iv: string, key: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(key.padEnd(32, '0').substring(0, 32))

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0))
    const encryptedBuffer = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0))

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      cryptoKey,
      encryptedBuffer
    )

    return new TextDecoder().decode(decrypted)
  }

  private static async encryptCredentials(apiKey: string, apiSecret: string): Promise<{
    apiKeyEncrypted: string
    apiSecretEncrypted: string
    iv: string
  }> {
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

    const encryptedKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(apiKey)
    )

    const encryptedSecret = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(apiSecret)
    )

    return {
      apiKeyEncrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedKey))),
      apiSecretEncrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedSecret))),
      iv: btoa(String.fromCharCode(...iv))
    }
  }

  static async saveCredentials(
    userId: string,
    apiKey: string,
    apiSecret: string,
    environment: 'paper' | 'live',
    tradingLevel: number = 0
  ): Promise<boolean> {
    try {
      const encrypted = await this.encryptCredentials(apiKey, apiSecret)

      const { error } = await supabase
        .from('alpaca_credentials')
        .upsert({
          user_id: userId,
          api_key_encrypted: encrypted.apiKeyEncrypted,
          api_secret_encrypted: encrypted.apiSecretEncrypted,
          encryption_iv: encrypted.iv,
          environment,
          is_active: true,
          options_trading_level: tradingLevel,
          compliance_acknowledged: false
        }, {
          onConflict: 'user_id,environment'
        })

      if (error) throw error

      await this.logActivity(userId, 'credentials_saved', environment, {
        action: 'Alpaca credentials saved',
        environment
      })

      return true
    } catch (error) {
      console.error('Error saving Alpaca credentials:', error)
      return false
    }
  }

  private static async makeRequest(
    userId: string,
    environment: 'paper' | 'live',
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH' = 'GET',
    body?: any
  ): Promise<any> {
    const credentials = await this.getCredentials(userId, environment)
    if (!credentials) {
      throw new Error('Alpaca credentials not found')
    }

    const decrypted = await this.decryptCredentials(credentials)
    if (!decrypted) {
      throw new Error('Failed to decrypt Alpaca credentials')
    }

    const baseUrl = environment === 'paper' ? ALPACA_PAPER_URL : ALPACA_LIVE_URL
    const url = `${baseUrl}${endpoint}`

    const headers = {
      'APCA-API-KEY-ID': decrypted.apiKey,
      'APCA-API-SECRET-KEY': decrypted.apiSecret,
      'Content-Type': 'application/json'
    }

    const options: RequestInit = {
      method,
      headers
    }

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Alpaca API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  static async getAccount(userId: string, environment: 'paper' | 'live'): Promise<AlpacaAccountInfo> {
    const account = await this.makeRequest(userId, environment, '/v2/account')

    await supabase
      .from('alpaca_account_info')
      .upsert({
        user_id: userId,
        account_number: account.account_number,
        account_status: account.status,
        trading_level: account.options_approved_level || 0,
        buying_power: parseFloat(account.buying_power),
        options_buying_power: parseFloat(account.options_buying_power || '0'),
        pattern_day_trader: account.pattern_day_trader,
        day_trade_count: account.daytrade_count,
        equity: parseFloat(account.equity),
        cash: parseFloat(account.cash),
        portfolio_value: parseFloat(account.portfolio_value),
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    return account
  }

  static async getPositions(userId: string, environment: 'paper' | 'live'): Promise<AlpacaPosition[]> {
    const positions = await this.makeRequest(userId, environment, '/v2/positions')

    for (const position of positions) {
      if (position.asset_class === 'us_option') {
        await supabase
          .from('alpaca_positions')
          .upsert({
            user_id: userId,
            symbol: position.symbol,
            underlying_symbol: position.underlying_symbol,
            asset_class: position.asset_class,
            quantity: parseFloat(position.qty),
            avg_entry_price: parseFloat(position.avg_entry_price),
            current_price: parseFloat(position.current_price),
            market_value: parseFloat(position.market_value),
            cost_basis: parseFloat(position.cost_basis),
            unrealized_pl: parseFloat(position.unrealized_pl),
            unrealized_plpc: parseFloat(position.unrealized_plpc),
            side: position.side,
            contract_type: position.contract_type,
            strike_price: position.strike_price ? parseFloat(position.strike_price) : null,
            expiration_date: position.expiration_date,
            last_synced_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,symbol'
          })
      }
    }

    return positions
  }

  static async getOptionContracts(
    userId: string,
    environment: 'paper' | 'live',
    underlyingSymbol?: string,
    expirationDate?: string
  ): Promise<AlpacaOptionContract[]> {
    let endpoint = '/v2/options/contracts'
    const params = new URLSearchParams()

    if (underlyingSymbol) {
      params.append('underlying_symbols', underlyingSymbol)
    }
    if (expirationDate) {
      params.append('expiration_date', expirationDate)
    }

    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    const response = await this.makeRequest(userId, environment, endpoint)
    return response.option_contracts || []
  }

  static async placeOrder(
    userId: string,
    environment: 'paper' | 'live',
    orderRequest: OrderRequest
  ): Promise<AlpacaOrder> {
    if (orderRequest.type === 'limit' && !orderRequest.limit_price) {
      throw new Error('Limit price required for limit orders')
    }

    if (!Number.isInteger(orderRequest.qty)) {
      throw new Error('Options orders must have whole number quantities')
    }

    if (orderRequest.time_in_force !== 'day') {
      throw new Error('Options orders must use day time_in_force')
    }

    const order = await this.makeRequest(userId, environment, '/v2/orders', 'POST', orderRequest)

    await supabase
      .from('alpaca_orders')
      .insert({
        user_id: userId,
        alpaca_order_id: order.id,
        client_order_id: order.client_order_id,
        symbol: order.symbol,
        asset_class: order.asset_class,
        order_type: order.type,
        side: order.side,
        time_in_force: order.time_in_force,
        quantity: parseFloat(order.qty),
        limit_price: order.limit_price ? parseFloat(order.limit_price) : null,
        filled_qty: parseFloat(order.filled_qty || '0'),
        filled_avg_price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
        status: order.status,
        submitted_at: order.submitted_at
      })

    await this.logActivity(userId, 'order_placed', environment, {
      order_id: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.qty,
      type: order.type
    })

    return order
  }

  static async getOrder(userId: string, environment: 'paper' | 'live', orderId: string): Promise<AlpacaOrder> {
    return this.makeRequest(userId, environment, `/v2/orders/${orderId}`)
  }

  static async cancelOrder(userId: string, environment: 'paper' | 'live', orderId: string): Promise<void> {
    await this.makeRequest(userId, environment, `/v2/orders/${orderId}`, 'DELETE')

    await supabase
      .from('alpaca_orders')
      .update({
        status: 'canceled',
        cancelled_at: new Date().toISOString()
      })
      .eq('alpaca_order_id', orderId)
      .eq('user_id', userId)

    await this.logActivity(userId, 'order_cancelled', environment, { order_id: orderId })
  }

  static async getOrders(
    userId: string,
    environment: 'paper' | 'live',
    status?: string
  ): Promise<AlpacaOrder[]> {
    let endpoint = '/v2/orders'
    if (status) {
      endpoint += `?status=${status}`
    }

    return this.makeRequest(userId, environment, endpoint)
  }

  static async closePosition(
    userId: string,
    environment: 'paper' | 'live',
    symbol: string,
    qty?: number
  ): Promise<AlpacaOrder> {
    const endpoint = `/v2/positions/${symbol}`
    const body = qty ? { qty: qty.toString() } : undefined

    const order = await this.makeRequest(userId, environment, endpoint, 'DELETE', body)

    await this.logActivity(userId, 'position_closed', environment, { symbol, qty })

    return order
  }

  static async exerciseOption(
    userId: string,
    environment: 'paper' | 'live',
    symbol: string
  ): Promise<void> {
    await this.makeRequest(userId, environment, `/v2/positions/${symbol}/exercise`, 'POST')

    await this.logActivity(userId, 'option_exercised', environment, { symbol })
  }

  static async validateCredentials(
    userId: string,
    environment: 'paper' | 'live'
  ): Promise<boolean> {
    try {
      await this.getAccount(userId, environment)

      await supabase
        .from('alpaca_credentials')
        .update({ last_validated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('environment', environment)

      return true
    } catch (error) {
      console.error('Credential validation failed:', error)
      return false
    }
  }

  static async syncPositions(userId: string, environment: 'paper' | 'live'): Promise<void> {
    try {
      const positions = await this.getPositions(userId, environment)
      console.log(`Synced ${positions.length} positions from Alpaca ${environment} account`)
    } catch (error) {
      console.error('Error syncing positions:', error)
      throw error
    }
  }

  static async syncOrders(userId: string, environment: 'paper' | 'live'): Promise<void> {
    try {
      const orders = await this.getOrders(userId, environment)

      for (const order of orders) {
        await supabase
          .from('alpaca_orders')
          .upsert({
            user_id: userId,
            alpaca_order_id: order.id,
            client_order_id: order.client_order_id,
            symbol: order.symbol,
            asset_class: order.asset_class,
            order_type: order.type,
            side: order.side,
            time_in_force: order.time_in_force,
            quantity: parseFloat(order.qty),
            limit_price: order.limit_price ? parseFloat(order.limit_price) : null,
            filled_qty: parseFloat(order.filled_qty || '0'),
            filled_avg_price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
            status: order.status,
            submitted_at: order.submitted_at,
            filled_at: order.filled_at,
            cancelled_at: order.canceled_at
          }, {
            onConflict: 'user_id,alpaca_order_id'
          })
      }
    } catch (error) {
      console.error('Error syncing orders:', error)
      throw error
    }
  }

  private static async logActivity(
    userId: string,
    activityType: string,
    environment: 'paper' | 'live',
    metadata: any
  ): Promise<void> {
    try {
      await supabase
        .from('alpaca_trading_activity_log')
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

  static async acknowledgeCompliance(
    userId: string,
    disclosureType: string,
    version: string
  ): Promise<void> {
    await supabase
      .from('alpaca_compliance_acknowledgments')
      .insert({
        user_id: userId,
        disclosure_type: disclosureType,
        disclosure_version: version,
        acknowledged_at: new Date().toISOString()
      })

    await supabase
      .from('alpaca_credentials')
      .update({
        compliance_acknowledged: true,
        compliance_acknowledged_at: new Date().toISOString()
      })
      .eq('user_id', userId)
  }

  static async deleteCredentials(userId: string, environment: 'paper' | 'live'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alpaca_credentials')
        .delete()
        .eq('user_id', userId)
        .eq('environment', environment)

      if (error) throw error

      await this.logActivity(userId, 'credentials_deleted', environment, {
        action: 'Alpaca credentials deleted'
      })

      return true
    } catch (error) {
      console.error('Error deleting credentials:', error)
      return false
    }
  }

  static convertAlpacaContractToOptionsContract(alpacaContract: AlpacaOptionContract): OptionsContract {
    const strikePrice = parseFloat(alpacaContract.strike_price)
    const lastPrice = parseFloat(alpacaContract.close_price)

    return {
      contract_type: alpacaContract.type,
      exercise_style: alpacaContract.style,
      expiration_date: alpacaContract.expiration_date,
      shares_per_contract: parseInt(alpacaContract.size),
      strike_price: strikePrice,
      ticker: alpacaContract.symbol,
      underlying_ticker: alpacaContract.underlying_symbol,
      bid: lastPrice * 0.98,
      ask: lastPrice * 1.02,
      last: lastPrice,
      volume: 0,
      open_interest: parseInt(alpacaContract.open_interest || '0'),
      implied_volatility: 0.25,
      delta: 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      intrinsic_value: 0,
      time_value: lastPrice
    }
  }
}
