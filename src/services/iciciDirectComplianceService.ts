/**
 * ICICI Direct Compliance Service
 *
 * Handles regulatory compliance for ICICI Direct trading:
 * - SEBI regulations
 * - NSE/BSE trading rules
 * - Market timing validations
 * - Position limits
 * - Margin requirements
 * - Risk management
 */

import { supabase } from '../lib/supabase'

export interface ComplianceCheckResult {
  isCompliant: boolean
  violations: string[]
  warnings: string[]
  allowTrade: boolean
}

export interface OrderValidationParams {
  userId: string
  symbol: string
  exchange: 'NSE' | 'BSE' | 'NFO' | 'MCX' | 'CDS'
  orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M'
  product: 'CASH' | 'MARGIN' | 'INTRADAY' | 'CO'
  transactionType: 'BUY' | 'SELL'
  quantity: number
  price?: number
  triggerPrice?: number
}

export interface PositionLimits {
  maxPositionSize: number
  maxOrderSize: number
  maxOpenOrders: number
  maxDailyTrades: number
}

export interface MarketHours {
  isOpen: boolean
  nextOpen?: Date
  nextClose?: Date
  session: 'pre-market' | 'regular' | 'post-market' | 'closed'
}

export class ICICIDirectComplianceService {
  // SEBI Position Limits (Example values - adjust based on actual regulations)
  private static readonly POSITION_LIMITS: Record<string, PositionLimits> = {
    'NSE': {
      maxPositionSize: 10000000, // 1 Crore
      maxOrderSize: 500000, // 5 Lakhs per order
      maxOpenOrders: 50,
      maxDailyTrades: 100
    },
    'BSE': {
      maxPositionSize: 10000000,
      maxOrderSize: 500000,
      maxOpenOrders: 50,
      maxDailyTrades: 100
    },
    'NFO': {
      maxPositionSize: 50000000, // 5 Crore for F&O
      maxOrderSize: 2500000, // 25 Lakhs per order
      maxOpenOrders: 100,
      maxDailyTrades: 200
    },
    'MCX': {
      maxPositionSize: 20000000,
      maxOrderSize: 1000000,
      maxOpenOrders: 50,
      maxDailyTrades: 100
    },
    'CDS': {
      maxPositionSize: 10000000,
      maxOrderSize: 500000,
      maxOpenOrders: 30,
      maxDailyTrades: 50
    }
  }

  // Indian Market Holidays 2025 (Example - update annually)
  private static readonly MARKET_HOLIDAYS_2025 = [
    '2025-01-26', // Republic Day
    '2025-03-14', // Holi
    '2025-03-31', // Id-Ul-Fitr
    '2025-04-10', // Mahavir Jayanti
    '2025-04-14', // Ambedkar Jayanti
    '2025-04-18', // Good Friday
    '2025-05-01', // Maharashtra Day
    '2025-08-15', // Independence Day
    '2025-08-27', // Ganesh Chaturthi
    '2025-10-02', // Gandhi Jayanti
    '2025-10-20', // Dussehra
    '2025-10-21', // Diwali Laxmi Puja
    '2025-10-22', // Diwali Balipratipada
    '2025-11-05', // Guru Nanak Jayanti
    '2025-12-25'  // Christmas
  ]

