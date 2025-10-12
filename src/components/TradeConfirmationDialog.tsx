/**
 * Trade Confirmation Dialog
 *
 * Enhanced confirmation dialog with extra safety warnings for live trades
 * Paper mode: Simple confirmation
 * Live mode: Extra warnings, checkbox confirmation, red styling
 */

import React, { useState } from 'react'
import { X, AlertTriangle, Shield, DollarSign, Info } from 'lucide-react'
import { useAccount } from '../context/AccountContext'
import { useAccountTheme } from '../hooks/useAccountTheme'

export interface TradeDetails {
  action: 'BUY' | 'SELL'
  symbol: string
  quantity: number
  price: number
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT'
  totalCost: number
  currency?: string
}

interface TradeConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  tradeDetails: TradeDetails
  isLoading?: boolean
}

export function TradeConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  tradeDetails,
  isLoading = false
}: TradeConfirmationDialogProps) {
  const { selectedAccount, isPaperMode, isLiveMode, getBrokerDisplayName } = useAccount()
  const theme = useAccountTheme()
  const [liveTradeConfirmation, setLiveTradeConfirmation] = useState(false)

  if (!isOpen) return null

  const formatCurrency = (amount: number) => {
    const currency = tradeDetails.currency || selectedAccount.currency
    if (currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleConfirm = () => {
    // For live mode, require checkbox confirmation
    if (isLiveMode && !liveTradeConfirmation) {
      return
    }
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full border-4 border-gray-200">
          {/* Header */}
          <div className={`px-6 py-4 border-b-2 ${isPaperMode ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {isPaperMode ? (
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center animate-pulse">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                )}
                <div>
                  <h3 className={`text-xl font-bold ${theme.textPrimary}`}>
                    {isPaperMode ? '📝 Confirm Paper Trade' : '🔴 Confirm LIVE Trade'}
                  </h3>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    {isPaperMode ? 'Virtual money - Practice mode' : `REAL MONEY - ${getBrokerDisplayName(selectedAccount.broker)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-4">
            {/* Trade Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Action:</span>
                <span className={`text-lg font-bold ${tradeDetails.action === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                  {tradeDetails.action} {tradeDetails.quantity} {tradeDetails.symbol}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Order Type:</span>
                <span className="text-sm font-bold text-gray-900">{tradeDetails.orderType}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Price:</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(tradeDetails.price)}</span>
              </div>

              <div className="border-t pt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Total Cost:</span>
                <span className="text-xl font-black text-gray-900">{formatCurrency(tradeDetails.totalCost)}</span>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm text-gray-600 font-medium">Account:</span>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{selectedAccount.name}</div>
                  <div className={`text-xs ${theme.textSecondary}`}>
                    {isPaperMode ? 'Virtual' : 'REAL MONEY'}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Trading Warnings */}
            {isLiveMode && (
              <div className="space-y-3">
                {/* Main Warning */}
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-900 mb-1">⚠️ REAL MONEY TRADE</h4>
                      <p className="text-xs text-red-800">
                        This trade will execute with <strong>real money</strong> on your {getBrokerDisplayName(selectedAccount.broker)} account.
                        This action <strong>cannot be undone</strong>. Proceed with caution.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Disclosure */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-800">
                      <strong>Risk Disclosure:</strong> Trading involves substantial risk of loss. Only trade with money you can afford to lose.
                    </p>
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveTradeConfirmation}
                      onChange={(e) => setLiveTradeConfirmation(e.target.checked)}
                      className="mt-1 h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      I understand this is a <strong>REAL MONEY</strong> trade and I accept the risks involved.
                      This action cannot be undone.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Paper Trading Info */}
            {isPaperMode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800">
                    <strong>Paper Trading:</strong> This is a simulated trade using virtual money. Perfect for practice and learning without any financial risk.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={isLoading || (isLiveMode && !liveTradeConfirmation)}
              className={`flex-1 px-4 py-3 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isPaperMode
                  ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                  : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl animate-pulse'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  {isPaperMode ? (
                    <>📝 Place Paper Trade</>
                  ) : (
                    <>⚠️ PLACE LIVE TRADE</>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
