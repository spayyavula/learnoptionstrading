import React from 'react'
import { Link } from 'react-router-dom'
import { Wrench, ArrowLeft, Clock, CheckCircle } from 'lucide-react'

export default function Construction() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Construction Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-500 rounded-full mb-6">
            <Wrench className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Under Construction
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            We're working hard to bring you an amazing options trading experience!
          </p>
        </div>

        {/* Progress Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">What's Coming Soon</h2>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">Advanced Options Trading Platform</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">Real-time Market Data Integration</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">Portfolio Analytics & Risk Management</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <span className="text-gray-300">Options Strategy Builder</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <span className="text-gray-300">Educational Resources & Tutorials</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <span className="text-gray-300">Community Trading Features</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Development Progress</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4">
          <p className="text-gray-300 mb-6">
            Want to be notified when we launch? Join our waitlist for early access!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-white hover:bg-white hover:text-gray-900 rounded-lg font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Join Waitlist
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <p className="text-gray-400 text-sm">
            Expected Launch: Q2 2025 • Follow us for updates
          </p>
        </div>
      </div>
    </div>
  )
}