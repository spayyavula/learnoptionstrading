/**
 * Zerodha Kite Connect API Service
 *
 * Documentation: https://kite.trade/docs/connect/v3/
 *
 * Setup Instructions:
 * 1. Sign up at https://kite.trade/
 * 2. Create an app and get your API Key and Secret
 * 3. Add to .env file:
 *    VITE_ZERODHA_API_KEY=your_api_key
 *    VITE_ZERODHA_API_SECRET=your_api_secret
 *    VITE_ZERODHA_ACCESS_TOKEN=your_access_token (after login flow)
 *
 * Pricing: ₹2,000 one-time + ₹2,000/month
 */

export interface ZerodhaConfig {
  apiKey: string
  apiSecret: string
  accessToken?: string
}

export interface ZerodhaInstrument {
  instrument_token: number
  exchange_token: number
  tradingsymbol: string
  name: string
  last_price: number
  expiry: string
  strike: number
  tick_size: number
  lot_size: number
  instrument_type: 'CE' | 'PE' | 'FUT' // CE=Call, PE=Put, FUT=Future
  segment: 'NFO' | 'BFO' | 'CDS' | 'MCX' // NFO=NSE F&O
  exchange: 'NSE' | 'BSE' | 'NFO' | 'BFO'
}

export interface ZerodhaQuote {
  instrument_token: number
  timestamp: string
  last_price: number
  last_quantity: number
  last_trade_time: string
  average_price: number
  volume: number
  buy_quantity: number
  sell_quantity: number
  open: number
  high: number
  low: number
  close: number
  change: number
  oi: number // Open Interest
  oi_day_high: number
  oi_day_low: number
  ohlc: {
    open: number
    high: number
    low: number
    close: number
  }
  depth: {
    buy: Array<{ price: number; quantity: number; orders: number }>
    sell: Array<{ price: number; quantity: number; orders: number }>
  }
}

export interface ZerodhaOptionsChain {
  tradingsymbol: string
  calls: ZerodhaInstrument[]
  puts: ZerodhaInstrument[]
}

class ZerodhaService {
  private config: ZerodhaConfig
  private baseUrl = 'https://api.kite.trade'
  private _isConfigured = false

  constructor() {
    const apiKey = import.meta.env.VITE_ZERODHA_API_KEY || ''
    const apiSecret = import.meta.env.VITE_ZERODHA_API_SECRET || ''
    const accessToken = import.meta.env.VITE_ZERODHA_ACCESS_TOKEN || ''

    this.config = {
      apiKey,
      apiSecret,
      accessToken
    }

    this._isConfigured = !!(apiKey && apiSecret && accessToken)

    if (!this._isConfigured) {
      console.warn('⚠️ Zerodha API not configured. Add credentials to .env file.')
    } else {
      console.log('✅ Zerodha API configured')
    }
  }

  /**
   * Check if Zerodha API is properly configured
   */
  isAvailable(): boolean {
    return this._isConfigured
  }

  /**
   * Check if Zerodha API is properly configured
   */
  isConfigured(): boolean {
    return this._isConfigured
  }

  /**
   * Get authorization URL for user login
   * User needs to visit this URL to authorize the app
   */
  getLoginUrl(redirectUrl: string = window.location.origin): string {
    return `https://kite.zerodha.com/connect/login?api_key=${this.config.apiKey}&redirect_params=${encodeURIComponent(redirectUrl)}`
  }

  /**
   * Generate session (access token) from request token
   * Call this after user redirects back from Kite login
   */
  async generateSession(requestToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const crypto = await import('crypto')
    const checksum = crypto
      .createHash('sha256')
      .update(this.config.apiKey + requestToken + this.config.apiSecret)
      .digest('hex')

    const response = await fetch(`${this.baseUrl}/session/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3'
      },
      body: new URLSearchParams({
        api_key: this.config.apiKey,
        request_token: requestToken,
        checksum: checksum
      })
    })

    const data = await response.json()

    if (data.status === 'success') {
      this.config.accessToken = data.data.access_token
      return data.data
    } else {
      throw new Error(data.message || 'Failed to generate session')
    }
  }

  /**
   * Get all instruments (stocks, options, futures)
   * This is a large file (~30-40 MB), cache it locally
   */
  async getInstruments(exchange: 'NSE' | 'NFO' | 'BSE' | 'BFO' = 'NFO'): Promise<ZerodhaInstrument[]> {
    if (!this._isConfigured) {
      throw new Error('Zerodha API not configured')
    }

    const response = await fetch(`${this.baseUrl}/instruments/${exchange}`, {
      headers: {
        'Authorization': `token ${this.config.apiKey}:${this.config.accessToken}`,
        'X-Kite-Version': '3'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch instruments: ${response.statusText}`)
    }

