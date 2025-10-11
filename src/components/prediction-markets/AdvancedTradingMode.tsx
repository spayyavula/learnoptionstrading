import React, { useState, useEffect, useRef } from 'react'
import { X, TrendingUp, TrendingDown, Zap, Clock, DollarSign, AlertCircle, Settings } from 'lucide-react'
import { FinFeedMarket as PredictionMarket } from '../../services/finfeedService'

interface OrderbookLevel {
  price: number
  quantity: number
  total: number
}

interface OpenOrder {
  id: string
  market: string
  side: 'yes' | 'no'
  type: 'market' | 'limit'
  quantity: number
  price: number
  filled: number
  remaining: number
  status: 'open' | 'partially_filled' | 'filled' | 'cancelled'
  timestamp: Date
}

interface Position {
  market: string
  side: 'yes' | 'no'
  quantity: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
}

interface AdvancedTradingModeProps {
  market: PredictionMarket
  onClose: () => void
  onPlaceOrder: (order: any) => Promise<void>
}

export const AdvancedTradingMode: React.FC<AdvancedTradingModeProps> = ({
  market,
  onClose,
  onPlaceOrder
}) => {
  const [orderSide, setOrderSide] = useState<'yes' | 'no'>('yes')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit')
  const [quantity, setQuantity] = useState<string>('10')
  const [price, setPrice] = useState<string>((market.yes_price || 0.5).toFixed(3))
  const [timeInForce, setTimeInForce] = useState<'gtc' | 'ioc' | 'fok'>('gtc')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  // Mock orderbook data - would come from API in production
  const [orderbook, setOrderbook] = useState({
    bids: [
      { price: 0.415, quantity: 250, total: 103.75 },
      { price: 0.410, quantity: 400, total: 164.00 },
      { price: 0.405, quantity: 180, total: 72.90 },
      { price: 0.400, quantity: 600, total: 240.00 },
      { price: 0.395, quantity: 320, total: 126.40 }
    ],
    asks: [
      { price: 0.425, quantity: 180, total: 76.50 },
      { price: 0.430, quantity: 320, total: 137.60 },
      { price: 0.435, quantity: 500, total: 217.50 },
      { price: 0.440, quantity: 220, total: 96.80 },
      { price: 0.445, quantity: 400, total: 178.00 }
    ]
  })

  // Mock open orders
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([
    {
      id: '1',
      market: market.ticker,
      side: 'yes',
      type: 'limit',
      quantity: 100,
      price: 0.40,
      filled: 0,
      remaining: 100,
      status: 'open',
      timestamp: new Date(Date.now() - 3600000)
    }
  ])

  // Mock position
  const [position, setPosition] = useState<Position | null>({
    market: market.ticker,
    side: 'yes',
    quantity: 250,
    avgPrice: 0.395,
    currentPrice: 0.425,
    pnl: 7.50,
    pnlPercent: 7.6
  })

  const priceInputRef = useRef<HTMLInputElement>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmitOrder()
      } else if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'b' && e.ctrlKey) {
        e.preventDefault()
        setOrderSide('yes')
      } else if (e.key === 's' && e.ctrlKey) {
        e.preventDefault()
        setOrderSide('no')
      } else if (e.key === 'm' && e.ctrlKey) {
        e.preventDefault()
        setOrderType(prev => prev === 'market' ? 'limit' : 'market')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [quantity, price, orderSide, orderType])

  const handleLevelClick = (level: OrderbookLevel, isBid: boolean) => {
    setPrice(level.price.toFixed(3))
    setSelectedLevel(level.price)
    setOrderSide(isBid ? 'yes' : 'no')
    setOrderType('limit')
  }

  const handleQuickTrade = (isBid: boolean, level: OrderbookLevel) => {
    setOrderSide(isBid ? 'no' : 'yes') // Buy at ask, sell at bid
    setPrice(level.price.toFixed(3))
    setOrderType('market')
    setQuantity(level.quantity.toString())
    handleSubmitOrder()
  }

  const handleSubmitOrder = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await onPlaceOrder({
        market: market.ticker,
        side: orderSide,
        type: orderType,
        quantity: parseInt(quantity),
        price: orderType === 'limit' ? parseFloat(price) : undefined,
        timeInForce
      })

      // Add to open orders (mock)
      const newOrder: OpenOrder = {
        id: Date.now().toString(),
        market: market.ticker,
        side: orderSide,
        type: orderType,
        quantity: parseInt(quantity),
        price: orderType === 'limit' ? parseFloat(price) : (orderSide === 'yes' ? (market.yes_ask || 0.5) : (market.no_ask || 0.5)),
        filled: 0,
        remaining: parseInt(quantity),
        status: 'open',
        timestamp: new Date()
      }
      setOpenOrders(prev => [newOrder, ...prev])

      // Reset form
      setQuantity('10')
      if (orderType === 'market') {
        setOrderType('limit')
      }
    } catch (error) {
      console.error('Order submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelOrder = (orderId: string) => {
    setOpenOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'cancelled' as const } : o
    ))
  }

  const calculateEstimate = () => {
    const qty = parseInt(quantity) || 0
    const prc = parseFloat(price) || 0
    const cost = qty * prc
    const fees = cost * 0.005 // 0.5% fee
    const total = cost + fees

    return { cost, fees, total, contracts: qty }
  }

  const estimate = calculateEstimate()

  const midPrice = ((market.yes_bid || 0.4) + (market.yes_ask || 0.5)) / 2
  const spread = (market.yes_ask || 0.5) - (market.yes_bid || 0.4)
  const spreadPercent = (spread / midPrice) * 100

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold">{market.ticker}</h2>
            <p className="text-sm text-gray-400 line-clamp-1">{market.title}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs text-gray-400">Mid Price</div>
              <div className="text-lg font-bold">{(midPrice * 100).toFixed(1)}%</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Spread</div>
              <div className="text-sm text-gray-300">{spreadPercent.toFixed(2)}%</div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Orderbook & Chart */}
          <div className="w-1/3 border-r border-gray-800 flex flex-col">
            {/* Orderbook */}
            <div className="flex-1 overflow-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Order Book</h3>
                <span className="text-xs text-gray-400">Price × Qty = Total</span>
              </div>

              {/* Asks (Sell Orders) */}
              <div className="space-y-1 mb-2">
                {[...orderbook.asks].reverse().map((level, i) => (
                  <div
                    key={i}
                    onClick={() => handleLevelClick(level, false)}
                    onDoubleClick={() => handleQuickTrade(false, level)}
                    className={`relative cursor-pointer hover:bg-red-900/20 rounded px-2 py-1 transition-colors ${
                      selectedLevel === level.price ? 'ring-2 ring-red-500' : ''
                    }`}
                  >
                    <div
                      className="absolute inset-y-0 right-0 bg-red-900/30"
                      style={{ width: `${(level.quantity / 600) * 100}%` }}
                    />
                    <div className="relative flex items-center justify-between text-xs">
                      <span className="text-red-400 font-mono">${level.price.toFixed(3)}</span>
                      <span className="text-gray-400">{level.quantity}</span>
                      <span className="text-gray-500">${level.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Spread */}
              <div className="py-2 px-2 bg-gray-800 rounded text-center mb-2">
                <div className="text-xs text-gray-400">Spread</div>
                <div className="text-sm font-semibold text-yellow-400">
                  ${spread.toFixed(3)} ({spreadPercent.toFixed(2)}%)
                </div>
              </div>

              {/* Bids (Buy Orders) */}
              <div className="space-y-1">
                {orderbook.bids.map((level, i) => (
                  <div
                    key={i}
                    onClick={() => handleLevelClick(level, true)}
                    onDoubleClick={() => handleQuickTrade(true, level)}
                    className={`relative cursor-pointer hover:bg-green-900/20 rounded px-2 py-1 transition-colors ${
                      selectedLevel === level.price ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    <div
                      className="absolute inset-y-0 right-0 bg-green-900/30"
                      style={{ width: `${(level.quantity / 600) * 100}%` }}
                    />
                    <div className="relative flex items-center justify-between text-xs">
                      <span className="text-green-400 font-mono">${level.price.toFixed(3)}</span>
                      <span className="text-gray-400">{level.quantity}</span>
                      <span className="text-gray-500">${level.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800 text-xs">
                <p className="text-blue-300">
                  <strong>Pro Tip:</strong> Click price to set limit order, double-click to instant market order.
                </p>
              </div>
            </div>
          </div>

          {/* Center Panel - Order Entry */}
          <div className="flex-1 flex flex-col">
            {/* Order Entry Form */}
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold mb-4">Order Entry</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Side Selection */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Side</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOrderSide('yes')}
                      className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                        orderSide === 'yes'
                          ? 'bg-green-600 text-white ring-2 ring-green-400'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      YES
                    </button>
                    <button
                      onClick={() => setOrderSide('no')}
                      className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                        orderSide === 'no'
                          ? 'bg-red-600 text-white ring-2 ring-red-400'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOrderType('limit')}
                      className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                        orderType === 'limit'
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      Limit
                    </button>
                    <button
                      onClick={() => setOrderType('market')}
                      className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                        orderType === 'market'
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      Market
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Quantity */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Quantity (contracts)</label>
                  <input
                    ref={quantityInputRef}
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>

                {/* Price */}
                {orderType === 'limit' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Price ($ per contract)</label>
                    <input
                      ref={priceInputRef}
                      type="number"
                      step="0.001"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.425"
                    />
                  </div>
                )}
              </div>

              {/* Time in Force */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-2">Time in Force</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['gtc', 'ioc', 'fok'] as const).map(tif => (
                    <button
                      key={tif}
                      onClick={() => setTimeInForce(tif)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        timeInForce === tif
                          ? 'bg-gray-700 text-white ring-2 ring-gray-500'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {tif.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {timeInForce === 'gtc' && 'Good-Til-Cancelled: Order remains active until filled or cancelled'}
                  {timeInForce === 'ioc' && 'Immediate-or-Cancel: Fill immediately or cancel'}
                  {timeInForce === 'fok' && 'Fill-or-Kill: Fill entire order immediately or cancel'}
                </p>
              </div>

              {/* Estimate */}
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Estimated Cost:</span>
                  <span className="font-mono">${estimate.cost.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Fees (0.5%):</span>
                  <span className="font-mono">${estimate.fees.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700">
                  <span className="text-gray-300 font-semibold">Total:</span>
                  <span className="font-mono font-bold">${estimate.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting || !quantity || (orderType === 'limit' && !price)}
                className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                  orderSide === 'yes'
                    ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? 'Placing Order...' : `Place ${orderType.toUpperCase()} Order`}
              </button>

              {/* Keyboard Shortcuts */}
              <div className="mt-3 p-2 bg-gray-800 rounded text-xs text-gray-400">
                <strong>Shortcuts:</strong> Enter (Submit) • Esc (Close) • Ctrl+B (Buy) • Ctrl+S (Sell) • Ctrl+M (Toggle Market/Limit)
              </div>
            </div>

            {/* Open Orders */}
            <div className="flex-1 overflow-auto p-4">
              <h3 className="text-sm font-semibold mb-3">Open Orders ({openOrders.filter(o => o.status === 'open').length})</h3>

              {openOrders.filter(o => o.status === 'open' || o.status === 'partially_filled').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No open orders
                </div>
              ) : (
                <div className="space-y-2">
                  {openOrders.filter(o => o.status === 'open' || o.status === 'partially_filled').map(order => (
                    <div
                      key={order.id}
                      className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            order.side === 'yes' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                          }`}>
                            {order.side.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">{order.type.toUpperCase()}</span>
                        </div>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-400">Qty</div>
                          <div className="font-mono">{order.quantity}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Price</div>
                          <div className="font-mono">${order.price.toFixed(3)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Filled</div>
                          <div className="font-mono">{order.filled}/{order.quantity}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Position & Stats */}
          <div className="w-80 border-l border-gray-800 p-4 space-y-4 overflow-auto">
            {/* Position */}
            {position && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Current Position</h3>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      position.side === 'yes' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {position.side.toUpperCase()}
                    </span>
                    <span className="text-lg font-bold">{position.quantity}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Price:</span>
                      <span className="font-mono">${position.avgPrice.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current:</span>
                      <span className="font-mono">${position.currentPrice.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-700">
                      <span className="text-gray-400">P&L:</span>
                      <span className={`font-bold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)} ({position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button className="py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors">
                      Add
                    </button>
                    <button className="py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Market Stats */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Market Stats</h3>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume 24h:</span>
                  <span className="font-mono">${((market.volume || 0) / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Open Interest:</span>
                  <span className="font-mono">${((market.open_interest || 0) / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">YES Probability:</span>
                  <span className="font-mono text-green-400">{((market.yes_price || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">NO Probability:</span>
                  <span className="font-mono text-red-400">{((market.no_price || 0) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Market Buy NOW</span>
                </button>
                <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Market Sell NOW</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
