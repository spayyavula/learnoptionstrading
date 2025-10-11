import React, { useState } from 'react'
import { CheckCircle, AlertCircle, ArrowRight, ArrowLeft, ExternalLink, Shield, Key, Link as LinkIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CryptoJS from 'crypto-js'

interface ZerodhaSetupWizardProps {
  onComplete: () => void
  onCancel: () => void
}

type Step = 1 | 2 | 3 | 4

export default function ZerodhaSetupWizard({ onComplete, onCancel }: ZerodhaSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [requestToken, setRequestToken] = useState('')
  const [environment, setEnvironment] = useState<'paper' | 'live'>('paper')

  // Encryption key (in production, use a secure key management system)
  const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-secure-encryption-key-here'

  const encrypt = (text: string): string => {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
  }

  const handleNext = () => {
    setError('')

    if (currentStep === 1 && !apiKey) {
      setError('Please enter your API Key')
      return
    }

    if (currentStep === 2 && !apiSecret) {
      setError('Please enter your API Secret')
      return
    }

    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const handleBack = () => {
    setError('')
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const openKiteLogin = () => {
    const redirectUrl = `${window.location.origin}/auth/zerodha/callback`
    const loginUrl = `https://kite.zerodha.com/connect/login?api_key=${apiKey}&redirect_params=${encodeURIComponent(redirectUrl)}`
    window.open(loginUrl, '_blank', 'width=800,height=600')
  }

  const handleComplete = async () => {
    if (!requestToken) {
      setError('Please complete the Kite Connect login and enter the request token')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Encrypt sensitive data
      const encryptedApiSecret = encrypt(apiSecret)

      // Save credentials to database
      const { error: dbError } = await supabase
        .from('zerodha_credentials')
        .upsert({
          user_id: user.id,
          api_key: apiKey,
          api_secret_encrypted: encryptedApiSecret,
          request_token: requestToken,
          is_active: true,
          is_live: environment === 'live',
          last_connected_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,api_key'
        })

      if (dbError) throw dbError

      // Success!
      onComplete()
    } catch (err) {
      console.error('Error saving Zerodha credentials:', err)
      setError(err instanceof Error ? err.message : 'Failed to save credentials')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      number: 1,
      title: 'Get API Key',
      description: 'Create a Kite Connect app to get your API credentials'
    },
    {
      number: 2,
      title: 'API Secret',
      description: 'Enter your API Secret (keep this secure!)'
    },
    {
      number: 3,
      title: 'Connect Account',
      description: 'Authorize the app via Kite Connect login'
    },
    {
      number: 4,
      title: 'Confirm Setup',
      description: 'Review and complete the integration'
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <LinkIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Connect Zerodha Kite</h2>
            <p className="text-orange-100">Setup your Indian markets trading account</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  currentStep > step.number
                    ? 'bg-green-600 text-white'
                    : currentStep === step.number
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.number ? <CheckCircle className="h-6 w-6" /> : step.number}
                </div>
                <p className={`text-xs mt-2 font-medium ${
                  currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: API Key */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Kite Connect App</h3>
              <p className="text-sm text-gray-600 mb-4">
                First, you need to create a Kite Connect app to get your API credentials.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-3 flex-shrink-0">1</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      Visit <a href="https://kite.trade/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
                        kite.trade <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-3 flex-shrink-0">2</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">Log in with your Zerodha credentials</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-3 flex-shrink-0">3</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">Create a new app with redirect URL: <code className="bg-white px-2 py-1 rounded text-xs">{window.location.origin}/auth/zerodha/callback</code></p>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-3 flex-shrink-0">4</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">Copy your API Key from the app dashboard</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="h-4 w-4 inline mr-2" />
                  API Key
                </label>
                <input
                  id="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Kite Connect API Key"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Pricing:</strong> Kite Connect costs ₹2,000 one-time setup + ₹2,000/month subscription.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: API Secret */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter API Secret</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your API Secret is shown only once when you create the app. Keep it secure!
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900 mb-1">Security Warning</p>
                    <p className="text-sm text-red-800">
                      Never share your API Secret with anyone. It will be encrypted before storage using AES-256 encryption.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="apiSecret" className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="h-4 w-4 inline mr-2" />
                  API Secret
                </label>
                <input
                  id="apiSecret"
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Enter your API Secret"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Trading Environment</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setEnvironment('paper')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      environment === 'paper'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">Paper Trading</p>
                    <p className="text-xs text-gray-600 mt-1">Simulated (Recommended)</p>
                  </button>
                  <button
                    onClick={() => setEnvironment('live')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      environment === 'live'
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">Live Trading</p>
                    <p className="text-xs text-red-600 mt-1">Real Money</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Connect Account */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Authorize Connection</h3>
              <p className="text-sm text-gray-600 mb-4">
                Click below to open Kite Connect login. After authorization, you'll receive a request token.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-3 flex-shrink-0">1</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">Click "Open Kite Login" button below</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-3 flex-shrink-0">2</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">Log in with your Zerodha credentials in the popup</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-3 flex-shrink-0">3</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">After authorization, you'll be redirected with a <code className="bg-white px-2 py-1 rounded text-xs">request_token</code> parameter</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-3 flex-shrink-0">4</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">Copy the request token and paste it below</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={openKiteLogin}
                  className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold flex items-center justify-center"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open Kite Login
                </button>
              </div>

              <div className="mt-6">
                <label htmlFor="requestToken" className="block text-sm font-medium text-gray-700 mb-2">
                  Request Token
                </label>
                <input
                  id="requestToken"
                  type="text"
                  value={requestToken}
                  onChange={(e) => setRequestToken(e.target.value)}
                  placeholder="Paste the request_token here"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  The request token will be in the URL after authorization: <code>...?request_token=XXXXXX...</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Configuration</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please verify your settings before completing the setup.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">API Key:</span>
                  <span className="text-sm text-gray-900 font-mono">{apiKey}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">API Secret:</span>
                  <span className="text-sm text-gray-900">{'•'.repeat(apiSecret.length)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Request Token:</span>
                  <span className="text-sm text-gray-900 font-mono truncate max-w-xs">{requestToken || 'Not set'}</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">Environment:</span>
                  <span className={`text-sm font-semibold ${environment === 'live' ? 'text-red-600' : 'text-blue-600'}`}>
                    {environment === 'live' ? 'Live Trading' : 'Paper Trading'}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 mb-1">Ready to Connect</p>
                    <p className="text-sm text-green-800">
                      Your credentials will be encrypted with AES-256 and securely stored. You can update or remove them anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200 flex justify-between">
        <button
          onClick={currentStep === 1 ? onCancel : handleBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>

        {currentStep < 4 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Setup
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
