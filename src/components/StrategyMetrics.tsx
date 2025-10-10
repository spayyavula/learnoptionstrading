import React from 'react'
import { TrendingUp, TrendingDown, Target, DollarSign, Calendar, AlertTriangle } from 'lucide-react'
import type { OptionsContract } from '../types/options'

interface StrategyMetricsProps {
  strategyName: string
  buyLeg: OptionsContract | null
  sellLeg: OptionsContract | null
  quantity: number
  underlyingPrice: number
}

export default function StrategyMetrics({
  strategyName,
  buyLeg,
  sellLeg,
  quantity,
  underlyingPrice
}: StrategyMetricsProps) {
  if (!buyLeg || !sellLeg || quantity === 0) {
    return null
  }

  const netDebitPerContract = buyLeg.last - sellLeg.last
  const totalNetDebit = netDebitPerContract * quantity * 100

  const spreadWidth = sellLeg.strike_price - buyLeg.strike_price
  const maxProfitPerContract = spreadWidth - netDebitPerContract
  const maxProfit = maxProfitPerContract * quantity * 100

  const maxLoss = totalNetDebit

  const breakEvenPrice = buyLeg.strike_price + netDebitPerContract

  const maxProfitPercent = (maxProfit / Math.abs(maxLoss)) * 100
  const maxLossPercent = 100

  const riskRewardRatio = maxProfit / Math.abs(maxLoss)

  const daysToExpiry = Math.ceil(
    (new Date(buyLeg.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const netDelta = (buyLeg.delta - sellLeg.delta) * quantity * 100
  const netGamma = (buyLeg.gamma - sellLeg.gamma) * quantity * 100
  const netTheta = (buyLeg.theta - sellLeg.theta) * quantity * 100
  const netVega = (buyLeg.vega - sellLeg.vega) * quantity * 100

  const thetaDecayPerDay = Math.abs(netTheta)
  const estimatedWeeklyDecay = thetaDecayPerDay * 7

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4">
        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Strategy Summary
        </h3>

        <div className="grid grid-cols-2 gap-3 bg-white rounded-lg p-3 border border-blue-200">
          <div>
            <p className="text-xs text-gray-600 font-medium">Strategy Type</p>
            <p className="text-sm font-bold text-gray-900">{strategyName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Quantity</p>
            <p className="text-sm font-bold text-gray-900">{quantity} contract{quantity > 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Buy Strike</p>
            <p className="text-sm font-bold text-green-700">${buyLeg.strike_price}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Sell Strike</p>
            <p className="text-sm font-bold text-red-700">${sellLeg.strike_price}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Spread Width</p>
            <p className="text-sm font-bold text-gray-900">${spreadWidth.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Days to Expiry</p>
            <p className="text-sm font-bold text-gray-900">{daysToExpiry} days</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
            <h4 className="font-semibold text-red-900">Total Cost</h4>
          </div>
          <p className="text-2xl font-bold text-red-700">
            ${Math.abs(totalNetDebit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-red-600 mt-1">
            ${netDebitPerContract.toFixed(2)} per contract
          </p>
        </div>

        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            <h4 className="font-semibold text-green-900">Max Profit</h4>
          </div>
          <p className="text-2xl font-bold text-green-700">
            ${maxProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-green-600 mt-1">
            +{maxProfitPercent.toFixed(1)}% return
          </p>
        </div>

        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <h4 className="font-semibold text-orange-900">Max Loss</h4>
          </div>
          <p className="text-2xl font-bold text-orange-700">
            ${Math.abs(maxLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            Limited to net debit
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Break-Even & Risk Metrics
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white rounded p-3 border border-gray-200">
            <p className="text-xs text-gray-600 font-medium">Break-Even Price</p>
            <p className="text-lg font-bold text-gray-900">${breakEvenPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {((breakEvenPrice - underlyingPrice) / underlyingPrice * 100).toFixed(2)}% from current
            </p>
          </div>

          <div className="bg-white rounded p-3 border border-gray-200">
            <p className="text-xs text-gray-600 font-medium">Risk/Reward Ratio</p>
            <p className="text-lg font-bold text-gray-900">1:{riskRewardRatio.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {riskRewardRatio >= 1.5 ? 'Favorable' : 'Consider risk'}
            </p>
          </div>

          <div className="bg-white rounded p-3 border border-gray-200">
            <p className="text-xs text-gray-600 font-medium">Underlying Price</p>
            <p className="text-lg font-bold text-gray-900">${underlyingPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Current market</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Greeks & Time Decay
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded p-3 border border-purple-200">
            <p className="text-xs text-gray-600 font-medium">Delta</p>
            <p className="text-lg font-bold text-gray-900">{netDelta.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Directional exposure</p>
          </div>

          <div className="bg-white rounded p-3 border border-purple-200">
            <p className="text-xs text-gray-600 font-medium">Gamma</p>
            <p className="text-lg font-bold text-gray-900">{netGamma.toFixed(4)}</p>
            <p className="text-xs text-gray-500 mt-1">Delta sensitivity</p>
          </div>

          <div className="bg-white rounded p-3 border border-purple-200">
            <p className="text-xs text-gray-600 font-medium">Theta (Daily)</p>
            <p className="text-lg font-bold text-red-600">{netTheta.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Time decay/day</p>
          </div>

          <div className="bg-white rounded p-3 border border-purple-200">
            <p className="text-xs text-gray-600 font-medium">Vega</p>
            <p className="text-lg font-bold text-gray-900">{netVega.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">IV sensitivity</p>
          </div>
        </div>

        <div className="mt-3 bg-white rounded p-3 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Estimated Weekly Decay</p>
              <p className="text-sm text-gray-700">
                Approximately ${estimatedWeeklyDecay.toFixed(2)} per week in time value
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
        </div>
      </div>

      {daysToExpiry < 7 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-900">Warning: Near Expiration</p>
            <p className="text-sm text-yellow-800">
              This contract expires in {daysToExpiry} days. Time decay will accelerate significantly. Monitor closely.
            </p>
          </div>
        </div>
      )}

      {Math.abs(netTheta) > 10 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-900">High Theta Decay</p>
            <p className="text-sm text-orange-800">
              This spread has significant daily time decay. You're losing approximately ${thetaDecayPerDay.toFixed(2)} per day if the underlying doesn't move.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
