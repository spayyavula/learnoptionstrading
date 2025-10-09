import React, { useState, useMemo, memo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Info, Sliders } from 'lucide-react'
import { PayoffCalculationService, StrategyPayoff, StrategyLeg } from '../services/payoffCalculationService'
import { OptionsContract } from '../types/options'
import { GreeksCalculator } from '../services/greeksCalculator'

interface InteractivePayoffDiagramProps {
  contract?: OptionsContract
  strategyName?: string
  underlyingPrice: number
  className?: string
  legs?: StrategyLeg[]
}

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: InteractivePayoffDiagramProps, nextProps: InteractivePayoffDiagramProps) => {
  // Only re-render if legs array actually changed (deep comparison of values)
  if (prevProps.legs?.length !== nextProps.legs?.length) return false
  if (prevProps.strategyName !== nextProps.strategyName) return false
  if (prevProps.underlyingPrice !== nextProps.underlyingPrice) return false
  if (prevProps.contract?.ticker !== nextProps.contract?.ticker) return false

  // Deep compare legs
  if (prevProps.legs && nextProps.legs) {
    for (let i = 0; i < prevProps.legs.length; i++) {
      const prev = prevProps.legs[i]
      const next = nextProps.legs[i]
      if (
        prev.type !== next.type ||
        prev.strike !== next.strike ||
        prev.premium !== next.premium ||
        prev.action !== next.action ||
        prev.quantity !== next.quantity
      ) {
        return false
      }
    }
  }

  return true
}

