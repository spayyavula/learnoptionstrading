/**
 * ICICI Direct (Breeze API) Integration Service
 *
 * Provides integration with ICICI Direct's Breeze API for:
 * - Authentication and session management
 * - Account information
 * - Market data (stocks, derivatives, options)
 * - Order placement and management
 * - Portfolio tracking
 * - NSE/BSE/NFO trading
 *
 * API Documentation: https://api.icicidirect.com/breezeconnect
 */

import { supabase } from '../lib/supabase'

export interface ICICIDirectCredentials {
  api_key: string
  api_secret: string
  session_token?: string
  user_id: string
}

export interface ICICIDirectAccount {
  user_id: string
  user_name: string
  email: string
  mobile: string
  exchanges: string[]
  products: string[]
  order_types: string[]
  pan: string
  account_status: 'active' | 'inactive'
}

export interface ICICIDirectBalance {
  available_balance: number
  used_margin: number
  collateral: number
  adhoc_margin: number
  notional_cash: number
  total_balance: number
  currency: 'INR'
}

export interface ICICIDirectPosition {
  stock_code: string
  exchange_code: 'NSE' | 'BSE' | 'NFO' | 'CDS' | 'MCX'
  product: 'cash' | 'margin' | 'intraday' | 'delivery'
  quantity: number
  average_price: number
  buy_quantity: number
  sell_quantity: number
  buy_average: number
  sell_average: number
  net_quantity: number
  realized_profit: number
  unrealized_profit: number
  ltp: number
  mtm: number
}

export interface ICICIDirectOrder {
  order_id: string
  exchange_code: 'NSE' | 'BSE' | 'NFO' | 'CDS' | 'MCX'
  stock_code: string
  product: 'cash' | 'margin' | 'intraday' | 'delivery' | 'cover_order' | 'bracket_order'
  action: 'buy' | 'sell'
  order_type: 'market' | 'limit' | 'stop_loss' | 'stop_loss_market'
  quantity: number
  price?: number
  trigger_price?: number
  disclosed_quantity?: number
  validity: 'day' | 'ioc' | 'gtc'
  status: 'pending' | 'open' | 'complete' | 'rejected' | 'cancelled'
  filled_quantity: number
  pending_quantity: number
  order_datetime: string
  exchange_order_id?: string
  rejection_reason?: string
}

export interface ICICIDirectQuote {
  stock_code: string
  exchange_code: string
  ltp: number
  open: number
  high: number
  low: number
  close: number
  bid: number
  ask: number
  bid_quantity: number
  ask_quantity: number
  volume: number
  total_buy_quantity: number
  total_sell_quantity: number
  average_price: number
  change: number
  change_percent: number
  upper_circuit: number
  lower_circuit: number
}

export interface ICICIDirectOptionsChain {
  underlying: string
  expiry_date: string
  strike_price: number
  call_option: {
    ltp: number
    bid: number
    ask: number
    volume: number
    oi: number
    iv: number
    delta: number
    gamma: number
    theta: number
    vega: number
  }
  put_option: {
    ltp: number
    bid: number
    ask: number
    volume: number
    oi: number
    iv: number
    delta: number
    gamma: number
    theta: number
    vega: number
  }
}

export class ICICIDirectService {
  private static readonly API_BASE_URL = 'https://api.icicidirect.com/breezeconnect/api/v1'
  private static readonly DEMO_MODE = true // Set to false for production

