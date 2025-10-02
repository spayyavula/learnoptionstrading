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

const regimeExplanations = {
  Bull: "Bull market: Prices are rising. Bullish strategies like call spreads are favored. Typically, traders expect upward momentum.",
  Bear: "Bear market: Prices are falling. Bearish or protective strategies are favored. Traders expect downward movement.",
  Volatile: "Volatile market: Big moves expected. Neutral or volatility strategies are favored. Uncertainty is high.",
  Sideways: "Sideways market: Prices are range-bound. Income or neutral strategies are favored. No clear trend."
};

const strategyDetails = {
  'Bull Call Spread': {
    description: 'Buy call at lower strike, sell call at higher strike.',
    education: 'A Bull Call Spread is a limited-risk, limited-reward strategy used when a moderate rise in the price of the underlying asset is expected. You buy a call at a lower strike and sell another call at a higher strike, both with the same expiration.'
  },
  'Cash-Secured Put': {
    description: 'Sell put option, ready to buy underlying if assigned.',
    education: 'A Cash-Secured Put involves selling a put option while holding enough cash to buy the underlying stock if assigned. This strategy is used to potentially acquire stock at a lower price while earning premium income.'
  },
  'Bear Put Spread': {
    description: 'Buy put at higher strike, sell put at lower strike.',
    education: 'A Bear Put Spread is used when a moderate decline in the underlying asset is expected. You buy a put at a higher strike and sell another put at a lower strike, both with the same expiration.'
  },
  'Covered Call': {
    description: 'Hold underlying, sell call option.',
    education: 'A Covered Call involves holding the underlying stock and selling a call option against it. This generates income but limits upside potential if the stock rises above the strike price.'
  },
  'Straddle': {
    description: 'Buy call and put at same strike.',
    education: 'A Straddle involves buying both a call and a put option at the same strike price and expiration. It profits from large moves in either direction.'
  },
  'Strangle': {
    description: 'Buy call and put at different strikes.',
    education: 'A Strangle is similar to a straddle but uses different strike prices for the call and put. It is cheaper but requires a larger move to profit.'
  },
  'Iron Condor': {
    description: 'Sell OTM call and put, buy further OTM call and put.',
    education: 'An Iron Condor is a neutral strategy that profits from low volatility. It involves selling an out-of-the-money call and put, and buying further out-of-the-money call and put for protection.'
  },
  'Butterfly Spread': {
    description: 'Buy one ITM, sell two ATM, buy one OTM.',
    education: 'A Butterfly Spread is a neutral strategy that profits from minimal movement in the underlying. It involves buying one in-the-money option, selling two at-the-money options, and buying one out-of-the-money option.'
  }
};

