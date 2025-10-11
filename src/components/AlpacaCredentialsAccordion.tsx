import React, { useState, useEffect } from 'react'
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Lock,
  Info
} from 'lucide-react'
import { AlpacaService } from '../services/alpacaService'
import { supabase } from '../lib/supabase'

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface FieldHelp {
  title: string
  content: string
  link?: { text: string; url: string }
}

interface AlpacaCredentialsAccordionProps {
  onSetupComplete?: () => void
  onLaunchWizard?: () => void
}

export default function AlpacaCredentialsAccordion({
  onSetupComplete,
  onLaunchWizard
}: AlpacaCredentialsAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [environment, setEnvironment] = useState<'paper' | 'live'>('paper')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [tradingLevel, setTradingLevel] = useState(0)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showFieldHelp, setShowFieldHelp] = useState<string | null>(null)
  const [existingCredentials, setExistingCredentials] = useState<any[]>([])
  const [loadingCredentials, setLoadingCredentials] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isExpanded) {
      loadExistingCredentials()
    }
  }, [isExpanded])

  useEffect(() => {
    if (touchedFields.size > 0) {
      validateFields()
    }
  }, [apiKey, apiSecret, tradingLevel, touchedFields])

  const loadExistingCredentials = async () => {
    setLoadingCredentials(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('alpaca_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error
      setExistingCredentials(data || [])
    } catch (error) {
      console.error('Error loading credentials:', error)
    } finally {
      setLoadingCredentials(false)
    }
  }

  const validateFields = () => {
    const errors: ValidationError[] = []

    if (touchedFields.has('apiKey')) {
      if (!apiKey) {
        errors.push({
          field: 'apiKey',
          message: 'API Key is required',
          severity: 'error'
        })
      } else if (!apiKey.startsWith('PK') && !apiKey.startsWith('AK')) {
        errors.push({
          field: 'apiKey',
          message: 'API Key should start with PK (paper) or AK (live)',
          severity: 'warning'
        })
      } else if (apiKey.length < 20) {
        errors.push({
          field: 'apiKey',
          message: 'API Key appears to be too short',
          severity: 'warning'
        })
      }
    }

    if (touchedFields.has('apiSecret')) {
      if (!apiSecret) {
        errors.push({
          field: 'apiSecret',
          message: 'API Secret is required',
          severity: 'error'
        })
      } else if (apiSecret.length < 32) {
        errors.push({
          field: 'apiSecret',
          message: 'API Secret appears to be too short',
          severity: 'warning'
        })
      }
    }

    if (touchedFields.has('tradingLevel')) {
      if (tradingLevel < 0 || tradingLevel > 3) {
        errors.push({
          field: 'tradingLevel',
          message: 'Trading level must be between 0 and 3',
          severity: 'error'
        })
      } else if (tradingLevel === 0) {
        errors.push({
          field: 'tradingLevel',
          message: 'Level 0 means options trading is disabled on your account',
          severity: 'info'
        })
      }
    }

    if (environment === 'live' && !touchedFields.has('confirmation')) {
      errors.push({
        field: 'environment',
        message: 'You are setting up LIVE trading with real money',
        severity: 'warning'
      })
    }

    setValidationErrors(errors)
    return errors.filter(e => e.severity === 'error').length === 0
  }

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]))
  }

  const handleValidateCredentials = async () => {
    setValidating(true)
    setValidationErrors([])

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
        setValidationErrors([{
          field: 'validation',
          message: 'Credentials validated successfully!',
          severity: 'info'
        }])
      } else {
        setValidationErrors([{
          field: 'validation',
          message: 'Failed to validate credentials. Please check your API keys.',
          severity: 'error'
        }])
      }
    } catch (error: any) {
      setValidationErrors([{
        field: 'validation',
        message: error.message || 'Validation failed',
        severity: 'error'
      }])
    } finally {
      setValidating(false)
    }
  }

  const handleSaveCredentials = async () => {
    if (!validateFields()) {
      return
    }

    setSaving(true)
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

      if (saved) {
        setApiKey('')
        setApiSecret('')
        setTradingLevel(0)
        setTouchedFields(new Set())
        setValidationErrors([{
          field: 'save',
          message: 'Credentials saved successfully!',
          severity: 'info'
        }])

        await loadExistingCredentials()

        if (onSetupComplete) {
          onSetupComplete()
        }
      } else {
        throw new Error('Failed to save credentials')
      }
    } catch (error: any) {
      setValidationErrors([{
        field: 'save',
        message: error.message || 'Failed to save credentials',
        severity: 'error'
      }])
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCredentials = async (credentialId: string, env: string) => {
    if (!window.confirm(`Delete ${env} trading credentials?`)) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await AlpacaService.deleteCredentials(user.id, env as 'paper' | 'live')
      await loadExistingCredentials()
    } catch (error) {
      console.error('Error deleting credentials:', error)
      alert('Failed to delete credentials')
    }
  }

  const getFieldError = (field: string) => {
    return validationErrors.find(e => e.field === field)
  }

  const fieldHelp: Record<string, FieldHelp> = {
    environment: {
      title: 'Trading Environment',
      content: 'Paper trading uses simulated money and is perfect for testing strategies. Live trading uses real money and requires a funded Alpaca account. Always start with paper trading to familiarize yourself with the platform.',
      link: { text: 'Learn more about Alpaca environments', url: 'https://docs.alpaca.markets/docs/getting-started' }
    },
    apiKey: {
      title: 'API Key ID',
      content: 'Your API Key ID is a public identifier for your Alpaca account. Paper trading keys start with "PK" while live trading keys start with "AK". Get your keys from the Alpaca dashboard.',
      link: { text: 'Generate API keys', url: 'https://app.alpaca.markets/paper/dashboard/overview' }
    },
    apiSecret: {
      title: 'API Secret Key',
      content: "Your Secret Key is private and should never be shared. It's used to authenticate API requests. This key is encrypted before storage and never displayed again after saving.",
      link: { text: 'API security best practices', url: 'https://docs.alpaca.markets/docs/about-api-keys' }
    },
    tradingLevel: {
      title: 'Options Trading Level',
      content: 'Your trading level determines which options strategies you can use:\n• Level 0: No options trading\n• Level 1: Covered calls & cash-secured puts\n• Level 2: Buy calls & puts\n• Level 3: All spread strategies\n\nYour level is determined by Alpaca based on your account approval.',
      link: { text: 'Understanding trading levels', url: 'https://docs.alpaca.markets/docs/options-trading' }
    }
  }

  const tradingLevelInfo = {
    0: { name: 'Disabled', color: 'gray', strategies: ['No options trading'] },
    1: { name: 'Basic', color: 'blue', strategies: ['Covered Calls', 'Cash-Secured Puts'] },
    2: { name: 'Standard', color: 'green', strategies: ['Buy Calls', 'Buy Puts', 'Level 1 Strategies'] },
    3: { name: 'Advanced', color: 'purple', strategies: ['All Spreads', 'Iron Condors', 'Butterflies', 'Level 1 & 2 Strategies'] }
  }

  const currentLevelInfo = tradingLevelInfo[tradingLevel as keyof typeof tradingLevelInfo]

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-blue-600" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Alpaca Trading Credentials</h3>
            <p className="text-sm text-gray-600">
              {existingCredentials.length > 0
                ? `${existingCredentials.length} account(s) connected`
                : 'Connect your Alpaca account for live trading'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {existingCredentials.length > 0 && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-6">
          {existingCredentials.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Connected Accounts
              </h4>
              {existingCredentials.map((cred) => (
                <div key={cred.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${cred.environment === 'live' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {cred.environment === 'paper' ? 'Paper Trading' : 'Live Trading'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Level {cred.options_trading_level || 0}
                        {cred.compliance_acknowledged && ' • Compliance OK'}
                      </div>
                      {cred.last_validated_at && (
                        <div className="text-xs text-gray-500">
                          Validated: {new Date(cred.last_validated_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCredentials(cred.id, cred.environment)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete credentials"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                {existingCredentials.length > 0 ? 'Add Another Account' : 'Connect Account'}
              </h4>
              {onLaunchWizard && (
                <button
                  onClick={onLaunchWizard}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  Use Setup Wizard
                  <ExternalLink className="h-3 w-3 ml-1" />
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Environment
                </label>
                <button
                  onClick={() => setShowFieldHelp(showFieldHelp === 'environment' ? null : 'environment')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              {showFieldHelp === 'environment' && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <h5 className="font-medium text-blue-900 mb-1">{fieldHelp.environment.title}</h5>
                  <p className="text-blue-800 mb-2">{fieldHelp.environment.content}</p>
                  {fieldHelp.environment.link && (
                    <a
                      href={fieldHelp.environment.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      {fieldHelp.environment.link.text}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setEnvironment('paper')}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    environment === 'paper'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">Paper</div>
                  <div className="text-xs text-gray-600">Practice with virtual money</div>
                </button>
                <button
                  onClick={() => setEnvironment('live')}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    environment === 'live'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">Live</div>
                  <div className="text-xs text-red-600">Trade with real money</div>
                </button>
              </div>
              {getFieldError('environment') && (
                <p className={`mt-1 text-sm ${
                  getFieldError('environment')?.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {getFieldError('environment')?.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  API Key ID
                </label>
                <button
                  onClick={() => setShowFieldHelp(showFieldHelp === 'apiKey' ? null : 'apiKey')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              {showFieldHelp === 'apiKey' && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <h5 className="font-medium text-blue-900 mb-1">{fieldHelp.apiKey.title}</h5>
                  <p className="text-blue-800 mb-2 whitespace-pre-line">{fieldHelp.apiKey.content}</p>
                  {fieldHelp.apiKey.link && (
                    <a
                      href={fieldHelp.apiKey.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      {fieldHelp.apiKey.link.text}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              )}

              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onBlur={() => handleFieldBlur('apiKey')}
                  placeholder="PKXXXXXXXXXXXXXXXXXX"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${
                    getFieldError('apiKey')?.severity === 'error'
                      ? 'border-red-300'
                      : getFieldError('apiKey')?.severity === 'warning'
                      ? 'border-yellow-300'
                      : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {getFieldError('apiKey') && (
                <div className="flex items-start mt-1">
                  {getFieldError('apiKey')?.severity === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 mr-1 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-1 flex-shrink-0" />
                  )}
                  <p className={`text-sm ${
                    getFieldError('apiKey')?.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {getFieldError('apiKey')?.message}
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  API Secret Key
                </label>
                <button
                  onClick={() => setShowFieldHelp(showFieldHelp === 'apiSecret' ? null : 'apiSecret')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              {showFieldHelp === 'apiSecret' && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <h5 className="font-medium text-blue-900 mb-1">{fieldHelp.apiSecret.title}</h5>
                  <p className="text-blue-800 mb-2 whitespace-pre-line">{fieldHelp.apiSecret.content}</p>
                  {fieldHelp.apiSecret.link && (
                    <a
                      href={fieldHelp.apiSecret.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      {fieldHelp.apiSecret.link.text}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              )}

              <div className="relative">
                <input
                  type={showApiSecret ? 'text' : 'password'}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  onBlur={() => handleFieldBlur('apiSecret')}
                  placeholder="Enter your secret key"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${
                    getFieldError('apiSecret')?.severity === 'error'
                      ? 'border-red-300'
                      : getFieldError('apiSecret')?.severity === 'warning'
                      ? 'border-yellow-300'
                      : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {getFieldError('apiSecret') && (
                <div className="flex items-start mt-1">
                  {getFieldError('apiSecret')?.severity === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 mr-1 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-1 flex-shrink-0" />
                  )}
                  <p className={`text-sm ${
                    getFieldError('apiSecret')?.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {getFieldError('apiSecret')?.message}
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Options Trading Level
                </label>
                <button
                  onClick={() => setShowFieldHelp(showFieldHelp === 'tradingLevel' ? null : 'tradingLevel')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              {showFieldHelp === 'tradingLevel' && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <h5 className="font-medium text-blue-900 mb-1">{fieldHelp.tradingLevel.title}</h5>
                  <p className="text-blue-800 mb-2 whitespace-pre-line">{fieldHelp.tradingLevel.content}</p>
                  {fieldHelp.tradingLevel.link && (
                    <a
                      href={fieldHelp.tradingLevel.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      {fieldHelp.tradingLevel.link.text}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              )}

              <select
                value={tradingLevel}
                onChange={(e) => setTradingLevel(parseInt(e.target.value))}
                onBlur={() => handleFieldBlur('tradingLevel')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('tradingLevel') ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="0">Level 0 - No Options Trading</option>
                <option value="1">Level 1 - Covered Calls & Cash-Secured Puts</option>
                <option value="2">Level 2 - Buy Calls & Puts</option>
                <option value="3">Level 3 - Spreads & Advanced Strategies</option>
              </select>

              {currentLevelInfo && (
                <div className={`mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm`}>
                  <div className="font-medium text-gray-900 mb-1">
                    {currentLevelInfo.name} - Available Strategies:
                  </div>
                  <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                    {currentLevelInfo.strategies.map((strategy, idx) => (
                      <li key={idx}>{strategy}</li>
                    ))}
                  </ul>
                </div>
              )}

              {getFieldError('tradingLevel') && (
                <div className="flex items-start mt-1">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-1 flex-shrink-0" />
                  <p className="text-sm text-blue-600">
                    {getFieldError('tradingLevel')?.message}
                  </p>
                </div>
              )}
            </div>

            {validationErrors.filter(e => e.field === 'validation' || e.field === 'save').map((error, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-start ${
                  error.severity === 'error'
                    ? 'bg-red-50 border-red-200'
                    : error.severity === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                {error.severity === 'error' ? (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                ) : error.severity === 'warning' ? (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                )}
                <p className={`text-sm ${
                  error.severity === 'error'
                    ? 'text-red-800'
                    : error.severity === 'warning'
                    ? 'text-yellow-800'
                    : 'text-green-800'
                }`}>
                  {error.message}
                </p>
              </div>
            ))}

            <div className="flex space-x-3">
              <button
                onClick={handleValidateCredentials}
                disabled={validating || !apiKey || !apiSecret}
                className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {validating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </button>
              <button
                onClick={handleSaveCredentials}
                disabled={saving || !apiKey || !apiSecret || validationErrors.some(e => e.severity === 'error')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Credentials
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
