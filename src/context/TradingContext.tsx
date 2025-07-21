import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'

export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  pe?: number
  dividend?: number
}

export interface Position {
  id: string
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  currentPrice: number
  totalValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  purchaseDate: Date
}

export interface Order {
  id: string
  symbol: string
  type: 'buy' | 'sell'
  orderType: 'market' | 'limit' | 'stop'
  quantity: number
  price?: number
  status: 'pending' | 'filled' | 'cancelled' | 'rejected'
  timestamp: Date
  filledPrice?: number
  filledQuantity?: number
}

export interface WatchlistItem {
  id: string
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  addedDate: Date
}

interface TradingState {
  balance: number
  buyingPower: number
  totalValue: number
  dayChange: number
  dayChangePercent: number
  positions: Position[]
  orders: Order[]
  watchlist: WatchlistItem[]
  stocks: Stock[]
}

type TradingAction =
  | { type: 'PLACE_ORDER'; payload: Omit<Order, 'id' | 'timestamp'> }
  | { type: 'CANCEL_ORDER'; payload: string }
  | { type: 'FILL_ORDER'; payload: { orderId: string; filledPrice: number } }
  | { type: 'ADD_TO_WATCHLIST'; payload: Stock }
  | { type: 'REMOVE_FROM_WATCHLIST'; payload: string }
  | { type: 'UPDATE_STOCK_PRICES'; payload: Stock[] }
  | { type: 'LOAD_DATA' }

const initialState: TradingState = {
  balance: 100000,
  buyingPower: 100000,
  totalValue: 100000,
  dayChange: 0,
  dayChangePercent: 0,
  positions: [],
  orders: [],
  watchlist: [],
  stocks: [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 175.43,
      change: 2.15,
      changePercent: 1.24,
      volume: 45234567,
      marketCap: 2800000000000,
      pe: 28.5,
      dividend: 0.96
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 138.21,
      change: -1.87,
      changePercent: -1.33,
      volume: 23456789,
      marketCap: 1750000000000,
      pe: 25.2
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 378.85,
      change: 4.32,
      changePercent: 1.15,
      volume: 34567890,
      marketCap: 2850000000000,
      pe: 32.1,
      dividend: 2.72
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      price: 248.50,
      change: -8.75,
      changePercent: -3.40,
      volume: 67890123,
      marketCap: 790000000000,
      pe: 65.8
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com, Inc.',
      price: 145.86,
      change: 1.23,
      changePercent: 0.85,
      volume: 28901234,
      marketCap: 1520000000000,
      pe: 45.2
    }
  ]
}

const TradingContext = createContext<{
  state: TradingState
  dispatch: React.Dispatch<TradingAction>
} | null>(null)

function tradingReducer(state: TradingState, action: TradingAction): TradingState {
  switch (action.type) {
    case 'PLACE_ORDER': {
      const newOrder: Order = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date()
      }
      
      // For market orders, fill immediately
      if (action.payload.orderType === 'market') {
        const stock = state.stocks.find(s => s.symbol === action.payload.symbol)
        if (stock) {
          return fillOrder(state, newOrder.id, stock.price)
        }
      }
      
      return {
        ...state,
        orders: [...state.orders, newOrder]
      }
    }
    
    case 'CANCEL_ORDER': {
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload)
      }
    }
    
    case 'FILL_ORDER': {
      return fillOrder(state, action.payload.orderId, action.payload.filledPrice)
    }
    
    case 'ADD_TO_WATCHLIST': {
      const watchlistItem: WatchlistItem = {
        id: Date.now().toString(),
        symbol: action.payload.symbol,
        name: action.payload.name,
        price: action.payload.price,
        change: action.payload.change,
        changePercent: action.payload.changePercent,
        addedDate: new Date()
      }
      
      return {
        ...state,
        watchlist: [...state.watchlist, watchlistItem]
      }
    }
    
    case 'REMOVE_FROM_WATCHLIST': {
      return {
        ...state,
        watchlist: state.watchlist.filter(item => item.id !== action.payload)
      }
    }
    
    case 'UPDATE_STOCK_PRICES': {
      const updatedStocks = action.payload
      const updatedPositions = state.positions.map(position => {
        const stock = updatedStocks.find(s => s.symbol === position.symbol)
        if (stock) {
          const totalValue = position.quantity * stock.price
          const unrealizedPnL = totalValue - (position.quantity * position.avgPrice)
          const unrealizedPnLPercent = (unrealizedPnL / (position.quantity * position.avgPrice)) * 100
          
          return {
            ...position,
            currentPrice: stock.price,
            totalValue,
            unrealizedPnL,
            unrealizedPnLPercent
          }
        }
        return position
      })
      
      const updatedWatchlist = state.watchlist.map(item => {
        const stock = updatedStocks.find(s => s.symbol === item.symbol)
        if (stock) {
          return {
            ...item,
            price: stock.price,
            change: stock.change,
            changePercent: stock.changePercent
          }
        }
        return item
      })
      
      const totalPositionValue = updatedPositions.reduce((sum, pos) => sum + pos.totalValue, 0)
      const totalValue = state.balance + totalPositionValue
      const dayChange = updatedPositions.reduce((sum, pos) => sum + (pos.unrealizedPnL || 0), 0)
      const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0
      
      return {
        ...state,
        stocks: updatedStocks,
        positions: updatedPositions,
        watchlist: updatedWatchlist,
        totalValue,
        dayChange,
        dayChangePercent
      }
    }
    
    case 'LOAD_DATA': {
      const savedData = localStorage.getItem('paperTradingData')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        return {
          ...state,
          ...parsed,
          orders: parsed.orders?.map((order: any) => ({
            ...order,
            timestamp: new Date(order.timestamp)
          })) || [],
          positions: parsed.positions?.map((position: any) => ({
            ...position,
            purchaseDate: new Date(position.purchaseDate)
          })) || [],
          watchlist: parsed.watchlist?.map((item: any) => ({
            ...item,
            addedDate: new Date(item.addedDate)
          })) || []
        }
      }
      return state
    }
    
    default:
      return state
  }
}

