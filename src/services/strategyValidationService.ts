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
  'Bear Call Spread': {
    minLegs: 2,
    maxLegs: 2,
    requiredTypes: ['call', 'call'],
    requiresSameExpiration: true,
    description: 'Requires selling a call at lower strike and buying a call at higher strike'
  },
  'Buy Put': {
    minLegs: 1,
    maxLegs: 1,
    requiredTypes: ['put'],
    requiresSameExpiration: true,
    description: 'Single long put position'
  },
  'Sell Call': {
    minLegs: 1,
    maxLegs: 1,
    requiredTypes: ['call'],
    requiresSameExpiration: true,
    description: 'Single short call position (unlimited risk)'
  },
  'Put Ratio Back Spread': {
    minLegs: 2,
    maxLegs: 3,
    requiredTypes: ['put', 'put'],
    requiresSameExpiration: true,
    description: 'Sell one put, buy multiple puts at lower strike'
  },
  'Long Calendar with Puts': {
    minLegs: 2,
    maxLegs: 2,
    requiredTypes: ['put', 'put'],
    requiresSameExpiration: false,
    description: 'Sell near-term put, buy longer-term put at same strike'
  },
  'Bear Condor': {
    minLegs: 4,
    maxLegs: 4,
    requiredTypes: ['put', 'put', 'call', 'call'],
    requiresSameExpiration: true,
    description: 'Four-leg bearish range strategy'
  },
  'Bear Butterfly': {
    minLegs: 3,
    maxLegs: 4,
    requiredTypes: ['put', 'put', 'put'],
    requiresSameExpiration: true,
    description: 'Three-strike bearish butterfly with puts'
  },
  'Risk Reversal': {
    minLegs: 2,
    maxLegs: 2,
    requiredTypes: ['put', 'call'],
    requiresSameExpiration: true,
    description: 'Buy put and sell call for synthetic short'
  },
  'Short Synthetic Future': {
    minLegs: 2,
    maxLegs: 2,
    requiredTypes: ['call', 'put'],
    requiresSameExpiration: true,
    description: 'Sell call and buy put at same strike'
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

  static validateBearCallSpread(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 2) {
      errors.push('Bear Call Spread requires exactly 2 legs')
      return { isValid: false, errors, warnings }
    }

    const sellLeg = legs.find(l => l.action === 'sell')
    const buyLeg = legs.find(l => l.action === 'buy')

    if (!sellLeg || !buyLeg) {
      errors.push('Must have one sell leg and one buy leg')
      return { isValid: false, errors, warnings }
    }

    if (sellLeg.contract.contract_type !== 'call' || buyLeg.contract.contract_type !== 'call') {
      errors.push('Both legs must be call options')
    }

    if (sellLeg.contract.underlying_ticker !== buyLeg.contract.underlying_ticker) {
      errors.push('Both legs must have the same underlying asset')
    }

    if (sellLeg.contract.expiration_date !== buyLeg.contract.expiration_date) {
      errors.push('Both legs must have the same expiration date')
    }

    if (sellLeg.contract.strike_price >= buyLeg.contract.strike_price) {
      errors.push('Sell call strike must be lower than buy call strike')
    }

    if (sellLeg.quantity !== buyLeg.quantity) {
      errors.push('Both legs must have the same quantity')
    }

    const netCredit = (sellLeg.contract.last - buyLeg.contract.last) * sellLeg.quantity * 100
    const maxProfit = netCredit
    const maxLoss = ((buyLeg.contract.strike_price - sellLeg.contract.strike_price) * sellLeg.quantity * 100) - netCredit
    const breakEven = sellLeg.contract.strike_price + ((sellLeg.contract.last - buyLeg.contract.last))

    if (netCredit <= 0) {
      warnings.push('This spread should generate a net credit')
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
      netCredit
    }
  }

  static validatePutRatioBackSpread(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length < 2) {
      errors.push('Put Ratio Back Spread requires at least 2 legs')
      return { isValid: false, errors, warnings }
    }

    const sellLegs = legs.filter(l => l.action === 'sell')
    const buyLegs = legs.filter(l => l.action === 'buy')

    if (sellLegs.length !== 1) {
      errors.push('Must have exactly one sell leg')
    }

    if (buyLegs.length < 1) {
      errors.push('Must have at least one buy leg')
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    const sellLeg = sellLegs[0]
    const buyLeg = buyLegs[0]

    if (sellLeg.contract.contract_type !== 'put' || buyLeg.contract.contract_type !== 'put') {
      errors.push('All legs must be put options')
    }

    if (sellLeg.contract.strike_price <= buyLeg.contract.strike_price) {
      errors.push('Sell put strike must be higher than buy put strike')
    }

    if (buyLeg.quantity <= sellLeg.quantity) {
      warnings.push('Buy leg should have more contracts than sell leg for ratio spread')
    }

    const netCredit = (sellLeg.contract.last * sellLeg.quantity - buyLeg.contract.last * buyLeg.quantity) * 100
    const spreadWidth = (sellLeg.contract.strike_price - buyLeg.contract.strike_price) * 100
    const maxRisk = spreadWidth * sellLeg.quantity - netCredit

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit: Infinity,
      maxLoss: maxRisk,
      breakEvenPoints: [0],
      netCredit: netCredit > 0 ? netCredit : undefined,
      netDebit: netCredit < 0 ? Math.abs(netCredit) : undefined
    }
  }

  static validateRiskReversal(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 2) {
      errors.push('Risk Reversal requires exactly 2 legs')
      return { isValid: false, errors, warnings }
    }

    const putLeg = legs.find(l => l.contract.contract_type === 'put')
    const callLeg = legs.find(l => l.contract.contract_type === 'call')

    if (!putLeg || !callLeg) {
      errors.push('Must have one put and one call')
      return { isValid: false, errors, warnings }
    }

    if (putLeg.action !== 'buy') {
      errors.push('Put leg must be a buy')
    }

    if (callLeg.action !== 'sell') {
      errors.push('Call leg must be a sell')
    }

    if (putLeg.contract.underlying_ticker !== callLeg.contract.underlying_ticker) {
      errors.push('Both legs must have the same underlying asset')
    }

    if (putLeg.contract.expiration_date !== callLeg.contract.expiration_date) {
      errors.push('Both legs must have the same expiration date')
    }

    warnings.push('Risk Reversal has unlimited risk above the short call strike')

    const netCost = (putLeg.contract.last - callLeg.contract.last) * putLeg.quantity * 100

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit: Infinity,
      maxLoss: Infinity,
      breakEvenPoints: [putLeg.contract.strike_price - netCost / 100],
      netDebit: netCost > 0 ? netCost : undefined,
      netCredit: netCost < 0 ? Math.abs(netCost) : undefined
    }
  }

  static validateShortSyntheticFuture(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 2) {
      errors.push('Short Synthetic Future requires exactly 2 legs')
      return { isValid: false, errors, warnings }
    }

    const putLeg = legs.find(l => l.contract.contract_type === 'put')
    const callLeg = legs.find(l => l.contract.contract_type === 'call')

    if (!putLeg || !callLeg) {
      errors.push('Must have one put and one call')
      return { isValid: false, errors, warnings }
    }

    if (putLeg.action !== 'buy') {
      errors.push('Put leg must be a buy')
    }

    if (callLeg.action !== 'sell') {
      errors.push('Call leg must be a sell')
    }

    if (putLeg.contract.strike_price !== callLeg.contract.strike_price) {
      errors.push('Put and call must have the same strike price')
    }

    if (putLeg.contract.underlying_ticker !== callLeg.contract.underlying_ticker) {
      errors.push('Both legs must have the same underlying asset')
    }

    if (putLeg.contract.expiration_date !== callLeg.contract.expiration_date) {
      errors.push('Both legs must have the same expiration date')
    }

    warnings.push('Synthetic short position has unlimited risk on upside')

    const netCost = (putLeg.contract.last - callLeg.contract.last) * putLeg.quantity * 100

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit: Infinity,
      maxLoss: Infinity,
      breakEvenPoints: [callLeg.contract.strike_price],
      netDebit: netCost > 0 ? netCost : undefined,
      netCredit: netCost < 0 ? Math.abs(netCost) : undefined
    }
  }

  static validateCallRatioSpread(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 2) {
      errors.push('Call Ratio Spread requires exactly 2 legs')
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

    if (sellLeg.quantity <= buyLeg.quantity) {
      errors.push('Sell leg must have more contracts than buy leg for ratio spread')
    }

    if (buyLeg.contract.strike_price >= sellLeg.contract.strike_price) {
      errors.push('Buy call strike must be lower than sell call strike')
    }

    warnings.push('WARNING: Call Ratio Spread has unlimited upside risk')

    const netCredit = (sellLeg.contract.last * sellLeg.quantity - buyLeg.contract.last * buyLeg.quantity) * 100

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit: ((sellLeg.contract.strike_price - buyLeg.contract.strike_price) * buyLeg.quantity * 100) + netCredit,
      maxLoss: Infinity,
      netCredit: netCredit > 0 ? netCredit : undefined,
      netDebit: netCredit < 0 ? Math.abs(netCredit) : undefined
    }
  }

  static validatePutRatioSpread(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 2) {
      errors.push('Put Ratio Spread requires exactly 2 legs')
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

    if (sellLeg.quantity <= buyLeg.quantity) {
      errors.push('Sell leg must have more contracts than buy leg for ratio spread')
    }

    if (buyLeg.contract.strike_price <= sellLeg.contract.strike_price) {
      errors.push('Buy put strike must be higher than sell put strike')
    }

    warnings.push('WARNING: Put Ratio Spread has significant downside risk')

    const netCredit = (sellLeg.contract.last * sellLeg.quantity - buyLeg.contract.last * buyLeg.quantity) * 100

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit: ((buyLeg.contract.strike_price - sellLeg.contract.strike_price) * buyLeg.quantity * 100) + netCredit,
      maxLoss: Infinity,
      netCredit: netCredit > 0 ? netCredit : undefined,
      netDebit: netCredit < 0 ? Math.abs(netCredit) : undefined
    }
  }

  static validateStrip(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 2) {
      errors.push('Strip requires exactly 2 legs (1 call, 2 puts)')
      return { isValid: false, errors, warnings }
    }

    const callLeg = legs.find(l => l.contract.contract_type === 'call')
    const putLeg = legs.find(l => l.contract.contract_type === 'put')

    if (!callLeg || !putLeg) {
      errors.push('Must have one call leg and one put leg')
      return { isValid: false, errors, warnings }
    }

    if (callLeg.action !== 'buy' || putLeg.action !== 'buy') {
      errors.push('Both legs must be buys')
    }

    if (callLeg.quantity !== 1 || putLeg.quantity !== 2) {
      errors.push('Strip requires 1 call and 2 puts')
    }

    if (callLeg.contract.strike_price !== putLeg.contract.strike_price) {
      warnings.push('For standard Strip, call and puts should be at the same strike')
    }

    const netDebit = (callLeg.contract.last * callLeg.quantity + putLeg.contract.last * putLeg.quantity) * 100

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit: Infinity,
      maxLoss: netDebit,
      netDebit
    }
  }

  static validateStrap(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 2) {
      errors.push('Strap requires exactly 2 legs (2 calls, 1 put)')
      return { isValid: false, errors, warnings }
    }

    const callLeg = legs.find(l => l.contract.contract_type === 'call')
    const putLeg = legs.find(l => l.contract.contract_type === 'put')

    if (!callLeg || !putLeg) {
      errors.push('Must have one call leg and one put leg')
      return { isValid: false, errors, warnings }
    }

    if (callLeg.action !== 'buy' || putLeg.action !== 'buy') {
      errors.push('Both legs must be buys')
    }

    if (callLeg.quantity !== 2 || putLeg.quantity !== 1) {
      errors.push('Strap requires 2 calls and 1 put')
    }

    if (callLeg.contract.strike_price !== putLeg.contract.strike_price) {
      warnings.push('For standard Strap, calls and put should be at the same strike')
    }

    const netDebit = (callLeg.contract.last * callLeg.quantity + putLeg.contract.last * putLeg.quantity) * 100

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      maxProfit: Infinity,
      maxLoss: netDebit,
      netDebit
    }
  }

  static validateLongIronButterfly(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 4) {
      errors.push('Long Iron Butterfly requires exactly 4 legs')
      return { isValid: false, errors, warnings }
    }

    const puts = legs.filter(l => l.contract.contract_type === 'put')
    const calls = legs.filter(l => l.contract.contract_type === 'call')

    if (puts.length !== 2 || calls.length !== 2) {
      errors.push('Must have 2 puts and 2 calls')
      return { isValid: false, errors, warnings }
    }

    const sortedPuts = puts.sort((a, b) => a.contract.strike_price - b.contract.strike_price)
    const sortedCalls = calls.sort((a, b) => a.contract.strike_price - b.contract.strike_price)

    if (sortedPuts[0].action !== 'buy' || sortedPuts[1].action !== 'sell') {
      errors.push('Lower put should be bought, higher put (ATM) should be sold')
    }

    if (sortedCalls[0].action !== 'sell' || sortedCalls[1].action !== 'buy') {
      errors.push('Lower call (ATM) should be sold, higher call should be bought')
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
      maxProfit: Infinity,
      maxLoss: Math.abs(netDebit),
      netDebit: Math.abs(netDebit)
    }
  }

  static validateLongIronCondor(legs: StrategyLeg[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (legs.length !== 4) {
      errors.push('Long Iron Condor requires exactly 4 legs')
      return { isValid: false, errors, warnings }
    }

    const puts = legs.filter(l => l.contract.contract_type === 'put')
    const calls = legs.filter(l => l.contract.contract_type === 'call')

    if (puts.length !== 2 || calls.length !== 2) {
      errors.push('Must have 2 puts and 2 calls')
      return { isValid: false, errors, warnings }
    }

    const sortedPuts = puts.sort((a, b) => a.contract.strike_price - b.contract.strike_price)
    const sortedCalls = calls.sort((a, b) => a.contract.strike_price - b.contract.strike_price)

    if (sortedPuts[0].action !== 'buy' || sortedPuts[1].action !== 'sell') {
      errors.push('Lower put should be bought, higher put should be sold')
    }

    if (sortedCalls[0].action !== 'sell' || sortedCalls[1].action !== 'buy') {
      errors.push('Lower call should be sold, higher call should be bought')
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
      maxProfit: Infinity,
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
      case 'Bear Call Spread':
        return this.validateBearCallSpread(legs)
      case 'Put Ratio Back Spread':
        return this.validatePutRatioBackSpread(legs)
      case 'Risk Reversal':
        return this.validateRiskReversal(legs)
      case 'Short Synthetic Future':
        return this.validateShortSyntheticFuture(legs)
      case 'Straddle':
      case 'Long Straddle':
        return this.validateStraddle(legs)
      case 'Strangle':
      case 'Long Strangle':
        return this.validateStrangle(legs)
      case 'Iron Condor':
      case 'Bear Condor':
        return this.validateIronCondor(legs)
      case 'Butterfly Spread':
      case 'Bear Butterfly':
        return this.validateButterflySpread(legs)
      case 'Call Ratio Spread':
        return this.validateCallRatioSpread(legs)
      case 'Put Ratio Spread':
        return this.validatePutRatioSpread(legs)
      case 'Strip':
        return this.validateStrip(legs)
      case 'Strap':
        return this.validateStrap(legs)
      case 'Long Iron Butterfly':
        return this.validateLongIronButterfly(legs)
      case 'Long Iron Condor':
        return this.validateLongIronCondor(legs)
      case 'Long Call':
      case 'Long Put':
      case 'Buy Put':
      case 'Cash-Secured Put':
      case 'Covered Call':
      case 'Sell Call':
        if (legs.length !== 1) {
          return {
            isValid: false,
            errors: ['Single-leg strategy requires exactly 1 contract'],
            warnings: []
          }
        }
        const warnings: string[] = []
        if (strategyName === 'Sell Call') {
          warnings.push('WARNING: Naked call selling has unlimited risk')
        }
        return {
          isValid: true,
          errors: [],
          warnings,
          netDebit: legs[0].action === 'buy' ? legs[0].contract.last * legs[0].quantity * 100 : undefined,
          netCredit: legs[0].action === 'sell' ? legs[0].contract.last * legs[0].quantity * 100 : undefined
        }
      case 'Long Calendar with Puts':
        if (legs.length !== 2) {
          return {
            isValid: false,
            errors: ['Calendar spread requires exactly 2 legs'],
            warnings: []
          }
        }
        return {
          isValid: true,
          errors: [],
          warnings: ['Calendar spreads require different expirations'],
          netDebit: Math.abs((legs[0].contract.last - legs[1].contract.last) * legs[0].quantity * 100)
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
    return ['Long Call', 'Long Put', 'Buy Put', 'Cash-Secured Put', 'Covered Call', 'Sell Call'].includes(strategyName)
  }

  static isMultiLegStrategy(strategyName: string): boolean {
    return !this.isSingleLegStrategy(strategyName)
  }
}
