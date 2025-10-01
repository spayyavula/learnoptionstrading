import { GreeksCalculator, GreeksData } from './greeksCalculator'
import { OptionsContract } from '../types/options'
import { supabase } from '../lib/supabase'

export interface GreeksSnapshot {
  contractTicker: string
  underlyingTicker: string
  greeks: GreeksData
  underlyingPrice: number
  timestamp: Date
}

class GreeksUpdateServiceClass {
  private updateInterval: number = 5000
  private intervalId: NodeJS.Timeout | null = null
  private subscribers: Map<string, (snapshot: GreeksSnapshot) => void> = new Map()
  private latestSnapshots: Map<string, GreeksSnapshot> = new Map()
  private isRunning: boolean = false

  start() {
    if (this.isRunning) {
      console.warn('GreeksUpdateService is already running')
      return
    }

    this.isRunning = true
    this.intervalId = setInterval(() => {
      this.updateAllGreeks()
    }, this.updateInterval)

    console.log('GreeksUpdateService started')
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('GreeksUpdateService stopped')
  }

  subscribe(contractTicker: string, callback: (snapshot: GreeksSnapshot) => void): () => void {
    const key = `${contractTicker}-${Date.now()}`
    this.subscribers.set(key, callback)

    const latestSnapshot = this.latestSnapshots.get(contractTicker)
    if (latestSnapshot) {
      callback(latestSnapshot)
    }

    return () => {
      this.subscribers.delete(key)
    }
  }

  async updateGreeks(
    contract: OptionsContract,
    underlyingPrice: number,
    saveToDatabase: boolean = false
  ): Promise<GreeksSnapshot> {
    const greeks = GreeksCalculator.calculateGreeks(contract, underlyingPrice)

    const snapshot: GreeksSnapshot = {
      contractTicker: contract.ticker,
      underlyingTicker: contract.underlying_ticker,
      greeks,
      underlyingPrice,
      timestamp: new Date()
    }

    this.latestSnapshots.set(contract.ticker, snapshot)

    this.notifySubscribers(contract.ticker, snapshot)

    if (saveToDatabase) {
      await this.saveSnapshot(snapshot, contract)
    }

    return snapshot
  }

  private async updateAllGreeks() {
    for (const [contractTicker, snapshot] of this.latestSnapshots.entries()) {
      this.notifySubscribers(contractTicker, snapshot)
    }
  }

  private notifySubscribers(contractTicker: string, snapshot: GreeksSnapshot) {
    for (const [key, callback] of this.subscribers.entries()) {
      if (key.startsWith(contractTicker)) {
        try {
          callback(snapshot)
        } catch (error) {
          console.error('Error notifying subscriber:', error)
        }
      }
    }
  }

  private async saveSnapshot(snapshot: GreeksSnapshot, contract: OptionsContract) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const timeToExpiry = GreeksCalculator.calculateTimeToExpiry(contract.expiration_date)

      await supabase.from('greeks_snapshots').insert({
        user_id: user.id,
        contract_ticker: snapshot.contractTicker,
        underlying_ticker: snapshot.underlyingTicker,
        underlying_price: snapshot.underlyingPrice,
        strike_price: contract.strike_price,
        time_to_expiry: timeToExpiry,
        implied_volatility: snapshot.greeks.impliedVolatility,
        delta: snapshot.greeks.delta,
        gamma: snapshot.greeks.gamma,
        theta: snapshot.greeks.theta,
        vega: snapshot.greeks.vega,
        rho: snapshot.greeks.rho,
        snapshot_date: snapshot.timestamp.toISOString()
      })
    } catch (error) {
      console.error('Error saving Greeks snapshot:', error)
    }
  }

  getLatestSnapshot(contractTicker: string): GreeksSnapshot | undefined {
    return this.latestSnapshots.get(contractTicker)
  }

  async getHistoricalSnapshots(
    contractTicker: string,
    days: number = 7
  ): Promise<GreeksSnapshot[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('greeks_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('contract_ticker', contractTicker)
        .gte('snapshot_date', startDate.toISOString())
        .order('snapshot_date', { ascending: true })

      if (error) throw error

      return data.map(record => ({
        contractTicker: record.contract_ticker,
        underlyingTicker: record.underlying_ticker,
        greeks: {
          delta: record.delta,
          gamma: record.gamma,
          theta: record.theta,
          vega: record.vega,
          rho: record.rho,
          price: 0,
          impliedVolatility: record.implied_volatility
        },
        underlyingPrice: record.underlying_price,
        timestamp: new Date(record.snapshot_date)
      }))
    } catch (error) {
      console.error('Error fetching historical snapshots:', error)
      return []
    }
  }

  async cleanupOldSnapshots(daysToKeep: number = 30) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { error } = await supabase
        .from('greeks_snapshots')
        .delete()
        .eq('user_id', user.id)
        .lt('snapshot_date', cutoffDate.toISOString())

      if (error) throw error

      console.log('Old Greeks snapshots cleaned up successfully')
    } catch (error) {
      console.error('Error cleaning up old snapshots:', error)
    }
  }

  setUpdateInterval(milliseconds: number) {
    this.updateInterval = Math.max(1000, milliseconds)

    if (this.isRunning) {
      this.stop()
      this.start()
    }
  }

  getUpdateInterval(): number {
    return this.updateInterval
  }

  isServiceRunning(): boolean {
    return this.isRunning
  }

  clearCache() {
    this.latestSnapshots.clear()
  }
}

export const GreeksUpdateService = new GreeksUpdateServiceClass()
