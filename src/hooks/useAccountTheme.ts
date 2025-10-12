/**
 * Account Theme Hook
 *
 * Provides color-coded theme classes based on current account mode
 * Paper mode = Green theme, Live mode = Red theme
 */

import { useAccount } from '../context/AccountContext'

export interface AccountTheme {
  // Background colors
  bgPrimary: string
  bgSecondary: string
  bgHover: string

  // Text colors
  textPrimary: string
  textSecondary: string

  // Border colors
  border: string
  borderHover: string

  // Button colors
  buttonPrimary: string
  buttonHover: string
  buttonText: string

  // Badge colors
  badgeBg: string
  badgeText: string
  badgeBorder: string

  // Alert/Banner colors
  alertBg: string
  alertBorder: string
  alertText: string

  // Chart/Graph accent
  chartAccent: string

  // Gradient
  gradient: string

  // Mode indicator
  modeIcon: string
  modeName: string
}

export function useAccountTheme(): AccountTheme {
  const { isPaperMode, isLiveMode } = useAccount()

  if (isPaperMode) {
    return {
      // Green theme for paper trading
      bgPrimary: 'bg-green-50',
      bgSecondary: 'bg-green-100',
      bgHover: 'bg-green-200',

      textPrimary: 'text-green-900',
      textSecondary: 'text-green-700',

      border: 'border-green-300',
      borderHover: 'border-green-400',

      buttonPrimary: 'bg-green-600 hover:bg-green-700',
      buttonHover: 'hover:bg-green-100',
      buttonText: 'text-white',

      badgeBg: 'bg-green-100',
      badgeText: 'text-green-800',
      badgeBorder: 'border-green-300',

      alertBg: 'bg-green-50',
      alertBorder: 'border-green-200',
      alertText: 'text-green-700',

      chartAccent: '#10b981', // green-500

      gradient: 'from-green-600 to-emerald-600',

      modeIcon: '📝',
      modeName: 'Paper Trading'
    }
  }

  if (isLiveMode) {
    return {
      // Red theme for live trading
      bgPrimary: 'bg-red-50',
      bgSecondary: 'bg-red-100',
      bgHover: 'bg-red-200',

      textPrimary: 'text-red-900',
      textSecondary: 'text-red-700',

      border: 'border-red-300',
      borderHover: 'border-red-400',

      buttonPrimary: 'bg-red-600 hover:bg-red-700',
      buttonHover: 'hover:bg-red-100',
      buttonText: 'text-white',

      badgeBg: 'bg-red-100',
      badgeText: 'text-red-800',
      badgeBorder: 'border-red-300',

      alertBg: 'bg-red-50',
      alertBorder: 'border-red-200',
      alertText: 'text-red-700',

      chartAccent: '#ef4444', // red-500

      gradient: 'from-red-600 to-orange-600',

      modeIcon: '🔴',
      modeName: 'Live Trading'
    }
  }

  // Default theme (shouldn't reach here)
  return {
    bgPrimary: 'bg-blue-50',
    bgSecondary: 'bg-blue-100',
    bgHover: 'bg-blue-200',

    textPrimary: 'text-blue-900',
    textSecondary: 'text-blue-700',

    border: 'border-blue-300',
    borderHover: 'border-blue-400',

    buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
    buttonHover: 'hover:bg-blue-100',
    buttonText: 'text-white',

    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',

    alertBg: 'bg-blue-50',
    alertBorder: 'border-blue-200',
    alertText: 'text-blue-700',

    chartAccent: '#3b82f6',

    gradient: 'from-blue-600 to-indigo-600',

    modeIcon: '📊',
    modeName: 'Trading'
  }
}
