import { supabase } from '../lib/supabase'

export interface TradeHistoryEntry {
  id?: string
  user_id?: string
  contract_ticker: string
  underlying_ticker: string
  trade_type: string
  entry_price: number
  exit_price: number
  quantity: number
  profit_loss: number
  profit_loss_percent: number
  entry_date: Date
  exit_date: Date
  strategy_type?: string
  is_winner: boolean
  created_at?: Date
}

export interface UserTradingMetrics {
  id?: string
  user_id?: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  average_win: number
  average_loss: number
  win_rate: number
  win_loss_ratio: number
  kelly_percentage: number
  created_at?: Date
  updated_at?: Date
}

export class TradingHistoryService {
  static async recordTrade(trade: TradeHistoryEntry): Promise<boolean> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        console.warn('User not authenticated, storing trade locally')
        this.storeTradeLocally(trade)
        return true
      }

      const tradeData = {
        user_id: userData.user.id,
        contract_ticker: trade.contract_ticker,
        underlying_ticker: trade.underlying_ticker,
        trade_type: trade.trade_type,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        quantity: trade.quantity,
        profit_loss: trade.profit_loss,
        profit_loss_percent: trade.profit_loss_percent,
        entry_date: trade.entry_date.toISOString(),
        exit_date: trade.exit_date.toISOString(),
        strategy_type: trade.strategy_type,
        is_winner: trade.is_winner
      }

      const { error } = await supabase
        .from('trade_history')
        .insert([tradeData])

      if (error) {
        console.error('Error recording trade:', error)
        this.storeTradeLocally(trade)
        return false
      }

      await this.updateUserMetrics(userData.user.id)
      return true
    } catch (error) {
      console.error('Error in recordTrade:', error)
      this.storeTradeLocally(trade)
      return false
    }
  }

  static async getUserMetrics(userId?: string): Promise<UserTradingMetrics | null> {
    try {
      let targetUserId = userId

      if (!targetUserId) {
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError || !userData.user) {
          console.warn('User not authenticated, using local metrics')
          return this.getLocalMetrics()
        }

        targetUserId = userData.user.id
      }

      const { data, error } = await supabase
        .from('user_trading_metrics')
        .select('*')
        .eq('user_id', targetUserId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return this.getLocalMetrics()
        }
        console.error('Error fetching user metrics:', error)
        return null
      }

      return data as UserTradingMetrics
    } catch (error) {
      console.error('Error in getUserMetrics:', error)
      return this.getLocalMetrics()
    }
  }

  static async updateUserMetrics(userId: string): Promise<void> {
    try {
      const { data: trades, error: tradesError } = await supabase
        .from('trade_history')
        .select('profit_loss, is_winner')
        .eq('user_id', userId)

      if (tradesError) {
        console.error('Error fetching trades for metrics:', tradesError)
        return
      }

      if (!trades || trades.length === 0) {
        return
      }

      const totalTrades = trades.length
      const winningTrades = trades.filter(t => t.is_winner).length
      const losingTrades = totalTrades - winningTrades

      const wins = trades.filter(t => t.is_winner)
      const losses = trades.filter(t => !t.is_winner)

      const averageWin = wins.length > 0
        ? wins.reduce((sum, t) => sum + t.profit_loss, 0) / wins.length
        : 0

      const averageLoss = losses.length > 0
        ? Math.abs(losses.reduce((sum, t) => sum + t.profit_loss, 0) / losses.length)
        : 0

      const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0
      const winLossRatio = averageLoss > 0 ? averageWin / averageLoss : 0

      const kellyPercentage = this.calculateKelly(winRate, winLossRatio)

      const metrics = {
        user_id: userId,
        total_trades: totalTrades,
        winning_trades: winningTrades,
        losing_trades: losingTrades,
        average_win: averageWin,
        average_loss: averageLoss,
        win_rate: winRate,
        win_loss_ratio: winLossRatio,
        kelly_percentage: kellyPercentage
      }

      const { error: upsertError } = await supabase
        .from('user_trading_metrics')
        .upsert([metrics], { onConflict: 'user_id' })

      if (upsertError) {
        console.error('Error upserting user metrics:', upsertError)
      }
    } catch (error) {
      console.error('Error in updateUserMetrics:', error)
    }
  }

  static async getTradeHistory(
    userId?: string,
    limit: number = 100
  ): Promise<TradeHistoryEntry[]> {
    try {
      let targetUserId = userId

      if (!targetUserId) {
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError || !userData.user) {
          console.warn('User not authenticated, using local history')
          return this.getLocalTradeHistory()
        }

        targetUserId = userData.user.id
      }

      const { data, error } = await supabase
        .from('trade_history')
        .select('*')
        .eq('user_id', targetUserId)
        .order('exit_date', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching trade history:', error)
        return this.getLocalTradeHistory()
      }

      return (data || []).map(trade => ({
        ...trade,
        entry_date: new Date(trade.entry_date),
        exit_date: new Date(trade.exit_date),
        created_at: trade.created_at ? new Date(trade.created_at) : undefined
      }))
    } catch (error) {
      console.error('Error in getTradeHistory:', error)
      return this.getLocalTradeHistory()
    }
  }

  private static calculateKelly(winRate: number, winLossRatio: number): number {
    if (winRate <= 0 || winRate >= 1 || winLossRatio <= 0) {
      return 0
    }
    const lossRate = 1 - winRate
    const kelly = winRate - (lossRate / winLossRatio)
    return Math.max(0, Math.min(kelly, 0.25))
  }

  private static storeTradeLocally(trade: TradeHistoryEntry): void {
    try {
      const localTrades = this.getLocalTradeHistory()
      localTrades.unshift(trade)

      if (localTrades.length > 1000) {
        localTrades.pop()
      }

      localStorage.setItem('local_trade_history', JSON.stringify(localTrades))

      this.updateLocalMetrics()
    } catch (error) {
      console.error('Error storing trade locally:', error)
    }
  }

  private static getLocalTradeHistory(): TradeHistoryEntry[] {
    try {
      const stored = localStorage.getItem('local_trade_history')
      if (!stored) return []

      const trades = JSON.parse(stored)
      return trades.map((t: any) => ({
        ...t,
        entry_date: new Date(t.entry_date),
        exit_date: new Date(t.exit_date)
      }))
    } catch (error) {
      console.error('Error reading local trade history:', error)
      return []
    }
  }

  private static getLocalMetrics(): UserTradingMetrics | null {
    try {
      const stored = localStorage.getItem('local_trading_metrics')
      if (!stored) return null

      return JSON.parse(stored)
    } catch (error) {
      console.error('Error reading local metrics:', error)
      return null
    }
  }

  private static updateLocalMetrics(): void {
    try {
      const trades = this.getLocalTradeHistory()

      if (trades.length === 0) {
        return
      }

      const totalTrades = trades.length
      const winningTrades = trades.filter(t => t.is_winner).length
      const losingTrades = totalTrades - winningTrades

      const wins = trades.filter(t => t.is_winner)
      const losses = trades.filter(t => !t.is_winner)

      const averageWin = wins.length > 0
        ? wins.reduce((sum, t) => sum + t.profit_loss, 0) / wins.length
        : 0

      const averageLoss = losses.length > 0
        ? Math.abs(losses.reduce((sum, t) => sum + t.profit_loss, 0) / losses.length)
        : 0

      const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0
      const winLossRatio = averageLoss > 0 ? averageWin / averageLoss : 0

      const kellyPercentage = this.calculateKelly(winRate, winLossRatio)

      const metrics: UserTradingMetrics = {
        total_trades: totalTrades,
        winning_trades: winningTrades,
        losing_trades: losingTrades,
        average_win: averageWin,
        average_loss: averageLoss,
        win_rate: winRate,
        win_loss_ratio: winLossRatio,
        kelly_percentage: kellyPercentage
      }

      localStorage.setItem('local_trading_metrics', JSON.stringify(metrics))
    } catch (error) {
      console.error('Error updating local metrics:', error)
    }
  }

  static async deleteTrade(tradeId: string): Promise<boolean> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        return false
      }

      const { error } = await supabase
        .from('trade_history')
        .delete()
        .eq('id', tradeId)
        .eq('user_id', userData.user.id)

      if (error) {
        console.error('Error deleting trade:', error)
        return false
      }

      await this.updateUserMetrics(userData.user.id)
      return true
    } catch (error) {
      console.error('Error in deleteTrade:', error)
      return false
    }
  }
}