function InteractivePayoffDiagram({
  contract,
  strategyName,
  underlyingPrice,
  className = '',
  legs
}: InteractivePayoffDiagramProps) {
  const [showBreakEvens, setShowBreakEvens] = useState(true)
  const [showStats, setShowStats] = useState(true)
  const [showControls, setShowControls] = useState(false)

  const [priceAdjustment, setPriceAdjustment] = useState(0)
  const [volatilityAdjustment, setVolatilityAdjustment] = useState(0)

  // Memoize initial days to expiration to prevent recalculation
  const initialDaysToExpiration = useMemo(
    () => contract ? Math.max(1, GreeksCalculator.calculateTimeToExpiry(contract.expiration_date) * 365) : 30,
    [contract]
  )

  const [daysToExpiration, setDaysToExpiration] = useState(initialDaysToExpiration)

  const adjustedUnderlyingPrice = useMemo(
    () => underlyingPrice * (1 + priceAdjustment / 100),
    [underlyingPrice, priceAdjustment]
  )

  const payoffData: StrategyPayoff = useMemo(() => {
    // If legs are provided, always use them (don't fall back to defaults)
    if (legs && legs.length > 0) {
      return PayoffCalculationService.calculatePayoff(legs, underlyingPrice, strategyName || 'Custom Strategy')
    }
    // If a single contract is provided, render its payoff
    if (contract) {
      const leg: StrategyLeg = {
        type: contract.contract_type,
        strike: contract.strike_price,
        premium: contract.last,
        action: 'buy',
        quantity: 1
      }
      return PayoffCalculationService.calculatePayoff([leg], underlyingPrice, `${contract.contract_type.toUpperCase()} ${contract.strike_price}`)
    }
    // Only use strategy defaults if explicitly requested with no legs or contract
    if (strategyName && !legs && !contract) {
      return PayoffCalculationService.getStrategyByName(strategyName, underlyingPrice)
    }
    // Final fallback
    return PayoffCalculationService.getBullCallSpread(underlyingPrice)
  }, [legs, strategyName, contract, underlyingPrice])

  const scenarioPayoffData: StrategyPayoff | null = useMemo(() => {
    if (showControls && contract && (priceAdjustment !== 0 || volatilityAdjustment !== 0 || daysToExpiration !== GreeksCalculator.calculateTimeToExpiry(contract.expiration_date) * 365)) {
      const adjustedGreeks = GreeksCalculator.calculateScenarioGreeks(
        contract,
        underlyingPrice,
        {
          underlyingPriceChange: priceAdjustment / 100,
          volatilityChange: volatilityAdjustment / 100,
          daysPassed: (GreeksCalculator.calculateTimeToExpiry(contract.expiration_date) * 365) - daysToExpiration
        }
      )

      const leg: StrategyLeg = {
        type: contract.contract_type,
        strike: contract.strike_price,
        premium: adjustedGreeks.price,
        action: 'buy',
        quantity: 1
      }
      return PayoffCalculationService.calculatePayoff([leg], adjustedUnderlyingPrice, 'Scenario')
    }
    return null
  }, [contract, underlyingPrice, priceAdjustment, volatilityAdjustment, daysToExpiration, showControls])

  const chartData = useMemo(() => {
    const baseData = payoffData.points.map((point, idx) => ({
      price: point.price,
      profit: point.profit,
      scenarioProfit: scenarioPayoffData ? scenarioPayoffData.points[idx]?.profit || 0 : null,
      zero: 0
    }))
    return baseData
  }, [payoffData, scenarioPayoffData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900">
            Stock Price: {formatPrice(data.price)}
          </p>
          <p className={`text-sm font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Current P&L: {formatCurrency(data.profit)}
          </p>
          {data.scenarioProfit !== null && (
            <p className={`text-sm font-bold ${data.scenarioProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              Scenario P&L: {formatCurrency(data.scenarioProfit)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const profitColor = '#10b981'
  const lossColor = '#ef4444'

  const handleReset = () => {
    setPriceAdjustment(0)
    setVolatilityAdjustment(0)
    setDaysToExpiration(initialDaysToExpiration)
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{payoffData.strategyName} Payoff</h3>
            <p className="text-sm text-gray-600">Underlying: {formatPrice(underlyingPrice)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowControls(!showControls)}
            className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
              showControls
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            <Sliders className="h-3 w-3" />
            What-If
          </button>
          <button
            onClick={() => setShowBreakEvens(!showBreakEvens)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              showBreakEvens
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            Break-Even
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              showStats
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            Stats
          </button>
        </div>
      </div>

      {showControls && contract && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-purple-900">Scenario Analysis</h4>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-xs bg-white border border-purple-300 text-purple-700 rounded hover:bg-purple-100"
            >
              Reset
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Underlying Price Change: {priceAdjustment > 0 ? '+' : ''}{priceAdjustment.toFixed(1)}%
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={priceAdjustment}
                onChange={(e) => setPriceAdjustment(parseFloat(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-purple-600 mt-1">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Implied Volatility Change: {volatilityAdjustment > 0 ? '+' : ''}{volatilityAdjustment.toFixed(1)}%
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={volatilityAdjustment}
                onChange={(e) => setVolatilityAdjustment(parseFloat(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-purple-600 mt-1">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Days to Expiration: {Math.round(daysToExpiration)} days
              </label>
              <input
                type="range"
                min="0"
                max={Math.max(1, GreeksCalculator.calculateTimeToExpiry(contract.expiration_date) * 365)}
                step="1"
                value={daysToExpiration}
                onChange={(e) => setDaysToExpiration(parseFloat(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-purple-600 mt-1">
                <span>0</span>
                <span>{Math.round(Math.max(1, GreeksCalculator.calculateTimeToExpiry(contract.expiration_date) * 365))} days</span>
              </div>
            </div>

            {scenarioPayoffData && (
              <div className="pt-3 border-t border-purple-200">
                <h5 className="text-sm font-semibold text-purple-900 mb-2">Scenario Impact</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-purple-600">Max Profit:</span>
                    <span className="ml-2 font-medium text-purple-900">
                      {scenarioPayoffData.maxProfit === Infinity ? '∞' : formatCurrency(scenarioPayoffData.maxProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-600">Max Loss:</span>
                    <span className="ml-2 font-medium text-purple-900">
                      {scenarioPayoffData.maxLoss === -Infinity ? '∞' : formatCurrency(scenarioPayoffData.maxLoss)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center mb-1">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs font-medium text-green-700">Max Profit</span>
            </div>
            <p className="text-lg font-bold text-green-700">
              {payoffData.maxProfit === Infinity ? '∞' : formatCurrency(payoffData.maxProfit)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center mb-1">
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-xs font-medium text-red-700">Max Loss</span>
            </div>
            <p className="text-lg font-bold text-red-700">
              {payoffData.maxLoss === -Infinity ? '∞' : formatCurrency(payoffData.maxLoss)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center mb-1">
              <Minus className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-xs font-medium text-blue-700">Risk/Reward</span>
            </div>
            <p className="text-lg font-bold text-blue-700">
              {payoffData.maxProfit === Infinity || payoffData.maxLoss === -Infinity
                ? '∞'
                : (Math.abs(payoffData.maxProfit / payoffData.maxLoss)).toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center mb-1">
              <Info className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-xs font-medium text-purple-700">Break-Even</span>
            </div>
            <p className="text-sm font-bold text-purple-700">
              {payoffData.breakEvenPoints.length === 0
                ? 'N/A'
                : payoffData.breakEvenPoints.length === 1
                ? formatPrice(payoffData.breakEvenPoints[0])
                : `${payoffData.breakEvenPoints.length} points`}
            </p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={profitColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={profitColor} stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lossColor} stopOpacity={0.05}/>
                <stop offset="95%" stopColor={lossColor} stopOpacity={0.3}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />

            <XAxis
              dataKey="price"
              tickFormatter={formatPrice}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: 'Underlying Price', position: 'insideBottom', offset: -10, style: { fontSize: 14, fill: '#374151', fontWeight: 600 } }}
              stroke="#9ca3af"
            />

            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: 'Profit / Loss', angle: -90, position: 'insideLeft', style: { fontSize: 14, fill: '#374151', fontWeight: 600 } }}
              stroke="#9ca3af"
            />

            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine
              y={0}
              stroke="#374151"
              strokeWidth={2}
              strokeDasharray="5 5"
            />

            <ReferenceLine
              x={underlyingPrice}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: 'Current',
                position: 'top',
                fill: '#3b82f6',
                fontSize: 12,
                fontWeight: 600
              }}
            />

            {showControls && adjustedUnderlyingPrice !== underlyingPrice && (
              <ReferenceLine
                x={adjustedUnderlyingPrice}
                stroke="#9333ea"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: 'Scenario',
                  position: 'top',
                  fill: '#9333ea',
                  fontSize: 12,
                  fontWeight: 600
                }}
              />
            )}

            {showBreakEvens && payoffData.breakEvenPoints.map((point, idx) => (
              <ReferenceLine
                key={idx}
                x={point}
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            ))}

            <Area
              type="monotone"
              dataKey="profit"
              stroke="none"
              fill="url(#profitGradient)"
              fillOpacity={1}
            />

            <Line
              type="monotone"
              dataKey="profit"
              stroke="#2563eb"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, fill: '#ffffff' }}
            />

            {scenarioPayoffData && (
              <Line
                type="monotone"
                dataKey="scenarioProfit"
                stroke="#9333ea"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {payoffData.breakEvenPoints.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Break-Even Analysis
          </h4>
          <div className="space-y-1">
            {payoffData.breakEvenPoints.map((point, idx) => (
              <p key={idx} className="text-sm text-blue-800">
                Break-Even Point {idx + 1}: <span className="font-bold">{formatPrice(point)}</span>
                <span className="ml-2 text-blue-600">
                  ({point > underlyingPrice ? '+' : ''}{((point / underlyingPrice - 1) * 100).toFixed(2)}%)
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> This payoff diagram shows theoretical profit/loss. Use the What-If controls to model different market scenarios.
        </p>
      </div>
    </div>
  )
}

// Export memoized component
export default memo(InteractivePayoffDiagram, arePropsEqual)