    // Response is CSV, parse it
    const csvText = await response.text()
    return this.parseInstrumentsCSV(csvText)
  }

  /**
   * Get options chain for a specific underlying symbol
   */
  async getOptionsChain(
    symbol: string,
    expiry?: string,
    exchange: 'NFO' | 'BFO' = 'NFO'
  ): Promise<ZerodhaOptionsChain> {
    const instruments = await this.getInstruments(exchange)

    // Filter for options of this symbol
    let options = instruments.filter(inst =>
      inst.name === symbol &&
      (inst.instrument_type === 'CE' || inst.instrument_type === 'PE')
    )

    // Filter by expiry if provided
    if (expiry) {
      options = options.filter(inst => inst.expiry === expiry)
    } else {
      // Get nearest expiry
      const expiryDates = [...new Set(options.map(opt => opt.expiry))].sort()
      if (expiryDates.length > 0) {
        options = options.filter(inst => inst.expiry === expiryDates[0])
      }
    }

    const calls = options.filter(opt => opt.instrument_type === 'CE')
    const puts = options.filter(opt => opt.instrument_type === 'PE')

    return {
      tradingsymbol: symbol,
      calls: calls.sort((a, b) => a.strike - b.strike),
      puts: puts.sort((a, b) => a.strike - b.strike)
    }
  }

  /**
   * Get real-time quote for instruments
   */
  async getQuote(instruments: string[]): Promise<Record<string, ZerodhaQuote>> {
    if (!this._isConfigured) {
      throw new Error('Zerodha API not configured')
    }

    const instrumentString = instruments.join(',')

    const response = await fetch(
      `${this.baseUrl}/quote?i=${encodeURIComponent(instrumentString)}`,
      {
        headers: {
          'Authorization': `token ${this.config.apiKey}:${this.config.accessToken}`,
          'X-Kite-Version': '3'
        }
      }
    )

    const data = await response.json()

    if (data.status === 'success') {
      return data.data
    } else {
      throw new Error(data.message || 'Failed to fetch quote')
    }
  }

  /**
   * Get LTP (Last Traded Price) for multiple instruments
   */
  async getLTP(instruments: string[]): Promise<Record<string, { instrument_token: number; last_price: number }>> {
    if (!this._isConfigured) {
      throw new Error('Zerodha API not configured')
    }

    const instrumentString = instruments.join(',')

    const response = await fetch(
      `${this.baseUrl}/quote/ltp?i=${encodeURIComponent(instrumentString)}`,
      {
        headers: {
          'Authorization': `token ${this.config.apiKey}:${this.config.accessToken}`,
          'X-Kite-Version': '3'
        }
      }
    )

    const data = await response.json()

    if (data.status === 'success') {
      return data.data
    } else {
      throw new Error(data.message || 'Failed to fetch LTP')
    }
  }

  /**
   * Get historical data (OHLC candles)
   */
  async getHistoricalData(
    instrumentToken: number,
    from: string, // YYYY-MM-DD
    to: string,   // YYYY-MM-DD
    interval: 'minute' | '3minute' | '5minute' | '10minute' | '15minute' | '30minute' | '60minute' | 'day'
  ): Promise<Array<{
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>> {
    if (!this._isConfigured) {
      throw new Error('Zerodha API not configured')
    }

    const response = await fetch(
      `${this.baseUrl}/instruments/historical/${instrumentToken}/${interval}?from=${from}&to=${to}`,
      {
        headers: {
          'Authorization': `token ${this.config.apiKey}:${this.config.accessToken}`,
          'X-Kite-Version': '3'
        }
      }
    )

    const data = await response.json()

    if (data.status === 'success') {
      return data.data.candles.map((candle: any[]) => ({
        date: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }))
    } else {
      throw new Error(data.message || 'Failed to fetch historical data')
    }
  }

  /**
   * Parse CSV response from instruments endpoint
   */
  private parseInstrumentsCSV(csv: string): ZerodhaInstrument[] {
    const lines = csv.trim().split('\n')
    const headers = lines[0].split(',')

    return lines.slice(1).map(line => {
      const values = line.split(',')
      const obj: any = {}

      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim()
      })

      return {
        instrument_token: parseInt(obj.instrument_token),
        exchange_token: parseInt(obj.exchange_token),
        tradingsymbol: obj.tradingsymbol,
        name: obj.name,
        last_price: parseFloat(obj.last_price),
        expiry: obj.expiry,
        strike: parseFloat(obj.strike),
        tick_size: parseFloat(obj.tick_size),
        lot_size: parseInt(obj.lot_size),
        instrument_type: obj.instrument_type,
        segment: obj.segment,
        exchange: obj.exchange
      }
    })
  }

  /**
   * Get popular Indian stocks for options trading
   */
  getPopularIndianStocks(): string[] {
    return [
      'NIFTY',      // Nifty 50 Index
      'BANKNIFTY',  // Bank Nifty Index
      'FINNIFTY',   // Fin Nifty Index
      'RELIANCE',   // Reliance Industries
      'TCS',        // Tata Consultancy Services
      'INFY',       // Infosys
      'HDFCBANK',   // HDFC Bank
      'ICICIBANK',  // ICICI Bank
      'SBIN',       // State Bank of India
      'BHARTIARTL', // Bharti Airtel
      'ITC',        // ITC Limited
      'HINDUNILVR', // Hindustan Unilever
      'KOTAKBANK',  // Kotak Mahindra Bank
      'LT',         // Larsen & Toubro
      'AXISBANK',   // Axis Bank
      'ASIANPAINT', // Asian Paints
      'MARUTI',     // Maruti Suzuki
      'TITAN',      // Titan Company
      'BAJFINANCE', // Bajaj Finance
      'WIPRO'       // Wipro
    ]
  }
}

// Export singleton instance
export const zerodhaService = new ZerodhaService()
export default zerodhaService
