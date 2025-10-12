/**
 * HDFC Securities API Integration Service
 *
 * Provides integration with HDFC Securities API for:
 * - Authentication and session management
 * - Account information
 * - Market data (stocks, derivatives, options)
 * - Order placement and management
 * - Portfolio tracking
 * - NSE/BSE/NFO/MCX trading
 *
 * API Documentation: https://api.hdfcsec.com
 */

import { supabase } from '../lib/supabase'

export interface HDFCSecuritiesCredentials {
  app_id: string
  app_secret: string
  access_token?: string
  user_code: string
}

export interface HDFCSecuritiesAccount {
  user_code: string
  client_name: string
  email: string
  mobile: string
  pan: string
  exchange_enabled: string[]
  product_types: string[]
  account_type: 'individual' | 'corporate'
  account_status: 'active' | 'suspended' | 'closed'
  dp_id: string
  branch_code: string
}

export interface HDFCSecuritiesBalance {
  cash_balance: number
  collateral_value: number
  used_margin: number
  available_margin: number
  premium_used: number
  adhoc_limit: number
  payout_amount: number
  total_balance: number
  currency: 'INR'
}

export interface HDFCSecuritiesPosition {
  symbol: string
  exchange: 'NSE' | 'BSE' | 'NFO' | 'MCX' | 'CDS'
  product_type: 'DELIVERY' | 'INTRADAY' | 'MARGIN' | 'CO' | 'BO'
  quantity: number
  buy_quantity: number
  sell_quantity: number
  buy_avg_price: number
  sell_avg_price: number
  net_quantity: number
  realized_pnl: number
  unrealized_pnl: number
  ltp: number
  mtm: number
  close_price: number
}

export interface HDFCSecuritiesOrder {
  order_id: string
  exchange: 'NSE' | 'BSE' | 'NFO' | 'MCX' | 'CDS'
  symbol: string
  trading_symbol: string
  product_type: 'DELIVERY' | 'INTRADAY' | 'MARGIN' | 'CO' | 'BO'
  transaction_type: 'BUY' | 'SELL'
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M'
  quantity: number
  price?: number
  trigger_price?: number
  disclosed_quantity?: number
  validity: 'DAY' | 'IOC' | 'GTD'
  status: 'PENDING' | 'OPEN' | 'COMPLETE' | 'REJECTED' | 'CANCELLED' | 'AFTER MARKET ORDER'
  filled_quantity: number
  remaining_quantity: number
  order_timestamp: string
  exchange_order_id?: string
  rejection_reason?: string
  average_price?: number
}

export interface HDFCSecuritiesQuote {
  symbol: string
  exchange: string
  trading_symbol: string
  ltp: number
  open: number
  high: number
  low: number
  close: number
  bid_price: number
  ask_price: number
  bid_quantity: number
  ask_quantity: number
  volume: number
  total_buy_quantity: number
  total_sell_quantity: number
  average_traded_price: number
  change: number
  change_percent: number
  upper_circuit_limit: number
  lower_circuit_limit: number
  last_trade_time: string
}

export interface HDFCSecuritiesOptionChain {
  underlying_symbol: string
  expiry_date: string
  strike_price: number
  call_option: {
    symbol: string
    ltp: number
    bid: number
    ask: number
    volume: number
    oi: number
    oi_change: number
    iv: number
    delta: number
    gamma: number
    theta: number
    vega: number
  }
  put_option: {
    symbol: string
    ltp: number
    bid: number
    ask: number
    volume: number
    oi: number
    oi_change: number
    iv: number
    delta: number
    gamma: number
    theta: number
    vega: number
  }
}

export class HDFCSecuritiesService {
  private static readonly API_BASE_URL = 'https://api.hdfcsec.com/trading/v1'
  private static readonly DEMO_MODE = true // Set to false for production

