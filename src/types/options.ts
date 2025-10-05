export interface OptionsContract {
  contract_type: 'call' | 'put'
  exercise_style: 'american' | 'european'
  expiration_date: string
  shares_per_contract: number
  strike_price: number
  ticker: string
  underlying_ticker: string
  bid: number
  ask: number
  last: number
  volume: number
  open_interest: number
  implied_volatility: number
  delta: number
  gamma: number
  theta: number
  vega: number
  intrinsic_value: number
  time_value: number
}

export interface OptionsChainData {
  underlying: string
  contracts: OptionsContract[]
  lastUpdated: Date
}

export interface HistoricalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface OptionsPosition {
  id: string
  contractTicker: string
  underlyingTicker: string
  contractType: 'call' | 'put'
  strikePrice: number
  expirationDate: string
  quantity: number
  avgPrice: number
  currentPrice: number
  totalValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  purchaseDate: Date
  delta: number
  gamma: number
  theta: number
  vega: number
  impliedVolatility: number
}

export interface OptionsOrder {
  id: string
  contractTicker: string
  underlyingTicker: string
  type: 'buy_to_open' | 'sell_to_close' | 'sell_to_open' | 'buy_to_close'
  orderType: 'market' | 'limit'
  quantity: number
  price?: number
  status: 'pending' | 'filled' | 'cancelled' | 'rejected'
  timestamp: Date
  filledPrice?: number
  filledQuantity?: number
}

// Database types for Supabase integration
export interface DatabaseHistoricalData {
  id: string
  ticker: string
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  created_at: string
  updated_at: string
}

export interface DatabaseOptionsHistoricalData {
  id: string
  contract_ticker: string
  underlying_ticker: string
  date: string
  bid: number
  ask: number
  last: number
  volume: number
  open_interest: number
  implied_volatility: number
  delta: number
  gamma: number
  theta: number
  vega: number
  created_at: string
  updated_at: string
}