function fillOrder(state: TradingState, orderId: string, filledPrice: number): TradingState {
  const order = state.orders.find(o => o.id === orderId)
  if (!order) return state
  
  const totalCost = order.quantity * filledPrice
  const commission = 0 // No commission for paper trading
  
  if (order.type === 'buy') {
    if (totalCost > state.buyingPower) {
      // Insufficient funds - reject order
      return {
        ...state,
        orders: state.orders.map(o => 
          o.id === orderId ? { ...o, status: 'rejected' as const } : o
        )
      }
    }
    
    // Check if we already have a position in this stock
    const existingPositionIndex = state.positions.findIndex(p => p.symbol === order.symbol)
    
    let updatedPositions: Position[]
    if (existingPositionIndex >= 0) {
      // Update existing position
      const existingPosition = state.positions[existingPositionIndex]
      const newQuantity = existingPosition.quantity + order.quantity
      const newAvgPrice = ((existingPosition.quantity * existingPosition.avgPrice) + totalCost) / newQuantity
      
      updatedPositions = state.positions.map((pos, index) => 
        index === existingPositionIndex 
          ? {
              ...pos,
              quantity: newQuantity,
              avgPrice: newAvgPrice,
              totalValue: newQuantity * filledPrice,
              unrealizedPnL: (newQuantity * filledPrice) - (newQuantity * newAvgPrice),
              unrealizedPnLPercent: ((filledPrice - newAvgPrice) / newAvgPrice) * 100
            }
          : pos
      )
    } else {
      // Create new position
      const stock = state.stocks.find(s => s.symbol === order.symbol)
      const newPosition: Position = {
        id: Date.now().toString(),
        symbol: order.symbol,
        name: stock?.name || order.symbol,
        quantity: order.quantity,
        avgPrice: filledPrice,
        currentPrice: filledPrice,
        totalValue: totalCost,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        purchaseDate: new Date()
      }
      updatedPositions = [...state.positions, newPosition]
    }
    
    return {
      ...state,
      balance: state.balance - totalCost - commission,
      buyingPower: state.buyingPower - totalCost - commission,
      positions: updatedPositions,
      orders: state.orders.map(o => 
        o.id === orderId 
          ? { ...o, status: 'filled' as const, filledPrice, filledQuantity: order.quantity }
          : o
      )
    }
  } else {
    // Sell order
    const position = state.positions.find(p => p.symbol === order.symbol)
    if (!position || position.quantity < order.quantity) {
      // Insufficient shares - reject order
      return {
        ...state,
        orders: state.orders.map(o => 
          o.id === orderId ? { ...o, status: 'rejected' as const } : o
        )
      }
    }
    
    const proceeds = totalCost - commission
    const updatedPositions = position.quantity === order.quantity
      ? state.positions.filter(p => p.symbol !== order.symbol)
      : state.positions.map(p => 
          p.symbol === order.symbol 
            ? {
                ...p,
                quantity: p.quantity - order.quantity,
                totalValue: (p.quantity - order.quantity) * filledPrice,
                unrealizedPnL: ((p.quantity - order.quantity) * filledPrice) - ((p.quantity - order.quantity) * p.avgPrice),
                unrealizedPnLPercent: ((filledPrice - p.avgPrice) / p.avgPrice) * 100
              }
            : p
        )
    
    return {
      ...state,
      balance: state.balance + proceeds,
      buyingPower: state.buyingPower + proceeds,
      positions: updatedPositions,
      orders: state.orders.map(o => 
        o.id === orderId 
          ? { ...o, status: 'filled' as const, filledPrice, filledQuantity: order.quantity }
          : o
      )
    }
  }
}

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tradingReducer, initialState)
  const stateRef = useRef(state)
  
  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = state
  }, [state])
  
  // Load data on mount
  useEffect(() => {
    dispatch({ type: 'LOAD_DATA' })
    
    // Initialize historical data on first load (only if services are available)
    const initializeData = async () => {
      try {
        const enableMockData = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true'
        if (enableMockData) {
          console.log('Mock data enabled, skipping Polygon service initialization')
          return
        }
        
        const { PolygonService } = await import('../services/polygonService')
        await PolygonService.initializeHistoricalData()
        console.log('Historical data initialization completed')
      } catch (error) {
        console.warn('Failed to initialize historical data:', error)
      }
    }
    
    initializeData()
  }, [])
  
  // Save data to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = {
      balance: state.balance,
      buyingPower: state.buyingPower,
      totalValue: state.totalValue,
      dayChange: state.dayChange,
      dayChangePercent: state.dayChangePercent,
      positions: state.positions,
      orders: state.orders,
      watchlist: state.watchlist
    }
    localStorage.setItem('paperTradingData', JSON.stringify(dataToSave))
  }, [state])
  
  // Simulate real-time price updates - set up once on mount
  useEffect(() => {
    let timeoutId: number | null = null
    let isActive = true
    
    try {
      const updatePrices = () => {
        try {
          if (!isActive) return
          
          const currentState = stateRef.current
          const updatedStocks = currentState.stocks.map(stock => {
            const changePercent = (Math.random() - 0.5) * 0.1 // Random change between -5% and +5%
            const newPrice = stock.price * (1 + changePercent)
            const change = newPrice - stock.price
            
            return {
              ...stock,
              price: Math.round(newPrice * 100) / 100,
              change: Math.round(change * 100) / 100,
              changePercent: Math.round(changePercent * 10000) / 100
            }
          })
          
          dispatch({ type: 'UPDATE_STOCK_PRICES', payload: updatedStocks })
          
          // Schedule next update
          if (isActive) {
            timeoutId = setTimeout(updatePrices, 5000)
          }
        } catch (error) {
          console.error('Error updating stock prices:', error)
          // Schedule retry on error
          if (isActive) {
            timeoutId = setTimeout(updatePrices, 5000)
          }
        }
      }
      
      // Start the update cycle
      timeoutId = setTimeout(updatePrices, 5000)
    } catch (error) {
      console.error('Error setting up stock price updates:', error)
    }
    
    return () => {
      isActive = false
      if (timeoutId) {
        try {
          clearTimeout(timeoutId)
        } catch (error) {
          console.error('Error clearing stock price timeout:', error)
        }
      }
    }
  }, [])
  
  // Cleanup old data periodically (once per day) - only if services are available
  useEffect(() => {
    let cleanupTimeoutId: number | null = null
    let isCleanupActive = true
    
    const scheduleCleanup = () => {
      if (!isCleanupActive) return
      
      cleanupTimeoutId = setTimeout(async () => {
        try {
          const enableDataPersistence = import.meta.env.VITE_ENABLE_DATA_PERSISTENCE === 'true'
          if (!enableDataPersistence) {
            scheduleCleanup() // Schedule next cleanup
            return
          }
          
          const historicalModule = await import('../services/historicalDataService')
          await historicalModule.HistoricalDataService.cleanupOldData()
          console.log('Old historical data cleaned up')
        } catch (error) {
          console.warn('Failed to cleanup old data:', error)
        }
        
        scheduleCleanup() // Schedule next cleanup
      }, 24 * 60 * 60 * 1000) // Run once per day
    }
    
    scheduleCleanup()
    
    return () => {
      isCleanupActive = false
      if (cleanupTimeoutId) {
        clearTimeout(cleanupTimeoutId)
      }
    }
  }, [])
  
  return (
    <TradingContext.Provider value={{ state, dispatch }}>
      {children}
    </TradingContext.Provider>
  )
}

export function useTradingContext() {
  const context = useContext(TradingContext)
  if (!context) {
    throw new Error('useTradingContext must be used within a TradingProvider')
  }
  return context
}