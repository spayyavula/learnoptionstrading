/**
 * Indian Options Greeks Calculator
 *
 * Adapted Black-Scholes model for Indian market specifics:
 * - NSE/BSE lot sizes
 * - Indian market volatility patterns
 * - Rupee-denominated calculations
 */

interface IndianGreeksInput {
  spotPrice: number       // Current stock/index price
  strikePrice: number     // Option strike price
  timeToExpiry: number    // Time to expiry in years
  riskFreeRate: number    // Indian risk-free rate (typically 6-7% for govt bonds)
  volatility: number      // Implied volatility
  optionType: 'call' | 'put'
  dividend?: number       // Annual dividend yield (if applicable)
}

interface IndianGreeksOutput {
  price: number           // Option premium in ₹
  delta: number           // Rate of change of option price w.r.t underlying
  gamma: number           // Rate of change of delta w.r.t underlying
  theta: number           // Time decay per day in ₹
  vega: number            // Sensitivity to 1% change in volatility
  rho: number            // Sensitivity to 1% change in interest rate

  // Indian-specific metrics
  intrinsicValue: number  // In-the-money value
  timeValue: number       // Premium above intrinsic value
  moneyness: string       // ITM, ATM, or OTM
  lotValue: number        // Value for standard lot size
  breakEven: number       // Break-even price at expiry
}

class IndianGreeksService {
  // Standard lot sizes for Indian instruments
  private static LOT_SIZES: Record<string, number> = {
    'NIFTY': 25,
    'BANKNIFTY': 15,
    'FINNIFTY': 25,
    'MIDCPNIFTY': 50,
    'RELIANCE': 250,
    'TCS': 150,
    'INFY': 300,
    'HDFCBANK': 550,
    'ICICIBANK': 1375,
    'SBIN': 1500,
    'BHARTIARTL': 1700,
    'ITC': 1600,
    'HINDUNILVR': 300,
    'KOTAKBANK': 400,
    'LT': 300,
    'AXISBANK': 600,
    'ASIANPAINT': 200,
    'MARUTI': 50,
    'TITAN': 500,
    'BAJFINANCE': 125,
    'WIPRO': 1200
  }

  // Default Indian risk-free rate (RBI repo rate + margin)
  private static DEFAULT_RISK_FREE_RATE = 0.065 // 6.5%

  /**
   * Calculate all Greeks for an Indian option
   */
  static calculateGreeks(input: IndianGreeksInput): IndianGreeksOutput {
    const { spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType, dividend = 0 } = input

    // Adjust for dividend
    const adjustedSpot = spotPrice * Math.exp(-dividend * timeToExpiry)

    // Calculate d1 and d2
    const d1 = this.calculateD1(adjustedSpot, strikePrice, timeToExpiry, riskFreeRate, volatility)
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry)

    // Calculate Greeks
    const price = this.calculatePrice(adjustedSpot, strikePrice, timeToExpiry, riskFreeRate, volatility, d1, d2, optionType)
    const delta = this.calculateDelta(d1, optionType, dividend, timeToExpiry)
    const gamma = this.calculateGamma(adjustedSpot, d1, volatility, timeToExpiry)
    const theta = this.calculateTheta(adjustedSpot, strikePrice, d1, d2, riskFreeRate, volatility, timeToExpiry, optionType, dividend)
    const vega = this.calculateVega(adjustedSpot, d1, timeToExpiry)
    const rho = this.calculateRho(strikePrice, d2, timeToExpiry, riskFreeRate, optionType)

    // Calculate intrinsic and time value
    const intrinsicValue = this.calculateIntrinsicValue(spotPrice, strikePrice, optionType)
    const timeValue = price - intrinsicValue

    // Determine moneyness
    const moneyness = this.determineMoneyness(spotPrice, strikePrice, optionType)

    // Calculate break-even
    const breakEven = this.calculateBreakEven(strikePrice, price, optionType)

