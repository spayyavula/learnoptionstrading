import { supabase } from '../lib/supabase'
import type { OptionsContract } from '../types/options'

const DEFAULT_GATEWAY_HOST = 'localhost'
const DEFAULT_GATEWAY_PORT = 5000

export interface IBKRCredentials {
  id: string
  user_id: string
  gateway_host: string
  gateway_port: number
  gateway_ssl: boolean
  paper_username?: string
  live_username?: string
  credentials_encrypted: string
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

export interface IBKRAccountInfo {
  accountId: string
  accountVan: string
  accountTitle: string
  displayName: string
  accountAlias: string
  accountStatus: string
  currency: string
  type: string
  tradingType: string
  capabilities: string[]
  clearingStatus: string
  covestor: boolean
  parent: any
  desc: string
}

export interface IBKRAccountSummary {
  accountcode: string
  accountready: string
  accounttype: string
  accruedcash: string
  accruedcash_c: string
  accruedcash_s: string
  availablefunds: string
  availablefunds_c: string
  availablefunds_s: string
  billable: string
  billable_c: string
  billable_s: string
  buyingpower: string
  cushion: string
  daytradesremaining: string
  daytradesremainingt1: string
  daytradesremainingt2: string
  daytradesremainingt3: string
  daytradesremainingt4: string
  equitywithloanvalue: string
  equitywithloanvalue_c: string
  equitywithloanvalue_s: string
  excessliquidity: string
  excessliquidity_c: string
  excessliquidity_s: string
  fullavailablefunds: string
  fullavailablefunds_c: string
  fullavailablefunds_s: string
  fullexcessliquidity: string
  fullexcessliquidity_c: string
  fullexcessliquidity_s: string
  fullinitmarginreq: string
  fullinitmarginreq_c: string
  fullinitmarginreq_s: string
  fullmaintmarginreq: string
  fullmaintmarginreq_c: string
  fullmaintmarginreq_s: string
  grosspositionvalue: string
  grosspositionvalue_c: string
  grosspositionvalue_s: string
  guarantee: string
  guarantee_c: string
  guarantee_s: string
  initmarginreq: string
  initmarginreq_c: string
  initmarginreq_s: string
  leverage_s: string
  lookaheadavailablefunds: string
  lookaheadavailablefunds_c: string
  lookaheadavailablefunds_s: string
  lookaheadexcessliquidity: string
  lookaheadexcessliquidity_c: string
  lookaheadexcessliquidity_s: string
  lookaheadinitmarginreq: string
  lookaheadinitmarginreq_c: string
  lookaheadinitmarginreq_s: string
  lookaheadmaintmarginreq: string
  lookaheadmaintmarginreq_c: string
  lookaheadmaintmarginreq_s: string
  lookaheadnextchange: string
  maintmarginreq: string
  maintmarginreq_c: string
  maintmarginreq_s: string
  netliquidation: string
  netliquidation_c: string
  netliquidation_s: string
  nlvandmargininreview: string
  pasharesvalue: string
  pasharesvalue_c: string
  pasharesvalue_s: string
  physicalcertificatevalue: string
  physicalcertificatevalue_c: string
  physicalcertificatevalue_s: string
  postexpirationexcess: string
  postexpirationexcess_c: string
  postexpirationexcess_s: string
  postexpirationmargin: string
  postexpirationmargin_c: string
  postexpirationmargin_s: string
  previousdayequitywithloanvalue: string
  previousdayequitywithloanvalue_c: string
  previousdayequitywithloanvalue_s: string
  segmenttitle_c: string
  segmenttitle_s: string
  totalcashvalue: string
  totalcashvalue_c: string
  totalcashvalue_s: string
  totaldebtvalue: string
  totaldebtvalue_c: string
  totaldebtvalue_s: string
  warrantsvalue: string
  warrantsvalue_c: string
  warrantsvalue_s: string
}

export interface IBKRPosition {
  acctId: string
  conid: number
  contractDesc: string
  position: number
  mktPrice: number
  mktValue: number
  currency: string
  avgCost: number
  avgPrice: number
  realizedPnl: number
  unrealizedPnl: number
  exchs: string
  expiry: string
  putOrCall: string
  multiplier: number
  strike: number
  exerciseStyle: string
  conExchMap: string[]
  assetClass: string
  undConid: number
  model: string
}

export interface IBKROrder {
  acct: string
  conidex: string
  conid: number
  account: string
  orderId: number
  cashCcy: string
  sizeAndFills: string
  orderDesc: string
  description1: string
  description2: string
  ticker: string
  secType: string
  listingExchange: string
  remainingQuantity: number
  filledQuantity: number
  totalSize: number
  companyName: string
  status: string
  order_ref: string
  avgPrice: string
  origOrderType: string
  supportsTaxOpt: string
  lastExecutionTime: string
  orderType: string
  bgColor: string
  fgColor: string
  price: number
  timeInForce: string
  lastExecutionTime_r: number
  side: string
}

export interface IBKROptionContract {
  conid: number
  symbol: string
  secType: string
  exchange: string
  right: string
  strike: number
  currency: string
  expiryDate: string
  multiplier: number
  hasOptions: boolean
}

export interface OrderRequest {
  conid: number
  orderType: 'MKT' | 'LMT' | 'STP' | 'STPLMT'
  side: 'BUY' | 'SELL'
  quantity: number
  price?: number
  tif?: 'GTC' | 'OPG' | 'DAY' | 'IOC'
  outsideRTH?: boolean
  cOID?: string
}

export class IBKRService {
  private static getGatewayUrl(credentials: IBKRCredentials): string {
    const protocol = credentials.gateway_ssl ? 'https' : 'http'
    return `${protocol}://${credentials.gateway_host}:${credentials.gateway_port}/v1/api`
  }

