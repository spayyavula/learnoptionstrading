import React, { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { AlertCircle, CheckCircle, Lock } from 'lucide-react'

export default function Login() {
  const { user, signIn, signUp, resetPassword, loading, isConfigured } = useAuth()
  const location = useLocation()
  const isSignUp = location.pathname === '/signup'
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirect if already logged in
  if (user) {
    const from = location.state?.from?.pathname || '/app'
    return <Navigate to={from} replace />
  }

  const handleSignIn = async () => {
    setError('')
    setSuccess('')

    try {
      console.log('🔐 Login page: Initiating sign in...')
      const { error } = await signIn()

      if (error) {
        console.error('🔐 Login page: Sign in error:', error)
        if (error.message.includes('cancelled')) {
          // User cancelled - don't show error
          return
        }
        setError(error.message)
      }
    } catch (err) {
      console.error('🔐 Login page: Sign in exception:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    }
  }

  const handleSignUp = async () => {
    setError('')
    setSuccess('')

    try {
      console.log('🔐 Login page: Initiating sign up...')
      const { error } = await signUp()

      if (error) {
        console.error('🔐 Login page: Sign up error:', error)
        if (error.message.includes('cancelled')) {
          return
        }
        setError(error.message)
      }
    } catch (err) {
      console.error('🔐 Login page: Sign up exception:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    }
  }

  const handleResetPassword = async () => {
    setError('')
    setSuccess('')

    try {
      console.log('🔐 Login page: Initiating password reset...')
      const { error } = await resetPassword()

      if (error) {
        console.error('🔐 Login page: Password reset error:', error)
        setError(error.message)
      } else {
        setSuccess('Password reset initiated. Please follow the instructions in the popup.')
      }
    } catch (err) {
      console.error('🔐 Login page: Password reset exception:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-semibold text-gray-900">
            Options Academy
          </Link>
          <p className="mt-4 text-gray-600">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          {/* Configuration Warning */}
          {!isConfigured && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Demo Mode</p>
                  <p className="mt-1">Authentication is not fully configured. You can explore the app features without signing in.</p>
                </div>
              </div>
            </div>
          )}

          {/* Sign In / Sign Up Buttons */}
          <div className="space-y-4">
            <button
              onClick={isSignUp ? handleSignUp : handleSignIn}
              disabled={loading || !isConfigured}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  {isSignUp ? 'Create Account with Microsoft' : 'Sign In with Microsoft'}
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500">
              Secure authentication powered by Microsoft Azure AD B2C
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                <div className="text-sm text-red-600">
                  <p className="font-medium">Authentication Error</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <div className="text-sm text-green-600">
                  <p className="font-medium">Success</p>
                  <p className="mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            {/* Toggle Sign In/Sign Up */}
            <div className="text-center">
              <Link
                to={isSignUp ? '/login' : '/signup'}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </Link>
            </div>

            {/* Forgot Password Link */}
            {!isSignUp && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading || !isConfigured}
                  className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>

          {/* Back to Landing */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to home
            </Link>
          </div>
        </div>

        {/* Terms */}
        <p className="mt-6 text-xs text-center text-gray-400">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="text-blue-600 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