  /**
   * Main compliance check for order placement
   */
  static async validateOrder(params: OrderValidationParams): Promise<ComplianceCheckResult> {
    const violations: string[] = []
    const warnings: string[] = []

    // 1. Check market hours
    const marketHours = this.getMarketHours(params.exchange)
    if (!marketHours.isOpen && params.orderType !== 'LIMIT') {
      violations.push(`${params.exchange} market is ${marketHours.session}. Market orders not allowed.`)
    }

    // 2. Check position limits
    const positionCheck = await this.checkPositionLimits(params)
    violations.push(...positionCheck.violations)
    warnings.push(...positionCheck.warnings)

    // 3. Check order size limits
    const orderSizeCheck = this.validateOrderSize(params)
    violations.push(...orderSizeCheck.violations)
    warnings.push(...orderSizeCheck.warnings)

    // 4. Check margin requirements
    const marginCheck = await this.checkMarginRequirements(params)
    violations.push(...marginCheck.violations)
    warnings.push(...marginCheck.warnings)

    // 5. Check circuit limits
    const circuitCheck = this.checkCircuitLimits(params)
    violations.push(...circuitCheck.violations)
    warnings.push(...circuitCheck.warnings)

    // 6. Check daily trade limits
    const dailyTradeCheck = await this.checkDailyTradeLimits(params)
    violations.push(...dailyTradeCheck.violations)
    warnings.push(...dailyTradeCheck.warnings)

    // 7. SEBI regulatory checks
    const sebiCheck = this.checkSEBIRegulations(params)
    violations.push(...sebiCheck.violations)
    warnings.push(...sebiCheck.warnings)

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * Get current market hours for exchange
   */
  static getMarketHours(exchange: string): MarketHours {
    const now = new Date()
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const hours = istTime.getHours()
    const minutes = istTime.getMinutes()
    const currentMinutes = hours * 60 + minutes
    const dayOfWeek = istTime.getDay()

    // Check if weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        isOpen: false,
        session: 'closed'
      }
    }

    // Check if holiday
    const dateStr = istTime.toISOString().split('T')[0]
    if (this.MARKET_HOLIDAYS_2025.includes(dateStr)) {
      return {
        isOpen: false,
        session: 'closed'
      }
    }

