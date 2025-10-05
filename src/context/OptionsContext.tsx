import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import type { OptionsContract, OptionsPosition, OptionsOrder } from '../types/options'
import { TradingHistoryService } from '../services/tradingHistoryService'
import type { StrategyLeg } from '../services/strategyValidationService'

interface OptionsState {
  balance: number
  buyingPower: number
  totalValue: number
  dayChange: number
  dayChangePercent: number
  positions: OptionsPosition[]
  orders: OptionsOrder[]
  contracts: OptionsContract[]
  selectedUnderlying: string | null
}

type OptionsAction =
  | { type: 'PLACE_OPTIONS_ORDER'; payload: Omit<OptionsOrder, 'id' | 'timestamp'> }
  | { type: 'PLACE_MULTI_LEG_ORDER'; payload: { legs: StrategyLeg[]; strategyName: string; quantity: number } }
  | { type: 'CANCEL_OPTIONS_ORDER'; payload: string }
  | { type: 'FILL_OPTIONS_ORDER'; payload: { orderId: string; filledPrice: number } }
  | { type: 'UPDATE_CONTRACT_PRICES'; payload: OptionsContract[] }
  | { type: 'SET_SELECTED_UNDERLYING'; payload: string | null }
  | { type: 'LOAD_OPTIONS_DATA' }
  | { type: 'CLOSE_POSITION'; payload: { positionId: string; exitPrice: number; strategyType?: string } }

const initialState: OptionsState = {
  balance: 100000,
  buyingPower: 100000,
  totalValue: 100000,
  dayChange: 0,
  dayChangePercent: 0,
  positions: [],
  orders: [],
  contracts: [],
  selectedUnderlying: null
}

const OptionsContext = createContext<{
  state: OptionsState
  dispatch: React.Dispatch<OptionsAction>
} | null>(null)

function optionsReducer(state: OptionsState, action: OptionsAction): OptionsState {
  switch (action.type) {
    case 'PLACE_OPTIONS_ORDER': {
      const newOrder: OptionsOrder = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date()
      }

      if (action.payload.type === 'buy_to_open' && action.payload.status === 'filled') {
        const totalCost = action.payload.quantity * (action.payload.price || 0) * 100

        const existingPositionIndex = state.positions.findIndex(
          p => p.contractTicker === action.payload.contractTicker
        )

        let updatedPositions: OptionsPosition[]

        if (existingPositionIndex >= 0) {
          const existing = state.positions[existingPositionIndex]
          const newQuantity = existing.quantity + action.payload.quantity
          const newAvgPrice =
            ((existing.quantity * existing.avgPrice) + (action.payload.quantity * (action.payload.price || 0))) /
            newQuantity

          updatedPositions = state.positions.map((pos, idx) =>
            idx === existingPositionIndex
              ? {
                  ...pos,
                  quantity: newQuantity,
                  avgPrice: newAvgPrice,
                  currentPrice: action.payload.price || 0,
                  totalValue: newQuantity * (action.payload.price || 0) * 100,
                  unrealizedPnL: 0,
                  unrealizedPnLPercent: 0
                }
              : pos
          )
        } else {
          const newPosition: OptionsPosition = {
            id: `pos_${Date.now()}`,
            contractTicker: action.payload.contractTicker,
            underlyingTicker: action.payload.underlyingTicker,
            contractType: 'call',
            strikePrice: 0,
            expirationDate: '',
            quantity: action.payload.quantity,
            avgPrice: action.payload.price || 0,
            currentPrice: action.payload.price || 0,
            totalValue: action.payload.quantity * (action.payload.price || 0) * 100,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
            purchaseDate: new Date(),
            delta: 0,
            gamma: 0,
            theta: 0,
            vega: 0,
            impliedVolatility: 0
          }
          updatedPositions = [...state.positions, newPosition]
        }

        return {
          ...state,
          orders: [...state.orders, newOrder],
          positions: updatedPositions,
          balance: state.balance - totalCost,
          buyingPower: state.buyingPower - totalCost
        }
      }

      return {
        ...state,
        orders: [...state.orders, newOrder]
      }
    }
    
    case 'CANCEL_OPTIONS_ORDER': {
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload)
      }
    }
    
    case 'UPDATE_CONTRACT_PRICES': {
      return {
        ...state,
        contracts: action.payload
      }
    }
    
    case 'SET_SELECTED_UNDERLYING': {
      return {
        ...state,
        selectedUnderlying: action.payload
      }
    }
    
    case 'LOAD_OPTIONS_DATA': {
      const savedData = localStorage.getItem('optionsTradingData')
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
          })) || []
        }
      }
      return state
    }

    case 'PLACE_MULTI_LEG_ORDER': {
      const { legs, strategyName, quantity } = action.payload

      const totalCost = legs.reduce((sum, leg) => {
        const sign = leg.action === 'buy' ? 1 : -1
        return sum + (sign * leg.contract.last * leg.quantity * 100)
      }, 0)

      if (totalCost > state.buyingPower) {
        console.error('Insufficient buying power for multi-leg order')
        return state
      }

      const orders: OptionsOrder[] = legs.map(leg => ({
        id: `${Date.now()}_${leg.contract.ticker}`,
        contractTicker: leg.contract.ticker,
        underlyingTicker: leg.contract.underlying_ticker,
        type: leg.action === 'buy' ? 'buy_to_open' : 'sell_to_close',
        orderType: 'market',
        quantity: leg.quantity * quantity,
        price: leg.contract.last,
        status: 'filled',
        timestamp: new Date()
      }))

      const position: OptionsPosition = {
        id: `pos_${Date.now()}`,
        contractTicker: `${strategyName}_${legs[0].contract.underlying_ticker}`,
        underlyingTicker: legs[0].contract.underlying_ticker,
        contractType: legs[0].contract.contract_type,
        strikePrice: legs[0].contract.strike_price,
        expirationDate: legs[0].contract.expiration_date,
        quantity: quantity,
        avgPrice: Math.abs(totalCost) / (quantity * 100),
        currentPrice: Math.abs(totalCost) / (quantity * 100),
        totalValue: Math.abs(totalCost),
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        purchaseDate: new Date(),
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        impliedVolatility: 0
      }

      return {
        ...state,
        orders: [...state.orders, ...orders],
        positions: [...state.positions, position],
        balance: state.balance - totalCost,
        buyingPower: state.buyingPower - totalCost
      }
    }

    case 'CLOSE_POSITION': {
      const position = state.positions.find(p => p.id === action.payload.positionId)
      if (!position) return state

      const exitPrice = action.payload.exitPrice
      const profitLoss = (exitPrice - position.avgPrice) * position.quantity * 100
      const profitLossPercent = ((exitPrice - position.avgPrice) / position.avgPrice) * 100

      TradingHistoryService.recordTrade({
        contract_ticker: position.contractTicker,
        underlying_ticker: position.underlyingTicker,
        trade_type: 'sell_to_close',
        entry_price: position.avgPrice,
        exit_price: exitPrice,
        quantity: position.quantity,
        profit_loss: profitLoss,
        profit_loss_percent: profitLossPercent,
        entry_date: position.purchaseDate,
        exit_date: new Date(),
        strategy_type: action.payload.strategyType,
        is_winner: profitLoss > 0
      }).catch(err => console.error('Failed to record trade:', err))

      return {
        ...state,
        positions: state.positions.filter(p => p.id !== action.payload.positionId),
        balance: state.balance + (position.quantity * exitPrice * 100),
        buyingPower: state.buyingPower + (position.quantity * exitPrice * 100)
      }
    }

    default:
      return state
  }
}

