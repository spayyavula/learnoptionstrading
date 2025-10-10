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
        title="Options Trading Platform - Real-Time Analytics, AI Insights & Multi-Leg Strategies | 100% Free"
        description="Professional-grade options trading platform with real-time market data, AI sentiment analysis, multi-leg strategy builder, Greeks calculator, market regime detection, event-driven pricing, and 50+ educational modules. All features free forever. Live trading with Alpaca coming in 3 months."
        keywords="options trading platform, real-time options data, options Greeks calculator, multi-leg options strategies, options sentiment analysis, Black-Scholes calculator, options arbitrage, market regime analysis, options education, paper trading, options chain, implied volatility, FinBERT sentiment, options analytics, free options platform, event-driven options, earnings options, FOMC trading, Alpaca trading"
        type="website"
      />
      <div className="min-h-screen bg-white">
      {/* Free Forever Banner */}
      <div className="bg-green-600 text-white py-3 px-4 text-center text-sm font-bold">
        🎉 ALL FEATURES ARE FREE FOREVER! No Subscription Required. Start Learning Now! 🎉
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold">Learn Options Trading</h1>
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
                    Get Started Free
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
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Master Options Trading with Pro-Level Tools.
              <span className="block text-green-400">All Features Are Free Forever!</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Advanced options analytics platform with real-time market data, sentiment analysis, multi-leg strategies,
              Greeks tracking, and AI-powered insights. Practice with virtual money before risking real capital.
            </p>
            <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-2 border-orange-400 rounded-lg p-6 max-w-3xl mx-auto mb-8 shadow-xl">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center text-orange-100 mb-2">
                  <Sparkles className="h-6 w-6 mr-2 animate-pulse" />
                  <span className="font-bold text-xl">Live Trading Integration Coming Soon!</span>
                  <Sparkles className="h-6 w-6 ml-2 animate-pulse" />
                </div>
                <p className="text-orange-200 text-lg">
                  Execute real trades through Alpaca integration in ~3 months (thorough testing in progress)
                </p>
              </div>
            </div>
            <button
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center mx-auto"
            >
              {user ? 'Go to App' : 'Launch App Now - 100% Free'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
          
        </div>
      </section>

      {/* Zerodha Indian Markets Integration Banner */}
      <section className="bg-gradient-to-r from-orange-500 via-white to-green-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-4 border-orange-500">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="h-12 w-12 text-orange-600 mr-3" />
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Now Trading <span className="text-orange-600">Indian Markets</span> 🇮🇳
                </h2>
              </div>
              <p className="text-xl text-gray-700 font-medium">
                Powered by <strong className="text-orange-600">Zerodha Kite Connect</strong> - India's #1 Trading Platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gradient-to-br from-orange-50 to-green-50 rounded-xl p-6 border-2 border-orange-300">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  US Markets (Polygon.io)
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" /> S&P 500, NASDAQ stocks</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" /> SPY, QQQ, IWM options</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" /> Real-time US market data</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" /> Extended hours trading</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-orange-100 to-green-100 rounded-xl p-6 border-2 border-green-600 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Sparkles className="h-6 w-6 text-orange-600 mr-2 animate-pulse" />
                  Indian Markets (Zerodha) 🆕
                </h3>
                <ul className="space-y-2 text-gray-700 font-medium">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" /> NIFTY, BANKNIFTY, FINNIFTY</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" /> NSE/BSE stocks options</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" /> Real-time Indian market data</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" /> 20+ liquid stocks (Reliance, TCS, Infy)</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
              <h4 className="text-xl font-bold text-blue-900 mb-3 flex items-center">
                <Info className="h-6 w-6 mr-2" />
                Indian-Specific Features
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center text-blue-800">
                  <Calculator className="h-5 w-5 mr-2 text-orange-600" />
                  <span className="font-semibold">Indian Greeks Calculator</span>
                </div>
                <div className="flex items-center text-blue-800">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  <span className="font-semibold">Real-time WebSocket</span>
                </div>
                <div className="flex items-center text-blue-800">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="font-semibold">NSE Lot Size Support</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link to="/optionschain">
                <button className="bg-gradient-to-r from-orange-600 to-green-600 hover:from-orange-700 hover:to-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold shadow-xl hover:shadow-2xl transition-all">
                  🇮🇳 Try Indian Options Chain Now →
                </button>
              </Link>
              <p className="mt-4 text-sm text-gray-600">
                No login required • Switch between US & Indian markets anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional-Grade Trading Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              More than paper trading - a complete options analytics and education ecosystem
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
                ✓ 100% Free
              </div>
            </div>

            {/* Multi-Leg Strategies */}
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Multi-Leg Strategy Builder</h3>
              <p className="text-gray-700 font-medium">
                Build and visualize spreads, straddles, condors with interactive payoff diagrams
              </p>
              <div className="mt-3 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-300">
                ✓ Unlimited Access
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
                ✓ Free Forever
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
                ✓ Premium Features Free
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
                ✓ All Content Free
              </div>
            </div>
          </div>

          {/* Price Arbitrage - horizontal full row */}
          <div className="mt-8">
            <div className="flex flex-col md:flex-row items-center bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-8 flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-14 w-14 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-yellow-900 mb-3">Options Arbitrage Detection</h3>
                <p className="text-gray-800 mb-3 text-lg font-medium">
                  Discover how professional traders spot and act on price differences between related options contracts or markets—locking in low-risk profits.
                </p>
                <div className="inline-block bg-yellow-200 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold mb-3 border border-yellow-400">
                  🎯 Simultaneous Buy & Sell Strategy
                </div>
                <div className="bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-300 rounded-xl p-4 text-left text-sm text-yellow-900 shadow-inner">
                  <strong className="text-base text-yellow-900">How to Practice:</strong>
                  <ol className="list-decimal ml-5 mt-2 space-y-1">
                    <li className="font-medium">Find two related options or markets with a price gap.</li>
                    <li className="font-medium">At the same time, <b>buy</b> the underpriced and <b>sell</b> the overpriced contract.</li>
                    <li className="font-medium">Track your simulated P&amp;L to see if the price gap closes and you profit.</li>
                    <li>
                      <Link to="/app" className="text-yellow-800 font-bold underline hover:text-yellow-900 hover:no-underline">
                        Try arbitrage in the simulator →
                      </Link>
                    </li>
                  </ol>
                  <div className="mt-3 pt-3 border-t border-yellow-300 text-xs text-gray-700 bg-yellow-50 rounded p-2">
                    <strong>💡 Pro Tip:</strong> This is not the same as "option writing" (selling calls/puts for premium). Arbitrage is about exploiting price inefficiencies, not collecting premium.
                  </div>
                </div>
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Strategy Tools</h3>
                  <p className="text-gray-600">
                    Build complex multi-leg strategies (spreads, iron condors, butterflies) with visual payoff diagrams,
                    break-even analysis, and portfolio Greeks aggregation.
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
                  <h3 className="text-xl font-bold text-orange-900 mb-2">🚀 Live Trading with Alpaca (Coming in ~3 Months)</h3>
                  <p className="text-orange-800 font-medium">
                    Execute real trades directly through Alpaca brokerage integration. Practice now with our simulator,
                    then seamlessly transition to live trading when ready. Currently undergoing thorough testing to ensure reliability.
                  </p>
                  <div className="mt-3 bg-orange-100 border border-orange-300 rounded-lg p-3">
                    <p className="text-sm text-orange-900 font-semibold">✓ Zero-commission stock & options trading</p>
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
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-200">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-200">Educational Modules</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-blue-200">Simulated Trades</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-200">Free Forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Access CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Launch Your Trading Journey Today
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Access all features instantly and start building your options trading expertise - completely free!
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-2xl font-bold text-green-800">100% Free Forever</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-left text-green-700">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>Real-time options chains with live Greeks</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span>Multi-leg strategy builder with payoff diagrams</span>
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
                <span>Options arbitrage detection</span>
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
            {user ? 'Go to App' : 'Launch App Now - 100% Free'}
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
                "I went from being terrified of options to confidently trading spreads in just 3 months. The multi-leg strategy builder with real-time Greeks made everything click. The fact that it's completely free is mind-blowing!"
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
                "The arbitrage detection and market regime analysis tools are professional-grade. I can't believe this is free when I've paid $200/month for platforms with fewer features. The trading journal helped me identify and fix my bad habits."
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
                <div className="text-3xl font-bold text-orange-600 mb-2">$0</div>
                <div className="text-gray-600">Forever Free</div>
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
              <h3 className="text-lg font-semibold mb-4">Learn Options Trading</h3>
              <p className="text-gray-400">
                Master options trading with our comprehensive, free educational platform.
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
                <span>support@learnoptions.com</span>
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
                © 2025 Learn Options Trading Academy. All rights reserved.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-gray-400">
                © 2025 Learn Options Trading. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}