import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { OptionsContract } from '../types/options'
import { StrategyValidationService, type StrategyLeg } from '../services/strategyValidationService'

interface MultiLegStrategyBuilderProps {
  strategyName: string
  contracts: OptionsContract[]
  onLegsSelected: (legs: StrategyLeg[], validation: any) => void
  onBack: () => void
}

/**
 * ULTRA-SIMPLE VERSION
 * No fancy features, no memoization, no pagination
 * Just basic functionality that WORKS
 */
export default function MultiLegStrategyBuilderSimple({
  strategyName,
  contracts,
  onLegsSelected,
  onBack
}: MultiLegStrategyBuilderProps) {
  const [legs, setLegs] = useState<StrategyLeg[]>([])

  // Simple: Just show first 20 contracts
  const simpleContracts = contracts.slice(0, 20)

  const addLeg = (contract: OptionsContract, action: 'buy' | 'sell') => {
    const newLegs = [...legs, { contract, action, quantity: 1 }]
    setLegs(newLegs)
  }

  const removeLeg = (index: number) => {
    setLegs(legs.filter((_, i) => i !== index))
  }

  const validate = () => {
    if (legs.length >= 2) {
      const validation = StrategyValidationService.validateStrategy(strategyName, legs)
      onLegsSelected(legs, validation)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{strategyName} - Simple Mode</h2>
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Selected Legs */}
          {legs.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded">
              <h3 className="font-bold mb-2">Selected Legs ({legs.length})</h3>
              {legs.map((leg, idx) => (
                <div key={idx} className="flex justify-between items-center mb-2">
                  <span>
                    {leg.action.toUpperCase()} {leg.contract.contract_type} ${leg.contract.strike_price} @ ${leg.contract.last}
                  </span>
                  <button
                    onClick={() => removeLeg(idx)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {legs.length >= 2 && (
                <button
                  onClick={validate}
                  className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded font-bold"
                >
                  Validate & Continue
                </button>
              )}
            </div>
          )}

          {/* Simple Contract List */}
          <div className="space-y-2">
            <h3 className="font-bold">Available Contracts (showing first 20)</h3>
            {simpleContracts.map(c => (
              <div key={c.ticker} className="border p-3 rounded flex justify-between items-center">
                <div>
                  <span className="font-bold">{c.contract_type.toUpperCase()}</span> ${c.strike_price} @ ${c.last.toFixed(2)}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => addLeg(c, 'buy')}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => addLeg(c, 'sell')}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    SELL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
