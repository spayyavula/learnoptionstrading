import React, { useState } from 'react'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { StripeService } from '../services/stripeService'

interface StripeCheckoutProps {
  plan: 'monthly' | 'yearly' | 'pro' | 'enterprise'
  onSuccess?: () => void
  onError?: (error: string) => void
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'success' | 'outline'
  requireTerms?: boolean
}

export default function StripeCheckout({ 
  plan, 
  onSuccess, 
  onError, 
  children, 
  className = '',
  disabled = false,
  variant = 'primary',
  requireTerms = false
}: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  console.log('🔧 StripeCheckout Debug - Plan:', plan, 'RequireTerms:', requireTerms)

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
  }

  const handleCheckout = async () => {
    if (disabled || loading) return
    setError(null)
    if (requireTerms && !termsAccepted) {
      setShowTermsModal(true)
      return
    }
    setLoading(true)
    try {
      await StripeService.redirectToCheckout(plan)
      onSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptTerms = () => {
    setTermsAccepted(true)
    setShowTermsModal(false)
    setTimeout(() => handleCheckout(), 0)
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={`
          flex items-center justify-center
          font-semibold py-3 px-6 rounded-lg
          transition-colors duration-200
          disabled:bg-gray-400 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${className}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : error ? (
          <>
            <AlertCircle className="h-4 w-4 mr-2" />
            Try Again
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            {children || 'Subscribe Now'}
          </>
        )}
      </button>
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Terms & Agreement</h2>
            <div className="prose max-w-none text-gray-800 text-sm mb-4" style={{maxHeight:'50vh',overflowY:'auto'}}>
              <h3>1. Educational Purpose Only</h3>
              <p>This platform is for educational purposes only. No real money is traded. All trading is simulated and does not reflect actual market conditions or outcomes.</p>
              <h3>2. No Financial Advice</h3>
              <p>Nothing on this site constitutes financial, investment, or trading advice. You should consult with a qualified financial advisor before making any investment decisions.</p>
              <h3>3. Risks of Options Trading</h3>
              <p>Options trading involves substantial risk and is not suitable for all investors. You may lose the entire value of your investment. Past performance is not indicative of future results.</p>
              <h3>4. User Conduct</h3>
              <p>You agree to use this platform lawfully and respectfully. Any misuse may result in termination of access.</p>
              <h3>5. Privacy</h3>
              <p>See our <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Privacy Policy</a> for details on how your data is handled.</p>
              <h3>6. Disclaimer</h3>
              <p>Learn Options Trading Academy is an educational platform. All trading is simulated. No real money is traded, and no actual trades are executed on any financial exchange.</p>
              <h3>No Investment Advice</h3>
              <p>The content provided is for informational and educational purposes only and does not constitute financial, investment, or trading advice. We do not recommend or endorse any specific securities, strategies, or investments.</p>
              <h3>Risk Warning</h3>
              <p>Options trading involves substantial risk and is not suitable for all investors. You may lose the entire value of your investment. Past performance is not indicative of future results. Always consult a qualified financial advisor before making investment decisions.</p>
              <h3>No Guarantees</h3>
              <p>We make no guarantees regarding the accuracy, completeness, or reliability of any information on this platform. Use at your own risk.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold"
                onClick={() => setShowTermsModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                onClick={handleAcceptTerms}
              >
                I Agree & Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 text-center">
          {error}
        </p>
      )}
    </div>
  )
}