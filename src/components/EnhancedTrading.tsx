import React, { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Info, Check, ChevronRight, BarChart3 } from 'lucide-react'
import { useOptionsContext } from '../context/OptionsContext'
import { PolygonService } from '../services/polygonService'
import { getUnderlyingPrice, getAvailableUnderlyings } from '../services/optionsChainGenerator'
import ContractSelector from './ContractSelector'
import PayoffDiagram from './PayoffDiagram'
import InteractivePayoffDiagram from './InteractivePayoffDiagram'
import GreeksPanel from './GreeksPanel'
import KellyCriterion from './KellyCriterion'
import { GreeksCalculator } from '../services/greeksCalculator'
import type { OptionsContract } from '../types/options'

interface Strategy {
  name: string
  description: string
  riskLevel: 'low' | 'medium' | 'high'
  directional: boolean
}

const STRATEGY_CONFIG: Record<string, { [key: string]: Strategy[] }> = {
  Bull: [
    { name: 'Bull Call Spread', description: 'Limited risk, limited reward - profit from moderate upside', riskLevel: 'low', directional: true },
    { name: 'Long Call', description: 'Unlimited upside potential - simple bullish play', riskLevel: 'medium', directional: true },
    { name: 'Cash-Secured Put', description: 'Generate income while waiting to buy at lower price', riskLevel: 'medium', directional: false }
  ],
  Bear: [
    { name: 'Bear Put Spread', description: 'Limited risk, limited reward - profit from moderate downside', riskLevel: 'low', directional: true },
    { name: 'Long Put', description: 'Profit from price decline with limited risk', riskLevel: 'medium', directional: true },
    { name: 'Covered Call', description: 'Generate income on stock you own', riskLevel: 'low', directional: false }
  ],
  Volatile: [
    { name: 'Long Straddle', description: 'Profit from large moves in either direction', riskLevel: 'high', directional: false },
    { name: 'Long Strangle', description: 'Cheaper straddle with wider breakevens', riskLevel: 'high', directional: false },
    { name: 'Iron Butterfly', description: 'Profit from volatility contraction', riskLevel: 'medium', directional: false }
  ],
  Sideways: [
    { name: 'Iron Condor', description: 'Profit from range-bound movement', riskLevel: 'medium', directional: false },
    { name: 'Short Strangle', description: 'High probability income strategy', riskLevel: 'high', directional: false },
    { name: 'Butterfly Spread', description: 'Low-cost neutral strategy', riskLevel: 'low', directional: false }
  ]
}

type MarketRegime = 'Bull' | 'Bear' | 'Volatile' | 'Sideways'