  private static async getCredentials(userId: string, environment: 'paper' | 'live'): Promise<IBKRCredentials | null> {
    const { data, error } = await supabase
      .from('ibkr_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('environment', environment)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error fetching IBKR credentials:', error)
      return null
    }

    return data
  }

  private static async decryptCredentials(credentials: IBKRCredentials): Promise<string | null> {
    try {
      const cryptoKey = import.meta.env.VITE_ENCRYPTION_KEY
      if (!cryptoKey) {
        console.error('Encryption key not found in environment')
        return null
      }

      return await this.decryptText(credentials.credentials_encrypted, credentials.encryption_iv, cryptoKey)
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

  private static async encryptCredentials(credentials: string): Promise<{
    credentialsEncrypted: string
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

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(credentials)
    )

    return {
      credentialsEncrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv))
    }
  }

  static async saveCredentials(
    userId: string,
    gatewayHost: string,
    gatewayPort: number,
    gatewaySsl: boolean,
    username: string,
    environment: 'paper' | 'live',
    tradingLevel: number = 0
  ): Promise<boolean> {
    try {
      const encrypted = await this.encryptCredentials(username)

      const credentialData: any = {
        user_id: userId,
        gateway_host: gatewayHost,
        gateway_port: gatewayPort,
        gateway_ssl: gatewaySsl,
        credentials_encrypted: encrypted.credentialsEncrypted,
        encryption_iv: encrypted.iv,
        environment,
        is_active: true,
        options_trading_level: tradingLevel,
        compliance_acknowledged: false
      }

      if (environment === 'paper') {
        credentialData.paper_username = username
      } else {
        credentialData.live_username = username
      }

      const { error } = await supabase
        .from('ibkr_credentials')
        .upsert(credentialData, {
          onConflict: 'user_id,environment'
        })

      if (error) throw error

      await this.logActivity(userId, 'credentials_saved', environment, {
        action: 'IBKR credentials saved',
        environment,
        gateway_host: gatewayHost,
        gateway_port: gatewayPort
      })

      return true
    } catch (error) {
      console.error('Error saving IBKR credentials:', error)
      return false
    }
  }

  private static async makeRequest(
    userId: string,
    environment: 'paper' | 'live',
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' | 'PUT' = 'GET',
    body?: any
  ): Promise<any> {
    const credentials = await this.getCredentials(userId, environment)
    if (!credentials) {
      throw new Error('IBKR credentials not found')
    }

    const baseUrl = this.getGatewayUrl(credentials)
    const url = `${baseUrl}${endpoint}`

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`IBKR API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  static async checkAuthStatus(userId: string, environment: 'paper' | 'live'): Promise<any> {
    return this.makeRequest(userId, environment, '/iserver/auth/status')
  }

  static async reauthenticate(userId: string, environment: 'paper' | 'live'): Promise<any> {
    return this.makeRequest(userId, environment, '/iserver/auth/ssodh/init', 'POST')
  }

  static async tickle(userId: string, environment: 'paper' | 'live'): Promise<any> {
    const result = await this.makeRequest(userId, environment, '/tickle', 'POST')

    await supabase
      .from('ibkr_session_tracking')
      .upsert({
        user_id: userId,
        environment,
        last_tickle_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    return result
  }

  static async logout(userId: string, environment: 'paper' | 'live'): Promise<any> {
    const result = await this.makeRequest(userId, environment, '/logout', 'POST')

    await supabase
      .from('ibkr_session_tracking')
      .update({
        authenticated: false,
        connected: false,
        gateway_status: 'disconnected'
      })
      .eq('user_id', userId)
      .eq('environment', environment)

    await this.logActivity(userId, 'logout', environment, { action: 'User logged out' })

    return result
  }

  static async getAccounts(userId: string, environment: 'paper' | 'live'): Promise<IBKRAccountInfo[]> {
    return this.makeRequest(userId, environment, '/portfolio/accounts')
  }

  static async getAccountSummary(
    userId: string,
    environment: 'paper' | 'live',
    accountId: string
  ): Promise<IBKRAccountSummary> {
    const result = await this.makeRequest(userId, environment, `/portfolio/${accountId}/summary`)

    const summary = result as IBKRAccountSummary

    await supabase
      .from('ibkr_account_info')
      .upsert({
        user_id: userId,
        account_id: accountId,
        account_number: accountId,
        buying_power: parseFloat(summary.buyingpower || '0'),
        options_buying_power: parseFloat(summary.buyingpower || '0'),
        equity: parseFloat(summary.equitywithloanvalue || '0'),
        cash: parseFloat(summary.totalcashvalue || '0'),
        portfolio_value: parseFloat(summary.netliquidation || '0'),
        net_liquidation: parseFloat(summary.netliquidation || '0'),
        available_funds: parseFloat(summary.availablefunds || '0'),
        excess_liquidity: parseFloat(summary.excessliquidity || '0'),
        day_trade_count: parseInt(summary.daytradesremainingt1 || '0'),
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    return summary
  }

  static async getPositions(
    userId: string,
    environment: 'paper' | 'live',
    accountId: string
  ): Promise<IBKRPosition[]> {
    const positions = await this.makeRequest(userId, environment, `/portfolio/${accountId}/positions/0`)

    for (const position of positions) {
      if (position.assetClass === 'OPT') {
        await supabase
          .from('ibkr_positions')
          .upsert({
            user_id: userId,
            account_id: accountId,
            conid: position.conid,
            symbol: position.contractDesc,
            underlying_symbol: position.ticker,
            asset_class: position.assetClass,
            quantity: position.position,
            avg_entry_price: position.avgCost,
            current_price: position.mktPrice,
            market_value: position.mktValue,
            cost_basis: position.avgCost * Math.abs(position.position),
            unrealized_pl: position.unrealizedPnl,
            unrealized_plpc: position.mktValue !== 0 ? (position.unrealizedPnl / Math.abs(position.mktValue)) * 100 : 0,
            realized_pl: position.realizedPnl,
            side: position.position > 0 ? 'long' : 'short',
            contract_type: position.putOrCall === 'C' ? 'call' : 'put',
            strike_price: position.strike,
            expiration_date: position.expiry,
            multiplier: position.multiplier,
            last_synced_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,account_id,conid'
          })
      }
    }

    return positions
  }

  static async searchContracts(
    userId: string,
    environment: 'paper' | 'live',
    symbol: string
  ): Promise<any[]> {
    return this.makeRequest(userId, environment, `/iserver/secdef/search?symbol=${symbol}`)
  }

  static async getContractDetails(
    userId: string,
    environment: 'paper' | 'live',
    conid: number
  ): Promise<any> {
    return this.makeRequest(userId, environment, `/iserver/contract/${conid}/info`)
  }

  static async getOptionChain(
    userId: string,
    environment: 'paper' | 'live',
    conid: number,
    exchange?: string
  ): Promise<any> {
    const exchangeParam = exchange ? `&exchange=${exchange}` : ''
    return this.makeRequest(userId, environment, `/iserver/secdef/strikes?conid=${conid}${exchangeParam}`)
  }

  static async placeOrder(
    userId: string,
    environment: 'paper' | 'live',
    accountId: string,
    orderRequest: OrderRequest
  ): Promise<any> {
    const ibkrOrder = {
      acctId: accountId,
      conid: orderRequest.conid,
      orderType: orderRequest.orderType,
      side: orderRequest.side,
      quantity: orderRequest.quantity,
      price: orderRequest.price,
      tif: orderRequest.tif || 'DAY',
      outsideRTH: orderRequest.outsideRTH || false,
      cOID: orderRequest.cOID || `OPT_${Date.now()}`
    }

    const result = await this.makeRequest(userId, environment, `/iserver/account/${accountId}/orders`, 'POST', { orders: [ibkrOrder] })

    if (result && result.length > 0) {
      const orderResponse = result[0]

      await supabase
        .from('ibkr_orders')
        .insert({
          user_id: userId,
          account_id: accountId,
          ibkr_order_id: orderResponse.order_id,
          client_order_id: ibkrOrder.cOID,
          conid: orderRequest.conid,
          symbol: orderResponse.ticker || 'UNKNOWN',
          order_type: orderRequest.orderType,
          side: orderRequest.side,
          time_in_force: ibkrOrder.tif,
          quantity: orderRequest.quantity,
          limit_price: orderRequest.price,
          status: orderResponse.order_status || 'Submitted',
          submitted_at: new Date().toISOString()
        })

      await this.logActivity(userId, 'order_placed', environment, {
        order_id: orderResponse.order_id,
        conid: orderRequest.conid,
        side: orderRequest.side,
        quantity: orderRequest.quantity,
        order_type: orderRequest.orderType
      })
    }

    return result
  }

  static async confirmOrder(
    userId: string,
    environment: 'paper' | 'live',
    replyId: string,
    confirmed: boolean
  ): Promise<any> {
    return this.makeRequest(userId, environment, `/iserver/reply/${replyId}`, 'POST', { confirmed })
  }

  static async getOrders(userId: string, environment: 'paper' | 'live'): Promise<IBKROrder[]> {
    return this.makeRequest(userId, environment, '/iserver/account/orders')
  }

  static async getOrder(
    userId: string,
    environment: 'paper' | 'live',
    orderId: string
  ): Promise<any> {
    return this.makeRequest(userId, environment, `/iserver/account/order/status/${orderId}`)
  }

  static async cancelOrder(
    userId: string,
    environment: 'paper' | 'live',
    accountId: string,
    orderId: string
  ): Promise<any> {
    const result = await this.makeRequest(userId, environment, `/iserver/account/${accountId}/order/${orderId}`, 'DELETE')

    await supabase
      .from('ibkr_orders')
      .update({
        status: 'Cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('ibkr_order_id', orderId)
      .eq('user_id', userId)

    await this.logActivity(userId, 'order_cancelled', environment, { order_id: orderId })

    return result
  }

  static async validateConnection(
    userId: string,
    environment: 'paper' | 'live'
  ): Promise<boolean> {
    try {
      const status = await this.checkAuthStatus(userId, environment)

      await supabase
        .from('ibkr_session_tracking')
        .upsert({
          user_id: userId,
          environment,
          authenticated: status.authenticated || false,
          connected: status.connected || false,
          competing: status.competing || false,
          message: status.message || '',
          last_auth_check_at: new Date().toISOString(),
          gateway_status: status.authenticated && status.connected ? 'connected' : 'disconnected'
        }, {
          onConflict: 'user_id'
        })

      return status.authenticated && status.connected
    } catch (error) {
      console.error('Connection validation failed:', error)
      return false
    }
  }

  static async syncPositions(
    userId: string,
    environment: 'paper' | 'live',
    accountId: string
  ): Promise<void> {
    try {
      const positions = await this.getPositions(userId, environment, accountId)
      console.log(`Synced ${positions.length} positions from IBKR ${environment} account`)
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
          .from('ibkr_orders')
          .upsert({
            user_id: userId,
            account_id: order.acct,
            ibkr_order_id: order.orderId.toString(),
            symbol: order.ticker,
            asset_class: order.secType,
            order_type: order.orderType,
            side: order.side,
            time_in_force: order.timeInForce,
            quantity: order.totalSize,
            filled_qty: order.filledQuantity,
            remaining_qty: order.remainingQuantity,
            filled_avg_price: parseFloat(order.avgPrice || '0'),
            status: order.status,
            submitted_at: order.lastExecutionTime
          }, {
            onConflict: 'user_id,ibkr_order_id'
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
        .from('ibkr_trading_activity_log')
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
      .from('ibkr_compliance_acknowledgments')
      .insert({
        user_id: userId,
        disclosure_type: disclosureType,
        disclosure_version: version,
        acknowledged_at: new Date().toISOString()
      })

    await supabase
      .from('ibkr_credentials')
      .update({
        compliance_acknowledged: true,
        compliance_acknowledged_at: new Date().toISOString()
      })
      .eq('user_id', userId)
  }

  static async deleteCredentials(userId: string, environment: 'paper' | 'live'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ibkr_credentials')
        .delete()
        .eq('user_id', userId)
        .eq('environment', environment)

      if (error) throw error

      await this.logActivity(userId, 'credentials_deleted', environment, {
        action: 'IBKR credentials deleted'
      })

      return true
    } catch (error) {
      console.error('Error deleting credentials:', error)
      return false
    }
  }

  static convertIBKRContractToOptionsContract(ibkrContract: IBKRPosition): OptionsContract {
    const strikePrice = ibkrContract.strike
    const lastPrice = ibkrContract.mktPrice

    return {
      contract_type: ibkrContract.putOrCall === 'C' ? 'call' : 'put',
      exercise_style: ibkrContract.exerciseStyle === 'European' ? 'european' : 'american',
      expiration_date: ibkrContract.expiry,
      shares_per_contract: ibkrContract.multiplier,
      strike_price: strikePrice,
      ticker: ibkrContract.contractDesc,
      underlying_ticker: String(ibkrContract.undConid),
      bid: lastPrice * 0.98,
      ask: lastPrice * 1.02,
      last: lastPrice,
      volume: 0,
      open_interest: 0,
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
