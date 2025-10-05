import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { PayoffCalculationService, StrategyPayoff } from '../services/payoffCalculationService'

interface PayoffDiagramProps {
  strategyName: string
  underlyingPrice: number
  className?: string
}

export default function PayoffDiagram({ strategyName, underlyingPrice, className = '' }: PayoffDiagramProps) {
  const [showBreakEvens, setShowBreakEvens] = useState(true)
  const [showStats, setShowStats] = useState(true)

  const payoffData: StrategyPayoff = useMemo(() => {
    return PayoffCalculationService.getStrategyByName(strategyName, underlyingPrice)
  }, [strategyName, underlyingPrice])

  const chartData = payoffData.points.map(point => ({
    price: point.price,
    profit: point.profit,
    zero: 0
  }))

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
            P&L: {formatCurrency(data.profit)}
          </p>
        </div>
      )
    }
    return null
  }

  const profitColor = '#10b981'
  const lossColor = '#ef4444'

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{strategyName} Payoff</h3>
            <p className="text-sm text-gray-600">Underlying: {formatPrice(underlyingPrice)}</p>
          </div>
        </div>

        <div className="flex gap-2">
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
              label={{ value: 'Underlying Price at Expiration', position: 'insideBottom', offset: -10, style: { fontSize: 14, fill: '#374151', fontWeight: 600 } }}
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
              label={{
                value: 'Break Even',
                position: 'right',
                fill: '#374151',
                fontSize: 12,
                fontWeight: 600
              }}
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
          <strong>Note:</strong> This payoff diagram shows the theoretical profit/loss at expiration.
          Actual results may vary due to early assignment, changes in implied volatility, and time decay.
        </p>
      </div>
    </div>
  )
}
