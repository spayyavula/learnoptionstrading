import { BlackScholesService, OptionPricingResult } from './blackScholesService'
import { OptionsContract } from '../types/options'

export interface GreeksData {
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  price: number
  impliedVolatility: number
}

export interface StrategyGreeks {
  netDelta: number
  netGamma: number
  netTheta: number
  netVega: number
  netRho: number
  totalCost: number
  legs: Array<{
    contract: OptionsContract
    action: 'buy' | 'sell'
    quantity: number
    greeks: GreeksData
  }>
}

export class GreeksCalculator {
  private static DEFAULT_RISK_FREE_RATE = 0.05

  static calculateGreeks(
    contract: OptionsContract,
    underlyingPrice: number,
    riskFreeRate: number = this.DEFAULT_RISK_FREE_RATE
  ): GreeksData {
    const strikePrice = contract.strike_price
    const impliedVolatility = contract.implied_volatility || 0.3
    const timeToExpiry = this.calculateTimeToExpiry(contract.expiration_date)
    const isCall = contract.contract_type === 'call'

    if (timeToExpiry <= 0) {
      return {
        delta: isCall ? (underlyingPrice > strikePrice ? 1 : 0) : (underlyingPrice < strikePrice ? -1 : 0),
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
        price: Math.max(0, isCall ? underlyingPrice - strikePrice : strikePrice - underlyingPrice),
        impliedVolatility
      }
    }

    try {
      const result = BlackScholesService.calculateOptionPrice(
        underlyingPrice,
        strikePrice,
        timeToExpiry,
        riskFreeRate,
        impliedVolatility,
        isCall
      )

      return {
        delta: result.delta,
        gamma: result.gamma,
        theta: result.theta,
        vega: result.vega,
        rho: result.rho,
        price: result.price,
        impliedVolatility
      }
    } catch (error) {
      console.error('Error calculating Greeks:', error)
      return {
        delta: contract.delta || 0,
        gamma: contract.gamma || 0,
        theta: contract.theta || 0,
        vega: contract.vega || 0,
        rho: 0,
        price: contract.last,
        impliedVolatility
      }
    }
  }

