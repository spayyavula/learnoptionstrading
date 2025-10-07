import type { OptionsContract } from '../types/options'

interface UnderlyingConfig {
  ticker: string
  currentPrice: number
  volatility: number
}

function getThirdFriday(year: number, month: number): Date {
  const firstDay = new Date(year, month, 1)
  const firstFriday = firstDay.getDay() <= 5
    ? 5 - firstDay.getDay() + 1
    : 12 - firstDay.getDay() + 1

  return new Date(year, month, firstFriday + 14)
}

function generateFutureExpirationDates(): string[] {
  const today = new Date()
  const expirations: string[] = []

  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const thirdFriday = getThirdFriday(targetDate.getFullYear(), targetDate.getMonth())

    if (thirdFriday > today) {
      const dateStr = thirdFriday.toISOString().split('T')[0]
      expirations.push(dateStr)
    }
  }

  const currentDate = new Date(today)
  for (let i = 0; i < 8; i++) {
    currentDate.setDate(currentDate.getDate() + 7)
    const friday = new Date(currentDate)
    friday.setDate(friday.getDate() + ((5 - friday.getDay() + 7) % 7))

    const dateStr = friday.toISOString().split('T')[0]
    if (!expirations.includes(dateStr) && friday > today) {
      expirations.push(dateStr)
    }
  }

  return expirations.sort().slice(0, 12)
}

export function isContractExpired(expirationDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expirationDate)
  expiry.setHours(0, 0, 0, 0)
  return expiry < today
}

export function filterExpiredContracts(contracts: OptionsContract[]): OptionsContract[] {
  return contracts.filter(contract => !isContractExpired(contract.expiration_date))
}

const UNDERLYING_CONFIGS: UnderlyingConfig[] = [
  {
    ticker: 'SPY',
    currentPrice: 580,
    volatility: 0.15
  },
  {
    ticker: 'QQQ',
    currentPrice: 500,
    volatility: 0.18
  },
  {
    ticker: 'AAPL',
    currentPrice: 185,
    volatility: 0.25
  },
  {
    ticker: 'TSLA',
    currentPrice: 250,
    volatility: 0.45
  },
  {
    ticker: 'NVDA',
    currentPrice: 880,
    volatility: 0.35
  },
  {
    ticker: 'MSFT',
    currentPrice: 420,
    volatility: 0.22
  }
]

function generateStrikePrices(currentPrice: number, numStrikes: number = 20): number[] {
  const strikes: number[] = []
  const strikeInterval = Math.round(currentPrice * 0.025)
  const atmStrike = Math.round(currentPrice / strikeInterval) * strikeInterval

  const strikesAbove = Math.floor(numStrikes / 2)
  const strikesBelow = numStrikes - strikesAbove - 1

  for (let i = -strikesBelow; i <= strikesAbove; i++) {
    strikes.push(atmStrike + (i * strikeInterval))
  }

  return strikes.filter(s => s > 0)
}

function calculateBlackScholesGreeks(
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  volatility: number,
  isCall: boolean
): {
  delta: number
  gamma: number
  theta: number
  vega: number
  price: number
} {
  const d1 = (Math.log(spotPrice / strikePrice) + (0.5 * volatility * volatility * timeToExpiry)) / (volatility * Math.sqrt(timeToExpiry))
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry)

  const nd1 = normalCDF(d1)
  const nd2 = normalCDF(d2)
  const npd1 = normalPDF(d1)

  let price: number
  let delta: number

  if (isCall) {
    price = spotPrice * nd1 - strikePrice * nd2
    delta = nd1
  } else {
    price = strikePrice * normalCDF(-d2) - spotPrice * normalCDF(-d1)
    delta = nd1 - 1
  }

  const gamma = npd1 / (spotPrice * volatility * Math.sqrt(timeToExpiry))
  const theta = -(spotPrice * npd1 * volatility) / (2 * Math.sqrt(timeToExpiry)) - (isCall ? 0 : 0)
  const vega = spotPrice * npd1 * Math.sqrt(timeToExpiry) / 100

  return {
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(4)),
    theta: Number(theta.toFixed(4)),
    vega: Number(vega.toFixed(4)),
    price: Math.max(0.01, Number(price.toFixed(2)))
  }
}

