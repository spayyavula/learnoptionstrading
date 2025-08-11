import React, { useState, useEffect } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { useOptionsContext } from '../context/OptionsContext'
import { PolygonService } from '../services/polygonService'
import { CommunityService } from '../services/communityService'
import TradingViewWidget from '../components/TradingViewWidget' 
import Disclaimer from '../components/Disclaimer'
import type { OptionsContract } from '../types/options'
import Trading from '../components/Trading'
import { Route } from 'react-router-dom'

const regimeStrategies = {
  Bull: [
    { name: 'Bull Call Spread', description: 'Buy call at lower strike, sell call at higher strike.' },
    { name: 'Cash-Secured Put', description: 'Sell put option, ready to buy underlying if assigned.' }
  ],
  Bear: [
    { name: 'Bear Put Spread', description: 'Buy put at higher strike, sell put at lower strike.' },
    { name: 'Covered Call', description: 'Hold underlying, sell call option.' }
  ],
  Volatile: [
    { name: 'Straddle', description: 'Buy call and put at same strike.' },
    { name: 'Strangle', description: 'Buy call and put at different strikes.' }
  ],
  Sideways: [
    { name: 'Iron Condor', description: 'Sell OTM call and put, buy further OTM call and put.' },
    { name: 'Butterfly Spread', description: 'Buy one ITM, sell two ATM, buy one OTM.' }
  ]
};

