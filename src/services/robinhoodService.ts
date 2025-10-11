import { supabase } from '../lib/supabase'

const ROBINHOOD_API_BASE_URL = 'https://trading.robinhood.com/api/v1'

export interface RobinhoodCredentials {
  id: string
  user_id: string
  private_key_encrypted: string
  public_key_encrypted: string
  api_key_encrypted: string
  encryption_iv: string
  environment: 'live' | 'paper'
  is_active: boolean
  compliance_acknowledged: boolean
  compliance_acknowledged_at?: string
  last_validated_at?: string
  created_at: string
  updated_at: string
}

export interface RobinhoodAccountInfo {
  account_id: string
  buying_power: string
  cash: string
  crypto_buying_power: string
}

export interface RobinhoodHolding {
  account_id: string
  asset_code: string
  asset_currency_id: string
  cost_bases: Array<{
    direct_cost_basis: string
    direct_quantity: string
    id: string
    intra_day_cost_basis: string
    intra_day_quantity: string
  }>
  created_at: string
  id: string
  quantity: string
  quantity_available_for_trading: string
  quantity_held_for_buy: string
  quantity_held_for_sell: string
  updated_at: string
}

export interface RobinhoodOrder {
  id: string
  account_id: string
  average_price: string | null
  cancel_url: string | null
  created_at: string
  cumulative_quantity: string
  entered_price: string | null
  executions: any[]
  quantity: string
  ref_id: string
  rounded_executed_notional: string | null
  side: 'buy' | 'sell'
  state: string
  symbol: string
  time_in_force: string
  type: 'market' | 'limit' | 'stop_limit' | 'stop_loss'
  updated_at: string
}

export interface RobinhoodOrderRequest {
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop_limit' | 'stop_loss'
  quantity: string
  price?: string
  stop_price?: string
  time_in_force?: 'gtc' | 'ioc'
  client_order_id?: string
}

export interface RobinhoodBestBidAsk {
  ask_inclusive_of_buy_spread: string
  bid_inclusive_of_sell_spread: string
  high_price_24_h: string
  low_price_24_h: string
  mark_price: string
  open_price_24_h: string
  symbol: string
  volume_24_h: string
}

export class RobinhoodService {
  private static async getCredentials(userId: string, environment: 'live' | 'paper'): Promise<RobinhoodCredentials | null> {
    const { data, error } = await supabase
      .from('robinhood_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('environment', environment)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error fetching Robinhood credentials:', error)
      return null
    }

