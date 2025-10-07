import React, { useState, useEffect } from 'react'
import { AlertTriangle, Check, Info, X, Plus, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
import type { OptionsContract } from '../types/options'
import { StrategyValidationService, type StrategyLeg, type ValidationResult } from '../services/strategyValidationService'
import InteractivePayoffDiagram from './InteractivePayoffDiagram'
import { GreeksCalculator } from '../services/greeksCalculator'
import { isContractExpired } from '../services/optionsChainGenerator'

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
  const [showLivePreview, setShowLivePreview] = useState(true)
  const [hoveredContract, setHoveredContract] = useState<OptionsContract | null>(null)

  const requirements = StrategyValidationService.getRequirements(strategyName)
  const underlyings = Array.from(new Set(contracts.map(c => c.underlying_ticker)))

  const underlyingContracts = contracts.filter(
    c => c.underlying_ticker === selectedUnderlying && !isContractExpired(c.expiration_date)
  )

  const availableExpiries = Array.from(
    new Set(underlyingContracts.map(c => c.expiration_date))
  ).sort()

  const expiryContracts = underlyingContracts.filter(
    c => c.expiration_date === selectedExpiry &&
         (c.open_interest > 0 || c.volume > 0) &&
         !isContractExpired(c.expiration_date)
  )

  useEffect(() => {
    if (legs.length > 0) {
      const validationResult = StrategyValidationService.validateStrategy(strategyName, legs)
      setValidation(validationResult)

      // Always notify parent of current state (complete or incomplete)
      onLegsSelected(legs, validationResult)
    } else {
      setValidation(null)
      // Notify parent that we have no legs selected
      onLegsSelected([], {
        isValid: false,
        errors: ['No legs selected'],
        warnings: []
      })
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

    // Calculate strategy metrics when both legs are selected
    const spreadWidth = buyLeg && sellLeg ? sellLeg.contract.strike_price - buyLeg.contract.strike_price : 0
    const netDebit = buyLeg && sellLeg ? buyLeg.contract.last - sellLeg.contract.last : 0
    const maxProfit = spreadWidth - netDebit
    const maxLoss = netDebit

    return (
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">Build Your Bull Call Spread</h3>
            <div className="bg-white text-blue-900 rounded-lg px-3 py-1 font-bold text-sm">
              {!buyLeg && !sellLeg && '0 of 2 Legs Selected'}
              {buyLeg && !sellLeg && '1 of 2 Legs Selected'}
              {buyLeg && sellLeg && '✓ Complete - 2 of 2 Legs'}
            </div>
          </div>
          <div className="w-full bg-blue-400 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-green-400 transition-all duration-500 ease-out"
              style={{ width: `${buyLeg && sellLeg ? 100 : buyLeg ? 50 : 0}%` }}
            />
          </div>
        </div>

        {/* Leg 1: Buy Call */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300 relative">
          <div className="absolute -top-3 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
            LEG 1 OF 2
          </div>
          <label className="flex items-center text-sm font-bold text-green-800 mb-3 mt-2">
            <TrendingUp className="h-5 w-5 mr-2" />
            Buy Call (Lower Strike) <span className="text-red-500 ml-1">*</span>
          </label>
          {buyLeg && (
            <div className="mb-3 p-2 bg-green-200 border border-green-400 rounded-md">
              <p className="text-xs font-bold text-green-900">
                ✓ Selected: ${buyLeg.contract.strike_price} Call @ ${buyLeg.contract.last.toFixed(2)}
              </p>
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-green-200">
            <table className="w-full bg-white">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Strike</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Premium</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Volume</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-green-800">OI</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Action</th>
                </tr>
              </thead>
              <tbody>
                {calls.map(c => {
                  const liquidity = getLiquidityIndicator(c)
                  const isSelected = buyLeg?.contract.ticker === c.ticker
                  return (
                    <tr
                      key={c.ticker}
                      className={`border-t border-green-100 hover:bg-green-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-green-200' : ''
                      }`}
                      onClick={() => addLeg(c, 'buy', 1)}
                    >
                      <td className="px-3 py-2 text-sm font-bold text-gray-900">${c.strike_price}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-700">${c.last.toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{c.volume.toLocaleString()}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{c.open_interest.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        {isSelected ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                            <Check className="h-3 w-3 mr-1" />Selected
                          </span>
                        ) : (
                          <button className="px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-500 hover:text-white rounded-md border border-green-300 transition-colors">
                            Select
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guide to proceed to Leg 2 */}
        {buyLeg && !sellLeg && (
          <div className="flex items-center gap-3 p-4 bg-blue-100 border-2 border-blue-400 rounded-lg animate-pulse">
            <TrendingDown className="h-6 w-6 text-blue-700" />
            <div>
              <p className="font-bold text-blue-900">Great! Now select Leg 2 below ↓</p>
              <p className="text-sm text-blue-800">Choose a call option with a HIGHER strike price to complete your spread</p>
            </div>
          </div>
        )}

        {/* Leg 2: Sell Call */}
        {buyLeg && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-300 relative">
            <div className="absolute -top-3 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
              LEG 2 OF 2
            </div>
            <label className="flex items-center text-sm font-bold text-red-800 mb-3 mt-2">
              <TrendingDown className="h-5 w-5 mr-2" />
              Sell Call (Higher Strike) <span className="text-red-500 ml-1">*</span>
            </label>
            {sellLeg && (
              <div className="mb-3 p-2 bg-red-200 border border-red-400 rounded-md">
                <p className="text-xs font-bold text-red-900">
                  ✓ Selected: ${sellLeg.contract.strike_price} Call @ ${sellLeg.contract.last.toFixed(2)}
                </p>
              </div>
            )}
            {availableSellCalls.length === 0 ? (
              <div className="bg-white rounded-lg p-4 text-center text-red-700 border border-red-200">
                <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                <p className="text-sm font-medium">No higher strikes available</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-red-200">
                <table className="w-full bg-white">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800">Strike</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800">Premium</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800">Volume</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800">OI</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableSellCalls.map(c => {
                      const isSelected = sellLeg?.contract.ticker === c.ticker
                      return (
                        <tr
                          key={c.ticker}
                          className={`border-t border-red-100 hover:bg-red-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-red-200' : ''
                          }`}
                          onClick={() => addLeg(c, 'sell', 1)}
                        >
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">${c.strike_price}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-gray-700">${c.last.toFixed(2)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{c.volume.toLocaleString()}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{c.open_interest.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            {isSelected ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                                <Check className="h-3 w-3 mr-1" />Selected
                              </span>
                            ) : (
                              <button className="px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-500 hover:text-white rounded-md border border-red-300 transition-colors">
                                Select
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Strategy Summary - shown when both legs are complete */}
        {buyLeg && sellLeg && (
          <div className="bg-gradient-to-r from-green-50 via-green-100 to-green-50 border-3 border-green-500 rounded-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-green-900 flex items-center">
                <Check className="h-6 w-6 mr-2 bg-green-500 text-white rounded-full p-1" />
                ✓ Bull Call Spread Complete!
              </h3>
              <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                Ready to Trade
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-lg p-4 border border-green-300">
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">Spread Width</p>
                <p className="text-lg font-bold text-gray-900">${spreadWidth.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">Net Cost (Debit)</p>
                <p className="text-lg font-bold text-red-700">${netDebit.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">Max Profit</p>
                <p className="text-lg font-bold text-green-700">${maxProfit.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">Max Loss</p>
                <p className="text-lg font-bold text-red-700">${maxLoss.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Strategy Summary:</strong> You're buying the ${buyLeg.contract.strike_price} call for ${buyLeg.contract.last.toFixed(2)}
                and selling the ${sellLeg.contract.strike_price} call for ${sellLeg.contract.last.toFixed(2)}.
                This creates a bullish spread with limited risk (${maxLoss.toFixed(2)}) and limited profit potential (${maxProfit.toFixed(2)}).
              </p>
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
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
          <label className="flex items-center text-sm font-bold text-green-800 mb-3">
            <TrendingUp className="h-5 w-5 mr-2" />
            Step 1: Buy Put (Higher Strike) <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="overflow-x-auto rounded-lg border border-green-200">
            <table className="w-full bg-white">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Strike</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Premium</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Volume</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-green-800">OI</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Action</th>
                </tr>
              </thead>
              <tbody>
                {puts.map(c => {
                  const liquidity = getLiquidityIndicator(c)
                  const isSelected = buyLeg?.contract.ticker === c.ticker
                  return (
                    <tr
                      key={c.ticker}
                      className={`border-t border-green-100 hover:bg-green-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-green-200' : ''
                      }`}
                      onClick={() => addLeg(c, 'buy', 1)}
                    >
                      <td className="px-3 py-2 text-sm font-bold text-gray-900">${c.strike_price}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-700">${c.last.toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{c.volume.toLocaleString()}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{c.open_interest.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        {isSelected ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                            <Check className="h-3 w-3 mr-1" />Selected
                          </span>
                        ) : (
                          <button className="px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-500 hover:text-white rounded-md border border-green-300 transition-colors">
                            Select
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {buyLeg && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-300">
            <label className="flex items-center text-sm font-bold text-red-800 mb-3">
              <TrendingDown className="h-5 w-5 mr-2" />
              Step 2: Sell Put (Lower Strike) <span className="text-red-500 ml-1">*</span>
            </label>
            {availableSellPuts.length === 0 ? (
              <div className="bg-white rounded-lg p-4 text-center text-red-700 border border-red-200">
                <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                <p className="text-sm font-medium">No lower strikes available</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-red-200">
                <table className="w-full bg-white">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800">Strike</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800">Premium</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800">Volume</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800">OI</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-800">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableSellPuts.map(c => {
                      const isSelected = sellLeg?.contract.ticker === c.ticker
                      return (
                        <tr
                          key={c.ticker}
                          className={`border-t border-red-100 hover:bg-red-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-red-200' : ''
                          }`}
                          onClick={() => addLeg(c, 'sell', 1)}
                        >
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">${c.strike_price}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-gray-700">${c.last.toFixed(2)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{c.volume.toLocaleString()}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{c.open_interest.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            {isSelected ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                                <Check className="h-3 w-3 mr-1" />Selected
                              </span>
                            ) : (
                              <button className="px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-500 hover:text-white rounded-md border border-red-300 transition-colors">
                                Select
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
          <label className="flex items-center text-sm font-bold text-blue-800 mb-3">
            <TrendingDown className="h-5 w-5 mr-2" />
            Step 1: Buy Put (Lower Strike) <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="overflow-x-auto rounded-lg border border-blue-200">
            <table className="w-full bg-white">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-800">Strike</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-800">Premium</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-800">Volume</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-800">OI</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-800">Action</th>
                </tr>
              </thead>
              <tbody>
                {puts.map(c => {
                  const liquidity = getLiquidityIndicator(c)
                  const isSelected = putLeg?.contract.ticker === c.ticker
                  return (
                    <tr
                      key={c.ticker}
                      className={`border-t border-blue-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-200' : ''
                      }`}
                      onClick={() => addLeg(c, 'buy', 1)}
                    >
                      <td className="px-3 py-2 text-sm font-bold text-gray-900">${c.strike_price}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-gray-700">${c.last.toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{c.volume.toLocaleString()}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{c.open_interest.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        {isSelected ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                            <Check className="h-3 w-3 mr-1" />Selected
                          </span>
                        ) : (
                          <button className="px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-500 hover:text-white rounded-md border border-blue-300 transition-colors">
                            Select
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {putLeg && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
            <label className="flex items-center text-sm font-bold text-green-800 mb-3">
              <TrendingUp className="h-5 w-5 mr-2" />
              Step 2: Buy Call (Higher Strike) <span className="text-red-500 ml-1">*</span>
            </label>
            {availableCalls.length === 0 ? (
              <div className="bg-white rounded-lg p-4 text-center text-green-700 border border-green-200">
                <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                <p className="text-sm font-medium">No higher strikes available</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-green-200">
                <table className="w-full bg-white">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Strike</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Premium</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Volume</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-green-800">OI</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-green-800">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableCalls.map(c => {
                      const isSelected = callLeg?.contract.ticker === c.ticker
                      return (
                        <tr
                          key={c.ticker}
                          className={`border-t border-green-100 hover:bg-green-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-green-200' : ''
                          }`}
                          onClick={() => addLeg(c, 'buy', 1)}
                        >
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">${c.strike_price}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-gray-700">${c.last.toFixed(2)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{c.volume.toLocaleString()}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{c.open_interest.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            {isSelected ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                                <Check className="h-3 w-3 mr-1" />Selected
                              </span>
                            ) : (
                              <button className="px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-500 hover:text-white rounded-md border border-green-300 transition-colors">
                                Select
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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

  const underlyingPrice = selectedUnderlying && contracts.length > 0
    ? contracts.find(c => c.underlying_ticker === selectedUnderlying)?.strike_price || 100
    : 100

  const getLiquidityIndicator = (contract: OptionsContract) => {
    const totalActivity = contract.volume + contract.open_interest
    if (totalActivity > 5000) return { color: 'bg-green-500', label: 'High' }
    if (totalActivity > 1000) return { color: 'bg-yellow-500', label: 'Medium' }
    return { color: 'bg-red-500', label: 'Low' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{strategyName}</h2>
                    <p className="text-sm text-gray-600 mt-1">{requirements?.description}</p>
                  </div>
                </div>
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close builder"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <span className="font-semibold">Required:</span> {requirements?.minLegs} leg{requirements?.minLegs !== 1 ? 's' : ''}
                  {requirements?.maxLegs !== requirements?.minLegs && ` (max ${requirements?.maxLegs})`}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Underlying Asset <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedUnderlying || ''}
                    onChange={(e) => handleUnderlyingChange(e.target.value)}
                    className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium transition-colors"
                  >
                    <option value="">Select underlying...</option>
                    {underlyings.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {selectedUnderlying && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiration Date <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedExpiry || ''}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium transition-colors"
                    >
                      <option value="">Select expiration...</option>
                      {availableExpiries.map(exp => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {renderStrategyBuilder()}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {legs.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Strategy Summary</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {legs.length} Leg{legs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  {legs.map((leg, idx) => {
                    const liquidity = getLiquidityIndicator(leg.contract)
                    return (
                      <div key={leg.contract.ticker} className="relative group">
                        <div className="flex items-start justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold mr-2 ${
                                leg.action === 'buy' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              }`}>
                                {leg.action === 'buy' ? (
                                  <><Plus className="h-3 w-3 mr-1" />BUY</>
                                ) : (
                                  <><X className="h-3 w-3 mr-1" />SELL</>
                                )}
                              </span>
                              <span className="text-xs font-semibold text-gray-900">
                                {leg.contract.contract_type.toUpperCase()}
                              </span>
                              <div className="flex items-center ml-2">
                                <div className={`h-2 w-2 rounded-full ${liquidity.color} mr-1`} />
                                <span className="text-xs text-gray-600">{liquidity.label}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700">
                              <span className="font-bold">${leg.contract.strike_price}</span>
                              <span className="mx-2 text-gray-400">@</span>
                              <span className="font-semibold">${leg.contract.last.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Vol: {leg.contract.volume.toLocaleString()} | OI: {leg.contract.open_interest.toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => removeLeg(leg.contract.ticker)}
                            className="opacity-0 group-hover:opacity-100 ml-2 p-1.5 hover:bg-red-100 rounded-md transition-all"
                            title="Remove leg"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {validation && (
                  <div className={`p-4 rounded-lg border-2 ${
                    validation.isValid ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center mb-2">
                      {validation.isValid ? (
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      )}
                      <h4 className={`font-bold text-sm ${
                        validation.isValid ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {validation.isValid ? 'Valid Strategy' : 'Validation Issues'}
                      </h4>
                    </div>

                    {validation.errors.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-red-700 mb-2 space-y-1">
                        {validation.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    )}

                    {validation.warnings.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-yellow-700 mb-2 space-y-1">
                        {validation.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    )}

                    {validation.isValid && (
                      <div className="grid grid-cols-1 gap-2 mt-3 text-xs border-t border-gray-200 pt-3">
                        {validation.maxProfit !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Max Profit:</span>
                            <span className="font-bold text-green-700">
                              {validation.maxProfit === Infinity ? '∞' : `$${validation.maxProfit.toFixed(2)}`}
                            </span>
                          </div>
                        )}
                        {validation.maxLoss !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Max Loss:</span>
                            <span className="font-bold text-red-700">
                              ${Math.abs(validation.maxLoss).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {validation.netDebit !== undefined && validation.netDebit > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Net Cost:</span>
                            <span className="font-bold text-gray-900">
                              ${validation.netDebit.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {validation.netCredit !== undefined && validation.netCredit > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Net Credit:</span>
                            <span className="font-bold text-green-700">
                              ${validation.netCredit.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (validation && canProceed) {
                      onLegsSelected(legs, validation)
                    }
                  }}
                  disabled={!canProceed}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none"
                >
                  {canProceed ? 'Continue to Review' : 'Select Contracts'}
                </button>
              </div>
            )}

            {showLivePreview && legs.length > 0 && validation?.isValid && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Live Payoff Preview</h3>
                <InteractivePayoffDiagram
                  legs={legs.map(leg => ({
                    type: leg.contract.contract_type,
                    strike: leg.contract.strike_price,
                    premium: leg.contract.last,
                    action: leg.action,
                    quantity: leg.quantity
                  }))}
                  strategyName={strategyName}
                  underlyingPrice={underlyingPrice}
                  className=""
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
