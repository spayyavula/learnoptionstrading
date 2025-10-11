import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, RefreshCw, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ZerodhaAccountDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accountData, setAccountData] = useState<any>(null)
  const [marginData, setMarginData] = useState<any>(null)
  const [positionsData, setPositionsData] = useState<any[]>([])
  const [holdingsData, setHoldingsData] = useState<any[]>([])

  useEffect(() => {
    loadAccountData()
  }, [])

  const loadAccountData = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get account info
      const { data: accountInfo, error: accountError } = await supabase
        .from('zerodha_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (accountError && accountError.code !== 'PGRST116') throw accountError

      setAccountData(accountInfo)

      // Get margin data
      const { data: margins, error: marginError } = await supabase
        .from('zerodha_margins')
        .select('*')
        .eq('user_id', user.id)
        .order('last_synced_at', { ascending: false })

      if (marginError && marginError.code !== 'PGRST116') throw marginError

      if (margins && margins.length > 0) {
        setMarginData(margins[0])
      }

      // Get positions
      const { data: positions, error: positionsError } = await supabase
        .from('zerodha_positions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_synced_at', { ascending: false })

      if (positionsError && positionsError.code !== 'PGRST116') throw positionsError

      setPositionsData(positions || [])

      // Get holdings
      const { data: holdings, error: holdingsError } = await supabase
        .from('zerodha_holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('last_synced_at', { ascending: false })

      if (holdingsError && holdingsError.code !== 'PGRST116') throw holdingsError

      setHoldingsData(holdings || [])

    } catch (err) {
      console.error('Error loading Zerodha account data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load account data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount && amount !== 0) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const calculateTotalPnL = () => {
    const positionsPnL = positionsData.reduce((sum, pos) => sum + (pos.pnl || 0), 0)
    const holdingsPnL = holdingsData.reduce((sum, holding) => sum + (holding.pnl || 0), 0)
    return positionsPnL + holdingsPnL
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error Loading Account</p>
            <p className="text-sm text-red-800 mt-1">{error}</p>
            <button
              onClick={loadAccountData}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!accountData) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600">No account data found. Please sync your account.</p>
        <button
          onClick={loadAccountData}
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Sync Account
        </button>
      </div>
    )
  }

  const totalPnL = calculateTotalPnL()
  const isPnLPositive = totalPnL >= 0

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Account Overview</h3>
        <button
          onClick={loadAccountData}
          disabled={loading}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Account Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Margin */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">Available Margin</span>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(marginData?.net || 0)}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Cash: {formatCurrency(marginData?.available_cash || 0)}
          </p>
        </div>

        {/* Total P&L */}
        <div className={`bg-gradient-to-br ${isPnLPositive ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-800">Total P&L</span>
            {isPnLPositive ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
          <p className={`text-2xl font-bold ${isPnLPositive ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(totalPnL)}
          </p>
          <p className="text-xs text-gray-700 mt-1">
            Today's performance
          </p>
        </div>

        {/* Positions Count */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-800">Open Positions</span>
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {positionsData.length}
          </p>
          <p className="text-xs text-purple-700 mt-1">
            Active trades
          </p>
        </div>

        {/* Holdings Count */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-800">Holdings</span>
            <BarChart3 className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900">
            {holdingsData.length}
          </p>
          <p className="text-xs text-orange-700 mt-1">
            Long-term investments
          </p>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Account Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">User Name</p>
            <p className="text-sm font-medium text-gray-900">{accountData.user_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-sm font-medium text-gray-900">{accountData.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Account Type</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{accountData.user_type || 'Individual'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Available Exchanges</p>
            <p className="text-sm font-medium text-gray-900">
              {accountData.exchanges?.join(', ') || 'NSE, BSE, NFO'}
            </p>
          </div>
        </div>
      </div>

      {/* Margin Details */}
      {marginData && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Margin Details (Equity)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Available Cash</p>
              <p className="text-sm font-semibold text-green-700">{formatCurrency(marginData.available_cash)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Collateral</p>
              <p className="text-sm font-semibold text-blue-700">{formatCurrency(marginData.available_collateral)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Used Margin</p>
              <p className="text-sm font-semibold text-red-700">{formatCurrency(marginData.utilised_debits)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">SPAN Margin</p>
              <p className="text-sm font-semibold text-gray-700">{formatCurrency(marginData.utilised_span)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Exposure Margin</p>
              <p className="text-sm font-semibold text-gray-700">{formatCurrency(marginData.utilised_exposure)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Option Premium</p>
              <p className="text-sm font-semibold text-gray-700">{formatCurrency(marginData.utilised_option_premium)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Positions List */}
      {positionsData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Open Positions</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-600 py-2">Symbol</th>
                  <th className="text-right text-xs font-semibold text-gray-600 py-2">Qty</th>
                  <th className="text-right text-xs font-semibold text-gray-600 py-2">Avg Price</th>
                  <th className="text-right text-xs font-semibold text-gray-600 py-2">LTP</th>
                  <th className="text-right text-xs font-semibold text-gray-600 py-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {positionsData.slice(0, 5).map((position) => {
                  const pnl = position.pnl || 0
                  const isPnLPos = pnl >= 0
                  return (
                    <tr key={position.id} className="border-b border-gray-100">
                      <td className="text-sm font-medium text-gray-900 py-2">{position.tradingsymbol}</td>
                      <td className="text-sm text-right text-gray-700 py-2">{position.quantity}</td>
                      <td className="text-sm text-right text-gray-700 py-2">{formatCurrency(position.average_price)}</td>
                      <td className="text-sm text-right text-gray-700 py-2">{formatCurrency(position.last_price)}</td>
                      <td className={`text-sm text-right font-semibold py-2 ${isPnLPos ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(pnl)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {positionsData.length > 5 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Showing 5 of {positionsData.length} positions
            </p>
          )}
        </div>
      )}

      {/* Last Synced */}
      <div className="text-xs text-gray-500 text-center">
        Last synced: {accountData.last_synced_at ? new Date(accountData.last_synced_at).toLocaleString() : 'Never'}
      </div>
    </div>
  )
}
