import type { OptionsContract } from '../types/options'

export interface StrategyLeg {
  contract: OptionsContract
  action: 'buy' | 'sell'
  quantity: number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  maxProfit?: number
  maxLoss?: number
  breakEvenPoints?: number[]
  netDebit?: number
  netCredit?: number
}

export interface StrategyRequirement {
  minLegs: number
  maxLegs: number
  requiredTypes: Array<'call' | 'put' | 'both'>
  requiresSameExpiration: boolean
  description: string
}

const STRATEGY_REQUIREMENTS: Record<string, StrategyRequirement> = {
  'Bull Call Spread': {
    minLegs: 2,
    maxLegs: 2,
    requiredTypes: ['call', 'call'],
    requiresSameExpiration: true,
    description: 'Requires buying a call at lower strike and selling a call at higher strike'
  },
  'Bear Put Spread': {
    minLegs: 2,
    maxLegs: 2,
    requiredTypes: ['put', 'put'],
    requiresSameExpiration: true,
    description: 'Requires buying a put at higher strike and selling a put at lower strike'
  },
  'Straddle': {
    minLegs: 2,
    maxLegs: 2,
    requiredTypes: ['call', 'put'],
    requiresSameExpiration: true,
    description: 'Requires buying a call and put at the same strike price'
  },
  'Long Straddle': {
    minLegs: 2,
    maxLegs: 2,
    requiredTypes: ['call', 'put'],
    requiresSameExpiration: true,
    description: 'Requires buying a call and put at the same strike price'
  },
  'Strangle': {
    minLegs: 2,
    maxLegs: 2,
    requiredTypes: ['call', 'put'],
    requiresSameExpiration: true,
    description: 'Requires buying a call and put at different strike prices'
  },
  'Long Strangle': {
    minLegs: 2,
    maxLegs: 2,
    requiredTypes: ['call', 'put'],
    requiresSameExpiration: true,
    description: 'Requires buying a call and put at different strike prices'
  },
  'Iron Condor': {
    minLegs: 4,
    maxLegs: 4,
    requiredTypes: ['put', 'put', 'call', 'call'],
    requiresSameExpiration: true,
    description: 'Requires 4 legs: buy put, sell put, sell call, buy call'
  },
  'Butterfly Spread': {
    minLegs: 3,
    maxLegs: 4,
    requiredTypes: ['call', 'call', 'call'],
    requiresSameExpiration: true,
    description: 'Requires buying 1 lower strike, selling 2 middle strike, buying 1 higher strike'
  },
  'Iron Butterfly': {
    minLegs: 4,
    maxLegs: 4,
    requiredTypes: ['put', 'put', 'call', 'call'],
    requiresSameExpiration: true,
    description: 'Requires 4 legs at 3 strikes with center ATM'
  }
}

export class StrategyValidationService {
  static getRequirements(strategyName: string): StrategyRequirement | null {
    return STRATEGY_REQUIREMENTS[strategyName] || null
  }

  static validateBullCallSpread(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 2) {
      errors.push('Bull Call Spread requires exactly 2 legs')
      return { isValid: false, errors, warnings }
    }

    const buyLeg = legs.find(l => l.action === 'buy')
    const sellLeg = legs.find(l => l.action === 'sell')

    if (!buyLeg || !sellLeg) {
      errors.push('Must have one buy leg and one sell leg')
      return { isValid: false, errors, warnings }
    }

    if (buyLeg.contract.contract_type !== 'call' || sellLeg.contract.contract_type !== 'call') {
      errors.push('Both legs must be call options')
    }

    if (buyLeg.contract.underlying_ticker !== sellLeg.contract.underlying_ticker) {
      errors.push('Both legs must have the same underlying asset')
    }

    if (buyLeg.contract.expiration_date !== sellLeg.contract.expiration_date) {
      errors.push('Both legs must have the same expiration date')
    }

    if (buyLeg.contract.strike_price >= sellLeg.contract.strike_price) {
      errors.push('Buy call strike must be lower than sell call strike')
    }

    if (buyLeg.quantity !== sellLeg.quantity) {
      errors.push('Both legs must have the same quantity')
    }

