export interface StrategyLeg {
  type: 'call' | 'put'
  strike: number
  premium: number
  action: 'buy' | 'sell'
  quantity: number
}

export interface PayoffPoint {
  price: number
  profit: number
}

export interface StrategyPayoff {
  points: PayoffPoint[]
  maxProfit: number
  maxLoss: number
  breakEvenPoints: number[]
  strategyName: string
}

export class PayoffCalculationService {
  static calculatePayoff(
    legs: StrategyLeg[],
    underlyingPrice: number,
    strategyName: string
  ): StrategyPayoff {
    try {
      // Validate inputs
      if (!legs || legs.length === 0) {
        console.warn('⚠️ No legs provided to payoff calculation')
        return this.getEmptyPayoff(strategyName, underlyingPrice)
      }

      const minStrike = Math.min(...legs.map(leg => leg.strike))
      const maxStrike = Math.max(...legs.map(leg => leg.strike))

      // Safety check for infinite loops
      if (!isFinite(minStrike) || !isFinite(maxStrike)) {
        console.error('🚨 Invalid strike prices detected')
        return this.getEmptyPayoff(strategyName, underlyingPrice)
      }

      const range = maxStrike - minStrike
      const startPrice = Math.max(0, minStrike - range * 0.5)
      const endPrice = maxStrike + range * 0.5

      const points: PayoffPoint[] = []
      const step = (endPrice - startPrice) / 100

      // Limit iterations to prevent browser freeze
      let iterations = 0
      const MAX_ITERATIONS = 1000

      for (let price = startPrice; price <= endPrice && iterations < MAX_ITERATIONS; price += step) {
        iterations++
        const profit = this.calculateProfitAtPrice(legs, price)
        points.push({ price, profit })
      }

      if (iterations >= MAX_ITERATIONS) {
        console.warn('⚠️ Payoff calculation hit iteration limit')
      }
    } catch (error) {
      console.error('🚨 Error in payoff calculation:', error)
      return this.getEmptyPayoff(strategyName, underlyingPrice)
    }

    const profits = points.map(p => p.profit)
    const maxProfit = Math.max(...profits)
    const maxLoss = Math.min(...profits)

    const breakEvenPoints = this.findBreakEvenPoints(points)

    return {
      points,
      maxProfit,
      maxLoss,
      breakEvenPoints,
      strategyName
    }
  }

  private static calculateProfitAtPrice(legs: StrategyLeg[], price: number): number {
    let totalProfit = 0

    for (const leg of legs) {
      const intrinsicValue = leg.type === 'call'
        ? Math.max(0, price - leg.strike)
        : Math.max(0, leg.strike - price)

      const legProfit = leg.action === 'buy'
        ? (intrinsicValue - leg.premium) * leg.quantity
        : (leg.premium - intrinsicValue) * leg.quantity

      totalProfit += legProfit * 100
    }

    return totalProfit
  }

  private static findBreakEvenPoints(points: PayoffPoint[]): number[] {
    const breakEvens: number[] = []

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]

