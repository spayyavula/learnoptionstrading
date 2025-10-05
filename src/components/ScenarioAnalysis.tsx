import React, { useState, useMemo } from 'react'
import { Save, Play, RotateCcw } from 'lucide-react'
import { OptionsContract } from '../types/options'
import { GreeksCalculator, GreeksData } from '../services/greeksCalculator'
import { supabase } from '../lib/supabase'

interface ScenarioAnalysisProps {
  contract: OptionsContract
  underlyingPrice: number
  onScenarioChange?: (greeks: GreeksData) => void
}

interface Scenario {
  name: string
  underlyingPriceChange: number
  volatilityChange: number
  daysPassed: number
}

const PRESET_SCENARIOS: Scenario[] = [
  { name: 'Bullish Move (+10%)', underlyingPriceChange: 10, volatilityChange: 0, daysPassed: 0 },
  { name: 'Bearish Move (-10%)', underlyingPriceChange: -10, volatilityChange: 0, daysPassed: 0 },
  { name: 'Volatility Spike (+25%)', underlyingPriceChange: 0, volatilityChange: 25, daysPassed: 0 },
  { name: 'Volatility Crush (-25%)', underlyingPriceChange: 0, volatilityChange: -25, daysPassed: 0 },
  { name: '7 Days Decay', underlyingPriceChange: 0, volatilityChange: 0, daysPassed: 7 },
  { name: '14 Days Decay', underlyingPriceChange: 0, volatilityChange: 0, daysPassed: 14 },
  { name: 'Bull + Vol Spike', underlyingPriceChange: 10, volatilityChange: 25, daysPassed: 0 },
  { name: 'Bear + Vol Spike', underlyingPriceChange: -10, volatilityChange: 25, daysPassed: 0 }
]

export default function ScenarioAnalysis({ contract, underlyingPrice, onScenarioChange }: ScenarioAnalysisProps) {
  const [underlyingPriceChange, setUnderlyingPriceChange] = useState(0)
  const [volatilityChange, setVolatilityChange] = useState(0)
  const [daysPassed, setDaysPassed] = useState(0)
  const [customScenarioName, setCustomScenarioName] = useState('')

  const maxDays = Math.max(1, GreeksCalculator.calculateTimeToExpiry(contract.expiration_date) * 365)

  const baseGreeks = useMemo(() => {
    return GreeksCalculator.calculateGreeks(contract, underlyingPrice)
  }, [contract, underlyingPrice])

  const scenarioGreeks = useMemo(() => {
    const greeks = GreeksCalculator.calculateScenarioGreeks(
      contract,
      underlyingPrice,
      {
        underlyingPriceChange: underlyingPriceChange / 100,
        volatilityChange: volatilityChange / 100,
        daysPassed
      }
    )

    if (onScenarioChange) {
      onScenarioChange(greeks)
    }

    return greeks
  }, [contract, underlyingPrice, underlyingPriceChange, volatilityChange, daysPassed, onScenarioChange])

  const priceDifference = scenarioGreeks.price - baseGreeks.price
  const percentDifference = (priceDifference / baseGreeks.price) * 100

  const handlePresetScenario = (scenario: Scenario) => {
    setUnderlyingPriceChange(scenario.underlyingPriceChange)
    setVolatilityChange(scenario.volatilityChange)
    setDaysPassed(Math.min(scenario.daysPassed, maxDays))
  }

  const handleReset = () => {
    setUnderlyingPriceChange(0)
    setVolatilityChange(0)
    setDaysPassed(0)
  }

  const handleSaveScenario = async () => {
    if (!customScenarioName) {
      alert('Please enter a scenario name')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to save scenarios')
        return
      }

      const expectedPnl = (scenarioGreeks.price - contract.last) * 100

      await supabase.from('scenario_analysis').insert({
        user_id: user.id,
        scenario_name: customScenarioName,
        underlying_price_change: underlyingPriceChange,
        volatility_change: volatilityChange,
        days_passed: daysPassed,
        expected_pnl: expectedPnl
      })

      alert('Scenario saved successfully!')
      setCustomScenarioName('')
    } catch (error) {
      console.error('Error saving scenario:', error)
      alert('Failed to save scenario')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">What-If Scenario Analysis</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {PRESET_SCENARIOS.map((scenario) => (
          <button
            key={scenario.name}
            onClick={() => handlePresetScenario(scenario)}
            className="px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-left"
          >
            <Play className="h-4 w-4 inline mr-1 text-blue-600" />
            {scenario.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Underlying Price Change: {formatPercent(underlyingPriceChange)}
          </label>
          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={underlyingPriceChange}
            onChange={(e) => setUnderlyingPriceChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-50%</span>
            <span>0%</span>
            <span>+50%</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            New Price: {formatCurrency(underlyingPrice * (1 + underlyingPriceChange / 100))}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Volatility Change: {formatPercent(volatilityChange)}
          </label>
          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={volatilityChange}
            onChange={(e) => setVolatilityChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-50%</span>
            <span>0%</span>
            <span>+50%</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            New IV: {((contract.implied_volatility || 0.3) * (1 + volatilityChange / 100) * 100).toFixed(1)}%
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Days Passed: {daysPassed} days
          </label>
          <input
            type="range"
            min="0"
            max={maxDays}
            step="1"
            value={daysPassed}
            onChange={(e) => setDaysPassed(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>{Math.round(maxDays)} days</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Days Remaining: {Math.round(maxDays - daysPassed)}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 mb-4">
        <h4 className="font-semibold text-blue-900 mb-3">Scenario Impact</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-blue-600 mb-1">Option Price</p>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(scenarioGreeks.price)}</p>
            <p className={`text-xs ${priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceDifference >= 0 ? '+' : ''}{formatCurrency(priceDifference)} ({formatPercent(percentDifference)})
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600 mb-1">Delta</p>
            <p className="text-lg font-bold text-blue-900">{scenarioGreeks.delta.toFixed(4)}</p>
            <p className={`text-xs ${scenarioGreeks.delta - baseGreeks.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {scenarioGreeks.delta - baseGreeks.delta >= 0 ? '+' : ''}{(scenarioGreeks.delta - baseGreeks.delta).toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600 mb-1">Gamma</p>
            <p className="text-lg font-bold text-blue-900">{scenarioGreeks.gamma.toFixed(5)}</p>
            <p className={`text-xs ${scenarioGreeks.gamma - baseGreeks.gamma >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {scenarioGreeks.gamma - baseGreeks.gamma >= 0 ? '+' : ''}{(scenarioGreeks.gamma - baseGreeks.gamma).toFixed(5)}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600 mb-1">Theta</p>
            <p className="text-lg font-bold text-blue-900">{scenarioGreeks.theta.toFixed(4)}</p>
            <p className={`text-xs ${scenarioGreeks.theta - baseGreeks.theta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {scenarioGreeks.theta - baseGreeks.theta >= 0 ? '+' : ''}{(scenarioGreeks.theta - baseGreeks.theta).toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600 mb-1">Vega</p>
            <p className="text-lg font-bold text-blue-900">{scenarioGreeks.vega.toFixed(4)}</p>
            <p className={`text-xs ${scenarioGreeks.vega - baseGreeks.vega >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {scenarioGreeks.vega - baseGreeks.vega >= 0 ? '+' : ''}{(scenarioGreeks.vega - baseGreeks.vega).toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600 mb-1">P&L per Contract</p>
            <p className={`text-lg font-bold ${priceDifference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(priceDifference * 100)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Scenario name..."
          value={customScenarioName}
          onChange={(e) => setCustomScenarioName(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleSaveScenario}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
    </div>
  )
}
