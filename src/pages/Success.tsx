import React, { useEffect, useState } from 'react'
import { CheckCircle, ArrowRight, Home, Settings } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

export default function Success() {
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan') || 'monthly'
  const couponCode = searchParams.get('coupon')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading/verification
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const planDetails = {
    monthly: { name: 'Monthly Plan', price: '$29/month' },
    yearly: { name: 'Annual Plan', price: '$290/year' },
    pro: { name: 'Pro Plan', price: '$49/month' },
    enterprise: { name: 'Enterprise Plan', price: '$199/month' }
  }

  const currentPlan = planDetails[plan as keyof typeof planDetails] || planDetails.monthly
  
  // Format coupon display if present
  const couponDisplay = couponCode ? (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0 text-green-500 mr-3">🏷️</div>
        <div>
          <h3 className="font-medium text-green-800">Coupon Applied</h3>
          <p className="text-sm text-green-700">
            Your coupon code <span className="font-semibold">{couponCode}</span> has been applied to your subscription.
          </p>
        </div>
      </div>
    </div>
  ) : null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Processing your subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Learn Options Trading Academy!
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Your {currentPlan.name} subscription is now active
          </p>
          
          {couponDisplay}
          
          <p className="text-lg text-gray-500 mb-8">
            Thank you for subscribing to {currentPlan.price}
          </p>

          {/* What's Next */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>Your account has been activated with full access</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>You'll receive a confirmation email shortly</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>Start exploring our trading platform and educational resources</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>Manage your subscription anytime in Settings</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/app"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              Start Trading
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            
            <Link 
              to="/app/settings"
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Link>
            
            <Link 
              to="/"
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <Home className="mr-2 h-5 w-5" />
              Home
            </Link>
          </div>

          {/* Support */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@learnoptionstrading.academy" className="text-blue-600 hover:underline">
                support@learnoptionstrading.academy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}