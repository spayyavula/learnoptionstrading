import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import type { OptionsContract, OptionsPosition, OptionsOrder } from '../types/options'

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
  | { type: 'CANCEL_OPTIONS_ORDER'; payload: string }
  | { type: 'FILL_OPTIONS_ORDER'; payload: { orderId: string; filledPrice: number } }
  | { type: 'UPDATE_CONTRACT_PRICES'; payload: OptionsContract[] }
  | { type: 'SET_SELECTED_UNDERLYING'; payload: string | null }
  | { type: 'LOAD_OPTIONS_DATA' }

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
    let timeoutId: number | null = null
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
            timeoutId = setTimeout(updatePrices, updateInterval)
          }
        } catch (error) {
          console.error('Error updating options prices:', error)
          // Schedule retry on error
          if (isActive) {
            timeoutId = setTimeout(updatePrices, updateInterval)
          }
        }
      }
      
      // Start the update cycle
      timeoutId = setTimeout(updatePrices, updateInterval)
    } catch (error) {
      console.error('Error setting up options price updates:', error)
    }
    
    return () => {
      isActive = false
      if (timeoutId) {
        try {
          clearTimeout(timeoutId)
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