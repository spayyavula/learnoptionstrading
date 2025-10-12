import React, { useState, useEffect, useMemo } from 'react'
import { X, Plus, Minus, Info, TrendingUp, TrendingDown, Activity, BarChart3, Check, Trash2, Settings, Search } from 'lucide-react'
import { useOptionsContext } from '../context/OptionsContext'
import { useAccount } from '../context/AccountContext'
import { useAccountTheme } from '../hooks/useAccountTheme'
import { TradeConfirmationDialog, TradeDetails } from './TradeConfirmationDialog'
import { LearningService } from '../services/learningService'
import { StrategyValidationService, type StrategyLeg } from '../services/strategyValidationService'
import { OptionsChainFilterService } from '../services/optionsChainFilterService'
import { PayoffCalculationService } from '../services/payoffCalculationService'
import type { OptionsContract } from '../types/options'
import type { StrategyTemplate } from '../types/learning'

interface SensibullStrategyBuilderProps {
  contracts: OptionsContract[]
  underlyingPrice: number
  selectedUnderlying: string
  accountBalance: number
  buyingPower: number
}

interface StrategyLegUI {
  id: string
  action: 'buy' | 'sell'
  optionType: 'call' | 'put'
  expiry: string
  strike: number
  quantity: number
  contractTicker?: string
  premium?: number
}

