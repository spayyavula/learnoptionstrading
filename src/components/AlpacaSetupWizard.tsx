import React, { useState } from 'react'
import { Shield, Key, CheckCircle, AlertTriangle, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { AlpacaService } from '../services/alpacaService'
import { AlpacaComplianceService } from '../services/alpacaComplianceService'
import { supabase } from '../lib/supabase'

interface AlpacaSetupWizardProps {
  onComplete?: () => void
  onCancel?: () => void
}

export default function AlpacaSetupWizard({ onComplete, onCancel }: AlpacaSetupWizardProps) {
  const [step, setStep] = useState(1)
  const [environment, setEnvironment] = useState<'paper' | 'live'>('paper')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [tradingLevel, setTradingLevel] = useState(0)
  const [complianceAcknowledged, setComplianceAcknowledged] = useState({
    optionsRisk: false,
    pdtRules: false,
    marginTrading: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<any>(null)

  const handleValidateCredentials = async () => {
    if (!apiKey || !apiSecret) {
      setError('Please enter both API Key and API Secret')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const saved = await AlpacaService.saveCredentials(
        user.id,
        apiKey,
        apiSecret,
        environment,
        tradingLevel
      )

      if (!saved) throw new Error('Failed to save credentials')

      const isValid = await AlpacaService.validateCredentials(user.id, environment)

      if (isValid) {
        const accountInfo = await AlpacaService.getAccount(user.id, environment)
        setValidationResult(accountInfo)
        setStep(3)
      } else {
        setError('Invalid credentials. Please check your API key and secret.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteSetup = async () => {
    if (!complianceAcknowledged.optionsRisk || !complianceAcknowledged.pdtRules) {
      setError('Please acknowledge all required disclosures')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      await AlpacaService.acknowledgeCompliance(user, 'options_risk', '1.0')
      await AlpacaService.acknowledgeCompliance(user, 'pdt_rules', '1.0')

      if (complianceAcknowledged.marginTrading) {
        await AlpacaService.acknowledgeCompliance(user, 'margin_trading', '1.0')
      }

      if (onComplete) onComplete()
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Alpaca Account</h2>
        <p className="text-gray-600">
          Link your Alpaca brokerage account to enable live options trading
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Before You Start:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
          <li>You need an approved Alpaca brokerage account</li>
          <li>Your account must be approved for options trading</li>
          <li>Have your API credentials ready</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Environment
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setEnvironment('paper')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                environment === 'paper'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">Paper Trading</div>
              <div className="text-sm text-gray-600 mt-1">
                Practice with simulated money
              </div>
            </button>
            <button
              onClick={() => setEnvironment('live')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                environment === 'live'
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">Live Trading</div>
              <div className="text-sm text-red-600 mt-1">
                Trade with real money
              </div>
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <strong>Important:</strong> Start with paper trading to familiarize yourself with the platform before trading with real money.
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
        )}
        <button
          onClick={() => setStep(2)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter API Credentials</h2>
        <p className="text-gray-600">
          Get your API keys from your Alpaca dashboard
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">How to get your API keys:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Log in to your Alpaca account</li>
          <li>Navigate to the API Keys section</li>
          <li>Generate new keys for {environment === 'paper' ? 'Paper Trading' : 'Live Trading'}</li>
          <li>Copy and paste them below</li>
        </ol>
        <a
          href={`https://${environment === 'paper' ? 'paper-' : ''}app.alpaca.markets/paper/dashboard/overview`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mt-2"
        >
          Open Alpaca Dashboard <ExternalLink className="h-4 w-4 ml-1" />
        </a>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key ID
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
              placeholder="PKXXXXXXXXXXXXXXXXXX"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secret Key
          </label>
          <div className="relative">
            <input
              type={showApiSecret ? 'text' : 'password'}
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
              placeholder="Enter your secret key"
            />
            <button
              type="button"
              onClick={() => setShowApiSecret(!showApiSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options Trading Level
          </label>
          <select
            value={tradingLevel}
            onChange={(e) => setTradingLevel(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="0">Level 0 - No Options Trading</option>
            <option value="1">Level 1 - Covered Calls & Cash-Secured Puts</option>
            <option value="2">Level 2 - Buy Calls & Puts</option>
            <option value="3">Level 3 - Spreads & Advanced Strategies</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Select your current Alpaca account options approval level
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            Your credentials are encrypted using AES-256 encryption before being stored. We never store your credentials in plain text.
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 text-gray-700 hover:text-gray-900"
          disabled={loading}
        >
          Back
        </button>
        <button
          onClick={handleValidateCredentials}
          disabled={loading || !apiKey || !apiSecret}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Validating...' : 'Validate & Continue'}
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => {
    const restrictions = AlpacaComplianceService.getTradingLevelRestrictions(tradingLevel)

    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Credentials Verified</h2>
          <p className="text-gray-600">
            Your Alpaca account has been successfully connected
          </p>
        </div>

        {validationResult && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Account Information:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Account:</span>
                <span className="ml-2 font-medium">{validationResult.account_number}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{validationResult.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Buying Power:</span>
                <span className="ml-2 font-medium">${parseFloat(validationResult.buying_power).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Trading Level:</span>
                <span className="ml-2 font-medium">Level {validationResult.options_approved_level || 0}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Trading Level Restrictions:</h3>
          <div className="text-sm text-yellow-800 space-y-2">
            <div>
              <strong>Allowed Strategies:</strong>
              <ul className="list-disc list-inside mt-1">
                {restrictions.allowedStrategies.map((strategy, idx) => (
                  <li key={idx}>{strategy}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Restrictions:</strong>
              <ul className="list-disc list-inside mt-1">
                {restrictions.restrictions.map((restriction, idx) => (
                  <li key={idx}>{restriction}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setStep(2)}
            className="px-6 py-2 text-gray-700 hover:text-gray-900"
          >
            Back
          </button>
          <button
            onClick={() => setStep(4)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue to Disclosures
          </button>
        </div>
      </div>
    )
  }

  const renderStep4 = () => {
    const optionsRisk = AlpacaComplianceService.getRegulatoryDisclosure('options_risk')
    const pdtRules = AlpacaComplianceService.getRegulatoryDisclosure('pdt_rules')

    return (
      <div className="space-y-6">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Important Disclosures</h2>
          <p className="text-gray-600">
            Please read and acknowledge the following disclosures
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{optionsRisk.title}</h3>
            <div className="text-sm text-gray-700 prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{optionsRisk.content}</pre>
            </div>
            <label className="flex items-center mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={complianceAcknowledged.optionsRisk}
                onChange={(e) => setComplianceAcknowledged({
                  ...complianceAcknowledged,
                  optionsRisk: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-900">
                I have read and understand the options trading risks
              </span>
            </label>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{pdtRules.title}</h3>
            <div className="text-sm text-gray-700 prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{pdtRules.content}</pre>
            </div>
            <label className="flex items-center mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={complianceAcknowledged.pdtRules}
                onChange={(e) => setComplianceAcknowledged({
                  ...complianceAcknowledged,
                  pdtRules: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-900">
                I understand the Pattern Day Trader rules
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setStep(3)}
            className="px-6 py-2 text-gray-700 hover:text-gray-900"
            disabled={loading}
          >
            Back
          </button>
          <button
            onClick={handleCompleteSetup}
            disabled={loading || !complianceAcknowledged.optionsRisk || !complianceAcknowledged.pdtRules}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Completing...' : 'Complete Setup'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full mx-1 ${
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="text-center text-sm text-gray-600">
          Step {step} of 4
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  )
}
