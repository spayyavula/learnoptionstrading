import { supabase } from '../lib/supabase'
import type { AlpacaAccountInfo } from './alpacaService'

export interface ComplianceCheckResult {
  passed: boolean
  type: string
  message: string
  details?: any
  severity: 'error' | 'warning' | 'info'
}

export interface PatternDayTraderStatus {
  isPatternDayTrader: boolean
  dayTradeCount: number
  dayTradesRemaining: number
  equityRequirement: number
  currentEquity: number
  meetsRequirement: boolean
  warning?: string
}

export interface TradingLevelRestrictions {
  level: number
  canTrade: boolean
  allowedStrategies: string[]
  restrictions: string[]
}

export class AlpacaComplianceService {
  private static readonly PDT_THRESHOLD = 4
  private static readonly PDT_EQUITY_REQUIREMENT = 25000
  private static readonly TRADING_DAYS_WINDOW = 5

  static async checkPatternDayTraderStatus(
    userId: string,
    accountInfo: AlpacaAccountInfo
  ): Promise<PatternDayTraderStatus> {
    const dayTradeCount = accountInfo.daytrade_count || 0
    const equity = parseFloat(accountInfo.equity)
    const isPatternDayTrader = accountInfo.pattern_day_trader || dayTradeCount >= this.PDT_THRESHOLD
    const meetsRequirement = equity >= this.PDT_EQUITY_REQUIREMENT

    const status: PatternDayTraderStatus = {
      isPatternDayTrader,
      dayTradeCount,
      dayTradesRemaining: Math.max(0, this.PDT_THRESHOLD - dayTradeCount - 1),
      equityRequirement: this.PDT_EQUITY_REQUIREMENT,
      currentEquity: equity,
      meetsRequirement
    }

    if (isPatternDayTrader && !meetsRequirement) {
      status.warning = `Pattern Day Trader status requires minimum $${this.PDT_EQUITY_REQUIREMENT.toLocaleString()} equity. Current equity: $${equity.toLocaleString()}`
    } else if (dayTradeCount >= this.PDT_THRESHOLD - 1 && dayTradeCount < this.PDT_THRESHOLD) {
      status.warning = `Warning: You have ${dayTradeCount} day trades. One more day trade will flag your account as a Pattern Day Trader, requiring $${this.PDT_EQUITY_REQUIREMENT.toLocaleString()} minimum equity.`
    }

    await this.logComplianceCheck(userId, 'pdt_check', {
      passed: meetsRequirement || !isPatternDayTrader,
      ...status
    })

    return status
  }

  static async checkBuyingPower(
    userId: string,
    requiredAmount: number,
    accountInfo: AlpacaAccountInfo
  ): Promise<ComplianceCheckResult> {
    const buyingPower = parseFloat(accountInfo.buying_power)
    const optionsBuyingPower = parseFloat(accountInfo.options_buying_power || '0')
    const availablePower = Math.max(buyingPower, optionsBuyingPower)

    const passed = availablePower >= requiredAmount
    const message = passed
      ? `Sufficient buying power available: $${availablePower.toFixed(2)}`
      : `Insufficient buying power. Required: $${requiredAmount.toFixed(2)}, Available: $${availablePower.toFixed(2)}`

    await this.logComplianceCheck(userId, 'buying_power_check', {
      passed,
      required: requiredAmount,
      available: availablePower,
      message
    })

    return {
      passed,
      type: 'buying_power',
      message,
      severity: passed ? 'info' : 'error',
      details: {
        required: requiredAmount,
        available: availablePower,
        buyingPower,
        optionsBuyingPower
      }
    }
  }

  static async checkTradingLevel(
    userId: string,
    requiredLevel: number,
    accountInfo: AlpacaAccountInfo
  ): Promise<ComplianceCheckResult> {
    const currentLevel = accountInfo.options_approved_level || 0
    const passed = currentLevel >= requiredLevel

    const message = passed
      ? `Trading level ${currentLevel} approved for this strategy`
      : `Trading level ${requiredLevel} required. Current level: ${currentLevel}`

    await this.logComplianceCheck(userId, 'trading_level_check', {
      passed,
      required: requiredLevel,
      current: currentLevel,
      message
    })

    return {
      passed,
      type: 'trading_level',
      message,
      severity: passed ? 'info' : 'error',
      details: {
        required: requiredLevel,
        current: currentLevel,
        restrictions: this.getTradingLevelRestrictions(currentLevel)
      }
    }
  }