export function OptionsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(optionsReducer, initialState)
  const stateRef = useRef(state)
  
  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = state
  }, [state])
  
  // Load data on mount
  useEffect(() => {
    dispatch({ type: 'LOAD_OPTIONS_DATA' })
    
    // Load environment configuration
    const updateInterval = Math.max(1000, parseInt(import.meta.env.VITE_OPTIONS_UPDATE_INTERVAL || '5000') || 5000)
    const maxHistoricalDays = Math.max(1, parseInt(import.meta.env.VITE_MAX_HISTORICAL_DAYS || '14') || 14)
    
    console.log(`Options trading initialized with ${updateInterval}ms update interval`)
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
      orders: state.orders
    }
    localStorage.setItem('optionsTradingData', JSON.stringify(dataToSave))
  }, [state])

  // Simulate real-time price updates for options - set up once on mount
  useEffect(() => {
    const updateInterval = Math.max(1000, parseInt(import.meta.env.VITE_OPTIONS_UPDATE_INTERVAL || '5000') || 5000)
    let timeoutId: NodeJS.Timeout | null = null
    let isActive = true
    
    try {
      const updatePrices = () => {
        try {
          if (!isActive) return
          
          const currentState = stateRef.current
          if (currentState.contracts.length === 0) return
          
          const updatedContracts = currentState.contracts.map(contract => {
            // Simulate price movement based on implied volatility
            const priceChange = (Math.random() - 0.5) * contract.implied_volatility * 0.1
            const newLast = Math.max(0.01, contract.last * (1 + priceChange))
            const newBid = Math.max(0.01, newLast * 0.98)
            const newAsk = newLast * 1.02
            
            return {
              ...contract,
              bid: Math.round(newBid * 100) / 100,
              ask: Math.round(newAsk * 100) / 100,
              last: Math.round(newLast * 100) / 100
            }
          })
          
          dispatch({ type: 'UPDATE_CONTRACT_PRICES', payload: updatedContracts })
          
          // Schedule next update
          if (isActive) {
            timeoutId = globalThis.setTimeout(updatePrices, updateInterval)
          }
        } catch (error) {
          console.error('Error updating options prices:', error)
          // Schedule retry on error
          if (isActive) {
            timeoutId = globalThis.setTimeout(updatePrices, updateInterval)
          }
        }
      }
      
      // Start the update cycle
      timeoutId = globalThis.setTimeout(updatePrices, updateInterval)
    } catch (error) {
      console.error('Error setting up options price updates:', error)
    }
    
    return () => {
      isActive = false
      if (timeoutId) {
        try {
          globalThis.clearTimeout(timeoutId)
        } catch (error) {
          console.error('Error clearing options price timeout:', error)
        }
      }
    }
  }, [])

  return (
    <OptionsContext.Provider value={{ state, dispatch }}>
      {children}
    </OptionsContext.Provider>
  )
}

export function useOptionsContext() {
  const context = useContext(OptionsContext)
  if (!context) {
    throw new Error('useOptionsContext must be used within an OptionsProvider')
  }
  return context
}