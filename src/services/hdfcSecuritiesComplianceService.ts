/**
 * HDFC Securities Compliance Service
 *
 * Handles regulatory compliance for HDFC Securities trading:
 * - SEBI regulations
 * - NSE/BSE trading rules
 * - Market timing validations
 * - Position limits
 * - Margin requirements
 * - Risk management
 * - Advanced order compliance (Bracket Orders, Cover Orders)
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
  productType: 'DELIVERY' | 'INTRADAY' | 'MARGIN' | 'CO' | 'BO'
  transactionType: 'BUY' | 'SELL'
  quantity: number
  price?: number
  triggerPrice?: number
  targetPrice?: number // For Bracket Orders
  stopLoss?: number // For Bracket Orders and Cover Orders
  trailingStopLoss?: number // For advanced features
}

export interface PositionLimits {
  maxPositionSize: number
  maxOrderSize: number
  maxOpenOrders: number
  maxDailyTrades: number
  maxBracketOrders: number
}

export interface MarketHours {
  isOpen: boolean
  nextOpen?: Date
  nextClose?: Date
  session: 'pre-market' | 'regular' | 'post-market' | 'closed' | 'amo'
}

export class HDFCSecuritiesComplianceService {
  // SEBI Position Limits
  private static readonly POSITION_LIMITS: Record<string, PositionLimits> = {
    'NSE': {
      maxPositionSize: 10000000, // 1 Crore
      maxOrderSize: 500000, // 5 Lakhs per order
      maxOpenOrders: 50,
      maxDailyTrades: 100,
      maxBracketOrders: 20
    },
    'BSE': {
      maxPositionSize: 10000000,
      maxOrderSize: 500000,
      maxOpenOrders: 50,
      maxDailyTrades: 100,
      maxBracketOrders: 20
    },
    'NFO': {
      maxPositionSize: 50000000, // 5 Crore for F&O
      maxOrderSize: 2500000, // 25 Lakhs per order
      maxOpenOrders: 100,
      maxDailyTrades: 200,
      maxBracketOrders: 40
    },
    'MCX': {
      maxPositionSize: 20000000,
      maxOrderSize: 1000000,
      maxOpenOrders: 50,
      maxDailyTrades: 100,
      maxBracketOrders: 20
    },
    'CDS': {
      maxPositionSize: 10000000,
      maxOrderSize: 500000,
      maxOpenOrders: 30,
      maxDailyTrades: 50,
      maxBracketOrders: 10
    }
  }

  // Indian Market Holidays 2025
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

    // 1. Check market hours and AMO
    const marketHours = this.getMarketHours(params.exchange)
    const amoCheck = this.validateAMOOrder(params, marketHours)
    violations.push(...amoCheck.violations)
    warnings.push(...amoCheck.warnings)

    // 2. Check position limits
    const positionCheck = await this.checkPositionLimits(params)
    violations.push(...positionCheck.violations)
    warnings.push(...positionCheck.warnings)

    // 3. Check order size limits
    const orderSizeCheck = this.validateOrderSize(params)
    violations.push(...orderSizeCheck.violations)
    warnings.push(...orderSizeCheck.warnings)

    // 4. Validate Bracket Order specific rules
    if (params.productType === 'BO') {
      const boCheck = this.validateBracketOrder(params)
      violations.push(...boCheck.violations)
      warnings.push(...boCheck.warnings)
    }

    // 5. Validate Cover Order specific rules
    if (params.productType === 'CO') {
      const coCheck = this.validateCoverOrder(params)
      violations.push(...coCheck.violations)
      warnings.push(...coCheck.warnings)
    }

    // 6. Check margin requirements
    const marginCheck = await this.checkMarginRequirements(params)
    violations.push(...marginCheck.violations)
    warnings.push(...marginCheck.warnings)

    // 7. Check circuit limits
    const circuitCheck = this.checkCircuitLimits(params)
    violations.push(...circuitCheck.violations)
    warnings.push(...circuitCheck.warnings)

    // 8. Check daily trade limits
    const dailyTradeCheck = await this.checkDailyTradeLimits(params)
    violations.push(...dailyTradeCheck.violations)
    warnings.push(...dailyTradeCheck.warnings)

    // 9. SEBI regulatory checks
    const sebiCheck = this.checkSEBIRegulations(params)
    violations.push(...sebiCheck.violations)
    warnings.push(...sebiCheck.warnings)

    // 10. Risk management checks
    const riskCheck = await this.checkRiskParameters(params)
    violations.push(...riskCheck.violations)
    warnings.push(...riskCheck.warnings)

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * Get current market hours for exchange (including AMO support)
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
      // AMO allowed on weekends for next trading day
      return {
        isOpen: false,
        session: 'amo'
      }
    }

    // Check if holiday
    const dateStr = istTime.toISOString().split('T')[0]
    if (this.MARKET_HOLIDAYS_2025.includes(dateStr)) {
      return {
        isOpen: false,
        session: 'amo'
      }
    }

    switch (exchange) {
      case 'NSE':
      case 'BSE':
      case 'NFO':
        // Pre-market: 9:00 AM - 9:15 AM
        if (currentMinutes >= 540 && currentMinutes < 555) {
          return { isOpen: false, session: 'pre-market' }
        }
        // Regular: 9:15 AM - 3:30 PM
        if (currentMinutes >= 555 && currentMinutes < 930) {
          return { isOpen: true, session: 'regular' }
        }
        // Post-market: 3:40 PM - 4:00 PM
        if (currentMinutes >= 940 && currentMinutes < 960) {
          return { isOpen: false, session: 'post-market' }
        }
        // After Market Orders: 4:00 PM onwards till next day 9:00 AM
        if (currentMinutes >= 960 || currentMinutes < 540) {
          return { isOpen: false, session: 'amo' }
        }
        return { isOpen: false, session: 'closed' }

      case 'CDS':
        // Currency: 9:00 AM - 5:00 PM
        if (currentMinutes >= 540 && currentMinutes < 1020) {
          return { isOpen: true, session: 'regular' }
        }
        if (currentMinutes >= 1020 || currentMinutes < 540) {
          return { isOpen: false, session: 'amo' }
        }
        return { isOpen: false, session: 'closed' }

      case 'MCX':
        // Commodities: 9:00 AM - 11:30 PM (varies by commodity)
        if (currentMinutes >= 540 && currentMinutes < 1410) {
          return { isOpen: true, session: 'regular' }
        }
        if (currentMinutes >= 1410 || currentMinutes < 540) {
          return { isOpen: false, session: 'amo' }
        }
        return { isOpen: false, session: 'closed' }

      default:
        return { isOpen: false, session: 'closed' }
    }
  }

  /**
   * Validate AMO (After Market Order) placement
   */
  private static validateAMOOrder(params: OrderValidationParams, marketHours: MarketHours): ComplianceCheckResult {
    const violations: string[] = []
    const warnings: string[] = []

    if (marketHours.session === 'amo') {
      // AMO orders must be LIMIT orders only
      if (params.orderType === 'MARKET') {
        violations.push('Market orders not allowed during AMO session. Use LIMIT orders.')
      }

      // Bracket Orders and Cover Orders not allowed in AMO
      if (params.productType === 'BO' || params.productType === 'CO') {
        violations.push('Bracket Orders and Cover Orders not allowed in AMO session.')
      }

      warnings.push('AMO order will be placed for execution at market opening.')
    } else if (!marketHours.isOpen && params.orderType === 'MARKET') {
      violations.push(`${params.exchange} market is ${marketHours.session}. Market orders not allowed.`)
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * Validate Bracket Order requirements
   */
  private static validateBracketOrder(params: OrderValidationParams): ComplianceCheckResult {
    const violations: string[] = []
    const warnings: string[] = []

    // Bracket orders must have both target and stop loss
    if (!params.targetPrice) {
      violations.push('Bracket Order requires a target price')
    }

    if (!params.stopLoss) {
      violations.push('Bracket Order requires a stop loss price')
    }

    // Validate target and stop loss are on correct sides
    if (params.transactionType === 'BUY') {
      if (params.targetPrice && params.price && params.targetPrice <= params.price) {
        violations.push('Target price must be greater than entry price for BUY orders')
      }
      if (params.stopLoss && params.price && params.stopLoss >= params.price) {
        violations.push('Stop loss must be less than entry price for BUY orders')
      }
    } else {
      if (params.targetPrice && params.price && params.targetPrice >= params.price) {
        violations.push('Target price must be less than entry price for SELL orders')
      }
      if (params.stopLoss && params.price && params.stopLoss <= params.price) {
        violations.push('Stop loss must be greater than entry price for SELL orders')
      }
    }

    // Bracket orders are intraday only
    warnings.push('Bracket Orders are intraday only and will auto-square off at 3:15 PM')

    // Validate risk-reward ratio
    if (params.price && params.targetPrice && params.stopLoss) {
      const profit = Math.abs(params.targetPrice - params.price)
      const loss = Math.abs(params.price - params.stopLoss)
      const ratio = profit / loss

      if (ratio < 1) {
        warnings.push(`Risk-reward ratio (${ratio.toFixed(2)}:1) is less than 1:1`)
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * Validate Cover Order requirements
   */
  private static validateCoverOrder(params: OrderValidationParams): ComplianceCheckResult {
    const violations: string[] = []
    const warnings: string[] = []

    // Cover orders must have stop loss
    if (!params.stopLoss && !params.triggerPrice) {
      violations.push('Cover Order requires a stop loss trigger price')
    }

    // Cover orders are intraday only
    warnings.push('Cover Orders are intraday only and will auto-square off at 3:15 PM')

    // Higher leverage with Cover Orders
    warnings.push('Cover Orders provide higher leverage but with mandatory stop loss')

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * Check position limits
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

      // Get current positions
      const { data: positions } = await supabase
        .from('hdfc_securities_positions')
        .select('*')
        .eq('user_id', params.userId)
        .eq('exchange', params.exchange)

      const totalPositionValue = positions?.reduce((sum, pos) =>
        sum + (pos.net_quantity * pos.ltp), 0) || 0

      if (totalPositionValue > limits.maxPositionSize) {
        violations.push(
          `Total position value ₹${totalPositionValue.toFixed(2)} exceeds limit ₹${limits.maxPositionSize.toFixed(2)}`
        )
      }

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

    if (params.price && orderValue > limits.maxOrderSize) {
      violations.push(
        `Order value ₹${orderValue.toFixed(2)} exceeds maximum ₹${limits.maxOrderSize.toFixed(2)}`
      )
    }

    if (params.quantity <= 0) {
      violations.push('Order quantity must be greater than zero')
    }

    // Exchange-specific checks
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
      const orderValue = params.quantity * (params.price || 0)
      let marginRequired = 0

      switch (params.productType) {
        case 'DELIVERY':
          marginRequired = orderValue
          break
        case 'MARGIN':
          marginRequired = orderValue * 0.5
          break
        case 'INTRADAY':
          marginRequired = orderValue * 0.2
          break
        case 'CO':
          // Cover orders: lower margin (typically 30-40% of intraday)
          marginRequired = orderValue * 0.07
          break
        case 'BO':
          // Bracket orders: similar to cover orders
          marginRequired = orderValue * 0.07
          break
        default:
          marginRequired = orderValue
      }

      if (marginRequired > 0) {
        warnings.push(
          `Estimated margin required: ₹${marginRequired.toFixed(2)}`
        )
      }

      // Additional margin for F&O
      if (params.exchange === 'NFO') {
        warnings.push('F&O trading requires SPAN + Exposure margin')
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
   * Check circuit limits
   */
  private static checkCircuitLimits(params: OrderValidationParams): ComplianceCheckResult {
    const violations: string[] = []
    const warnings: string[] = []

    if (params.exchange !== 'NSE' && params.exchange !== 'BSE') {
      return { isCompliant: true, violations, warnings, allowTrade: true }
    }

    if (params.orderType === 'LIMIT' && params.price) {
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

      const today = new Date().toISOString().split('T')[0]
      const { data: orders } = await supabase
        .from('hdfc_securities_orders')
        .select('*')
        .eq('user_id', params.userId)
        .eq('exchange', params.exchange)
        .gte('created_at', `${today}T00:00:00`)

      const todayOrderCount = orders?.length || 0

      if (todayOrderCount >= limits.maxDailyTrades) {
        violations.push(
          `Daily trade limit of ${limits.maxDailyTrades} orders reached (${todayOrderCount} orders placed)`
        )
      }

      if (todayOrderCount >= limits.maxDailyTrades * 0.8) {
        warnings.push(
          `Approaching daily trade limit: ${todayOrderCount}/${limits.maxDailyTrades} orders`
        )
      }

      // Check open orders
      const openOrders = orders?.filter(o =>
        o.status === 'PENDING' || o.status === 'OPEN' || o.status === 'TRIGGER PENDING'
      ).length || 0

      if (openOrders >= limits.maxOpenOrders) {
        violations.push(
          `Maximum open orders limit reached: ${openOrders}/${limits.maxOpenOrders}`
        )
      }

      // Check Bracket Order limits
      if (params.productType === 'BO') {
        const bracketOrders = orders?.filter(o => o.product_type === 'BO').length || 0
        if (bracketOrders >= limits.maxBracketOrders) {
          violations.push(
            `Maximum bracket orders limit reached: ${bracketOrders}/${limits.maxBracketOrders}`
          )
        }
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

    // Penny stock warning
    if (params.price && params.price < 10 && (params.exchange === 'NSE' || params.exchange === 'BSE')) {
      warnings.push(
        'Trading penny stock (< ₹10). Higher risk - ensure you understand the risks.'
      )
    }

    // F&O segment activation
    if (params.exchange === 'NFO') {
      warnings.push(
        'F&O trading: Ensure F&O segment is activated and knowledge assessment completed'
      )
    }

    // Intraday auto square-off
    if (params.productType === 'INTRADAY' || params.productType === 'CO' || params.productType === 'BO') {
      warnings.push(
        'Intraday position will be auto-squared off at 3:15 PM if not closed manually'
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
   * Additional risk management checks
   */
  private static async checkRiskParameters(params: OrderValidationParams): Promise<ComplianceCheckResult> {
    const violations: string[] = []
    const warnings: string[] = []

    try {
      // Check total portfolio exposure
      const { data: allPositions } = await supabase
        .from('hdfc_securities_positions')
        .select('*')
        .eq('user_id', params.userId)

      const totalExposure = allPositions?.reduce((sum, pos) =>
        sum + Math.abs(pos.net_quantity * pos.ltp), 0) || 0

      // Warn if adding significant exposure
      const orderValue = params.quantity * (params.price || 0)
      const newExposure = totalExposure + orderValue

      if (newExposure > 5000000) { // 50 Lakhs
        warnings.push(
          `Total portfolio exposure will be ₹${newExposure.toFixed(2)}. Ensure adequate risk management.`
        )
      }

    } catch (error) {
      warnings.push(`Error checking risk parameters: ${error}`)
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      allowTrade: violations.length === 0
    }
  }

  /**
   * Check if trading is allowed
   */
  static isTradingDay(date: Date = new Date()): boolean {
    const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const dayOfWeek = istDate.getDay()
    const dateStr = istDate.toISOString().split('T')[0]

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false
    }

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
        .from('hdfc_securities_sync_log')
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
