import React, { useState, useEffect } from 'react'
import { Search, TrendingUp, TrendingDown, Calculator, Eye } from 'lucide-react'
import { useOptionsContext } from '../context/OptionsContext'
import { PolygonService } from '../services/polygonService'
import TradingViewWidget from '../components/TradingViewWidget'
import type { OptionsContract } from '../types/options'

export default function OptionsChain() {
  const { state } = useOptionsContext()
  const [contracts, setContracts] = useState<OptionsContract[]>([])
  const [selectedUnderlying, setSelectedUnderlying] = useState<string>('SPY')
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'volume' | 'iv' | 'delta'>('volume')


  // Validate contract shape
  function isValidContract(contract: any): contract is OptionsContract {
    return contract &&
      typeof contract.contract_type === 'string' &&
      typeof contract.exercise_style === 'string' &&
      typeof contract.expiration_date === 'string' &&
      typeof contract.shares_per_contract === 'number' &&
      typeof contract.strike_price === 'number' &&
      typeof contract.ticker === 'string' &&
      typeof contract.underlying_ticker === 'string' &&
      typeof contract.bid === 'number' &&
      typeof contract.ask === 'number' &&
      typeof contract.last === 'number' &&
      typeof contract.volume === 'number' &&
      typeof contract.open_interest === 'number' &&
      typeof contract.implied_volatility === 'number' &&
      typeof contract.delta === 'number' &&
      typeof contract.gamma === 'number' &&
      typeof contract.theta === 'number' &&
      typeof contract.vega === 'number' &&
      typeof contract.intrinsic_value === 'number' &&
      typeof contract.time_value === 'number';
  }

  useEffect(() => {
    loadOptionsChain()
  }, [selectedUnderlying])

  const loadOptionsChain = async () => {
    try {
      setLoading(true)
      const topContracts = PolygonService.getTopLiquidOptions()
      const filteredContracts = selectedUnderlying === 'ALL'
        ? topContracts
        : topContracts.filter(contract => contract.underlying_ticker === selectedUnderlying)
      // Validate contracts
      const validContracts = filteredContracts.filter(isValidContract)
      if (filteredContracts.length !== validContracts.length) {
        const invalids = filteredContracts.filter(c => !isValidContract(c))
        console.warn('Invalid options contracts found and excluded:', invalids)
      }
      setContracts(validContracts)
    } catch (error) {
      console.error('Failed to load options chain:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${(percent * 100).toFixed(2)}%`
  }

  const sortedContracts = [...contracts].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return b.volume - a.volume
      case 'iv':
        return b.implied_volatility - a.implied_volatility
      case 'delta':
        return Math.abs(b.delta) - Math.abs(a.delta)
      default:
        return 0
    }
  })

  const underlyingTickers = ['ALL', ...new Set(PolygonService.getTopLiquidOptions().map(c => c.underlying_ticker))]

  const chainStats = {
    totalContracts: contracts.length,
    avgIV: contracts.length > 0 ? contracts.reduce((sum, c) => sum + c.implied_volatility, 0) / contracts.length : 0,
    totalVolume: contracts.reduce((sum, c) => sum + c.volume, 0),
    totalOI: contracts.reduce((sum, c) => sum + c.open_interest, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading options chain...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-10 w-10 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Total Contracts</p>
                <p className="text-3xl font-bold text-gray-900">{chainStats.totalContracts}</p>
                <p className="text-xs text-gray-500 mt-1">Available for trading</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calculator className="h-10 w-10 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Avg Implied Vol</p>
                <p className="text-3xl font-bold text-gray-900">{formatPercent(chainStats.avgIV)}</p>
                <p className="text-xs text-gray-500 mt-1">Market volatility indicator</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-10 w-10 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Total Volume</p>
                <p className="text-3xl font-bold text-gray-900">{(chainStats.totalVolume / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500 mt-1">Daily trading activity</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-10 w-10 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Open Interest</p>
                <p className="text-3xl font-bold text-gray-900">{(chainStats.totalOI / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500 mt-1">Total outstanding contracts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Options Chain Table */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Options Chain</h3>
            <div className="flex space-x-4">
              <select
                className="form-select"
                value={selectedUnderlying}
                onChange={(e) => setSelectedUnderlying(e.target.value)}
              >
                {underlyingTickers.map(ticker => (
                  <option key={ticker} value={ticker}>{ticker}</option>
                ))}
              </select>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'volume' | 'iv' | 'delta')}
              >
                <option value="volume">Sort by Volume</option>
                <option value="iv">Sort by IV</option>
                <option value="delta">Sort by Delta</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {sortedContracts.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No options contracts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedUnderlying === 'ALL' 
                  ? "No contracts available."
                  : `No contracts found for ${selectedUnderlying}.`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-b-lg">
              <table className="table">
                <thead>
                  <tr>
                    <th>Contract</th>
                    <th>Type</th>
                    <th>Underlying</th>
                    <th>Strike</th>
                    <th>Expiry</th>
                    <th>Bid/Ask</th>
                    <th>Last</th>
                    <th>Volume</th>
                    <th>Open Interest</th>
                    <th>Implied Vol</th>
                    <th>Greeks</th>
                    <th>Intrinsic Value</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedContracts.map((contract) => {
                    const hasPosition = state.positions.some(pos => pos.contractTicker === contract.ticker)
                    return (
                      <tr 
                        key={contract.ticker}
                        className={hasPosition ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                      >
                        <td>
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-gray-900">{contract.ticker}</div>
                              {hasPosition && (
                                <div className="text-xs text-blue-600 font-medium">POSITION</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contract.contract_type === 'call'
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {contract.contract_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="font-medium">{contract.underlying_ticker}</td>
                        <td className="font-medium">{formatCurrency(contract.strike_price)}</td>
                        <td className="text-sm text-gray-500">{contract.expiration_date}</td>
                        <td>
                          <div className="text-sm">
                            <div className="text-red-600">{formatCurrency(contract.bid)}</div>
                            <div className="text-green-600">{formatCurrency(contract.ask)}</div>
                          </div>
                        </td>
                        <td className="font-medium bg-gray-50">{formatCurrency(contract.last)}</td>
                        <td className="text-sm">
                          {(contract.volume / 1000).toFixed(1)}K
                        </td>
                        <td className="text-sm">
                          {(contract.open_interest / 1000).toFixed(1)}K
                        </td>
                        <td className="font-medium">
                          <span className="bg-purple-50 px-2 py-1 rounded-md">{formatPercent(contract.implied_volatility)}</span>
                        </td>
                        <td className="text-xs">
                          <div>Δ: <span className={contract.delta >= 0 ? 'text-green-600' : 'text-red-600'}>{contract.delta.toFixed(3)}</span></div>
                          <div>Γ: {contract.gamma.toFixed(3)}</div>
                          <div>Θ: <span className="text-red-600">{contract.theta.toFixed(3)}</span></div>
                          <div>ν: {contract.vega.toFixed(3)}</div>
                        </td>
                        <td>
                          <div className="text-sm">
                            <div>Intrinsic: {formatCurrency(contract.intrinsic_value)}</div>
                            <div className="text-gray-500">Time: {formatCurrency(contract.time_value)}</div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Options Education */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900">Options Greeks Explained</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Delta (Δ)</h4>
              <p className="text-sm text-gray-600">
                Measures price sensitivity to underlying asset movement. Range: -1 to +1 for options.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Gamma (Γ)</h4>
              <p className="text-sm text-gray-600">
                Rate of change of delta. Higher gamma means delta changes more rapidly.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Theta (Θ)</h4>
              <p className="text-sm text-gray-600">
                Time decay. Shows how much option value decreases per day, all else equal.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Vega (ν)</h4>
              <p className="text-sm text-gray-600">
                Sensitivity to implied volatility changes. Higher vega means more volatility risk.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart for Selected Underlying */}
      {selectedUnderlying && selectedUnderlying !== 'ALL' && (
        <div className="card shadow-md border-blue-200 mb-6"> 
          <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedUnderlying} Chart Analysis
              <a 
                href={`https://www.tradingview.com/chart/?symbol=${selectedUnderlying === 'SPY' ? 'AMEX:SPY' : 'NASDAQ:' + selectedUnderlying}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-blue-600 hover:underline ml-2"
              >
                Open in TradingView
              </a>
            </h3>
          </div>
          <div className="card-body">
            <TradingViewWidget
              symbol={selectedUnderlying === 'SPY' ? 'AMEX:SPY' : `NASDAQ:${selectedUnderlying || 'SPY'}`}
              width="100%" 
              height={650}
              interval="D"
              theme="light" 
              studies={["RSI", "MACD", "Volume"]}
              style="candles"
            />
          </div>
        </div>
      )}
    </div>
  )
}