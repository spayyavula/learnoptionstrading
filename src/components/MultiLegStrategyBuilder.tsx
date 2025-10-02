import React, { useState, useEffect } from 'react'
import { AlertTriangle, Check, Info } from 'lucide-react'
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
  const [selectedUnderlying, setSelectedUnderlying] = useState<string | null>(null)
  const [selectedExpiry, setSelectedExpiry] = useState<string | null>(null)
  const [legs, setLegs] = useState<StrategyLeg[]>([])
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  const requirements = StrategyValidationService.getRequirements(strategyName)
  const underlyings = Array.from(new Set(contracts.map(c => c.underlying_ticker)))

  const underlyingContracts = contracts.filter(
    c => c.underlying_ticker === selectedUnderlying
  )

  const availableExpiries = Array.from(
    new Set(underlyingContracts.map(c => c.expiration_date))
  ).sort()

  const expiryContracts = underlyingContracts.filter(
    c => c.expiration_date === selectedExpiry &&
         (c.open_interest > 0 || c.volume > 0)
  )

  useEffect(() => {
    if (legs.length > 0) {
      const validationResult = StrategyValidationService.validateStrategy(strategyName, legs)
      setValidation(validationResult)
    } else {
      setValidation(null)
    }
  }, [legs, strategyName])

  const handleUnderlyingChange = (underlying: string) => {
    setSelectedUnderlying(underlying)
    setSelectedExpiry(null)
    setLegs([])
  }

  const handleExpiryChange = (expiry: string) => {
    setSelectedExpiry(expiry)
    setLegs([])
  }

  const addLeg = (contract: OptionsContract, action: 'buy' | 'sell', quantity: number = 1) => {
    const existingIndex = legs.findIndex(l => l.contract.ticker === contract.ticker)

    if (existingIndex >= 0) {
      const updatedLegs = [...legs]
      updatedLegs[existingIndex] = { contract, action, quantity }
      setLegs(updatedLegs)
    } else {
      setLegs([...legs, { contract, action, quantity }])
    }
  }

  const removeLeg = (ticker: string) => {
    setLegs(legs.filter(l => l.contract.ticker !== ticker))
  }

  const renderBullCallSpreadBuilder = () => {
    const calls = expiryContracts.filter(c => c.contract_type === 'call').sort((a, b) => a.strike_price - b.strike_price)
    const buyLeg = legs.find(l => l.action === 'buy')
    const sellLeg = legs.find(l => l.action === 'sell')
    const availableSellCalls = buyLeg
      ? calls.filter(c => c.strike_price > buyLeg.contract.strike_price)
      : []

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buy Call (Lower Strike) <span className="text-red-500">*</span>
          </label>
          <select
            value={buyLeg?.contract.ticker || ''}
            onChange={(e) => {
              const contract = calls.find(c => c.ticker === e.target.value)
              if (contract) addLeg(contract, 'buy', 1)
            }}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
            disabled={!selectedExpiry}
          >
            <option value="">Select buy call...</option>
            {calls.map(c => (
              <option key={c.ticker} value={c.ticker}>
                Strike ${c.strike_price} - Premium ${c.last.toFixed(2)} (Vol: {c.volume})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sell Call (Higher Strike) <span className="text-red-500">*</span>
          </label>
          <select
            value={sellLeg?.contract.ticker || ''}
            onChange={(e) => {
              const contract = calls.find(c => c.ticker === e.target.value)
              if (contract) addLeg(contract, 'sell', 1)
            }}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
            disabled={!buyLeg}
          >
            <option value="">Select sell call...</option>
            {availableSellCalls.length === 0 && buyLeg && (
              <option value="" disabled>No higher strikes available</option>
            )}
            {availableSellCalls.map(c => (
              <option key={c.ticker} value={c.ticker}>
                Strike ${c.strike_price} - Premium ${c.last.toFixed(2)} (Vol: {c.volume})
              </option>
            ))}
          </select>
          {!buyLeg && (
            <p className="text-xs text-gray-500 mt-1">Select the buy call first</p>
          )}
        </div>
      </div>
    )
  }

  const renderBearPutSpreadBuilder = () => {
    const puts = expiryContracts.filter(c => c.contract_type === 'put').sort((a, b) => b.strike_price - a.strike_price)
    const buyLeg = legs.find(l => l.action === 'buy')
    const sellLeg = legs.find(l => l.action === 'sell')
    const availableSellPuts = buyLeg
      ? puts.filter(c => c.strike_price < buyLeg.contract.strike_price)
      : []

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buy Put (Higher Strike) <span className="text-red-500">*</span>
          </label>
          <select
            value={buyLeg?.contract.ticker || ''}
            onChange={(e) => {
              const contract = puts.find(c => c.ticker === e.target.value)
              if (contract) addLeg(contract, 'buy', 1)
            }}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
            disabled={!selectedExpiry}
          >
            <option value="">Select buy put...</option>
            {puts.map(c => (
              <option key={c.ticker} value={c.ticker}>
                Strike ${c.strike_price} - Premium ${c.last.toFixed(2)} (Vol: {c.volume})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sell Put (Lower Strike) <span className="text-red-500">*</span>
          </label>
          <select
            value={sellLeg?.contract.ticker || ''}
            onChange={(e) => {
              const contract = puts.find(c => c.ticker === e.target.value)
              if (contract) addLeg(contract, 'sell', 1)
            }}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
            disabled={!buyLeg}
          >
            <option value="">Select sell put...</option>
            {availableSellPuts.length === 0 && buyLeg && (
              <option value="" disabled>No lower strikes available</option>
            )}
            {availableSellPuts.map(c => (
              <option key={c.ticker} value={c.ticker}>
                Strike ${c.strike_price} - Premium ${c.last.toFixed(2)} (Vol: {c.volume})
              </option>
            ))}
          </select>
          {!buyLeg && (
            <p className="text-xs text-gray-500 mt-1">Select the buy put first</p>
          )}
        </div>
      </div>
    )
  }

  const renderStraddleBuilder = () => {
    const calls = expiryContracts.filter(c => c.contract_type === 'call').sort((a, b) => a.strike_price - b.strike_price)
    const puts = expiryContracts.filter(c => c.contract_type === 'put').sort((a, b) => a.strike_price - b.strike_price)

    const strikes = Array.from(new Set([...calls.map(c => c.strike_price), ...puts.map(p => p.strike_price)])).sort((a, b) => a - b)
    const [selectedStrike, setSelectedStrike] = useState<number | null>(null)

    useEffect(() => {
      if (selectedStrike) {
        const call = calls.find(c => c.strike_price === selectedStrike)
        const put = puts.find(p => p.strike_price === selectedStrike)

        const newLegs: StrategyLeg[] = []
        if (call) newLegs.push({ contract: call, action: 'buy', quantity: 1 })
        if (put) newLegs.push({ contract: put, action: 'buy', quantity: 1 })
        setLegs(newLegs)
      }
    }, [selectedStrike])

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Strike Price <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedStrike || ''}
            onChange={(e) => setSelectedStrike(Number(e.target.value))}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
            disabled={!selectedExpiry}
          >
            <option value="">Select strike...</option>
            {strikes.map(strike => {
              const call = calls.find(c => c.strike_price === strike)
              const put = puts.find(p => p.strike_price === strike)
              const hasCall = !!call
              const hasPut = !!put

              return (
                <option key={strike} value={strike} disabled={!hasCall || !hasPut}>
                  Strike ${strike} {!hasCall || !hasPut ? '(Incomplete)' : `- Call: $${call.last.toFixed(2)} Put: $${put.last.toFixed(2)}`}
                </option>
              )
            })}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Straddle requires buying both a call and put at the same strike
          </p>
        </div>
      </div>
    )
  }

  const renderStrangleBuilder = () => {
    const calls = expiryContracts.filter(c => c.contract_type === 'call').sort((a, b) => a.strike_price - b.strike_price)
    const puts = expiryContracts.filter(c => c.contract_type === 'put').sort((a, b) => a.strike_price - b.strike_price)

    const callLeg = legs.find(l => l.contract.contract_type === 'call')
    const putLeg = legs.find(l => l.contract.contract_type === 'put')
    const availableCalls = putLeg ? calls.filter(c => c.strike_price > putLeg.contract.strike_price) : calls

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buy Put (Lower Strike) <span className="text-red-500">*</span>
          </label>
          <select
            value={putLeg?.contract.ticker || ''}
            onChange={(e) => {
              const contract = puts.find(c => c.ticker === e.target.value)
              if (contract) addLeg(contract, 'buy', 1)
            }}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
            disabled={!selectedExpiry}
          >
            <option value="">Select put...</option>
            {puts.map(c => (
              <option key={c.ticker} value={c.ticker}>
                Strike ${c.strike_price} - Premium ${c.last.toFixed(2)} (Vol: {c.volume})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buy Call (Higher Strike) <span className="text-red-500">*</span>
          </label>
          <select
            value={callLeg?.contract.ticker || ''}
            onChange={(e) => {
              const contract = calls.find(c => c.ticker === e.target.value)
              if (contract) addLeg(contract, 'buy', 1)
            }}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
            disabled={!selectedExpiry}
          >
            <option value="">Select call...</option>
            {availableCalls.map(c => (
              <option key={c.ticker} value={c.ticker}>
                Strike ${c.strike_price} - Premium ${c.last.toFixed(2)} (Vol: {c.volume})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Call strike should be higher than put strike
          </p>
        </div>
      </div>
    )
  }

  const renderStrategyBuilder = () => {
    if (!selectedExpiry) return null

    switch (strategyName) {
      case 'Bull Call Spread':
        return renderBullCallSpreadBuilder()
      case 'Bear Put Spread':
        return renderBearPutSpreadBuilder()
      case 'Straddle':
        return renderStraddleBuilder()
      case 'Strangle':
        return renderStrangleBuilder()
      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              Builder for {strategyName} is not yet implemented. Please use the single contract selector.
            </p>
          </div>
        )
    }
  }

  const canProceed = validation?.isValid && legs.length >= (requirements?.minLegs || 1)

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800 mb-1">{strategyName}</h4>
            <p className="text-sm text-blue-700">{requirements?.description}</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Underlying Asset <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedUnderlying || ''}
          onChange={(e) => handleUnderlyingChange(e.target.value)}
          className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
          <option value="">Select underlying...</option>
          {underlyings.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {selectedUnderlying && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiration Date <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedExpiry || ''}
            onChange={(e) => handleExpiryChange(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Select expiration...</option>
            {availableExpiries.map(exp => (
              <option key={exp} value={exp}>{exp}</option>
            ))}
          </select>
        </div>
      )}

      {renderStrategyBuilder()}

      {legs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Selected Legs</h4>
          <div className="space-y-2">
            {legs.map((leg, idx) => (
              <div key={leg.contract.ticker} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                    leg.action === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {leg.action.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">{leg.contract.contract_type.toUpperCase()}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ${leg.contract.strike_price} @ ${leg.contract.last.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => removeLeg(leg.contract.ticker)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {validation && (
        <div className={`border rounded-lg p-4 ${
          validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start mb-2">
            {validation.isValid ? (
              <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
            )}
            <h4 className={`font-semibold ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
              {validation.isValid ? 'Strategy Valid' : 'Validation Errors'}
            </h4>
          </div>

          {validation.errors.length > 0 && (
            <ul className="list-disc list-inside text-sm text-red-700 mb-2">
              {validation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          )}

          {validation.warnings.length > 0 && (
            <ul className="list-disc list-inside text-sm text-yellow-700 mb-2">
              {validation.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          )}

          {validation.isValid && (
            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              {validation.maxProfit !== undefined && (
                <div>
                  <span className="text-gray-600">Max Profit:</span>
                  <span className="ml-2 font-semibold text-green-700">
                    {validation.maxProfit === Infinity ? 'Unlimited' : `$${validation.maxProfit.toFixed(2)}`}
                  </span>
                </div>
              )}
              {validation.maxLoss !== undefined && (
                <div>
                  <span className="text-gray-600">Max Loss:</span>
                  <span className="ml-2 font-semibold text-red-700">
                    ${validation.maxLoss.toFixed(2)}
                  </span>
                </div>
              )}
              {validation.netDebit !== undefined && validation.netDebit > 0 && (
                <div>
                  <span className="text-gray-600">Net Debit:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    ${validation.netDebit.toFixed(2)}
                  </span>
                </div>
              )}
              {validation.netCredit !== undefined && validation.netCredit > 0 && (
                <div>
                  <span className="text-gray-600">Net Credit:</span>
                  <span className="ml-2 font-semibold text-green-700">
                    ${validation.netCredit.toFixed(2)}
                  </span>
                </div>
              )}
              {validation.breakEvenPoints && validation.breakEvenPoints.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-600">Break-Even:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {validation.breakEvenPoints.map(be => `$${be.toFixed(2)}`).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (validation && canProceed) {
              onLegsSelected(legs, validation)
            }
          }}
          disabled={!canProceed}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Review
        </button>
      </div>
    </div>
  )
}
