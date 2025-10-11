import React, { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Info, Check, ChevronRight, BarChart3 } from 'lucide-react'
import { useOptionsContext } from '../context/OptionsContext'
import { PolygonService } from '../services/polygonService'
import { getUnderlyingPrice, getAvailableUnderlyings } from '../services/optionsChainGenerator'
import SensibullStrategyBuilder from './SensibullStrategyBuilder'
import AlpacaCredentialsAccordion from './AlpacaCredentialsAccordion'
import AlpacaSetupWizard from './AlpacaSetupWizard'
import type { OptionsContract } from '../types/options'

interface Strategy {
  name: string
  description: string
  riskLevel: 'low' | 'medium' | 'high'
  directional: boolean
}


export default function EnhancedTrading() {
  const { state } = useOptionsContext()
  const [selectedUnderlying, setSelectedUnderlying] = useState<string>('')
  const [contracts, setContracts] = useState<OptionsContract[]>([])
  const [loading, setLoading] = useState(false)
  const [showAlpacaWizard, setShowAlpacaWizard] = useState(false)

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Options Trading - Strategy Builder</h1>
          <p className="text-gray-600">Build and analyze options strategies with 50+ ready-made templates</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Live Trading with Alpaca</h2>
            <p className="text-sm text-gray-600">
              Connect your Alpaca account to execute real trades. Practice with paper trading first, then seamlessly switch to live trading.
            </p>
          </div>
          <AlpacaCredentialsAccordion
            onSetupComplete={() => {
              console.log('Alpaca setup completed from Trading page')
            }}
            onLaunchWizard={() => setShowAlpacaWizard(true)}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Select Underlying</h2>
            <div className="text-sm text-gray-600">
              {selectedUnderlying && `Current: $${underlyingPrice.toFixed(2)}`}
            </div>
          </div>
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

        {selectedUnderlying ? (
          loading ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-600 mt-4">Loading options chain...</p>
            </div>
          ) : (
            <SensibullStrategyBuilder
              contracts={contracts}
              underlyingPrice={underlyingPrice}
              selectedUnderlying={selectedUnderlying}
              accountBalance={state.accountBalance}
              buyingPower={state.buyingPower}
            />
          )
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Started</h3>
            <p className="text-gray-600 mb-4">Select an underlying asset to begin building your options strategy</p>
            <p className="text-sm text-gray-500">Choose from stocks or ETFs and explore 50+ pre-configured strategy templates</p>
          </div>
        )}

        {showAlpacaWizard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <AlpacaSetupWizard
              onComplete={() => {
                setShowAlpacaWizard(false)
                alert('Alpaca account connected successfully!')
              }}
              onCancel={() => setShowAlpacaWizard(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