export default function OptionsTrading() {
  const { state, dispatch } = useOptionsContext()
  const [contracts, setContracts] = useState<OptionsContract[]>([])
  const [selectedContract, setSelectedContract] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [tradeType, setTradeType] = useState<'buy_to_open' | 'sell_to_close'>('buy_to_open')
  const [quantity, setQuantity] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [loading, setLoading] = useState(true)

  // Regime and strategy states
  const [regime, setRegime] = useState<'Bull' | 'Bear' | 'Volatile' | 'Sideways'>('Bull');
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [showRegimeInfo, setShowRegimeInfo] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [modalStrategy, setModalStrategy] = useState<{name: string, description: string} | null>(null);

  useEffect(() => {
    loadOptionsContracts()
  }, [])

  const loadOptionsContracts = async () => {
    try {
      setLoading(true)
      const topContracts = await PolygonService.getTopLiquidOptions()
      setContracts(topContracts)
    } catch (error) {
      console.error('Failed to load options contracts:', error)
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

  const selectedContractData = contracts.find(contract => contract.ticker === selectedContract)
  const existingPosition = state.positions.find(pos => pos.contractTicker === selectedContract)

  const handlePlaceOrder = () => {
    if (!selectedContract || !quantity || parseInt(quantity) <= 0) return

    const contract = contracts.find(c => c.ticker === selectedContract)
    if (!contract) return

    const orderQuantity = parseInt(quantity)
    const price = orderType === 'market' ? contract.last : parseFloat(limitPrice)
    const totalCost = orderQuantity * price * 100 // Options are per 100 shares

    // Validation
    if (tradeType === 'buy_to_open') {
      if (totalCost > state.buyingPower) {
        alert('Insufficient buying power')
        return
      }
    } else {
      if (!existingPosition || existingPosition.quantity < orderQuantity) {
        alert('Insufficient contracts to sell')
        return
      }
    }

    if (orderType !== 'market' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      alert('Please enter a valid limit price')
      return
    }

    dispatch({
      type: 'PLACE_OPTIONS_ORDER',
      payload: {
        contractTicker: selectedContract,
        underlyingTicker: contract.underlying_ticker,
        type: tradeType,
        orderType,
        quantity: orderQuantity,
        price: orderType === 'market' ? undefined : parseFloat(limitPrice),
        status: 'pending'
      }
    })

    // Reset form
    setQuantity('')
    setLimitPrice('')
    alert(`${tradeType.replace('_', ' ').toUpperCase()} order placed for ${orderQuantity} contracts of ${selectedContract}`)
    
    // Offer to share trade with community
    if (CommunityService.hasConfiguredPlatforms()) {
      const shouldShare = confirm('Would you like to share this trade with the community?')
      if (shouldShare) {
        handleShareTrade(contract, orderQuantity, price, tradeType)
      }
    }
  }
  
  const handleShareTrade = async (
    contract: OptionsContract, 
    quantity: number, 
    price: number, 
    type: string
  ) => {
    const alert = {
      symbol: contract.underlying_ticker,
      action: type.includes('buy') ? 'buy' as const : 'sell' as const,
      price,
      quantity,
      strategy: `${contract.contract_type.toUpperCase()} ${contract.strike_price} ${contract.expiration_date}`,
      reasoning: `Options trade: ${type.replace('_', ' ')} ${quantity} contracts of ${contract.ticker} at $${price.toFixed(2)}`
    }
    
    try {
      await CommunityService.shareTradingAlert(alert)
    } catch (error) {
      console.error('Failed to share trade:', error)
    }
  }

  const estimatedCost = selectedContractData && quantity 
    ? parseInt(quantity) * (orderType === 'market' ? selectedContractData.last : parseFloat(limitPrice) || 0) * 100
    : 0

  const strategies = regimeStrategies[regime];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading options contracts...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      {/* Trading Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-yellow-800">Important Risk Disclaimer</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Options trading involves substantial risk and is not suitable for all investors. The valuation of options may fluctuate, and as a result, you may lose more than your original investment.
            </p>
            <p className="mt-1">
              This platform is for educational purposes only. Past performance is not indicative of future results. Consider your investment objectives before trading.
            </p>
          </div>
        </div>
      </div>

      {/* Wizard Progress Bar */}
      <div className="flex justify-between mb-6">
        {['Regime', 'Strategy', 'Contracts', 'Review', 'Trade'].map((label, idx) => (
          <div key={label} className={`flex-1 text-center ${step === idx + 1 ? 'font-bold text-blue-600' : 'text-gray-400'}`}>
            {idx + 1}. {label}
          </div>
        ))}
      </div>

      {/* Step 1: Pick Regime */}
      {step === 1 && (
        <div className="mb-6 relative">
          <label htmlFor="market-regime-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <span>Step 1: Select Market Regime</span>
            <span
              className="ml-2 text-blue-500 cursor-pointer"
              title="Market regime helps you choose strategies that fit current market conditions."
              onClick={() => setShowRegimeInfo(true)}
            >
              <Info size={16} />
            </span>
          </label>
          {showRegimeInfo && (
            <div className="absolute z-10 bg-white border border-blue-300 rounded shadow-lg p-4 mt-2 w-80">
              <h4 className="font-bold mb-2">What is a Market Regime?</h4>
              <ul className="list-disc pl-4 text-sm text-gray-700">
                <li><strong>Bull:</strong> Market trending up, favoring bullish strategies.</li>
                <li><strong>Bear:</strong> Market trending down, favoring bearish/protective strategies.</li>
                <li><strong>Volatile:</strong> Large price swings, favoring volatility strategies.</li>
                <li><strong>Sideways:</strong> Range-bound, favoring income/neutral strategies.</li>
              </ul>
              <a
                href="https://www.investopedia.com/terms/m/marketregime.asp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mt-2 block"
              >
                Learn more on Investopedia
              </a>
              <button
                className="mt-3 px-3 py-1 bg-blue-100 rounded text-blue-700"
                onClick={() => setShowRegimeInfo(false)}
              >
                Close
              </button>
            </div>
          )}
          <select 
            id="market-regime-select"
            aria-label="Market Regime"
            value={regime} 
            onChange={e => { setRegime(e.target.value as any); setSelectedStrategy(null); }} 
            className="block w-full border border-blue-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="Bull">Bull (Trending Up)</option>
            <option value="Bear">Bear (Trending Down)</option>
            <option value="Volatile">Volatile (Big Moves)</option>
            <option value="Sideways">Sideways (Range-bound)</option>
          </select>
          <div className="mt-2 text-blue-700 text-sm flex items-center">
            <Info size={16} className="mr-1" />
            {regime === 'Bull' && 'Bull market: Prices are rising. Bullish strategies like call spreads are favored.'}
            {regime === 'Bear' && 'Bear market: Prices are falling. Bearish or protective strategies are favored.'}
            {regime === 'Volatile' && 'Volatile market: Big moves expected. Neutral or volatility strategies are favored.'}
            {regime === 'Sideways' && 'Sideways market: Prices are range-bound. Income or neutral strategies are favored.'}
          </div>
          <a
            href="https://www.optionseducation.org/strategies"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 block"
          >
            Options Strategy Education
          </a>
          <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4" onClick={() => setStep(2)}>
            Next: Pick Strategy
          </button>
        </div>
      )}

      {/* Step 2: Pick Strategy */}
      {step === 2 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            Step 2: Recommended Strategies for <span className="text-blue-600 ml-2">{regime}</span>
            <span className="ml-2 text-blue-500 cursor-pointer" title="Click a strategy to learn more and start building it.">
              <Info size={16} />
            </span>
          </h3>
          <ul className="mt-2">
            {strategies.map(strat => (
              <li key={strat.name} className="flex items-center justify-between py-2 border-b border-gray-200">
                <div className="flex-1">
                  <button
                    className={`text-left w-full rounded-md px-4 py-2 font-medium transition-all duration-200 ease-in-out ${
                      selectedStrategy === strat.name 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800 hover:bg-blue-50'
                    }`}
                    onClick={() => setSelectedStrategy(strat.name)}
                  >
                    {strat.name}
                    <span
                      className="ml-2 text-blue-500 cursor-pointer"
                      title="Learn more about this strategy"
                      onClick={e => {
                        e.stopPropagation();
                        setModalStrategy(strat);
                        setShowStrategyModal(true);
                      }}
                    >
                      <Info size={14} />
                    </span>
                  </button>
                  <p className="text-sm text-gray-600">{strat.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <a
            href="https://www.optionseducation.org/strategies"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 block"
          >
            Learn more about options strategies
          </a>
          <div className="flex justify-between mt-6">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(1)}>Back</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={!selectedStrategy} onClick={() => setStep(3)}>
              Next: Select Contracts
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Contracts (placeholder) */}
      {step === 3 && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
            {selectedStrategy} Builder
            <span className="ml-2 text-blue-500 cursor-pointer" title="Select option contracts (strike, expiry, type) for your strategy.">
              <Info size={16} />
            </span>
          </h4>
          <p className="text-sm text-gray-700">
            Configure your {selectedStrategy} below. (Contract selection, payoff chart, Greeks, etc. coming next!)
          </p>
          <a
            href="https://www.optionseducation.org/strategies"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 block"
          >
            How to select contracts for strategies
          </a>
          <div className="flex justify-between mt-6">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(2)}>Back</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setStep(4)}>
              Next: Review Payoff
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review Payoff/Greeks (placeholder) */}
      {step === 4 && (
        <>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            Step 4: Review Payoff & Greeks
            <span className="ml-2 text-blue-500 cursor-pointer" title="See your risk/reward, payoff chart, and Greeks before trading.">
              <Info size={16} />
            </span>
          </h2>
          <p className="mb-4 text-gray-700">Show payoff chart, Greeks, risk/reward, and trade summary here.</p>
          <a
            href="https://www.optionseducation.org/tools"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 block"
          >
            Learn about payoff charts and Greeks
          </a>
          <div className="flex justify-between mt-6">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(3)}>Back</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setStep(5)}>
              Next: Confirm Trade
            </button>
          </div>
        </>
      )}

      {/* Step 5: Confirm Trade (placeholder) */}
      {step === 5 && (
        <>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            Step 5: Confirm & Trade
            <span className="ml-2 text-blue-500 cursor-pointer" title="Final review before placing your trade.">
              <Info size={16} />
            </span>
          </h2>
          <p className="mb-4 text-gray-700">Final review and simulated trade placement UI goes here.</p>
          <a
            href="https://www.optionseducation.org/resources"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 block"
          >
            Trading best practices
          </a>
          <div className="flex justify-between mt-6">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(4)}>Back</button>
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => setStep(1)}>
              Start Over
            </button>
          </div>
        </>
      )}

      {/* Strategy Modal */}
      {showStrategyModal && modalStrategy && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
            <h3 className="font-bold text-lg mb-2">{modalStrategy.name}</h3>
            <p className="mb-3 text-gray-700">{modalStrategy.description}</p>
            <a
              href={`https://www.investopedia.com/search?q=${encodeURIComponent(modalStrategy.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Educational article on Investopedia
            </a>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-blue-600"
              onClick={() => setShowStrategyModal(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}