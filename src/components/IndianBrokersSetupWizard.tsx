import React, { useState } from 'react'
import {
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  Key,
  Shield,
  TrendingUp,
  X,
  ChevronRight,
  Building2,
  IndianRupee
} from 'lucide-react'
import { useAuth } from './AuthProvider'
import { ICICIDirectService } from '../services/iciciDirectService'
import { HDFCSecuritiesService } from '../services/hdfcSecuritiesService'

type BrokerType = 'icici' | 'hdfc'
type Step = 'select_broker' | 'credentials' | 'verify' | 'complete'

interface ICICIFormData {
  apiKey: string
  apiSecret: string
  userId: string
  environment: 'live' | 'demo'
}

interface HDFCFormData {
  appId: string
  appSecret: string
  userCode: string
  environment: 'live' | 'demo'
}

export const IndianBrokersSetupWizard: React.FC<{
  onClose: () => void
  onComplete: () => void
}> = ({ onClose, onComplete }) => {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('select_broker')
  const [selectedBroker, setSelectedBroker] = useState<BrokerType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ICICI Direct form
  const [iciciForm, setIciciForm] = useState<ICICIFormData>({
    apiKey: '',
    apiSecret: '',
    userId: '',
    environment: 'demo'
  })

  // HDFC Securities form
  const [hdfcForm, setHdfcForm] = useState<HDFCFormData>({
    appId: '',
    appSecret: '',
    userCode: '',
    environment: 'demo'
  })

  const handleBrokerSelect = (broker: BrokerType) => {
    setSelectedBroker(broker)
    setStep('credentials')
    setError(null)
  }

  const handleICICISave = async () => {
    if (!user) {
      setError('You must be logged in')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Save credentials
      const result = await ICICIDirectService.saveCredentials(
        user.id,
        {
          api_key: iciciForm.apiKey,
          api_secret: iciciForm.apiSecret,
          user_id: iciciForm.userId
        },
        iciciForm.environment
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to save credentials')
      }

      setStep('verify')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleHDFCSave = async () => {
    if (!user) {
      setError('You must be logged in')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Save credentials
      const result = await HDFCSecuritiesService.saveCredentials(
        user.id,
        {
          app_id: hdfcForm.appId,
          app_secret: hdfcForm.appSecret,
          user_code: hdfcForm.userCode
        },
        hdfcForm.environment
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to save credentials')
      }

      setStep('verify')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!user || !selectedBroker) return

    setLoading(true)
    setError(null)

    try {
      let isValid = false

      if (selectedBroker === 'icici') {
        isValid = await ICICIDirectService.validateCredentials(user.id, iciciForm.environment)
      } else {
        isValid = await HDFCSecuritiesService.validateCredentials(user.id, hdfcForm.environment)
      }

      if (isValid) {
        setStep('complete')
      } else {
        throw new Error('Failed to validate credentials. Please check your API keys.')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderBrokerSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-green-600 rounded-full mb-4">
          <IndianRupee className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Connect Your Indian Broker
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose your broker to get started with live Indian market trading
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ICICI Direct Card */}
        <button
          onClick={() => handleBrokerSelect('icici')}
          className="group relative p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-lg text-left"
        >
          <div className="absolute top-4 right-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              ICICI Direct
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Breeze API Integration
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              NSE, BSE, NFO trading
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Real-time market data
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Options & F&O support
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Get Started
            </span>
            <ChevronRight className="w-5 h-5 text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* HDFC Securities Card */}
        <button
          onClick={() => handleBrokerSelect('hdfc')}
          className="group relative p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg text-left"
        >
          <div className="absolute top-4 right-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              HDFC Securities
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Official API Integration
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              NSE, BSE, NFO, MCX trading
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Advanced order types
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Comprehensive reporting
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Get Started
            </span>
            <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Before you connect:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
              <li>You'll need an active trading account with your chosen broker</li>
              <li>API credentials must be generated from your broker's portal</li>
              <li>Demo mode is available for testing without real money</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderICICICredentials = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ICICI Direct Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your ICICI Breeze API credentials
        </p>
      </div>

      {/* Environment Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Environment
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setIciciForm({ ...iciciForm, environment: 'demo' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              iciciForm.environment === 'demo'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Demo</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Test with virtual money</div>
          </button>
          <button
            onClick={() => setIciciForm({ ...iciciForm, environment: 'live' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              iciciForm.environment === 'live'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Live</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Trade with real money</div>
          </button>
        </div>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          API Key *
        </label>
        <input
          type="text"
          value={iciciForm.apiKey}
          onChange={(e) => setIciciForm({ ...iciciForm, apiKey: e.target.value })}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Enter your ICICI API Key"
        />
      </div>

      {/* API Secret */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          API Secret *
        </label>
        <input
          type="password"
          value={iciciForm.apiSecret}
          onChange={(e) => setIciciForm({ ...iciciForm, apiSecret: e.target.value })}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Enter your API Secret"
        />
      </div>

      {/* User ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          User ID *
        </label>
        <input
          type="text"
          value={iciciForm.userId}
          onChange={(e) => setIciciForm({ ...iciciForm, userId: e.target.value })}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Your ICICI User ID"
        />
      </div>

      {/* Help Box */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Key className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
              How to get your API credentials:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-orange-800 dark:text-orange-400">
              <li>Login to ICICI Direct website</li>
              <li>Go to Settings → API Management</li>
              <li>Generate new API Key and Secret</li>
              <li>Copy and paste them here</li>
            </ol>
            <a
              href="https://api.icicidirect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-orange-600 dark:text-orange-400 hover:underline"
            >
              Visit ICICI Direct API Portal
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => setStep('select_broker')}
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleICICISave}
          disabled={loading || !iciciForm.apiKey || !iciciForm.apiSecret || !iciciForm.userId}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {loading ? 'Saving...' : 'Continue →'}
        </button>
      </div>
    </div>
  )

  const renderHDFCCredentials = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          HDFC Securities Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your HDFC Securities API credentials
        </p>
      </div>

      {/* Environment Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Environment
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setHdfcForm({ ...hdfcForm, environment: 'demo' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              hdfcForm.environment === 'demo'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Demo</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Test with virtual money</div>
          </button>
          <button
            onClick={() => setHdfcForm({ ...hdfcForm, environment: 'live' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              hdfcForm.environment === 'live'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Live</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Trade with real money</div>
          </button>
        </div>
      </div>

      {/* App ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          App ID *
        </label>
        <input
          type="text"
          value={hdfcForm.appId}
          onChange={(e) => setHdfcForm({ ...hdfcForm, appId: e.target.value })}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your App ID"
        />
      </div>

      {/* App Secret */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          App Secret *
        </label>
        <input
          type="password"
          value={hdfcForm.appSecret}
          onChange={(e) => setHdfcForm({ ...hdfcForm, appSecret: e.target.value })}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your App Secret"
        />
      </div>

      {/* User Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          User Code *
        </label>
        <input
          type="text"
          value={hdfcForm.userCode}
          onChange={(e) => setHdfcForm({ ...hdfcForm, userCode: e.target.value })}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Your User Code"
        />
      </div>

      {/* Help Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Key className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              How to get your API credentials:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-400">
              <li>Login to HDFC Securities portal</li>
              <li>Navigate to Developer Console</li>
              <li>Create new App and get credentials</li>
              <li>Copy App ID, Secret and your User Code</li>
            </ol>
            <a
              href="https://api.hdfcsec.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Visit HDFC Securities API Portal
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => setStep('select_broker')}
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleHDFCSave}
          disabled={loading || !hdfcForm.appId || !hdfcForm.appSecret || !hdfcForm.userCode}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {loading ? 'Saving...' : 'Continue →'}
        </button>
      </div>
    </div>
  )

  const renderVerify = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
          <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verify Connection
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Let's verify your {selectedBroker === 'icici' ? 'ICICI Direct' : 'HDFC Securities'} credentials
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={loading}
        className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
      >
        {loading ? 'Verifying...' : 'Verify Connection'}
      </button>
    </div>
  )

  const renderComplete = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Successfully Connected!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Your {selectedBroker === 'icici' ? 'ICICI Direct' : 'HDFC Securities'} account is now connected
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 dark:text-green-300 mb-3">
          What's next?
        </h3>
        <ul className="space-y-2 text-sm text-green-800 dark:text-green-400">
          <li className="flex items-start">
            <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>Access live market data for NSE, BSE, and NFO</span>
          </li>
          <li className="flex items-start">
            <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>Place orders and manage your portfolio</span>
          </li>
          <li className="flex items-start">
            <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>Track your positions and P&L in real-time</span>
          </li>
        </ul>
      </div>

      <button
        onClick={() => {
          onComplete()
          onClose()
        }}
        className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
      >
        Start Trading
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {step === 'select_broker' && 'Select Your Broker'}
            {step === 'credentials' && `Configure ${selectedBroker === 'icici' ? 'ICICI Direct' : 'HDFC Securities'}`}
            {step === 'verify' && 'Verify Connection'}
            {step === 'complete' && 'Setup Complete'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select_broker' && renderBrokerSelection()}
          {step === 'credentials' && selectedBroker === 'icici' && renderICICICredentials()}
          {step === 'credentials' && selectedBroker === 'hdfc' && renderHDFCCredentials()}
          {step === 'verify' && renderVerify()}
          {step === 'complete' && renderComplete()}
        </div>
      </div>
    </div>
  )
}
