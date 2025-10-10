import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Minus, Settings, TrendingUp, TrendingDown, Info, Save, Share2, Trash2, BarChart3, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Bar, ComposedChart } from 'recharts'
import type { OptionsContract } from '../types/options'
import { PayoffCalculationService, type StrategyLeg } from '../services/payoffCalculationService'
import { GreeksCalculator } from '../services/greeksCalculator'
import { SavedStrategiesService } from '../services/savedStrategiesService'
import { supabase } from '../lib/supabase'

interface StrategyBuilderLeg {
  id: string
  action: 'buy' | 'sell'
  expiry: string
  strike: number
  type: 'call' | 'put'
  lots: number
  price: number
  contract?: OptionsContract
}

interface SensibullStrategyBuilderProps {
  ticker: string
  currentPrice: number
  contracts: OptionsContract[]
  onClose?: () => void
}

export default function SensibullStrategyBuilder({
  ticker,
  currentPrice,
  contracts,
  onClose
}: SensibullStrategyBuilderProps) {
  const [legs, setLegs] = useState<StrategyBuilderLeg[]>([])
  const [multiplier, setMultiplier] = useState(1)
  const [selectedTab, setSelectedTab] = useState<'payoff' | 'table' | 'greeks' | 'chart'>('payoff')
  const [showSettings, setShowSettings] = useState(false)
  const [strategyName, setStrategyName] = useState('')
  const [selectedLegId, setSelectedLegId] = useState<string | null>(null)
  const [availableExpiries, setAvailableExpiries] = useState<string[]>([])
  const [showBookedPnL, setShowBookedPnL] = useState(false)

  useEffect(() => {
    const expiries = Array.from(new Set(contracts.map(c => c.expiration_date))).sort()
    setAvailableExpiries(expiries)
  }, [contracts])

  const addNewLeg = () => {
    const newLeg: StrategyBuilderLeg = {
      id: `leg-${Date.now()}`,
      action: 'buy',
      expiry: availableExpiries[0] || '',
      strike: Math.round(currentPrice),
      type: 'call',
      lots: 1,
      price: 0
    }
    setLegs([...legs, newLeg])
    setSelectedLegId(newLeg.id)
  }

  const updateLeg = (id: string, updates: Partial<StrategyBuilderLeg>) => {
    setLegs(legs.map(leg => {
      if (leg.id === id) {
        const updatedLeg = { ...leg, ...updates }

        const matchingContract = contracts.find(c =>
          c.expiration_date === updatedLeg.expiry &&
          c.strike_price === updatedLeg.strike &&
          c.contract_type === updatedLeg.type
        )

        if (matchingContract) {
          updatedLeg.price = matchingContract.last
          updatedLeg.contract = matchingContract
        }

        return updatedLeg
      }
      return leg
    }))
  }

  const removeLeg = (id: string) => {
    setLegs(legs.filter(leg => leg.id !== id))
  }

  const clearAllLegs = () => {
    setLegs([])
  }

  const resetPrices = () => {
    setLegs(legs.map(leg => {
      const matchingContract = contracts.find(c =>
        c.expiration_date === leg.expiry &&
        c.strike_price === leg.strike &&
        c.contract_type === leg.type
      )
      if (matchingContract) {
        return { ...leg, price: matchingContract.last, contract: matchingContract }
      }
      return leg
    }))
  }

  const payoffMetrics = useMemo(() => {
    if (legs.length === 0) {
      return {
        maxProfit: 0,
        maxLoss: 0,
        breakeven: [],
        pricePay: 0,
        premiumPay: 0,
        rewardRisk: 0,
        pop: 0,
        timeValue: 0,
        intrinsicValue: 0
      }
    }

    const strategyLegs: StrategyLeg[] = legs.map(leg => ({
      type: leg.type,
      strike: leg.strike,
      premium: leg.price,
      action: leg.action,
      quantity: leg.lots * multiplier
    }))

    const payoff = PayoffCalculationService.calculatePayoff(strategyLegs, currentPrice, 'Custom')

    let totalPremiumPaid = 0
    let totalPremiumReceived = 0
    let totalIntrinsic = 0
    let totalTimeValue = 0

    legs.forEach(leg => {
      const cost = leg.price * leg.lots * multiplier * 100
      if (leg.action === 'buy') {
        totalPremiumPaid += cost
      } else {
        totalPremiumReceived += cost
      }

      const intrinsic = leg.type === 'call'
        ? Math.max(0, currentPrice - leg.strike)
        : Math.max(0, leg.strike - currentPrice)

      const intrinsicValue = intrinsic * leg.lots * multiplier * 100
      const timeValue = (leg.price - intrinsic) * leg.lots * multiplier * 100

      totalIntrinsic += leg.action === 'buy' ? intrinsicValue : -intrinsicValue
      totalTimeValue += leg.action === 'buy' ? timeValue : -timeValue
    })

    const netDebit = totalPremiumPaid - totalPremiumReceived
    const rewardRisk = payoff.maxLoss !== 0
      ? Math.abs(payoff.maxProfit / payoff.maxLoss)
      : Infinity

    const pop = payoff.maxProfit === Infinity ? 50 : Math.min(95, Math.max(5,
      50 + (rewardRisk > 1 ? -20 : 20)
    ))

    return {
      maxProfit: payoff.maxProfit,
      maxLoss: payoff.maxLoss,
      breakeven: payoff.breakEvenPoints,
      pricePay: Math.abs(netDebit / 100),
      premiumPay: Math.abs(netDebit),
      rewardRisk,
      pop: Math.round(pop),
      timeValue: totalTimeValue,
      intrinsicValue: totalIntrinsic
    }
  }, [legs, multiplier, currentPrice])

  const payoffChartData = useMemo(() => {
    if (legs.length === 0) return []

    const strategyLegs: StrategyLeg[] = legs.map(leg => ({
      type: leg.type,
      strike: leg.strike,
      premium: leg.price,
      action: leg.action,
      quantity: leg.lots * multiplier
    }))

    const payoff = PayoffCalculationService.calculatePayoff(strategyLegs, currentPrice, 'Custom')

    const callOI: { [key: number]: number } = {}
    const putOI: { [key: number]: number } = {}

    legs.forEach(leg => {
      if (leg.contract) {
        const oi = leg.contract.open_interest / 1000
        if (leg.type === 'call') {
          callOI[leg.strike] = (callOI[leg.strike] || 0) + oi
        } else {
          putOI[leg.strike] = (putOI[leg.strike] || 0) + oi
        }
      }
    })

    return payoff.points.map(point => ({
      price: point.price,
      profit: point.profit,
      profitOnExpiry: point.profit,
      profitOnTarget: point.profit * 0.8,
      callOI: callOI[point.price] || 0,
      putOI: putOI[point.price] || 0
    }))
  }, [legs, multiplier, currentPrice, contracts])

  const availableStrikes = useMemo(() => {
    const selectedLeg = legs.find(l => l.id === selectedLegId)
    if (!selectedLeg) return []

    return Array.from(new Set(
      contracts
        .filter(c => c.expiration_date === selectedLeg.expiry && c.contract_type === selectedLeg.type)
        .map(c => c.strike_price)
    )).sort((a, b) => a - b)
  }, [contracts, selectedLegId, legs])

  const handleSaveStrategy = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to save strategies')
        return
      }

      const strategyLegs: StrategyLeg[] = legs.map(leg => ({
        type: leg.type,
        strike: leg.strike,
        premium: leg.price,
        action: leg.action,
        quantity: leg.lots
      }))

      await SavedStrategiesService.saveStrategy({
        user_id: user.id,
        strategy_name: strategyName || 'Custom Strategy',
        underlying_ticker: ticker,
        expiration_date: legs[0]?.expiry || new Date().toISOString().split('T')[0],
        legs: strategyLegs as any,
        validation_result: {
          isValid: true,
          maxProfit: payoffMetrics.maxProfit,
          maxLoss: payoffMetrics.maxLoss,
          errors: [],
          warnings: []
        } as any,
        is_favorite: false,
        is_template: false
      })

      alert('Strategy saved successfully!')
    } catch (error) {
      console.error('Error saving strategy:', error)
      alert('Failed to save strategy')
    }
  }

  const formatCurrency = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(0)}`
  }

  const formatPrice = (value: number) => {
    return value.toFixed(2)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-h-[600px]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">NIFTY {currentPrice.toFixed(2)}</span>
              <span className="text-green-600 text-sm">+0.4%</span>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-200 rounded" title="Settings">
                <Settings className="h-4 w-4" />
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                Info
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">New Strategy</h3>
              <div className="flex gap-2">
                <button
                  onClick={clearAllLegs}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  Clear New Trades
                </button>
                <button
                  onClick={resetPrices}
                  className="text-xs text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  Reset Prices
                </button>
              </div>
            </div>

            <div className="text-xs text-green-600 mb-2">
              {legs.length} trade{legs.length !== 1 ? 's' : ''} selected
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-2 py-2 text-left">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-2 py-2 text-left">B/S</th>
                    <th className="px-2 py-2 text-left">Expiry</th>
                    <th className="px-2 py-2 text-left">Strike</th>
                    <th className="px-2 py-2 text-left">Type</th>
                    <th className="px-2 py-2 text-left">Lots</th>
                    <th className="px-2 py-2 text-left">Price</th>
                    <th className="px-2 py-2 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {legs.map((leg) => (
                    <tr key={leg.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedLegId === leg.id}
                          onChange={() => setSelectedLegId(leg.id)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            leg.action === 'buy'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                          onClick={() => updateLeg(leg.id, {
                            action: leg.action === 'buy' ? 'sell' : 'buy'
                          })}
                        >
                          {leg.action === 'buy' ? 'B' : 'S'}
                        </button>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={leg.expiry}
                          onChange={(e) => updateLeg(leg.id, { expiry: e.target.value })}
                          className="text-xs border border-gray-300 rounded px-1 py-1"
                        >
                          {availableExpiries.map(exp => (
                            <option key={exp} value={exp}>{exp}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateLeg(leg.id, { strike: leg.strike - 100 })}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            value={leg.strike}
                            onChange={(e) => updateLeg(leg.id, { strike: Number(e.target.value) })}
                            className="w-20 text-xs border border-gray-300 rounded px-1 py-1 text-center"
                          />
                          <button
                            onClick={() => updateLeg(leg.id, { strike: leg.strike + 100 })}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={leg.type}
                          onChange={(e) => updateLeg(leg.id, { type: e.target.value as 'call' | 'put' })}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="call">CE</option>
                          <option value="put">PE</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={leg.lots}
                          onChange={(e) => updateLeg(leg.id, { lots: Number(e.target.value) })}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          {[1, 2, 3, 4, 5, 10].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={leg.price}
                          onChange={(e) => updateLeg(leg.id, { price: Number(e.target.value) })}
                          className="w-16 text-xs border border-gray-300 rounded px-1 py-1"
                          step="0.05"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <button className="text-gray-400 hover:text-gray-600">
                            <Settings className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeLeg(leg.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Multiplier</span>
                  <select
                    value={multiplier}
                    onChange={(e) => setMultiplier(Number(e.target.value))}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    {[1, 2, 3, 4, 5, 10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="text-xs">
                  <span className="text-gray-600">Price Pay</span>{' '}
                  <span className="font-semibold">{payoffMetrics.pricePay.toFixed(2)}</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-600">Premium Pay</span>{' '}
                  <span className="font-semibold">{payoffMetrics.premiumPay.toFixed(0)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addNewLeg}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  Add/Edit
                </button>
                <button className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                  Add to Drafts
                </button>
                <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                  Trade All
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <label className="flex items-center text-xs text-gray-600">
                <input type="checkbox" className="rounded mr-1" />
                Manual P/L
              </label>
              <button
                onClick={handleSaveStrategy}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Add Manual P/L
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4 border-b border-gray-200">
              <button
                onClick={() => setSelectedTab('payoff')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  selectedTab === 'payoff'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Payoff Graph
              </button>
              <button
                onClick={() => setSelectedTab('table')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  selectedTab === 'table'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Payoff Table
              </button>
              <button
                onClick={() => setSelectedTab('greeks')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  selectedTab === 'greeks'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Greeks
              </button>
              <button
                onClick={() => setSelectedTab('chart')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  selectedTab === 'chart'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Strategy Chart
              </button>
            </div>

            {selectedTab === 'payoff' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">OI data at</span>
                      <span className="font-semibold">{currentPrice.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-300 rounded" />
                      <span>Call OI {(legs.reduce((sum, leg) =>
                        leg.type === 'call' && leg.contract ? sum + leg.contract.open_interest : sum, 0
                      ) / 1000000).toFixed(2)}Cr</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-300 rounded" />
                      <span>Put OI {(legs.reduce((sum, leg) =>
                        leg.type === 'put' && leg.contract ? sum + leg.contract.open_interest : sum, 0
                      ) / 1000000).toFixed(2)}Cr</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select className="text-xs border border-gray-300 rounded px-2 py-1">
                      <option>SD Fixed</option>
                      <option>Open Interest</option>
                    </select>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {payoffChartData.length > 0 ? (
                  <div className="relative">
                    <div className="absolute top-0 right-0 text-xs text-gray-600 z-10">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span>On Expiry</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span>On Target Date</span>
                        </div>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={payoffChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="price"
                          tickFormatter={(v) => v.toFixed(0)}
                          tick={{ fontSize: 11 }}
                          label={{ value: 'Current price: ' + currentPrice.toFixed(2), position: 'bottom', fontSize: 11 }}
                        />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(v) => v.toFixed(0)}
                          tick={{ fontSize: 11 }}
                          label={{ value: 'P/Loss', angle: -90, position: 'insideLeft', fontSize: 11 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value: number) => value.toFixed(2)}
                          labelFormatter={(label) => `Price: ${label}`}
                        />
                        <ReferenceLine y={0} yAxisId="left" stroke="#666" strokeDasharray="3 3" />
                        <ReferenceLine x={currentPrice} stroke="#3b82f6" strokeDasharray="3 3" />

                        <Bar
                          yAxisId="right"
                          dataKey="callOI"
                          fill="rgba(239, 68, 68, 0.4)"
                          barSize={20}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="putOI"
                          fill="rgba(34, 197, 94, 0.4)"
                          barSize={20}
                        />

                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="profitOnExpiry"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="profitOnTarget"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-gray-400">
                    Add legs to see payoff diagram
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'table' && (
              <div className="text-sm text-gray-600">
                Payoff table view - showing profit/loss at different price levels
              </div>
            )}

            {selectedTab === 'greeks' && (
              <div className="text-sm text-gray-600">
                Greeks analysis - showing delta, gamma, theta, vega for the strategy
              </div>
            )}

            {selectedTab === 'chart' && (
              <div className="text-sm text-gray-600">
                Strategy chart - visual representation of the strategy
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600 mb-1">Max Profit</div>
                <div className="text-lg font-bold text-green-600">
                  {payoffMetrics.maxProfit === Infinity
                    ? '∞'
                    : formatCurrency(payoffMetrics.maxProfit)}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  Max Loss
                  <Info className="h-3 w-3" />
                </div>
                <div className="text-lg font-bold text-red-600">
                  {payoffMetrics.maxLoss === -Infinity
                    ? '∞'
                    : formatCurrency(payoffMetrics.maxLoss)}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600 mb-1">Breakeven</div>
                <div className="text-sm font-semibold">
                  {payoffMetrics.breakeven.length > 0
                    ? payoffMetrics.breakeven.map(be => be.toFixed(0)).join(', ')
                    : 'N/A'}
                  {payoffMetrics.breakeven.length > 0 && (
                    <div className="text-xs text-gray-500">
                      (+{((payoffMetrics.breakeven[0] / currentPrice - 1) * 100).toFixed(1)}%)
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600 mb-1">Target</div>
                <div className="text-sm font-semibold">--</div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600 mb-1">Expiry</div>
                <div className="text-sm font-semibold">
                  {legs.length > 0 ? legs[0].expiry : '--'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  Reward / Risk
                  <Info className="h-3 w-3" />
                </span>
                <span className="font-semibold">
                  {legs.length > 0 ? `1x / ${payoffMetrics.rewardRisk.toFixed(1)}` : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  POP
                  <Info className="h-3 w-3" />
                </span>
                <span className="font-semibold">{legs.length > 0 ? `${payoffMetrics.pop}%` : '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  Time Value
                  <Info className="h-3 w-3" />
                </span>
                <span className="font-semibold">
                  {legs.length > 0 ? payoffMetrics.timeValue.toFixed(0) : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  Intrinsic Value
                  <Info className="h-3 w-3" />
                </span>
                <span className="font-semibold">
                  {legs.length > 0 ? payoffMetrics.intrinsicValue.toFixed(0) : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-3">Funds & Margins</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  Standalone Funds
                  <Info className="h-3 w-3" />
                </span>
                <span>--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  Standalone Margin
                  <Info className="h-3 w-3" />
                </span>
                <span>--</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleSaveStrategy}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Strategy
            </button>
            <button className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-2">
              <Share2 className="h-4 w-4" />
              Share Strategy
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Ready-made</h3>
              <button className="text-xs text-blue-600 hover:text-blue-700">
                Positions
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Please click on a ready-made strategy to load it
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