  /**
   * Save HDFC Securities credentials to database
   */
  static async saveCredentials(
    userId: string,
    credentials: HDFCSecuritiesCredentials,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('hdfc_securities_credentials')
        .upsert({
          user_id: userId,
          app_id: credentials.app_id,
          app_secret: credentials.app_secret,
          access_token: credentials.access_token,
          user_code: credentials.user_code,
          environment,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Error saving HDFC Securities credentials:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get stored credentials
   */
  static async getCredentials(
    userId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<HDFCSecuritiesCredentials | null> {
    try {
      const { data, error } = await supabase
        .from('hdfc_securities_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('environment', environment)
        .single()

      if (error) throw error

      return {
        app_id: data.app_id,
        app_secret: data.app_secret,
        access_token: data.access_token,
        user_code: data.user_code
      }
    } catch (error) {
      console.error('Error getting HDFC Securities credentials:', error)
      return null
    }
  }

  /**
   * Validate credentials
   */
  static async validateCredentials(
    userId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<boolean> {
    if (this.DEMO_MODE) {
      return true
    }

    try {
      const account = await this.getAccount(userId, environment)
      return account !== null
    } catch (error) {
      console.error('Error validating HDFC Securities credentials:', error)
      return false
    }
  }

  /**
   * Generate access token (OAuth flow)
   */
  static async generateAccessToken(
    credentials: HDFCSecuritiesCredentials,
    requestToken: string
  ): Promise<{ access_token: string; error?: string }> {
    if (this.DEMO_MODE) {
      return {
        access_token: 'demo_token_' + Date.now()
      }
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: credentials.app_id,
          app_secret: credentials.app_secret,
          request_token: requestToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate access token')
      }

      return {
        access_token: data.access_token
      }
    } catch (error: any) {
      console.error('Error generating HDFC Securities access token:', error)
      return {
        access_token: '',
        error: error.message
      }
    }
  }

  /**
   * Get account information
   */
  static async getAccount(
    userId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<HDFCSecuritiesAccount | null> {
    if (this.DEMO_MODE) {
      return {
        user_code: 'DEMO5678',
        client_name: 'Demo User',
        email: 'demo@example.com',
        mobile: '+91-9876543210',
        pan: 'DEMO12345A',
        exchange_enabled: ['NSE', 'BSE', 'NFO', 'MCX', 'CDS'],
        product_types: ['DELIVERY', 'INTRADAY', 'MARGIN', 'CO', 'BO'],
        account_type: 'individual',
        account_status: 'active',
        dp_id: 'IN300000',
        branch_code: 'MUM001'
      }
    }

    try {
      const credentials = await this.getCredentials(userId, environment)
      if (!credentials || !credentials.access_token) {
        throw new Error('No valid access token')
      }

      const response = await fetch(`${this.API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'X-APP-ID': credentials.app_id
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get account details')
      }

      return data
    } catch (error) {
      console.error('Error getting HDFC Securities account:', error)
      return null
    }
  }

  /**
   * Get account balance and margins
   */
  static async getBalance(
    userId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<HDFCSecuritiesBalance | null> {
    if (this.DEMO_MODE) {
      return {
        cash_balance: 750000,
        collateral_value: 300000,
        used_margin: 200000,
        available_margin: 850000,
        premium_used: 50000,
        adhoc_limit: 100000,
        payout_amount: 25000,
        total_balance: 1050000,
        currency: 'INR'
      }
    }

    try {
      const credentials = await this.getCredentials(userId, environment)
      if (!credentials || !credentials.access_token) {
        throw new Error('No valid access token')
      }

      const response = await fetch(`${this.API_BASE_URL}/funds/margins`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'X-APP-ID': credentials.app_id
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get balance')
      }

      return data
    } catch (error) {
      console.error('Error getting HDFC Securities balance:', error)
      return null
    }
  }

  /**
   * Get positions
   */
  static async getPositions(
    userId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<HDFCSecuritiesPosition[]> {
    if (this.DEMO_MODE) {
      return [
        {
          symbol: 'TCS',
          exchange: 'NSE',
          product_type: 'DELIVERY',
          quantity: 5,
          buy_quantity: 5,
          sell_quantity: 0,
          buy_avg_price: 3850.00,
          sell_avg_price: 0,
          net_quantity: 5,
          realized_pnl: 0,
          unrealized_pnl: 750,
          ltp: 4000.00,
          mtm: 750,
          close_price: 3850.00
        }
      ]
    }

    try {
      const credentials = await this.getCredentials(userId, environment)
      if (!credentials || !credentials.access_token) {
        throw new Error('No valid access token')
      }

      const response = await fetch(`${this.API_BASE_URL}/portfolio/positions`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'X-APP-ID': credentials.app_id
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get positions')
      }

      return data.positions || []
    } catch (error) {
      console.error('Error getting HDFC Securities positions:', error)
      return []
    }
  }

  /**
   * Place order
   */
  static async placeOrder(
    userId: string,
    order: Omit<HDFCSecuritiesOrder, 'order_id' | 'status' | 'filled_quantity' | 'remaining_quantity' | 'order_timestamp'>,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<{ order_id: string; error?: string }> {
    if (this.DEMO_MODE) {
      return {
        order_id: 'HDFC_ORD_' + Date.now()
      }
    }

    try {
      const credentials = await this.getCredentials(userId, environment)
      if (!credentials || !credentials.access_token) {
        throw new Error('No valid access token')
      }

      const response = await fetch(`${this.API_BASE_URL}/orders/regular`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'X-APP-ID': credentials.app_id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order')
      }

      return {
        order_id: data.order_id
      }
    } catch (error: any) {
      console.error('Error placing HDFC Securities order:', error)
      return {
        order_id: '',
        error: error.message
      }
    }
  }

  /**
   * Get orders
   */
  static async getOrders(
    userId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<HDFCSecuritiesOrder[]> {
    if (this.DEMO_MODE) {
      return []
    }

    try {
      const credentials = await this.getCredentials(userId, environment)
      if (!credentials || !credentials.access_token) {
        throw new Error('No valid access token')
      }

      const response = await fetch(`${this.API_BASE_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'X-APP-ID': credentials.app_id
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get orders')
      }

      return data.orders || []
    } catch (error) {
      console.error('Error getting HDFC Securities orders:', error)
      return []
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(
    userId: string,
    orderId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<{ success: boolean; error?: string }> {
    if (this.DEMO_MODE) {
      return { success: true }
    }

    try {
      const credentials = await this.getCredentials(userId, environment)
      if (!credentials || !credentials.access_token) {
        throw new Error('No valid access token')
      }

      const response = await fetch(`${this.API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'X-APP-ID': credentials.app_id
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel order')
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error canceling HDFC Securities order:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get quote/market data
   */
  static async getQuote(
    symbol: string,
    exchange: 'NSE' | 'BSE' | 'NFO' = 'NSE'
  ): Promise<HDFCSecuritiesQuote | null> {
    if (this.DEMO_MODE) {
      return {
        symbol: symbol,
        exchange: exchange,
        trading_symbol: symbol,
        ltp: 4000.00,
        open: 3980.00,
        high: 4025.00,
        low: 3970.00,
        close: 3995.00,
        bid_price: 3999.50,
        ask_price: 4000.50,
        bid_quantity: 100,
        ask_quantity: 150,
        volume: 2500000,
        total_buy_quantity: 1200000,
        total_sell_quantity: 1300000,
        average_traded_price: 4002.50,
        change: 5.00,
        change_percent: 0.13,
        upper_circuit_limit: 4394.50,
        lower_circuit_limit: 3595.50,
        last_trade_time: new Date().toISOString()
      }
    }

    return null
  }

  /**
   * Get options chain
   */
  static async getOptionsChain(
    underlying: string,
    expiryDate?: string
  ): Promise<HDFCSecuritiesOptionChain[]> {
    if (this.DEMO_MODE) {
      const strikes = [3800, 3850, 3900, 3950, 4000, 4050, 4100]
      return strikes.map(strike => ({
        underlying_symbol: underlying,
        expiry_date: expiryDate || '2025-01-30',
        strike_price: strike,
        call_option: {
          symbol: `${underlying}${strike}CE`,
          ltp: Math.max(4000 - strike, 0) + Math.random() * 50,
          bid: 0,
          ask: 0,
          volume: Math.floor(Math.random() * 15000),
          oi: Math.floor(Math.random() * 75000),
          oi_change: Math.floor(Math.random() * 5000) - 2500,
          iv: 0.18 + Math.random() * 0.12,
          delta: strike < 4000 ? 0.6 + Math.random() * 0.3 : 0.1 + Math.random() * 0.4,
          gamma: 0.002 + Math.random() * 0.006,
          theta: -0.08 - Math.random() * 0.05,
          vega: 0.15 + Math.random() * 0.25
        },
        put_option: {
          symbol: `${underlying}${strike}PE`,
          ltp: Math.max(strike - 4000, 0) + Math.random() * 50,
          bid: 0,
          ask: 0,
          volume: Math.floor(Math.random() * 15000),
          oi: Math.floor(Math.random() * 75000),
          oi_change: Math.floor(Math.random() * 5000) - 2500,
          iv: 0.18 + Math.random() * 0.12,
          delta: -(strike > 4000 ? 0.6 + Math.random() * 0.3 : 0.1 + Math.random() * 0.4),
          gamma: 0.002 + Math.random() * 0.006,
          theta: -0.08 - Math.random() * 0.05,
          vega: 0.15 + Math.random() * 0.25
        }
      }))
    }

    return []
  }

  /**
   * Get historical data
   */
  static async getHistoricalData(
    symbol: string,
    exchange: 'NSE' | 'BSE' | 'NFO',
    interval: '1minute' | '5minute' | '15minute' | '1hour' | '1day',
    fromDate: string,
    toDate: string
  ): Promise<any[]> {
    if (this.DEMO_MODE) {
      return []
    }

    return []
  }

  /**
   * Check if credentials are configured
   */
  static async isConfigured(
    userId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<boolean> {
    const credentials = await this.getCredentials(userId, environment)
    return credentials !== null && !!credentials.app_id
  }

  /**
   * Get supported exchanges
   */
  static getSupportedExchanges(): string[] {
    return ['NSE', 'BSE', 'NFO', 'MCX', 'CDS']
  }

  /**
   * Get supported products
   */
  static getSupportedProducts(): string[] {
    return ['DELIVERY', 'INTRADAY', 'MARGIN', 'CO', 'BO']
  }

  /**
   * Get supported order types
   */
  static getSupportedOrderTypes(): string[] {
    return ['MARKET', 'LIMIT', 'SL', 'SL-M']
  }

  /**
   * Get login URL for OAuth flow
   */
  static getLoginUrl(appId: string, redirectUri: string): string {
    if (this.DEMO_MODE) {
      return '#demo-mode'
    }

    return `${this.API_BASE_URL}/auth/login?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}`
  }
}