    return data
  }

  private static async decryptCredentials(credentials: RobinhoodCredentials): Promise<{
    privateKey: string
    publicKey: string
    apiKey: string
  } | null> {
    try {
      const cryptoKey = import.meta.env.VITE_ENCRYPTION_KEY
      if (!cryptoKey) {
        console.error('Encryption key not found in environment')
        return null
      }

      const privateKey = await this.decryptText(credentials.private_key_encrypted, credentials.encryption_iv, cryptoKey)
      const publicKey = await this.decryptText(credentials.public_key_encrypted, credentials.encryption_iv, cryptoKey)
      const apiKey = await this.decryptText(credentials.api_key_encrypted, credentials.encryption_iv, cryptoKey)

      return { privateKey, publicKey, apiKey }
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

  private static async encryptCredentials(
    privateKey: string,
    publicKey: string,
    apiKey: string
  ): Promise<{
    privateKeyEncrypted: string
    publicKeyEncrypted: string
    apiKeyEncrypted: string
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

    const encryptedPrivateKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(privateKey)
    )

    const encryptedPublicKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(publicKey)
    )

    const encryptedApiKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(apiKey)
    )

    return {
      privateKeyEncrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedPrivateKey))),
      publicKeyEncrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedPublicKey))),
      apiKeyEncrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedApiKey))),
      iv: btoa(String.fromCharCode(...iv))
    }
  }

  static async saveCredentials(
    userId: string,
    privateKey: string,
    publicKey: string,
    apiKey: string,
    environment: 'live' | 'paper' = 'live'
  ): Promise<boolean> {
    try {
      const encrypted = await this.encryptCredentials(privateKey, publicKey, apiKey)

      const { error } = await supabase
        .from('robinhood_credentials')
        .upsert({
          user_id: userId,
          private_key_encrypted: encrypted.privateKeyEncrypted,
          public_key_encrypted: encrypted.publicKeyEncrypted,
          api_key_encrypted: encrypted.apiKeyEncrypted,
          encryption_iv: encrypted.iv,
          environment,
          is_active: true,
          compliance_acknowledged: false
        }, {
          onConflict: 'user_id,environment'
        })

      if (error) throw error

      await this.logActivity(userId, 'credentials_saved', environment, {
        action: 'Robinhood credentials saved',
        environment
      })

      return true
    } catch (error) {
      console.error('Error saving Robinhood credentials:', error)
      return false
    }
  }

  private static async generateAuthSignature(
    method: string,
    path: string,
    timestamp: number,
    body: string,
    privateKey: string
  ): Promise<string> {
    const encoder = new TextEncoder()
    const message = `${method}${path}${timestamp}${body}`

    const pemHeader = '-----BEGIN PRIVATE KEY-----'
    const pemFooter = '-----END PRIVATE KEY-----'
    const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '')

    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      cryptoKey,
      encoder.encode(message)
    )

    return btoa(String.fromCharCode(...new Uint8Array(signature)))
  }

  private static async makeRequest(
    userId: string,
    environment: 'live' | 'paper',
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    const credentials = await this.getCredentials(userId, environment)
    if (!credentials) {
      throw new Error('Robinhood credentials not found')
    }

    const decrypted = await this.decryptCredentials(credentials)
    if (!decrypted) {
      throw new Error('Failed to decrypt Robinhood credentials')
    }

    const baseUrl = import.meta.env.VITE_ROBINHOOD_API_BASE_URL || ROBINHOOD_API_BASE_URL
    const url = `${baseUrl}${endpoint}`
    const timestamp = Date.now()
    const bodyString = body ? JSON.stringify(body) : ''

    const signature = await this.generateAuthSignature(
      method,
      endpoint,
      timestamp,
      bodyString,
      decrypted.privateKey
    )

    const headers = {
      'x-api-key': decrypted.apiKey,
      'x-signature': signature,
      'x-timestamp': timestamp.toString(),
      'Content-Type': 'application/json'
    }

    const options: RequestInit = {
      method,
      headers
    }

    if (body && method !== 'GET') {
      options.body = bodyString
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Robinhood API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  static async getAccount(userId: string, environment: 'live' | 'paper'): Promise<RobinhoodAccountInfo> {
    const account = await this.makeRequest(userId, environment, '/account')

    await supabase
      .from('robinhood_account_info')
      .upsert({
        user_id: userId,
        account_id: account.account_id || account.id,
        buying_power: parseFloat(account.buying_power || account.crypto_buying_power || '0'),
        cash_balance: parseFloat(account.cash || '0'),
        portfolio_value: parseFloat(account.portfolio_value || '0'),
        total_equity: parseFloat(account.equity || account.portfolio_value || '0'),
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    return account
  }

  static async getHoldings(userId: string, environment: 'live' | 'paper'): Promise<RobinhoodHolding[]> {
    const holdings = await this.makeRequest(userId, environment, '/holdings')

    const holdingsArray = holdings.results || holdings

    for (const holding of holdingsArray) {
      const costBasis = holding.cost_bases?.[0]
      const avgCostBasis = costBasis
        ? parseFloat(costBasis.direct_cost_basis) / parseFloat(costBasis.direct_quantity)
        : 0

      await supabase
        .from('robinhood_holdings')
        .upsert({
          user_id: userId,
          symbol: holding.asset_code,
          asset_name: holding.asset_currency_id,
          asset_code: holding.asset_code,
          quantity: parseFloat(holding.quantity),
          quantity_available: parseFloat(holding.quantity_available_for_trading || holding.quantity),
          avg_cost_basis: avgCostBasis,
          cost_basis_total: costBasis ? parseFloat(costBasis.direct_cost_basis) : 0,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,symbol'
        })
    }

    return holdingsArray
  }

  static async getBestBidAsk(
    userId: string,
    environment: 'live' | 'paper',
    symbols: string[]
  ): Promise<RobinhoodBestBidAsk[]> {
    const symbolParam = symbols.join(',')
    return this.makeRequest(userId, environment, `/market_data/best_bid_ask/?symbol=${symbolParam}`)
  }

  static async getEstimatedPrice(
    userId: string,
    environment: 'live' | 'paper',
    symbol: string,
    side: 'buy' | 'sell',
    quantity: string
  ): Promise<any> {
    return this.makeRequest(
      userId,
      environment,
      `/market_data/estimated_price/?symbol=${symbol}&side=${side}&quantity=${quantity}`
    )
  }

  static async placeOrder(
    userId: string,
    environment: 'live' | 'paper',
    orderRequest: RobinhoodOrderRequest
  ): Promise<RobinhoodOrder> {
    const order = await this.makeRequest(userId, environment, '/orders', 'POST', {
      ...orderRequest,
      client_order_id: orderRequest.client_order_id || `RH_${Date.now()}`
    })

    await supabase
      .from('robinhood_orders')
      .insert({
        user_id: userId,
        robinhood_order_id: order.id,
        client_order_id: order.ref_id,
        symbol: order.symbol,
        asset_code: order.symbol,
        order_type: order.type,
        side: order.side,
        quantity: parseFloat(order.quantity),
        limit_price: order.entered_price ? parseFloat(order.entered_price) : null,
        filled_qty: parseFloat(order.cumulative_quantity || '0'),
        filled_avg_price: order.average_price ? parseFloat(order.average_price) : null,
        status: order.state,
        submitted_at: order.created_at
      })

    await this.logActivity(userId, 'order_placed', environment, {
      order_id: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      type: order.type
    })

    return order
  }

  static async getOrder(userId: string, environment: 'live' | 'paper', orderId: string): Promise<RobinhoodOrder> {
    return this.makeRequest(userId, environment, `/orders/${orderId}`)
  }

  static async getOrders(
    userId: string,
    environment: 'live' | 'paper',
    filters?: { symbol?: string; status?: string }
  ): Promise<RobinhoodOrder[]> {
    let endpoint = '/orders'
    const params = new URLSearchParams()

    if (filters?.symbol) params.append('symbol', filters.symbol)
    if (filters?.status) params.append('status', filters.status)

    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    const response = await this.makeRequest(userId, environment, endpoint)
    return response.results || response
  }

  static async cancelOrder(userId: string, environment: 'live' | 'paper', orderId: string): Promise<void> {
    await this.makeRequest(userId, environment, `/orders/${orderId}`, 'DELETE')

    await supabase
      .from('robinhood_orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('robinhood_order_id', orderId)
      .eq('user_id', userId)

    await this.logActivity(userId, 'order_cancelled', environment, { order_id: orderId })
  }

  static async validateCredentials(
    userId: string,
    environment: 'live' | 'paper'
  ): Promise<boolean> {
    try {
      await this.getAccount(userId, environment)

      await supabase
        .from('robinhood_credentials')
        .update({ last_validated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('environment', environment)

      return true
    } catch (error) {
      console.error('Credential validation failed:', error)
      return false
    }
  }

  static async syncHoldings(userId: string, environment: 'live' | 'paper'): Promise<void> {
    try {
      const holdings = await this.getHoldings(userId, environment)
      console.log(`Synced ${holdings.length} holdings from Robinhood ${environment} account`)
    } catch (error) {
      console.error('Error syncing holdings:', error)
      throw error
    }
  }

  static async syncOrders(userId: string, environment: 'live' | 'paper'): Promise<void> {
    try {
      const orders = await this.getOrders(userId, environment)

      for (const order of orders) {
        await supabase
          .from('robinhood_orders')
          .upsert({
            user_id: userId,
            robinhood_order_id: order.id,
            client_order_id: order.ref_id,
            symbol: order.symbol,
            asset_code: order.symbol,
            order_type: order.type,
            side: order.side,
            quantity: parseFloat(order.quantity),
            limit_price: order.entered_price ? parseFloat(order.entered_price) : null,
            filled_qty: parseFloat(order.cumulative_quantity || '0'),
            filled_avg_price: order.average_price ? parseFloat(order.average_price) : null,
            remaining_qty: parseFloat(order.quantity) - parseFloat(order.cumulative_quantity || '0'),
            status: order.state,
            submitted_at: order.created_at,
            filled_at: order.updated_at
          }, {
            onConflict: 'user_id,robinhood_order_id'
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
    environment: 'live' | 'paper',
    metadata: any
  ): Promise<void> {
    try {
      await supabase
        .from('robinhood_trading_activity_log')
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
      .from('robinhood_compliance_acknowledgments')
      .insert({
        user_id: userId,
        disclosure_type: disclosureType,
        disclosure_version: version,
        acknowledged_at: new Date().toISOString()
      })

    await supabase
      .from('robinhood_credentials')
      .update({
        compliance_acknowledged: true,
        compliance_acknowledged_at: new Date().toISOString()
      })
      .eq('user_id', userId)
  }

  static async deleteCredentials(userId: string, environment: 'live' | 'paper'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('robinhood_credentials')
        .delete()
        .eq('user_id', userId)
        .eq('environment', environment)

      if (error) throw error

      await this.logActivity(userId, 'credentials_deleted', environment, {
        action: 'Robinhood credentials deleted'
      })

      return true
    } catch (error) {
      console.error('Error deleting credentials:', error)
      return false
    }
  }
}
