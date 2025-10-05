import React, { useState, useEffect } from 'react'
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  AlertTriangle, 
  RefreshCw,
  ArrowRight,
  Check,
  X,
  Info,
  Filter,
  Search,
  Zap,
  Scale,
  Percent
} from 'lucide-react'
import { BlackScholesService, ArbitrageOpportunity } from '../services/blackScholesService'
import { PolygonService } from '../services/polygonService'
import Disclaimer from '../components/Disclaimer'
import TradingViewWidget from '../components/TradingViewWidget'

export default function OptionsArbitrage() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null)
  const [riskFreeRate, setRiskFreeRate] = useState(0.05)
  const [minPriceDifference, setMinPriceDifference] = useState(0.05)
  const [searchTerm, setSearchTerm] = useState('')
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [arbitrageType, setArbitrageType] = useState<'price' | 'volatility' | 'put-call-parity'>('price')
  const [historicalVolatility, setHistoricalVolatility] = useState(0.25)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadArbitrageOpportunities()
  }, [arbitrageType, riskFreeRate, minPriceDifference, historicalVolatility])

  const loadArbitrageOpportunities = async () => {
    try {
      setLoading(true)
      
      // Get options contracts
      const contracts = PolygonService.getTopLiquidOptions()
      
      // Add underlying price to each contract
      const contractsWithPrice = contracts.map(contract => {
        // Get a mock price for the underlying
        const basePrice = getBasePriceForTicker(contract.underlying_ticker)
        
        return {
          ...contract,
          underlying_price: basePrice
        }
      })
      
      let arbitrageResults: ArbitrageOpportunity[] = []
      
      switch (arbitrageType) {
        case 'price':
          arbitrageResults = BlackScholesService.findArbitrageOpportunities(
            contractsWithPrice,
            riskFreeRate,
            minPriceDifference
          )
          break
          
        case 'volatility':
          arbitrageResults = BlackScholesService.findVolatilityArbitrage(
            contractsWithPrice,
            historicalVolatility,
            minPriceDifference
          )
          break
          
        case 'put-call-parity':
          const callContracts = contractsWithPrice.filter(c => c.contract_type === 'call')
          const putContracts = contractsWithPrice.filter(c => c.contract_type === 'put')
          
          // Use SPY as the example underlying
          const spyPrice = getBasePriceForTicker('SPY')
          
          arbitrageResults = BlackScholesService.findPutCallParityArbitrage(
            callContracts,
            putContracts,
            spyPrice,
            riskFreeRate
          )
          break
      }
      
      setOpportunities(arbitrageResults)
    } catch (error) {
      console.error('Failed to load arbitrage opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBasePriceForTicker = (ticker: string): number => {
    // Base prices for our simulated options
    const basePrices: { [key: string]: number } = {
      'SPY': 580,
      'QQQ': 500,
      'AAPL': 185,
      'MSFT': 420,
      'GOOGL': 150,
      'AMZN': 175,
      'TSLA': 190,
      'NVDA': 1400
    }
    
    return basePrices[ticker] || 100 // Default to 100 if ticker not found
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${(percent * 100).toFixed(2)}%`
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = 
      opp.contractTicker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.underlyingTicker.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesConfidence = 
      confidenceFilter === 'all' || 
      opp.confidence === confidenceFilter
    
    const matchesType = 
      typeFilter === 'all' || 
      opp.contractType === typeFilter
    
    return matchesSearch && matchesConfidence && matchesType
  })

  const arbitrageStats = {
    totalOpportunities: opportunities.length,
    highConfidence: opportunities.filter(o => o.confidence === 'high').length,
    avgPriceDifference: opportunities.length > 0 
      ? opportunities.reduce((sum, o) => sum + Math.abs(o.priceDifference), 0) / opportunities.length
      : 0,
    maxProfit: opportunities.length > 0
      ? Math.max(...opportunities.map(o => o.expectedProfit))
      : 0
  }

  return (
    <div className="space-y-6">
      {/* Arbitrage Disclaimer */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Options Arbitrage Disclaimer</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                The arbitrage opportunities identified are based on theoretical models and may not reflect actual market conditions. 
                Transaction costs, slippage, and other factors can significantly impact profitability.
              </p>
              <p className="mt-1">
                Options arbitrage involves substantial risk and requires advanced knowledge of options pricing and trading strategies.
                This tool is for educational purposes only.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Header */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Options Arbitrage Finder</h2>
              <p className="text-gray-600 mt-2">
                Identify potential arbitrage opportunities using the Black-Scholes model
              </p>
            </div>
            <Calculator className="h-12 w-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Arbitrage Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Opportunities</p>
                <p className="text-3xl font-bold text-gray-900">{arbitrageStats.totalOpportunities}</p>
                <p className="text-xs text-gray-500 mt-1">Potential arbitrage trades</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body"> 
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">High Confidence</p>
                <p className="text-2xl font-bold text-gray-900">{arbitrageStats.highConfidence}</p>
                <p className="text-xs text-gray-500 mt-1">Most reliable opportunities</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center"> 
              <div className="flex-shrink-0">
                <Percent className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Price Diff</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(arbitrageStats.avgPriceDifference)}</p>
                <p className="text-xs text-gray-500 mt-1">Average mispricing amount</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center"> 
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Max Potential Profit</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(arbitrageStats.maxProfit)}</p>
                <p className="text-xs text-gray-500 mt-1">Highest profit opportunity</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900">Arbitrage Settings</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="form-label">Arbitrage Type</label>
              <select
                className="form-select border-blue-300 focus:border-blue-500"
                value={arbitrageType}
                onChange={(e) => setArbitrageType(e.target.value as any)}
              >
                <option value="price">Price Arbitrage</option>
                <option value="volatility">Volatility Arbitrage</option>
                <option value="put-call-parity">Put-Call Parity</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {arbitrageType === 'price' 
                  ? 'Find options priced differently from their theoretical value'
                  : arbitrageType === 'volatility'
                  ? 'Find options with implied volatility different from historical'
                  : 'Find violations of put-call parity relationship'
                }
              </p>
            </div>
            
            <div>
              <label className="form-label">Risk-Free Rate (%)</label>
              <input
                type="number" 
                className="form-input"
                value={riskFreeRate * 100}
                onChange={(e) => setRiskFreeRate(parseFloat(e.target.value) / 100)}
                step="0.1"
                min="0"
                max="10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current treasury yield (affects theoretical pricing)
              </p>
            </div>
            
            <div>
              <label className="form-label">Min Price Difference (%)</label>
              <input
                type="number" 
                className="form-input"
                value={minPriceDifference * 100}
                onChange={(e) => setMinPriceDifference(parseFloat(e.target.value) / 100)}
                step="1"
                min="1"
                max="50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum difference to consider an arbitrage opportunity
              </p>
            </div>
            
            {arbitrageType === 'volatility' && (
              <div>
                <label className="form-label">Historical Volatility (%)</label>
                <input
                  type="number" 
                  className="form-input"
                  value={historicalVolatility * 100}
                  onChange={(e) => setHistoricalVolatility(parseFloat(e.target.value) / 100)}
                  step="1"
                  min="5"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Historical volatility of the underlying asset
                </p>
              </div>
            )}
            
            <div className="lg:col-span-3 flex justify-end">
              <button
                onClick={loadArbitrageOpportunities}
                disabled={loading} 
                className="btn btn-primary"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh Opportunities
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-md border-gray-200">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by ticker..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="form-select"
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
            >
              <option value="all">All Confidence Levels</option>
              <option value="high">High Confidence</option>
              <option value="medium">Medium Confidence</option>
              <option value="low">Low Confidence</option>
            </select>

            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Option Types</option>
              <option value="call">Calls Only</option>
              <option value="put">Puts Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Arbitrage Opportunities */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900">Arbitrage Opportunities</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Calculating arbitrage opportunities...</p>
              </div>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No arbitrage opportunities found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or decreasing the minimum price difference.
              </p>
            </div> 
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Contract</th>
                    <th>Type</th>
                    <th>Strike/Expiry</th>
                    <th>Market Price</th>
                    <th>Theoretical Price</th>
                    <th>Difference</th>
                    <th>Confidence</th>
                    <th>Expected Profit</th>
                    <th>Risk/Reward</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opportunity) => (
                    <tr key={opportunity.contractTicker}>
                      <td>
                        <div>
                          <div className="font-medium text-blue-700">{opportunity.contractTicker}</div>
                          <div className="text-sm text-gray-500">{opportunity.underlyingTicker}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          opportunity.contractType === 'call' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {opportunity.contractType.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium">{formatCurrency(opportunity.strikePrice)}</div>
                          <div className="text-sm text-gray-500">{opportunity.expirationDate}</div>
                        </div>
                      </td>
                      <td className="font-medium bg-gray-50">{formatCurrency(opportunity.marketPrice)}</td>
                      <td className="font-medium">{formatCurrency(opportunity.theoreticalPrice)}</td>
                      <td className={opportunity.priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                        <div className="font-medium">{formatCurrency(opportunity.priceDifference)}</div>
                        <div className="text-sm">{formatPercent(opportunity.percentageDifference)}</div>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(opportunity.confidence)}`}>
                          {opportunity.confidence}
                        </span>
                      </td>
                      <td className="font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        {formatCurrency(opportunity.expectedProfit)}
                      </td>
                      <td className="font-medium bg-blue-50 px-2 py-1 rounded-md">
                        {opportunity.riskRewardRatio.toFixed(2)}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedOpportunity(opportunity)
                            setShowDetails(true)
                          }}
                          className="btn btn-secondary text-sm bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-gray-50"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900">Understanding Options Arbitrage</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                Price Arbitrage
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                Price arbitrage involves identifying options that are mispriced relative to their theoretical value 
                calculated using the Black-Scholes model.
              </p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Buy underpriced options</li>
                <li>• Sell overpriced options</li>
                <li>• Consider liquidity and transaction costs</li>
                <li>• Monitor implied volatility changes</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Volatility Arbitrage
              </h4>
              <p className="text-sm text-purple-700 mb-3">
                Volatility arbitrage exploits differences between implied volatility in options prices 
                and expected future volatility of the underlying asset.
              </p>
              <ul className="text-xs text-purple-600 space-y-1">
                <li>• Sell options with high implied volatility</li>
                <li>• Buy options with low implied volatility</li>
                <li>• Delta-hedge to isolate volatility exposure</li>
                <li>• Requires sophisticated risk management</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <Scale className="h-4 w-4 mr-2" />
                Put-Call Parity
              </h4>
              <p className="text-sm text-green-700 mb-3">
                Put-call parity is a relationship between the prices of puts and calls with the same strike and expiration.
                Violations create arbitrage opportunities.
              </p>
              <ul className="text-xs text-green-600 space-y-1">
                <li>• C + PV(K) = P + S</li>
                <li>• Requires simultaneous execution</li>
                <li>• Consider dividend adjustments</li>
                <li>• Watch for early exercise risk</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunity Detail Modal */}
      {showDetails && selectedOpportunity && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDetails(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedOpportunity.contractTicker}</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Opportunity Details */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Arbitrage Details
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Underlying</div>
                        <div className="font-bold text-gray-900">{selectedOpportunity.underlyingTicker}</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Option Type</div>
                        <div className="font-bold text-gray-900">{selectedOpportunity.contractType.toUpperCase()}</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Strike Price</div>
                        <div className="font-bold text-gray-900">{formatCurrency(selectedOpportunity.strikePrice)}</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Expiration</div>
                        <div className="font-bold text-gray-900">{selectedOpportunity.expirationDate}</div>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-3">Pricing Analysis</h4>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">Market Price:</div>
                        <div className="font-medium">{formatCurrency(selectedOpportunity.marketPrice)}</div>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">Theoretical Price:</div>
                        <div className="font-medium">{formatCurrency(selectedOpportunity.theoreticalPrice)}</div>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">Price Difference:</div>
                        <div className={`font-medium ${selectedOpportunity.priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(selectedOpportunity.priceDifference)} ({formatPercent(selectedOpportunity.percentageDifference)})
                        </div>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-3">Risk/Reward</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">Expected Profit:</div>
                        <div className="font-medium text-green-600">{formatCurrency(selectedOpportunity.expectedProfit)}</div>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">Maximum Loss:</div>
                        <div className="font-medium text-red-600">{formatCurrency(selectedOpportunity.maxLoss)}</div>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">Risk/Reward Ratio:</div>
                        <div className="font-medium">{selectedOpportunity.riskRewardRatio.toFixed(2)}</div>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">Confidence:</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(selectedOpportunity.confidence)}`}>
                          {selectedOpportunity.confidence.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart and Recommendation */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Underlying Chart</h4>
                    <div className="mb-6">
                      <TradingViewWidget 
                        symbol={selectedOpportunity.underlyingTicker}
                        width="100%"
                        height={200}
                        theme="light"
                        interval="D"
                        style="area" 
                        studies={[]}
                      />
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-3">Recommendation</h4>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                      <p className="text-blue-800">{selectedOpportunity.recommendation}</p>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-3">Implementation Steps</h4>
                    <div className="space-y-3">
                      <div className="border-l-4 border-blue-500 pl-4">
                        <div className="font-medium text-gray-900">1. Verify Pricing</div>
                        <p className="text-sm text-gray-600">
                          Double-check market prices and ensure the arbitrage opportunity still exists.
                        </p>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-4">
                        <div className="font-medium text-gray-900">2. Calculate Position Size</div>
                        <p className="text-sm text-gray-600">
                          Determine appropriate position size based on your risk tolerance and account size.
                        </p>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-4">
                        <div className="font-medium text-gray-900">3. Execute Trade</div>
                        <p className="text-sm text-gray-600">
                          Place the trade quickly to capture the arbitrage opportunity before it disappears.
                        </p>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-4">
                        <div className="font-medium text-gray-900">4. Manage Risk</div>
                        <p className="text-sm text-gray-600">
                          Set stop-loss orders and monitor the position closely for changes in market conditions.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                        <div>
                          <h5 className="font-medium text-yellow-800">Risk Warning</h5>
                          <p className="text-sm text-yellow-700 mt-1">
                            Arbitrage opportunities can disappear quickly. Market prices may change before you can execute the trade.
                            Always consider transaction costs, liquidity, and execution risk.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowDetails(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}