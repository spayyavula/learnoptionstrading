import React from 'react'
import { Link } from 'react-router-dom'
import TradingViewWidget from '../components/TradingViewWidget'
import { 
  ArrowRight, TrendingUp, BookOpen, Users, BarChart3, AlertTriangle,
  FileText, Eye, PieChart, Briefcase, Lightbulb, BookMarked, ChevronRight,
  Calculator
} from 'lucide-react'

export default function Demo() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 relative">
      {/* Demo Disclaimer Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 py-2 px-4 text-center mb-8">
        <div className="flex items-center justify-center">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-700">
            <strong>Disclaimer:</strong> This platform is for educational purposes only. Options trading involves significant risk.
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Options Trading Platform Demo</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive paper trading platform for options trading with real-time data, 
            advanced analytics, and educational resources.
          </p>
        </div>

        {/* Application Flow */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Application Flow</h2>
          
          <div className="relative">
            {/* Flow Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-blue-200 hidden md:block"></div>
            
            {/* Flow Steps */}
            <div className="space-y-12">
              {/* Step 1 */}
              <div className="relative">
                <div className="md:flex items-center">
                  <div className="md:w-1/2 mb-6 md:mb-0 md:pr-12 md:text-right">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">1. Landing Page</h3>
                    <p className="text-gray-600">
                      Start your journey with our feature-rich landing page showcasing platform capabilities, 
                      pricing plans, and special deals.
                    </p>
                    <Link to="/" className="inline-flex items-center text-blue-600 font-medium mt-2 hover:text-blue-700">
                      Visit Landing Page
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-blue-500 border-4 border-white"></div>
                  <div className="md:w-1/2 md:pl-12">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="font-medium text-gray-900 mb-1">Key Features:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Platform overview and benefits</li>
                        <li>• Subscription plans and pricing</li>
                        <li>• Special deals and promotions</li>
                        <li>• Newsletter signup</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="md:flex items-center">
                  <div className="md:w-1/2 mb-6 md:mb-0 md:pr-12 md:text-right">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="font-medium text-gray-900 mb-1">Key Features:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Market overview and trends</li>
                        <li>• Portfolio summary</li>
                        <li>• Quick access to trading features</li>
                        <li>• Recent activity and alerts</li>
                      </ul>
                    </div>
                  </div>
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-blue-500 border-4 border-white"></div>
                  <div className="md:w-1/2 md:pl-12">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">2. Dashboard</h3>
                    <p className="text-gray-600">
                      Get a comprehensive overview of your portfolio, market trends, and quick access 
                      to all platform features.
                    </p>
                    <Link to="/app" className="inline-flex items-center text-blue-600 font-medium mt-2 hover:text-blue-700">
                      View Dashboard
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="md:flex items-center">
                  <div className="md:w-1/2 mb-6 md:mb-0 md:pr-12 md:text-right">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">3. Options Trading</h3>
                    <p className="text-gray-600">
                      Execute options trades with real-time market data, Greeks analysis, and 
                      comprehensive order management.
                    </p>
                    <Link to="/app/trading" className="inline-flex items-center text-blue-600 font-medium mt-2 hover:text-blue-700">
                      Try Options Trading
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-blue-500 border-4 border-white"></div>
                  <div className="md:w-1/2 md:pl-12">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="font-medium text-gray-900 mb-1">Key Features:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Real-time options chain data</li>
                        <li>• Greeks analysis (Delta, Gamma, Theta, Vega)</li>
                        <li>• Market, limit, and stop orders</li>
                        <li>• Position tracking and P&L analysis</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="md:flex items-center">
                  <div className="md:w-1/2 mb-6 md:mb-0 md:pr-12 md:text-right">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="font-medium text-gray-900 mb-1">Key Features:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Structured learning modules</li>
                        <li>• Interactive quizzes and exercises</li>
                        <li>• Strategy templates and examples</li>
                        <li>• Progress tracking and achievements</li>
                      </ul>
                    </div>
                  </div>
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-blue-500 border-4 border-white"></div>
                  <div className="md:w-1/2 md:pl-12">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">4. Options Learning</h3>
                    <p className="text-gray-600">
                      Master options trading with our comprehensive learning modules, from basics 
                      to advanced strategies.
                    </p>
                    <Link to="/app/learning" className="inline-flex items-center text-blue-600 font-medium mt-2 hover:text-blue-700">
                      Start Learning
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="relative">
                <div className="md:flex items-center">
                  <div className="md:w-1/2 mb-6 md:mb-0 md:pr-12 md:text-right">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">5. Portfolio Management</h3>
                    <p className="text-gray-600">
                      Track your options positions, analyze performance, and manage your 
                      investment strategy.
                    </p>
                    <Link to="/app/portfolio" className="inline-flex items-center text-blue-600 font-medium mt-2 hover:text-blue-700">
                      View Portfolio
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-blue-500 border-4 border-white"></div>
                  <div className="md:w-1/2 md:pl-12">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="font-medium text-gray-900 mb-1">Key Features:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Position tracking and valuation</li>
                        <li>• P&L analysis and visualization</li>
                        <li>• Portfolio allocation insights</li>
                        <li>• Risk metrics and exposure analysis</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="relative">
                <div className="md:flex items-center">
                  <div className="md:w-1/2 mb-6 md:mb-0 md:pr-12 md:text-right">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="font-medium text-gray-900 mb-1">Key Features:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Trade documentation and analysis</li>
                        <li>• Performance tracking over time</li>
                        <li>• Emotional state tracking</li>
                        <li>• Lessons learned and improvement areas</li>
                      </ul>
                    </div>
                  </div>
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-blue-500 border-4 border-white"></div>
                  <div className="md:w-1/2 md:pl-12">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">6. Trading Journal</h3>
                    <p className="text-gray-600">
                      Document your trades, analyze performance patterns, and improve your 
                      trading strategy over time.
                    </p>
                    <Link to="/app/journal" className="inline-flex items-center text-blue-600 font-medium mt-2 hover:text-blue-700">
                      Open Journal
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Step 7 */}
              <div className="relative">
                <div className="md:flex items-center">
                  <div className="md:w-1/2 mb-6 md:mb-0 md:pr-12 md:text-right">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">7. Community Integration</h3>
                    <p className="text-gray-600">
                      Connect with fellow traders, share insights, and learn from the community 
                      across multiple platforms.
                    </p>
                    <Link to="/app/community" className="inline-flex items-center text-blue-600 font-medium mt-2 hover:text-blue-700">
                      Join Community
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-blue-500 border-4 border-white"></div>
                  <div className="md:w-1/2 md:pl-12">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="font-medium text-gray-900 mb-1">Key Features:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Multi-platform integration (Slack, Discord, Telegram)</li>
                        <li>• Trade sharing and analysis</li>
                        <li>• Market insights and discussions</li>
                        <li>• Educational content sharing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Key Platform Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Options Trading</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Trade options with real-time market data from StockCharts and TradingView, Greeks analysis, and comprehensive order management.
              </p>
              <Link to="/app/trading" className="text-blue-600 font-medium inline-flex items-center hover:text-blue-700">
                Explore Trading
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Learning Resources</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Master options trading with our comprehensive learning modules, from basics to advanced strategies.
              </p>
              <Link to="/app/learning" className="text-blue-600 font-medium inline-flex items-center hover:text-blue-700">
                Start Learning
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Briefcase className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Portfolio Management</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Track your options positions, analyze performance, and manage your investment strategy.
              </p>
              <Link to="/app/portfolio" className="text-blue-600 font-medium inline-flex items-center hover:text-blue-700">
                View Portfolio
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <BookMarked className="h-8 w-8 text-orange-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Trading Journal</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Document your trades, analyze performance patterns, and improve your trading strategy over time.
              </p>
              <Link to="/app/journal" className="text-blue-600 font-medium inline-flex items-center hover:text-blue-700">
                Open Journal
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Lightbulb className="h-8 w-8 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Strategy Library</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Explore and implement proven options trading strategies for different market conditions.
              </p>
              <Link to="/app/strategies" className="text-blue-600 font-medium inline-flex items-center hover:text-blue-700">
                Browse Strategies
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Community Integration</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Connect with fellow traders, share insights, and learn from the community across multiple platforms.
              </p>
              <Link to="/app/community" className="text-blue-600 font-medium inline-flex items-center hover:text-blue-700">
                Join Community
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-xl mb-6 max-w-2xl mx-auto">
            Jump into our paper trading platform and practice options trading with zero risk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/app" 
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Launch Platform
            </Link>
            <Link 
              to="/app/learning" 
              className="bg-blue-700 text-white hover:bg-blue-800 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Start Learning
            </Link>
          </div>
          
          <Link to="/arbitrage" className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Calculator className="h-4 w-4 mr-2 text-blue-600" />
              Options Arbitrage
            </h4>
            <p className="text-sm text-gray-600">Find arbitrage opportunities using Black-Scholes pricing model.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}