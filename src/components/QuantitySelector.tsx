import React from 'react'
import { AlertCircle, TrendingUp } from 'lucide-react'

interface QuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  totalCost: number
  accountBalance: number
  buyingPower: number
  maxQuantity?: number
  kellyRecommendation?: number
  showKellyHighlight?: boolean
}

const PRESET_QUANTITIES = [1, 2, 5, 10, 25, 50, 100]

export default function QuantitySelector({
  quantity,
  onQuantityChange,
  totalCost,
  accountBalance,
  buyingPower,
  maxQuantity = 100,
  kellyRecommendation,
  showKellyHighlight = false
}: QuantitySelectorProps) {
  const handlePresetClick = (preset: number) => {
    onQuantityChange(preset)
  }

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    const clamped = Math.max(0, Math.min(maxQuantity, value))
    onQuantityChange(clamped)
  }

  const calculateMetrics = (qty: number) => {
    const cost = totalCost * qty
    const canAfford = cost <= buyingPower
    const percentOfAccount = (cost / accountBalance) * 100
    const percentOfBuyingPower = (cost / buyingPower) * 100

    let riskLevel: 'safe' | 'moderate' | 'high' | 'excessive' = 'safe'
    if (percentOfAccount > 50) riskLevel = 'excessive'
    else if (percentOfAccount > 25) riskLevel = 'high'
    else if (percentOfAccount > 10) riskLevel = 'moderate'

    return {
      cost,
      canAfford,
      percentOfAccount,
      percentOfBuyingPower,
      riskLevel
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'moderate':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'excessive':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const currentMetrics = calculateMetrics(quantity)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          Select Quantity
        </label>
        <span className="text-xs text-gray-500">Max: {maxQuantity} contracts</span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {PRESET_QUANTITIES.map(preset => {
          const metrics = calculateMetrics(preset)
          const isSelected = quantity === preset
          const isKellyRecommendation = kellyRecommendation === preset && showKellyHighlight
          const isDisabled = !metrics.canAfford

          return (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              disabled={isDisabled}
              className={`
                relative px-3 py-2 rounded-lg border-2 font-medium text-sm transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                ${isKellyRecommendation ? 'ring-2 ring-green-400' : ''}
              `}
              title={isDisabled ? 'Insufficient buying power' : `Select ${preset} contract${preset > 1 ? 's' : ''}`}
            >
              <div className="flex flex-col items-center">
                <span>{preset}</span>
                {isKellyRecommendation && (
                  <TrendingUp className="h-3 w-3 text-green-600 mt-0.5" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="custom-quantity" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Custom:
        </label>
        <input
          id="custom-quantity"
          type="number"
          min="0"
          max={maxQuantity}
          value={quantity || ''}
          onChange={handleCustomInput}
          placeholder="Enter quantity"
          className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-medium"
        />
        <span className="text-sm text-gray-600 whitespace-nowrap">contracts</span>
      </div>

      {quantity > 0 && (
        <div className={`p-4 rounded-lg border-2 ${getRiskLevelColor(currentMetrics.riskLevel)}`}>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Cost:</span>
              <span className="text-lg font-bold">
                ${currentMetrics.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span>% of Account:</span>
              <span className="font-semibold">{currentMetrics.percentOfAccount.toFixed(1)}%</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span>% of Buying Power:</span>
              <span className="font-semibold">{currentMetrics.percentOfBuyingPower.toFixed(1)}%</span>
            </div>

            <div className="pt-2 border-t border-current">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Remaining Buying Power:</span>
                <span className="font-bold">
                  ${(buyingPower - currentMetrics.cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {currentMetrics.riskLevel === 'high' && (
            <div className="mt-3 flex items-start gap-2 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                This position represents more than 25% of your account. Consider reducing size to manage risk.
              </p>
            </div>
          )}

          {currentMetrics.riskLevel === 'excessive' && (
            <div className="mt-3 flex items-start gap-2 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p className="font-semibold">
                WARNING: This position exceeds 50% of your account balance. This is extremely risky and not recommended.
              </p>
            </div>
          )}

          {!currentMetrics.canAfford && (
            <div className="mt-3 flex items-start gap-2 text-xs bg-red-100 border border-red-300 rounded p-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p className="font-semibold">
                Insufficient buying power. Maximum affordable quantity is {Math.floor(buyingPower / totalCost)} contract{Math.floor(buyingPower / totalCost) !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
        </div>
      )}

      {kellyRecommendation && kellyRecommendation > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900">
                Kelly Criterion Recommendation
              </p>
              <p className="text-sm text-green-700">
                Suggested quantity: <strong>{kellyRecommendation} contract{kellyRecommendation > 1 ? 's' : ''}</strong>
              </p>
            </div>
            {quantity !== kellyRecommendation && (
              <button
                onClick={() => onQuantityChange(kellyRecommendation)}
                className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
