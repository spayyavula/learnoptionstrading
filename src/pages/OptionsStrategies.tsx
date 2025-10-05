import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ArrowRight,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle, 
  Target,
  DollarSign,
  Clock,
  Zap,
  Play,
  Lightbulb,
  Shield
} from 'lucide-react'
import Disclaimer from '../components/Disclaimer'
import { LearningService } from '../services/learningService'
import type { StrategyTemplate } from '../types/learning'

export default function OptionsStrategies() {
  const [strategies, setStrategies] = useState<StrategyTemplate[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyTemplate | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterComplexity, setFilterComplexity] = useState<string>('all')
  const [showImplementModal, setShowImplementModal] = useState(false)
  const [implementationDetails, setImplementationDetails] = useState({
    underlyingTicker: 'SPY',
    quantity: 1,
    daysToExpiration: 30
  })

  useEffect(() => {
    loadStrategies()
  }, [])

  const loadStrategies = () => {
    const templates = LearningService.getStrategyTemplates()
    console.log('Loaded strategy templates:', templates)
    // Find and log Bull Call Spread specifically
    const bullCallSpread = templates.find(s => s.id === 'bull_call_spread')
    if (bullCallSpread) {
      console.log('Bull Call Spread legs:', bullCallSpread.legs)
    }
    setStrategies(templates)
  }

  const filteredStrategies = strategies.filter(strategy => {
    const matchesType = filterType === 'all' || strategy.type === filterType
    const matchesComplexity = filterComplexity === 'all' || strategy.complexity === filterComplexity
    return matchesType && matchesComplexity
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bullish': return 'text-green-600 bg-green-50 border-green-200'
      case 'bearish': return 'text-red-600 bg-red-50 border-red-200'
      case 'neutral': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'volatility': return 'text-purple-600 bg-purple-50 border-purple-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      case 'neutral': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const handleImplementStrategy = () => {
    // In a real implementation, this would create the actual options orders
    // For now, we'll just close the modal
    setShowImplementModal(false)
    alert(`Strategy ${selectedStrategy?.name} implementation prepared for ${implementationDetails.underlyingTicker}. In a real system, this would create the actual options orders.`)
  }

  return (
    <div className="space-y-6">
      {/* Strategy Disclaimer */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Strategy Learning Approach</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                These options strategies are presented as learning tools to help you develop trading expertise. Focus on understanding each strategy's mechanics and appropriate use cases.
              </p>
              <p className="mt-1">
                The goal is to build your strategic thinking skills, not to find a "perfect" strategy. Learning when and how to apply different approaches is key to developing expertise.
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
              <h2 className="text-2xl font-bold text-gray-900">Options Strategy Learning Center</h2>
              <p className="text-gray-600 mt-2">
                Master different trading approaches to develop your strategic expertise
              </p>
            </div>
            <Lightbulb className="h-12 w-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-md border-gray-200">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Strategy Type</label>
              <select
                className="form-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="bullish">Bullish</option>
                <option value="bearish">Bearish</option>
                <option value="neutral">Neutral</option>
                <option value="volatility">Volatility</option>
              </select>
            </div>
            <div>
              <label className="form-label">Complexity</label>
              <select
                className="form-select"
                value={filterComplexity}
                onChange={(e) => setFilterComplexity(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Strategies */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900">Comprehensive Strategy Library</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-4">
            {filteredStrategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${getTypeColor(strategy.type)}`}
                onClick={() => setSelectedStrategy(strategy)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{strategy.name}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getComplexityColor(strategy.complexity)}`}>
                    {strategy.complexity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{strategy.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Learning Focus:</span>
                    <div className="font-medium text-blue-600">
                      {strategy.type === 'bullish' ? 'Directional Analysis' : 
                       strategy.type === 'bearish' ? 'Risk Management' :
                       strategy.type === 'neutral' ? 'Patience & Timing' :
                       'Volatility Assessment'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Complexity:</span>
                    <div className="font-medium text-blue-600">{strategy.complexity}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      strategy.type === 'bullish' ? 'bg-green-500' :
                      strategy.type === 'bearish' ? 'bg-red-500' :
                      strategy.type === 'neutral' ? 'bg-blue-500' :
                      'bg-purple-500'
                    }`}></span>
                    <span className="text-xs text-gray-500 capitalize">{strategy.type}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStrategy(strategy);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center bg-blue-50 px-3 py-1 rounded-lg"
                  >
                    Learn Strategy
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Additional Strategies Section */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Advanced Strategy Combinations</h3>
            <p className="text-gray-600 mb-4">
              Beyond the basic strategies, traders can combine multiple approaches to create custom strategies tailored to specific market conditions and risk profiles.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-medium text-blue-700">Calendar Spreads</h4>
                <p className="text-sm text-gray-600 mb-2">Sell near-term option, buy longer-term option at same strike.</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Learning Focus: Time Decay</span>
                  <span>Risk Profile: Defined</span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-medium text-blue-700">Diagonal Spreads</h4>
                <p className="text-sm text-gray-600 mb-2">Combines different strikes and expirations for enhanced flexibility.</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Learning Focus: Multiple Variables</span>
                  <span>Risk Profile: Complex</span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-medium text-blue-700">Butterflies</h4>
                <p className="text-sm text-gray-600 mb-2">Combines bull and bear spreads with shared middle strike.</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Learning Focus: Precision</span>
                  <span>Risk Profile: Defined</span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-medium text-blue-700">Ratio Spreads</h4>
                <p className="text-sm text-gray-600 mb-2">Unequal number of long and short options for asymmetric payoffs.</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Learning Focus: Risk/Reward</span>
                  <span>Risk Profile: Unlimited</span>
                </div>
              </div>
            </div>
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
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedStrategy.name}</h3>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(selectedStrategy.type)}`}>
                      {selectedStrategy.type}
                    </span>
                  </div>
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
                      <Info className="h-4 w-4 mr-2" />
                      Strategy Overview
                    </h4>
                    <p className="text-gray-600 mb-4">{selectedStrategy.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Max Risk</div>
                        <div className="font-bold text-red-600">
                          ${selectedStrategy.maxRisk}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Max Profit</div>
                        <div className="font-bold text-green-600">
                          {selectedStrategy.maxProfit === Infinity ? 'Unlimited' : `$${selectedStrategy.maxProfit}`}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Breakeven</div>
                        <div className="font-medium">
                          {selectedStrategy.breakeven.map((point, i) => (
                            <span key={i}>
                              {i > 0 && ', '}
                              ${point}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Complexity</div>
                        <div className={`font-medium capitalize ${
                          selectedStrategy.complexity === 'beginner' ? 'text-green-600' :
                          selectedStrategy.complexity === 'intermediate' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {selectedStrategy.complexity}
                        </div>
                      </div>
                    </div>

                    {/* Strategy Legs */}
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Strategy Legs ({selectedStrategy.legs.length} {selectedStrategy.legs.length === 1 ? 'Leg' : 'Legs'})
                    </h4>
                    <div className="space-y-3 mb-6">
                      {selectedStrategy.legs.map((leg, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <span className={`font-medium text-lg ${leg.action === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                                {leg.action === 'buy' ? 'BUY' : 'SELL'}
                              </span>
                              <span className="mx-2 font-semibold">
                                {leg.quantity} {leg.optionType.toUpperCase()}
                              </span>
                              <span className="text-gray-700 font-medium">
                                @ ${leg.strike}
                              </span>
                              <span className="text-gray-500 ml-2">
                                ({leg.expiration})
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Market Conditions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-green-700 mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Best Market Conditions
                        </h5>
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
                        <h5 className="font-medium text-red-700 mb-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Worst Market Conditions
                        </h5>
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
                  </div>

                  {/* Greek Impacts & Implementation */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Greek Impacts
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Time Decay (Theta)</div>
                        <div className={`font-medium capitalize ${getImpactColor(selectedStrategy.timeDecay)}`}>
                          {selectedStrategy.timeDecay}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">Volatility (Vega)</div>
                        <div className={`font-medium capitalize ${getImpactColor(selectedStrategy.volatilityImpact)}`}>
                          {selectedStrategy.volatilityImpact}
                        </div>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Implementation & Risk Management
                    </h4>
                    <div className="space-y-4">
                      {selectedStrategy.instructions && selectedStrategy.instructions.length > 0 ? (
                        selectedStrategy.instructions.map((instruction, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <p className="text-sm text-gray-600">{instruction}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No implementation instructions available for this strategy.</p>
                      )}
                    </div>
                    
                    {/* New Risk Adjustment Section */}
                    <div className="mt-6 bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-3">Adjusting for Risk Reduction</h5>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                          <h6 className="font-medium text-blue-800 mb-1">Position Sizing</h6>
                          <p className="text-sm text-gray-600">Start with smaller position sizes (1-2% of portfolio) while learning this strategy. Increase size only after demonstrating consistent success.</p>
                        </div>
                        
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                          <h6 className="font-medium text-blue-800 mb-1">Stop Loss Management</h6>
                          <p className="text-sm text-gray-600">Set mental or actual stop losses at 50% of maximum risk. This is a skill that requires practice and discipline.</p>
                        </div>
                        
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                          <h6 className="font-medium text-blue-800 mb-1">Rolling Positions</h6>
                          <p className="text-sm text-gray-600">If a position moves against you, practice rolling to a different expiration or strike. This gives your thesis more time to play out.</p>
                        </div>
                        
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                          <h6 className="font-medium text-blue-800 mb-1">Adding Protective Legs</h6>
                          <p className="text-sm text-gray-600">Learn to convert single options to spreads by adding opposing legs. This is a key risk management skill that limits both risk and reward.</p>
                        </div>
                      </div>
                    </div>

                    {/* Example */}
                    {selectedStrategy.examples && selectedStrategy.examples.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Play className="h-4 w-4 mr-2" />
                          Example
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">{selectedStrategy.examples[0]}</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowImplementModal(true)
                      }}
                      className="w-full btn btn-primary mt-6"
                    >
                      <Zap className="h-4 w-4" />
                      Implement This Strategy
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse border-t border-gray-200">
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

      {/* Implementation Modal */}
      {showImplementModal && selectedStrategy && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowImplementModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Implement {selectedStrategy.name}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="form-label">Underlying Ticker</label>
                        <select
                          className="form-select"
                          value={implementationDetails.underlyingTicker}
                          onChange={(e) => setImplementationDetails({...implementationDetails, underlyingTicker: e.target.value})}
                        >
                          <option value="SPY">SPY</option>
                          <option value="QQQ">QQQ</option>
                          <option value="AAPL">AAPL</option>
                          <option value="TSLA">TSLA</option>
                          <option value="NVDA">NVDA</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          className="form-input"
                          value={implementationDetails.quantity}
                          onChange={(e) => setImplementationDetails({...implementationDetails, quantity: parseInt(e.target.value)})}
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Days to Expiration</label>
                        <select
                          className="form-select"
                          value={implementationDetails.daysToExpiration}
                          onChange={(e) => setImplementationDetails({...implementationDetails, daysToExpiration: parseInt(e.target.value)})}
                        >
                          <option value="7">7 days</option>
                          <option value="14">14 days</option>
                          <option value="30">30 days</option>
                          <option value="45">45 days</option>
                          <option value="60">60 days</option>
                        </select>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Strategy Summary
                        </h4>
                        <div className="space-y-1 text-sm text-blue-800">
                          <p>• {selectedStrategy.name} on {implementationDetails.underlyingTicker}</p>
                          <p>• {implementationDetails.quantity} contract(s)</p>
                          <p>• {implementationDetails.daysToExpiration} days to expiration</p>
                          <p>• Max risk: ${selectedStrategy.maxRisk * implementationDetails.quantity}</p>
                          <p>• Max profit: {selectedStrategy.maxProfit === Infinity ? 'Unlimited' : `$${selectedStrategy.maxProfit * implementationDetails.quantity}`}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleImplementStrategy}
                  className="btn btn-primary"
                >
                  <Zap className="h-4 w-4" />
                  Implement Strategy
                </button>
                <button
                  onClick={() => setShowImplementModal(false)}
                  className="btn btn-secondary mr-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Risk Management Education Section */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900">Risk Management for Options Strategies</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Adjusting Existing Trades</h4>
              <p className="text-gray-600 mb-4">
                Learning to adjust existing positions is a critical skill for managing risk in options trading. 
                Instead of simply closing losing positions, consider these adjustment techniques:
              </p>
              
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h5 className="font-medium text-gray-900">Rolling Out in Time</h5>
                  <p className="text-sm text-gray-600">Close current position and reestablish with a later expiration to give your thesis more time to play out.</p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h5 className="font-medium text-gray-900">Rolling Up or Down</h5>
                  <p className="text-sm text-gray-600">Adjust strike prices to reduce risk or lock in partial profits as the underlying moves.</p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h5 className="font-medium text-gray-900">Adding Protective Legs</h5>
                  <p className="text-sm text-gray-600">Convert a naked position to a spread by adding an opposing option to define and limit risk.</p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h5 className="font-medium text-gray-900">Legging Out</h5>
                  <p className="text-sm text-gray-600">For multi-leg strategies, close individual legs at different times to manage risk and capture profits.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Risk Reduction Techniques</h4>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200 mb-4 shadow-sm">
                <h5 className="font-medium text-green-800 mb-2">Position Sizing</h5>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Start small: 1-2% of portfolio per position</li>
                  <li>• Scale in gradually rather than all at once</li>
                  <li>• Increase size only after demonstrating consistent success</li>
                  <li>• Reduce size during high volatility periods</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200 mb-4 shadow-sm">
                <h5 className="font-medium text-yellow-800 mb-2">Diversification</h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use multiple strategies across different underlyings</li>
                  <li>• Balance directional exposure (bullish/bearish)</li>
                  <li>• Vary expirations to reduce time-specific risk</li>
                  <li>• Mix high and low volatility strategies</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200 shadow-sm">
                <h5 className="font-medium text-red-800 mb-2">Exit Planning</h5>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Define profit targets before entering trades</li>
                  <li>• Set maximum loss thresholds</li>
                  <li>• Consider time-based exits for theta strategies</li>
                  <li>• Plan for early exits if thesis is invalidated</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* New Advanced Risk Management Section */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900">Advanced Risk Management Techniques</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Adjusting Existing Trades
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Learning to adjust trades that move against you is a critical skill for managing risk and improving outcomes.
              </p>
              <div className="space-y-2">
                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                  <p className="text-xs font-medium text-blue-700">Rolling Technique</p>
                  <p className="text-xs text-gray-600">Close current position and open a new one with more time or different strike.</p>
                </div>
                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                  <p className="text-xs font-medium text-blue-700">Legging Into Spreads</p>
                  <p className="text-xs text-gray-600">Add opposing options to create spreads and define risk.</p>
                </div>
                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                  <p className="text-xs font-medium text-blue-700">Partial Closing</p>
                  <p className="text-xs text-gray-600">Close a portion of your position to reduce exposure while maintaining some upside.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" />
                Position Sizing Mastery
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Proper position sizing is your first line of defense against catastrophic losses.
              </p>
              <div className="space-y-2">
                <div className="bg-green-50 p-2 rounded border border-green-100">
                  <p className="text-xs font-medium text-green-700">Kelly Criterion</p>
                  <p className="text-xs text-gray-600">Mathematical formula to determine optimal position size based on edge and win rate.</p>
                </div>
                <div className="bg-green-50 p-2 rounded border border-green-100">
                  <p className="text-xs font-medium text-green-700">Fixed Percentage</p>
                  <p className="text-xs text-gray-600">Risk a fixed percentage (1-2%) of your portfolio on any single trade.</p>
                </div>
                <div className="bg-green-50 p-2 rounded border border-green-100">
                  <p className="text-xs font-medium text-green-700">Volatility-Based Sizing</p>
                  <p className="text-xs text-gray-600">Adjust position size based on the volatility of the underlying asset.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-purple-600" />
                Hedging Strategies
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Learn to protect your portfolio against adverse market movements.
              </p>
              <div className="space-y-2">
                <div className="bg-purple-50 p-2 rounded border border-purple-100">
                  <p className="text-xs font-medium text-purple-700">Protective Puts</p>
                  <p className="text-xs text-gray-600">Buy puts to protect against downside in long stock positions.</p>
                </div>
                <div className="bg-purple-50 p-2 rounded border border-purple-100">
                  <p className="text-xs font-medium text-purple-700">Collar Strategy</p>
                  <p className="text-xs text-gray-600">Combine covered calls and protective puts to create a range of outcomes.</p>
                </div>
                <div className="bg-purple-50 p-2 rounded border border-purple-100">
                  <p className="text-xs font-medium text-purple-700">VIX Hedging</p>
                  <p className="text-xs text-gray-600">Use VIX-based products to hedge against market volatility.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Learning Path for Risk Management</h4>
            <p className="text-sm text-blue-700 mb-3">
              Developing strong risk management skills is a journey that requires practice and experience. Follow this progression:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100 relative">
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full text-white flex items-center justify-center text-xs font-bold">1</div>
                <h5 className="font-medium text-gray-900 mb-1 pl-4">Position Sizing</h5>
                <p className="text-xs text-gray-600">Master basic position sizing before moving to complex strategies.</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100 relative">
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full text-white flex items-center justify-center text-xs font-bold">2</div>
                <h5 className="font-medium text-gray-900 mb-1 pl-4">Stop Loss Discipline</h5>
                <p className="text-xs text-gray-600">Develop the discipline to honor your predetermined exit points.</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100 relative">
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full text-white flex items-center justify-center text-xs font-bold">3</div>
                <h5 className="font-medium text-gray-900 mb-1 pl-4">Basic Adjustments</h5>
                <p className="text-xs text-gray-600">Learn to roll positions and convert to basic spreads.</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100 relative">
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full text-white flex items-center justify-center text-xs font-bold">4</div>
                <h5 className="font-medium text-gray-900 mb-1 pl-4">Advanced Hedging</h5>
                <p className="text-xs text-gray-600">Master complex hedging techniques and portfolio-level risk management.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}