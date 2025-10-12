/**
 * Mode Indicator Banner Component
 *
 * Persistent banner showing current trading mode (Paper vs Live)
 * Green for paper trading, Red/Orange for live trading with warnings
 */

import React from 'react'
import { AlertTriangle, Shield, TrendingUp, Info } from 'lucide-react'
import { useAccount } from '../context/AccountContext'

export function ModeIndicatorBanner() {
  const { selectedAccount, isPaperMode, isLiveMode, getBrokerDisplayName } = useAccount()

  if (isPaperMode) {
    return (
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span className="font-bold text-lg">📝 PAPER TRADING MODE</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-white/30"></div>
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">
                Virtual Money: ${selectedAccount.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <Info className="h-4 w-4" />
            <span className="font-medium">Practice safely - No real money at risk</span>
          </div>
        </div>
      </div>
    )
  }

  if (isLiveMode) {
    return (
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-2.5 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <span className="font-black text-lg">🔴 LIVE TRADING MODE</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-white/30"></div>
            <div className="hidden md:flex items-center space-x-2 text-sm font-bold">
              <span>{getBrokerDisplayName(selectedAccount.broker)}</span>
              {selectedAccount.currency === 'INR' && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                  🇮🇳 INDIA
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 animate-pulse" />
            <span className="font-bold text-sm md:text-base">
              REAL MONEY! Trade with caution
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}
