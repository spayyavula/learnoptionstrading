/**
 * Zerodha Kite Connect WebSocket Service
 *
 * Real-time streaming of market data for Indian stocks and options
 * Documentation: https://kite.trade/docs/connect/v3/websocket/
 */

export interface ZerodhaTickData {
  instrument_token: number
  is_tradable: boolean
  mode: 'quote' | 'full'
  timestamp: Date
  last_price: number
  last_quantity: number
  average_price: number
  volume: number
  buy_quantity: number
  sell_quantity: number
  open: number
  high: number
  low: number
  close: number
  change: number
  oi?: number              // Open Interest (for F&O)
  oi_day_high?: number
  oi_day_low?: number
  depth?: {
    buy: Array<{ quantity: number; price: number; orders: number }>
    sell: Array<{ quantity: number; price: number; orders: number }>
  }
}

export type SubscriptionMode = 'ltp' | 'quote' | 'full'

class ZerodhaWebSocketService {
  private ws: WebSocket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private subscribers: Map<number, Set<(data: ZerodhaTickData) => void>> = new Map()
  private subscribedTokens: Set<number> = new Set()
  private accessToken: string = ''
  private apiKey: string = ''

  constructor() {
    this.accessToken = import.meta.env.VITE_ZERODHA_ACCESS_TOKEN || ''
    this.apiKey = import.meta.env.VITE_ZERODHA_API_KEY || ''
  }

  /**
   * Connect to Kite WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve()
        return
      }

      if (!this.accessToken || !this.apiKey) {
        reject(new Error('Zerodha credentials not configured'))
        return
      }

      try {
        // Kite WebSocket URL format
        const wsUrl = `wss://ws.kite.trade?api_key=${this.apiKey}&access_token=${this.accessToken}`

        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('✅ Zerodha WebSocket connected')
          this.isConnected = true
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('❌ Zerodha WebSocket error:', error)
          this.isConnected = false
        }

        this.ws.onclose = () => {
          console.log('🔌 Zerodha WebSocket disconnected')
          this.isConnected = false
          this.attemptReconnect()
        }
      } catch (error) {
        console.error('Failed to connect to Zerodha WebSocket:', error)
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.isConnected = false
      this.subscribers.clear()
      this.subscribedTokens.clear()
      console.log('🔌 Zerodha WebSocket disconnected manually')
    }
  }

  /**
   * Subscribe to instrument tokens for real-time updates
   */
  subscribe(tokens: number[], mode: SubscriptionMode = 'quote'): void {
    if (!this.isConnected) {
      console.warn('WebSocket not connected. Call connect() first.')
      return
    }

    tokens.forEach(token => this.subscribedTokens.add(token))

    const message = {
      a: 'subscribe',
      v: tokens
    }

    this.send(message)

    // Set mode
    this.setMode(mode, tokens)
  }

  /**
   * Unsubscribe from instrument tokens
   */
  unsubscribe(tokens: number[]): void {
    if (!this.isConnected) return

    tokens.forEach(token => {
      this.subscribedTokens.delete(token)
      this.subscribers.delete(token)
    })

    const message = {
      a: 'unsubscribe',
      v: tokens
    }

    this.send(message)
  }

  /**
   * Set subscription mode (ltp, quote, or full)
   */
  setMode(mode: SubscriptionMode, tokens: number[]): void {
    if (!this.isConnected) return

    const modeMap: Record<SubscriptionMode, string> = {
      ltp: 'ltp',
      quote: 'quote',
      full: 'full'
    }

    const message = {
      a: 'mode',
      v: [modeMap[mode], tokens]
    }

    this.send(message)
  }

  /**
   * Register callback for instrument token updates
   */
  onTick(token: number, callback: (data: ZerodhaTickData) => void): () => void {
    if (!this.subscribers.has(token)) {
      this.subscribers.set(token, new Set())
    }

    this.subscribers.get(token)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.subscribers.get(token)?.delete(callback)
      if (this.subscribers.get(token)?.size === 0) {
        this.subscribers.delete(token)
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Get list of subscribed tokens
   */
  getSubscribedTokens(): number[] {
    return Array.from(this.subscribedTokens)
  }

  // Private methods

  private send(message: any): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private handleMessage(data: any): void {
    try {
      // Kite sends binary data, need to parse it
      if (data instanceof ArrayBuffer) {
        this.parseBinaryMessage(data)
      } else {
        // Text message (usually acknowledgments)
        const message = JSON.parse(data)
        console.log('Zerodha message:', message)
      }
    } catch (error) {
      console.error('Error handling Zerodha message:', error)
    }
  }

  private parseBinaryMessage(buffer: ArrayBuffer): void {
    // Kite Connect binary protocol parsing
    // This is a simplified version - full implementation would need proper binary parsing
    // Documentation: https://kite.trade/docs/connect/v3/websocket/

    try {
      const view = new DataView(buffer)
      let offset = 0

      // Number of packets
      const numPackets = view.getUint16(offset, true)
      offset += 2

      for (let i = 0; i < numPackets; i++) {
        // Packet length
        const length = view.getUint16(offset, true)
        offset += 2

        // Parse tick data
        const tickData = this.parseTickData(view, offset, length)

        // Notify subscribers
        if (tickData && this.subscribers.has(tickData.instrument_token)) {
          const callbacks = this.subscribers.get(tickData.instrument_token)
          callbacks?.forEach(callback => callback(tickData))
        }

        offset += length
      }
    } catch (error) {
      console.error('Error parsing binary message:', error)
    }
  }

  private parseTickData(view: DataView, offset: number, length: number): ZerodhaTickData | null {
    try {
      // Simplified parsing - actual implementation depends on mode
      const token = view.getUint32(offset, true)
      offset += 4

      const lastPrice = view.getUint32(offset, true) / 100
      offset += 4

      // This is a simplified version
      // Full parsing would include all fields based on mode
      return {
        instrument_token: token,
        is_tradable: true,
        mode: 'quote',
        timestamp: new Date(),
        last_price: lastPrice,
        last_quantity: 0,
        average_price: 0,
        volume: 0,
        buy_quantity: 0,
        sell_quantity: 0,
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        change: 0
      }
    } catch (error) {
      console.error('Error parsing tick data:', error)
      return null
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.connect()
          .then(() => {
            // Resubscribe to previous tokens
            if (this.subscribedTokens.size > 0) {
              this.subscribe(Array.from(this.subscribedTokens), 'quote')
            }
          })
          .catch(err => console.error('Reconnection failed:', err))
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }
}

// Export singleton instance
export const zerodhaWebSocket = new ZerodhaWebSocketService()
export default zerodhaWebSocket
