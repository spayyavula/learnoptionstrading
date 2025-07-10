/* CACHE BUST: ${Date.now()} */
import React, { useState } from 'react'
import { CheckCircle, ArrowLeft, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BASE_PRICES, YEARLY_SAVINGS_PERCENT } from '../utils/priceSync'
import StripeCheckout from '../components/StripeCheckout'
import TermsAgreement from '../components/TermsAgreement'
import CouponInput from '../components/CouponInput'
import DealsSection from '../components/DealsSection'

// Force cache invalidation
const CACHE_BUST_ID = Date.now()
console.log('🔧 PricingPage Cache Bust:', CACHE_BUST_ID)

const PricingPage: React.FC = () => {
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<any>(null)
  const [pendingSubscription, setPendingSubscription] = useState<{
    plan: 'monthly' | 'yearly' | 'pro' | 'enterprise'
    isDeal?: boolean
  } | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)

  const handleSubscribe = async (plan: 'monthly' | 'yearly' | 'pro' | 'enterprise') => {
    // Show terms agreement before proceeding
    setPendingSubscription({ plan })
    setShowTermsModal(true)
  }

  const handleClaimDeal = (deal: any) => {
    setSelectedDeal(deal)
    setPendingSubscription({ plan: deal.plan, isDeal: true })
    setShowTermsModal(true)
  }

  const handleTermsAccepted = () => {
    setShowTermsModal(false)
    if (pendingSubscription) {
      // The StripeCheckout component will handle the actual checkout
      setPendingSubscription(null)
    }
  }

  const handleTermsDeclined = () => {
    setShowTermsModal(false)
    setPendingSubscription(null)
  }

  const handleCheckoutSuccess = () => {
    console.log('✅ Checkout completed successfully from Pricing page')
  }

  const handleCheckoutError = (error: string) => {
    console.error('❌ Checkout error from Pricing page:', error)
    alert(`Checkout Error: ${error}\n\nPlease try again or contact support.`)
  }
  
  const handleCouponApplied = (validation: any) => {
    setAppliedCoupon(validation)
  }
  
  const handleCouponRemoved = () => {
    setAppliedCoupon(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center text-white hover:text-gray-300 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Start your options trading journey with the plan that fits your needs
          </p>
        </div>

        {/* Special Deals Section */}
        <DealsSection 
          onClaimDeal={handleClaimDeal}
          selectedPlan={pendingSubscription?.plan}
          className="mb-8"
        />

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* Monthly Plan */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Monthly</h3>
              <div className="text-4xl font-bold text-white mb-2">
                <span className="text-2xl">$</span>{BASE_PRICES.monthly}
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <p className="text-gray-400">Perfect for getting started</p>
            </div>

            <CouponInput
              plan="monthly"
              originalAmount={BASE_PRICES.monthly}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              appliedCoupon={appliedCoupon}
              className="mb-8"
            />

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Educational market data
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Basic learning modules
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                5 practice portfolios
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Learning support
              </li>
            </ul>

            <StripeCheckout
              plan="monthly"
              onSuccess={handleCheckoutSuccess}
              onError={handleCheckoutError}
              className="w-full"
              variant="primary"
              requireTerms={true}
            >
              Get Started
            </StripeCheckout>
          </div>

          {/* Annual Plan */}
          <div className="bg-gray-800 rounded-2xl p-8 border-2 border-green-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                <Star className="h-4 w-4 mr-1" />
                Best Value
              </span>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Annual</h3>
              <div className="mb-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold">
                  Save {YEARLY_SAVINGS_PERCENT}%
                </span>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                <span className="text-2xl">$</span>{Math.round(BASE_PRICES.yearly / 12)}
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <div className="text-sm text-gray-400 mb-2">
                Billed annually at ${BASE_PRICES.yearly}
              </div>
              <p className="text-gray-400">Best value for committed learners</p>
            </div>

            <CouponInput
              plan="yearly"
              originalAmount={BASE_PRICES.yearly}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              appliedCoupon={appliedCoupon}
              className="mb-8"
            />

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Everything in Monthly
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                2 months free
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Priority support
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Early access to features
              </li>
            </ul>

            <StripeCheckout
              plan="yearly"
              onSuccess={handleCheckoutSuccess}
              onError={handleCheckoutError}
              className="w-full"
              variant="success"
              requireTerms={true}
            >
              Save with Annual
            </StripeCheckout>
          </div>

          {/* Pro Plan */}
          <div className="bg-gray-800 rounded-2xl p-8 border-2 border-blue-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="text-4xl font-bold text-white mb-2">
                <span className="text-2xl">$</span>{BASE_PRICES.pro}
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <p className="text-gray-400">For serious traders</p>
            </div>

            <CouponInput
              plan="pro"
              originalAmount={BASE_PRICES.pro}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              appliedCoupon={appliedCoupon}
              className="mb-8"
            />

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Everything in Monthly
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Advanced learning modules
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Unlimited practice portfolios
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Strategy learning tools
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Priority support
              </li>
            </ul>

            <StripeCheckout
              plan="pro"
              onSuccess={handleCheckoutSuccess}
              onError={handleCheckoutError}
              className="w-full"
              variant="primary"
              requireTerms={true}
            >
              Upgrade to Pro
            </StripeCheckout>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-white mb-2">
                <span className="text-2xl">$</span>{BASE_PRICES.enterprise}
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <p className="text-gray-400">For institutions</p>
            </div>

            <CouponInput
              plan="enterprise"
              originalAmount={BASE_PRICES.enterprise}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              appliedCoupon={appliedCoupon}
              className="mb-8"
            />

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Everything in Pro
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Custom learning paths
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Dedicated instructor support
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                White-label options
              </li>
            </ul>

            <StripeCheckout
              plan="enterprise"
              onSuccess={handleCheckoutSuccess}
              onError={handleCheckoutError}
              className="w-full"
              isDeal={pendingSubscription?.isDeal}
              variant="secondary"
              requireTerms={true}
            >
              Contact Sales
            </StripeCheckout>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Compare Plans
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-white font-semibold py-4 px-4">Features</th>
                  <th className="text-white font-semibold py-4 px-4 text-center">Monthly</th>
                  <th className="text-white font-semibold py-4 px-4 text-center">Annual</th>
                  <th className="text-white font-semibold py-4 px-4 text-center">Pro</th>
                  <th className="text-white font-semibold py-4 px-4 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4">Educational Market Data</td>
                  <td className="py-4 px-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4">Practice Portfolios</td>
                  <td className="py-4 px-4 text-center text-gray-400">5</td>
                  <td className="py-4 px-4 text-center text-gray-400">5</td>
                  <td className="py-4 px-4 text-center text-gray-400">Unlimited</td>
                  <td className="py-4 px-4 text-center text-gray-400">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4">Advanced Learning Modules</td>
                  <td className="py-4 px-4 text-center text-gray-500">—</td>
                  <td className="py-4 px-4 text-center text-gray-500">—</td>
                  <td className="py-4 px-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4">Priority Support</td>
                  <td className="py-4 px-4 text-center text-gray-500">—</td>
                  <td className="py-4 px-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4">Custom Learning Paths</td>
                  <td className="py-4 px-4 text-center text-gray-500">—</td>
                  <td className="py-4 px-4 text-center text-gray-500">—</td>
                  <td className="py-4 px-4 text-center text-gray-500">—</td>
                  <td className="py-4 px-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="bg-gray-800 rounded-2xl p-8 text-left max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Can I change my plan later?</h3>
                <p className="text-gray-300">
                  Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Is there a free trial?</h3>
                <p className="text-gray-300">
                  We offer a 7-day money-back guarantee. If you're not satisfied, we'll refund your payment in full.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-300">
                  We accept all major credit cards, PayPal, and bank transfers through our secure Stripe payment processor.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-300">
                  Yes, you can cancel your subscription at any time. Your account will remain active until the end of your billing period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={handleTermsDeclined} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <TermsAgreement 
                  onAccept={handleTermsAccepted}
                  onDecline={handleTermsDeclined}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PricingPage