/**
 * Account Selector Component
 *
 * Dropdown in header to switch between Paper and Live trading accounts
 * Shows available brokers and current account balance
 */

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Check, TrendingUp, DollarSign } from 'lucide-react'
import { useAccount } from '../context/AccountContext'
import { useNavigate } from 'react-router-dom'

export function AccountSelector() {
  const { selectedAccount, availableAccounts, selectAccount, isPaperMode } = useAccount()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatBalance = (balance: number, currency: string) => {
    if (currency === 'INR') {
      return `₹${balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    }
    return `$${balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }

  const handleAccountSelect = (accountId: string) => {
    selectAccount(accountId)
    setIsOpen(false)
  }

  const handleAddBroker = () => {
    setIsOpen(false)
    navigate('/app/broker-connections')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
          isPaperMode
            ? 'bg-green-100 text-green-900 hover:bg-green-200 border-2 border-green-300'
            : 'bg-red-100 text-red-900 hover:bg-red-200 border-2 border-red-300'
        }`}
      >
        <span className="text-lg">{isPaperMode ? '📝' : '💰'}</span>
        <div className="text-left">
          <div className="text-sm font-bold">{selectedAccount.displayName}</div>
          <div className="text-xs opacity-75">
            {formatBalance(selectedAccount.balance, selectedAccount.currency)}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">
              Select Trading Account
            </div>
            <div className="text-sm mt-1">
              {availableAccounts.length} account{availableAccounts.length !== 1 ? 's' : ''} available
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {availableAccounts.map((account) => {
              const isSelected = account.id === selectedAccount.id
              const isPaper = account.mode === 'paper'

              return (
                <button
                  key={account.id}
                  onClick={() => handleAccountSelect(account.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div
                        className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                          isPaper
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isPaper ? '📝' : '💰'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="font-bold text-gray-900">
                            {account.name}
                          </div>
                          {!isPaper && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                              LIVE
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mt-0.5">
                          {account.description}
                        </div>

                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center text-sm">
                            <DollarSign className="h-3.5 w-3.5 text-gray-400 mr-1" />
                            <span className="font-semibold text-gray-700">
                              {formatBalance(account.balance, account.currency)}
                            </span>
                          </div>

                          {account.isConnected && (
                            <div className="flex items-center text-xs text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                              <span className="font-medium">Connected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Add Broker Button */}
          <button
            onClick={handleAddBroker}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 font-semibold flex items-center justify-center space-x-2 transition-colors border-t-2 border-blue-200"
          >
            <Plus className="h-5 w-5" />
            <span>Add Broker Connection</span>
          </button>
        </div>
      )}
    </div>
  )
}