    if (buyLeg.contract.ticker === sellLeg.contract.ticker) {
      errors.push('Cannot use the same contract for both legs')
    }

    if (buyLeg.contract.open_interest === 0 && buyLeg.contract.volume === 0) {
      warnings.push('Buy leg has low liquidity')
    }

    if (sellLeg.contract.open_interest === 0 && sellLeg.contract.volume === 0) {
      warnings.push('Sell leg has low liquidity')
    }

    const netDebit = (buyLeg.contract.last - sellLeg.contract.last) * buyLeg.quantity * 100
    const maxProfit = ((sellLeg.contract.strike_price - buyLeg.contract.strike_price) * buyLeg.quantity * 100) - netDebit
    const maxLoss = netDebit
    const breakEven = buyLeg.contract.strike_price + ((buyLeg.contract.last - sellLeg.contract.last))

    if (maxProfit <= 0) {
      warnings.push('This spread has no profit potential at current prices')
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit,
      maxLoss,
      breakEvenPoints: [breakEven],
      netDebit
    }
  }

  static validateBearPutSpread(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 2) {
      errors.push('Bear Put Spread requires exactly 2 legs')
      return { isValid: false, errors, warnings }
    }

    const buyLeg = legs.find(l => l.action === 'buy')
    const sellLeg = legs.find(l => l.action === 'sell')

    if (!buyLeg || !sellLeg) {
      errors.push('Must have one buy leg and one sell leg')
      return { isValid: false, errors, warnings }
    }

    if (buyLeg.contract.contract_type !== 'put' || sellLeg.contract.contract_type !== 'put') {
      errors.push('Both legs must be put options')
    }

    if (buyLeg.contract.underlying_ticker !== sellLeg.contract.underlying_ticker) {
      errors.push('Both legs must have the same underlying asset')
    }

    if (buyLeg.contract.expiration_date !== sellLeg.contract.expiration_date) {
      errors.push('Both legs must have the same expiration date')
    }

    if (buyLeg.contract.strike_price <= sellLeg.contract.strike_price) {
      errors.push('Buy put strike must be higher than sell put strike')
    }

    if (buyLeg.quantity !== sellLeg.quantity) {
      errors.push('Both legs must have the same quantity')
    }

    if (buyLeg.contract.ticker === sellLeg.contract.ticker) {
      errors.push('Cannot use the same contract for both legs')
    }

    if (buyLeg.contract.open_interest === 0 && buyLeg.contract.volume === 0) {
      warnings.push('Buy leg has low liquidity')
    }

    if (sellLeg.contract.open_interest === 0 && sellLeg.contract.volume === 0) {
      warnings.push('Sell leg has low liquidity')
    }

    const netDebit = (buyLeg.contract.last - sellLeg.contract.last) * buyLeg.quantity * 100
    const maxProfit = ((buyLeg.contract.strike_price - sellLeg.contract.strike_price) * buyLeg.quantity * 100) - netDebit
    const maxLoss = netDebit
    const breakEven = buyLeg.contract.strike_price - ((buyLeg.contract.last - sellLeg.contract.last))

    if (maxProfit <= 0) {
      warnings.push('This spread has no profit potential at current prices')
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit,
      maxLoss,
      breakEvenPoints: [breakEven],
      netDebit
    }
  }

  static validateStraddle(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 2) {
      errors.push('Straddle requires exactly 2 legs')
      return { isValid: false, errors, warnings }
    }

    const callLeg = legs.find(l => l.contract.contract_type === 'call')
    const putLeg = legs.find(l => l.contract.contract_type === 'put')

    if (!callLeg || !putLeg) {
      errors.push('Must have one call and one put')
      return { isValid: false, errors, warnings }
    }

    if (callLeg.action !== 'buy' || putLeg.action !== 'buy') {
      errors.push('Both legs must be buys for a long straddle')
    }

    if (callLeg.contract.underlying_ticker !== putLeg.contract.underlying_ticker) {
      errors.push('Both legs must have the same underlying asset')
    }

    if (callLeg.contract.expiration_date !== putLeg.contract.expiration_date) {
      errors.push('Both legs must have the same expiration date')
    }

    if (callLeg.contract.strike_price !== putLeg.contract.strike_price) {
      errors.push('Call and put must have the same strike price for a straddle')
    }

    if (callLeg.quantity !== putLeg.quantity) {
      errors.push('Both legs must have the same quantity')
    }

    const netDebit = (callLeg.contract.last + putLeg.contract.last) * callLeg.quantity * 100
    const breakEvenUpper = callLeg.contract.strike_price + (callLeg.contract.last + putLeg.contract.last)
    const breakEvenLower = callLeg.contract.strike_price - (callLeg.contract.last + putLeg.contract.last)

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit: Infinity,
      maxLoss: netDebit,
      breakEvenPoints: [breakEvenLower, breakEvenUpper],
      netDebit
    }
  }

  static validateStrangle(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 2) {
      errors.push('Strangle requires exactly 2 legs')
      return { isValid: false, errors, warnings }
    }

    const callLeg = legs.find(l => l.contract.contract_type === 'call')
    const putLeg = legs.find(l => l.contract.contract_type === 'put')

    if (!callLeg || !putLeg) {
      errors.push('Must have one call and one put')
      return { isValid: false, errors, warnings }
    }

    if (callLeg.action !== 'buy' || putLeg.action !== 'buy') {
      errors.push('Both legs must be buys for a long strangle')
    }

    if (callLeg.contract.underlying_ticker !== putLeg.contract.underlying_ticker) {
      errors.push('Both legs must have the same underlying asset')
    }

    if (callLeg.contract.expiration_date !== putLeg.contract.expiration_date) {
      errors.push('Both legs must have the same expiration date')
    }

    if (callLeg.contract.strike_price === putLeg.contract.strike_price) {
      warnings.push('Call and put have the same strike - this is a straddle, not a strangle')
    }

    if (callLeg.contract.strike_price < putLeg.contract.strike_price) {
      errors.push('Call strike must be higher than put strike for a strangle')
    }

    if (callLeg.quantity !== putLeg.quantity) {
      errors.push('Both legs must have the same quantity')
    }

    const netDebit = (callLeg.contract.last + putLeg.contract.last) * callLeg.quantity * 100
    const breakEvenUpper = callLeg.contract.strike_price + (callLeg.contract.last + putLeg.contract.last)
    const breakEvenLower = putLeg.contract.strike_price - (callLeg.contract.last + putLeg.contract.last)

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit: Infinity,
      maxLoss: netDebit,
      breakEvenPoints: [breakEvenLower, breakEvenUpper],
      netDebit
    }
  }

  static validateIronCondor(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 4) {
      errors.push('Iron Condor requires exactly 4 legs')
      return { isValid: false, errors, warnings }
    }

    const puts = legs.filter(l => l.contract.contract_type === 'put')
    const calls = legs.filter(l => l.contract.contract_type === 'call')

    if (puts.length !== 2 || calls.length !== 2) {
      errors.push('Must have 2 puts and 2 calls')
      return { isValid: false, errors, warnings }
    }

    const underlying = legs[0].contract.underlying_ticker
    const expiration = legs[0].contract.expiration_date

    for (const leg of legs) {
      if (leg.contract.underlying_ticker !== underlying) {
        errors.push('All legs must have the same underlying asset')
        break
      }
      if (leg.contract.expiration_date !== expiration) {
        errors.push('All legs must have the same expiration date')
        break
      }
    }

    const sortedPuts = puts.sort((a, b) => a.contract.strike_price - b.contract.strike_price)
    const sortedCalls = calls.sort((a, b) => a.contract.strike_price - b.contract.strike_price)

    if (sortedPuts[0].action !== 'buy' || sortedPuts[1].action !== 'sell') {
      errors.push('Lower put should be bought, higher put should be sold')
    }

    if (sortedCalls[0].action !== 'sell' || sortedCalls[1].action !== 'buy') {
      errors.push('Lower call should be sold, higher call should be bought')
    }

    if (sortedPuts[1].contract.strike_price >= sortedCalls[0].contract.strike_price) {
      errors.push('Put spread strikes should be below call spread strikes')
    }

    const netCredit = legs.reduce((sum, leg) => {
      const sign = leg.action === 'sell' ? 1 : -1
      return sum + (sign * leg.contract.last * leg.quantity * 100)
    }, 0)

    const putSpreadWidth = (sortedPuts[1].contract.strike_price - sortedPuts[0].contract.strike_price) * 100
    const callSpreadWidth = (sortedCalls[1].contract.strike_price - sortedCalls[0].contract.strike_price) * 100
    const maxLoss = Math.max(putSpreadWidth, callSpreadWidth) - netCredit

    if (netCredit <= 0) {
      warnings.push('Iron Condor should be a net credit strategy')
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit: netCredit,
      maxLoss: maxLoss,
      breakEvenPoints: [
        sortedPuts[1].contract.strike_price - (netCredit / 100),
        sortedCalls[0].contract.strike_price + (netCredit / 100)
      ],
      netCredit
    }
  }

  static validateButterflySpread(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length < 3 || legs.length > 4) {
      errors.push('Butterfly Spread requires 3 or 4 legs')
      return { isValid: false, errors, warnings }
    }

    const underlying = legs[0].contract.underlying_ticker
    const expiration = legs[0].contract.expiration_date
    const contractType = legs[0].contract.contract_type

    for (const leg of legs) {
      if (leg.contract.underlying_ticker !== underlying) {
        errors.push('All legs must have the same underlying asset')
        break
      }
      if (leg.contract.expiration_date !== expiration) {
        errors.push('All legs must have the same expiration date')
        break
      }
      if (leg.contract.contract_type !== contractType) {
        errors.push('All legs must be the same type (all calls or all puts)')
        break
      }
    }

    const strikes = legs.map(l => l.contract.strike_price).sort((a, b) => a - b)
    const uniqueStrikes = [...new Set(strikes)]

    if (uniqueStrikes.length !== 3) {
      errors.push('Butterfly requires exactly 3 different strike prices')
    }

    const netDebit = legs.reduce((sum, leg) => {
      const sign = leg.action === 'buy' ? -1 : 1
      return sum + (sign * leg.contract.last * leg.quantity * 100)
    }, 0)

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit: Math.abs(netDebit),
      maxLoss: Math.abs(netDebit),
      netDebit: Math.abs(netDebit)
    }
  }

  static validateStrategy(strategyName: string, legs: StrategyLeg[]): ValidationResult {
    if (legs.length === 0) {
      return {
        isValid: false,
        errors: ['No legs selected'],
        warnings: []
      }
    }

    switch (strategyName) {
      case 'Bull Call Spread':
        return this.validateBullCallSpread(legs)
      case 'Bear Put Spread':
        return this.validateBearPutSpread(legs)
      case 'Straddle':
      case 'Long Straddle':
        return this.validateStraddle(legs)
      case 'Strangle':
      case 'Long Strangle':
        return this.validateStrangle(legs)
      case 'Iron Condor':
        return this.validateIronCondor(legs)
      case 'Butterfly Spread':
        return this.validateButterflySpread(legs)
      case 'Long Call':
      case 'Long Put':
      case 'Cash-Secured Put':
      case 'Covered Call':
        if (legs.length !== 1) {
          return {
            isValid: false,
            errors: ['Single-leg strategy requires exactly 1 contract'],
            warnings: []
          }
        }
        return {
          isValid: true,
          errors: [],
          warnings: [],
          netDebit: legs[0].contract.last * legs[0].quantity * 100
        }
      default:
        return {
          isValid: false,
          errors: [`Unknown strategy: ${strategyName}`],
          warnings: []
        }
    }
  }

  static isSingleLegStrategy(strategyName: string): boolean {
    return ['Long Call', 'Long Put', 'Cash-Secured Put', 'Covered Call'].includes(strategyName)
  }

  static isMultiLegStrategy(strategyName: string): boolean {
    return !this.isSingleLegStrategy(strategyName)
  }
}