const regimeStrategies = {
  Bull: [
    { name: 'Bull Call Spread', description: strategyDetails['Bull Call Spread'].description },
    { name: 'Cash-Secured Put', description: strategyDetails['Cash-Secured Put'].description }
  ],
  Bear: [
    { name: 'Bear Put Spread', description: strategyDetails['Bear Put Spread'].description },
    { name: 'Covered Call', description: strategyDetails['Covered Call'].description }
  ],
  Volatile: [
    { name: 'Straddle', description: strategyDetails['Straddle'].description },
    { name: 'Strangle', description: strategyDetails['Strangle'].description }
  ],
  Sideways: [
    { name: 'Iron Condor', description: strategyDetails['Iron Condor'].description },
    { name: 'Butterfly Spread', description: strategyDetails['Butterfly Spread'].description }
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

  // New states for Bull Call Spread builder
  const [buyCallTicker, setBuyCallTicker] = useState<string | null>(null);
  const [sellCallTicker, setSellCallTicker] = useState<string | null>(null);

  // Helper: get unique underlyings
  const underlyings = Array.from(new Set(contracts.filter(c => c.contract_type === 'call').map(c => c.underlying_ticker)));

  // New state for underlying selection
  const [selectedUnderlying, setSelectedUnderlying] = useState<string | null>(null);

  // New state for expiry selection
  const [selectedExpiry, setSelectedExpiry] = useState<string | null>(null);

  // Filter contracts for selected underlying
  const underlyingContracts = contracts.filter(
    c => c.contract_type === 'call' && c.underlying_ticker === selectedUnderlying
  );

  // Get all expiries for selected underlying
  const availableExpiries = Array.from(new Set(underlyingContracts.map(c => c.expiration_date))).sort();

  // Filter contracts for selected underlying and expiry, only liquid contracts
  const expiryContracts = contracts.filter(
    c => c.contract_type === 'call' &&
         c.underlying_ticker === selectedUnderlying &&
         c.expiration_date === selectedExpiry &&
         (c.open_interest > 0 || c.volume > 0) // Only show liquid contracts
  );

  // Get all available strikes for selected underlying and expiry
  const allStrikes = Array.from(new Set(expiryContracts.map(c => c.strike_price))).sort((a, b) => a - b);

  // Buy Call options: all liquid contracts for this expiry
  const buyCallOptions = expiryContracts;

  // Get selected buy call contract
  const buyCallContract = buyCallOptions.find(c => c.ticker === buyCallTicker);

  // Sell Call options: all liquid contracts with higher strike for same expiry
  const sellCallOptions = buyCallContract
    ? expiryContracts.filter(c => c.strike_price > buyCallContract.strike_price)
    : [];

  useEffect(() => {
    loadOptionsContracts()
  }, [])

  const loadOptionsContracts = async () => {
    try {
      setLoading(true)
      const topContracts = PolygonService.getTopLiquidOptions()
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
              title="What is a market regime?"
              onClick={() => setShowRegimeInfo(true)}
            >
              <Info size={16} />
            </span>
          </label>
          {showRegimeInfo && (
            <div className="absolute z-10 bg-white border border-blue-300 rounded shadow-lg p-4 mt-2 w-80">
              <h4 className="font-bold mb-2">Market Regimes Explained</h4>
              <ul className="list-disc pl-4 text-sm text-gray-700">
                <li><strong>Bull:</strong> {regimeExplanations.Bull}</li>
                <li><strong>Bear:</strong> {regimeExplanations.Bear}</li>
                <li><strong>Volatile:</strong> {regimeExplanations.Volatile}</li>
                <li><strong>Sideways:</strong> {regimeExplanations.Sideways}</li>
              </ul>
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
            {regimeExplanations[regime]}
          </div>
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
          <div className="flex justify-between mt-6">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(1)}>Back</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={!selectedStrategy} onClick={() => setStep(3)}>
              Next: Select Contracts
            </button>
          </div>
          {/* Inline Strategy Modal */}
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
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2 text-blue-700 text-sm">
            <strong>Tip:</strong> Choose strikes and expiries that match your market outlook and risk tolerance.
          </div>
          <div className="flex justify-between mt-6">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(2)}>Back</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setStep(4)}>
              Next: Review Payoff
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Bull Call Spread Builder */}
      {step === 3 && selectedStrategy === 'Bull Call Spread' && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
            Bull Call Spread Builder
            <span className="ml-2 text-blue-500 cursor-pointer" title="A Bull Call Spread profits from moderate upward moves.">
              <Info size={16} />
            </span>
          </h4>
          <p className="text-sm text-gray-700 mb-4">
            1. Select underlying<br />
            2. Select expiry<br />
            3. Pick a lower strike to buy<br />
            4. Pick a higher strike to sell (same expiry)
          </p>
          {/* Underlying selection */}
          <div className="mb-4">
            <label htmlFor="underlying-select" className="block text-sm font-medium text-gray-700 mb-1">
              Underlying
            </label>
            <select
              id="underlying-select"
              value={selectedUnderlying || ''}
              onChange={e => {
                setSelectedUnderlying(e.target.value);
                setSelectedExpiry(null);
                setBuyCallTicker(null);
                setSellCallTicker(null);
              }}
              className="block w-full border border-blue-300 rounded-md shadow-sm"
            >
              <option value="">Select underlying</option>
              {underlyings.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          {/* Expiry selection */}
          <div className="mb-4">
            <label htmlFor="expiry-select" className="block text-sm font-medium text-gray-700 mb-1">
              Expiry
            </label>
            <select
              id="expiry-select"
              value={selectedExpiry || ''}
              onChange={e => {
                setSelectedExpiry(e.target.value);
                setBuyCallTicker(null);
                setSellCallTicker(null);
              }}
              className="block w-full border border-blue-300 rounded-md shadow-sm"
              disabled={!selectedUnderlying}
            >
              <option value="">Select expiry</option>
              {availableExpiries.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>
          {/* Buy Call selection */}
          <div className="mb-4">
            <label htmlFor="buy-call-select" className="block text-sm font-medium text-gray-700 mb-1">
              Buy Call (Lower Strike)
            </label>
            <select
              id="buy-call-select"
              value={buyCallTicker || ''}
              onChange={e => {
                setBuyCallTicker(e.target.value);
                setSellCallTicker(null);
              }}
              className="block w-full border border-blue-300 rounded-md shadow-sm"
              disabled={!selectedExpiry}
            >
              <option value="">Select contract</option>
              {buyCallOptions.map(c => (
                <option key={c.ticker} value={c.ticker}>
                  {c.underlying_ticker} {c.strike_price} {c.expiration_date}
                </option>
              ))}
            </select>
          </div>
          {/* Sell Call selection */}
          <div className="mb-4">
            <label htmlFor="sell-call-select" className="block text-sm font-medium text-gray-700 mb-1">
              Sell Call (Higher Strike)
            </label>
            <select
              id="sell-call-select"
              value={sellCallTicker || ''}
              onChange={e => setSellCallTicker(e.target.value)}
              className="block w-full border border-blue-300 rounded-md shadow-sm"
              disabled={!buyCallTicker}
            >
              <option value="">Select contract</option>
              {sellCallOptions.length === 0 && buyCallTicker && (
                <option value="" disabled>
                  No higher strikes available for this expiry
                </option>
              )}
              {sellCallOptions.map(c => (
                <option key={c.ticker} value={c.ticker}>
                  {c.underlying_ticker} {c.strike_price} {c.expiration_date}
                </option>
              ))}
            </select>
            {!buyCallTicker && (
              <div className="text-xs text-gray-500 mt-1">Select the lower strike first</div>
            )}
          </div>
          {/* Greeks and Payoff Chart Placeholder */}
          <div className="mb-4">
            <h5 className="font-semibold text-gray-800 mb-1">Strategy Greeks</h5>
            <ul className="text-sm text-gray-700 mb-2">
              <li><strong>Delta:</strong> Positive, benefits from upward moves.</li>
              <li><strong>Gamma:</strong> Moderate, as both legs are calls.</li>
              <li><strong>Theta:</strong> Negative, time decay hurts the position.</li>
              <li><strong>Vega:</strong> Lower than a single call, as volatility affects both legs.</li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-blue-700 text-sm">
              <strong>Tip:</strong> Max profit is the difference between strikes minus net premium paid. Max loss is the net premium paid.
            </div>
          </div>
          <div className="mb-4">
            <h5 className="font-semibold text-gray-800 mb-1">Payoff Chart</h5>
            <div className="bg-gray-100 rounded p-4 text-center text-gray-500">
              [Payoff chart visualization coming soon]
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(2)}>Back</button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={!buyCallTicker || !sellCallTicker}
              onClick={() => setStep(4)}
            >
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
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2 text-blue-700 text-sm">
            <strong>Tip:</strong> Review your strategy’s risk and reward before placing a trade.
          </div>
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
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2 text-blue-700 text-sm">
            <strong>Tip:</strong> Make sure you understand the trade and its risks before confirming.
          </div>
          <div className="flex justify-between mt-6">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setStep(4)}>Back</button>
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => setStep(1)}>
              Start Over
            </button>
          </div>
        </>
      )}
    </div>
  );
}