export default function EnhancedTrading() {
  const { state, dispatch } = useOptionsContext()

  const [step, setStep] = useState(1)
  const [regime, setRegime] = useState<MarketRegime>('Bull')
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [selectedUnderlying, setSelectedUnderlying] = useState<string>('')
  const [contracts, setContracts] = useState<OptionsContract[]>([])
  const [selectedContract, setSelectedContract] = useState<OptionsContract | null>(null)
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)

  const availableUnderlyings = useMemo(() => getAvailableUnderlyings(), [])

  useEffect(() => {
    if (selectedUnderlying) {
      loadContracts()
    }
  }, [selectedUnderlying])

  const loadContracts = () => {
    setLoading(true)
    const allContracts = PolygonService.getOptionsChainForUnderlying(selectedUnderlying)
    setContracts(allContracts)
    setLoading(false)
  }

  const underlyingPrice = selectedUnderlying ? getUnderlyingPrice(selectedUnderlying) : 100

  const strategies = STRATEGY_CONFIG[regime]

  const canProceedToStep2 = regime && selectedUnderlying
  const canProceedToStep3 = selectedStrategy && selectedContract

  const handlePlaceOrder = () => {
    if (!selectedContract || !quantity || parseInt(quantity) <= 0) return

    const orderQuantity = parseInt(quantity)
    const totalCost = orderQuantity * selectedContract.last * 100

    if (totalCost > state.buyingPower) {
      alert('Insufficient buying power')
      return
    }

    dispatch({
      type: 'PLACE_OPTIONS_ORDER',
      payload: {
        contractTicker: selectedContract.ticker,
        underlyingTicker: selectedContract.underlying_ticker,
        type: 'buy_to_open',
        orderType: 'market',
        quantity: orderQuantity,
        price: selectedContract.last,
        status: 'filled'
      }
    })

    alert(`Order placed successfully for ${orderQuantity} contracts of ${selectedContract.ticker}`)

    setStep(1)
    setSelectedStrategy(null)
    setSelectedContract(null)
    setQuantity('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6 flex items-start shadow-sm">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 mb-1">Educational Platform Only</h3>
            <p className="text-sm text-yellow-700">
              This is a simulated trading environment for educational purposes. Options trading involves substantial risk of loss.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Options Trading</h1>
          <p className="text-gray-600">Build and analyze your options strategies with comprehensive tools and real-time Greeks</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s, idx) => (
              <React.Fragment key={s}>
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                      step === s
                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                        : step > s
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step > s ? <Check className="h-5 w-5" /> : s}
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${step >= s ? 'text-gray-900' : 'text-gray-400'}`}>
                      {s === 1 ? 'Strategy Selection' : s === 2 ? 'Contract Builder' : 'Review & Trade'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {s === 1 ? 'Choose regime & strategy' : s === 2 ? 'Select contracts' : 'Confirm trade'}
                    </div>
                  </div>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-0.5 mx-4 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Market Outlook</h2>
                  <p className="text-sm text-gray-600 mt-1">Select the market condition that matches your view</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['Bull', 'Bear', 'Volatile', 'Sideways'] as MarketRegime[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRegime(r)
                      setSelectedStrategy(null)
                    }}
                    className={`relative p-6 rounded-lg border-2 transition-all ${
                      regime === r
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${
                        r === 'Bull' ? 'bg-green-100' :
                        r === 'Bear' ? 'bg-red-100' :
                        r === 'Volatile' ? 'bg-orange-100' :
                        'bg-gray-100'
                      }`}>
                        {r === 'Bull' && <TrendingUp className="h-5 w-5 text-green-600" />}
                        {r === 'Bear' && <TrendingDown className="h-5 w-5 text-red-600" />}
                        {(r === 'Volatile' || r === 'Sideways') && <BarChart3 className="h-5 w-5 text-gray-600" />}
                      </div>
                      {regime === r && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{r}</h3>
                    <p className="text-sm text-gray-600">
                      {r === 'Bull' && 'Expecting prices to rise'}
                      {r === 'Bear' && 'Expecting prices to fall'}
                      {r === 'Volatile' && 'Expecting large price swings'}
                      {r === 'Sideways' && 'Expecting range-bound movement'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Underlying</h2>
              <select
                value={selectedUnderlying}
                onChange={(e) => setSelectedUnderlying(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
              >
                <option value="">Choose a stock or ETF...</option>
                {availableUnderlyings.map((ticker) => (
                  <option key={ticker} value={ticker}>
                    {ticker} - ${getUnderlyingPrice(ticker).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {selectedUnderlying && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Recommended Strategies</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Based on your <span className="font-medium text-blue-600">{regime}</span> outlook
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {strategies.map((strategy) => (
                    <button
                      key={strategy.name}
                      onClick={() => setSelectedStrategy(strategy)}
                      className={`text-left p-5 rounded-lg border-2 transition-all ${
                        selectedStrategy?.name === strategy.name
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{strategy.name}</h3>
                        {selectedStrategy?.name === strategy.name && (
                          <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          strategy.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                          strategy.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {strategy.riskLevel.toUpperCase()} RISK
                        </span>
                        {strategy.directional && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            DIRECTIONAL
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Continue to Contract Selection
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Select Contract</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedUnderlying} - {selectedStrategy?.name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Current Price</div>
                  <div className="text-2xl font-bold text-gray-900">${underlyingPrice.toFixed(2)}</div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="text-gray-600 mt-4">Loading contracts...</p>
                </div>
              ) : (
                <ContractSelector
                  contracts={contracts}
                  onSelectContract={setSelectedContract}
                  selectedContract={selectedContract}
                  underlyingPrice={underlyingPrice}
                />
              )}
            </div>

            {selectedContract && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Strike Price</div>
                    <div className="text-lg font-semibold text-gray-900">${selectedContract.strike_price}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Premium</div>
                    <div className="text-lg font-semibold text-gray-900">${selectedContract.last}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Volume</div>
                    <div className="text-lg font-semibold text-gray-900">{selectedContract.volume.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Expiration</div>
                    <div className="text-lg font-semibold text-gray-900">{selectedContract.expiration_date}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Continue to Review
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && selectedContract && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Position Analysis</h2>

              <InteractivePayoffDiagram
                contract={selectedContract}
                strategyName={selectedStrategy?.name}
                underlyingPrice={underlyingPrice}
                className="mb-6"
              />

              <GreeksPanel
                greeks={GreeksCalculator.calculateGreeks(selectedContract, underlyingPrice)}
                contractType={selectedContract.contract_type}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Position Sizing</h2>

              <KellyCriterion
                accountBalance={state.buyingPower}
                contractPrice={selectedContract.last}
                onRecommendedQuantity={(qty) => setQuantity(qty.toString())}
              />

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (contracts)
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                  placeholder="Enter quantity"
                />
              </div>

              {quantity && parseInt(quantity) > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-blue-700">Total Cost</div>
                      <div className="text-xl font-bold text-blue-900">
                        ${(parseInt(quantity) * selectedContract.last * 100).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-700">Remaining Buying Power</div>
                      <div className="text-xl font-bold text-blue-900">
                        ${(state.buyingPower - (parseInt(quantity) * selectedContract.last * 100)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={!quantity || parseInt(quantity) <= 0}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                Place Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
