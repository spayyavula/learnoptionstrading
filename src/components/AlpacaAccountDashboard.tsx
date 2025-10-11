import React, { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, DollarSign, Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { AlpacaService, type AlpacaAccountInfo } from '../services/alpacaService'
import { AlpacaComplianceService, type PatternDayTraderStatus } from '../services/alpacaComplianceService'
import { supabase } from '../lib/supabase'

interface AlpacaAccountDashboardProps {
  environment: 'paper' | 'live'
}

export default function AlpacaAccountDashboard({ environment }: AlpacaAccountDashboardProps) {
  const [accountInfo, setAccountInfo] = useState<AlpacaAccountInfo | null>(null)
  const [pdtStatus, setPdtStatus] = useState<PatternDayTraderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    loadAccountInfo()
    const interval = setInterval(loadAccountInfo, 60000)
    return () => clearInterval(interval)
  }, [environment])

  const loadAccountInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const account = await AlpacaService.getAccount(user.id, environment)
      setAccountInfo(account)

      const pdt = await AlpacaComplianceService.checkPatternDayTraderStatus(user.id, account)
      setPdtStatus(pdt)

      setLastSync(new Date())
      setError(null)
    } catch (err: any) {
      console.error('Error loading account info:', err)
      setError(err.message || 'Failed to load account information')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await AlpacaService.syncPositions(user.id, environment)
      await AlpacaService.syncOrders(user.id, environment)
      await loadAccountInfo()
    } catch (err: any) {
      setError(err.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading account information...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Account</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!accountInfo) return null

  const buyingPower = parseFloat(accountInfo.buying_power)
  const optionsBuyingPower = parseFloat(accountInfo.options_buying_power || '0')
  const equity = parseFloat(accountInfo.equity)
  const portfolioValue = parseFloat(accountInfo.portfolio_value)
  const cash = parseFloat(accountInfo.cash)

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">
                Alpaca {environment === 'paper' ? 'Paper' : 'Live'} Account
              </h2>
              <p className="text-blue-100 text-sm">
                Account #{accountInfo.account_number}
              </p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center text-blue-100 text-sm mb-1">
              <DollarSign className="h-4 w-4 mr-1" />
              Portfolio Value
            </div>
            <div className="text-2xl font-bold">
              ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center text-blue-100 text-sm mb-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              Equity
            </div>
            <div className="text-2xl font-bold">
              ${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center text-blue-100 text-sm mb-1">
              <DollarSign className="h-4 w-4 mr-1" />
              Buying Power
            </div>
            <div className="text-2xl font-bold">
              ${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center text-blue-100 text-sm mb-1">
              <DollarSign className="h-4 w-4 mr-1" />
              Cash
            </div>
            <div className="text-2xl font-bold">
              ${cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-600" />
            Options Trading
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Trading Level:</span>
              <span className="font-medium">Level {accountInfo.options_trading_level}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Options Buying Power:</span>
              <span className="font-medium">
                ${optionsBuyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${accountInfo.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`}>
                {accountInfo.status}
              </span>
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow p-4 ${
          pdtStatus?.isPatternDayTrader && !pdtStatus?.meetsRequirement
            ? 'bg-red-50 border-2 border-red-300'
            : pdtStatus?.warning
            ? 'bg-yellow-50 border-2 border-yellow-300'
            : 'bg-white'
        }`}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            {pdtStatus?.isPatternDayTrader && !pdtStatus?.meetsRequirement ? (
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            ) : pdtStatus?.warning ? (
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
            ) : (
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            )}
            Pattern Day Trader Status
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Day Trades (5 days):</span>
              <span className="font-medium">{pdtStatus?.dayTradeCount || 0} / 3</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining Trades:</span>
              <span className={`font-medium ${
                (pdtStatus?.dayTradesRemaining || 0) === 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {pdtStatus?.dayTradesRemaining || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">PDT Status:</span>
              <span className={`font-medium ${
                pdtStatus?.isPatternDayTrader ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {pdtStatus?.isPatternDayTrader ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          {pdtStatus?.warning && (
            <div className="mt-3 text-xs text-yellow-800 bg-yellow-100 rounded p-2">
              {pdtStatus.warning}
            </div>
          )}
        </div>
      </div>

      {lastSync && (
        <div className="text-xs text-gray-500 text-right">
          Last synced: {lastSync.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
