import React, { useState } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react'
import { useTradingContext } from '../context/TradingContext'
import { format } from 'date-fns'

export default function Orders() {
  const { state, dispatch } = useTradingContext()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      dispatch({ type: 'CANCEL_ORDER', payload: orderId })
    }
  }

  const filteredOrders = state.orders
    .filter(order => statusFilter === 'all' || order.status === statusFilter)
    .filter(order => typeFilter === 'all' || order.type === typeFilter)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (status) {
      case 'filled':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const orderStats = {
    total: state.orders.length,
    pending: state.orders.filter(o => o.status === 'pending').length,
    filled: state.orders.filter(o => o.status === 'filled').length,
    cancelled: state.orders.filter(o => o.status === 'cancelled').length,
    rejected: state.orders.filter(o => o.status === 'rejected').length
  }

  return (
    <div className="space-y-6">
      {/* Order Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Filter className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Filled</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.filled}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.rejected}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Order History</h3>
            <div className="flex space-x-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="filled">Filled</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="buy">Buy Orders</option>
                <option value="sell">Sell Orders</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card-body">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Filter className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {state.orders.length === 0 
                  ? "You haven't placed any orders yet."
                  : "No orders match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th>Order Type</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Filled Price</th>
                    <th>Total Value</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const stock = state.stocks.find(s => s.symbol === order.symbol)
                    const totalValue = order.filledPrice 
                      ? (order.filledQuantity || order.quantity) * order.filledPrice
                      : order.price 
                      ? order.quantity * order.price
                      : order.quantity * (stock?.price || 0)

                    return (
                      <tr key={order.id}>
                        <td>
                          <div className="flex items-center">
                            {getStatusIcon(order.status)}
                            <span className={`ml-2 ${getStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="font-medium text-gray-900">{order.symbol}</div>
                          <div className="text-sm text-gray-500">{stock?.name}</div>
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.type === 'buy' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {order.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="capitalize">{order.orderType}</td>
                        <td className="font-medium">
                          {order.filledQuantity || order.quantity}
                          {order.filledQuantity && order.filledQuantity < order.quantity && (
                            <span className="text-sm text-gray-500">
                              /{order.quantity}
                            </span>
                          )}
                        </td>
                        <td>
                          {order.orderType === 'market' 
                            ? 'Market' 
                            : order.price 
                            ? formatCurrency(order.price)
                            : '-'
                          }
                        </td>
                        <td>
                          {order.filledPrice ? formatCurrency(order.filledPrice) : '-'}
                        </td>
                        <td className="font-medium">
                          {formatCurrency(totalValue)}
                        </td>
                        <td className="text-sm text-gray-500">
                          {format(order.timestamp, 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="btn btn-secondary text-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}