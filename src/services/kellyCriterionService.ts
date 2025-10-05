export interface KellyCalculationInput {
  winRate: number
  averageWin: number
  averageLoss: number
  accountBalance: number
  contractPrice: number
}

export interface KellyCalculationResult {
  kellyPercentage: number
  fullKellySize: number
  halfKellySize: number
  quarterKellySize: number
  recommendedContracts: {
    full: number
    half: number
    quarter: number
  }
  riskLevel: 'conservative' | 'moderate' | 'aggressive' | 'excessive'
  warnings: string[]
}

export class KellyCriterionService {
  private static readonly MAX_KELLY_PERCENTAGE = 0.25
  private static readonly MIN_TRADES_FOR_KELLY = 10
  private static readonly DEFAULT_WIN_RATE = 0.50
  private static readonly DEFAULT_WIN_LOSS_RATIO = 1.5

  static calculateKellyPercentage(
    winRate: number,
    winLossRatio: number
  ): number {
    if (winRate <= 0 || winRate >= 1) {
      return 0
    }

    if (winLossRatio <= 0) {
      return 0
    }

    const lossRate = 1 - winRate
    const kellyPercentage = winRate - (lossRate / winLossRatio)

    return Math.max(0, Math.min(kellyPercentage, this.MAX_KELLY_PERCENTAGE))
  }

  static calculateWinLossRatio(averageWin: number, averageLoss: number): number {
    if (averageLoss <= 0) {
      return 0
    }
    return averageWin / averageLoss
  }

  static calculatePositionSize(input: KellyCalculationInput): KellyCalculationResult {
    const warnings: string[] = []

    const winLossRatio = this.calculateWinLossRatio(
      input.averageWin,
      input.averageLoss
    )

    if (winLossRatio === 0) {
      warnings.push('Invalid win/loss ratio. Using conservative defaults.')
    }

    const kellyPercentage = this.calculateKellyPercentage(
      input.winRate,
      winLossRatio
    )

    if (kellyPercentage <= 0) {
      warnings.push(
        'Kelly Criterion suggests no position. Your win rate or win/loss ratio may be too low.'
      )
    }

    const fullKellyDollars = input.accountBalance * kellyPercentage
    const halfKellyDollars = fullKellyDollars * 0.5
    const quarterKellyDollars = fullKellyDollars * 0.25

    const contractMultiplier = 100

    const fullKellyContracts = Math.floor(
      fullKellyDollars / (input.contractPrice * contractMultiplier)
    )
    const halfKellyContracts = Math.floor(
      halfKellyDollars / (input.contractPrice * contractMultiplier)
    )
    const quarterKellyContracts = Math.floor(
      quarterKellyDollars / (input.contractPrice * contractMultiplier)
    )

    let riskLevel: 'conservative' | 'moderate' | 'aggressive' | 'excessive' = 'conservative'

    if (kellyPercentage >= 0.20) {
      riskLevel = 'excessive'
      warnings.push(
        'Warning: Kelly percentage is very high. Consider using Half Kelly or Quarter Kelly for safety.'
      )
    } else if (kellyPercentage >= 0.10) {
      riskLevel = 'aggressive'
    } else if (kellyPercentage >= 0.05) {
      riskLevel = 'moderate'
    }

    if (fullKellyDollars > input.accountBalance * 0.25) {
      warnings.push(
        'Position size exceeds 25% of account. Consider reducing to manage risk.'
      )
    }

    return {
      kellyPercentage,
      fullKellySize: fullKellyDollars,
      halfKellySize: halfKellyDollars,
      quarterKellySize: quarterKellyDollars,
      recommendedContracts: {
        full: Math.max(0, fullKellyContracts),
        half: Math.max(0, halfKellyContracts),
        quarter: Math.max(0, quarterKellyContracts)
      },
      riskLevel,
      warnings
    }
  }

  static getDefaultMetrics(totalTrades: number = 0): {
    winRate: number
    winLossRatio: number
    shouldUseDefaults: boolean
  } {
    const shouldUseDefaults = totalTrades < this.MIN_TRADES_FOR_KELLY

    return {
      winRate: this.DEFAULT_WIN_RATE,
      winLossRatio: this.DEFAULT_WIN_LOSS_RATIO,
      shouldUseDefaults
    }
  }

  static formatKellyPercentage(kellyPercentage: number): string {
    return `${(kellyPercentage * 100).toFixed(2)}%`
  }

  static getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'conservative':
        return 'text-green-600'
      case 'moderate':
        return 'text-blue-600'
      case 'aggressive':
        return 'text-orange-600'
      case 'excessive':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  static getRiskLevelDescription(riskLevel: string): string {
    switch (riskLevel) {
      case 'conservative':
        return 'Low risk position sizing - suitable for most traders'
      case 'moderate':
        return 'Moderate risk - balanced approach to position sizing'
      case 'aggressive':
        return 'Higher risk - use caution and consider reducing position'
      case 'excessive':
        return 'Very high risk - strongly consider Half Kelly or Quarter Kelly'
      default:
        return 'Risk level unknown'
    }
  }

  static validateTradeMetrics(
    totalTrades: number,
    winningTrades: number,
    averageWin: number,
    averageLoss: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (totalTrades < 0) {
      errors.push('Total trades cannot be negative')
    }

    if (winningTrades < 0 || winningTrades > totalTrades) {
      errors.push('Invalid winning trades count')
    }

    if (averageWin < 0) {
      errors.push('Average win cannot be negative')
    }

    if (averageLoss < 0) {
      errors.push('Average loss cannot be negative')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
