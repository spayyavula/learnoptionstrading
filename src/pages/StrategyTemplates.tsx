import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Info } from 'lucide-react'
import StrategyTemplateSelector from '../components/StrategyTemplateSelector'
import InteractivePayoffDiagram from '../components/InteractivePayoffDiagram'
import type { StrategyTemplate } from '../types/learning'

export default function StrategyTemplates() {
  const navigate = useNavigate()
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyTemplate | null>(null)
  const [expiryDate, setExpiryDate] = useState('14 Oct')
  const [underlyingPrice] = useState(100)

  const handleStrategySelect = (strategy: StrategyTemplate) => {
    setSelectedStrategy(strategy)
  }

  const handleImplementStrategy = () => {
    if (selectedStrategy) {
      navigate('/app/trading', {
        state: {
          preloadedStrategy: selectedStrategy,
          expiryDate
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ready-Made Strategy Templates</h2>
              <p className="text-gray-600 mt-2">
                Select from pre-configured strategies and implement them instantly
              </p>
            </div>
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">How to Use Strategy Templates</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Select a strategy category (Bullish, Bearish, Neutral, or Others)</li>
              <li>2. Click on a strategy card to view its details and payoff diagram</li>
              <li>3. Review the strategy requirements, risk/reward profile, and market conditions</li>
              <li>4. Click "Implement Strategy" to pre-fill the trading interface</li>
              <li>5. Customize strikes, quantities, and expiration as needed</li>
            </ul>
          </div>
        </div>
      </div>

      <StrategyTemplateSelector
        onSelectStrategy={handleStrategySelect}
        expiryDate={expiryDate}
        onExpiryChange={setExpiryDate}
      />

      {selectedStrategy && (
        <div className="card shadow-md border-gray-200">
          <div className="card-header bg-gradient-to-r from-gray-50 to-gray-100">
            <h3 className="text-xl font-bold text-gray-900">{selectedStrategy.name}</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Strategy Overview</h4>
                <p className="text-gray-600 mb-4">{selectedStrategy.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm text-gray-600">Max Risk</div>
                    <div className="text-lg font-bold text-red-600">
                      ${selectedStrategy.maxRisk}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm text-gray-600">Max Profit</div>
                    <div className="text-lg font-bold text-green-600">
                      {selectedStrategy.maxProfit === Infinity ? 'Unlimited' : `$${selectedStrategy.maxProfit}`}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Strategy Legs</h5>
                  <div className="space-y-2">
                    {selectedStrategy.legs.map((leg, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                        <span className={`font-medium ${leg.action === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                          {leg.action.toUpperCase()}
                        </span>
                        {' '}{leg.quantity}x {leg.optionType.toUpperCase()} @ ${leg.strike} ({leg.expiration})
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="font-medium text-green-700 mb-2">Best Market Conditions</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedStrategy.bestMarketConditions.map((condition, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-red-700 mb-2">Worst Market Conditions</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedStrategy.worstMarketConditions.map((condition, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Payoff Diagram</h4>
                <InteractivePayoffDiagram
                  legs={selectedStrategy.legs.map(leg => ({
                    type: leg.optionType,
                    strike: leg.strike || underlyingPrice,
                    premium: 2,
                    action: leg.action,
                    quantity: leg.quantity
                  }))}
                  strategyName={selectedStrategy.name}
                  underlyingPrice={underlyingPrice}
                />

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600">Time Decay</div>
                    <div className={`font-medium capitalize ${
                      selectedStrategy.timeDecay === 'positive' ? 'text-green-600' :
                      selectedStrategy.timeDecay === 'negative' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {selectedStrategy.timeDecay}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600">Volatility Impact</div>
                    <div className={`font-medium capitalize ${
                      selectedStrategy.volatilityImpact === 'positive' ? 'text-green-600' :
                      selectedStrategy.volatilityImpact === 'negative' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {selectedStrategy.volatilityImpact}
                    </div>
                  </div>
                </div>

                {selectedStrategy.instructions && selectedStrategy.instructions.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Implementation Steps</h5>
                    <div className="space-y-2">
                      {selectedStrategy.instructions.map((instruction, index) => (
                        <div key={index} className="flex items-start text-sm">
                          <div className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2 mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-gray-600">{instruction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStrategy.examples && selectedStrategy.examples.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Example</h5>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-gray-700">{selectedStrategy.examples[0]}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleImplementStrategy}
                className="w-full btn btn-primary text-lg py-3"
              >
                Implement This Strategy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-md border-gray-200">
        <div className="card-header bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-lg font-medium text-gray-900">About Strategy Templates</h3>
        </div>
        <div className="card-body">
          <p className="text-gray-600 mb-4">
            Strategy templates provide pre-configured options strategies that you can quickly implement
            in your trading. Each template includes:
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span><strong>Risk/Reward Profile:</strong> Clear maximum profit and loss scenarios</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span><strong>Market Conditions:</strong> Best and worst conditions for the strategy</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span><strong>Greeks Analysis:</strong> Time decay and volatility impact</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span><strong>Implementation Guide:</strong> Step-by-step instructions</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span><strong>Real Examples:</strong> Practical scenarios with actual numbers</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
