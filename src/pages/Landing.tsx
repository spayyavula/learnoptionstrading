import React, { useEffect, useRef } from 'react'
import {
  ArrowRight,
  TrendingUp,
  BookOpen,
  Users,
  Info,
  Shield,
  CheckCircle,
  Bot,
  Play,
  BarChart3,
  Target,
  Mail,
  Star,
  AlertTriangle,
  LineChart,
  Brain,
  Zap,
  Activity,
  MessageSquare,
  TrendingDown,
  Calculator,
  Eye,
  Sparkles
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import SeoHelmet from '../components/SeoHelmet'


const SYMBOL = 'SPY'; // Change to your desired symbol

// Replace with your actual Polygon API key or use an environment variable
const POLYGON_API_KEY = import.meta.env.VITE_POLYGON_API_KEY || '';

function isMarketOpen() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  // Market open Mon-Fri, 9:30am-4pm ET (adjust as needed)
  return day > 0 && day < 6 && (hour > 9 || (hour === 9 && now.getMinutes() >= 30)) && hour < 16;
}

export function LivePrice() {
  const [price, setPrice] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    async function fetchInitialPrice() {
      setLoading(true);
      try {
        // Try real-time endpoint first
        let resp = await fetch(
          `https://api.polygon.io/v2/last/trade/stocks/${SYMBOL}?apiKey=${POLYGON_API_KEY}`
        );
        if (resp.ok) {
          const data = await resp.json();
          if (data?.results?.p) {
            setPrice(data.results.p);
            setLoading(false);
            return;
          }
        }
        // Fallback to previous close
        resp = await fetch(
          `https://api.polygon.io/v2/aggs/ticker/${SYMBOL}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
        );
        const data = await resp.json();
        setPrice(data?.results?.[0]?.c || null);
      } catch {
        setPrice(null);
      }
      setLoading(false);
    }

    // Simulate a small random price change (0% to 0.4% up or down)
    function simulatePriceChange(current: number) {
      const percentChange = (Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1); // -0.4% to +0.4%
      const newPrice = current + (current * percentChange / 100);
      return Number(newPrice.toFixed(2));
    }

    if (isMarketOpen()) {
      fetchInitialPrice();
      interval = globalThis.setInterval(() => {
        setPrice(prev => {
          if (prev === null) return prev;
          return simulatePriceChange(prev);
        });
      }, 10000); // update every 10s
    }

    return () => {
      if (interval) globalThis.clearInterval(interval);
    };
  }, []);

  if (!isMarketOpen()) return null;

  return (
    <div className="text-sm text-green-700 font-semibold mt-2">
      {loading
        ? 'Loading price...'
        : price !== null
          ? `SPY: $${price}`
          : 'Price unavailable'}
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth()
  const indicesTickerRef = useRef<HTMLDivElement>(null);
  const stocksTickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Indices ticker
    if (indicesTickerRef.current && !indicesTickerRef.current.querySelector('iframe')) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "proName": "INDEX:SPX", "title": "S&P 500" },
          { "proName": "INDEX:IXIC", "title": "NASDAQ" },
          { "proName": "INDEX:DJI", "title": "Dow 30" },
          { "proName": "INDEX:RUT", "title": "Russell 2000" }
        ],
        "colorTheme": "light",
        "isTransparent": true,
        "displayMode": "adaptive",
        "locale": "en"
      });
      indicesTickerRef.current.appendChild(script);
    }
    // Stocks ticker
    if (stocksTickerRef.current && !stocksTickerRef.current.querySelector('iframe')) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "proName": "NASDAQ:AAPL", "title": "Apple" },
          { "proName": "NASDAQ:MSFT", "title": "Microsoft" },
          { "proName": "NASDAQ:TSLA", "title": "Tesla" },
          { "proName": "NASDAQ:NVDA", "title": "Nvidia" },
          { "proName": "NASDAQ:AMZN", "title": "Amazon" },
          { "proName": "NASDAQ:QQQ", "title": "QQQ" },
          { "proName": "AMEX:SPY", "title": "SPY" }
        ],
        "colorTheme": "light",
        "isTransparent": true,
        "displayMode": "adaptive",
        "locale": "en"
      });
      stocksTickerRef.current.appendChild(script);
    }
  }, []);

  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/app')
    } else {
      navigate('/signup')
    }
  }
  return (
    <>
      <SeoHelmet
        title="Options Trading Platform - Real-Time Analytics, AI Insights & Multi-Leg Strategies | 6 Months Free"
        description="Professional-grade options trading platform with real-time market data, AI sentiment analysis, multi-leg strategy builder, Greeks calculator, market regime detection, event-driven pricing, and 50+ educational modules. Get 6 months free to master options trading. Live trading with Alpaca Markets launching November 2025 - fully configured with paper trading audit logs, then seamless transition to real money trading."
        keywords="options trading platform, real-time options data, options Greeks calculator, multi-leg options strategies, options sentiment analysis, Black-Scholes calculator, market regime analysis, options education, paper trading, options chain, implied volatility, FinBERT sentiment, options analytics, free options platform, event-driven options, earnings options, FOMC trading, Alpaca trading, Alpaca Markets, commission-free options, live trading November 2025"
        type="website"
      />
      <div className="min-h-screen bg-white">
      {/* Free Trial Banner */}
      <div className="bg-green-600 text-white py-3 px-4 text-center text-sm font-bold">
        🎉 GET 6 MONTHS FREE! Full Access to All Features. Start Learning Now! 🎉
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img src="/logo-dark.svg" alt="Options Academy" className="h-10 md:h-12" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-blue-200">
                    Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}!
                  </span>
                  <Link
                    to="/app"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Go to App
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-white hover:text-blue-200 font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Start Free Trial
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6">
              <img src="/logo.svg" alt="Options Academy" className="h-20 md:h-28 mx-auto mb-6" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Master Options Trading with Pro-Level Tools.
              <span className="block text-green-400">Get 6 Months Free Access!</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Advanced options analytics platform with real-time market data, <span className="font-bold text-yellow-300">50+ pre-built strategy templates</span>, sentiment analysis, multi-leg strategies,
              Greeks tracking, and AI-powered insights. Practice with virtual money before risking real capital.
            </p>
            <div className="bg-gradient-to-r from-green-600/40 to-emerald-600/40 border-4 border-green-400 rounded-2xl p-8 max-w-5xl mx-auto mb-8 shadow-2xl backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center text-green-50 mb-4">
                  <Sparkles className="h-8 w-8 mr-3 animate-pulse" />
                  <span className="font-black text-2xl md:text-4xl">🎯 Live Trading - November 2025</span>
                  <Sparkles className="h-8 w-8 ml-3 animate-pulse" />
                </div>
                <p className="text-green-100 text-xl md:text-2xl font-bold mb-2">
                  Dual Broker Integration: Alpaca Markets & Interactive Brokers
                </p>
                <p className="text-green-200 text-lg mb-6 max-w-3xl text-center">
                  Choose your preferred broker - we've integrated with both Alpaca Markets (US commission-free) and Interactive Brokers (global access to 150+ markets). Practice with our simulator now, then seamlessly switch to live trading when you're ready.
                </p>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border-2 border-green-300 max-w-3xl">
                  <h3 className="text-green-100 font-bold text-xl mb-4 text-center">🚀 Phased Rollout for Your Safety</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-500/20 rounded-lg p-4 border border-green-300">
                      <div className="flex items-center mb-2">
                        <Shield className="h-6 w-6 text-green-200 mr-2" />
                        <h4 className="font-bold text-green-100">Phase 1: Paper Trading</h4>
                      </div>
                      <ul className="text-sm text-green-200 space-y-1">
                        <li>• Practice with virtual money</li>
                        <li>• Full audit log of all trades</li>
                        <li>• Test strategies risk-free</li>
                        <li>• Learn both broker interfaces</li>
                      </ul>
                    </div>
                    <div className="bg-green-500/20 rounded-lg p-4 border border-green-300">
                      <div className="flex items-center mb-2">
                        <Target className="h-6 w-6 text-green-200 mr-2" />
                        <h4 className="font-bold text-green-100">Phase 2: Live Trading</h4>
                      </div>
                      <ul className="text-sm text-green-200 space-y-1">
                        <li>• Choose Alpaca or IBKR</li>
                        <li>• Real money options execution</li>
                        <li>• Full compliance & security</li>
                        <li>• Low-cost trading access</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl mb-4">
                  <div className="bg-green-100/20 backdrop-blur-sm border-2 border-green-300 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-green-100 mb-1">2</div>
                    <div className="text-xs font-bold text-green-100">Brokers</div>
                    <div className="text-xs text-green-200">Alpaca + IBKR</div>
                  </div>
                  <div className="bg-green-100/20 backdrop-blur-sm border-2 border-green-300 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-green-100 mb-1">🔒</div>
                    <div className="text-xs font-bold text-green-100">AES-256</div>
                    <div className="text-xs text-green-200">Encrypted Keys</div>
                  </div>
                  <div className="bg-green-100/20 backdrop-blur-sm border-2 border-green-300 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-green-100 mb-1">150+</div>
                    <div className="text-xs font-bold text-green-100">Markets</div>
                    <div className="text-xs text-green-200">Global Access</div>
                  </div>
                  <div className="bg-green-100/20 backdrop-blur-sm border-2 border-green-300 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-green-100 mb-1">✓</div>
                    <div className="text-xs font-bold text-green-100">Battle-Tested</div>
                    <div className="text-xs text-green-200">Fully Configured</div>
                  </div>
                </div>

                <div className="bg-yellow-400/20 backdrop-blur-sm border-2 border-yellow-300 rounded-lg p-4 max-w-2xl">
                  <p className="text-yellow-100 text-sm text-center">
                    <strong>Smart Transition:</strong> Start with paper trading to master the platform. When you're confident, choose Alpaca (US commission-free) or Interactive Brokers (global multi-asset) and switch to live trading. Same interface, same strategies, real money.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center mx-auto"
            >
              {user ? 'Go to App' : 'Start 6-Month Free Trial'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
          
        </div>
      </section>

      {/* Multi-Broker Support - 6 Brokers */}
      <section className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-bold text-sm mb-4 shadow-lg">
              🎯 6 BROKER INTEGRATIONS • US, CRYPTO & INDIAN MARKETS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trade Globally with Multiple Brokers
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Seamlessly switch between US stocks, cryptocurrency, and Indian markets. Choose your preferred broker for each market - Alpaca, IBKR, Robinhood, Zerodha, ICICI Direct, or HDFC Securities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* US Markets - Alpaca */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-blue-500 hover:shadow-3xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">US Markets</h3>
                    <p className="text-sm text-gray-600">NYSE • NASDAQ • AMEX</p>
                  </div>
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-300">
                  NOV 2025
                </div>
              </div>

              {/* Alpaca Logo Placeholder */}
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-6 mb-6 border-2 border-blue-300">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-black text-blue-900 mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      ALPACA
                    </div>
                    <p className="text-sm text-blue-700 font-semibold">Commission-Free Trading API</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">S&P 500, NASDAQ stocks & options</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">SPY, QQQ, IWM options chains</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Real-time market data via Polygon.io</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Extended hours trading support</span>
                </li>
              </ul>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Sparkles className="h-5 w-5 text-orange-600 mr-2 animate-pulse" />
                  <span className="font-bold text-orange-900">Coming November 2025!</span>
                </div>
                <p className="text-sm text-orange-800">
                  Trade US stocks and options through Alpaca Markets. Zero commissions, instant fills, and institutional-grade infrastructure for seamless execution.
                </p>
              </div>
            </div>

            {/* US Markets - Interactive Brokers */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-purple-500 hover:shadow-3xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Global Access</h3>
                    <p className="text-sm text-gray-600">150+ Markets Worldwide</p>
                  </div>
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-300">
                  NOV 2025
                </div>
              </div>

              {/* IBKR Logo Placeholder */}
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-6 mb-6 border-2 border-purple-300">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-black text-purple-900 mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      INTERACTIVE
                    </div>
                    <div className="text-4xl font-black text-indigo-900 mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      BROKERS
                    </div>
                    <p className="text-sm text-purple-700 font-semibold">Professional Trading Platform</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">150+ markets in 33 countries</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Stocks, options, futures, forex & bonds</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Institutional-grade execution</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Low commissions & tight spreads</span>
                </li>
              </ul>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-400 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600 mr-2 animate-pulse" />
                  <span className="font-bold text-purple-900">Coming November 2025!</span>
                </div>
                <p className="text-sm text-purple-800">
                  Trade globally with IBKR's award-winning platform. Access international options markets with professional tools and deep liquidity.
                </p>
              </div>
            </div>

            {/* Indian Markets - Zerodha */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-orange-500 hover:shadow-3xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Indian Markets 🇮🇳</h3>
                    <p className="text-sm text-gray-600">NSE • BSE</p>
                  </div>
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-300">
                  NOV 2025
                </div>
              </div>

              {/* Zerodha Logo Placeholder */}
              <div className="bg-gradient-to-r from-orange-100 via-white to-green-100 rounded-xl p-6 mb-6 border-2 border-orange-300">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-black mb-2" style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      background: 'linear-gradient(135deg, #ff6600 0%, #0066cc 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Zerodha
                    </div>
                    <p className="text-sm text-gray-700 font-semibold">India's Largest Broker • Kite Connect</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="font-medium">NIFTY, BANKNIFTY, FINNIFTY options</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="font-medium">NSE/BSE stocks (Reliance, TCS, Infy)</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="font-medium">Real-time Indian market data</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="font-medium">Indian Greeks & NSE lot sizes</span>
                </li>
              </ul>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Sparkles className="h-5 w-5 text-orange-600 mr-2 animate-pulse" />
                  <span className="font-bold text-orange-900">Coming November 2025!</span>
                </div>
                <p className="text-sm text-orange-800">
                  Trade Indian options through Zerodha's Kite Connect API. Access NIFTY, BANKNIFTY options with real-time data and seamless execution.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: New Broker Integrations - Coming Nov 2025 */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Robinhood Crypto */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-green-500 hover:shadow-3xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">US Crypto 🪙</h3>
                    <p className="text-sm text-gray-600">Bitcoin • Ethereum • Altcoins</p>
                  </div>
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-300">
                  NOV 2025
                </div>
              </div>

              {/* Robinhood Logo Placeholder */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 mb-6 border-2 border-green-300">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-black mb-2" style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      background: 'linear-gradient(135deg, #00C805 0%, #00E676 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Robinhood
                    </div>
                    <p className="text-sm text-green-700 font-semibold">Crypto Trading • Commission-Free</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Bitcoin (BTC), Ethereum (ETH)</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Dogecoin, Shiba Inu, Litecoin</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Real-time crypto price tracking</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Commission-free crypto trading</span>
                </li>
              </ul>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Sparkles className="h-5 w-5 text-orange-600 mr-2 animate-pulse" />
                  <span className="font-bold text-orange-900">Coming November 2025!</span>
                </div>
                <p className="text-sm text-orange-800">
                  Trade cryptocurrency through Robinhood's commission-free platform. Diversify beyond stocks and options with Bitcoin, Ethereum, and popular altcoins.
                </p>
              </div>
            </div>

            {/* ICICI Direct - Indian Markets */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-indigo-500 hover:shadow-3xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">ICICI Direct 🇮🇳</h3>
                    <p className="text-sm text-gray-600">NSE • BSE • NFO</p>
                  </div>
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-300">
                  NOV 2025
                </div>
              </div>

              {/* ICICI Logo Placeholder */}
              <div className="bg-gradient-to-r from-indigo-100 to-blue-100 rounded-xl p-6 mb-6 border-2 border-indigo-300">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-black text-indigo-900 mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      ICICI Direct
                    </div>
                    <p className="text-sm text-indigo-700 font-semibold">Breeze API • Indian Markets</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">NIFTY, BANKNIFTY options (NFO)</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">NSE/BSE stocks & derivatives</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">MCX commodities (Gold, Silver)</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Real-time Indian market data</span>
                </li>
              </ul>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Sparkles className="h-5 w-5 text-orange-600 mr-2 animate-pulse" />
                  <span className="font-bold text-orange-900">Coming November 2025!</span>
                </div>
                <p className="text-sm text-orange-800">
                  Full Indian market access via ICICI Direct's Breeze API. Trade NIFTY options, stocks, futures, and commodities with real-time data.
                </p>
              </div>
            </div>

            {/* HDFC Securities - Indian Markets */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-red-500 hover:shadow-3xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">HDFC Securities 🇮🇳</h3>
                    <p className="text-sm text-gray-600">NSE • BSE • MCX</p>
                  </div>
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-300">
                  NOV 2025
                </div>
              </div>

              {/* HDFC Logo Placeholder */}
              <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-xl p-6 mb-6 border-2 border-red-300">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-black text-red-900 mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      HDFC Securities
                    </div>
                    <p className="text-sm text-red-700 font-semibold">3-in-1 Account • Advanced Features</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Advanced order types (BO, CO)</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">After Market Orders (AMO)</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">Indian options with Greeks</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">3-in-1 integrated banking</span>
                </li>
              </ul>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Sparkles className="h-5 w-5 text-orange-600 mr-2 animate-pulse" />
                  <span className="font-bold text-orange-900">Coming November 2025!</span>
                </div>
                <p className="text-sm text-orange-800">
                  Trade Indian markets with HDFC Securities' advanced platform. Bracket orders, cover orders, and AMO support for sophisticated trading strategies.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Start Practicing Today - Trade Live in November 2025
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Master options trading with paper trading now. When live trading launches in November 2025, seamlessly connect your preferred broker: Alpaca, Interactive Brokers, Robinhood Crypto, Zerodha, ICICI Direct, or HDFC Securities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/optionschain">
                <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                  🇺🇸 View US Options Chain
                </button>
              </Link>
              <Link to="/coming-soon">
                <button className="bg-gradient-to-r from-orange-600 to-green-600 hover:from-orange-700 hover:to-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                  🇮🇳 Indian Trading - Coming Soon
                </button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              No login required • Switch markets anytime • 6 months free trial
            </p>
          </div>
        </div>
      </section>

      {/* Coming Soon - Prediction Markets */}
      <section className="py-16 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-full font-bold text-sm mb-4 shadow-lg animate-pulse">
              🚀 COMING SOON • DECEMBER 2025
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trade the Future with <span className="text-green-600">Prediction Markets</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              FinFeed multi-source integration - bet on real-world events, elections, economic data, and market outcomes across multiple platforms
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-4 border-green-500 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <TrendingUp className="h-16 w-16 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl font-black text-green-600" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    FinFeed
                  </div>
                </div>
                <p className="text-lg text-gray-700 font-semibold mb-4">
                  Multi-Source Prediction Markets • 5+ Platforms
                </p>

                <div className="grid md:grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="font-medium">Polymarket - Crypto predictions</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="font-medium">Manifold - Play-money markets</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="font-medium">Metaculus - Forecasting platform</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="font-medium">PredictIt - Political markets</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="font-medium">Elections, economics, tech & more</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="font-medium">Sports, entertainment & crypto</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4">
                  <p className="text-sm text-green-900 font-semibold mb-2">
                    🎯 Why FinFeed Multi-Source Integration?
                  </p>
                  <p className="text-sm text-green-800">
                    Access prediction markets from Polymarket, Manifold, Metaculus, PredictIt, and more through a single unified interface. Trade binary outcome contracts on elections, economics, crypto, sports, and tech events. Compare prices across platforms and diversify your prediction market portfolio.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">5+</div>
                  <div className="text-gray-600 text-sm">Prediction Market Sources</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-600 mb-2">1000+</div>
                  <div className="text-gray-600 text-sm">Markets to Trade</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600 mb-2">Unified</div>
                  <div className="text-gray-600 text-sm">Single Interface</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              🔔 <strong>Be the first to know when prediction markets go live!</strong>
            </p>
            <Link to="/app/settings">
              <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                Get Notified • December 2025
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Strategy Templates Section */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-2 rounded-full font-black text-sm mb-4 shadow-lg animate-pulse">
              🎯 NEW FEATURE • 50+ READY-TO-USE TEMPLATES
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Pre-Built Strategy Templates for
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                Every Market Condition
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium mb-8">
              Stop guessing. Start with proven strategies optimized for Bull, Bear, Neutral, and High Volatility markets.
              One-click deployment with pre-calculated Greeks, risk metrics, and breakeven analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {/* Bull Market Strategies */}
            <div className="bg-white/10 backdrop-blur-lg border-2 border-green-400 rounded-2xl p-6 hover:bg-white/20 transition-all hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mr-3">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-green-300">Bull Market</h3>
              </div>
              <div className="text-5xl font-black text-green-200 mb-2">15+</div>
              <p className="text-green-100 font-semibold mb-4">Strategies for Rising Markets</p>
              <ul className="space-y-2 text-sm text-gray-200">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                  <span>Bull Call Spreads</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                  <span>Synthetic Long Stock</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                  <span>Cash-Secured Puts</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                  <span>Diagonal Spreads</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                  <span>Covered Calls</span>
                </li>
              </ul>
            </div>

            {/* Bear Market Strategies */}
            <div className="bg-white/10 backdrop-blur-lg border-2 border-red-400 rounded-2xl p-6 hover:bg-white/20 transition-all hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl flex items-center justify-center mr-3">
                  <TrendingDown className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-red-300">Bear Market</h3>
              </div>
              <div className="text-5xl font-black text-red-200 mb-2">12+</div>
              <p className="text-red-100 font-semibold mb-4">Strategies for Falling Markets</p>
              <ul className="space-y-2 text-sm text-gray-200">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                  <span>Bear Put Spreads</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                  <span>Long Puts (Protective)</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                  <span>Bear Call Spreads</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                  <span>Ratio Put Spreads</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                  <span>Synthetic Short Stock</span>
                </li>
              </ul>
            </div>

            {/* Neutral Market Strategies */}
            <div className="bg-white/10 backdrop-blur-lg border-2 border-blue-400 rounded-2xl p-6 hover:bg-white/20 transition-all hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mr-3">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-blue-300">Neutral</h3>
              </div>
              <div className="text-5xl font-black text-blue-200 mb-2">16+</div>
              <p className="text-blue-100 font-semibold mb-4">Strategies for Sideways Markets</p>
              <ul className="space-y-2 text-sm text-gray-200">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                  <span>Iron Condors</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                  <span>Iron Butterflies</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                  <span>Calendar Spreads</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                  <span>Short Straddles/Strangles</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                  <span>Credit Spreads</span>
                </li>
              </ul>
            </div>

            {/* High Volatility Strategies */}
            <div className="bg-white/10 backdrop-blur-lg border-2 border-yellow-400 rounded-2xl p-6 hover:bg-white/20 transition-all hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mr-3">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-yellow-300">Volatility</h3>
              </div>
              <div className="text-5xl font-black text-yellow-200 mb-2">10+</div>
              <p className="text-yellow-100 font-semibold mb-4">Strategies for High IV Markets</p>
              <ul className="space-y-2 text-sm text-gray-200">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                  <span>Long Straddles</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                  <span>Long Strangles</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                  <span>Jade Lizards</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                  <span>Butterfly Spreads</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                  <span>Ratio Spreads</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Template Benefits */}
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-2 border-yellow-400 rounded-2xl p-8 backdrop-blur-lg">
            <h3 className="text-3xl font-black text-center mb-8 text-yellow-300">🚀 Why Use Strategy Templates?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-white">Save Hours of Setup Time</h4>
                <p className="text-gray-300">Pre-configured with optimal strike selections, expirations, and position sizing. Just select and deploy.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-white">Learn from Professionals</h4>
                <p className="text-gray-300">Each template includes detailed explanations, risk profiles, and market condition guidelines.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-white">Instant Risk Analysis</h4>
                <p className="text-gray-300">See max profit, max loss, breakeven points, and probability of profit before placing the trade.</p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link to="/app/strategy-templates">
                <button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 px-10 py-5 rounded-xl text-xl font-black shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
                  🎯 Browse All 50+ Strategy Templates
                </button>
              </Link>
              <p className="mt-4 text-sm text-gray-300">
                ✓ Included in 6-month free trial • No additional cost
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full font-bold text-sm mb-4 shadow-lg">
              ⚡ ALL FEATURES • 6 MONTHS FREE
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              Professional-Grade Trading Platform<br/>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                With Institutional-Level Tools
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              More than paper trading - a complete options analytics and education ecosystem with real-time data, AI insights, and advanced strategies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Real-Time Market Data */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-blue-200">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Real-Time Market Data</h3>
              <p className="text-gray-700 font-medium">
                Live options chains with Greeks, IV, volume, and OI via Polygon.io integration
              </p>
              <div className="mt-3 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-300">
                ✓ 6 Months Free
              </div>
            </div>

            {/* Multi-Leg Strategies */}
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">50+ Strategy Templates</h3>
              <p className="text-gray-700 font-medium">
                Pre-built strategies for Bull, Bear, Neutral & High Volatility markets with one-click deployment
              </p>
              <div className="mt-3 inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold border border-yellow-300">
                ✨ NEW FEATURE
              </div>
            </div>

            {/* Sentiment Analysis */}
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-green-200">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">AI Sentiment Analysis</h3>
              <p className="text-gray-700 font-medium">
                FinBERT-powered news sentiment, social media tracking, analyst ratings
              </p>
              <div className="mt-3 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-300">
                ✓ 6-Month Trial
              </div>
            </div>

            {/* Greeks & Analytics */}
            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-indigo-200">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Advanced Greeks Analytics</h3>
              <p className="text-gray-700 font-medium">
                Black-Scholes pricing, Greeks sensitivity analysis, portfolio Greeks aggregation
              </p>
              <div className="mt-3 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-300">
                ✓ No Cost
              </div>
            </div>

            {/* Market Regime Analysis */}
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-orange-200">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <LineChart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Market Regime Detection</h3>
              <p className="text-gray-700 font-medium">
                Identify bull, bear, high volatility markets with VIX tracking and regime shifts
              </p>
              <div className="mt-3 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-300">
                ✓ Included
              </div>
            </div>

            {/* Community & Sharing */}
            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-pink-200">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Community Integration</h3>
              <p className="text-gray-700 font-medium">
                Share trades to Slack, Discord, Telegram, WhatsApp, Facebook communities
              </p>
              <div className="mt-3 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-300">
                ✓ All Features
              </div>
            </div>

            {/* Trading Journal */}
            <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-teal-200">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Trading Journal & History</h3>
              <p className="text-gray-700 font-medium">
                Track every trade with notes, tags, P&L analysis, and performance metrics
              </p>
              <div className="mt-3 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-300">
                ✓ Unlimited
              </div>
            </div>

            {/* Event-Driven Strategies */}
            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-red-200">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Event-Adjusted Pricing</h3>
              <p className="text-gray-700 font-medium">
                Earnings, FOMC, economic events with volatility adjustments and IV crush modeling
              </p>
              <div className="mt-3 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-300">
                ✓ All Features Included
              </div>
            </div>

            {/* Educational Courses */}
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-yellow-200">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Comprehensive Education</h3>
              <p className="text-gray-700 font-medium">
                50+ modules covering basics to advanced: Greeks, spreads, volatility, risk management
              </p>
              <div className="mt-3 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-300">
                ✓ Full Access Included
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              More Than Paper Trading
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A comprehensive options analytics platform with institutional-grade tools
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Live Market Integration</h3>
                  <p className="text-gray-600">
                    Real-time options data via Polygon.io with full Greeks calculation, implied volatility tracking,
                    and Black-Scholes pricing. Not just static data - live updates during market hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Insights</h3>
                  <p className="text-gray-600">
                    FinBERT sentiment analysis on news and social media, analyst ratings aggregation,
                    and market regime detection using machine learning algorithms.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">50+ Pre-Built Strategy Templates</h3>
                  <p className="text-gray-600">
                    One-click deployment of proven strategies optimized for Bull, Bear, Neutral, and High Volatility markets.
                    Each template includes pre-calculated Greeks, risk metrics, and breakeven analysis. Stop guessing, start with proven setups.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl shadow-xl p-8">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 animate-pulse">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-900 mb-2">🚀 Live Trading - November 2025</h3>
                  <p className="text-orange-800 font-medium">
                    Execute real trades through your choice of Alpaca Markets or Interactive Brokers. Practice now with our simulator,
                    then seamlessly transition to live trading when ready. Dual broker integration gives you flexibility and global access.
                  </p>
                  <div className="mt-3 bg-orange-100 border border-orange-300 rounded-lg p-3">
                    <p className="text-sm text-orange-900 font-semibold">✓ Choose Alpaca (US commission-free) or IBKR (150+ markets)</p>
                    <p className="text-sm text-orange-900 font-semibold">✓ Seamless transition from paper to live</p>
                    <p className="text-sm text-orange-900 font-semibold">✓ Same familiar interface you know</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Trusted by Thousands of Traders</h2>
            <p className="text-xl text-blue-100">Join a growing community mastering options trading</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:bg-white/20 transition-all">
              <div className="text-5xl font-black mb-2">10,000+</div>
              <div className="text-blue-100 font-semibold text-lg">Active Traders</div>
              <div className="text-blue-200 text-sm mt-2">Growing Daily</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:bg-white/20 transition-all">
              <div className="text-5xl font-black mb-2">50+</div>
              <div className="text-blue-100 font-semibold text-lg">Strategy Templates</div>
              <div className="text-blue-200 text-sm mt-2">Bull • Bear • Neutral • Volatility</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:bg-white/20 transition-all">
              <div className="text-5xl font-black mb-2">1M+</div>
              <div className="text-blue-100 font-semibold text-lg">Paper Trades Executed</div>
              <div className="text-blue-200 text-sm mt-2">Risk-Free Practice</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:bg-white/20 transition-all">
              <div className="text-5xl font-black mb-2">100%</div>
              <div className="text-blue-100 font-semibold text-lg">6 Months Free</div>
              <div className="text-blue-200 text-sm mt-2">No Hidden Costs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Trial CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Launch Your Trading Journey Today
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get 6 months of full access to master options trading. All features included!
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-2xl font-bold text-green-800">6 Months Free Trial</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-left text-green-700">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>Real-time options chains with live Greeks</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>50+ strategy templates (Bull, Bear, Neutral, Volatility)</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>AI-powered sentiment analysis (FinBERT)</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>Black-Scholes pricing & Greeks calculator</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>Market regime analysis & VIX tracking</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>Event-driven strategies (earnings, FOMC)</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>Trading journal with P&L analytics</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>Community sharing (5 platforms)</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>50+ educational modules & courses</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>Portfolio Greeks aggregation</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>No hidden fees, no upgrades, no limits</span>
              </li>
            </div>
          </div>
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center mx-auto"
          >
            {user ? 'Go to App' : 'Start Your Free Trial'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Traders Are Saying
            </h2>
            <p className="text-xl text-gray-600">Real experiences from real traders learning options</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 - Sarah */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <img
                  src="https://i.pravatar.cc/150?img=47"
                  alt="Sarah Mitchell"
                  className="w-16 h-16 rounded-full object-cover border-4 border-blue-100 mr-4"
                />
                <div>
                  <div className="font-bold text-lg text-gray-900">Sarah Mitchell</div>
                  <div className="text-sm text-gray-500">Marketing Manager, Age 32</div>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                "I went from being terrified of options to confidently trading spreads in just 3 months. The multi-leg strategy builder with real-time Greeks made everything click. The 6-month free trial gave me plenty of time to master the platform!"
              </p>
              <div className="text-sm text-blue-600 font-semibold">
                ✓ Verified Trader
              </div>
            </div>

            {/* Testimonial 2 - Mike */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <img
                  src="https://i.pravatar.cc/150?img=13"
                  alt="Mike Anderson"
                  className="w-16 h-16 rounded-full object-cover border-4 border-green-100 mr-4"
                />
                <div>
                  <div className="font-bold text-lg text-gray-900">Mike Anderson</div>
                  <div className="text-sm text-gray-500">Software Engineer, Age 28</div>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                "The paper trading with real-time data saved me from costly mistakes. I practiced iron condors for weeks before going live. Lost $200 in the simulator, made $3,400 with real money using the same strategies. This platform is pure gold."
              </p>
              <div className="text-sm text-blue-600 font-semibold">
                ✓ Verified Trader
              </div>
            </div>

            {/* Testimonial 3 - Jessica */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <img
                  src="https://i.pravatar.cc/150?img=10"
                  alt="Emily Roberts"
                  className="w-16 h-16 rounded-full object-cover border-4 border-purple-100 mr-4"
                />
                <div>
                  <div className="font-bold text-lg text-gray-900">Emily Roberts</div>
                  <div className="text-sm text-gray-500">Teacher, Age 35</div>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                "Finally understand what Delta and Theta actually mean! The Greeks calculator and visual payoff diagrams made complex concepts simple. I'm now generating consistent income with covered calls and credit spreads."
              </p>
              <div className="text-sm text-blue-600 font-semibold">
                ✓ Verified Trader
              </div>
            </div>

            {/* Testimonial 4 - David */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <img
                  src="https://i.pravatar.cc/150?img=51"
                  alt="David Thompson"
                  className="w-16 h-16 rounded-full object-cover border-4 border-orange-100 mr-4"
                />
                <div>
                  <div className="font-bold text-lg text-gray-900">David Thompson</div>
                  <div className="text-sm text-gray-500">Small Business Owner, Age 42</div>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                "Been trading stocks for 5 years but avoided options thinking they were too risky. This platform showed me how to use options to reduce risk, not increase it. The sentiment analysis and earnings event tracking are game-changers."
              </p>
              <div className="text-sm text-blue-600 font-semibold">
                ✓ Verified Trader
              </div>
            </div>

            {/* Testimonial 5 - Jennifer */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <img
                  src="https://i.pravatar.cc/150?img=5"
                  alt="Jennifer Blake"
                  className="w-16 h-16 rounded-full object-cover border-4 border-pink-100 mr-4"
                />
                <div>
                  <div className="font-bold text-lg text-gray-900">Jennifer Blake</div>
                  <div className="text-sm text-gray-500">Financial Analyst, Age 29</div>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                "The market regime analysis and advanced analytics tools are professional-grade. The platform offers incredible value compared to $200/month alternatives. The trading journal helped me identify and fix my bad habits."
              </p>
              <div className="text-sm text-blue-600 font-semibold">
                ✓ Verified Trader
              </div>
            </div>

            {/* Testimonial 6 - Robert */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <img
                  src="https://i.pravatar.cc/150?img=33"
                  alt="James Parker"
                  className="w-16 h-16 rounded-full object-cover border-4 border-indigo-100 mr-4"
                />
                <div>
                  <div className="font-bold text-lg text-gray-900">James Parker</div>
                  <div className="text-sm text-gray-500">IT Consultant, Age 38</div>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                "After watching my 401k stagnate for years, I decided to learn active trading. The educational modules are crystal clear, and practicing with paper money gave me confidence. Now I'm building wealth through strategic options trades while keeping my day job."
              </p>
              <div className="text-sm text-blue-600 font-semibold">
                ✓ Verified Trader
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">4.9/5</div>
                <div className="text-gray-600">Average Rating</div>
                <div className="flex justify-center mt-2 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">10,000+</div>
                <div className="text-gray-600">Active Traders</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">1M+</div>
                <div className="text-gray-600">Paper Trades Executed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-2">6 Months</div>
                <div className="text-gray-600">Free Trial Period</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src="/logo-dark.svg" alt="Options Academy" className="h-10 mb-4" />
              <p className="text-gray-400">
                Master options trading with our comprehensive professional platform. Start with 6 months free.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Real-Time Options Data</li>
                <li>Multi-Leg Strategies</li>
                <li>AI Sentiment Analysis</li>
                <li>Greeks & Analytics</li>
                <li>Market Regime Detection</li>
                <li>Trading Journal</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Options Education (50+ Modules)</li>
                <li>Strategy Tutorials</li>
                <li>Greeks & Pricing Guides</li>
                <li>Risk Management</li>
                <li>Event-Driven Trading</li>
                <li>Community Resources</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <div className="flex items-center text-gray-400 mb-2">
                <Mail className="h-4 w-4 mr-2" />
                <span>support@optionsacademy.com</span>
              </div>
              <div className="mt-4 text-gray-500 text-sm">
                <p className="mb-2">Questions? We're here to help!</p>
                <p className="text-xs">Response time: 24-48 hours</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-gray-400 hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white">
                Terms of Service
              </Link>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-gray-400">
                © 2025 Options Academy. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}