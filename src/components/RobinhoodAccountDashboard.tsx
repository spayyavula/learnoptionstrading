import React, { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, AlertCircle, ExternalLink } from 'lucide-react'
import { RobinhoodService, RobinhoodHolding, RobinhoodOrder } from '../services/robinhoodService'
import { supabase } from '../lib/supabase'

interface RobinhoodAccountDashboardProps {
  userId: string
  environment: 'live' | 'paper'
}

export default function RobinhoodAccountDashboard({ userId, environment }: RobinhoodAccountDashboardProps) {
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [holdings, setHoldings] = useState<RobinhoodHolding[]>([])
  const [orders, setOrders] = useState<RobinhoodOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [marketPrices, setMarketPrices] = useState<Record<string, any>>({})

  useEffect(() => {
    loadAccountData()
    const interval = setInterval(loadAccountData, 30000)
    return () => clearInterval(interval)
  }, [userId, environment])

  const loadAccountData = async () => {
    try {
      setError(null)

      const { data: accountData } = await supabase
        .from('robinhood_account_info')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (accountData) {
        setAccountInfo(accountData)
      }

      const { data: holdingsData } = await supabase
        .from('robinhood_holdings')
        .select('*')
        .eq('user_id', userId)
        .order('market_value', { ascending: false })

      if (holdingsData) {
        setHoldings(holdingsData)

        if (holdingsData.length > 0) {
          const symbols = holdingsData.map(h => h.symbol).filter(Boolean)
          if (symbols.length > 0) {
            try {
              const prices = await RobinhoodService.getBestBidAsk(userId, environment, symbols)
              const priceMap: Record<string, any> = {}
              prices.forEach(p => {
                priceMap[p.symbol] = p
              })
              setMarketPrices(priceMap)
            } catch (err) {
              console.error('Error fetching prices:', err)
            }
          }
        }
      }

      const { data: ordersData } = await supabase
        .from('robinhood_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (ordersData) {
        setOrders(ordersData)
      }
    } catch (err: any) {
      console.error('Error loading account data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)

    try {
      await RobinhoodService.getAccount(userId, environment)
      await RobinhoodService.syncHoldings(userId, environment)
      await RobinhoodService.syncOrders(userId, environment)
      await loadAccountData()
    } catch (err: any) {
      setError(err.message || 'Failed to sync account data')
    } finally {
      setSyncing(false)
    }
  }

  const calculateTotalValue = () => {
    return holdings.reduce((sum, holding) => {
      const price = marketPrices[holding.symbol]?.mark_price || holding.current_price || 0
      return sum + (parseFloat(holding.quantity) * parseFloat(price.toString()))
    }, 0)
  }

  const calculateTotalPL = () => {
    return holdings.reduce((sum, holding) => {
      return sum + (parseFloat(holding.unrealized_pl?.toString() || '0'))
    }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading account data...</span>
      </div>
    )
  }

  const totalValue = calculateTotalValue()
  const totalPL = calculateTotalPL()

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Robinhood Crypto Account</h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Buying Power</span>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${parseFloat(accountInfo?.buying_power || '0').toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Cash: ${parseFloat(accountInfo?.cash_balance || '0').toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Portfolio Value</span>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${totalValue.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {holdings.length} positions
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total P&L</span>
            {totalPL >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(totalPL).toFixed(2)}
          </div>
          <div className={`text-xs mt-1 ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPL >= 0 ? '+' : '-'}{((Math.abs(totalPL) / (totalValue - totalPL)) * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>Live Trading:</strong> This is a live account with real money. Crypto markets trade 24/7 and prices can change rapidly.
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Holdings</h3>
        </div>
        <div className="overflow-x-auto">
          {holdings.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No holdings found. Start trading to see your positions here.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Market Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {holdings.map((holding) => {
                  const currentPrice = parseFloat(marketPrices[holding.symbol]?.mark_price || holding.current_price || '0')
                  const quantity = parseFloat(holding.quantity)
                  const avgCost = parseFloat(holding.avg_cost_basis?.toString() || '0')
                  const marketValue = quantity * currentPrice
                  const costBasis = quantity * avgCost
                  const pl = marketValue - costBasis
                  const plPercent = costBasis > 0 ? (pl / costBasis) * 100 : 0

                  return (
                    <tr key={holding.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{holding.symbol}</div>
                        <div className="text-xs text-gray-500">{holding.asset_name}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {quantity.toFixed(8)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        ${avgCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        ${currentPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        ${marketValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className={pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${Math.abs(pl).toFixed(2)}
                        </div>
                        <div className={`text-xs ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pl >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No orders found. Place your first order to see history here.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {order.symbol}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        order.side === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {order.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                      {order.order_type}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {parseFloat(order.quantity).toFixed(8)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {order.filled_avg_price ? `$${parseFloat(order.filled_avg_price.toString()).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        order.status === 'filled' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <strong>Need help?</strong> Visit the{' '}
            <a
              href="https://robinhood.com/us/en/support/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              Robinhood Support Center
            </a>{' '}
            for questions about your account or crypto trading.
          </div>
        </div>
      </div>
    </div>
  )
}