  /**
   * Save ICICI Direct credentials to database
   */
  static async saveCredentials(
    userId: string,
    credentials: ICICIDirectCredentials,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('icici_direct_credentials')
        .upsert({
          user_id: userId,
          api_key: credentials.api_key,
          api_secret: credentials.api_secret,
          session_token: credentials.session_token,
          icici_user_id: credentials.user_id,
          environment,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Error saving ICICI Direct credentials:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get stored credentials
   */
  static async getCredentials(
    userId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<ICICIDirectCredentials | null> {
    try {
      const { data, error } = await supabase
        .from('icici_direct_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('environment', environment)
        .single()

      if (error) throw error

      return {
        api_key: data.api_key,
        api_secret: data.api_secret,
        session_token: data.session_token,
        user_id: data.icici_user_id
      }
    } catch (error) {
      console.error('Error getting ICICI Direct credentials:', error)
      return null
    }
  }

  /**
   * Validate credentials by attempting to get account info
   */
  static async validateCredentials(
    userId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<boolean> {
    if (this.DEMO_MODE) {
      return true // Always valid in demo mode
    }

    try {
      const account = await this.getAccount(userId, environment)
      return account !== null
    } catch (error) {
      console.error('Error validating ICICI Direct credentials:', error)
      return false
    }
  }

  /**
   * Generate session token (login)
   */
  static async generateSession(
    credentials: ICICIDirectCredentials
  ): Promise<{ session_token: string; error?: string }> {
    if (this.DEMO_MODE) {
      return {
        session_token: 'demo_session_' + Date.now()
      }
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/customer/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': credentials.api_key
        },
        body: JSON.stringify({
          api_secret: credentials.api_secret,
          user_id: credentials.user_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate session')
      }

      return {
        session_token: data.session_token
      }
    } catch (error: any) {
      console.error('Error generating ICICI Direct session:', error)
      return {
        session_token: '',
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
  ): Promise<ICICIDirectAccount | null> {
    if (this.DEMO_MODE) {
      return {
        user_id: 'DEMO123',
        user_name: 'Demo User',
        email: 'demo@example.com',
        mobile: '+91-9876543210',
        exchanges: ['NSE', 'BSE', 'NFO', 'CDS', 'MCX'],
        products: ['cash', 'margin', 'intraday', 'delivery', 'cover_order'],
        order_types: ['market', 'limit', 'stop_loss', 'stop_loss_market'],
        pan: 'DEMO12345A',
        account_status: 'active'
      }
    }

    try {
      const credentials = await this.getCredentials(userId, environment)
      if (!credentials || !credentials.session_token) {
        throw new Error('No valid session token')
      }

      const response = await fetch(`${this.API_BASE_URL}/customer/details`, {
        headers: {
          'Authorization': `Bearer ${credentials.session_token}`,
          'X-API-Key': credentials.api_key
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get account details')
      }

      return data
    } catch (error) {
      console.error('Error getting ICICI Direct account:', error)
      return null
    }
  }

  /**
   * Get account balance
   */
  static async getBalance(
    userId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<ICICIDirectBalance | null> {
    if (this.DEMO_MODE) {
      return {
        available_balance: 500000,
        used_margin: 150000,
        collateral: 200000,
        adhoc_margin: 50000,
        notional_cash: 450000,
        total_balance: 650000,
        currency: 'INR'
      }
    }

    try {
      const credentials = await this.getCredentials(userId, environment)
      if (!credentials || !credentials.session_token) {
        throw new Error('No valid session token')
      }

      const response = await fetch(`${this.API_BASE_URL}/customer/balance`, {
        headers: {
          'Authorization': `Bearer ${credentials.session_token}`,
          'X-API-Key': credentials.api_key
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get balance')
      }

      return data
    } catch (error) {
      console.error('Error getting ICICI Direct balance:', error)
      return null
    }
  }

  /**
   * Get positions
   */
  static async getPositions(
    userId: string,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<ICICIDirectPosition[]> {
    if (this.DEMO_MODE) {
      return [
        {
          stock_code: 'RELIANCE',
          exchange_code: 'NSE',
          product: 'delivery',
          quantity: 10,
          average_price: 2450.50,
          buy_quantity: 10,
          sell_quantity: 0,
          buy_average: 2450.50,
          sell_average: 0,
          net_quantity: 10,
          realized_profit: 0,
          unrealized_profit: 1250,
          ltp: 2575.50,
          mtm: 1250
        }
      ]
    }

    try {
      const credentials = await this.getCredentials(userId, environment)
      if (!credentials || !credentials.session_token) {
        throw new Error('No valid session token')
      }

      const response = await fetch(`${this.API_BASE_URL}/portfolio/positions`, {
        headers: {
          'Authorization': `Bearer ${credentials.session_token}`,
          'X-API-Key': credentials.api_key
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get positions')
      }

      return data.positions || []
    } catch (error) {
      console.error('Error getting ICICI Direct positions:', error)
      return []
    }
  }

  /**
   * Place order
   */
  static async placeOrder(
    userId: string,
    order: Omit<ICICIDirectOrder, 'order_id' | 'status' | 'filled_quantity' | 'pending_quantity' | 'order_datetime'>,
    environment: 'live' | 'demo' = 'demo'
  ): Promise<{ order_id: string; error?: string }> {
    if (this.DEMO_MODE) {
      return {
        order_id: 'DEMO_ORD_' + Date.now()
      }
    }

    try {
      const credentials = await this.getCredentials(userId, environment)
      if (!credentials || !credentials.session_token) {
        throw new Error('No valid session token')
      }

      const response = await fetch(`${this.API_BASE_URL}/order/place`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.session_token}`,
          'X-API-Key': credentials.api_key,
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
      console.error('Error placing ICICI Direct order:', error)
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
  ): Promise<ICICIDirectOrder[]> {
    if (this.DEMO_MODE) {
      return []
    }

    try {
      const credentials = await this.getCredentials(userId, environment)
      if (!credentials || !credentials.session_token) {
        throw new Error('No valid session token')
      }

      const response = await fetch(`${this.API_BASE_URL}/order/history`, {
        headers: {
          'Authorization': `Bearer ${credentials.session_token}`,
          'X-API-Key': credentials.api_key
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get orders')
      }

      return data.orders || []
    } catch (error) {
      console.error('Error getting ICICI Direct orders:', error)
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
      if (!credentials || !credentials.session_token) {
        throw new Error('No valid session token')
      }

      const response = await fetch(`${this.API_BASE_URL}/order/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.session_token}`,
          'X-API-Key': credentials.api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: orderId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel order')
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error canceling ICICI Direct order:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get quote
   */
  static async getQuote(
    stockCode: string,
    exchange: 'NSE' | 'BSE' | 'NFO' = 'NSE'
  ): Promise<ICICIDirectQuote | null> {
    if (this.DEMO_MODE) {
      return {
        stock_code: stockCode,
        exchange_code: exchange,
        ltp: 2575.50,
        open: 2560.00,
        high: 2590.00,
        low: 2550.00,
        close: 2570.00,
        bid: 2575.00,
        ask: 2575.50,
        bid_quantity: 100,
        ask_quantity: 150,
        volume: 1250000,
        total_buy_quantity: 500000,
        total_sell_quantity: 750000,
        average_price: 2572.50,
        change: 5.50,
        change_percent: 0.21,
        upper_circuit: 2827.00,
        lower_circuit: 2313.00
      }
    }

    // Real API implementation would go here
    return null
  }

  /**
   * Get options chain for NSE/NFO
   */
  static async getOptionsChain(
    underlying: string,
    expiryDate?: string
  ): Promise<ICICIDirectOptionsChain[]> {
    if (this.DEMO_MODE) {
      // Return mock options chain
      const strikes = [2400, 2450, 2500, 2550, 2600]
      return strikes.map(strike => ({
        underlying,
        expiry_date: expiryDate || '2025-01-30',
        strike_price: strike,
        call_option: {
          ltp: Math.max(2575 - strike, 0) + Math.random() * 50,
          bid: 0,
          ask: 0,
          volume: Math.floor(Math.random() * 10000),
          oi: Math.floor(Math.random() * 50000),
          iv: 0.15 + Math.random() * 0.10,
          delta: strike < 2575 ? 0.5 + Math.random() * 0.3 : 0.2 + Math.random() * 0.3,
          gamma: 0.001 + Math.random() * 0.005,
          theta: -0.05 - Math.random() * 0.03,
          vega: 0.1 + Math.random() * 0.2
        },
        put_option: {
          ltp: Math.max(strike - 2575, 0) + Math.random() * 50,
          bid: 0,
          ask: 0,
          volume: Math.floor(Math.random() * 10000),
          oi: Math.floor(Math.random() * 50000),
          iv: 0.15 + Math.random() * 0.10,
          delta: -(strike > 2575 ? 0.5 + Math.random() * 0.3 : 0.2 + Math.random() * 0.3),
          gamma: 0.001 + Math.random() * 0.005,
          theta: -0.05 - Math.random() * 0.03,
          vega: 0.1 + Math.random() * 0.2
        }
      }))
    }

    // Real API implementation would go here
    return []
  }

  /**
   * Get historical data
   */
  static async getHistoricalData(
    stockCode: string,
    exchange: 'NSE' | 'BSE' | 'NFO',
    interval: '1minute' | '5minute' | '30minute' | '1day',
    fromDate: string,
    toDate: string
  ): Promise<any[]> {
    if (this.DEMO_MODE) {
      return []
    }

    // Real API implementation would go here
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
    return credentials !== null && !!credentials.api_key
  }

  /**
   * Get supported exchanges
   */
  static getSupportedExchanges(): string[] {
    return ['NSE', 'BSE', 'NFO', 'CDS', 'MCX']
  }

  /**
   * Get supported products
   */
  static getSupportedProducts(): string[] {
    return ['cash', 'margin', 'intraday', 'delivery', 'cover_order', 'bracket_order']
  }

  /**
   * Get supported order types
   */
  static getSupportedOrderTypes(): string[] {
    return ['market', 'limit', 'stop_loss', 'stop_loss_market']
  }
}
