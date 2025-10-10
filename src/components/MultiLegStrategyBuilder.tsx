import React, { useState } from 'react'
import { X, Check } from 'lucide-react'
import type { OptionsContract } from '../types/options'
import { StrategyValidationService, type StrategyLeg, type ValidationResult } from '../services/strategyValidationService'

interface MultiLegStrategyBuilderProps {
  strategyName: string
  contracts: OptionsContract[]
  onLegsSelected: (legs: StrategyLeg[], validation: ValidationResult) => void
  onBack: () => void
}

export default function MultiLegStrategyBuilder({
  strategyName,
  contracts,
  onLegsSelected,
  onBack
}: MultiLegStrategyBuilderProps) {
  console.log('🟢🟢🟢 SIMPLE DROPDOWN BUILDER LOADED - VERSION 2', { strategyName, contracts: contracts.length, timestamp: new Date().toISOString() })

  const [buyLegTicker, setBuyLegTicker] = useState<string>('')
  const [sellLegTicker, setSellLegTicker] = useState<string>('')

  // Filter contracts - only calls for Bull Call Spread
  const calls = contracts
    .filter(c => c.contract_type === 'call')
    .sort((a, b) => a.strike_price - b.strike_price)
    .slice(0, 20) // Limit to 20 to prevent freeze

  const buyContract = calls.find(c => c.ticker === buyLegTicker)
  const sellContract = calls.find(c => c.ticker === sellLegTicker)

  // Available sell options (higher strikes than buy)
  const availableSellCalls = buyContract
    ? calls.filter(c => c.strike_price > buyContract.strike_price).slice(0, 20)
    : []

  const handleContinue = () => {
    if (!buyContract || !sellContract) return

    const legs: StrategyLeg[] = [
      { contract: buyContract, action: 'buy', quantity: 1 },
      { contract: sellContract, action: 'sell', quantity: 1 }
    ]

    const validation = StrategyValidationService.validateStrategy(strategyName, legs)
    onLegsSelected(legs, validation)
  }

  const isValid = buyContract && sellContract

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden mt-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white">🚀 {strategyName}</h3>
          <p className="text-green-100 text-sm mt-1">Select both legs below</p>
        </div>
        <button onClick={onBack} className="p-2 hover:bg-green-800 rounded-lg transition-colors">
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Two Legs Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {/* LEG 1: BUY CALL */}
        <div className="p-6 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center mb-4">
            <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">
              1
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Buy Call</h4>
              <p className="text-xs text-gray-600">Lower Strike</p>
            </div>
            {buyContract && <Check className="h-6 w-6 text-green-600 ml-auto" />}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Strike Price
            </label>
            <select
              value={buyLegTicker}
              onChange={(e) => {
                setBuyLegTicker(e.target.value)
                setSellLegTicker('') // Reset sell leg
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base font-medium bg-white"
            >
              <option value="">Select strike...</option>
              {calls.map(c => (
                <option key={c.ticker} value={c.ticker}>
                  ${c.strike_price} - ${c.last.toFixed(2)}
                </option>
              ))}
            </select>

            {buyContract && (
              <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 space-y-2 mt-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Strike:</span>
                  <span className="text-sm font-bold text-gray-900">${buyContract.strike_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Premium:</span>
                  <span className="text-sm font-bold text-green-700">${buyContract.last.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-green-200">
                  <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                  <span className="text-base font-bold text-red-700">-${(buyContract.last * 100).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LEG 2: SELL CALL */}
        <div className="p-6 bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center mb-4">
            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">
              2
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Sell Call</h4>
              <p className="text-xs text-gray-600">Higher Strike</p>
            </div>
            {sellContract && <Check className="h-6 w-6 text-green-600 ml-auto" />}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Strike Price
            </label>
            <select
              value={sellLegTicker}
              onChange={(e) => setSellLegTicker(e.target.value)}
              disabled={!buyContract}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base font-medium bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {buyContract ? 'Select strike...' : 'Select buy leg first'}
              </option>
              {availableSellCalls.map(c => (
                <option key={c.ticker} value={c.ticker}>
                  ${c.strike_price} - ${c.last.toFixed(2)}
                </option>
              ))}
            </select>

            {sellContract && (
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 space-y-2 mt-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Strike:</span>
                  <span className="text-sm font-bold text-gray-900">${sellContract.strike_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Premium:</span>
                  <span className="text-sm font-bold text-red-700">${sellContract.last.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-red-200">
                  <span className="text-sm font-medium text-gray-700">Total Credit:</span>
                  <span className="text-base font-bold text-green-700">+${(sellContract.last * 100).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strategy Summary */}
      {isValid && (
        <div className="bg-gradient-to-r from-green-50 via-green-100 to-green-50 border-t-2 border-green-500 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-green-900 flex items-center">
              <Check className="h-6 w-6 mr-2 bg-green-500 text-white rounded-full p-1" />
              Strategy Complete!
            </h3>
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 transition-colors"
            >
              Continue to Review
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-lg p-4 border border-green-300">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">Spread Width</p>
              <p className="text-lg font-bold text-gray-900">
                ${(sellContract.strike_price - buyContract.strike_price).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">Net Debit</p>
              <p className="text-lg font-bold text-red-700">
                ${(buyContract.last - sellContract.last).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">Max Profit</p>
              <p className="text-lg font-bold text-green-700">
                ${((sellContract.strike_price - buyContract.strike_price) - (buyContract.last - sellContract.last)).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">Max Loss</p>
              <p className="text-lg font-bold text-red-700">
                ${(buyContract.last - sellContract.last).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
