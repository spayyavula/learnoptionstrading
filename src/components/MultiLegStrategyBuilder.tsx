import React, { useState, useEffect, useRef, useMemo, useTransition } from 'react'
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
  // 🔍 PERFORMANCE DIAGNOSTICS
  const renderCount = useRef(0)
  renderCount.current++

  // Only log every 10th render to avoid console spam
  if (renderCount.current % 10 === 0) {
    console.log(`[PERF] 🔄 Render #${renderCount.current}`)
  }

  const [selectedUnderlying, setSelectedUnderlying] = useState<string | null>(null)
  const [selectedExpiry, setSelectedExpiry] = useState<string | null>(null)
  const [legs, setLegs] = useState<StrategyLeg[]>([])
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [showLivePreview, setShowLivePreview] = useState(true)
  const [hoveredContract, setHoveredContract] = useState<OptionsContract | null>(null)

  // Pagination state for lazy loading
  const [leg1Page, setLeg1Page] = useState(0)
  const [leg2Page, setLeg2Page] = useState(0)
  const PAGE_SIZE = 10 // Show 10 contracts per page

  // Use React 18 useTransition to mark state updates as non-urgent
  const [isPending, startTransition] = useTransition()

  // Use ref to prevent infinite loops
  const lastNotifiedLegs = useRef<string>('')

  const requirements = StrategyValidationService.getRequirements(strategyName)

  // Memoize expensive array operations to prevent recalculations
  const underlyings = useMemo(
    () => Array.from(new Set(contracts.map(c => c.underlying_ticker))),
    [contracts]
  )

  const underlyingContracts = useMemo(
    () => contracts.filter(
      c => c.underlying_ticker === selectedUnderlying && !isContractExpired(c.expiration_date)
    ),
    [contracts, selectedUnderlying]
  )

  const availableExpiries = useMemo(
    () => Array.from(new Set(underlyingContracts.map(c => c.expiration_date))).sort(),
    [underlyingContracts]
  )

  const expiryContracts = useMemo(
    () => underlyingContracts.filter(
      c => c.expiration_date === selectedExpiry &&
           (c.open_interest > 0 || c.volume > 0) &&
           !isContractExpired(c.expiration_date)
    ),
    [underlyingContracts, selectedExpiry]
  )

  // Pre-calculate ALL data at component level - hooks CANNOT be inside render functions!
  const calls = useMemo(
    () => expiryContracts.filter(c => c.contract_type === 'call').sort((a, b) => a.strike_price - b.strike_price),
    [expiryContracts]
  )

  const puts = useMemo(
    () => expiryContracts.filter(c => c.contract_type === 'put').sort((a, b) => b.strike_price - a.strike_price),
    [expiryContracts]
  )

  // Memoize leg lookups to prevent recalculation on every render
  const buyLeg = useMemo(() => legs.find(l => l.action === 'buy'), [legs])
  const sellLeg = useMemo(() => legs.find(l => l.action === 'sell'), [legs])
  const callLeg = useMemo(() => legs.find(l => l.contract.contract_type === 'call'), [legs])
  const putLeg = useMemo(() => legs.find(l => l.contract.contract_type === 'put'), [legs])

  // For Bull Call Spread: available sell calls (higher strikes than buy leg)
  const availableSellCalls = useMemo(
    () => buyLeg ? calls.filter(c => c.strike_price > buyLeg.contract.strike_price) : [],
    [buyLeg, calls]
  )

  // For Bear Put Spread: available sell puts (lower strikes than buy leg)
  const availableSellPuts = useMemo(
    () => buyLeg ? puts.filter(c => c.strike_price < buyLeg.contract.strike_price) : [],
    [buyLeg, puts]
  )

  // Paginated display - works for ALL strategies
  const displayCalls = useMemo(() => calls.slice(0, (leg1Page + 1) * PAGE_SIZE), [calls, leg1Page])
  const displayPuts = useMemo(() => puts.slice(0, (leg1Page + 1) * PAGE_SIZE), [puts, leg1Page])
  const displaySellCalls = useMemo(() => availableSellCalls.slice(0, (leg2Page + 1) * PAGE_SIZE), [availableSellCalls, leg2Page])
  const displaySellPuts = useMemo(() => availableSellPuts.slice(0, (leg2Page + 1) * PAGE_SIZE), [availableSellPuts, leg2Page])

  const hasMoreLeg1Calls = calls.length > displayCalls.length
  const hasMoreLeg1Puts = puts.length > displayPuts.length
  const hasMoreLeg2Calls = availableSellCalls.length > displaySellCalls.length
  const hasMoreLeg2Puts = availableSellPuts.length > displaySellPuts.length

  // For Straddle/Strangle: all unique strike prices
  const strikes = useMemo(
    () => Array.from(new Set([...calls.map(c => c.strike_price), ...puts.map(p => p.strike_price)])).sort((a, b) => a - b),
    [calls, puts]
  )

  // Removed useEffect to prevent any potential loops - validation will be handled inline

  const handleUnderlyingChange = (underlying: string) => {
    setSelectedUnderlying(underlying)
    setSelectedExpiry(null)
    setLegs([])
  }

  const handleExpiryChange = (expiry: string) => {
    setSelectedExpiry(expiry)
    setLegs([])
    // Reset pagination
    setLeg1Page(0)
    setLeg2Page(0)
  }

  const addLeg = (contract: OptionsContract, action: 'buy' | 'sell', quantity: number = 1) => {
    // Use startTransition to mark this state update as non-urgent, allowing React to keep the UI responsive
    startTransition(() => {
      const existingIndex = legs.findIndex(l => l.contract.ticker === contract.ticker)

      if (existingIndex >= 0) {
        const updatedLegs = [...legs]
        updatedLegs[existingIndex] = { contract, action, quantity }
        setLegs(updatedLegs)
      } else {
        setLegs([...legs, { contract, action, quantity }])
      }
    })
  }

  const removeLeg = (ticker: string) => {
    setLegs(legs.filter(l => l.contract.ticker !== ticker))
  }

  // 🔍 FAST number formatting (replacing .toLocaleString() which is SLOW)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const renderBullCallSpreadBuilder = () => {
    // All data is now pre-calculated at component level - no hooks here!
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
                {displayCalls.map(c => {
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
                      <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.volume)}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.open_interest)}</td>
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
          {hasMoreLeg1Calls && (
            <button
              onClick={() => startTransition(() => setLeg1Page(prev => prev + 1))}
              className="mt-2 w-full px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Load More Strikes ({Math.min(PAGE_SIZE, calls.length - displayCalls.length)} more)
            </button>
          )}
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
                    {displaySellCalls.map(c => {
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
                          <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.volume)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.open_interest)}</td>
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
              {hasMoreLeg2Calls && (
                <button
                  onClick={() => startTransition(() => setLeg2Page(prev => prev + 1))}
                  className="mt-2 w-full px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                >
                  Load More Strikes ({Math.min(PAGE_SIZE, availableSellCalls.length - displaySellCalls.length)} more)
                </button>
              )}
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
    // All data is now pre-calculated at component level - no hooks here!
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
                {displayPuts.map(c => {
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
                      <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.volume)}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.open_interest)}</td>
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
                    {displaySellPuts.map(c => {
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
                          <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.volume)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.open_interest)}</td>
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
    // All data is now pre-calculated at component level - no hooks here!

    const handleStraddleStrikeChange = (strike: number) => {
      if (!strike) {
        setLegs([])
        return
      }

      const call = calls.find(c => c.strike_price === strike)
      const put = puts.find(p => p.strike_price === strike)

      const newLegs: StrategyLeg[] = []
      if (call) newLegs.push({ contract: call, action: 'buy', quantity: 1 })
      if (put) newLegs.push({ contract: put, action: 'buy', quantity: 1 })
      setLegs(newLegs)
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Strike Price <span className="text-red-500">*</span>
          </label>
          <select
            value={legs.length > 0 && legs[0]?.contract.strike_price || ''}
            onChange={(e) => handleStraddleStrikeChange(Number(e.target.value))}
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
    // All data is now pre-calculated at component level - no hooks here!
    const callLeg = legs.find(l => l.contract.contract_type === 'call')
    const putLeg = legs.find(l => l.contract.contract_type === 'put')

    // For strangleStrangle, available calls must be higher than put strike
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
                {displayPuts.map(c => {
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
                      <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.volume)}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.open_interest)}</td>
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
                    {displayCalls.map(c => {
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
                          <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.volume)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{formatNumber(c.open_interest)}</td>
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

  // Calculate validation inline to avoid useEffect loops - MEMOIZED to prevent recalculation!
  const currentValidation = useMemo(() => {
    if (legs.length === 0) return null
    return StrategyValidationService.validateStrategy(strategyName, legs)
  }, [strategyName, legs])

  const canProceed = currentValidation?.isValid && legs.length >= (requirements?.minLegs || 1)

  const underlyingPrice = selectedUnderlying && contracts.length > 0
    ? contracts.find(c => c.underlying_ticker === selectedUnderlying)?.strike_price || 100
    : 100

  // Memoize the getLiquidityIndicator function
  const getLiquidityIndicator = useMemo(() => {
    return (contract: OptionsContract) => {
      const totalActivity = contract.volume + contract.open_interest
      if (totalActivity > 5000) return { color: 'bg-green-500', label: 'High' }
      if (totalActivity > 1000) return { color: 'bg-yellow-500', label: 'Medium' }
      return { color: 'bg-red-500', label: 'Low' }
    }
  }, [])

  // Memoize transformed legs for InteractivePayoffDiagram to prevent new array creation
  const transformedLegs = useMemo(
    () => legs.map(leg => ({
      type: leg.contract.contract_type,
      strike: leg.contract.strike_price,
      premium: leg.contract.last,
      action: leg.action,
      quantity: leg.quantity
    })),
    [legs]
  )

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
                {isPending && (
                  <div className="ml-auto flex items-center text-xs text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Updating...
                  </div>
                )}
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
                              Vol: {formatNumber(leg.contract.volume)} | OI: {formatNumber(leg.contract.open_interest)}
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

                {currentValidation && (
                  <div className={`p-4 rounded-lg border-2 ${
                    currentValidation.isValid ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center mb-2">
                      {currentValidation.isValid ? (
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      )}
                      <h4 className={`font-bold text-sm ${
                        currentValidation.isValid ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {currentValidation.isValid ? 'Valid Strategy' : 'Validation Issues'}
                      </h4>
                    </div>

                    {currentValidation.errors.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-red-700 mb-2 space-y-1">
                        {currentValidation.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    )}

                    {currentValidation.warnings.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-yellow-700 mb-2 space-y-1">
                        {currentValidation.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    )}

                    {currentValidation.isValid && (
                      <div className="grid grid-cols-1 gap-2 mt-3 text-xs border-t border-gray-200 pt-3">
                        {currentValidation.maxProfit !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Max Profit:</span>
                            <span className="font-bold text-green-700">
                              {currentValidation.maxProfit === Infinity ? '∞' : `$${currentValidation.maxProfit.toFixed(2)}`}
                            </span>
                          </div>
                        )}
                        {currentValidation.maxLoss !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Max Loss:</span>
                            <span className="font-bold text-red-700">
                              ${Math.abs(currentValidation.maxLoss).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {currentValidation.netDebit !== undefined && currentValidation.netDebit > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Net Cost:</span>
                            <span className="font-bold text-gray-900">
                              ${currentValidation.netDebit.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {currentValidation.netCredit !== undefined && currentValidation.netCredit > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Net Credit:</span>
                            <span className="font-bold text-green-700">
                              ${currentValidation.netCredit.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    // Button disabled when strategy incomplete
                    console.log('Continue button clicked', { canProceed, legsCount: legs.length })
                  }}
                  disabled={!canProceed}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none"
                >
                  {canProceed ? 'Continue to Review' : 'Select Contracts'}
                </button>
              </div>
            )}

            {/* Only show diagram when strategy is COMPLETE to prevent performance issues during selection */}
            {false && showLivePreview && legs.length >= (requirements?.minLegs || 1) && currentValidation?.isValid && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Live Payoff Preview</h3>
                <InteractivePayoffDiagram
                  legs={transformedLegs}
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