export default function SensibullStrategyBuilder({
  contracts,
  underlyingPrice,
  selectedUnderlying,
  accountBalance,
  buyingPower
}: SensibullStrategyBuilderProps) {
  const { state, dispatch } = useOptionsContext()
  const { selectedAccount, isPaperMode } = useAccount()
  const theme = useAccountTheme()

  const [legs, setLegs] = useState<StrategyLegUI[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<'bullish' | 'bearish' | 'neutral' | 'volatility'>('bullish')
  const [viewMode, setViewMode] = useState<'payoff' | 'pnl' | 'greeks' | 'chart'>('payoff')
  const [multiplier, setMultiplier] = useState(1)
  const [showTemplates, setShowTemplates] = useState(true)
  const [targetDate, setTargetDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [tradeDetails, setTradeDetails] = useState<TradeDetails | null>(null)

  const allTemplates = useMemo(() => LearningService.getStrategyTemplates(), [])

  const filteredTemplates = useMemo(() => {
    let templates = allTemplates.filter(t => {
      if (activeTab === 'volatility') {
        return t.type === 'volatility'
      }
      return t.type === activeTab
    })

    if (searchQuery) {
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return templates
  }, [allTemplates, activeTab, searchQuery])

  const availableExpiries = useMemo(() => {
    const expiries = Array.from(new Set(contracts.map(c => c.expiration_date))).sort()
    return expiries.slice(0, 6)
  }, [contracts])

  const getStrikesForExpiry = (expiry: string, optionType: 'call' | 'put') => {
    const filtered = contracts.filter(c =>
      c.expiration_date === expiry &&
      c.contract_type === optionType &&
      (c.open_interest > 0 || c.volume > 0)
    )
    return Array.from(new Set(filtered.map(c => c.strike_price))).sort((a, b) => a - b)
  }

  const getContractForLeg = (leg: StrategyLegUI): OptionsContract | undefined => {
    return contracts.find(c =>
      c.expiration_date === leg.expiry &&
      c.contract_type === leg.optionType &&
      c.strike_price === leg.strike
    )
  }

  const handleTemplateSelect = (template: StrategyTemplate) => {
    setSelectedTemplate(template)

    const defaultExpiry = availableExpiries[0] || ''
    const newLegs: StrategyLegUI[] = template.legs.map((leg, index) => {
      let strike = underlyingPrice

      if (template.type === 'bullish') {
        if (leg.action === 'buy' && leg.optionType === 'call') {
          strike = underlyingPrice - (index * 5)
        } else if (leg.action === 'sell' && leg.optionType === 'call') {
          strike = underlyingPrice + (5 * (index + 1))
        }
      } else if (template.type === 'bearish') {
        if (leg.action === 'buy' && leg.optionType === 'put') {
          strike = underlyingPrice + (index * 5)
        } else if (leg.action === 'sell' && leg.optionType === 'put') {
          strike = underlyingPrice - (5 * (index + 1))
        }
      } else {
        strike = underlyingPrice + ((index % 2 === 0 ? -1 : 1) * (index + 1) * 5)
      }

      const contract = contracts.find(c =>
        c.expiration_date === defaultExpiry &&
        c.contract_type === leg.optionType &&
        Math.abs(c.strike_price - strike) < 10
      )

      return {
        id: `leg_${Date.now()}_${index}`,
        action: leg.action,
        optionType: leg.optionType,
        expiry: defaultExpiry,
        strike: contract?.strike_price || strike,
        quantity: leg.quantity,
        contractTicker: contract?.ticker,
        premium: contract?.last
      }
    })

    setLegs(newLegs)
    setShowTemplates(false)
  }

  const handleAddLeg = () => {
    const newLeg: StrategyLegUI = {
      id: `leg_${Date.now()}`,
      action: 'buy',
      optionType: 'call',
      expiry: availableExpiries[0] || '',
      strike: underlyingPrice,
      quantity: 1
    }
    setLegs([...legs, newLeg])
  }

  const handleRemoveLeg = (id: string) => {
    setLegs(legs.filter(leg => leg.id !== id))
  }

  const handleUpdateLeg = (id: string, updates: Partial<StrategyLegUI>) => {
    setLegs(legs.map(leg => {
      if (leg.id === id) {
        const updated = { ...leg, ...updates }
        const contract = getContractForLeg(updated)
        return {
          ...updated,
          contractTicker: contract?.ticker,
          premium: contract?.last
        }
      }
      return leg
    }))
  }

  const handleStrikeChange = (id: string, direction: 'up' | 'down') => {
    const leg = legs.find(l => l.id === id)
    if (!leg) return

    const strikes = getStrikesForExpiry(leg.expiry, leg.optionType)
    const currentIndex = strikes.indexOf(leg.strike)

    if (direction === 'up' && currentIndex < strikes.length - 1) {
      handleUpdateLeg(id, { strike: strikes[currentIndex + 1] })
    } else if (direction === 'down' && currentIndex > 0) {
      handleUpdateLeg(id, { strike: strikes[currentIndex - 1] })
    }
  }

  const calculateMetrics = () => {
    if (legs.length === 0) {
      return {
        maxProfit: 0,
        maxLoss: 0,
        breakeven: 0,
        rewardRisk: 0,
        pop: 0,
        timeValue: 0,
        intrinsicValue: 0,
        netDebit: 0
      }
    }

    let netDebit = 0
    let netCredit = 0
    let intrinsicValue = 0
    let timeValue = 0

    legs.forEach(leg => {
      const premium = leg.premium || 0
      const cost = premium * 100 * leg.quantity

      if (leg.action === 'buy') {
        netDebit += cost

        if (leg.optionType === 'call' && underlyingPrice > leg.strike) {
          intrinsicValue += (underlyingPrice - leg.strike) * 100 * leg.quantity
        } else if (leg.optionType === 'put' && underlyingPrice < leg.strike) {
          intrinsicValue += (leg.strike - underlyingPrice) * 100 * leg.quantity
        }
      } else {
        netCredit += cost
      }

      timeValue += premium * 100 * leg.quantity
    })

    const netCost = netDebit - netCredit
    timeValue = timeValue - intrinsicValue

    const strategyLegs = legs.map(leg => {
      const contract = getContractForLeg(leg)
      return {
        contract: contract!,
        action: leg.action,
        quantity: leg.quantity
      }
    }).filter(l => l.contract)

    let maxProfit = 0
    let maxLoss = 0
    let breakevenPrice = underlyingPrice

    if (strategyLegs.length > 0) {
      const validation = StrategyValidationService.validateStrategy(
        selectedTemplate?.name || 'Custom Strategy',
        strategyLegs as StrategyLeg[]
      )

      const prices = Array.from({ length: 50 }, (_, i) =>
        underlyingPrice * (0.7 + (i * 0.012))
      )

      const payoffs = prices.map(price => {
        let totalPnL = 0
        legs.forEach(leg => {
          const contract = getContractForLeg(leg)
          if (!contract) return

          const intrinsic = leg.optionType === 'call'
            ? Math.max(0, price - leg.strike)
            : Math.max(0, leg.strike - price)

          const premium = leg.premium || 0
          const pnl = leg.action === 'buy'
            ? (intrinsic - premium) * 100 * leg.quantity
            : (premium - intrinsic) * 100 * leg.quantity

          totalPnL += pnl
        })
        return { price, pnl: totalPnL }
      })

      maxProfit = Math.max(...payoffs.map(p => p.pnl))
      maxLoss = Math.min(...payoffs.map(p => p.pnl))

      const breakevenPoints = payoffs.filter((p, i) => {
        if (i === 0) return false
        const prev = payoffs[i - 1]
        return (prev.pnl < 0 && p.pnl >= 0) || (prev.pnl >= 0 && p.pnl < 0)
      })

      if (breakevenPoints.length > 0) {
        breakevenPrice = breakevenPoints[0].price
      }
    }

    const rewardRisk = maxLoss !== 0 ? Math.abs(maxProfit / maxLoss) : 0
    const pop = maxLoss !== 0 ? Math.min(95, Math.max(5, 50 + (rewardRisk - 1) * 10)) : 50

    return {
      maxProfit,
      maxLoss: Math.abs(maxLoss),
      breakeven: breakevenPrice,
      rewardRisk,
      pop,
      timeValue,
      intrinsicValue,
      netDebit: netCost
    }
  }

  const metrics = calculateMetrics()

  const handlePlaceOrder = () => {
    if (legs.length === 0) {
      alert('Please add at least one leg to the strategy')
      return
    }

    const totalCost = Math.abs(metrics.netDebit) * multiplier

    if (totalCost > buyingPower) {
      alert('Insufficient buying power for this strategy')
      return
    }

    // Prepare trade details for confirmation dialog
    const strategyName = selectedTemplate?.name || 'Custom Strategy'
    const firstLeg = legs[0]

    setTradeDetails({
      action: legs[0].action === 'buy' ? 'BUY' : 'SELL',
      symbol: `${selectedUnderlying} ${strategyName} (${legs.length} legs)`,
      quantity: multiplier,
      price: Math.abs(metrics.netDebit),
      orderType: 'MARKET',
      totalCost: totalCost,
      currency: selectedAccount.currency
    })
    setShowConfirmation(true)
  }

  const executeStrategy = () => {
    // Execute all legs
    legs.forEach(leg => {
      const contract = getContractForLeg(leg)
      if (contract) {
        dispatch({
          type: 'PLACE_OPTIONS_ORDER',
          payload: {
            contractTicker: contract.ticker,
            underlyingTicker: selectedUnderlying,
            type: leg.action === 'buy' ? 'buy_to_open' : 'sell_to_open',
            orderType: 'market',
            quantity: leg.quantity * multiplier,
            price: contract.last,
            status: 'filled',
            accountId: selectedAccount.id // Track which account this belongs to
          }
        })
      }
    })

    setShowConfirmation(false)
    setTradeDetails(null)
    alert(`Strategy placed successfully! ${legs.length} legs × ${multiplier} contracts`)
    handleClearStrategy()
  }

  const handleClearStrategy = () => {
    setLegs([])
    setSelectedTemplate(null)
    setMultiplier(1)
    setShowTemplates(true)
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'bullish': return <TrendingUp className="h-4 w-4" />
      case 'bearish': return <TrendingDown className="h-4 w-4" />
      case 'neutral': return <Minus className="h-4 w-4" />
      case 'volatility': return <Activity className="h-4 w-4" />
      default: return null
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">New Strategy</h3>
            {legs.length > 0 && (
              <button
                onClick={handleClearStrategy}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear New Trades
              </button>
            )}
          </div>

          {legs.length > 0 && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <Check className="h-3 w-3 inline mr-1" />
              {legs.length} trade{legs.length > 1 ? 's' : ''} selected
            </div>
          )}

          <div className="space-y-3">
            {legs.map((leg, index) => (
              <div
                key={leg.id}
                className={`p-3 rounded-lg border-2 ${
                  leg.action === 'buy' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      leg.action === 'buy' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {leg.action === 'buy' ? 'B' : 'S'}
                    </div>
                    <select
                      value={leg.optionType}
                      onChange={(e) => handleUpdateLeg(leg.id, { optionType: e.target.value as 'call' | 'put' })}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="call">CE</option>
                      <option value="put">PE</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleRemoveLeg(leg.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Expiry</label>
                    <select
                      value={leg.expiry}
                      onChange={(e) => handleUpdateLeg(leg.id, { expiry: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      {availableExpiries.map(exp => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Strike</label>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStrikeChange(leg.id, 'down')}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        value={leg.strike}
                        onChange={(e) => handleUpdateLeg(leg.id, { strike: parseFloat(e.target.value) })}
                        className="w-full text-xs text-center border border-gray-300 rounded px-1 py-1"
                      />
                      <button
                        onClick={() => handleStrikeChange(leg.id, 'up')}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Lots:</span>
                    <input
                      type="number"
                      min="1"
                      value={leg.quantity}
                      onChange={(e) => handleUpdateLeg(leg.id, { quantity: parseInt(e.target.value) || 1 })}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 mt-1"
                    />
                  </div>
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <div className="font-bold mt-1">${leg.premium?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddLeg}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Leg</span>
            </button>
          </div>

          {legs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <label className="text-sm text-gray-700">Multiplier</label>
                <select
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseInt(e.target.value))}
                  className="flex-1 border border-gray-300 rounded px-3 py-2"
                >
                  {[1, 2, 3, 4, 5, 10].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePlaceOrder}
                  className="py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
                >
                  Trade All
                </button>
                <button className="py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Add to Drafts
                </button>
              </div>

              <div className="mt-2 text-xs text-center">
                <span className="text-gray-600">Price</span>
                <span className="font-bold ml-1">Pay {Math.abs(metrics.netDebit).toFixed(2)}</span>
                <span className="text-gray-600 ml-2">Premium</span>
                <span className="font-bold ml-1">Pay {Math.abs(metrics.netDebit).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {showTemplates && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Ready-made</h3>
              <button className="text-xs text-blue-600 hover:text-blue-700">
                Learn Options Strategies
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search strategies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex space-x-1 mb-3">
              {(['bullish', 'bearish', 'neutral', 'volatility'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded text-xs font-medium transition-all flex items-center justify-center space-x-1 ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getTabIcon(tab)}
                  <span className="capitalize">{tab === 'volatility' ? 'Others' : tab}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-2 rounded-lg border-2 transition-all hover:shadow-md text-left ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <h4 className="text-xs font-semibold text-gray-900 mb-1 leading-tight">
                    {template.name}
                  </h4>
                  <div className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                    template.complexity === 'beginner' ? 'bg-green-100 text-green-800' :
                    template.complexity === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {template.complexity}
                  </div>
                </button>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No strategies found
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Max Profit</span>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                +{metrics.maxProfit.toFixed(0)}
              </div>
            </div>

            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Max Loss</span>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                -{metrics.maxLoss.toFixed(0)}
              </div>
            </div>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Reward / Risk</span>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.rewardRisk.toFixed(1)}x
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="text-xs text-gray-600 mb-1">POP</div>
              <div className="text-lg font-bold">{metrics.pop.toFixed(0)}%</div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="text-xs text-gray-600 mb-1">Breakeven</div>
              <div className="text-lg font-bold">{metrics.breakeven.toFixed(2)}</div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="text-xs text-gray-600 mb-1">Time Value</div>
              <div className="text-lg font-bold">{metrics.timeValue.toFixed(0)}</div>
            </div>
          </div>

          <div className="border-b border-gray-200 mb-4">
            <div className="flex space-x-4">
              {(['payoff', 'pnl', 'greeks', 'chart'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === mode
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode === 'payoff' && 'Payoff Graph'}
                  {mode === 'pnl' && 'P&L Table'}
                  {mode === 'greeks' && 'Greeks'}
                  {mode === 'chart' && 'Strategy Chart'}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'payoff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">On Expiry</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">On Target Date</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-1.5 border border-gray-300 rounded hover:bg-gray-50">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4" style={{ height: '400px' }}>
                <PayoffChart
                  legs={legs}
                  underlyingPrice={underlyingPrice}
                  getContractForLeg={getContractForLeg}
                />
              </div>

              <div className="text-xs text-gray-600 text-center">
                OI data at {underlyingPrice.toFixed(2)} • Current price: {underlyingPrice.toFixed(2)}
              </div>
            </div>
          )}

          {viewMode === 'greeks' && legs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['Delta', 'Gamma', 'Theta', 'Vega', 'Rho'].map((greek) => (
                <div key={greek} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">{greek}</div>
                  <div className="text-xl font-bold">0.00</div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'pnl' && legs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Price</th>
                    <th className="text-right py-2">P&L</th>
                    <th className="text-right py-2">% Change</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }, (_, i) => {
                    const price = underlyingPrice * (0.9 + i * 0.02)
                    return (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2">{price.toFixed(2)}</td>
                        <td className="text-right font-medium">$0.00</td>
                        <td className="text-right">0.00%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {legs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">No strategy selected</p>
              <p className="text-sm">Select a ready-made strategy or build your own</p>
            </div>
          )}
        </div>

        {legs.length > 0 && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Funds & Margins</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Standalone Funds</div>
                <div className="text-lg font-bold">--</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Standalone Margin</div>
                <div className="text-lg font-bold">--</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trade Confirmation Dialog */}
      {tradeDetails && (
        <TradeConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => {
            setShowConfirmation(false)
            setTradeDetails(null)
          }}
          onConfirm={executeStrategy}
          tradeDetails={tradeDetails}
        />
      )}
    </div>
  )
}

function PayoffChart({ legs, underlyingPrice, getContractForLeg }: {
  legs: StrategyLegUI[]
  underlyingPrice: number
  getContractForLeg: (leg: StrategyLegUI) => OptionsContract | undefined
}) {
  if (legs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm">Add legs to see payoff diagram</p>
        </div>
      </div>
    )
  }

  const minPrice = underlyingPrice * 0.7
  const maxPrice = underlyingPrice * 1.3
  const priceRange = Array.from({ length: 100 }, (_, i) =>
    minPrice + (i * (maxPrice - minPrice) / 99)
  )

  const payoffData = priceRange.map(price => {
    let totalPnL = 0

    legs.forEach(leg => {
      const premium = leg.premium || 2.5

      const intrinsic = leg.optionType === 'call'
        ? Math.max(0, price - leg.strike)
        : Math.max(0, leg.strike - price)

      const pnl = leg.action === 'buy'
        ? (intrinsic - premium) * 100 * leg.quantity
        : (premium - intrinsic) * 100 * leg.quantity

      totalPnL += pnl
    })

    return { price, pnl: totalPnL }
  })

  const maxPnL = Math.max(...payoffData.map(d => Math.abs(d.pnl)), 1)
  const svgHeight = 400
  const svgWidth = 600
  const padding = 50

  const xScale = (price: number) =>
    padding + ((price - minPrice) / (maxPrice - minPrice)) * (svgWidth - 2 * padding)

  const yScale = (pnl: number) => {
    if (maxPnL === 0) return svgHeight / 2
    return svgHeight / 2 - (pnl / maxPnL) * (svgHeight / 2 - padding)
  }

  const pathData = payoffData.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(d.price)} ${yScale(d.pnl)}`
  ).join(' ')

  const minPriceLabel = minPrice.toFixed(0)
  const maxPriceLabel = maxPrice.toFixed(0)
  const maxProfitLabel = Math.max(...payoffData.map(d => d.pnl)).toFixed(0)
  const maxLossLabel = Math.min(...payoffData.map(d => d.pnl)).toFixed(0)

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
      <defs>
        <linearGradient id="payoffGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#10b981" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#fafafa" />

      <line
        x1={padding}
        y1={svgHeight / 2}
        x2={svgWidth - padding}
        y2={svgHeight / 2}
        stroke="#d1d5db"
        strokeWidth="2"
      />

      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={svgHeight - padding}
        stroke="#d1d5db"
        strokeWidth="2"
      />

      <line
        x1={xScale(underlyingPrice)}
        y1={padding}
        x2={xScale(underlyingPrice)}
        y2={svgHeight - padding}
        stroke="#ef4444"
        strokeWidth="2"
        strokeDasharray="5,5"
      />

      <path
        d={`${pathData} L ${svgWidth - padding} ${svgHeight / 2} L ${padding} ${svgHeight / 2} Z`}
        fill="url(#payoffGradient)"
        opacity="0.3"
      />

      <path
        d={pathData}
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {payoffData.map((d, i) => {
        if (i % 20 === 0) {
          return (
            <circle
              key={i}
              cx={xScale(d.price)}
              cy={yScale(d.pnl)}
              r="3"
              fill="#10b981"
              stroke="white"
              strokeWidth="1"
            />
          )
        }
        return null
      })}

      <text
        x={padding}
        y={svgHeight - padding + 25}
        textAnchor="start"
        fontSize="11"
        fill="#6b7280"
        fontWeight="500"
      >
        ${minPriceLabel}
      </text>

      <text
        x={xScale(underlyingPrice)}
        y={svgHeight - padding + 25}
        textAnchor="middle"
        fontSize="12"
        fill="#ef4444"
        fontWeight="bold"
      >
        ${underlyingPrice.toFixed(0)}
      </text>

      <text
        x={svgWidth - padding}
        y={svgHeight - padding + 25}
        textAnchor="end"
        fontSize="11"
        fill="#6b7280"
        fontWeight="500"
      >
        ${maxPriceLabel}
      </text>

      <text
        x={padding - 10}
        y={padding}
        textAnchor="end"
        fontSize="11"
        fill="#10b981"
        fontWeight="500"
      >
        +${maxProfitLabel}
      </text>

      <text
        x={padding - 10}
        y={svgHeight - padding}
        textAnchor="end"
        fontSize="11"
        fill="#ef4444"
        fontWeight="500"
      >
        ${maxLossLabel}
      </text>

      <text
        x={xScale(underlyingPrice) + 5}
        y={padding - 5}
        textAnchor="start"
        fontSize="10"
        fill="#ef4444"
      >
        Current
      </text>

      {legs.map((leg, idx) => {
        const strikeX = xScale(leg.strike)
        return (
          <g key={idx}>
            <line
              x1={strikeX}
              y1={svgHeight - padding - 10}
              x2={strikeX}
              y2={svgHeight - padding + 10}
              stroke={leg.action === 'buy' ? '#10b981' : '#ef4444'}
              strokeWidth="2"
            />
            <text
              x={strikeX}
              y={svgHeight - padding + 35}
              textAnchor="middle"
              fontSize="9"
              fill={leg.action === 'buy' ? '#10b981' : '#ef4444'}
            >
              {leg.strike}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
