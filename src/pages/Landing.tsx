import React from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import SeoHelmet from '../components/SeoHelmet'

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

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
        title="Options Academy - Learn Options Trading"
        description="Master options trading with real-time analytics, AI insights, and professional-grade tools. Practice risk-free with paper trading."
        keywords="options trading, paper trading, options analytics, options education, Black-Scholes, Greeks calculator"
        type="website"
      />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-semibold text-gray-900">Options Academy</span>
              </Link>
              <nav className="flex items-center space-x-8">
                {user ? (
                  <Link
                    to="/app"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Go to App
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                      Sign in
                    </Link>
                    <Link
                      to="/signup"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="py-24 lg:py-32">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight">
                Learn options trading.
                <br />
                <span className="text-gray-400">Risk-free.</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                Professional-grade analytics, real-time market data, and paper trading
                to help you master options without risking real money.
              </p>
              <div className="mt-10 flex items-center space-x-4">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  {user ? 'Open App' : 'Start for free'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                <span className="text-sm text-gray-500">6 months free access</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-16">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Paper Trading</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  Practice with $100,000 virtual capital. Test strategies, learn from mistakes,
                  and build confidence before using real money.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Real-time Data</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  Live options chains, Greeks, and market data powered by Polygon.io.
                  Make decisions with the same data professionals use.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Strategy Builder</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  Build multi-leg strategies with visual payoff diagrams.
                  50+ pre-built templates for spreads, straddles, and more.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-gray-900">Everything you need</h2>
            <div className="mt-12 grid lg:grid-cols-2 gap-x-16 gap-y-8">
              {[
                'Options chain with full Greeks',
                'Black-Scholes pricing calculator',
                'Multi-leg strategy builder',
                'Visual payoff diagrams',
                'AI sentiment analysis',
                'Market regime detection',
                'Event-driven pricing',
                'Portfolio analytics',
                'Trade journal & history',
                '50+ educational modules',
              ].map((feature) => (
                <div key={feature} className="flex items-start">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Brokers */}
        <section className="py-20 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-gray-900">Live trading coming soon</h2>
            <p className="mt-4 text-gray-600 max-w-2xl">
              Practice now, trade later. When you're ready, connect to your preferred broker
              and trade with real money using the same interface.
            </p>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {[
                { name: 'Alpaca', market: 'US' },
                { name: 'Interactive Brokers', market: 'Global' },
                { name: 'Zerodha', market: 'India' },
                { name: 'Robinhood', market: 'US/Crypto' },
                { name: 'ICICI Direct', market: 'India' },
                { name: 'HDFC Securities', market: 'India' },
              ].map((broker) => (
                <div key={broker.name} className="text-center">
                  <div className="text-sm font-medium text-gray-900">{broker.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{broker.market}</div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-gray-500">
              All integrations complete. Testing in progress. Expected launch: November 2025.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="max-w-lg">
              <h2 className="text-2xl font-semibold text-gray-900">Simple pricing</h2>
              <p className="mt-4 text-gray-600">
                Start with 6 months free. No credit card required.
                After that, continue learning for just $19/month.
              </p>
              <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-baseline">
                  <span className="text-3xl font-semibold text-gray-900">$0</span>
                  <span className="ml-2 text-gray-500">for 6 months</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Then $19/month. Cancel anytime.
                </p>
                <button
                  onClick={handleGetStarted}
                  className="mt-6 w-full py-3 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  {user ? 'Open App' : 'Get started free'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              Ready to start learning?
            </h2>
            <p className="mt-4 text-gray-600">
              Join thousands of traders mastering options the smart way.
            </p>
            <button
              onClick={handleGetStarted}
              className="mt-8 inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
              {user ? 'Go to App' : 'Start your free trial'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-500">
                © {new Date().getFullYear()} Options Academy. All rights reserved.
              </div>
              <div className="mt-4 md:mt-0 flex space-x-6">
                <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                  Privacy
                </Link>
                <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                  Terms
                </Link>
                <a href="mailto:support@optionsacademy.ai" className="text-sm text-gray-500 hover:text-gray-700">
                  Contact
                </a>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
                Options trading involves significant risk. Paper trading results do not guarantee
                future performance. This platform is for educational purposes only and does not
                constitute financial advice. Please consult a qualified financial advisor before
                making investment decisions.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

// Export LivePrice for backward compatibility (if used elsewhere)
export function LivePrice() {
  return null
}