    return {
      price,
      delta,
      gamma,
      theta: theta / 365, // Convert to daily theta
      vega: vega / 100,   // Vega for 1% change
      rho: rho / 100,     // Rho for 1% change
      intrinsicValue,
      timeValue,
      moneyness,
      lotValue: price, // Will be multiplied by lot size externally
      breakEven
    }
  }

  /**
   * Get lot size for Indian instrument
   */
  static getLotSize(symbol: string): number {
    return this.LOT_SIZES[symbol.toUpperCase()] || 1
  }

  /**
   * Calculate total contract value for Indian option
   */
  static calculateContractValue(premium: number, symbol: string, quantity: number = 1): number {
    const lotSize = this.getLotSize(symbol)
    return premium * lotSize * quantity
  }

  /**
   * Get Indian risk-free rate
   */
  static getIndianRiskFreeRate(): number {
    return this.DEFAULT_RISK_FREE_RATE
  }

  /**
   * Calculate time to expiry for Indian options
   * Indian options expire on last Thursday of month
   */
  static calculateTimeToExpiry(expiryDate: string): number {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return Math.max(0, diffDays / 365) // Convert to years
  }

  // Private calculation methods
  private static calculateD1(
    spot: number,
    strike: number,
    time: number,
    rate: number,
    vol: number
  ): number {
    return (Math.log(spot / strike) + (rate + 0.5 * vol * vol) * time) / (vol * Math.sqrt(time))
  }

  private static calculatePrice(
    spot: number,
    strike: number,
    time: number,
    rate: number,
    vol: number,
    d1: number,
    d2: number,
    type: 'call' | 'put'
  ): number {
    const nd1 = this.normalCDF(d1)
    const nd2 = this.normalCDF(d2)
    const discountFactor = Math.exp(-rate * time)

    if (type === 'call') {
      return spot * nd1 - strike * discountFactor * nd2
    } else {
      return strike * discountFactor * (1 - nd2) - spot * (1 - nd1)
    }
  }

  private static calculateDelta(d1: number, type: 'call' | 'put', dividend: number, time: number): number {
    const nd1 = this.normalCDF(d1)
    const dividendFactor = Math.exp(-dividend * time)

    if (type === 'call') {
      return nd1 * dividendFactor
    } else {
      return (nd1 - 1) * dividendFactor
    }
  }

  private static calculateGamma(spot: number, d1: number, vol: number, time: number): number {
    const npd1 = this.normalPDF(d1)
    return npd1 / (spot * vol * Math.sqrt(time))
  }

  private static calculateTheta(
    spot: number,
    strike: number,
    d1: number,
    d2: number,
    rate: number,
    vol: number,
    time: number,
    type: 'call' | 'put',
    dividend: number
  ): number {
    const npd1 = this.normalPDF(d1)
    const nd2 = this.normalCDF(d2)
    const discountFactor = Math.exp(-rate * time)

    const term1 = -(spot * npd1 * vol) / (2 * Math.sqrt(time))

    if (type === 'call') {
      return term1 - rate * strike * discountFactor * nd2 + dividend * spot * this.normalCDF(d1)
    } else {
      return term1 + rate * strike * discountFactor * (1 - nd2) - dividend * spot * (1 - this.normalCDF(d1))
    }
  }

  private static calculateVega(spot: number, d1: number, time: number): number {
    const npd1 = this.normalPDF(d1)
    return spot * npd1 * Math.sqrt(time)
  }

  private static calculateRho(strike: number, d2: number, time: number, rate: number, type: 'call' | 'put'): number {
    const nd2 = this.normalCDF(d2)
    const discountFactor = Math.exp(-rate * time)

    if (type === 'call') {
      return strike * time * discountFactor * nd2
    } else {
      return -strike * time * discountFactor * (1 - nd2)
    }
  }

  private static calculateIntrinsicValue(spot: number, strike: number, type: 'call' | 'put'): number {
    if (type === 'call') {
      return Math.max(0, spot - strike)
    } else {
      return Math.max(0, strike - spot)
    }
  }

  private static determineMoneyness(spot: number, strike: number, type: 'call' | 'put'): string {
    const diff = Math.abs(spot - strike) / spot

    if (diff < 0.02) return 'ATM' // Within 2%

    if (type === 'call') {
      return spot > strike ? 'ITM' : 'OTM'
    } else {
      return spot < strike ? 'ITM' : 'OTM'
    }
  }

  private static calculateBreakEven(strike: number, premium: number, type: 'call' | 'put'): number {
    if (type === 'call') {
      return strike + premium
    } else {
      return strike - premium
    }
  }

  // Standard normal cumulative distribution function
  private static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x))
    const d = 0.3989423 * Math.exp(-x * x / 2)
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    return x > 0 ? 1 - p : p
  }

  // Standard normal probability density function
  private static normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
  }
}

export default IndianGreeksService
export { IndianGreeksService }
export type { IndianGreeksInput, IndianGreeksOutput }
