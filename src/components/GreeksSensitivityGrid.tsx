import React, { useMemo } from 'react'
import { OptionsContract } from '../types/options'
import { GreeksCalculator } from '../services/greeksCalculator'

interface GreeksSensitivityGridProps {
  contract: OptionsContract
  underlyingPrice: number
  className?: string
}

export default function GreeksSensitivityGrid({
  contract,
  underlyingPrice,
  className = ''
}: GreeksSensitivityGridProps) {
  const sensitivityData = useMemo(() => {
    const priceRange = {
      min: underlyingPrice * 0.8,
      max: underlyingPrice * 1.2,
      steps: 10
    }

    return GreeksCalculator.calculateGreeksSensitivity(contract, underlyingPrice, priceRange)
  }, [contract, underlyingPrice])

  const getHeatmapColor = (value: number, min: number, max: number, inverted: boolean = false): string => {
    const normalized = (value - min) / (max - min)
    const adjusted = inverted ? 1 - normalized : normalized

    if (adjusted < 0.2) return 'bg-red-500 text-white'
    if (adjusted < 0.4) return 'bg-orange-400 text-white'
    if (adjusted < 0.6) return 'bg-yellow-300 text-gray-900'
    if (adjusted < 0.8) return 'bg-green-300 text-gray-900'
    return 'bg-green-500 text-white'
  }

  const getDeltaColor = (delta: number): string => {
    const absValue = Math.abs(delta)
    const min = 0
    const max = 1
    return getHeatmapColor(absValue, min, max)
  }

  const getGammaColor = (gamma: number): string => {
    const allGammas = sensitivityData.map(d => d.gamma)
    const min = Math.min(...allGammas)
    const max = Math.max(...allGammas)
    return getHeatmapColor(gamma, min, max)
  }

  const getThetaColor = (theta: number): string => {
    const allThetas = sensitivityData.map(d => d.theta)
    const min = Math.min(...allThetas)
    const max = Math.max(...allThetas)
    return getHeatmapColor(theta, min, max, true)
  }

  const getVegaColor = (vega: number): string => {
    const allVegas = sensitivityData.map(d => d.vega)
    const min = Math.min(...allVegas)
    const max = Math.max(...allVegas)
    return getHeatmapColor(vega, min, max)
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${((value / underlyingPrice - 1) * 100).toFixed(1)}%`
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Greeks Sensitivity Heatmap</h3>
        <p className="text-sm text-gray-600">
          See how Greeks change across different underlying prices
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Underlying Price
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                % Change
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Delta
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Gamma
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Theta
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Vega
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sensitivityData.map((row, idx) => {
              const isCurrentPrice = Math.abs(row.price - underlyingPrice) < 0.01
              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isCurrentPrice ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatPrice(row.price)}
                    {isCurrentPrice && (
                      <span className="ml-2 text-xs text-blue-600 font-semibold">Current</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${
                    row.price > underlyingPrice ? 'text-green-600' : row.price < underlyingPrice ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {formatPercent(row.price)}
                  </td>
                  <td className={`px-4 py-3 text-center font-mono ${getDeltaColor(row.delta)}`}>
                    {row.delta.toFixed(4)}
                  </td>
                  <td className={`px-4 py-3 text-center font-mono ${getGammaColor(row.gamma)}`}>
                    {row.gamma.toFixed(5)}
                  </td>
                  <td className={`px-4 py-3 text-center font-mono ${getThetaColor(row.theta)}`}>
                    {row.theta.toFixed(4)}
                  </td>
                  <td className={`px-4 py-3 text-center font-mono ${getVegaColor(row.vega)}`}>
                    {row.vega.toFixed(4)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-600 mb-1 font-medium">Delta Range</p>
          <p className="text-sm font-mono text-blue-900">
            {Math.min(...sensitivityData.map(d => d.delta)).toFixed(4)} →{' '}
            {Math.max(...sensitivityData.map(d => d.delta)).toFixed(4)}
          </p>
        </div>
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-600 mb-1 font-medium">Peak Gamma</p>
          <p className="text-sm font-mono text-purple-900">
            {Math.max(...sensitivityData.map(d => d.gamma)).toFixed(5)}
          </p>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600 mb-1 font-medium">Max Theta Decay</p>
          <p className="text-sm font-mono text-red-900">
            {Math.min(...sensitivityData.map(d => d.theta)).toFixed(4)}
          </p>
        </div>
        <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
          <p className="text-xs text-cyan-600 mb-1 font-medium">Peak Vega</p>
          <p className="text-sm font-mono text-cyan-900">
            {Math.max(...sensitivityData.map(d => d.vega)).toFixed(4)}
          </p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 text-sm mb-2">Heatmap Legend</h4>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-400 rounded"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-300 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-300 rounded"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>High</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Colors indicate relative values within each Greek. Darker greens show higher values (more favorable for long positions).
        </p>
      </div>
    </div>
  )
}
