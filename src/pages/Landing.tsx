import React, { useState } from 'react'
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


export default function Landing() {
  const navigate = useNavigate()
  // Platform is now 100% free! No paid plans, no checkout.

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
              <Link
                to="/app"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </Link>
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
            <div className="mb-4">
              <span className="inline-flex items-center text-yellow-300 bg-yellow-900 bg-opacity-30 rounded px-3 py-2 text-sm">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
                <span>
                  Educational use only. No financial advice. See our
                  <Link to='/disclaimer' className='underline ml-1 text-yellow-200 hover:text-white'>Disclaimer</Link>,
                  <Link to='/terms' className='underline ml-1 text-yellow-200 hover:text-white'>Terms</Link>, and
                  <Link to='/privacy' className='underline ml-1 text-yellow-200 hover:text-white'>Privacy Policy</Link>.
                </span>
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/app"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            </div>
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
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Educational Content</h3>
              <p className="text-gray-600">
                Comprehensive lessons from basics to advanced strategies
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Practice Trading</h3>
              <p className="text-gray-600">
                Virtual trading with real market data to practice safely
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Risk Management</h3>
              <p className="text-gray-600">
                Learn proper risk management before using real money
              </p>
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
            <Link
              to="/app"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
            >
              Start Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/app"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Start Free
            </Link>
            <Link
              to="/app"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Get Started Free
            </Link>
          </div>
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
              <Link
                to="/app"
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-center block"
              >
                Start Free
              </Link>
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
                <li><Link to="/app/lessons" className="hover:text-white">Lessons</Link></li>
                <li><Link to="/app/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:support@learnoptionstrading.academy" className="hover:text-white">Contact</a></li>
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/disclaimer" className="hover:text-white">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Learn Options Trading Academy. All rights reserved.</p>
          </div>
          {/* Add disclaimer at bottom of footer */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center text-sm text-gray-400">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
                <span>
                  Educational platform using simulated trading. Options trading involves substantial risk.
                  <Link to="/disclaimer" className="ml-2 underline hover:text-white">
                    View full disclaimer
                  </Link>
                </span>
              </div>
              <div className="mt-4 md:mt-0">
                <p className="text-sm text-gray-400">
                  © 2024 Learn Options Trading. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}