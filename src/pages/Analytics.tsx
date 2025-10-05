import React, { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Calendar } from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { useTradingContext } from '../context/TradingContext'
import { format, subDays, startOfDay } from 'date-fns'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// Mock historical data for demonstration
const generateHistoricalData = (days: number) => {
  const data = []
  let value = 100000
  
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const change = (Math.random() - 0.5) * 2000 // Random change between -1000 and +1000
    value += change
    
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      value: Math.round(value),
      change: Math.round(change),
      changePercent: ((change / (value - change)) * 100)
    })
  }
  
  return data
}

export default function Analytics() {
  const { state } = useTradingContext()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
  }

  const getDaysFromRange = (range: string) => {
    switch (range) {
      case '7d': return 7
      case '30d': return 30
      case '90d': return 90
      case '1y': return 365
      default: return 30
    }
  }

  const historicalData = generateHistoricalData(getDaysFromRange(timeRange))
  
  // Calculate performance metrics
  const startValue = historicalData[0]?.value || 100000
  const currentValue = state.totalValue
  const totalReturn = currentValue - startValue
  const totalReturnPercent = ((totalReturn / startValue) * 100)
  
  // Calculate sector allocation (mock data)
  const sectorData = [
    { name: 'Technology', value: 45, color: COLORS[0] },
    { name: 'Healthcare', value: 20, color: COLORS[1] },
    { name: 'Finance', value: 15, color: COLORS[2] },
    { name: 'Consumer', value: 12, color: COLORS[3] },
    { name: 'Energy', value: 8, color: COLORS[4] }
  ]

  // Monthly performance data
  const monthlyData = [
    { month: 'Jan', profit: 2500, trades: 15 },
    { month: 'Feb', profit: -800, trades: 12 },
    { month: 'Mar', profit: 3200, trades: 18 },
    { month: 'Apr', profit: 1800, trades: 14 },
    { month: 'May', profit: -1200, trades: 10 },
    { month: 'Jun', profit: 4500, trades: 22 }
  ]

  // Risk metrics
  const positions = state.positions
  const totalPositionValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0)
  const largestPosition = positions.reduce((max, pos) => 
    pos.totalValue > max.totalValue ? pos : max, 
    { totalValue: 0, symbol: '' }
  )
  const concentration = totalPositionValue > 0 ? (largestPosition.totalValue / totalPositionValue) * 100 : 0

  // Trading activity
  const totalTrades = state.orders.filter(o => o.status === 'filled').length
  const buyTrades = state.orders.filter(o => o.status === 'filled' && o.type === 'buy').length
  const sellTrades = state.orders.filter(o => o.status === 'filled' && o.type === 'sell').length
  const winRate = positions.length > 0 ? (positions.filter(p => p.unrealizedPnL > 0).length / positions.length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Return</p>
                <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalReturn)}
                </p>
                <p className={`text-sm ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(totalReturnPercent)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">{winRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">{positions.filter(p => p.unrealizedPnL > 0).length} winners</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Trades</p>
                <p className="text-2xl font-bold text-gray-900">{totalTrades}</p>
                <p className="text-sm text-gray-500">{buyTrades} buys, {sellTrades} sells</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PieChart className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Concentration</p>
                <p className="text-2xl font-bold text-gray-900">{concentration.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">{largestPosition.symbol || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Portfolio Performance</h3>
            <div className="flex space-x-2">
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    timeRange === range
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Monthly Performance</h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'profit' ? formatCurrency(value) : value,
                      name === 'profit' ? 'Profit/Loss' : 'Trades'
                    ]}
                  />
                  <Bar 
                    dataKey="profit" 
                    fill="#2563eb"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Sector Allocation</h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Allocation']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Risk Analysis</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{positions.length}</div>
              <div className="text-sm text-gray-500">Total Positions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{concentration.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Largest Position</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {((state.balance / state.totalValue) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Cash Allocation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {positions.length > 0 ? (positions.reduce((sum, p) => sum + Math.abs(p.unrealizedPnLPercent), 0) / positions.length).toFixed(1) : '0.0'}%
              </div>
              <div className="text-sm text-gray-500">Avg Volatility</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Top Performers</h3>
          </div>
          <div className="card-body">
            {positions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No positions to analyze</p>
            ) : (
              <div className="space-y-3">
                {positions
                  .sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
                  .slice(0, 5)
                  .map((position) => (
                    <div key={position.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{position.symbol}</div>
                        <div className="text-sm text-gray-500">{formatCurrency(position.totalValue)}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(position.unrealizedPnLPercent)}
                        </div>
                        <div className={`text-sm ${position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(position.unrealizedPnL)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="card-body">
            {state.orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {state.orders
                  .filter(order => order.status === 'filled')
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .slice(0, 5)
                  .map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.type.toUpperCase()} {order.symbol}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.quantity} shares • {format(order.timestamp, 'MMM dd')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(order.filledPrice || 0)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency((order.filledPrice || 0) * order.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}