  static getTradingLevelRestrictions(level: number): TradingLevelRestrictions {
    const restrictions: { [key: number]: TradingLevelRestrictions } = {
      0: {
        level: 0,
        canTrade: false,
        allowedStrategies: [],
        restrictions: ['Options trading not approved']
      },
      1: {
        level: 1,
        canTrade: true,
        allowedStrategies: ['Covered Calls', 'Cash-Secured Puts'],
        restrictions: [
          'Can only sell covered calls (must own underlying stock)',
          'Can only sell cash-secured puts (must have cash collateral)',
          'Cannot buy calls or puts',
          'Cannot use spreads or multi-leg strategies'
        ]
      },
      2: {
        level: 2,
        canTrade: true,
        allowedStrategies: ['Buy Calls', 'Buy Puts', 'Covered Calls', 'Cash-Secured Puts'],
        restrictions: [
          'Can buy calls and puts for speculation',
          'Can sell covered calls and cash-secured puts',
          'Cannot use spreads or multi-leg strategies',
          'Cannot sell naked options'
        ]
      },
      3: {
        level: 3,
        canTrade: true,
        allowedStrategies: [
          'All Level 1 & 2 Strategies',
          'Vertical Spreads',
          'Calendar Spreads',
          'Diagonal Spreads',
          'Iron Condors',
          'Butterflies',
          'Straddles',
          'Strangles'
        ],
        restrictions: [
          'Can use all common spread strategies',
          'Cannot sell naked options (unless approved separately)',
          'Multi-leg orders must be submitted as a single order'
        ]
      }
    }

    return restrictions[level] || restrictions[0]
  }

  static async validateOptionsOrder(
    userId: string,
    orderDetails: {
      symbol: string
      side: 'buy' | 'sell'
      quantity: number
      price?: number
      strategy?: string
    },
    accountInfo: AlpacaAccountInfo
  ): Promise<ComplianceCheckResult[]> {
    const results: ComplianceCheckResult[] = []

    if (!Number.isInteger(orderDetails.quantity)) {
      results.push({
        passed: false,
        type: 'quantity_validation',
        message: 'Options orders must have whole number quantities',
        severity: 'error'
      })
    }

    if (orderDetails.quantity <= 0) {
      results.push({
        passed: false,
        type: 'quantity_validation',
        message: 'Order quantity must be greater than zero',
        severity: 'error'
      })
    }

    const estimatedCost = (orderDetails.price || 0) * orderDetails.quantity * 100
    if (estimatedCost > 0) {
      const buyingPowerCheck = await this.checkBuyingPower(userId, estimatedCost, accountInfo)
      results.push(buyingPowerCheck)
    }

    const pdtStatus = await this.checkPatternDayTraderStatus(userId, accountInfo)
    if (pdtStatus.warning) {
      results.push({
        passed: true,
        type: 'pdt_warning',
        message: pdtStatus.warning,
        severity: 'warning',
        details: pdtStatus
      })
    }

    const levelCheck = await this.checkTradingLevel(userId, 2, accountInfo)
    results.push(levelCheck)

    return results
  }

