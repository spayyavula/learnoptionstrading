import React, { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SensibullStrategyBuilder from '../components/SensibullStrategyBuilder'
import type { OptionsContract } from '../types/options'
import { generateComprehensiveOptionsChain, getUnderlyingPrice } from '../services/optionsChainGenerator'

export default function StrategyBuilder() {
  const navigate = useNavigate()
  const [ticker, setTicker] = useState('AAPL')
  const [currentPrice, setCurrentPrice] = useState(170)
  const [contracts, setContracts] = useState<OptionsContract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOptionsData()
  }, [ticker])

  const loadOptionsData = async () => {
    setLoading(true)
    try {
      const optionsData = generateComprehensiveOptionsChain()
      const tickerContracts = optionsData.filter(c => c.underlying_ticker === ticker)
      setContracts(tickerContracts)

      const price = getUnderlyingPrice(ticker)
      setCurrentPrice(price)
    } catch (error) {
      console.error('Error loading options data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/options-trading')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Strategy Builder</h1>
              <p className="text-sm text-gray-600">Build and analyze multi-leg options strategies</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium"
            >
              <option value="AAPL">AAPL</option>
              <option value="MSFT">MSFT</option>
              <option value="GOOGL">GOOGL</option>
              <option value="TSLA">TSLA</option>
              <option value="SPY">SPY</option>
              <option value="QQQ">QQQ</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading options data...</p>
            </div>
          </div>
        ) : (
          <SensibullStrategyBuilder
            ticker={ticker}
            currentPrice={currentPrice}
            contracts={contracts}
          />
        )}
      </div>
    </div>
  )
}
