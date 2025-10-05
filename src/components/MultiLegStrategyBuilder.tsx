import React, { useState, useEffect } from 'react'
import { AlertTriangle, Check, Info, ArrowRight } from 'lucide-react'
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

      // Only call onLegsSelected when we have the complete number of legs AND validation passes
      // Bull Call Spread and Bear Put Spread require exactly 2 legs
      const requiredLegs = (strategyName === 'Bull Call Spread' || strategyName === 'Bear Put Spread') ? 2 :
                          (strategyName === 'Iron Condor' || strategyName === 'Butterfly Spread') ? 4 :
                          (strategyName === 'Straddle' || strategyName === 'Strangle') ? 2 : 1

      if (legs.length === requiredLegs && validationResult.isValid) {
        onLegsSelected(legs, validationResult)
      }
    } else {
      setValidation(null)
    }
  }, [legs, strategyName, onLegsSelected])

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

    const spreadWidth = buyLeg && sellLeg
      ? sellLeg.contract.strike_price - buyLeg.contract.strike_price
      : 0
    const netDebit = buyLeg && sellLeg
      ? (buyLeg.contract.last - sellLeg.contract.last) * 100
      : 0
    const maxProfit = buyLeg && sellLeg
      ? (spreadWidth * 100) - netDebit
      : 0

    return (
      <div className="space-y-6">
        {/* Main Progress Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Bull Call Spread Builder</h2>
              <p className="text-blue-100 text-sm">Complete both legs to create your spread strategy</p>
            </div>
            <div className="bg-white text-blue-900 rounded-lg px-4 py-2 font-bold text-lg">
              {!buyLeg && !sellLeg && '0 of 2 Legs'}
              {buyLeg && !sellLeg && '1 of 2 Legs'}
              {buyLeg && sellLeg && '2 of 2 Legs ✓'}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-3 bg-blue-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 transition-all duration-500 ease-out"
                style={{ width: `${buyLeg && sellLeg ? 100 : buyLeg ? 50 : 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-blue-100">
              <span className={buyLeg ? 'font-bold text-white' : ''}>Leg 1</span>
              <span className={buyLeg && sellLeg ? 'font-bold text-white' : ''}>Leg 2</span>
            </div>
          </div>
        </div>

        {/* Strategy Info Banner */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">How This Works:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li><strong>Leg 1 (Long):</strong> BUY a call at a lower strike price</li>
                <li><strong>Leg 2 (Short):</strong> SELL a call at a higher strike price</li>
              </ol>
              <p className="mt-2 text-xs">The short call caps your upside but reduces your cost.</p>
            </div>
          </div>
        </div>

        {/* Leg 1: Buy Call */}
        <div className={`p-5 rounded-lg border-3 shadow-md ${
          buyLeg ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`rounded-full w-10 h-10 flex items-center justify-center font-bold ${
                buyLeg ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {buyLeg ? '✓' : '1'}
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Leg 1 of 2
                </div>
                <label className="text-lg font-bold text-gray-900">
                  Buy Call (Lower Strike) <span className="text-red-500">*</span>
                </label>
              </div>
            </div>
            {buyLeg && (
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                COMPLETED
              </div>
            )}
          </div>
          <select
            value={buyLeg?.contract.ticker || ''}
            onChange={(e) => {
              const contract = calls.find(c => c.ticker === e.target.value)
              if (contract) addLeg(contract, 'buy', 1)
            }}
            className={`block w-full border-2 rounded-lg shadow-sm p-3 text-base font-medium ${
              buyLeg
                ? 'border-green-500 bg-white'
                : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={!selectedExpiry}
          >
            <option value="">Select buy call (long position)...</option>
            {calls.map(c => (
              <option key={c.ticker} value={c.ticker}>
                Strike ${c.strike_price} • Premium ${c.last.toFixed(2)} • Volume: {c.volume}
              </option>
            ))}
          </select>
          {buyLeg && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700 font-semibold bg-green-100 border border-green-300 rounded-lg p-3">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Selected: Buy 1 Call @ ${buyLeg.contract.strike_price} for ${buyLeg.contract.last.toFixed(2)}</span>
              </div>
              {!sellLeg && (
                <div className="flex items-center gap-2 text-sm text-blue-700 font-medium bg-blue-100 border border-blue-300 rounded-lg p-3">
                  <ArrowRight className="w-4 h-4 flex-shrink-0 animate-pulse" />
                  <span>Now proceed to <strong>Leg 2 of 2</strong> below ↓</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Leg 2: Sell Call */}
        <div className={`p-5 rounded-lg border-3 shadow-md ${
          !buyLeg ? 'border-gray-300 bg-gray-50 opacity-60' :
          sellLeg ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`rounded-full w-10 h-10 flex items-center justify-center font-bold ${
                !buyLeg ? 'bg-gray-400 text-white' :
                sellLeg ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {sellLeg ? '✓' : '2'}
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Leg 2 of 2
                </div>
                <label className="text-lg font-bold text-gray-900">
                  Sell Call (Higher Strike) <span className="text-red-500">*</span>
                </label>
              </div>
            </div>
            {sellLeg && (
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                COMPLETED
              </div>
            )}
          </div>
          <select
            value={sellLeg?.contract.ticker || ''}
            onChange={(e) => {
              const contract = calls.find(c => c.ticker === e.target.value)
              if (contract) addLeg(contract, 'sell', 1)
            }}
            className={`block w-full border-2 rounded-lg shadow-sm p-3 text-base font-medium ${
              !buyLeg ? 'border-gray-300 bg-gray-100 cursor-not-allowed' :
              sellLeg ? 'border-green-500 bg-white' : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={!buyLeg}
          >
            <option value="">Select sell call (short position)...</option>
            {availableSellCalls.length === 0 && buyLeg && (
              <option value="" disabled>No higher strikes available</option>
            )}
            {availableSellCalls.map(c => (
              <option key={c.ticker} value={c.ticker}>
                Strike ${c.strike_price} • Premium ${c.last.toFixed(2)} • Volume: {c.volume}
              </option>
            ))}
          </select>
          {!buyLeg && (
            <div className="mt-3 bg-gray-100 border border-gray-300 rounded-lg p-3">
              <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                Complete <strong>Leg 1 of 2</strong> first to unlock this selection
              </p>
            </div>
          )}
          {sellLeg && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-700 font-semibold bg-green-100 border border-green-300 rounded-lg p-3">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Selected: Sell 1 Call @ ${sellLeg.contract.strike_price} for ${sellLeg.contract.last.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Strategy Summary */}
        {buyLeg && sellLeg && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500 rounded-lg p-5">
            <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Complete Bull Call Spread Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border border-green-300">
                <div className="text-gray-600 font-medium mb-1">Spread Width</div>
                <div className="text-xl font-bold text-gray-900">${spreadWidth.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-300">
                <div className="text-gray-600 font-medium mb-1">Net Debit (Cost)</div>
                <div className="text-xl font-bold text-red-600">${netDebit.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-300">
                <div className="text-gray-600 font-medium mb-1">Max Profit</div>
                <div className="text-xl font-bold text-green-600">${maxProfit.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-300">
                <div className="text-gray-600 font-medium mb-1">Max Loss</div>
                <div className="text-xl font-bold text-red-600">${netDebit.toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-green-800">
              <strong>Breakeven:</strong> ${(buyLeg.contract.strike_price + (netDebit / 100)).toFixed(2)}
              <span className="ml-2">•</span>
              <strong className="ml-2">Max Profit if stock ≥ ${sellLeg.contract.strike_price}</strong>
            </div>
          </div>
        )}

        {/* Warning if not complete */}
        {(!buyLeg || !sellLeg) && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-900">
                <p className="font-semibold mb-1">Incomplete Strategy</p>
                <p>You must select BOTH legs to create a valid Bull Call Spread. {!buyLeg ? 'Start by selecting the buy call.' : 'Now select the sell call to complete your spread.'}</p>
              </div>
            </div>
          </div>
        )}
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
