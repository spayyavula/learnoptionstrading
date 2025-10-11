import React, { useState } from 'react'
import { Shield, Key, CheckCircle, AlertTriangle, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { RobinhoodService } from '../services/robinhoodService'
import { RobinhoodComplianceService } from '../services/robinhoodComplianceService'
import { supabase } from '../lib/supabase'

interface RobinhoodSetupWizardProps {
  onComplete?: () => void
  onCancel?: () => void
}

export default function RobinhoodSetupWizard({ onComplete, onCancel }: RobinhoodSetupWizardProps) {
  const [step, setStep] = useState(1)
  const [environment] = useState<'live' | 'paper'>('live')
  const [privateKey, setPrivateKey] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showPublicKey, setShowPublicKey] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [complianceAcknowledged, setComplianceAcknowledged] = useState({
    cryptoRisk: false,
    marketVolatility: false,
    custodyLimitations: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<any>(null)

  const handleValidateCredentials = async () => {
    if (!privateKey || !publicKey || !apiKey) {
      setError('Please enter all API credentials')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const saved = await RobinhoodService.saveCredentials(
        user.id,
        privateKey,
        publicKey,
        apiKey,
        environment
      )

      if (!saved) throw new Error('Failed to save credentials')

      const isValid = await RobinhoodService.validateCredentials(user.id, environment)

      if (isValid) {
        const accountInfo = await RobinhoodService.getAccount(user.id, environment)
        setValidationResult(accountInfo)
        setStep(3)
      } else {
        setError('Invalid credentials. Please check your API keys.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteSetup = async () => {
    if (!complianceAcknowledged.cryptoRisk || !complianceAcknowledged.marketVolatility || !complianceAcknowledged.custodyLimitations) {
      setError('Please acknowledge all required disclosures')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      await RobinhoodService.acknowledgeCompliance(user.id, 'crypto_risk', '1.0')
      await RobinhoodService.acknowledgeCompliance(user.id, 'market_volatility', '1.0')
      await RobinhoodService.acknowledgeCompliance(user.id, 'custody_limitations', '1.0')

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
        <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Robinhood Crypto Account</h2>
        <p className="text-gray-600">
          Link your Robinhood account to enable cryptocurrency trading
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Before You Start:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
          <li>You need an active Robinhood Crypto account</li>
          <li>Your account must have crypto trading enabled</li>
          <li>You need to generate API credentials from Robinhood</li>
          <li>Only US residents can use Robinhood Crypto</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>Important:</strong> Robinhood Crypto only supports live trading with real money. There is no paper trading environment. Only trade with funds you can afford to lose.
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">What is Robinhood Crypto?</h3>
        <p className="text-sm text-gray-700 mb-2">
          Robinhood Crypto allows you to trade cryptocurrencies like Bitcoin, Ethereum, and others 24/7.
        </p>
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> When you buy crypto on Robinhood, you cannot transfer it to external wallets. You can only buy and sell within the Robinhood platform.
        </p>
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
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter API Credentials</h2>
        <p className="text-gray-600">
          Get your API keys from the Robinhood developer portal
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">How to get your API keys:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Log in to Robinhood on desktop browser</li>
          <li>Visit the API Credentials Portal</li>
          <li>Generate new API credentials</li>
          <li>Download the private key, public key, and API key</li>
          <li>Copy and paste them below</li>
        </ol>
        <a
          href="https://robinhood.com/account/settings/api"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-green-600 hover:text-green-700 text-sm mt-2"
        >
          Open API Credentials Portal <ExternalLink className="h-4 w-4 ml-1" />
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
            Private Key
          </label>
          <div className="relative">
            <textarea
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-xs"
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              rows={4}
              style={{ fontFamily: 'monospace' }}
            />
            <button
              type="button"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPrivateKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Your private key in PEM format (starts with -----BEGIN PRIVATE KEY-----)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Public Key
          </label>
          <div className="relative">
            <textarea
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-xs"
              placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
              rows={4}
              style={{ fontFamily: 'monospace' }}
            />
            <button
              type="button"
              onClick={() => setShowPublicKey(!showPublicKey)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPublicKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Your public key in PEM format (starts with -----BEGIN PUBLIC KEY-----)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm pr-12"
              placeholder="your-api-key-here"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Your API key from the Robinhood developer portal
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
          disabled={loading || !privateKey || !publicKey || !apiKey}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Validating...' : 'Validate & Continue'}
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Credentials Verified</h2>
        <p className="text-gray-600">
          Your Robinhood Crypto account has been successfully connected
        </p>
      </div>

      {validationResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Account Information:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Account ID:</span>
              <span className="ml-2 font-medium">{validationResult.account_id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Buying Power:</span>
              <span className="ml-2 font-medium">${parseFloat(validationResult.buying_power || validationResult.crypto_buying_power || '0').toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Cash:</span>
              <span className="ml-2 font-medium">${parseFloat(validationResult.cash || '0').toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium text-green-600">Connected</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Important Reminders:</h3>
        <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
          <li>Crypto markets trade 24/7 - prices never stop moving</li>
          <li>You cannot transfer crypto off Robinhood platform</li>
          <li>All trades use real money - there is no paper trading</li>
          <li>Crypto holdings are not FDIC or SIPC insured</li>
          <li>Extremely high volatility - you can lose your entire investment</li>
        </ul>
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
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Continue to Disclosures
        </button>
      </div>
    </div>
  )

  const renderStep4 = () => {
    const cryptoRisk = RobinhoodComplianceService.getRegulatoryDisclosure('crypto_risk')
    const marketVolatility = RobinhoodComplianceService.getRegulatoryDisclosure('market_volatility')
    const custodyLimitations = RobinhoodComplianceService.getRegulatoryDisclosure('custody_limitations')

    return (
      <div className="space-y-6">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Critical Risk Disclosures</h2>
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
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="font-semibold text-red-900 mb-2">{cryptoRisk.title}</h3>
            <div className="text-sm text-gray-700 prose prose-sm max-w-none max-h-48 overflow-y-auto bg-white p-3 rounded">
              <pre className="whitespace-pre-wrap font-sans">{cryptoRisk.content}</pre>
            </div>
            <label className="flex items-center mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={complianceAcknowledged.cryptoRisk}
                onChange={(e) => setComplianceAcknowledged({
                  ...complianceAcknowledged,
                  cryptoRisk: e.target.checked
                })}
                className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">
                I have read and understand the cryptocurrency trading risks
              </span>
            </label>
          </div>

          <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <h3 className="font-semibold text-yellow-900 mb-2">{marketVolatility.title}</h3>
            <div className="text-sm text-gray-700 prose prose-sm max-w-none max-h-48 overflow-y-auto bg-white p-3 rounded">
              <pre className="whitespace-pre-wrap font-sans">{marketVolatility.content}</pre>
            </div>
            <label className="flex items-center mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={complianceAcknowledged.marketVolatility}
                onChange={(e) => setComplianceAcknowledged({
                  ...complianceAcknowledged,
                  marketVolatility: e.target.checked
                })}
                className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">
                I understand the extreme market volatility risks
              </span>
            </label>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{custodyLimitations.title}</h3>
            <div className="text-sm text-gray-700 prose prose-sm max-w-none max-h-48 overflow-y-auto bg-white p-3 rounded">
              <pre className="whitespace-pre-wrap font-sans">{custodyLimitations.content}</pre>
            </div>
            <label className="flex items-center mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={complianceAcknowledged.custodyLimitations}
                onChange={(e) => setComplianceAcknowledged({
                  ...complianceAcknowledged,
                  custodyLimitations: e.target.checked
                })}
                className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">
                I understand the custody and transfer limitations
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
            disabled={loading || !complianceAcknowledged.cryptoRisk || !complianceAcknowledged.marketVolatility || !complianceAcknowledged.custodyLimitations}
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
                s <= step ? 'bg-green-600' : 'bg-gray-200'
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
