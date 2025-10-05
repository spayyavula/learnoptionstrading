import React from 'react'
import { Info, TrendingUp, TrendingDown, Zap, Wind, DollarSign } from 'lucide-react'
import { GreeksData } from '../services/greeksCalculator'
import { GreeksCalculator } from '../services/greeksCalculator'

interface GreeksPanelProps {
  greeks: GreeksData
  contractType: 'call' | 'put'
  className?: string
}

export default function GreeksPanel({ greeks, contractType, className = '' }: GreeksPanelProps) {
  const getGreekGaugeColor = (value: number, greekType: 'delta' | 'gamma' | 'theta' | 'vega' | 'rho'): string => {
    const interpretation = GreeksCalculator.getGreekInterpretation(value, greekType)
    switch (interpretation.color) {
      case 'green': return 'bg-green-500'
      case 'yellow': return 'bg-yellow-500'
      case 'orange': return 'bg-orange-500'
      case 'red': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const renderGreekGauge = (
    value: number,
    greekType: 'delta' | 'gamma' | 'theta' | 'vega' | 'rho',
    min: number,
    max: number
  ) => {
    const normalized = ((value - min) / (max - min)) * 100
    const clampedPercent = Math.max(0, Math.min(100, normalized))
    const color = getGreekGaugeColor(value, greekType)

    return (
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full ${color} transition-all duration-300`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    )
  }

  const deltaInterpretation = GreeksCalculator.getGreekInterpretation(greeks.delta, 'delta')
  const gammaInterpretation = GreeksCalculator.getGreekInterpretation(greeks.gamma, 'gamma')
  const thetaInterpretation = GreeksCalculator.getGreekInterpretation(greeks.theta, 'theta')
  const vegaInterpretation = GreeksCalculator.getGreekInterpretation(greeks.vega, 'vega')
  const rhoInterpretation = GreeksCalculator.getGreekInterpretation(greeks.rho, 'rho')

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Greeks Analysis</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          contractType === 'call' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {contractType.toUpperCase()}
        </span>
      </div>

      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-semibold text-gray-900">Delta</span>
              <div className="group relative ml-2">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="hidden group-hover:block absolute z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg left-6 top-0">
                  Rate of change in option price per $1 change in underlying price.
                  Delta also approximates probability of finishing in-the-money.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {GreeksCalculator.formatGreek(greeks.delta, 'delta')}
              </div>
              <div className={`text-xs font-medium ${deltaInterpretation.color === 'green' ? 'text-green-600' : deltaInterpretation.color === 'yellow' ? 'text-yellow-600' : deltaInterpretation.color === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>
                {deltaInterpretation.label}
              </div>
            </div>
          </div>
          {renderGreekGauge(greeks.delta, 'delta', contractType === 'call' ? 0 : -1, contractType === 'call' ? 1 : 0)}
          <p className="text-sm text-gray-600 mt-2">{deltaInterpretation.description}</p>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-semibold text-gray-900">Gamma</span>
              <div className="group relative ml-2">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="hidden group-hover:block absolute z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg left-6 top-0">
                  Rate of change in Delta per $1 change in underlying price.
                  High Gamma means Delta changes rapidly as the stock moves.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {GreeksCalculator.formatGreek(greeks.gamma, 'gamma')}
              </div>
              <div className={`text-xs font-medium ${gammaInterpretation.color === 'green' ? 'text-green-600' : gammaInterpretation.color === 'yellow' ? 'text-yellow-600' : gammaInterpretation.color === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>
                {gammaInterpretation.label}
              </div>
            </div>
          </div>
          {renderGreekGauge(greeks.gamma, 'gamma', 0, 0.1)}
          <p className="text-sm text-gray-600 mt-2">{gammaInterpretation.description}</p>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-semibold text-gray-900">Theta</span>
              <div className="group relative ml-2">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="hidden group-hover:block absolute z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg left-6 top-0">
                  Rate of change in option value per day that passes (time decay).
                  Negative Theta means the option loses value as time passes.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {GreeksCalculator.formatGreek(greeks.theta, 'theta')}
              </div>
              <div className={`text-xs font-medium ${thetaInterpretation.color === 'green' ? 'text-green-600' : thetaInterpretation.color === 'yellow' ? 'text-yellow-600' : thetaInterpretation.color === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>
                {thetaInterpretation.label}
              </div>
            </div>
          </div>
          {renderGreekGauge(greeks.theta, 'theta', -1, 0)}
          <p className="text-sm text-gray-600 mt-2">{thetaInterpretation.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            Daily decay: ${Math.abs(greeks.theta * 100).toFixed(2)} per contract
          </p>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Wind className="h-5 w-5 text-cyan-600 mr-2" />
              <span className="font-semibold text-gray-900">Vega</span>
              <div className="group relative ml-2">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="hidden group-hover:block absolute z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg left-6 top-0">
                  Rate of change in option value per 1% change in implied volatility.
                  High Vega means the option is sensitive to volatility changes.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {GreeksCalculator.formatGreek(greeks.vega, 'vega')}
              </div>
              <div className={`text-xs font-medium ${vegaInterpretation.color === 'green' ? 'text-green-600' : vegaInterpretation.color === 'yellow' ? 'text-yellow-600' : vegaInterpretation.color === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>
                {vegaInterpretation.label}
              </div>
            </div>
          </div>
          {renderGreekGauge(greeks.vega, 'vega', 0, 0.5)}
          <p className="text-sm text-gray-600 mt-2">{vegaInterpretation.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            1% IV change: ${(greeks.vega * 100).toFixed(2)} per contract
          </p>
        </div>

        <div className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-semibold text-gray-900">Rho</span>
              <div className="group relative ml-2">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="hidden group-hover:block absolute z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg left-6 top-0">
                  Rate of change in option value per 1% change in risk-free interest rate.
                  Generally has minimal impact on short-term options.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {GreeksCalculator.formatGreek(greeks.rho, 'rho')}
              </div>
              <div className={`text-xs font-medium ${rhoInterpretation.color === 'green' ? 'text-green-600' : rhoInterpretation.color === 'yellow' ? 'text-yellow-600' : rhoInterpretation.color === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>
                {rhoInterpretation.label}
              </div>
            </div>
          </div>
          {renderGreekGauge(greeks.rho, 'rho', contractType === 'call' ? 0 : -0.5, contractType === 'call' ? 0.5 : 0)}
          <p className="text-sm text-gray-600 mt-2">{rhoInterpretation.description}</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2 text-sm">Summary</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Option price: ${greeks.price.toFixed(2)}</p>
          <p>• Implied Volatility: {(greeks.impliedVolatility * 100).toFixed(1)}%</p>
          <p>• Greeks calculated using Black-Scholes model</p>
        </div>
      </div>
    </div>
  )
}
