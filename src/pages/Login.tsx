import React, { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'

export default function Login() {
  const { user, signIn, signUp, resetPassword, loading } = useAuth()
  const location = useLocation()
  const [isSignUp, setIsSignUp] = useState(location.pathname === '/signup')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirect if already logged in
  if (user) {
    const from = location.state?.from?.pathname || '/app'
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Handle forgot password
    if (showForgotPassword) {
      if (!formData.email) {
        setError('Please enter your email address')
        return
      }
      
      try {
        const { error } = await resetPassword(formData.email)
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Password reset email sent! Check your inbox for instructions.')
          setShowForgotPassword(false)
        }
      } catch (err) {
        setError('Failed to send password reset email. Please try again.')
      }
      return
    }

    console.log('🔐 Form submit:', { isSignUp, email: formData.email })
    if (isSignUp) {
      if (!acceptedTerms) {
        setError('You must accept the Terms and Conditions to create an account')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    }

    try {
      if (isSignUp) {
        console.log('🔐 Attempting sign up...')
        const { error } = await signUp(formData.email, formData.password)
        if (error) {
          console.error('🔐 Sign up error:', error)
          if (error.message.includes('User already registered')) {
            setError('An account with this email already exists. Please try signing in instead, or use a different email address.')
          } else if (error.message.includes('Invalid email')) {
            setError('Please enter a valid email address.')
          } else if (error.message.includes('Password should be at least')) {
            setError('Password must be at least 6 characters long.')
          } else if (error.message.includes('configuration') || error.message.includes('service unavailable')) {
            setError('Our authentication service is temporarily unavailable. Please try again in a few minutes.')
          } else {
            setError('Unable to create account. Please check your information and try again.')
          }
        } else {
          console.log('🔐 Sign up successful')
          setSuccess('Welcome! Your account has been created successfully. You can now start learning options trading.')
          setIsSignUp(false)
        }
      } else {
        console.log('🔐 Attempting sign in...')
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          console.error('🔐 Sign in error:', error)
          if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid email or password')) {
            setError('The email or password you entered is incorrect. Please check your credentials and try again.')
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please check your email and click the confirmation link before signing in.')
          } else if (error.message.includes('Too many requests')) {
            setError('Too many sign-in attempts. Please wait a few minutes before trying again.')
          } else if (error.message.includes('configuration') || error.message.includes('service unavailable')) {
            setError('Our authentication service is temporarily unavailable. Please try again in a few minutes.')
          } else {
            setError('Unable to sign in. Please check your email and password and try again.')
          }
        } else {
          console.log('🔐 Sign in successful')
        }
      }
    } catch (err) {
      console.error('🔐 Form submit exception:', err)
      if (err instanceof Error) {
        if (err.message.includes('not configured')) {
          setError('This appears to be a demo environment. Authentication is not fully configured. You can still explore the platform features.')
        } else if (err.message.includes('fetch') || err.message.includes('network')) {
          setError('Unable to connect to the authentication service. Please check your internet connection and try again.')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred. Please try again or contact support if the problem persists.')
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Learn Options Trading
          </h1>
          <p className="text-gray-600">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {showForgotPassword ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset Password</h2>
                <p className="text-gray-600">Enter your email to receive reset instructions</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                      <div className="text-sm text-red-600">
                        <p className="font-medium">Unable to {isSignUp ? 'create account' : 'sign in'}</p>
                        <p className="mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <div className="text-sm text-green-600">
                        <p className="font-medium">Success!</p>
                        <p className="mt-1">{success}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Sending Reset Email...
                    </div>
                  ) : (
                    'Send Reset Email'
                  )}
                </button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setError('')
                    setSuccess('')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to sign in
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required={isSignUp}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required={isSignUp}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {/* Terms and Conditions (Sign Up Only) */}
              {isSignUp && (
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="terms" className="text-gray-700">
                        I agree to the{' '}
                        <Link to="/TermsAndConditions" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                          Terms and Conditions
                        </Link>
                        {' '}and{' '}
                        <Link to="/PrivacyPolicy" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                          Privacy Policy
                        </Link>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Options trading involves substantial risk and may not be suitable for all investors.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <div className="text-sm text-red-600">
                      <p className="font-medium">Authentication Error</p>
                      <p className="mt-1">{error}</p>
                      {error.includes('email or password you entered is incorrect') && (
                        <div className="mt-2 text-xs">
                          <p>💡 <strong>Helpful tips:</strong></p>
                          <p>• Double-check your email address for typos</p>
                          <p>• Make sure your password is correct</p>
                          <p>• If you don't have an account, try signing up instead</p>
                          <p>• Use "Forgot Password" if you can't remember your password</p>
                        </div>
                      )}
                      {error.includes('Invalid login credentials') && (
                        <div className="mt-2 text-xs">
                          <p>If you don't have an account, try signing up first.</p>
                          <p>If you forgot your password, use the "Forgot Password" link below.</p>
                        </div>
                      )}
                      {error.includes('configuration') && (
                        <div className="mt-2 text-xs">
                          <p>Supabase configuration issues detected:</p>
                          <ul className="list-disc ml-4 mt-1">
                            <li>Check VITE_SUPABASE_URL environment variable</li>
                            <li>Check VITE_SUPABASE_ANON_KEY environment variable</li>
                            <li>Ensure Supabase project is active</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <div className="text-sm text-green-600">
                      <p className="font-medium">Success!</p>
                      <p className="mt-1">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (isSignUp && !acceptedTerms)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>
          )}

          {/* Toggle Sign In/Sign Up */}
          {!showForgotPassword && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setSuccess('')
                  setAcceptedTerms(false)
                  setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    fullName: ''
                  })
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          )}

          {/* Forgot Password Link */}
          {!isSignUp && !showForgotPassword && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true)
                  setError('')
                  setSuccess('')
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Back to Landing */}
          <div className="mt-4 text-center">
            <Link 
              to="/" 
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}