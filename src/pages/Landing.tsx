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
        description="Professional-grade options trading platform with real-time market data, AI sentiment analysis, multi-leg strategy builder, Greeks calculator, and market regime detection. All features free forever. Live trading with Alpaca coming Q2 2025."
        keywords="options trading platform, real-time options data, options Greeks calculator, multi-leg options strategies, options sentiment analysis, Black-Scholes calculator, options arbitrage, market regime analysis, options education, paper trading, options chain, implied volatility, FinBERT sentiment, options analytics, free options platform"
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
                    Welcome, {localStorage.getItem('demo_mode') === 'true' ? 'Demo User' : user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}!
                    {localStorage.getItem('demo_mode') === 'true' && <span className="text-orange-300 ml-1">(Demo)</span>}
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
                    to="/app"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Launch App Now
                  </Link>
                  <button
                    onClick={() => {
                      localStorage.setItem('demo_mode', 'true')
                      localStorage.setItem('demo_user', JSON.stringify({
                        id: 'demo-user',
                        email: 'demo@example.com',
                        user_metadata: { full_name: 'Demo User' }
                      }))
                      window.location.reload()
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Try Demo
                  </button>
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
            <div className="bg-blue-800/50 border border-blue-400 rounded-lg p-4 max-w-3xl mx-auto mb-6">
              <div className="flex items-center justify-center text-blue-200">
                <Sparkles className="h-5 w-5 mr-2" />
                <span className="font-semibold">Coming Q2 2025: Live Trading Integration with Alpaca</span>
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

      {/* Add this button below your hero section or wherever you want */}
      <div className="flex justify-center my-8">
        <Link to="/optionschain">
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
          >
            View Options Chain (No Login Needed)
          </button>
        </Link>
      </div>

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
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Market Data</h3>
              <p className="text-gray-600">
                Live options chains with Greeks, IV, volume, and OI via Polygon.io integration
              </p>
              <div className="mt-2 text-sm font-bold text-green-600">100% Free</div>
            </div>

            {/* Multi-Leg Strategies */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Leg Strategy Builder</h3>
              <p className="text-gray-600">
                Build and visualize spreads, straddles, condors with interactive payoff diagrams
              </p>
              <div className="mt-2 text-sm font-bold text-green-600">Unlimited Access</div>
            </div>

            {/* Sentiment Analysis */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Sentiment Analysis</h3>
              <p className="text-gray-600">
                FinBERT-powered news sentiment, social media tracking, analyst ratings
              </p>
              <div className="mt-2 text-sm font-bold text-green-600">Free Forever</div>
            </div>

            {/* Greeks & Analytics */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Greeks Analytics</h3>
              <p className="text-gray-600">
                Black-Scholes pricing, Greeks sensitivity analysis, portfolio Greeks aggregation
              </p>
              <div className="mt-2 text-sm font-bold text-green-600">No Cost</div>
            </div>

            {/* Market Regime Analysis */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LineChart className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Market Regime Detection</h3>
              <p className="text-gray-600">
                Identify bull, bear, high volatility markets with VIX tracking and regime shifts
              </p>
              <div className="mt-2 text-sm font-bold text-green-600">Included</div>
            </div>

            {/* Community & Sharing */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Integration</h3>
              <p className="text-gray-600">
                Share trades to Slack, Discord, Telegram, WhatsApp, Facebook communities
              </p>
              <div className="mt-2 text-sm font-bold text-green-600">All Features</div>
            </div>

            {/* Trading Journal */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trading Journal & History</h3>
              <p className="text-gray-600">
                Track every trade with notes, tags, P&L analysis, and performance metrics
              </p>
              <div className="mt-2 text-sm font-bold text-green-600">Unlimited</div>
            </div>

            {/* Event-Driven Strategies */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Event-Adjusted Pricing</h3>
              <p className="text-gray-600">
                Earnings, FOMC, economic events with volatility adjustments and IV crush modeling
              </p>
              <div className="mt-2 text-sm font-bold text-green-600">Premium Features Free</div>
            </div>

            {/* Educational Courses */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Comprehensive Education</h3>
              <p className="text-gray-600">
                50+ modules covering basics to advanced: Greeks, spreads, volatility, risk management
              </p>
              <div className="mt-2 text-sm font-bold text-green-600">All Content Free</div>
            </div>
          </div>

          {/* Price Arbitrage - horizontal full row */}
          <div className="mt-8">
            <div className="flex flex-col md:flex-row items-center bg-yellow-50 border border-yellow-200 rounded-lg p-6 md:p-8 shadow">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-8 flex items-center justify-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-12 w-12 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-yellow-800 mb-2">Price Arbitrage (Options)</h3>
                <p className="text-gray-700 mb-2">
                  Discover how professional traders spot and act on price differences between related options contracts or markets—locking in low-risk profits.
                </p>
                <div className="text-sm font-bold text-yellow-700 mb-2">Simultaneous Buy &amp; Sell</div>
                <div className="bg-yellow-100 border border-yellow-200 rounded p-3 text-left text-sm text-yellow-900 mb-2">
                  <strong>How to Practice:</strong>
                  <ol className="list-decimal ml-5 mt-1">
                    <li>Find two related options or markets with a price gap.</li>
                    <li>At the same time, <b>buy</b> the underpriced and <b>sell</b> the overpriced contract.</li>
                    <li>Track your simulated P&amp;L to see if the price gap closes and you profit.</li>
                    <li>
                      <Link to="/app" className="text-yellow-700 underline hover:text-yellow-900">
                        Try arbitrage in the simulator &rarr;
                      </Link>
                    </li>
                  </ol>
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>Tip:</strong> This is not the same as "option writing" (selling calls/puts for premium). Arbitrage is about exploiting price inefficiencies, not collecting premium.
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

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Live Trading Coming Soon</h3>
                  <p className="text-gray-600">
                    Q2 2025: Execute real trades directly through Alpaca integration. Practice now with our simulator,
                    then seamlessly transition to live trading when ready.
                  </p>
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Students Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Amazing that all these features are completely free! The educational content is top-notch and I love that there's no paywall."
              </p>
              <div className="font-semibold">- Sarah J.</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "The practice trading feature is incredible and it's all free! I learned so much before putting real money at risk."
              </p>
              <div className="font-semibold">- Mike T.</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Best free resource I've found for trading education. The risk management lessons alone are incredibly valuable."
              </p>
              <div className="font-semibold">- Lisa R.</div>
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