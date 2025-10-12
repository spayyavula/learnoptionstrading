import React, { useState, useEffect } from 'react'
import {
  CreditCard, CheckCircle, AlertCircle, TrendingUp, Shield, Link as LinkIcon,
  ExternalLink, Info, Zap, Globe, Clock, DollarSign, Award, ArrowRight,
  Users, Lock, Activity, BarChart3
} from 'lucide-react'
import AlpacaCredentialsAccordion from '../components/AlpacaCredentialsAccordion'
import AlpacaSetupWizard from '../components/AlpacaSetupWizard'
import AlpacaAccountDashboard from '../components/AlpacaAccountDashboard'
import RobinhoodSetupWizard from '../components/RobinhoodSetupWizard'
import RobinhoodAccountDashboard from '../components/RobinhoodAccountDashboard'
import IBKRSetupWizard from '../components/IBKRSetupWizard'
import ZerodhaSetupWizard from '../components/ZerodhaSetupWizard'
import ZerodhaAccountDashboard from '../components/ZerodhaAccountDashboard'
import { IndianBrokersSetupWizard } from '../components/IndianBrokersSetupWizard'
import TradingModeToggle from '../components/TradingModeToggle'
import { supabase } from '../lib/supabase'

export default function BrokerConnections() {
  const [showAlpacaWizard, setShowAlpacaWizard] = useState(false)
  const [showRobinhoodWizard, setShowRobinhoodWizard] = useState(false)
  const [showIBKRWizard, setShowIBKRWizard] = useState(false)
  const [showZerodhaWizard, setShowZerodhaWizard] = useState(false)
  const [showIndianBrokersWizard, setShowIndianBrokersWizard] = useState(false)
  const [hasAlpacaCredentials, setHasAlpacaCredentials] = useState(false)
  const [hasRobinhoodCredentials, setHasRobinhoodCredentials] = useState(false)
  const [hasIBKRCredentials, setHasIBKRCredentials] = useState(false)
  const [hasZerodhaCredentials, setHasZerodhaCredentials] = useState(false)
  const [hasICICICredentials, setHasICICICredentials] = useState(false)
  const [hasHDFCCredentials, setHasHDFCCredentials] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tradingMode, setTradingMode] = useState<'paper' | 'alpaca-paper' | 'alpaca-live' | 'robinhood-crypto' | 'ibkr-paper' | 'ibkr-live' | 'zerodha-live' | 'icici-live' | 'hdfc-live'>('paper')
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null)

  useEffect(() => {
    checkAllCredentials()
    loadTradingMode()
  }, [])

  const checkAllCredentials = async () => {
    setLoading(true)
    await Promise.all([
      checkAlpacaCredentials(),
      checkRobinhoodCredentials(),
      checkIBKRCredentials(),
      checkZerodhaCredentials(),
      checkICICICredentials(),
      checkHDFCCredentials()
    ])
    setLoading(false)
  }

  const checkAlpacaCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('alpaca_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      setHasAlpacaCredentials(!!data && data.length > 0)
    } catch (error) {
      console.error('Error checking Alpaca credentials:', error)
    }
  }

  const checkRobinhoodCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('robinhood_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      setHasRobinhoodCredentials(!!data && data.length > 0)
    } catch (error) {
      console.error('Error checking Robinhood credentials:', error)
    }
  }

  const checkIBKRCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('ibkr_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      setHasIBKRCredentials(!!data && data.length > 0)
    } catch (error) {
      console.error('Error checking IBKR credentials:', error)
    }
  }

  const checkZerodhaCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('zerodha_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      setHasZerodhaCredentials(!!data && data.length > 0)
    } catch (error) {
      console.error('Error checking Zerodha credentials:', error)
    }
  }

  const checkICICICredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('icici_direct_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      setHasICICICredentials(!!data && data.length > 0)
    } catch (error) {
      console.error('Error checking ICICI Direct credentials:', error)
    }
  }

  const checkHDFCCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('hdfc_securities_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      setHasHDFCCredentials(!!data && data.length > 0)
    } catch (error) {
      console.error('Error checking HDFC Securities credentials:', error)
    }
  }

  const loadTradingMode = () => {
    const savedMode = localStorage.getItem('tradingMode') as 'paper' | 'alpaca-paper' | 'alpaca-live' | 'robinhood-crypto' | 'ibkr-paper' | 'ibkr-live' | 'zerodha-live' | 'icici-live' | 'hdfc-live'
    if (savedMode) {
      setTradingMode(savedMode)
    }
  }

  const handleModeChange = (mode: 'paper' | 'alpaca-paper' | 'alpaca-live' | 'robinhood-crypto' | 'ibkr-paper' | 'ibkr-live' | 'zerodha-live' | 'icici-live' | 'hdfc-live') => {
    setTradingMode(mode)
    localStorage.setItem('tradingMode', mode)
  }

  const connectedBrokersCount = [hasAlpacaCredentials, hasRobinhoodCredentials, hasIBKRCredentials, hasZerodhaCredentials, hasICICICredentials, hasHDFCCredentials].filter(Boolean).length

  const brokers = [
    {
      id: 'alpaca',
      name: 'Alpaca',
      tagline: 'Commission-Free Options Trading',
      description: 'Perfect for beginners and experienced traders. Start with paper trading, then switch to live when ready.',
      logo: '🦙',
      color: 'blue',
      isConnected: hasAlpacaCredentials,
      features: [
        { icon: Zap, text: 'Paper & Live Trading' },
        { icon: DollarSign, text: 'Zero Commission' },
        { icon: Activity, text: 'Real-time Market Data' },
        { icon: Shield, text: 'Options Trading Levels' }
      ],
      highlights: ['Best for: Learning & Testing', 'Markets: US Stocks & Options', 'Min Deposit: $0 (Paper), varies (Live)'],
      setupAction: () => {
        setExpandedBroker('alpaca')
        window.scrollTo({ top: document.getElementById('alpaca-section')?.offsetTop ?? 0, behavior: 'smooth' })
      },
      docsUrl: 'https://alpaca.markets/docs',
      popular: true
    },
    {
      id: 'zerodha',
      name: 'Zerodha Kite Connect',
      tagline: 'Indian Markets - NSE & BSE Options',
      description: 'Access Indian stock markets (NSE, BSE) with real-time options data. Perfect for trading NIFTY, BANKNIFTY, and Indian stocks.',
      logo: '🇮🇳',
      color: 'orange',
      isConnected: hasZerodhaCredentials,
      features: [
        { icon: Globe, text: 'NSE, BSE, NFO Markets' },
        { icon: Activity, text: 'Real-time Options Chain' },
        { icon: BarChart3, text: 'Advanced Analytics' },
        { icon: DollarSign, text: 'Low Brokerage Fees' }
      ],
      highlights: ['Best for: Indian Options Trading', 'Markets: NSE, BSE, NFO, BFO', 'Fee: ₹2,000 setup + ₹2,000/month'],
      setupAction: () => {
        setExpandedBroker('zerodha')
        window.scrollTo({ top: document.getElementById('zerodha-section')?.offsetTop ?? 0, behavior: 'smooth' })
      },
      docsUrl: 'https://kite.trade/docs/connect/v3/',
      popular: false
    },
    {
      id: 'icici',
      name: 'ICICI Direct',
      tagline: 'Breeze API - Indian Markets',
      description: 'Trade NSE, BSE, NFO with ICICI Direct\'s Breeze API. Access Indian stocks, options and futures with reliable execution.',
      logo: '🏦',
      color: 'orange',
      isConnected: hasICICICredentials,
      features: [
        { icon: Globe, text: 'NSE, BSE, NFO, MCX' },
        { icon: Activity, text: 'Real-time Data' },
        { icon: TrendingUp, text: 'Options & Futures' },
        { icon: Shield, text: 'Reliable Execution' }
      ],
      highlights: ['Best for: Indian Retail Traders', 'Markets: NSE, BSE, NFO, CDS, MCX', 'Brokerage: Competitive rates'],
      setupAction: () => {
        setExpandedBroker('icici')
        window.scrollTo({ top: document.getElementById('icici-section')?.offsetTop ?? 0, behavior: 'smooth' })
      },
      docsUrl: 'https://api.icicidirect.com/breezeconnect',
      popular: false
    },
    {
      id: 'hdfc',
      name: 'HDFC Securities',
      tagline: 'Official API - Indian Markets',
      description: 'Trade on NSE, BSE, NFO, MCX with HDFC Securities API. Advanced order types and comprehensive market access.',
      logo: '🏛️',
      color: 'blue',
      isConnected: hasHDFCCredentials,
      features: [
        { icon: Globe, text: 'NSE, BSE, NFO, MCX' },
        { icon: Activity, text: 'Advanced Orders' },
        { icon: BarChart3, text: 'Professional Tools' },
        { icon: Shield, text: 'Trusted Platform' }
      ],
      highlights: ['Best for: Active Indian Traders', 'Markets: NSE, BSE, NFO, MCX, CDS', 'Features: Cover orders, Bracket orders'],
      setupAction: () => {
        setExpandedBroker('hdfc')
        window.scrollTo({ top: document.getElementById('hdfc-section')?.offsetTop ?? 0, behavior: 'smooth' })
      },
      docsUrl: 'https://api.hdfcsec.com',
      popular: false
    },
    {
      id: 'ibkr',
      name: 'Interactive Brokers',
      tagline: 'Professional Global Trading',
      description: 'Advanced platform with access to 150+ markets worldwide. Professional tools and lowest margin rates.',
      logo: '🌐',
      color: 'indigo',
      isConnected: hasIBKRCredentials,
      features: [
        { icon: Globe, text: 'Global Markets Access' },
        { icon: BarChart3, text: 'Advanced Analytics' },
        { icon: Award, text: 'Low Trading Fees' },
        { icon: Users, text: 'Professional Tools' }
      ],
      highlights: ['Best for: Professional Traders', 'Markets: 150+ Global Exchanges', 'Min Deposit: $0 (Paper), $0 (Live)'],
      setupAction: () => {
        setExpandedBroker('ibkr')
        window.scrollTo({ top: document.getElementById('ibkr-section')?.offsetTop ?? 0, behavior: 'smooth' })
      },
      docsUrl: 'https://www.interactivebrokers.com/en/trading/ib-api.php',
      popular: false
    },
    {
      id: 'robinhood',
      name: 'Robinhood Crypto',
      tagline: '24/7 Cryptocurrency Trading',
      description: 'Trade Bitcoin, Ethereum, and other cryptocurrencies around the clock. Simple interface, zero commission.',
      logo: '🏹',
      color: 'green',
      isConnected: hasRobinhoodCredentials,
      features: [
        { icon: Clock, text: '24/7 Trading' },
        { icon: DollarSign, text: 'Zero Commission' },
        { icon: Zap, text: 'Instant Execution' },
        { icon: Activity, text: 'Real-time Prices' }
      ],
      highlights: ['Best for: Crypto Trading', 'Markets: Cryptocurrency Only', 'Note: Live Trading Only (No Paper)'],
      setupAction: () => {
        setExpandedBroker('robinhood')
        window.scrollTo({ top: document.getElementById('robinhood-section')?.offsetTop ?? 0, behavior: 'smooth' })
      },
      docsUrl: 'https://robinhood.com/crypto',
      popular: false
    }
  ]

  const connectedBrokers = brokers.filter(b => b.isConnected)
  const availableBrokers = brokers.filter(b => !b.isConnected)

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/10"></div>

        <div className="relative p-8 md:p-12">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[280px]">
              <div className="inline-flex items-center space-x-3 mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <LinkIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Broker Connections</h1>
                  <p className="text-blue-100 text-lg mt-1">Connect. Trade. Succeed.</p>
                </div>
              </div>

              <p className="text-white/90 text-lg mb-6 max-w-2xl">
                Link your brokerage accounts to access real markets. Start with simulated paper trading,
                then transition to live trading when you're ready.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 inline-flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">Bank-Level Encryption</span>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 inline-flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">Your Data, Your Control</span>
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 min-w-[240px]">
              <div className="text-center">
                <div className="text-5xl font-bold text-white mb-2">{connectedBrokersCount}/6</div>
                <div className="text-white/80 text-sm">Brokers Connected</div>
              </div>

              {connectedBrokersCount > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span className="text-white text-sm">Ready to Trade</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats / Status */}
      {connectedBrokersCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {connectedBrokers.map(broker => (
            <div key={broker.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{broker.logo}</span>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    <span>Active</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{broker.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{broker.tagline}</p>
                <button
                  onClick={broker.setupAction}
                  className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center"
                >
                  Manage Connection
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trading Mode Toggle */}
      {(hasAlpacaCredentials || hasRobinhoodCredentials || hasIBKRCredentials) && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-green-600" />
                Trading Mode
              </h3>
              <div className="text-sm text-gray-600">
                Switch between environments
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Always start with paper trading to test your strategies risk-free before using real money.
              </p>
            </div>
            <TradingModeToggle
              currentMode={tradingMode}
              onModeChange={handleModeChange}
            />
          </div>
        </div>
      )}

      {/* Account Dashboard */}
      {hasAlpacaCredentials && (tradingMode === 'alpaca-paper' || tradingMode === 'alpaca-live') && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-gray-900">🦙 Alpaca Account Status</h3>
          </div>
          <div className="card-body">
            <AlpacaAccountDashboard
              environment={tradingMode === 'alpaca-live' ? 'live' : 'paper'}
            />
          </div>
        </div>
      )}

      {/* Comparison Guide - Show when no brokers connected */}
      {connectedBrokersCount === 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-gray-900">Choose Your Broker</h3>
            <p className="text-sm text-gray-600 mt-1">Compare features to find the best fit for your trading style</p>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">🦙</span>
                        <span>Alpaca</span>
                        <span className="text-xs font-normal text-blue-600 mt-1">US MARKETS</span>
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">🇮🇳</span>
                        <span>Zerodha</span>
                        <span className="text-xs font-normal text-orange-600 mt-1">INDIAN MARKETS</span>
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">🌐</span>
                        <span>IBKR</span>
                        <span className="text-xs font-normal text-indigo-600 mt-1">GLOBAL</span>
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">🏹</span>
                        <span>Robinhood</span>
                        <span className="text-xs font-normal text-green-600 mt-1">CRYPTO</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Paper Trading', alpaca: '✅', zerodha: '❌', ibkr: '✅', robinhood: '❌' },
                    { label: 'Live Trading', alpaca: '✅', zerodha: '✅', ibkr: '✅', robinhood: '✅' },
                    { label: 'Options Trading', alpaca: '✅', zerodha: '✅', ibkr: '✅', robinhood: '❌' },
                    { label: 'Crypto Trading', alpaca: '❌', zerodha: '❌', ibkr: '❌', robinhood: '✅' },
                    { label: 'Markets', alpaca: 'US', zerodha: 'India', ibkr: '150+', robinhood: 'US' },
                    { label: 'Commission', alpaca: '$0', zerodha: '₹20/order', ibkr: 'Low fees', robinhood: '$0' },
                    { label: 'Best For', alpaca: 'Beginners', zerodha: 'Indian Traders', ibkr: 'Professionals', robinhood: 'Crypto' }
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{row.label}</td>
                      <td className="py-3 px-4 text-center text-sm">{row.alpaca}</td>
                      <td className="py-3 px-4 text-center text-sm">{row.zerodha}</td>
                      <td className="py-3 px-4 text-center text-sm">{row.ibkr}</td>
                      <td className="py-3 px-4 text-center text-sm">{row.robinhood}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-1">New to trading?</p>
                  <p className="text-sm text-yellow-800">
                    Start with <strong>Alpaca Paper Trading</strong> - it's free, risk-free, and perfect for learning.
                    You can always connect additional brokers later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Brokers Section */}
      {availableBrokers.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-gray-900">Available Brokers</h3>
            <p className="text-sm text-gray-600 mt-1">Connect to start trading</p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {availableBrokers.map(broker => (
                <div
                  key={broker.id}
                  className={`relative group border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                    broker.popular
                      ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={broker.setupAction}
                >
                  {broker.popular && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        POPULAR
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{broker.logo}</span>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-1">{broker.name}</h4>
                  <p className="text-sm font-medium text-gray-700 mb-3">{broker.tagline}</p>
                  <p className="text-sm text-gray-600 mb-4 min-h-[60px]">{broker.description}</p>

                  <div className="space-y-2 mb-4">
                    {broker.features.map((feature, idx) => {
                      const Icon = feature.icon
                      return (
                        <div key={idx} className="flex items-center text-sm text-gray-700">
                          <Icon className="h-4 w-4 mr-2 text-blue-600" />
                          {feature.text}
                        </div>
                      )
                    })}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4 space-y-1">
                    {broker.highlights.map((highlight, idx) => (
                      <div key={idx} className="text-xs text-gray-600">
                        • {highlight}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      broker.setupAction()
                    }}
                    className={`w-full mt-4 px-4 py-3 rounded-lg font-semibold transition-all ${
                      broker.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Connect {broker.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Broker Connection Sections */}
      <div id="alpaca-section" className={`card transition-all duration-300 ${expandedBroker === 'alpaca' ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-3xl mr-3">🦙</span>
              Alpaca
              {hasAlpacaCredentials && (
                <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </span>
              )}
            </h3>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-800 font-medium mb-1">About Alpaca</p>
                <p className="text-sm text-gray-700">
                  Commission-free trading platform perfect for learning. Practice with paper trading using simulated money,
                  then switch to live trading when you're confident.
                </p>
                <a
                  href="https://alpaca.markets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                >
                  Visit Alpaca Website
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>

            <AlpacaCredentialsAccordion
              onSetupComplete={() => {
                checkAlpacaCredentials()
                setExpandedBroker(null)
              }}
              onLaunchWizard={() => setShowAlpacaWizard(true)}
            />
          </div>
        </div>
      </div>

      <div id="zerodha-section" className={`card transition-all duration-300 ${expandedBroker === 'zerodha' ? 'ring-2 ring-orange-500' : ''}`}>
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-3xl mr-3">🇮🇳</span>
              Zerodha Kite Connect
              {hasZerodhaCredentials && (
                <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </span>
              )}
            </h3>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
              <Info className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-800 font-medium mb-1">About Zerodha Kite Connect</p>
                <p className="text-sm text-gray-700">
                  Access real-time data from Indian markets (NSE, BSE). Trade NIFTY, BANKNIFTY, FINNIFTY options with live market data.
                  Requires Kite Connect API subscription (₹2,000 setup + ₹2,000/month).
                </p>
                <a
                  href="https://kite.trade/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium mt-2"
                >
                  Visit Kite Connect
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowZerodhaWizard(true)}
              className="w-full btn btn-primary bg-orange-600 hover:bg-orange-700"
            >
              {hasZerodhaCredentials ? 'Update Connection' : 'Setup Zerodha Kite'}
            </button>
          </div>
        </div>
      </div>

      <div id="icici-section" className={`card transition-all duration-300 ${expandedBroker === 'icici' ? 'ring-2 ring-orange-500' : ''}`}>
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-3xl mr-3">🏦</span>
              ICICI Direct
              {hasICICICredentials && (
                <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </span>
              )}
            </h3>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
              <Info className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-800 font-medium mb-1">About ICICI Direct Breeze API</p>
                <p className="text-sm text-gray-700">
                  Trade on NSE, BSE, NFO, CDS, and MCX with ICICI Direct's Breeze API. Access Indian stocks,
                  options and futures with competitive brokerage and reliable execution.
                </p>
                <a
                  href="https://api.icicidirect.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium mt-2"
                >
                  Visit ICICI Direct API Portal
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowIndianBrokersWizard(true)}
              className="w-full btn btn-primary bg-orange-600 hover:bg-orange-700"
            >
              {hasICICICredentials ? 'Update Connection' : 'Setup ICICI Direct'}
            </button>
          </div>
        </div>
      </div>

      <div id="hdfc-section" className={`card transition-all duration-300 ${expandedBroker === 'hdfc' ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-3xl mr-3">🏛️</span>
              HDFC Securities
              {hasHDFCCredentials && (
                <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </span>
              )}
            </h3>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-800 font-medium mb-1">About HDFC Securities API</p>
                <p className="text-sm text-gray-700">
                  Access NSE, BSE, NFO, MCX, and CDS markets with HDFC Securities API. Advanced order types
                  including Cover Orders and Bracket Orders for sophisticated trading strategies.
                </p>
                <a
                  href="https://api.hdfcsec.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                >
                  Visit HDFC Securities API Portal
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowIndianBrokersWizard(true)}
              className="w-full btn btn-primary"
            >
              {hasHDFCCredentials ? 'Update Connection' : 'Setup HDFC Securities'}
            </button>
          </div>
        </div>
      </div>

      <div id="ibkr-section" className={`card transition-all duration-300 ${expandedBroker === 'ibkr' ? 'ring-2 ring-indigo-500' : ''}`}>
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-3xl mr-3">🌐</span>
              Interactive Brokers
              {hasIBKRCredentials && (
                <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </span>
              )}
            </h3>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-indigo-50 rounded-lg">
              <Info className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-800 font-medium mb-1">About Interactive Brokers</p>
                <p className="text-sm text-gray-700">
                  Professional trading platform with access to 150+ global markets. Requires Client Portal Gateway
                  to be installed and running on your computer.
                </p>
                <a
                  href="https://www.interactivebrokers.com/en/trading/ib-api.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-2"
                >
                  Download Client Portal Gateway
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowIBKRWizard(true)}
              className="w-full btn btn-primary"
            >
              {hasIBKRCredentials ? 'Update Connection' : 'Setup Interactive Brokers'}
            </button>
          </div>
        </div>
      </div>

      <div id="robinhood-section" className={`card transition-all duration-300 ${expandedBroker === 'robinhood' ? 'ring-2 ring-green-500' : ''}`}>
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-3xl mr-3">🏹</span>
              Robinhood Crypto
              {hasRobinhoodCredentials && (
                <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </span>
              )}
            </h3>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <Info className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-800 font-medium mb-1">About Robinhood Crypto</p>
                <p className="text-sm text-gray-700">
                  Trade cryptocurrencies 24/7. Note: Robinhood Crypto only supports live trading with real money.
                  There is no paper trading environment for crypto.
                </p>
                <a
                  href="https://robinhood.com/crypto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium mt-2"
                >
                  Learn about Robinhood Crypto
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowRobinhoodWizard(true)}
              className="w-full btn btn-primary bg-green-600 hover:bg-green-700"
            >
              {hasRobinhoodCredentials ? 'Update Connection' : 'Setup Robinhood Crypto'}
            </button>
          </div>
        </div>
      </div>

      {/* Security & Help Section - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              Security & Privacy
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {[
                { title: 'AES-256 Encryption', desc: 'Bank-level security for all credentials' },
                { title: 'Row Level Security', desc: 'Your data is completely isolated' },
                { title: 'No Withdrawal Access', desc: 'We never request withdrawal permissions' },
                { title: 'Complete Audit Trail', desc: 'Every action is logged and traceable' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
          </div>
          <div className="card-body">
            <div className="space-y-2">
              {[
                { title: 'Alpaca Setup Guide', url: 'https://alpaca.markets/docs/trading/getting-started/' },
                { title: 'IBKR API Documentation', url: 'https://www.interactivebrokers.com/en/trading/ib-api.php' },
                { title: 'Robinhood Crypto Guide', url: 'https://robinhood.com/us/en/support/articles/cryptocurrency/' },
                { title: 'Trading Best Practices', url: '#' }
              ].map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-900">{link.title}</span>
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAlpacaWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <AlpacaSetupWizard
            onComplete={() => {
              setShowAlpacaWizard(false)
              checkAlpacaCredentials()
              alert('✅ Alpaca account connected successfully!')
            }}
            onCancel={() => setShowAlpacaWizard(false)}
          />
        </div>
      )}

      {showRobinhoodWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <RobinhoodSetupWizard
            onComplete={() => {
              setShowRobinhoodWizard(false)
              checkRobinhoodCredentials()
              alert('✅ Robinhood Crypto account connected successfully!')
            }}
            onCancel={() => setShowRobinhoodWizard(false)}
          />
        </div>
      )}

      {showIBKRWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <IBKRSetupWizard
            onComplete={() => {
              setShowIBKRWizard(false)
              checkIBKRCredentials()
              alert('✅ Interactive Brokers account connected successfully!')
            }}
            onCancel={() => setShowIBKRWizard(false)}
          />
        </div>
      )}

      {showZerodhaWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <ZerodhaSetupWizard
            onComplete={() => {
              setShowZerodhaWizard(false)
              checkZerodhaCredentials()
              alert('✅ Zerodha Kite Connect account connected successfully!')
            }}
            onCancel={() => setShowZerodhaWizard(false)}
          />
        </div>
      )}

      {showIndianBrokersWizard && (
        <IndianBrokersSetupWizard
          onClose={() => setShowIndianBrokersWizard(false)}
          onComplete={() => {
            setShowIndianBrokersWizard(false)
            checkICICICredentials()
            checkHDFCCredentials()
          }}
        />
      )}
    </div>
  )
}