  static async checkDayTradeLimit(
    userId: string,
    accountInfo: AlpacaAccountInfo
  ): Promise<ComplianceCheckResult> {
    const dayTradeCount = accountInfo.daytrade_count || 0
    const equity = parseFloat(accountInfo.equity)
    const isPatternDayTrader = accountInfo.pattern_day_trader

    if (isPatternDayTrader && equity < this.PDT_EQUITY_REQUIREMENT) {
      return {
        passed: false,
        type: 'day_trade_limit',
        message: `Pattern Day Trader account requires minimum $${this.PDT_EQUITY_REQUIREMENT.toLocaleString()} equity. Current equity: $${equity.toLocaleString()}`,
        severity: 'error',
        details: {
          isPatternDayTrader,
          equity,
          required: this.PDT_EQUITY_REQUIREMENT,
          dayTradeCount
        }
      }
    }

    if (!isPatternDayTrader && dayTradeCount >= this.PDT_THRESHOLD - 1) {
      return {
        passed: true,
        type: 'day_trade_warning',
        message: `Warning: You have ${dayTradeCount} day trades in the last ${this.TRADING_DAYS_WINDOW} days. One more will trigger Pattern Day Trader rules.`,
        severity: 'warning',
        details: {
          dayTradeCount,
          threshold: this.PDT_THRESHOLD,
          remainingTrades: this.PDT_THRESHOLD - dayTradeCount - 1
        }
      }
    }

    return {
      passed: true,
      type: 'day_trade_check',
      message: `Day trade count: ${dayTradeCount} (limit: ${this.PDT_THRESHOLD - 1} for non-PDT accounts)`,
      severity: 'info',
      details: {
        dayTradeCount,
        threshold: this.PDT_THRESHOLD,
        remainingTrades: Math.max(0, this.PDT_THRESHOLD - dayTradeCount - 1)
      }
    }
  }

  static async validateMarginRequirements(
    userId: string,
    positions: any[],
    accountInfo: AlpacaAccountInfo
  ): Promise<ComplianceCheckResult> {
    const equity = parseFloat(accountInfo.equity)
    const buyingPower = parseFloat(accountInfo.buying_power)
    const multiplier = parseFloat(accountInfo.multiplier || '1')

    const totalPositionValue = positions.reduce((sum, pos) => {
      return sum + Math.abs(parseFloat(pos.market_value || '0'))
    }, 0)

    const requiredMargin = totalPositionValue / multiplier
    const availableMargin = equity

    const passed = availableMargin >= requiredMargin

    await this.logComplianceCheck(userId, 'margin_check', {
      passed,
      equity,
      requiredMargin,
      availableMargin,
      totalPositionValue
    })

    return {
      passed,
      type: 'margin_requirement',
      message: passed
        ? 'Margin requirements met'
        : `Insufficient margin. Required: $${requiredMargin.toFixed(2)}, Available: $${availableMargin.toFixed(2)}`,
      severity: passed ? 'info' : 'error',
      details: {
        equity,
        buyingPower,
        requiredMargin,
        availableMargin,
        totalPositionValue,
        multiplier
      }
    }
  }

  static async performPreTradeCompliance(
    userId: string,
    orderDetails: any,
    accountInfo: AlpacaAccountInfo
  ): Promise<{ canProceed: boolean; checks: ComplianceCheckResult[] }> {
    const checks: ComplianceCheckResult[] = []

    const validationResults = await this.validateOptionsOrder(userId, orderDetails, accountInfo)
    checks.push(...validationResults)

    const dayTradeCheck = await this.checkDayTradeLimit(userId, accountInfo)
    checks.push(dayTradeCheck)

    const canProceed = checks.every(check => check.severity !== 'error')

    return { canProceed, checks }
  }

  private static async logComplianceCheck(
    userId: string,
    complianceType: string,
    details: any
  ): Promise<void> {
    try {
      const checkResult = details.passed ? 'passed' : (details.warning ? 'warning' : 'failed')

      await supabase
        .from('trading_compliance_log')
        .insert({
          user_id: userId,
          compliance_type: complianceType,
          check_result: checkResult,
          details,
          action_taken: details.passed ? 'approved' : 'blocked',
          trade_date: new Date().toISOString().split('T')[0]
        })
    } catch (error) {
      console.error('Error logging compliance check:', error)
    }
  }

  static async getComplianceSummary(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('trading_compliance_log')
      .select('*')
      .eq('user_id', userId)
      .gte('trade_date', startDate.toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching compliance summary:', error)
      return null
    }

    const summary = {
      totalChecks: data.length,
      passed: data.filter(c => c.check_result === 'passed').length,
      failed: data.filter(c => c.check_result === 'failed').length,
      warnings: data.filter(c => c.check_result === 'warning').length,
      recentChecks: data.slice(0, 10)
    }

    return summary
  }

