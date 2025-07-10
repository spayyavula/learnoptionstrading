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

  console.log('🔧 StripeCheckout Debug - Plan:', plan, 'RequireTerms:', requireTerms)

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
  }

  const handleCheckout = async () => {
    if (disabled || loading) return

    console.log('🛒 StripeCheckout - handleCheckout called for plan:', plan)
    
    setLoading(true)
    setError(null)
    
    try {
      // Show terms if required
      if (requireTerms) {
        const termsAccepted = confirm(
          `Terms & Conditions\n\n` +
          `By proceeding, you agree to:\n` +
          `• Our Terms of Service\n` +
          `• Privacy Policy\n` +
          `• Subscription terms\n\n` +
          `Continue with ${plan} subscription?`
        )
        
        if (!termsAccepted) {
          console.log('❌ User declined terms')
          setLoading(false)
          return
        }
      }
      
      console.log('🚀 Calling StripeService.redirectToCheckout for plan:', plan)
      
      // This should ONLY use Payment Links or Mock - NO API calls
      await StripeService.redirectToCheckout(plan)
      
      console.log('✅ StripeService.redirectToCheckout completed')
      onSuccess?.()
      
    } catch (error) {
      console.error('❌ StripeCheckout error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
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
      
      {error && (
        <p className="text-sm text-red-600 text-center">
          {error}
        </p>
      )}
    </div>
  )
}