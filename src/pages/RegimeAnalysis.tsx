import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  ExternalLink,
  AlertTriangle, 
  Target, 
  Clock,
  BarChart3,
  BookOpen,
  Lightbulb,
  Shield,
  Zap
} from 'lucide-react'
import { RegimeAnalysisService } from '../services/regimeAnalysisService'
import type { RegimeAnalysis, MarketData, TradingStrategy } from '../types/regimes'
import Disclaimer from '../components/Disclaimer'
import TradingViewWidget from '../components/TradingViewWidget'

export default function RegimeAnalysisPage() {
  const [analysis, setAnalysis] = useState<RegimeAnalysis | null>(null)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [chartSymbol, setChartSymbol] = useState<string>('SPY')
  const [chartInterval, setChartInterval] = useState<string>('D')
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRealTimeData, setIsRealTimeData] = useState(false)

  useEffect(() => {
    loadRegimeAnalysis()
    const interval = setInterval(loadRegimeAnalysis, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadRegimeAnalysis = async () => {
    setLoading(true)
    try {
      // Check if real-time data is enabled
      const enableRealTime = import.meta.env.VITE_ENABLE_REAL_TIME_DATA === 'true'
      const hasApiKey = import.meta.env.VITE_POLYGON_API_KEY && import.meta.env.VITE_POLYGON_API_KEY !== 'demo_api_key'

      if (enableRealTime && hasApiKey) {
        // Try to fetch real-time data
        const realTimeData = await RegimeAnalysisService.fetchRealTimeMarketData('SPY')
        const regimeAnalysis = RegimeAnalysisService.analyzeRegime(realTimeData)

        setMarketData(realTimeData)
        setAnalysis(regimeAnalysis)
        setIsRealTimeData(true)
      } else {
        // Use mock data
        const mockData = RegimeAnalysisService.generateMockMarketData()
        const regimeAnalysis = RegimeAnalysisService.analyzeRegime(mockData)

        setMarketData(mockData)
        setAnalysis(regimeAnalysis)
        setIsRealTimeData(false)
      }
    } catch (error) {
      console.error('Failed to load regime analysis:', error)
      // Fallback to mock data
      const mockData = RegimeAnalysisService.generateMockMarketData()
      const regimeAnalysis = RegimeAnalysisService.analyzeRegime(mockData)

      setMarketData(mockData)
      setAnalysis(regimeAnalysis)
      setIsRealTimeData(false)
    } finally {
      setLoading(false)
    }
  }

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`

  const getRegimeColor = (regimeId: string) => {
    switch (regimeId) {
      case 'bull_trending': return 'text-green-600 bg-green-50 border-green-200'
      case 'bear_trending': return 'text-red-600 bg-red-50 border-red-200'
      case 'sideways_range': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'high_volatility': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low_volatility': return 'text-purple-600 bg-purple-50 border-purple-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading || !analysis || !marketData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Analyzing market regime...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analysis Disclaimer */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0"> 
            <BookOpen className="h-5 w-5 text-purple-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-purple-800">Market Analysis Learning Tool</h3>
            <div className="mt-2 text-sm text-purple-700">
              <p>
                This market regime analysis tool is designed to help you learn how to identify different market conditions. Focus on understanding the patterns and indicators, not on predicting market movements.
              </p>
              <p className="mt-1">
                Developing the skill to recognize market regimes is more valuable than trying to predict exact market movements. Use this as a learning exercise to build your market awareness.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Data Source Indicator */}
      <div className={`rounded-lg p-3 mb-4 border-2 ${
        isRealTimeData
          ? 'bg-green-50 border-green-300'
          : 'bg-yellow-50 border-yellow-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isRealTimeData ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
            }`}></div>
            <span className={`font-semibold ${
              isRealTimeData ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {isRealTimeData ? '🟢 Real-Time Market Data (Polygon.io)' : '🟡 Simulated Data (Demo Mode)'}
            </span>
          </div>
          <span className="text-sm text-gray-600">
            Last updated: {marketData?.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Current Regime Overview */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h2 className="text-2xl font-bold text-gray-900">Market Regime Learning Tool</h2>
          <p className="text-gray-600 mt-2">
            Learn to identify market conditions to develop appropriate trading approaches
          </p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Regime */}
            <div className={`p-6 rounded-lg border-2 shadow-md ${getRegimeColor(analysis.currentRegime.id)}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{analysis.currentRegime.name}</h3>
                <div className="flex items-center">
                  {analysis.currentRegime.trend === 'bullish' && <TrendingUp className="h-6 w-6" />}
                  {analysis.currentRegime.trend === 'bearish' && <TrendingDown className="h-6 w-6" />}
                  {analysis.currentRegime.trend === 'sideways' && <Activity className="h-6 w-6" />}
                </div>
              </div>
              <p className="text-sm mb-4">{analysis.currentRegime.description}</p>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Confidence:</span>
                  <span className="text-sm font-bold">{formatPercent(analysis.confidence)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Duration:</span>
                  <span className="text-sm">{analysis.currentRegime.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Time in Regime:</span>
                  <span className="text-sm">{analysis.timeInRegime} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Volatility:</span>
                  <span className={`text-sm font-medium capitalize ${
                    analysis.currentRegime.volatility === 'high' ? 'text-red-600' :
                    analysis.currentRegime.volatility === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {analysis.currentRegime.volatility}
                  </span>
                </div>
              </div>
            </div>

            {/* Market Indicators */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Key Indicators
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price:</span>
                  <span className="font-medium bg-blue-50 px-2 py-1 rounded-md">{formatCurrency(marketData.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">RSI:</span>
                  <span className={`font-medium ${
                    marketData.rsi > 70 ? 'text-red-600' : 
                    marketData.rsi < 30 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    <span className="bg-gray-50 px-2 py-1 rounded-md">{marketData.rsi.toFixed(1)}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">VIX:</span>
                  <span className={`font-medium ${
                    marketData.vix > 30 ? 'text-red-600' : 
                    marketData.vix < 15 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    <span className="bg-gray-50 px-2 py-1 rounded-md">{marketData.vix.toFixed(1)}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">MACD:</span>
                  <span className={`font-medium ${marketData.macd > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {marketData.macd.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Volume:</span>
                  <span className="font-medium">{(marketData.volume / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>

            {/* Warnings & Alerts */}
            <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                Market Alerts
              </h3>
              {analysis.warnings.length > 0 ? (
                <div className="space-y-2">
                  {analysis.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">{warning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No current warnings</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Regime Characteristics */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900">What is a Market Regime?</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Understanding Market Regimes</h4>
              <p className="text-gray-600 mb-4">
                A market regime is a persistent state of market behavior characterized by specific patterns in price movement, 
                volatility, and trading volume. Different regimes require different trading approaches for optimal results.
              </p>
              <h4 className="font-semibold text-gray-900 mb-3">Current Regime Characteristics:</h4>
              <ul className="space-y-2">
                {analysis.currentRegime.characteristics.map((characteristic, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{characteristic}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Regime Transition Probabilities</h4>
              <div className="space-y-3">
                {analysis.nextRegimeProb.map((regime, index) => (
                  <div key={regime.regime.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <div>
                      <span className="font-medium text-gray-900">{regime.regime.name}</span>
                      <p className="text-xs text-gray-500">{regime.regime.description}</p>
                    </div>
                    <span className="text-sm font-bold text-blue-600">
                      {formatPercent(regime.probability)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Strategies */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Learning Strategies for {analysis.currentRegime.name} Conditions
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analysis.recommendedStrategies.map((strategy) => (
              <div 
                key={strategy.id}
                className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedStrategy(strategy)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{strategy.name}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(strategy.riskLevel)}`}>
                    {strategy.riskLevel} complexity
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{strategy.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-green-50 p-2 rounded-md">
                    <span className="text-gray-500">Learning Focus:</span>
                    <div className="font-medium text-green-600">
                      {strategy.type === 'bullish' ? 'Directional Analysis' : 
                       strategy.type === 'bearish' ? 'Risk Management' :
                       strategy.type === 'neutral' ? 'Patience & Timing' :
                       'Volatility Assessment'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Skill Development:</span>
                    <div className="font-medium">{strategy.winRate/10} points</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded-md">
                    <span className="text-gray-500">Challenge Level:</span>
                    <div className="font-medium text-red-600">{strategy.maxDrawdown/5}/10</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Timeframe:</span>
                    <div className="font-medium capitalize">{strategy.timeframe}</div>
                  </div>
                </div>
                <button className="w-full mt-4 btn btn-primary text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  Study This Approach
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Detail Modal */}
      {selectedStrategy && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedStrategy(null)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedStrategy.name}</h3>
                  <button
                    onClick={() => setSelectedStrategy(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Strategy Overview */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Strategy Overview
                    </h4>
                    <p className="text-gray-600 mb-4">{selectedStrategy.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Expected Return</div>
                        <div className="font-bold text-green-600">+{selectedStrategy.expectedReturn}%</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Win Rate</div>
                        <div className="font-bold">{selectedStrategy.winRate}%</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Max Drawdown</div>
                        <div className="font-bold text-red-600">-{selectedStrategy.maxDrawdown}%</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Risk Level</div>
                        <div className={`font-bold capitalize ${
                          selectedStrategy.riskLevel === 'high' ? 'text-red-600' :
                          selectedStrategy.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {selectedStrategy.riskLevel}
                        </div>
                      </div>
                    </div>

                    {/* Benefits & Risks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-green-700 mb-2 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-1" />
                          Benefits
                        </h5>
                        <ul className="space-y-1">
                          {selectedStrategy.benefits.map((benefit, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-red-700 mb-2 flex items-center">
                          <Shield className="h-4 w-4 mr-1" />
                          Risks
                        </h5>
                        <ul className="space-y-1">
                          {selectedStrategy.risks.map((risk, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Step-by-Step Instructions */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Step-by-Step Instructions
                    </h4>
                    <div className="space-y-4">
                      {selectedStrategy.instructions.map((instruction, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center mb-1">
                            <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mr-2">
                              {instruction.step}
                            </span>
                            <h5 className="font-medium text-gray-900">{instruction.action}</h5>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{instruction.description}</p>
                          <div className="text-xs text-gray-500">
                            <div><strong>Timing:</strong> {instruction.timing}</div>
                            <div><strong>Conditions:</strong> {instruction.conditions.join(', ')}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Example */}
                    {selectedStrategy.examples.length > 0 && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2">Example Trade</h5>
                        <div className="text-sm space-y-1">
                          <div><strong>Scenario:</strong> {selectedStrategy.examples[0].scenario}</div>
                          <div><strong>Setup:</strong> {selectedStrategy.examples[0].setup}</div>
                          <div><strong>Entry:</strong> {selectedStrategy.examples[0].entry}</div>
                          <div><strong>Exit:</strong> {selectedStrategy.examples[0].exit}</div>
                          <div><strong>Result:</strong> {selectedStrategy.examples[0].result}</div>
                          <div className={`font-bold ${selectedStrategy.examples[0].pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            P&L: {formatCurrency(selectedStrategy.examples[0].pnl)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setSelectedStrategy(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Chart Analysis */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Market Chart Analysis
              <a href={`https://www.tradingview.com/chart/?symbol=${chartSymbol}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline ml-2 inline-flex items-center">
                <span>Open in TradingView</span>
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </h3>
            <div className="flex space-x-2">
              <select 
                className="form-select text-sm"
                defaultValue="AMEX:SPY"
                id="tvSymbolSelector"
                onChange={(e) => setChartSymbol(e.target.value.replace(/^(AMEX|NASDAQ|CBOE):/, ''))}
              >
                <option value="AMEX:SPY">SPY (S&P 500)</option>
                <option value="NASDAQ:QQQ">QQQ (Nasdaq)</option>
                <option value="AMEX:IWM">IWM (Russell 2000)</option>
                <option value="AMEX:DIA">DIA (Dow Jones)</option>
                <option value="CBOE:VIX">VIX (Volatility Index)</option>
              </select>
              <select
                className="form-select text-sm"
                defaultValue="D"
                id="tvIntervalSelector"
                onChange={(e) => setChartInterval(e.target.value)}
              >
                <option value="5">5 min</option>
                <option value="15">15 min</option>
                <option value="60">1 hour</option>
                <option value="240">4 hours</option>
                <option value="D">1 day</option>
                <option value="W">1 week</option>
                <option value="M">1 month</option>
              </select>
            </div>
          </div>
        </div> 
        
        <div className="card-body">
            <TradingViewWidget
              symbol={chartSymbol.includes(':') ? chartSymbol : `AMEX:${chartSymbol}`}
              width="100%"
             height={700}
              interval={chartInterval}
              theme="light"
              style="candles"
              studies={["RSI", "MACD", "Volume"]}
            />
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Chart Analysis for {analysis.currentRegime.name} Regime
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              {analysis.currentRegime.trend === 'bullish' 
                ? 'Look for bullish patterns like higher highs and higher lows, with strong volume on up days.'
                : analysis.currentRegime.trend === 'bearish'
                ? 'Watch for bearish patterns like lower highs and lower lows, with increased volume on down days.'
                : 'Observe range-bound price action between support and resistance levels with decreasing volume.'
              }
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <h5 className="font-medium text-gray-900 mb-1">Key Support/Resistance</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• Support: ${(marketData.price * 0.95).toFixed(2)}</li>
                  <li>• Resistance: ${(marketData.price * 1.05).toFixed(2)}</li>
                  <li>• 200-day MA: ${marketData.movingAverages.sma200.toFixed(2)}</li>
                </ul>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <h5 className="font-medium text-gray-900 mb-1">Momentum Indicators</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• RSI: {marketData.rsi.toFixed(1)} ({marketData.rsi > 70 ? 'Overbought' : marketData.rsi < 30 ? 'Oversold' : 'Neutral'})</li>
                  <li>• MACD: {marketData.macd.toFixed(2)} ({marketData.macd > 0 ? 'Bullish' : 'Bearish'})</li>
                  <li>• Volume: {(marketData.volume / 1000000).toFixed(1)}M ({marketData.volume > 1000000 ? 'High' : 'Low'})</li>
                </ul>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <h5 className="font-medium text-gray-900 mb-1">Volatility Metrics</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• VIX: {marketData.vix.toFixed(1)} ({marketData.vix > 30 ? 'High' : marketData.vix < 15 ? 'Low' : 'Moderate'})</li>
                  <li>• Bollinger Width: {((marketData.bollingerBands.upper - marketData.bollingerBands.lower) / marketData.bollingerBands.middle * 100).toFixed(1)}%</li>
                  <li>• ATR: ${(marketData.price * 0.015).toFixed(2)} ({analysis.currentRegime.volatility} volatility)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900">Learning to Navigate Different Market Regimes</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Bull Markets</h4>
              <h4 className="font-semibold text-green-800 mb-2">Bull Market Skills</h4>
              <p className="text-sm text-green-700 mb-3">
                Learn to identify uptrends and develop skills for capitalizing on momentum.
                Practice managing position sizing in trending markets.
              </p>
              <ul className="text-xs text-green-600 space-y-1">
                <li>• Learn to identify trend strength</li>
                <li>• Practice entry timing on pullbacks</li>
                <li>• Develop position management skills</li>
              </ul>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">Bear Market Skills</h4>
              <p className="text-sm text-red-700 mb-3">
                Develop risk management skills and learn to identify downtrends.
                Practice patience and capital preservation techniques.
              </p>
              <ul className="text-xs text-red-600 space-y-1">
                <li>• Learn to spot warning signs</li>
                <li>• Practice hedging techniques</li>
                <li>• Develop risk assessment skills</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Sideways Market Skills</h4>
              <p className="text-sm text-blue-700 mb-3">
                Learn to identify consolidation patterns and develop patience.
                Practice strategies that benefit from time decay.
              </p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Learn to identify support/resistance</li>
                <li>• Practice credit spread and income strategies</li>
                <li>• Develop pattern recognition skills</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}