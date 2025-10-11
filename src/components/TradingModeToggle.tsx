import React, { useState, useEffect } from 'react'
import { Activity, AlertTriangle, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface TradingModeToggleProps {
  currentMode: 'paper' | 'alpaca-paper' | 'alpaca-live' | 'robinhood-crypto' | 'ibkr-paper' | 'ibkr-live' | 'zerodha-live'
  onModeChange: (mode: 'paper' | 'alpaca-paper' | 'alpaca-live' | 'robinhood-crypto' | 'ibkr-paper' | 'ibkr-live' | 'zerodha-live') => void
}

export default function TradingModeToggle({ currentMode, onModeChange }: TradingModeToggleProps) {
  const [hasAlpacaCredentials, setHasAlpacaCredentials] = useState(false)
  const [hasRobinhoodCredentials, setHasRobinhoodCredentials] = useState(false)
  const [hasIBKRCredentials, setHasIBKRCredentials] = useState(false)
  const [hasZerodhaCredentials, setHasZerodhaCredentials] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingMode, setPendingMode] = useState<'paper' | 'alpaca-paper' | 'alpaca-live' | 'robinhood-crypto' | 'ibkr-paper' | 'ibkr-live' | 'zerodha-live' | null>(null)

  useEffect(() => {
    checkCredentials()
  }, [])

  const checkCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: alpacaData } = await supabase
        .from('alpaca_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      setHasAlpacaCredentials(!!alpacaData && alpacaData.length > 0)

      const { data: robinhoodData } = await supabase
        .from('robinhood_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      setHasRobinhoodCredentials(!!robinhoodData && robinhoodData.length > 0)

      const { data: ibkrData } = await supabase
        .from('ibkr_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      setHasIBKRCredentials(!!ibkrData && ibkrData.length > 0)

      const { data: zerodhaData } = await supabase
        .from('zerodha_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      setHasZerodhaCredentials(!!zerodhaData && zerodhaData.length > 0)
    } catch (error) {
      console.error('Error checking credentials:', error)
    }
  }

  const handleModeClick = (mode: 'paper' | 'alpaca-paper' | 'alpaca-live' | 'robinhood-crypto' | 'ibkr-paper' | 'ibkr-live' | 'zerodha-live') => {
    if (mode === currentMode) return

    if (mode.startsWith('alpaca-') && !hasAlpacaCredentials) {
      alert('Please set up your Alpaca credentials first')
      return
    }

    if (mode === 'robinhood-crypto' && !hasRobinhoodCredentials) {
      alert('Please set up your Robinhood Crypto credentials first')
      return
    }

    if (mode.startsWith('ibkr-') && !hasIBKRCredentials) {
      alert('Please set up your IBKR credentials first')
      return
    }

    if (mode === 'zerodha-live' && !hasZerodhaCredentials) {
      alert('Please set up your Zerodha Kite Connect credentials first')
      return
    }

    if (mode === 'alpaca-live' || mode === 'robinhood-crypto' || mode === 'ibkr-live' || mode === 'zerodha-live') {
      setPendingMode(mode)
      setShowConfirmation(true)
    } else {
      onModeChange(mode)
    }
  }

  const confirmModeChange = () => {
    if (pendingMode) {
      onModeChange(pendingMode)
      setShowConfirmation(false)
      setPendingMode(null)
    }
  }

  const cancelModeChange = () => {
    setShowConfirmation(false)
    setPendingMode(null)
  }

  const getModeLabel = (mode: 'paper' | 'alpaca-paper' | 'alpaca-live' | 'robinhood-crypto' | 'ibkr-paper' | 'ibkr-live' | 'zerodha-live') => {
    switch (mode) {
      case 'paper':
        return 'Paper Trading'
      case 'alpaca-paper':
        return 'Alpaca Paper'
      case 'alpaca-live':
        return 'Alpaca Live'
      case 'robinhood-crypto':
        return 'Robinhood Crypto'
      case 'ibkr-paper':
        return 'IBKR Paper'
      case 'ibkr-live':
        return 'IBKR Live'
      case 'zerodha-live':
        return 'Zerodha Live'
    }
  }

  const getModeColor = (mode: 'paper' | 'alpaca-paper' | 'alpaca-live' | 'robinhood-crypto' | 'ibkr-paper' | 'ibkr-live' | 'zerodha-live') => {
    switch (mode) {
      case 'paper':
        return 'blue'
      case 'alpaca-paper':
        return 'green'
      case 'alpaca-live':
        return 'red'
      case 'robinhood-crypto':
        return 'green'
      case 'ibkr-paper':
        return 'blue'
      case 'ibkr-live':
        return 'red'
      case 'zerodha-live':
        return 'orange'
    }
  }

  return (
    <>
      <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleModeClick('paper')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            currentMode === 'paper'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {currentMode === 'paper' && <Activity className="h-4 w-4" />}
            <span>Paper</span>
          </div>
        </button>

        <button
          onClick={() => handleModeClick('alpaca-paper')}
          disabled={!hasAlpacaCredentials}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            currentMode === 'alpaca-paper'
              ? 'bg-green-600 text-white shadow-sm'
              : hasAlpacaCredentials
              ? 'text-gray-700 hover:bg-gray-200'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center space-x-2">
            {currentMode === 'alpaca-paper' && <Activity className="h-4 w-4" />}
            <span>Alpaca Paper</span>
          </div>
        </button>

        <button
          onClick={() => handleModeClick('alpaca-live')}
          disabled={!hasAlpacaCredentials}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            currentMode === 'alpaca-live'
              ? 'bg-red-600 text-white shadow-sm'
              : hasAlpacaCredentials
              ? 'text-gray-700 hover:bg-gray-200'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center space-x-2">
            {currentMode === 'alpaca-live' && <Activity className="h-4 w-4 animate-pulse" />}
            <span>Live Trading</span>
          </div>
        </button>

        <button
          onClick={() => handleModeClick('robinhood-crypto')}
          disabled={!hasRobinhoodCredentials}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            currentMode === 'robinhood-crypto'
              ? 'bg-green-600 text-white shadow-sm'
              : hasRobinhoodCredentials
              ? 'text-gray-700 hover:bg-gray-200'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center space-x-2">
            {currentMode === 'robinhood-crypto' && <Activity className="h-4 w-4 animate-pulse" />}
            <span>RH Crypto</span>
          </div>
        </button>

        <button
          onClick={() => handleModeClick('ibkr-paper')}
          disabled={!hasIBKRCredentials}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            currentMode === 'ibkr-paper'
              ? 'bg-blue-600 text-white shadow-sm'
              : hasIBKRCredentials
              ? 'text-gray-700 hover:bg-gray-200'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center space-x-2">
            {currentMode === 'ibkr-paper' && <Activity className="h-4 w-4" />}
            <span>IBKR Paper</span>
          </div>
        </button>

        <button
          onClick={() => handleModeClick('ibkr-live')}
          disabled={!hasIBKRCredentials}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            currentMode === 'ibkr-live'
              ? 'bg-red-600 text-white shadow-sm'
              : hasIBKRCredentials
              ? 'text-gray-700 hover:bg-gray-200'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center space-x-2">
            {currentMode === 'ibkr-live' && <Activity className="h-4 w-4 animate-pulse" />}
            <span>IBKR Live</span>
          </div>
        </button>

        <button
          onClick={() => handleModeClick('zerodha-live')}
          disabled={!hasZerodhaCredentials}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            currentMode === 'zerodha-live'
              ? 'bg-orange-600 text-white shadow-sm'
              : hasZerodhaCredentials
              ? 'text-gray-700 hover:bg-gray-200'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center space-x-2">
            {currentMode === 'zerodha-live' && <Activity className="h-4 w-4 animate-pulse" />}
            <span>Zerodha Live</span>
          </div>
        </button>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">
                {pendingMode === 'robinhood-crypto' ? 'Switch to Robinhood Crypto?' :
                 pendingMode === 'zerodha-live' ? 'Switch to Zerodha Live Trading?' :
                 'Switch to Live Trading?'}
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-700">
                You are about to switch to <strong>{pendingMode === 'robinhood-crypto' ? 'cryptocurrency trading' :
                  pendingMode === 'zerodha-live' ? 'Indian markets live trading' :
                  'live trading'}</strong> with real money. This means:
              </p>

              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li>All orders will be executed with real money</li>
                <li>Losses will affect your actual account balance</li>
                {pendingMode === 'robinhood-crypto' && <li>Crypto markets trade 24/7 - prices never stop moving</li>}
                {pendingMode === 'robinhood-crypto' && <li>Extremely high volatility - you can lose your entire investment</li>}
                {pendingMode === 'alpaca-live' && <li>You will be subject to Pattern Day Trader rules</li>}
                {pendingMode === 'zerodha-live' && <li>Trading in Indian markets (NSE, BSE, NFO)</li>}
                {pendingMode === 'zerodha-live' && <li>Access token expires daily - re-login required</li>}
                <li>All trades are final and cannot be reversed</li>
                <li>Regulatory compliance checks will be enforced</li>
              </ul>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Only trade with money you can afford to lose. {pendingMode === 'robinhood-crypto' ? 'Cryptocurrency trading' : 'Options trading'} involves significant risk.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelModeChange}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmModeChange}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 mt-1">
        {currentMode === 'paper' && 'Simulated trading with virtual money'}
        {currentMode === 'alpaca-paper' && 'Alpaca paper trading - simulated with live market data'}
        {currentMode === 'alpaca-live' && (
          <span className="text-red-600 font-medium animate-pulse">
            LIVE TRADING - Real money at risk
          </span>
        )}
        {currentMode === 'robinhood-crypto' && (
          <span className="text-green-600 font-medium animate-pulse">
            CRYPTO TRADING - Real money, 24/7 markets
          </span>
        )}
        {currentMode === 'ibkr-paper' && 'IBKR paper trading - simulated with live market data'}
        {currentMode === 'ibkr-live' && (
          <span className="text-red-600 font-medium animate-pulse">
            IBKR LIVE - Real money at risk
          </span>
        )}
        {currentMode === 'zerodha-live' && (
          <span className="text-orange-600 font-medium animate-pulse">
            ZERODHA LIVE - Indian markets, real money
          </span>
        )}
      </div>
    </>
  )
}