function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp(-x * x / 2)
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))

  return x > 0 ? 1 - probability : probability
}

function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

function calculateDaysToExpiry(expirationDate: string): number {
  const today = new Date()
  const expiry = new Date(expirationDate)
  const diffTime = expiry.getTime() - today.getTime()
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

function generateContractTicker(
  underlying: string,
  expiration: string,
  contractType: 'call' | 'put',
  strike: number
): string {
  const exp = expiration.replace(/-/g, '').slice(2)
  const typeCode = contractType === 'call' ? 'C' : 'P'
  const strikeStr = Math.round(strike * 1000).toString().padStart(8, '0')
  return `${underlying}${exp}${typeCode}${strikeStr}`
}

function calculateVolumeAndOI(
  currentPrice: number,
  strike: number,
  daysToExpiry: number
): { volume: number; openInterest: number } {
  const moneyness = Math.abs(currentPrice - strike) / currentPrice
  const liquidityFactor = Math.exp(-moneyness * 10) * (1 - daysToExpiry / 365)

  const baseVolume = 10000
  const baseOI = 50000

  const volume = Math.floor(baseVolume * liquidityFactor * (0.5 + Math.random()))
  const openInterest = Math.floor(baseOI * liquidityFactor * (0.5 + Math.random()))

  return { volume: Math.max(10, volume), openInterest: Math.max(50, openInterest) }
}

export function generateComprehensiveOptionsChain(): OptionsContract[] {
  const allContracts: OptionsContract[] = []
  const futureExpirations = generateFutureExpirationDates()

  for (const config of UNDERLYING_CONFIGS) {
    const strikes = generateStrikePrices(config.currentPrice, 20)

    for (const expiration of futureExpirations) {
      const daysToExpiry = calculateDaysToExpiry(expiration)
      const timeToExpiry = daysToExpiry / 365

      for (const strike of strikes) {
        for (const contractType of ['call', 'put'] as const) {
          const greeks = calculateBlackScholesGreeks(
            config.currentPrice,
            strike,
            timeToExpiry,
            config.volatility,
            contractType === 'call'
          )

          const { volume, openInterest } = calculateVolumeAndOI(
            config.currentPrice,
            strike,
            daysToExpiry
          )

          const intrinsicValue = contractType === 'call'
            ? Math.max(0, config.currentPrice - strike)
            : Math.max(0, strike - config.currentPrice)

          const timeValue = Math.max(0, greeks.price - intrinsicValue)

          const bidAskSpread = greeks.price * 0.02
          const bid = Math.max(0.01, greeks.price - bidAskSpread / 2)
          const ask = greeks.price + bidAskSpread / 2

          const contract: OptionsContract = {
            contract_type: contractType,
            exercise_style: 'american',
            expiration_date: expiration,
            shares_per_contract: 100,
            strike_price: strike,
            ticker: generateContractTicker(config.ticker, expiration, contractType, strike),
            underlying_ticker: config.ticker,
            bid: Number(bid.toFixed(2)),
            ask: Number(ask.toFixed(2)),
            last: Number(greeks.price.toFixed(2)),
            volume,
            open_interest: openInterest,
            implied_volatility: config.volatility,
            delta: greeks.delta,
            gamma: greeks.gamma,
            theta: greeks.theta,
            vega: greeks.vega,
            intrinsic_value: Number(intrinsicValue.toFixed(2)),
            time_value: Number(timeValue.toFixed(2))
          }

          allContracts.push(contract)
        }
      }
    }
  }

  return allContracts
}

export function getUnderlyingPrice(ticker: string): number {
  const config = UNDERLYING_CONFIGS.find(c => c.ticker === ticker)
  return config?.currentPrice || 100
}

export function getAvailableUnderlyings(): string[] {
  return UNDERLYING_CONFIGS.map(c => c.ticker)
}
