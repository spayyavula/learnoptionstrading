import React, { useState } from 'react'
import { X, TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react'
import { FinFeedMarket as PredictionMarket } from '../../services/finfeedService'

interface QuickTradeModalProps {
  market: PredictionMarket
  onClose: () => void
  onPlaceTrade: (side: 'yes' | 'no', amount: number) => void
  accountBalance?: number
}

export const QuickTradeModal: React.FC<QuickTradeModalProps> = ({
  market,
  onClose,
  onPlaceTrade,
  accountBalance = 1000
}) => {
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null)
  const [amount, setAmount] = useState<number>(25)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const yesProb = (market.yes_price || 0.5) * 100
  const noProb = (market.no_price || 0.5) * 100

  const presetAmounts = [10, 25, 50, 100]

  const calculateReturns = () => {
    if (!selectedSide) return { maxWin: 0, maxLoss: 0, breakeven: 0, contracts: 0 }

    const price = selectedSide === 'yes' ? market.yes_price || 0.5 : market.no_price || 0.5
    const contracts = Math.floor(amount / price)
    const actualCost = contracts * price
    const maxWin = contracts * (1 - price)
    const maxLoss = actualCost
    const breakeven = price * 100

    return { maxWin, maxLoss: actualCost, breakeven, contracts }
  }

  const returns = calculateReturns()

  const getEdgeIndicator = () => {
    if (!selectedSide) return null

    const price = selectedSide === 'yes' ? market.yes_price || 0.5 : market.no_price || 0.5
    const marketProb = price * 100

    // Simple edge calculation (would be more sophisticated in production)
    if (marketProb > 48 && marketProb < 52) {
      return {
        type: 'neutral',
        message: 'Trading at market price - no clear edge',
        icon: '⚖️'
      }
    } else if (marketProb < 45 || marketProb > 55) {
      return {
        type: 'edge',
        message: 'Market has strong conviction',
        icon: '💪'
      }
    }

    return {
      type: 'slight',
      message: 'Slight edge possible',
      icon: '📊'
    }
  }

  const edge = getEdgeIndicator()

  const handleAmountSelect = (value: number) => {
    setAmount(value)
    setShowCustomInput(false)
    setCustomAmount('')
  }

  const handleCustomAmount = () => {
    const value = parseFloat(customAmount)
    if (!isNaN(value) && value > 0 && value <= accountBalance) {
      setAmount(value)
    }
  }

  const handleTrade = () => {
    if (selectedSide && amount > 0) {
      onPlaceTrade(selectedSide, amount)
    }
  }

  const canTrade = selectedSide !== null && amount > 0 && amount <= accountBalance

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 pr-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Quick Trade
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {market.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Choose Side */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              I think this will...
            </label>

            <div className="grid grid-cols-2 gap-4">
              {/* YES Button */}
              <button
                onClick={() => setSelectedSide('yes')}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                  selectedSide === 'yes'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-4 ring-green-200 dark:ring-green-800/40 scale-105'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/10'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <TrendingUp className={`w-8 h-8 mb-2 ${
                    selectedSide === 'yes' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                  }`} />
                  <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    HAPPEN
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    (YES)
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                    {yesProb.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    ${(market.yes_price || 0).toFixed(2)}
                  </div>
                </div>
                {selectedSide === 'yes' && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>

              {/* NO Button */}
              <button
                onClick={() => setSelectedSide('no')}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                  selectedSide === 'no'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-4 ring-red-200 dark:ring-red-800/40 scale-105'
                    : 'border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/10'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <TrendingDown className={`w-8 h-8 mb-2 ${
                    selectedSide === 'no' ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                  }`} />
                  <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    NOT HAPPEN
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    (NO)
                  </div>
                  <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                    {noProb.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    ${(market.no_price || 0).toFixed(2)}
                  </div>
                </div>
                {selectedSide === 'no' && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Amount */}
          {selectedSide && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                How much to risk?
              </label>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {presetAmounts.map(preset => (
                  <button
                    key={preset}
                    onClick={() => handleAmountSelect(preset)}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      amount === preset && !showCustomInput
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Enter custom amount...
                </button>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                  <button
                    onClick={handleCustomAmount}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Set
                  </button>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Available balance: ${accountBalance.toFixed(2)}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedSide && amount > 0 && (
            <div className="animate-fadeIn bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Your Bet Summary</h4>
                <Info className="w-4 h-4 text-gray-400" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Betting:</span>
                  <span className={`font-semibold ${
                    selectedSide === 'yes' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {selectedSide.toUpperCase()} ({selectedSide === 'yes' ? yesProb.toFixed(0) : noProb.toFixed(0)}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Contracts:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{returns.contracts}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Risk:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${returns.maxLoss.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Max Win:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">${returns.maxWin.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Max Loss:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">${returns.maxLoss.toFixed(2)}</span>
                </div>

                <div className="pt-2 mt-2 border-t border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Breakeven:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{returns.breakeven.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Edge Indicator */}
              {edge && (
                <div className={`mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 flex items-start space-x-2 ${
                  edge.type === 'neutral' ? 'text-yellow-700 dark:text-yellow-400' :
                  edge.type === 'edge' ? 'text-green-700 dark:text-green-400' :
                  'text-blue-700 dark:text-blue-400'
                }`}>
                  <span className="text-lg">{edge.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1">
                      {edge.type === 'neutral' ? 'Neutral' : edge.type === 'edge' ? 'Strong Edge' : 'Slight Edge'}
                    </div>
                    <div className="text-xs">{edge.message}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          {amount > accountBalance * 0.5 && (
            <div className="flex items-start space-x-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                You're risking more than 50% of your balance. Consider reducing your position size.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center space-x-3 p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleTrade}
            disabled={!canTrade}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              canTrade
                ? selectedSide === 'yes'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {canTrade ? '🚀 Place Trade' : 'Select options above'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}
