export interface MarketRegime {
  id: string
  name: string
  description: string
  characteristics: string[]
  indicators: RegimeIndicator[]
  volatility: 'low' | 'medium' | 'high'
  trend: 'bullish' | 'bearish' | 'sideways'
  duration: string
  probability: number
}

export interface RegimeIndicator {
  name: string
  value: number
  threshold: number
  signal: 'bullish' | 'bearish' | 'neutral'
  weight: number
}

export interface TradingStrategy {
  id: string
  name: string
  description: string
  regimeId: string
  type: 'bullish' | 'bearish' | 'neutral' | 'volatility'
  timeframe: 'short' | 'medium' | 'long'
  riskLevel: 'low' | 'medium' | 'high'
  expectedReturn: number
  maxDrawdown: number
  winRate: number
  instructions: StrategyInstruction[]
  examples: StrategyExample[]
  risks: string[]
  benefits: string[]
}

export interface StrategyInstruction {
  step: number
  action: string
  description: string
  timing: string
  conditions: string[]
}

export interface StrategyExample {
  scenario: string
  setup: string
  entry: string
  exit: string
  result: string
  pnl: number
}

export interface RegimeAnalysis {
  currentRegime: MarketRegime
  confidence: number
  timeInRegime: number
  nextRegimeProb: { regime: MarketRegime; probability: number }[]
  recommendedStrategies: TradingStrategy[]
  warnings: string[]
}

export interface MarketData {
  price: number
  volume: number
  volatility: number
  rsi: number
  macd: number
  bollingerBands: {
    upper: number
    middle: number
    lower: number
  }
  movingAverages: {
    sma20: number
    sma50: number
    sma200: number
  }
  vix: number
  timestamp: Date
}