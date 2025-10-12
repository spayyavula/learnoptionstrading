/**
 * Account-Aware Positions Component
 *
 * Example component showing how to filter positions by selected account
 * and use color-coded themes. This serves as a template for updating
 * existing trading components.
 */

import React, { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { useAccount } from '../context/AccountContext'
import { useAccountTheme } from '../hooks/useAccountTheme'
import { TradeConfirmationDialog, TradeDetails } from './TradeConfirmationDialog'

interface Position {
  id: string
  symbol: string
  quantity: number
  avgPrice: number
  currentPrice: number
  pl: number
  plPercent: number
  accountId: string // Links position to specific account
}

export function AccountAwarePositions() {
  const { selectedAccount, isPaperMode } = useAccount()
  const theme = useAccountTheme()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [tradeDetails, setTradeDetails] = useState<TradeDetails | null>(null)

  // Example positions data (in real app, fetch from context/API)
  const allPositions: Position[] = [
    {
      id: '1',
      symbol: 'AAPL',
      quantity: 100,
      avgPrice: 150.00,
      currentPrice: 155.00,
      pl: 500.00,
      plPercent: 3.33,
      accountId: 'paper'
    },
    {
      id: '2',
      symbol: 'TSLA',
      quantity: 50,
      avgPrice: 200.00,
      currentPrice: 195.00,
      pl: -250.00,
      plPercent: -2.50,
      accountId: 'paper'
    },
    {
      id: '3',
      symbol: 'SPY',
      quantity: 200,
      avgPrice: 450.00,
      currentPrice: 452.00,
      pl: 400.00,
      plPercent: 0.44,
      accountId: 'alpaca-live'
    }
  ]

  // Filter positions by selected account
  const positions = allPositions.filter(pos => pos.accountId === selectedAccount.id)

  const handleClosePosition = (position: Position) => {
    setTradeDetails({
      action: 'SELL',
      symbol: position.symbol,
      quantity: position.quantity,
      price: position.currentPrice,
      orderType: 'MARKET',
      totalCost: position.quantity * position.currentPrice,
      currency: selectedAccount.currency
    })
    setShowConfirmation(true)
  }

  const handleConfirmTrade = () => {
    console.log('Trade confirmed:', tradeDetails)
    // Execute trade logic here
    setShowConfirmation(false)
    setTradeDetails(null)
  }

  const formatCurrency = (amount: number) => {
    if (selectedAccount.currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const totalPL = positions.reduce((sum, pos) => sum + pos.pl, 0)

  return (
    <div className="space-y-6">
      {/* Header with Account Info */}
      <div className={`rounded-xl p-6 border-2 ${theme.border} ${theme.bgPrimary}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`text-3xl`}>{theme.modeIcon}</div>
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
                Your Positions
              </h2>
              <p className={`text-sm ${theme.textSecondary}`}>
                {selectedAccount.displayName} • {positions.length} position{positions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Total P/L */}
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Total P/L</div>
            <div className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}
            </div>
          </div>
        </div>

        {/* Account Balance */}
        <div className={`flex items-center space-x-2 text-sm ${theme.textSecondary}`}>
          <DollarSign className="h-4 w-4" />
          <span>
            Account Balance: <strong className={theme.textPrimary}>{formatCurrency(selectedAccount.balance)}</strong>
          </span>
          {isPaperMode && <span className="text-xs">(Virtual Money)</span>}
        </div>
      </div>

      {/* Positions Table */}
      {positions.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className={`${theme.bgSecondary} ${theme.textPrimary}`}>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Symbol</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Quantity</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Avg Price</th>
                <th className="px-6 py-3 text-right text-sm font-bold">Current</th>
                <th className="px-6 py-3 text-right text-sm font-bold">P/L</th>
                <th className="px-6 py-3 text-right text-sm font-bold">P/L %</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {positions.map((position) => (
                <tr
                  key={position.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{position.symbol}</div>
                    <div className={`text-xs ${theme.badgeText} ${theme.badgeBg} inline-block px-2 py-0.5 rounded mt-1`}>
                      {selectedAccount.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    {position.quantity}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700">
                    {formatCurrency(position.avgPrice)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    {formatCurrency(position.currentPrice)}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${position.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="flex items-center justify-end space-x-1">
                      {position.pl >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>
                        {position.pl >= 0 ? '+' : ''}{formatCurrency(position.pl)}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${position.plPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {position.plPercent >= 0 ? '+' : ''}{position.plPercent.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleClosePosition(position)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${theme.buttonPrimary} ${theme.buttonText}`}
                    >
                      Close Position
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`${theme.bgPrimary} border-2 ${theme.border} rounded-xl p-12 text-center`}>
          <div className="text-6xl mb-4">{theme.modeIcon}</div>
          <h3 className={`text-xl font-bold ${theme.textPrimary} mb-2`}>
            No Positions in {selectedAccount.name}
          </h3>
          <p className={`${theme.textSecondary}`}>
            {isPaperMode
              ? 'Start practicing by opening your first paper trade!'
              : 'Open a position to see it here.'}
          </p>
        </div>
      )}

      {/* Trade Confirmation Dialog */}
      {tradeDetails && (
        <TradeConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => {
            setShowConfirmation(false)
            setTradeDetails(null)
          }}
          onConfirm={handleConfirmTrade}
          tradeDetails={tradeDetails}
        />
      )}
    </div>
  )
}
