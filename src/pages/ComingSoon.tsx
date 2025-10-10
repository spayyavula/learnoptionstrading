import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  CheckCircle,
  Bell,
  Mail,
  Sparkles,
  Calendar,
  Globe,
  Info
} from 'lucide-react'
import SeoHelmet from '../components/SeoHelmet'

export default function ComingSoon() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual email subscription
    setSubscribed(true)
    setEmail('')
    setTimeout(() => setSubscribed(false), 5000)
  }

  return (
    <>
      <SeoHelmet
        title="Indian Markets Trading - Coming Soon | Learn Options Trading"
        description="Live Indian options trading with Zerodha integration coming soon. Get notified when we launch NIFTY, BANKNIFTY, and NSE/BSE options trading."
        keywords="Indian options trading, Zerodha trading, NIFTY options, BANKNIFTY trading, NSE options, BSE trading, Indian market trading"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-orange-600 via-white to-green-600 border-b-4 border-orange-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="flex items-center text-gray-900 hover:text-orange-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="font-semibold">Back to Home</span>
              </Link>
              <div className="flex items-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                  Learn Options Trading 🇮🇳
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 to-green-600 rounded-full mb-6 animate-pulse">
              <TrendingUp className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Indian Markets Trading
              <span className="block text-transparent bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text">
                Coming Soon! 🇮🇳
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              We're working hard to bring you live options trading on NSE & BSE through Zerodha Kite Connect integration.
            </p>

            {/* Timeline Badge */}
            <div className="inline-flex items-center bg-yellow-100 border-2 border-yellow-400 rounded-full px-6 py-3 shadow-lg">
              <Clock className="h-5 w-5 text-yellow-700 mr-2" />
              <span className="font-bold text-yellow-900">
                Expected Launch: Q1 2026 (Next Quarter)
              </span>
            </div>
          </div>

          {/* What's Coming */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-2 border-orange-200 mb-12">
            <div className="flex items-center mb-6">
              <Sparkles className="h-8 w-8 text-orange-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">What to Expect</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Live Trading Integration</h3>
                  <p className="text-gray-600">Execute real trades on NIFTY, BANKNIFTY, FINNIFTY options through Zerodha</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">NSE/BSE Stock Options</h3>
                  <p className="text-gray-600">Trade options on 20+ liquid Indian stocks (Reliance, TCS, Infy, HDFC Bank)</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Indian Greeks Calculator</h3>
                  <p className="text-gray-600">Black-Scholes adapted for Indian markets with NSE lot sizes and RBI rates</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Real-Time Data</h3>
                  <p className="text-gray-600">Live market data during NSE hours with WebSocket streaming</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Multi-Leg Strategies</h3>
                  <p className="text-gray-600">Build spreads, straddles, and complex strategies for Indian options</p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Seamless Paper Trading</h3>
                  <p className="text-gray-600">Practice with virtual money before going live with real capital</p>
                </div>
              </div>
            </div>
          </div>

          {/* Currently Available */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 md:p-12 border-2 border-blue-200 mb-12">
            <div className="flex items-center mb-6">
              <Info className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">Available Now</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center bg-white rounded-lg p-4 shadow">
                <CheckCircle className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
                <span className="font-medium text-gray-900">
                  View Indian Options Chain (NIFTY, BANKNIFTY) - Data Only
                </span>
              </div>

              <div className="flex items-center bg-white rounded-lg p-4 shadow">
                <CheckCircle className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
                <span className="font-medium text-gray-900">
                  US Markets Live Trading with Polygon.io Integration
                </span>
              </div>

              <div className="flex items-center bg-white rounded-lg p-4 shadow">
                <CheckCircle className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
                <span className="font-medium text-gray-900">
                  Options Education & Strategy Learning (50+ Modules)
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/optionschain">
                <button className="bg-gradient-to-r from-orange-600 to-green-600 hover:from-orange-700 hover:to-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                  🇮🇳 View Indian Options Chain (Data)
                </button>
              </Link>
              <a
                href="https://www.nseindia.com/option-chain"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center"
              >
                <Globe className="h-5 w-5 mr-2" />
                Visit NSE India
              </a>
            </div>
          </div>

          {/* Email Subscription */}
          <div className="bg-gradient-to-r from-orange-600 to-green-600 rounded-2xl shadow-2xl p-8 md:p-12 text-white">
            <div className="text-center mb-8">
              <Bell className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Get Notified at Launch</h2>
              <p className="text-orange-100 text-lg">
                Be among the first to know when Indian markets trading goes live
              </p>
            </div>

            {!subscribed ? (
              <form onSubmit={handleNotifyMe} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full px-6 py-4 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-yellow-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-white hover:bg-gray-100 text-orange-600 px-8 py-4 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                  >
                    <Mail className="inline h-5 w-5 mr-2" />
                    Notify Me
                  </button>
                </div>
                <p className="text-sm text-orange-100 mt-4 text-center">
                  We'll only email you about Indian markets launch. No spam, ever.
                </p>
              </form>
            ) : (
              <div className="text-center bg-white/20 rounded-lg p-6 max-w-md mx-auto">
                <CheckCircle className="h-12 w-12 text-white mx-auto mb-3" />
                <p className="text-xl font-bold">Thank you for subscribing!</p>
                <p className="text-orange-100 mt-2">
                  We'll notify you as soon as Indian trading is live.
                </p>
              </div>
            )}
          </div>

          {/* Development Timeline */}
          <div className="mt-12 bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
            <div className="flex items-center mb-6">
              <Calendar className="h-8 w-8 text-gray-900 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Development Timeline</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  ✓
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">Phase 1: Foundation (Completed)</h3>
                  <p className="text-gray-600">Indian Greeks calculator, Zerodha API integration, options chain data</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">Phase 2: Testing (In Progress)</h3>
                  <p className="text-gray-600">OAuth integration, paper trading simulation, order placement testing</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">Phase 3: Launch (Q1 2026)</h3>
                  <p className="text-gray-600">Live trading with Zerodha, multi-leg strategies, real-time portfolio tracking</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">
              © 2025 Learn Options Trading. All rights reserved.
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