    // Different timings for different exchanges
    switch (exchange) {
      case 'NSE':
      case 'BSE':
      case 'NFO':
        // Pre-market: 9:00 AM - 9:15 AM (540-555 minutes)
        if (currentMinutes >= 540 && currentMinutes < 555) {
          return { isOpen: false, session: 'pre-market' }
        }
        // Regular: 9:15 AM - 3:30 PM (555-930 minutes)
        if (currentMinutes >= 555 && currentMinutes < 930) {
          return { isOpen: true, session: 'regular' }
        }
        // Post-market: 3:40 PM - 4:00 PM (940-960 minutes)
        if (currentMinutes >= 940 && currentMinutes < 960) {
          return { isOpen: false, session: 'post-market' }
        }
        return { isOpen: false, session: 'closed' }

      case 'CDS':
        // Currency: 9:00 AM - 5:00 PM
        if (currentMinutes >= 540 && currentMinutes < 1020) {
          return { isOpen: true, session: 'regular' }
        }
        return { isOpen: false, session: 'closed' }

      case 'MCX':
        // Commodities have extended hours (varies by commodity)
        // Simplified: 9:00 AM - 11:30 PM
        if (currentMinutes >= 540 && currentMinutes < 1410) {
          return { isOpen: true, session: 'regular' }
        }
        return { isOpen: false, session: 'closed' }

      default:
        return { isOpen: false, session: 'closed' }
    }
  }

  /**
   * Check position limits against SEBI regulations
   */
  private static async checkPositionLimits(params: OrderValidationParams): Promise<ComplianceCheckResult> {
    const violations: string[] = []
    const warnings: string[] = []

    try {
      const limits = this.POSITION_LIMITS[params.exchange]
      if (!limits) {
        warnings.push(`No position limits defined for exchange ${params.exchange}`)
        return { isCompliant: true, violations, warnings, allowTrade: true }
      }

      // Get current positions for user
      const { data: positions } = await supabase
        .from('icici_direct_positions')
        .select('*')
        .eq('user_id', params.userId)
        .eq('exchange_code', params.exchange)

      const totalPositionValue = positions?.reduce((sum, pos) =>
        sum + (pos.net_quantity * pos.ltp), 0) || 0

      // Check total position size
      if (totalPositionValue > limits.maxPositionSize) {
        violations.push(
          `Total position value ₹${totalPositionValue.toFixed(2)} exceeds limit ₹${limits.maxPositionSize.toFixed(2)}`
        )
      }

      // Warn if approaching limit (80%)
      if (totalPositionValue > limits.maxPositionSize * 0.8) {
        warnings.push(
          `Position value at ${((totalPositionValue / limits.maxPositionSize) * 100).toFixed(1)}% of limit`
        )
      }

    } catch (error) {
      warnings.push(`Error checking position limits: ${error}`)
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * Validate order size
   */
  private static validateOrderSize(params: OrderValidationParams): ComplianceCheckResult {
    const violations: string[] = []
    const warnings: string[] = []

    const limits = this.POSITION_LIMITS[params.exchange]
    if (!limits) {
      return { isCompliant: true, violations, warnings, allowTrade: true }
    }

    const orderValue = params.quantity * (params.price || 0)

    // Check order size limit
    if (params.price && orderValue > limits.maxOrderSize) {
      violations.push(
        `Order value ₹${orderValue.toFixed(2)} exceeds maximum ₹${limits.maxOrderSize.toFixed(2)}`
      )
    }

    // Minimum quantity check
    if (params.quantity <= 0) {
      violations.push('Order quantity must be greater than zero')
    }

    // Maximum quantity check (exchange-specific)
    if (params.exchange === 'NFO' && params.quantity > 10000) {
      violations.push('F&O order quantity exceeds maximum lot size limits')
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * Check margin requirements
   */
  private static async checkMarginRequirements(params: OrderValidationParams): Promise<ComplianceCheckResult> {
    const violations: string[] = []
    const warnings: string[] = []

    try {
      // Get account details to check available margin
      const { data: account } = await supabase
        .from('icici_direct_credentials')
        .select('*')
        .eq('user_id', params.userId)
        .single()

      if (!account) {
        warnings.push('Unable to verify margin requirements - account not found')
        return { isCompliant: true, violations, warnings, allowTrade: true }
      }

      // Calculate required margin based on product type
      let marginRequired = 0
      const orderValue = params.quantity * (params.price || 0)

      switch (params.product) {
        case 'CASH':
          // 100% margin for delivery
          marginRequired = orderValue
          break
        case 'MARGIN':
          // Typically 50% margin
          marginRequired = orderValue * 0.5
          break
        case 'INTRADAY':
          // Typically 20% margin for intraday
          marginRequired = orderValue * 0.2
          break
        case 'CO':
          // Cover orders have lower margin (typically 40% of intraday)
          marginRequired = orderValue * 0.08
          break
        default:
          marginRequired = orderValue
      }

      // Note: In production, you'd fetch actual available margin from ICICI API
      // For now, we'll just warn about margin requirements
      if (marginRequired > 0) {
        warnings.push(
          `Estimated margin required: ₹${marginRequired.toFixed(2)}`
        )
      }

    } catch (error) {
      warnings.push(`Error checking margin requirements: ${error}`)
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * Check circuit limits (5%, 10%, 20% bands)
   */
  private static checkCircuitLimits(params: OrderValidationParams): ComplianceCheckResult {
    const violations: string[] = []
    const warnings: string[] = []

    // Circuit limits only apply to limit orders in equity markets
    if (params.exchange !== 'NSE' && params.exchange !== 'BSE') {
      return { isCompliant: true, violations, warnings, allowTrade: true }
    }

    if (params.orderType === 'LIMIT' && params.price) {
      // Note: In production, you'd fetch the current LTP and circuit limits from API
      // For now, we'll just add a warning
      warnings.push(
        'Ensure order price is within circuit limits (±5%, ±10%, or ±20% based on stock)'
      )
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * Check daily trade limits
   */
  private static async checkDailyTradeLimits(params: OrderValidationParams): Promise<ComplianceCheckResult> {
    const violations: string[] = []
    const warnings: string[] = []

    try {
      const limits = this.POSITION_LIMITS[params.exchange]
      if (!limits) {
        return { isCompliant: true, violations, warnings, allowTrade: true }
      }

      // Get today's orders
      const today = new Date().toISOString().split('T')[0]
      const { data: orders } = await supabase
        .from('icici_direct_orders')
        .select('*')
        .eq('user_id', params.userId)
        .eq('exchange_code', params.exchange)
        .gte('created_at', `${today}T00:00:00`)

      const todayOrderCount = orders?.length || 0

      // Check daily trade limit
      if (todayOrderCount >= limits.maxDailyTrades) {
        violations.push(
          `Daily trade limit of ${limits.maxDailyTrades} orders reached (${todayOrderCount} orders placed)`
        )
      }

      // Warn if approaching limit
      if (todayOrderCount >= limits.maxDailyTrades * 0.8) {
        warnings.push(
          `Approaching daily trade limit: ${todayOrderCount}/${limits.maxDailyTrades} orders`
        )
      }

      // Check open orders limit
      const openOrders = orders?.filter(o =>
        o.status === 'PENDING' || o.status === 'OPEN' || o.status === 'TRIGGER PENDING'
      ).length || 0

      if (openOrders >= limits.maxOpenOrders) {
        violations.push(
          `Maximum open orders limit reached: ${openOrders}/${limits.maxOpenOrders}`
        )
      }

    } catch (error) {
      warnings.push(`Error checking daily trade limits: ${error}`)
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * SEBI Regulatory Checks
   */
  private static checkSEBIRegulations(params: OrderValidationParams): ComplianceCheckResult {
    const violations: string[] = []
    const warnings: string[] = []

    // Check for penny stock restrictions (stocks trading below ₹10)
    if (params.price && params.price < 10 && (params.exchange === 'NSE' || params.exchange === 'BSE')) {
      warnings.push(
        'Trading penny stock (< ₹10). Higher risk - ensure you understand the risks.'
      )
    }

    // Check for F&O specific rules
    if (params.exchange === 'NFO') {
      warnings.push(
        'F&O trading: Ensure you have activated F&O segment and completed knowledge assessment'
      )
    }

    // Intraday auto square-off warning
    if (params.product === 'INTRADAY' || params.product === 'CO') {
      warnings.push(
        'Intraday position will be auto-squared off at 3:15 PM if not closed manually'
      )
    }

    // Cover Order specific rules
    if (params.product === 'CO' && !params.triggerPrice) {
      violations.push(
        'Cover Orders require a stop loss trigger price'
      )
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * Check if trading is allowed on current date
   */
  static isTradingDay(date: Date = new Date()): boolean {
    const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const dayOfWeek = istDate.getDay()
    const dateStr = istDate.toISOString().split('T')[0]

    // Check weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false
    }

    // Check holiday
    if (this.MARKET_HOLIDAYS_2025.includes(dateStr)) {
      return false
    }

    return true
  }

  /**
   * Get next trading day
   */
  static getNextTradingDay(): Date {
    let nextDay = new Date()
    nextDay.setDate(nextDay.getDate() + 1)

    while (!this.isTradingDay(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1)
    }

    return nextDay
  }

  /**
   * Log compliance check for audit trail
   */
  static async logComplianceCheck(
    userId: string,
    checkType: string,
    result: ComplianceCheckResult,
    orderParams: OrderValidationParams
  ): Promise<void> {
    try {
      await supabase
        .from('icici_direct_sync_log')
        .insert({
          user_id: userId,
          sync_type: `compliance_${checkType}`,
          status: result.isCompliant ? 'success' : 'failed',
          error_message: result.violations.join('; ') || null,
          environment: 'live'
        })
    } catch (error) {
      console.error('Error logging compliance check:', error)
    }
  }
}
