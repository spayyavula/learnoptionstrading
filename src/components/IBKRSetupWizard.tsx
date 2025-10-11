import React, { useState } from 'react'
import { Shield, Key, CheckCircle, AlertTriangle, ExternalLink, Info } from 'lucide-react'
import { IBKRService } from '../services/ibkrService'
import { IBKRComplianceService } from '../services/ibkrComplianceService'
import { IBKRSessionService } from '../services/ibkrSessionService'
import { supabase } from '../lib/supabase'

interface IBKRSetupWizardProps {
  onComplete?: () => void
  onCancel?: () => void
}

export default function IBKRSetupWizard({ onComplete, onCancel }: IBKRSetupWizardProps) {
  const [step, setStep] = useState(1)
  const [environment, setEnvironment] = useState<'paper' | 'live'>('paper')
  const [gatewayHost, setGatewayHost] = useState('localhost')
  const [gatewayPort, setGatewayPort] = useState(5000)
  const [gatewaySsl, setGatewaySsl] = useState(true)
  const [username, setUsername] = useState('')
  const [tradingLevel, setTradingLevel] = useState(0)
  const [complianceAcknowledged, setComplianceAcknowledged] = useState({
    optionsRisk: false,
    pdtRules: false,
    marginTrading: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<any>(null)

  const handleTestConnection = async () => {
    if (!username) {
      setError('Please enter your IBKR username')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const saved = await IBKRService.saveCredentials(
        user.id,
        gatewayHost,
        gatewayPort,
        gatewaySsl,
        username,
        environment,
        tradingLevel
      )

      if (!saved) throw new Error('Failed to save credentials')

      const isValid = await IBKRService.validateConnection(user.id, environment)

      if (isValid) {
        await IBKRSessionService.initializeSession(user.id, environment)
        const accounts = await IBKRService.getAccounts(user.id, environment)

        if (accounts && accounts.length > 0) {
          const accountId = accounts[0].accountId
          const summary = await IBKRService.getAccountSummary(user.id, environment, accountId)
          setValidationResult({ accounts, summary })
          setStep(3)
        } else {
          throw new Error('No accounts found')
        }
      } else {
        setError('Could not connect to Gateway. Ensure Gateway is running and you are logged in.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Gateway')
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

      await IBKRService.acknowledgeCompliance(user.id, 'options_risk', '1.0')
      await IBKRService.acknowledgeCompliance(user.id, 'pdt_rules', '1.0')

      if (complianceAcknowledged.marginTrading) {
        await IBKRService.acknowledgeCompliance(user.id, 'margin_trading', '1.0')
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Interactive Brokers Account</h2>
        <p className="text-gray-600">
          Link your IBKR account via Client Portal Gateway to enable live options trading
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Before You Start:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
          <li>You need an IBKR Pro account (Lite accounts not supported)</li>
          <li>Your account must be fully funded and approved for options trading</li>
          <li>Download and run the Client Portal Gateway application</li>
          <li>Log in to the Gateway before proceeding</li>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gateway Configuration</h2>
        <p className="text-gray-600">
          Configure your Client Portal Gateway connection
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Setup Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Download Client Portal Gateway from IBKR website</li>
          <li>Extract and run the Gateway application</li>
          <li>Log in with your {environment === 'paper' ? 'paper trading' : 'live'} credentials</li>
          <li>Ensure Gateway is running before testing connection below</li>
        </ol>
        <a
          href="https://www.interactivebrokers.com/en/trading/ib-api.php"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mt-2"
        >
          Download Gateway <ExternalLink className="h-4 w-4 ml-1" />
        </a>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gateway Host
            </label>
            <input
              type="text"
              value={gatewayHost}
              onChange={(e) => setGatewayHost(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="localhost"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gateway Port
            </label>
            <input
              type="number"
              value={gatewayPort}
              onChange={(e) => setGatewayPort(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="5000"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="ssl"
            checked={gatewaySsl}
            onChange={(e) => setGatewaySsl(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="ssl" className="ml-2 text-sm text-gray-900">
            Use SSL (HTTPS)
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IBKR Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={environment === 'paper' ? 'Paper trading username' : 'Live trading username'}
          />
          <p className="text-sm text-gray-500 mt-1">
            {environment === 'paper'
              ? 'Use your dedicated paper trading username (different from live)'
              : 'Use your live trading account username'}
          </p>
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
            Select your current IBKR account options approval level
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            Your Gateway connection details are encrypted using AES-256 encryption. Sessions are authenticated via the Gateway application using IBKR's 2FA security.
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
          onClick={handleTestConnection}
          disabled={loading || !username}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing Connection...' : 'Test Connection & Continue'}
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => {
    const restrictions = IBKRComplianceService.getTradingLevelRestrictions(tradingLevel)

    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Verified</h2>
          <p className="text-gray-600">
            Your IBKR account has been successfully connected
          </p>
        </div>

        {validationResult && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Account Information:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Account:</span>
                <span className="ml-2 font-medium">{validationResult.accounts[0]?.accountId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium">{validationResult.accounts[0]?.type || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Net Liquidation:</span>
                <span className="ml-2 font-medium">${parseFloat(validationResult.summary?.netliquidation || '0').toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Buying Power:</span>
                <span className="ml-2 font-medium">${parseFloat(validationResult.summary?.buyingpower || '0').toFixed(2)}</span>
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
    const optionsRisk = IBKRComplianceService.getRegulatoryDisclosure('options_risk')
    const pdtRules = IBKRComplianceService.getRegulatoryDisclosure('pdt_rules')

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