      if ((prev.profit < 0 && curr.profit >= 0) || (prev.profit >= 0 && curr.profit < 0)) {
        const ratio = Math.abs(prev.profit) / (Math.abs(prev.profit) + Math.abs(curr.profit))
        const breakEven = prev.price + (curr.price - prev.price) * ratio
        breakEvens.push(breakEven)
      }
    }

    return breakEvens
  }

  static getBullCallSpread(
    underlyingPrice: number,
    longStrike?: number,
    shortStrike?: number,
    longPremium?: number,
    shortPremium?: number
  ): StrategyPayoff {
    const lStrike = longStrike || underlyingPrice * 0.98
    const sStrike = shortStrike || underlyingPrice * 1.02
    const lPremium = longPremium || underlyingPrice * 0.03
    const sPremium = shortPremium || underlyingPrice * 0.015

    const legs: StrategyLeg[] = [
      { type: 'call', strike: lStrike, premium: lPremium, action: 'buy', quantity: 1 },
      { type: 'call', strike: sStrike, premium: sPremium, action: 'sell', quantity: 1 }
    ]

    return this.calculatePayoff(legs, underlyingPrice, 'Bull Call Spread')
  }

  static getBearPutSpread(
    underlyingPrice: number,
    longStrike?: number,
    shortStrike?: number,
    longPremium?: number,
    shortPremium?: number
  ): StrategyPayoff {
    const lStrike = longStrike || underlyingPrice * 1.02
    const sStrike = shortStrike || underlyingPrice * 0.98
    const lPremium = longPremium || underlyingPrice * 0.03
    const sPremium = shortPremium || underlyingPrice * 0.015

    const legs: StrategyLeg[] = [
      { type: 'put', strike: lStrike, premium: lPremium, action: 'buy', quantity: 1 },
      { type: 'put', strike: sStrike, premium: sPremium, action: 'sell', quantity: 1 }
    ]

    return this.calculatePayoff(legs, underlyingPrice, 'Bear Put Spread')
  }

  static getStraddle(
    underlyingPrice: number,
    strike?: number,
    callPremium?: number,
    putPremium?: number
  ): StrategyPayoff {
    const atStrike = strike || underlyingPrice
    const cPremium = callPremium || underlyingPrice * 0.03
    const pPremium = putPremium || underlyingPrice * 0.03

    const legs: StrategyLeg[] = [
      { type: 'call', strike: atStrike, premium: cPremium, action: 'buy', quantity: 1 },
      { type: 'put', strike: atStrike, premium: pPremium, action: 'buy', quantity: 1 }
    ]

    return this.calculatePayoff(legs, underlyingPrice, 'Straddle')
  }

  static getStrangle(
    underlyingPrice: number,
    callStrike?: number,
    putStrike?: number,
    callPremium?: number,
    putPremium?: number
  ): StrategyPayoff {
    const cStrike = callStrike || underlyingPrice * 1.05
    const pStrike = putStrike || underlyingPrice * 0.95
    const cPremium = callPremium || underlyingPrice * 0.02
    const pPremium = putPremium || underlyingPrice * 0.02

    const legs: StrategyLeg[] = [
      { type: 'call', strike: cStrike, premium: cPremium, action: 'buy', quantity: 1 },
      { type: 'put', strike: pStrike, premium: pPremium, action: 'buy', quantity: 1 }
    ]

    return this.calculatePayoff(legs, underlyingPrice, 'Strangle')
  }

  static getIronCondor(
    underlyingPrice: number,
    putBuyStrike?: number,
    putSellStrike?: number,
    callSellStrike?: number,
    callBuyStrike?: number
  ): StrategyPayoff {
    const pbStrike = putBuyStrike || underlyingPrice * 0.90
    const psStrike = putSellStrike || underlyingPrice * 0.95
    const csStrike = callSellStrike || underlyingPrice * 1.05
    const cbStrike = callBuyStrike || underlyingPrice * 1.10

    const legs: StrategyLeg[] = [
      { type: 'put', strike: pbStrike, premium: underlyingPrice * 0.01, action: 'buy', quantity: 1 },
      { type: 'put', strike: psStrike, premium: underlyingPrice * 0.02, action: 'sell', quantity: 1 },
      { type: 'call', strike: csStrike, premium: underlyingPrice * 0.02, action: 'sell', quantity: 1 },
      { type: 'call', strike: cbStrike, premium: underlyingPrice * 0.01, action: 'buy', quantity: 1 }
    ]

    return this.calculatePayoff(legs, underlyingPrice, 'Iron Condor')
  }

  static getButterflySpread(
    underlyingPrice: number,
    lowerStrike?: number,
    middleStrike?: number,
    upperStrike?: number
  ): StrategyPayoff {
    const lStrike = lowerStrike || underlyingPrice * 0.95
    const mStrike = middleStrike || underlyingPrice
    const uStrike = upperStrike || underlyingPrice * 1.05

    const legs: StrategyLeg[] = [
      { type: 'call', strike: lStrike, premium: underlyingPrice * 0.06, action: 'buy', quantity: 1 },
      { type: 'call', strike: mStrike, premium: underlyingPrice * 0.04, action: 'sell', quantity: 2 },
      { type: 'call', strike: uStrike, premium: underlyingPrice * 0.02, action: 'buy', quantity: 1 }
    ]

    return this.calculatePayoff(legs, underlyingPrice, 'Butterfly Spread')
  }

  static getCashSecuredPut(
    underlyingPrice: number,
    strike?: number,
    premium?: number
  ): StrategyPayoff {
    const pStrike = strike || underlyingPrice * 0.95
    const pPremium = premium || underlyingPrice * 0.03

    const legs: StrategyLeg[] = [
      { type: 'put', strike: pStrike, premium: pPremium, action: 'sell', quantity: 1 }
    ]

    return this.calculatePayoff(legs, underlyingPrice, 'Cash-Secured Put')
  }

  static getCoveredCall(
    underlyingPrice: number,
    strike?: number,
    premium?: number
  ): StrategyPayoff {
    const cStrike = strike || underlyingPrice * 1.05
    const cPremium = premium || underlyingPrice * 0.03

    const legs: StrategyLeg[] = [
      { type: 'call', strike: cStrike, premium: cPremium, action: 'sell', quantity: 1 }
    ]

    const payoff = this.calculatePayoff(legs, underlyingPrice, 'Covered Call')

    payoff.points = payoff.points.map(point => ({
      price: point.price,
      profit: point.profit + (point.price - underlyingPrice) * 100
    }))

    return payoff
  }

  static getStrategyByName(
    strategyName: string,
    underlyingPrice: number
  ): StrategyPayoff {
    switch (strategyName) {
      case 'Bull Call Spread':
        return this.getBullCallSpread(underlyingPrice)
      case 'Bear Put Spread':
        return this.getBearPutSpread(underlyingPrice)
      case 'Straddle':
        return this.getStraddle(underlyingPrice)
      case 'Strangle':
        return this.getStrangle(underlyingPrice)
      case 'Iron Condor':
        return this.getIronCondor(underlyingPrice)
      case 'Butterfly Spread':
        return this.getButterflySpread(underlyingPrice)
      case 'Cash-Secured Put':
        return this.getCashSecuredPut(underlyingPrice)
      case 'Covered Call':
        return this.getCoveredCall(underlyingPrice)
      default:
        return this.getBullCallSpread(underlyingPrice)
    }
  }
}
