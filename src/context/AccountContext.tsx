/**
 * Account Context
 *
 * Manages the currently selected trading account (Paper or Live Broker)
 * Provides account switching, mode detection, and account information
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import { supabase } from '../lib/supabase'

export type AccountMode = 'paper' | 'live'

export type BrokerType = 'alpaca' | 'ibkr' | 'robinhood' | 'zerodha' | 'icici' | 'hdfc'

export interface TradingAccount {
  id: string
  name: string
  mode: AccountMode
  broker?: BrokerType
  balance: number
  currency: string
  isConnected: boolean
  displayName: string
  description: string
}

export interface AccountContextType {
  selectedAccount: TradingAccount
  availableAccounts: TradingAccount[]
  selectAccount: (accountId: string) => void
  refreshAccounts: () => Promise<void>
  isPaperMode: boolean
  isLiveMode: boolean
  getBrokerDisplayName: (broker?: BrokerType) => string
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

// Default paper trading account
const DEFAULT_PAPER_ACCOUNT: TradingAccount = {
  id: 'paper',
  name: 'Paper Trading',
  mode: 'paper',
  balance: 100000,
  currency: 'USD',
  isConnected: true,
  displayName: '📝 Paper Trading',
  description: 'Practice with virtual money - $100,000'
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount>(DEFAULT_PAPER_ACCOUNT)
  const [availableAccounts, setAvailableAccounts] = useState<TradingAccount[]>([DEFAULT_PAPER_ACCOUNT])

  // Get broker display name
  const getBrokerDisplayName = (broker?: BrokerType): string => {
    if (!broker) return 'Paper Trading'

    const names: Record<BrokerType, string> = {
      alpaca: 'Alpaca Markets',
      ibkr: 'Interactive Brokers',
      robinhood: 'Robinhood',
      zerodha: 'Zerodha',
      icici: 'ICICI Direct',
      hdfc: 'HDFC Securities'
    }

    return names[broker] || broker
  }

  // Load connected broker accounts
  const refreshAccounts = async () => {
    if (!user) {
      setAvailableAccounts([DEFAULT_PAPER_ACCOUNT])
      setSelectedAccount(DEFAULT_PAPER_ACCOUNT)
      return
    }

    const accounts: TradingAccount[] = [DEFAULT_PAPER_ACCOUNT]

    try {
      // Check Alpaca
      const { data: alpacaData } = await supabase
        .from('alpaca_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (alpacaData) {
        accounts.push({
          id: `alpaca-${alpacaData.environment}`,
          name: 'Alpaca Markets',
          mode: 'live',
          broker: 'alpaca',
          balance: 0, // Would fetch from Alpaca API
          currency: 'USD',
          isConnected: true,
          displayName: `💰 Alpaca ${alpacaData.environment === 'paper' ? '(Paper)' : '(Live)'}`,
          description: alpacaData.environment === 'paper' ? 'Alpaca paper account' : 'REAL MONEY - Commission-free trading'
        })
      }

      // Check IBKR
      const { data: ibkrData } = await supabase
        .from('ibkr_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (ibkrData) {
        accounts.push({
          id: 'ibkr-live',
          name: 'Interactive Brokers',
          mode: 'live',
          broker: 'ibkr',
          balance: 0,
          currency: 'USD',
          isConnected: true,
          displayName: '💰 Interactive Brokers (Live)',
          description: 'REAL MONEY - Global markets access'
        })
      }

      // Check Robinhood
      const { data: robinhoodData } = await supabase
        .from('robinhood_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (robinhoodData) {
        accounts.push({
          id: 'robinhood-live',
          name: 'Robinhood',
          mode: 'live',
          broker: 'robinhood',
          balance: 0,
          currency: 'USD',
          isConnected: true,
          displayName: '💰 Robinhood Crypto (Live)',
          description: 'REAL MONEY - Cryptocurrency trading'
        })
      }

      // Check Zerodha
      const { data: zerodhaData } = await supabase
        .from('zerodha_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (zerodhaData) {
        accounts.push({
          id: 'zerodha-live',
          name: 'Zerodha',
          mode: 'live',
          broker: 'zerodha',
          balance: 0,
          currency: 'INR',
          isConnected: true,
          displayName: '💰 Zerodha (Live)',
          description: 'REAL MONEY - Indian markets trading'
        })
      }

      // Check ICICI Direct
      const { data: iciciData } = await supabase
        .from('icici_direct_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (iciciData) {
        accounts.push({
          id: `icici-${iciciData.environment}`,
          name: 'ICICI Direct',
          mode: 'live',
          broker: 'icici',
          balance: 0,
          currency: 'INR',
          isConnected: true,
          displayName: `💰 ICICI Direct (${iciciData.environment === 'demo' ? 'Demo' : 'Live'})`,
          description: iciciData.environment === 'demo' ? 'ICICI demo account' : 'REAL MONEY - NSE, BSE, NFO trading'
        })
      }

      // Check HDFC Securities
      const { data: hdfcData } = await supabase
        .from('hdfc_securities_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (hdfcData) {
        accounts.push({
          id: `hdfc-${hdfcData.environment}`,
          name: 'HDFC Securities',
          mode: 'live',
          broker: 'hdfc',
          balance: 0,
          currency: 'INR',
          isConnected: true,
          displayName: `💰 HDFC Securities (${hdfcData.environment === 'demo' ? 'Demo' : 'Live'})`,
          description: hdfcData.environment === 'demo' ? 'HDFC demo account' : 'REAL MONEY - Advanced Indian trading'
        })
      }

      setAvailableAccounts(accounts)

      // If selected account is no longer available, switch to paper
      const stillAvailable = accounts.find(acc => acc.id === selectedAccount.id)
      if (!stillAvailable) {
        setSelectedAccount(DEFAULT_PAPER_ACCOUNT)
      }

    } catch (error) {
      console.error('Error loading broker accounts:', error)
      setAvailableAccounts([DEFAULT_PAPER_ACCOUNT])
    }
  }

  // Select account by ID
  const selectAccount = (accountId: string) => {
    const account = availableAccounts.find(acc => acc.id === accountId)
    if (account) {
      setSelectedAccount(account)
      // Save to localStorage for persistence
      localStorage.setItem('selectedAccountId', accountId)
    }
  }

  // Load from localStorage on mount
  useEffect(() => {
    const savedAccountId = localStorage.getItem('selectedAccountId')
    if (savedAccountId && savedAccountId !== 'paper') {
      // Wait for accounts to load, then select
      refreshAccounts().then(() => {
        const savedAccount = availableAccounts.find(acc => acc.id === savedAccountId)
        if (savedAccount) {
          setSelectedAccount(savedAccount)
        }
      })
    } else {
      refreshAccounts()
    }
  }, [user])

  const value: AccountContextType = {
    selectedAccount,
    availableAccounts,
    selectAccount,
    refreshAccounts,
    isPaperMode: selectedAccount.mode === 'paper',
    isLiveMode: selectedAccount.mode === 'live',
    getBrokerDisplayName
  }

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider')
  }
  return context
}