  static calculateTimeToExpiry(expirationDate: string): number {
    const expiry = new Date(expirationDate)
    const now = new Date()
    const daysToExpiry = Math.max(0, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysToExpiry / 365
  }

  static calculateStrategyGreeks(
    legs: Array<{
      contract: OptionsContract
      action: 'buy' | 'sell'
      quantity: number
    }>,
    underlyingPrice: number,
    riskFreeRate: number = this.DEFAULT_RISK_FREE_RATE
  ): StrategyGreeks {
    let netDelta = 0
    let netGamma = 0
    let netTheta = 0
    let netVega = 0
    let netRho = 0
    let totalCost = 0

    const legsWithGreeks = legs.map(leg => {
      const greeks = this.calculateGreeks(leg.contract, underlyingPrice, riskFreeRate)
      const multiplier = leg.action === 'buy' ? 1 : -1
      const quantity = leg.quantity

      netDelta += greeks.delta * multiplier * quantity
      netGamma += greeks.gamma * multiplier * quantity
      netTheta += greeks.theta * multiplier * quantity
      netVega += greeks.vega * multiplier * quantity
      netRho += greeks.rho * multiplier * quantity

      const legCost = greeks.price * quantity * 100 * multiplier
      totalCost += legCost

      return {
        contract: leg.contract,
        action: leg.action,
        quantity: leg.quantity,
        greeks
      }
    })

    return {
      netDelta,
      netGamma,
      netTheta,
      netVega,
      netRho,
      totalCost,
      legs: legsWithGreeks
    }
  }

  static calculateScenarioGreeks(
    contract: OptionsContract,
    underlyingPrice: number,
    scenario: {
      underlyingPriceChange?: number
      volatilityChange?: number
      daysPassed?: number
    },
    riskFreeRate: number = this.DEFAULT_RISK_FREE_RATE
  ): GreeksData {
    const adjustedUnderlyingPrice = underlyingPrice * (1 + (scenario.underlyingPriceChange || 0))
    const currentIV = contract.implied_volatility || 0.3
    const adjustedVolatility = currentIV * (1 + (scenario.volatilityChange || 0))

    const originalTimeToExpiry = this.calculateTimeToExpiry(contract.expiration_date)
    const adjustedTimeToExpiry = Math.max(0, originalTimeToExpiry - (scenario.daysPassed || 0) / 365)

    if (adjustedTimeToExpiry <= 0) {
      const isCall = contract.contract_type === 'call'
      return {
        delta: isCall ? (adjustedUnderlyingPrice > contract.strike_price ? 1 : 0) : (adjustedUnderlyingPrice < contract.strike_price ? -1 : 0),
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
        price: Math.max(0, isCall ? adjustedUnderlyingPrice - contract.strike_price : contract.strike_price - adjustedUnderlyingPrice),
        impliedVolatility: adjustedVolatility
      }
    }

    try {
      const result = BlackScholesService.calculateOptionPrice(
        adjustedUnderlyingPrice,
        contract.strike_price,
        adjustedTimeToExpiry,
        riskFreeRate,
        adjustedVolatility,
        contract.contract_type === 'call'
      )

      return {
        delta: result.delta,
        gamma: result.gamma,
        theta: result.theta,
        vega: result.vega,
        rho: result.rho,
        price: result.price,
        impliedVolatility: adjustedVolatility
      }
    } catch (error) {
      console.error('Error calculating scenario Greeks:', error)
      return this.calculateGreeks(contract, underlyingPrice, riskFreeRate)
    }
  }

  static calculateGreeksSensitivity(
    contract: OptionsContract,
    underlyingPrice: number,
    priceRange: { min: number; max: number; steps: number },
    riskFreeRate: number = this.DEFAULT_RISK_FREE_RATE
  ): Array<{
    price: number
    delta: number
    gamma: number
    theta: number
    vega: number
  }> {
    const results = []
    const priceStep = (priceRange.max - priceRange.min) / priceRange.steps

    for (let i = 0; i <= priceRange.steps; i++) {
      const price = priceRange.min + i * priceStep
      const greeks = this.calculateGreeks(contract, price, riskFreeRate)

      results.push({
        price,
        delta: greeks.delta,
        gamma: greeks.gamma,
        theta: greeks.theta,
        vega: greeks.vega
      })
    }

    return results
  }

  static formatGreek(value: number, greekType: 'delta' | 'gamma' | 'theta' | 'vega' | 'rho'): string {
    switch (greekType) {
      case 'delta':
        return value.toFixed(4)
      case 'gamma':
        return value.toFixed(5)
      case 'theta':
        return value.toFixed(4)
      case 'vega':
        return value.toFixed(4)
      case 'rho':
        return value.toFixed(4)
      default:
        return value.toFixed(4)
    }
  }

  static getGreekInterpretation(
    value: number,
    greekType: 'delta' | 'gamma' | 'theta' | 'vega' | 'rho'
  ): { label: string; color: string; description: string } {
    switch (greekType) {
      case 'delta':
        if (value > 0.7) return { label: 'Deep ITM', color: 'green', description: 'Behaves like stock' }
        if (value > 0.5) return { label: 'ITM', color: 'green', description: 'Strong directional exposure' }
        if (value > 0.3) return { label: 'Near ATM', color: 'yellow', description: 'Moderate directional exposure' }
        if (value > 0) return { label: 'OTM', color: 'orange', description: 'Lower probability' }
        if (value > -0.3) return { label: 'OTM Put', color: 'orange', description: 'Lower probability' }
        if (value > -0.5) return { label: 'Near ATM', color: 'yellow', description: 'Moderate exposure' }
        if (value > -0.7) return { label: 'ITM Put', color: 'green', description: 'Strong downside exposure' }
        return { label: 'Deep ITM', color: 'green', description: 'Strong downside exposure' }

      case 'gamma':
        if (value > 0.1) return { label: 'Very High', color: 'red', description: 'Rapid delta changes' }
        if (value > 0.05) return { label: 'High', color: 'orange', description: 'Significant acceleration' }
        if (value > 0.02) return { label: 'Moderate', color: 'yellow', description: 'Standard acceleration' }
        return { label: 'Low', color: 'green', description: 'Stable delta' }

      case 'theta':
        if (value < -0.5) return { label: 'Rapid Decay', color: 'red', description: 'Losing value quickly' }
        if (value < -0.2) return { label: 'High Decay', color: 'orange', description: 'Notable time decay' }
        if (value < -0.05) return { label: 'Moderate Decay', color: 'yellow', description: 'Standard decay' }
        if (value < 0) return { label: 'Low Decay', color: 'green', description: 'Minimal decay' }
        return { label: 'Positive', color: 'green', description: 'Earning theta' }

      case 'vega':
        if (value > 0.5) return { label: 'Very Sensitive', color: 'red', description: 'High volatility risk' }
        if (value > 0.3) return { label: 'Sensitive', color: 'orange', description: 'Moderate vol risk' }
        if (value > 0.1) return { label: 'Moderate', color: 'yellow', description: 'Some vol exposure' }
        return { label: 'Low', color: 'green', description: 'Limited vol risk' }

      case 'rho':
        if (Math.abs(value) > 0.5) return { label: 'High Sensitivity', color: 'orange', description: 'Rate sensitive' }
        if (Math.abs(value) > 0.2) return { label: 'Moderate', color: 'yellow', description: 'Some rate exposure' }
        return { label: 'Low', color: 'green', description: 'Limited rate risk' }

      default:
        return { label: 'Unknown', color: 'gray', description: '' }
    }
  }
}
