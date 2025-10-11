import React, { useState } from 'react'
import { FinFeedService } from '../services/finfeedService'
import { supabase } from '../lib/supabase'

interface SetupWizardProps {
  onComplete: () => void
  onCancel: () => void
}

type WizardStep = 'intro' | 'credentials' | 'verify' | 'complete'

export const PredictionMarketsSetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('intro')
  const [apiKey, setApiKey] = useState('')
  const [environment, setEnvironment] = useState<'live' | 'demo'>('demo')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountInfo, setAccountInfo] = useState<any>(null)

  const handleNext = async () => {
    setError(null)

    if (currentStep === 'intro') {
      setCurrentStep('credentials')
    } else if (currentStep === 'credentials') {
      if (!apiKey.trim()) {
        setError('Please enter your FinFeed API key')
        return
      }
      setCurrentStep('verify')
      await verifyCredentials()
    } else if (currentStep === 'verify') {
      setCurrentStep('complete')
      setTimeout(() => {
        onComplete()
      }, 2000)
    }
  }

  const verifyCredentials = async () => {
    setIsVerifying(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Save credentials
      const saved = await FinFeedService.saveCredentials(user.id, apiKey, environment)
      if (!saved) {
        throw new Error('Failed to save credentials')
      }

      // Validate by fetching account info
      const isValid = await FinFeedService.validateCredentials(user.id, environment)
      if (!isValid) {
        throw new Error('Invalid credentials - could not authenticate with FinFeed API')
      }

      // Get account details
      const account = await FinFeedService.getAccount(user.id, environment)
      setAccountInfo(account)

    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.message || 'Failed to verify credentials')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleBack = () => {
    setError(null)
    if (currentStep === 'credentials') {
      setCurrentStep('intro')
    } else if (currentStep === 'verify') {
      setCurrentStep('credentials')
    }
  }

  const renderIntro = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Welcome to Prediction Markets
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Trade on the outcomes of real-world events across multiple prediction markets.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          What are Prediction Markets?
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
          Prediction markets let you trade on the probability of events like elections, economic indicators,
          sports outcomes, and more. Each contract pays $1 if the event occurs, and $0 if it doesn't.
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
          <li>Trade YES or NO on event outcomes</li>
          <li>Prices reflect market consensus probability</li>
          <li>Access markets from Polymarket, Manifold, Metaculus, PredictIt & more</li>
          <li>Demo mode available for risk-free practice</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 dark:text-white">Prerequisites:</h4>
        <div className="space-y-2">
          <label className="flex items-start space-x-2">
            <input type="checkbox" className="mt-1" required />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I want to explore prediction markets across multiple platforms
            </span>
          </label>
          <label className="flex items-start space-x-2">
            <input type="checkbox" className="mt-1" required />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I understand demo mode is available for practice trading
            </span>
          </label>
          <label className="flex items-start space-x-2">
            <input type="checkbox" className="mt-1" required />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I am over 18 years old
            </span>
          </label>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          Important Notice
        </h4>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 ml-4 list-disc">
          <li>Prediction markets involve real money and risk of loss</li>
          <li>Only trade with funds you can afford to lose</li>
          <li>This platform is for educational purposes</li>
          <li>Past performance does not guarantee future results</li>
        </ul>
      </div>
    </div>
  )

  const renderCredentials = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Configure FinFeed Settings
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Set up your FinFeed connection to access multiple prediction markets.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Environment
          </label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as 'live' | 'demo')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="demo">Demo (Paper Trading)</option>
            <option value="live">Live (Real Money)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {environment === 'demo'
              ? 'Use demo environment to test without real money'
              : 'WARNING: Live environment uses real money'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            FinFeed API Key (optional for demo)
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="email@example.com:your-api-key"
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700
                       dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showApiKey ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Format: your-email:your-api-key
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          API Key Information
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          FinFeed provides access to multiple prediction markets platforms. For demo mode, no API key is required - you can start trading immediately with simulated data from Polymarket, Manifold, Metaculus, and PredictIt.
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          For live trading, you would need API credentials from individual platforms. Contact FinFeed support for production access.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  )

  const renderVerify = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Verifying Credentials
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we connect to FinFeed and verify your settings.
        </p>
      </div>

      {isVerifying ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Connecting to FinFeed...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Verification Failed</h4>
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() => setCurrentStep('credentials')}
            className="mt-4 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
          >
            Go back and try again
          </button>
        </div>
      ) : accountInfo ? (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              ✓ Credentials Verified Successfully!
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Your FinFeed connection is now active.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Account Information</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Member ID:</dt>
                <dd className="font-mono text-gray-900 dark:text-white">{accountInfo.member_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Balance:</dt>
                <dd className="font-mono text-gray-900 dark:text-white">
                  ${accountInfo.balance.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Available:</dt>
                <dd className="font-mono text-gray-900 dark:text-white">
                  ${accountInfo.available_balance.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Environment:</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">
                  {environment === 'demo' ? '🧪 Demo' : '💰 Live'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Next Steps</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
              <li>Browse available prediction markets</li>
              <li>View market probabilities and orderbooks</li>
              <li>Place orders to buy or sell contracts</li>
              <li>Monitor your positions and P&L</li>
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )

  const renderComplete = () => (
    <div className="space-y-6 text-center py-8">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
          <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Setup Complete!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your FinFeed prediction markets integration is ready to use.
        </p>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['intro', 'credentials', 'verify', 'complete'].map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold
                      ${currentStep === step || (['credentials', 'verify', 'complete'].includes(currentStep) && ['intro', 'credentials', 'verify'].indexOf(step) < ['intro', 'credentials', 'verify', 'complete'].indexOf(currentStep))
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs mt-1 text-gray-600 dark:text-gray-400 capitalize">
                    {step}
                  </span>
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    (['credentials', 'verify', 'complete'].includes(currentStep) && ['intro', 'credentials'].indexOf(step) < ['intro', 'credentials', 'verify'].indexOf(currentStep))
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          {currentStep === 'intro' && renderIntro()}
          {currentStep === 'credentials' && renderCredentials()}
          {currentStep === 'verify' && renderVerify()}
          {currentStep === 'complete' && renderComplete()}
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 'complete' && (
          <div className="mt-8 flex justify-between">
            <button
              onClick={currentStep === 'intro' ? onCancel : handleBack}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isVerifying}
            >
              {currentStep === 'intro' ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={handleNext}
              disabled={isVerifying || (currentStep === 'verify' && !accountInfo)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 'verify'
                ? accountInfo
                  ? 'Continue'
                  : 'Verifying...'
                : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
