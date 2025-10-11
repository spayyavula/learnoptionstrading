export type OIAction = 'Long Buildup' | 'Short Cover' | 'Long Unwind' | 'Short Buildup' | 'Neutral'

export interface OIActionResult {
  action: OIAction
  confidence: 'high' | 'medium' | 'low'
  description: string
  isBullish: boolean
  color: string
}

export class OIActionClassifier {
  static classifyOIAction(
    priceChange: number,
    oiChange: number,
    volumeChange?: number
  ): OIActionResult {
    const priceUp = priceChange > 0
    const oiUp = oiChange > 0
    const strongPriceMove = Math.abs(priceChange) > 1.0
    const strongOIMove = Math.abs(oiChange) > 2.0

    let action: OIAction
    let isBullish: boolean
    let description: string
    let confidence: 'high' | 'medium' | 'low' = 'medium'

    if (priceUp && oiUp) {
      action = 'Long Buildup'
      isBullish = true
      description = 'Price rising with OI increase suggests aggressive buying and bullish sentiment'
      if (strongPriceMove && strongOIMove) confidence = 'high'
    } else if (priceUp && !oiUp) {
      action = 'Short Cover'
      isBullish = true
      description = 'Price rising with OI decrease indicates short covering and potential bullish reversal'
      if (strongPriceMove && oiChange < -2.0) confidence = 'high'
    } else if (!priceUp && !oiUp) {
      action = 'Long Unwind'
      isBullish = false
      description = 'Price falling with OI decrease suggests long unwinding and bearish sentiment'
      if (strongPriceMove && oiChange < -2.0) confidence = 'high'
    } else if (!priceUp && oiUp) {
      action = 'Short Buildup'
      isBullish = false
      description = 'Price falling with OI increase indicates short selling and bearish outlook'
      if (strongPriceMove && strongOIMove) confidence = 'high'
    } else {
      action = 'Neutral'
      isBullish = false
      description = 'No clear directional signal from price and OI movements'
      confidence = 'low'
    }

    if (Math.abs(priceChange) < 0.3 || Math.abs(oiChange) < 0.5) {
      confidence = 'low'
    }

    return {
      action,
      confidence,
      description,
      isBullish,
      color: this.getActionColor(action)
    }
  }

  static getActionColor(action: OIAction): string {
    switch (action) {
      case 'Long Buildup':
        return 'text-green-600 font-semibold'
      case 'Short Cover':
        return 'text-green-500'
      case 'Long Unwind':
        return 'text-red-500'
      case 'Short Buildup':
        return 'text-red-600 font-semibold'
      default:
        return 'text-gray-600'
    }
  }

  static getActionBgColor(action: OIAction): string {
    switch (action) {
      case 'Long Buildup':
        return 'bg-green-50 border-green-200'
      case 'Short Cover':
        return 'bg-green-50 border-green-100'
      case 'Long Unwind':
        return 'bg-red-50 border-red-100'
      case 'Short Buildup':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  static getActionIcon(action: OIAction): string {
    switch (action) {
      case 'Long Buildup':
        return '↗️'
      case 'Short Cover':
        return '⬆️'
      case 'Long Unwind':
        return '⬇️'
      case 'Short Buildup':
        return '↘️'
      default:
        return '➡️'
    }
  }

  static isBullishAction(action: OIAction): boolean {
    return action === 'Long Buildup' || action === 'Short Cover'
  }

  static isBearishAction(action: OIAction): boolean {
    return action === 'Long Unwind' || action === 'Short Buildup'
  }

  static filterByAction(
    action: OIAction | null,
    longBuildup: boolean,
    shortCover: boolean,
    longUnwind: boolean,
    shortBuildup: boolean
  ): boolean {
    if (!action) return true

    if (longBuildup && action === 'Long Buildup') return true
    if (shortCover && action === 'Short Cover') return true
    if (longUnwind && action === 'Long Unwind') return true
    if (shortBuildup && action === 'Short Buildup') return true

    return false
  }

  static getStrengthIndicator(priceChange: number, oiChange: number): {
    strength: number
    label: string
  } {
    const strength = Math.min(
      100,
      Math.round((Math.abs(priceChange) * 30 + Math.abs(oiChange) * 20) / 2)
    )

    let label = 'Weak'
    if (strength > 70) label = 'Very Strong'
    else if (strength > 50) label = 'Strong'
    else if (strength > 30) label = 'Moderate'

    return { strength, label }
  }
}
