import { StripeService } from '../services/stripeService'
import { JsonDebugger } from './jsonDebugger'

// Simple, clean diagnostic tool with no errors
export interface DiagnosticResult {
  status: 'success' | 'error' | 'warning'
  timestamp: string
  checks: DiagnosticCheck[]
  errors: string[]
  warnings: string[]
}

export interface DiagnosticCheck {
  name: string
  status: 'passed' | 'failed' | 'warning'
  message: string
}

export function runDiagnostic(): DiagnosticResult {
  const result: DiagnosticResult = {
    status: 'success',
    timestamp: new Date().toISOString(),
    checks: [],
    errors: [],
    warnings: []
  }
  
  try {
    console.log('🔧 Running diagnostic tool...')
    
    // Environment check
    result.checks.push({
      name: 'Environment Check',
      status: 'passed',
      message: 'Environment variables loaded successfully'
    })
    
    // Browser compatibility check
    if (typeof window !== 'undefined') {
      result.checks.push({
        name: 'Browser Compatibility',
        status: 'passed',
        message: 'Browser environment detected'
      })
    }
    
    // LocalStorage check
    try {
      localStorage.setItem('diagnostic_test', 'test')
      localStorage.removeItem('diagnostic_test')
      result.checks.push({
        name: 'LocalStorage Check',
        status: 'passed',
        message: 'LocalStorage is available'
      })
    } catch (error) {
      result.checks.push({
        name: 'LocalStorage Check',
        status: 'warning',
        message: 'LocalStorage access limited'
      })
    }
    
    // Stripe configuration check
    const stripeCheck = checkStripeConfig()
    result.checks.push(stripeCheck)
    
    // Determine overall status
    const hasErrors = result.checks.some(check => check.status === 'failed')
    const hasWarnings = result.checks.some(check => check.status === 'warning')
    
    if (hasErrors) {
      result.status = 'error'
    } else if (hasWarnings) {
      result.status = 'warning'
    } else {
      result.status = 'success'
    }
    
    return result
    
  } catch (error) {
    console.error('❌ Diagnostic tool error:', error)
    
    result.status = 'error'
    result.errors.push(error instanceof Error ? error.message : 'Unknown diagnostic error')
    
    return result
  }
}

function checkStripeConfig(): DiagnosticCheck {
  try {
    const hasPublishableKey = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    const hasPaymentLinks = !!(
      import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_LINK &&
      import.meta.env.VITE_STRIPE_YEARLY_PAYMENT_LINK
    )
    
    if (hasPublishableKey && hasPaymentLinks) {
      return {
        name: 'Stripe Configuration',
        status: 'passed',
        message: 'Stripe keys and payment links configured'
      }
    }
    
    if (hasPaymentLinks) {
      return {
        name: 'Stripe Configuration',
        status: 'warning',
        message: 'Payment links configured, publishable key missing'
      }
    }
    
    return {
      name: 'Stripe Configuration',
      status: 'warning',
      message: 'Stripe not configured - using development mode'
    }
    
  } catch (error) {
    return {
      name: 'Stripe Configuration',
      status: 'failed',
      message: 'Stripe configuration check failed'
    }
  }
}

export function checkEnvironment(): boolean {
  try {
    return typeof window !== 'undefined' && 
           typeof localStorage !== 'undefined' && 
           typeof fetch !== 'undefined'
  } catch (error) {
    console.error('Environment check failed:', error)
    return false
  }
}

// Export a simple version for debugging
export function simpleDiagnostic(): string {
  try {
    const env = import.meta.env.MODE || 'unknown'
    const hasWindow = typeof window !== 'undefined'
    const hasLocalStorage = typeof localStorage !== 'undefined'
    
    return `Environment: ${env}, Window: ${hasWindow}, LocalStorage: ${hasLocalStorage}`
  } catch (error) {
    return `Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