  static getRegulatoryDisclosure(disclosureType: 'options_risk' | 'pdt_rules' | 'margin_trading'): {
    title: string
    content: string
    version: string
  } {
    const disclosures = {
      options_risk: {
        title: 'Options Trading Risk Disclosure',
        version: '1.0',
        content: `
# Options Trading Risk Disclosure

Options trading involves significant risk and is not suitable for all investors. Before trading options, you should carefully consider your investment objectives, level of experience, and risk tolerance.

## Key Risks:

1. **Total Loss of Premium**: When buying options, you may lose your entire investment if the option expires worthless.

2. **Unlimited Loss Potential**: Selling naked options exposes you to potentially unlimited losses if the market moves against your position.

3. **Time Decay**: Options lose value as they approach expiration, even if the underlying asset price remains stable.

4. **Complexity**: Options strategies can be complex and may not perform as expected in volatile markets.

5. **Leverage**: Options provide leverage, which can amplify both gains and losses.

## Important Considerations:

- Only invest money you can afford to lose
- Fully understand the strategy before placing trades
- Monitor positions regularly, especially near expiration
- Be aware of assignment risk for short options positions
- Understand the tax implications of options trading

By proceeding with options trading, you acknowledge that you have read and understood these risks.
        `
      },
      pdt_rules: {
        title: 'Pattern Day Trader Rules',
        version: '1.0',
        content: `
# Pattern Day Trader (PDT) Rules

## Definition

A Pattern Day Trader is defined by FINRA as anyone who executes 4 or more day trades within 5 business days, provided the number of day trades is more than 6% of total trades in the account during that period.

## Day Trade Definition

A day trade occurs when you buy and sell (or sell and buy) the same security on the same day in a margin account.

## Requirements for Pattern Day Traders:

1. **Minimum Equity**: You must maintain at least $25,000 in equity in your account at all times.

2. **Buying Power**: Pattern Day Traders have up to 4x the maintenance margin excess as of the close of business on the previous day.

3. **Margin Call**: If your account falls below $25,000, you will receive a margin call and cannot day trade until you bring the account back to $25,000.

## Consequences of Violations:

- Your account may be restricted from day trading for 90 days
- You will only be able to trade on a cash-available basis
- Additional violations may result in further restrictions

## How to Avoid PDT Status:

- Limit day trades to 3 or fewer within any 5-business-day period
- Maintain minimum $25,000 equity if you plan to day trade regularly
- Hold positions overnight instead of closing same-day
- Use a cash account (no day trade restrictions, but trades settle T+2)

By acknowledging this disclosure, you confirm that you understand the Pattern Day Trader rules and their implications.
        `
      },
      margin_trading: {
        title: 'Margin Trading Agreement',
        version: '1.0',
        content: `
# Margin Trading Risk Disclosure

Trading on margin involves borrowing funds from your broker to purchase securities. This increases both potential gains and potential losses.

## Key Risks:

1. **Magnified Losses**: Losses can exceed your initial investment when trading on margin.

2. **Margin Calls**: If your account value falls below the maintenance requirement, you will receive a margin call and may be forced to liquidate positions at unfavorable prices.

3. **Interest Charges**: You will pay interest on borrowed funds, which can reduce or eliminate profits.

4. **Forced Liquidation**: Your broker can sell your securities without notice to meet margin requirements.

5. **No Control Over Liquidation**: You cannot choose which securities are sold in a margin call situation.

## Margin Requirements:

- Initial requirement: Typically 50% of purchase price
- Maintenance requirement: Typically 25% of current market value (may be higher for options)
- Options-specific requirements vary by strategy

## Important Notes:

- Monitor your account regularly to avoid margin calls
- Understand that market volatility can trigger margin calls
- Have a plan for meeting margin calls quickly
- Consider the cost of margin interest in your trading strategy

By proceeding with margin trading, you acknowledge the risks and agree to maintain required margin levels.
        `
      }
    }

    return disclosures[disclosureType]
  }
}
