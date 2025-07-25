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
  AlertTriangle
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'


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
      interval = setInterval(() => {
        setPrice(prev => {
          if (prev === null) return prev;
          return simulatePriceChange(prev);
        });
      }, 10000); // update every 10s
    }

    return () => {
      if (interval) clearInterval(interval);
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
    <div className="min-h-screen bg-white">
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
                    to="/signup"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Get Started
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
              Master Options Trading
              <span className="block text-blue-400">Risk-Free</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Learn options trading with our comprehensive educational platform. 
              Practice with virtual money before risking real capital.
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center mx-auto"
            >
              {user ? 'Go to App' : 'Get Started Free'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
          
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to learn options trading safely and effectively
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Educational Content */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Educational Content</h3>
              <p className="text-gray-600">
                Comprehensive lessons from basics to advanced strategies
              </p>
              <div className="mt-2 text-sm font-bold text-gray-500">—</div>
            </div>

            {/* Practice Trading */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Practice Trading</h3>
              <p className="text-gray-600">
                Virtual trading with real market data to practice safely
              </p>
              <div className="mt-2 text-sm font-bold text-gray-500">Buy &amp; Sell</div>
            </div>

            {/* Risk Management */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Risk Management</h3>
              <p className="text-gray-600">
                Learn proper risk management before using real money
              </p>
              <div className="mt-2 text-sm font-bold text-gray-500">—</div>
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

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-200">Students Learning</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-200">Educational Modules</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-200">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA Section instead of Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Start Learning Today
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our educational platform and master options trading safely
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center mx-auto"
          >
            {user ? 'Go to App' : 'Get Started Free'}
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
                "This platform helped me understand options trading without risking real money. The educational content is top-notch!"
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
                "The practice trading feature is incredible. I learned so much before putting real money at risk."
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
                "Best investment I've made in my trading education. The risk management lessons alone are worth it."
              </p>
              <div className="font-semibold">- Lisa R.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are mastering options trading safely and effectively.
          </p>
          {/* Removed Start Free and Get Started Free buttons from CTA section */}
        </div>
      </section>

      {/* Pricing Section - Only Free Plan */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              <span className="font-bold text-green-700">100% FREE!</span> No hidden fees, no contracts, no payment required. Enjoy unlimited access to all features.
            </p>
          </div>
          <div className="grid md:grid-cols-1 gap-8 max-w-3xl mx-auto">
            {/* Free Plan Only */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-green-400 p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-green-700 mb-4">$0<span className="text-lg text-gray-500">/month</span></div>
                <p className="text-gray-600 mb-6">Unlimited access for everyone</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>All lessons & tutorials</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Practice trading with real market data</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Portfolio analytics & risk management</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Community access</span>
                </li>
              </ul>
              <div className="w-full bg-green-100 text-green-900 px-6 py-4 rounded-lg font-bold text-center text-lg border-2 border-green-400 mb-4">
                🎉 This platform is now <span className="text-green-700">100% FREE</span>! Enjoy unlimited access to all features—no payment, no checkout, no subscription required.
              </div>
              {/* Removed Start Free button from pricing section */}
            </div>
          </div>
        </div>
      </section>

      {/* Footer - No changes needed */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Learn Options Trading</h3>
              <p className="text-gray-400">
                Master options trading with our comprehensive educational platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/app" className="hover:text-white">Trading Simulator</Link></li>
                <li>
                  <a
                    href="https://www.investopedia.com/ask/answers/032415/why-are-call-and-put-options-considered-risky.asp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Option Risks
                  </a>
                </li>
                <li><Link to="/app/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:support@learnoptionstrading.academy" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
  <li>
    <Link to="/PrivacyPolicy" className="hover:text-white">
      Privacy Policy
    </Link>
  </li>
  <li>
    <Link to="/TermsAndConditions" className="hover:text-white">
      Terms of Service
    </Link>
  </li>
  <li>
    <Link to="/DisclaimerDetailed" className="hover:text-white">
      Disclaimer
    </Link>
  </li>
</ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Learn Options Trading Academy. All rights reserved.</p>
          </div>
          {/* Add disclaimer at bottom of footer */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center text-sm text-gray-400">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
                <span>
                  Educational platform using simulated trading. Options trading involves substantial risk.
                  <Link to="/DisclaimerDetailed" className="mt-2 underline hover:text-white">
                    View full disclaimer
                  </Link>
                </span>
              </div>
              <div className="mt-4 md:mt-0">
                <p className="text-sm text-gray-400">
                  © 2025 Learn Options Trading. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}