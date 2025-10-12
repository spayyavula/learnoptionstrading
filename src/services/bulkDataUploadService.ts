/**
 * Bulk Data Upload Service
 *
 * Handles bulk uploads to historical data tables with:
 * - Multi-format support (CSV, JSON, Excel)
 * - Schema validation
 * - Batch processing
 * - Duplicate detection
 * - Error reporting
 * - Progress tracking
 */

import { supabase } from '../lib/supabase'
import Papa from 'papaparse'

export type UploadTableType =
  | 'historical_data'
  | 'options_historical_data'
  | 'historical_greeks_snapshots'
  | 'historical_volatility_surface'
  | 'corporate_actions'
  | 'historical_market_indicators'
  | 'intraday_price_data'

export interface UploadProgress {
  total: number
  processed: number
  successful: number
  failed: number
  errors: UploadError[]
  status: 'idle' | 'validating' | 'uploading' | 'completed' | 'error'
}

export interface UploadError {
  row: number
  field?: string
  message: string
  data?: any
}

export interface UploadResult {
  success: boolean
  totalRecords: number
  inserted: number
  updated: number
  failed: number
  errors: UploadError[]
  duration: number
}

export interface TableSchema {
  name: string
  displayName: string
  description: string
  fields: SchemaField[]
  sampleData: Record<string, any>[]
}

export interface SchemaField {
  name: string
  type: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'json'
  required: boolean
  description: string
  example: any
  validation?: (value: any) => boolean | string
}

// Table schemas for validation and templates
export const TABLE_SCHEMAS: Record<UploadTableType, TableSchema> = {
  historical_data: {
    name: 'historical_data',
    displayName: 'Historical Stock Data (OHLCV)',
    description: 'Daily stock price data with OHLCV',
    fields: [
      { name: 'ticker', type: 'text', required: true, description: 'Stock ticker symbol', example: 'AAPL' },
      { name: 'date', type: 'date', required: true, description: 'Date (YYYY-MM-DD)', example: '2024-01-01' },
      { name: 'open', type: 'number', required: true, description: 'Opening price', example: 150.25 },
      { name: 'high', type: 'number', required: true, description: 'High price', example: 152.30 },
      { name: 'low', type: 'number', required: true, description: 'Low price', example: 149.80 },
      { name: 'close', type: 'number', required: true, description: 'Closing price', example: 151.75 },
      { name: 'volume', type: 'number', required: true, description: 'Trading volume', example: 50000000 }
    ],
    sampleData: [
      { ticker: 'AAPL', date: '2024-01-01', open: 150.25, high: 152.30, low: 149.80, close: 151.75, volume: 50000000 },
      { ticker: 'AAPL', date: '2024-01-02', open: 151.75, high: 153.50, low: 151.00, close: 152.80, volume: 45000000 }
    ]
  },

  options_historical_data: {
    name: 'options_historical_data',
    displayName: 'Historical Options Data',
    description: 'Daily options contract data with pricing and Greeks',
    fields: [
      { name: 'contract_ticker', type: 'text', required: true, description: 'Options contract ticker', example: 'O:AAPL250117C00150000' },
      { name: 'underlying_ticker', type: 'text', required: true, description: 'Underlying stock ticker', example: 'AAPL' },
      { name: 'date', type: 'date', required: true, description: 'Date (YYYY-MM-DD)', example: '2024-01-01' },
      { name: 'bid', type: 'number', required: true, description: 'Bid price', example: 5.20 },
      { name: 'ask', type: 'number', required: true, description: 'Ask price', example: 5.30 },
      { name: 'last', type: 'number', required: true, description: 'Last trade price', example: 5.25 },
      { name: 'volume', type: 'number', required: false, description: 'Trading volume', example: 1000 },
      { name: 'open_interest', type: 'number', required: false, description: 'Open interest', example: 5000 },
      { name: 'implied_volatility', type: 'number', required: false, description: 'Implied volatility', example: 0.25 },
      { name: 'delta', type: 'number', required: false, description: 'Delta', example: 0.65 },
      { name: 'gamma', type: 'number', required: false, description: 'Gamma', example: 0.05 },
      { name: 'theta', type: 'number', required: false, description: 'Theta', example: -0.03 },
      { name: 'vega', type: 'number', required: false, description: 'Vega', example: 0.15 }
    ],
    sampleData: [
      {
        contract_ticker: 'O:AAPL250117C00150000',
        underlying_ticker: 'AAPL',
        date: '2024-01-01',
        bid: 5.20,
        ask: 5.30,
        last: 5.25,
        volume: 1000,
        open_interest: 5000,
        implied_volatility: 0.25,
        delta: 0.65,
        gamma: 0.05,
        theta: -0.03,
        vega: 0.15
      }
    ]
  },

  historical_greeks_snapshots: {
    name: 'historical_greeks_snapshots',
    displayName: 'Greeks Snapshots',
    description: 'High-frequency Greeks snapshots for detailed tracking',
    fields: [
      { name: 'contract_ticker', type: 'text', required: true, description: 'Options contract ticker', example: 'O:AAPL250117C00150000' },
      { name: 'underlying_ticker', type: 'text', required: true, description: 'Underlying stock ticker', example: 'AAPL' },
      { name: 'snapshot_time', type: 'datetime', required: true, description: 'Snapshot timestamp (ISO 8601)', example: '2024-01-01T14:30:00Z' },
      { name: 'underlying_price', type: 'number', required: true, description: 'Underlying price at snapshot', example: 151.75 },
      { name: 'strike_price', type: 'number', required: true, description: 'Strike price', example: 150.00 },
      { name: 'expiration_date', type: 'date', required: true, description: 'Expiration date', example: '2025-01-17' },
      { name: 'option_type', type: 'text', required: true, description: 'call or put', example: 'call' },
      { name: 'bid', type: 'number', required: false, description: 'Bid price', example: 5.20 },
      { name: 'ask', type: 'number', required: false, description: 'Ask price', example: 5.30 },
      { name: 'last', type: 'number', required: false, description: 'Last price', example: 5.25 },
      { name: 'volume', type: 'number', required: false, description: 'Volume', example: 1000 },
      { name: 'open_interest', type: 'number', required: false, description: 'Open interest', example: 5000 },
      { name: 'implied_volatility', type: 'number', required: false, description: 'IV', example: 0.25 },
      { name: 'delta', type: 'number', required: false, description: 'Delta', example: 0.65 },
      { name: 'gamma', type: 'number', required: false, description: 'Gamma', example: 0.05 },
      { name: 'theta', type: 'number', required: false, description: 'Theta', example: -0.03 },
      { name: 'vega', type: 'number', required: false, description: 'Vega', example: 0.15 },
      { name: 'rho', type: 'number', required: false, description: 'Rho', example: 0.08 }
    ],
    sampleData: []
  },

  historical_volatility_surface: {
    name: 'historical_volatility_surface',
    displayName: 'Volatility Surface Data',
    description: 'IV surface across strikes and expirations',
    fields: [
      { name: 'underlying_ticker', type: 'text', required: true, description: 'Underlying ticker', example: 'AAPL' },
      { name: 'snapshot_date', type: 'date', required: true, description: 'Snapshot date', example: '2024-01-01' },
      { name: 'strike_price', type: 'number', required: true, description: 'Strike price', example: 150.00 },
      { name: 'expiration_date', type: 'date', required: true, description: 'Expiration date', example: '2025-01-17' },
      { name: 'days_to_expiration', type: 'number', required: true, description: 'DTE', example: 380 },
      { name: 'option_type', type: 'text', required: true, description: 'call or put', example: 'call' },
      { name: 'implied_volatility', type: 'number', required: true, description: 'IV', example: 0.25 },
      { name: 'delta', type: 'number', required: false, description: 'Delta', example: 0.65 },
      { name: 'moneyness', type: 'number', required: false, description: 'Strike/Spot ratio', example: 0.988 },
      { name: 'underlying_price', type: 'number', required: true, description: 'Underlying price', example: 151.75 },
      { name: 'volume', type: 'number', required: false, description: 'Volume', example: 1000 },
      { name: 'open_interest', type: 'number', required: false, description: 'OI', example: 5000 }
    ],
    sampleData: []
  },

  corporate_actions: {
    name: 'corporate_actions',
    displayName: 'Corporate Actions',
    description: 'Dividends, splits, earnings, and other corporate events',
    fields: [
      { name: 'ticker', type: 'text', required: true, description: 'Stock ticker', example: 'AAPL' },
      { name: 'action_type', type: 'text', required: true, description: 'dividend, split, earnings, merger, spinoff, rights_offering', example: 'dividend' },
      { name: 'announced_date', type: 'date', required: false, description: 'Announcement date', example: '2024-01-01' },
      { name: 'ex_date', type: 'date', required: true, description: 'Ex-dividend date', example: '2024-01-15' },
      { name: 'record_date', type: 'date', required: false, description: 'Record date', example: '2024-01-17' },
      { name: 'payment_date', type: 'date', required: false, description: 'Payment date', example: '2024-02-01' },
      { name: 'amount', type: 'number', required: false, description: 'Dividend amount', example: 0.25 },
      { name: 'split_ratio', type: 'text', required: false, description: 'Split ratio (e.g., 2:1)', example: '2:1' },
      { name: 'description', type: 'text', required: false, description: 'Additional details', example: 'Quarterly dividend' },
      { name: 'metadata', type: 'json', required: false, description: 'Additional JSON data', example: '{}' }
    ],
    sampleData: [
      { ticker: 'AAPL', action_type: 'dividend', ex_date: '2024-01-15', amount: 0.25, description: 'Quarterly dividend' }
    ]
  },

  historical_market_indicators: {
    name: 'historical_market_indicators',
    displayName: 'Market Indicators',
    description: 'VIX, market breadth, sector rotation, and sentiment indicators',
    fields: [
      { name: 'indicator_date', type: 'date', required: true, description: 'Date', example: '2024-01-01' },
      { name: 'vix_close', type: 'number', required: false, description: 'VIX close', example: 15.20 },
      { name: 'vix_high', type: 'number', required: false, description: 'VIX high', example: 16.50 },
      { name: 'vix_low', type: 'number', required: false, description: 'VIX low', example: 14.80 },
      { name: 'vix_open', type: 'number', required: false, description: 'VIX open', example: 15.00 },
      { name: 'spy_close', type: 'number', required: false, description: 'SPY close', example: 475.30 },
      { name: 'spy_volume', type: 'number', required: false, description: 'SPY volume', example: 80000000 },
      { name: 'advance_decline_ratio', type: 'number', required: false, description: 'Advance/Decline ratio', example: 1.25 },
      { name: 'new_highs', type: 'number', required: false, description: 'New 52-week highs', example: 150 },
      { name: 'new_lows', type: 'number', required: false, description: 'New 52-week lows', example: 25 },
      { name: 'put_call_ratio', type: 'number', required: false, description: 'Put/Call ratio', example: 0.85 },
      { name: 'market_breadth_score', type: 'number', required: false, description: 'Breadth score', example: 65.5 },
      { name: 'fear_greed_index', type: 'number', required: false, description: 'Fear & Greed (0-100)', example: 55 },
      { name: 'sector_rotation', type: 'json', required: false, description: 'Sector performance JSON', example: '{"technology": 1.2, "finance": -0.5}' },
      { name: 'metadata', type: 'json', required: false, description: 'Additional metadata', example: '{}' }
    ],
    sampleData: []
  },

  intraday_price_data: {
    name: 'intraday_price_data',
    displayName: 'Intraday Price Data',
    description: 'High-resolution intraday bars (1min to 1hour)',
    fields: [
      { name: 'ticker', type: 'text', required: true, description: 'Ticker symbol', example: 'AAPL' },
      { name: 'bar_timestamp', type: 'datetime', required: true, description: 'Bar timestamp (ISO 8601)', example: '2024-01-01T09:30:00Z' },
      { name: 'interval', type: 'text', required: true, description: '1min, 5min, 15min, 30min, 1hour', example: '5min' },
      { name: 'open', type: 'number', required: true, description: 'Open price', example: 150.25 },
      { name: 'high', type: 'number', required: true, description: 'High price', example: 150.50 },
      { name: 'low', type: 'number', required: true, description: 'Low price', example: 150.10 },
      { name: 'close', type: 'number', required: true, description: 'Close price', example: 150.45 },
      { name: 'volume', type: 'number', required: true, description: 'Volume', example: 50000 },
      { name: 'vwap', type: 'number', required: false, description: 'VWAP', example: 150.30 },
      { name: 'trade_count', type: 'number', required: false, description: 'Number of trades', example: 1500 }
    ],
    sampleData: []
  }
}

export class BulkDataUploadService {
  /**
   * Parse uploaded file (CSV, JSON, or Excel)
   */
  static async parseFile(file: File): Promise<any[]> {
    const fileType = file.name.split('.').pop()?.toLowerCase()

    if (fileType === 'csv') {
      return this.parseCSV(file)
    } else if (fileType === 'json') {
      return this.parseJSON(file)
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      throw new Error('Excel support requires additional library. Please use CSV or JSON format.')
    } else {
      throw new Error('Unsupported file format. Please use CSV or JSON.')
    }
  }

  /**
   * Parse CSV file
   */
  private static parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`))
          } else {
            resolve(results.data)
          }
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }

  /**
   * Parse JSON file
   */
  private static async parseJSON(file: File): Promise<any[]> {
    const text = await file.text()
    const data = JSON.parse(text)

    if (Array.isArray(data)) {
      return data
    } else if (typeof data === 'object' && data.data && Array.isArray(data.data)) {
      return data.data
    } else {
      throw new Error('JSON must be an array or object with a "data" array property')
    }
  }

  /**
   * Validate data against table schema
   */
  static validateData(
    data: any[],
    tableType: UploadTableType
  ): { valid: boolean; errors: UploadError[] } {
    const schema = TABLE_SCHEMAS[tableType]
    const errors: UploadError[] = []

    data.forEach((row, index) => {
      // Check required fields
      schema.fields
        .filter(field => field.required)
        .forEach(field => {
          if (row[field.name] === undefined || row[field.name] === null || row[field.name] === '') {
            errors.push({
              row: index + 1,
              field: field.name,
              message: `Missing required field: ${field.name}`,
              data: row
            })
          }
        })

      // Type validation
      schema.fields.forEach(field => {
        const value = row[field.name]
        if (value !== undefined && value !== null && value !== '') {
          if (!this.validateFieldType(value, field.type)) {
            errors.push({
              row: index + 1,
              field: field.name,
              message: `Invalid type for ${field.name}. Expected ${field.type}, got ${typeof value}`,
              data: row
            })
          }
        }
      })

      // Custom validation
      schema.fields.forEach(field => {
        if (field.validation && row[field.name] !== undefined) {
          const validationResult = field.validation(row[field.name])
          if (validationResult !== true) {
            errors.push({
              row: index + 1,
              field: field.name,
              message: typeof validationResult === 'string' ? validationResult : `Validation failed for ${field.name}`,
              data: row
            })
          }
        }
      })
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate field type
   */
  private static validateFieldType(value: any, type: SchemaField['type']): boolean {
    switch (type) {
      case 'text':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'date':
        return !isNaN(Date.parse(value))
      case 'datetime':
        return !isNaN(Date.parse(value))
      case 'boolean':
        return typeof value === 'boolean'
      case 'json':
        try {
          if (typeof value === 'string') {
            JSON.parse(value)
          }
          return true
        } catch {
          return false
        }
      default:
        return true
    }
  }

  /**
   * Upload data in batches with progress tracking
   */
  static async uploadData(
    data: any[],
    tableType: UploadTableType,
    onProgress?: (progress: UploadProgress) => void,
    batchSize: number = 100
  ): Promise<UploadResult> {
    const startTime = Date.now()
    const progress: UploadProgress = {
      total: data.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      status: 'validating'
    }

    onProgress?.(progress)

    // Validate data first
    const validation = this.validateData(data, tableType)
    if (!validation.valid) {
      progress.status = 'error'
      progress.errors = validation.errors
      onProgress?.(progress)

      return {
        success: false,
        totalRecords: data.length,
        inserted: 0,
        updated: 0,
        failed: data.length,
        errors: validation.errors,
        duration: Date.now() - startTime
      }
    }

    progress.status = 'uploading'
    onProgress?.(progress)

    let inserted = 0
    let updated = 0
    let failed = 0

    // Process in batches
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)

      try {
        const { error } = await supabase
          .from(tableType)
          .upsert(batch, { onConflict: this.getUniqueColumns(tableType) })

        if (error) {
          failed += batch.length
          progress.errors.push({
            row: i,
            message: `Batch upload failed: ${error.message}`,
            data: batch
          })
        } else {
          inserted += batch.length
        }
      } catch (error: any) {
        failed += batch.length
        progress.errors.push({
          row: i,
          message: `Batch upload error: ${error.message}`,
          data: batch
        })
      }

      progress.processed += batch.length
      progress.successful = inserted
      progress.failed = failed
      onProgress?.(progress)

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    progress.status = 'completed'
    onProgress?.(progress)

    return {
      success: failed === 0,
      totalRecords: data.length,
      inserted,
      updated,
      failed,
      errors: progress.errors,
      duration: Date.now() - startTime
    }
  }

  /**
   * Get unique columns for upsert conflict resolution
   */
  private static getUniqueColumns(tableType: UploadTableType): string {
    const uniqueColumns: Record<UploadTableType, string> = {
      historical_data: 'ticker,date',
      options_historical_data: 'contract_ticker,date',
      historical_greeks_snapshots: 'contract_ticker,snapshot_time',
      historical_volatility_surface: 'underlying_ticker,snapshot_date,strike_price,expiration_date,option_type',
      corporate_actions: 'ticker,action_type,ex_date',
      historical_market_indicators: 'indicator_date',
      intraday_price_data: 'ticker,bar_timestamp,interval'
    }

    return uniqueColumns[tableType]
  }

  /**
   * Generate sample CSV template
   */
  static generateCSVTemplate(tableType: UploadTableType): string {
    const schema = TABLE_SCHEMAS[tableType]

    // Header row
    const headers = schema.fields.map(f => f.name).join(',')

    // Sample data rows
    const sampleRows = schema.sampleData.length > 0
      ? schema.sampleData.map(row =>
          schema.fields.map(f => {
            const value = row[f.name]
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value ?? ''
          }).join(',')
        ).join('\n')
      : schema.fields.map(f => f.example ?? '').join(',')

    return `${headers}\n${sampleRows}`
  }

  /**
   * Generate JSON template
   */
  static generateJSONTemplate(tableType: UploadTableType): string {
    const schema = TABLE_SCHEMAS[tableType]

    const template = schema.sampleData.length > 0
      ? schema.sampleData
      : [schema.fields.reduce((obj, field) => {
          obj[field.name] = field.example
          return obj
        }, {} as Record<string, any>)]

    return JSON.stringify(template, null, 2)
  }

  /**
   * Download template file
   */
  static downloadTemplate(tableType: UploadTableType, format: 'csv' | 'json') {
    const schema = TABLE_SCHEMAS[tableType]
    const content = format === 'csv'
      ? this.generateCSVTemplate(tableType)
      : this.generateJSONTemplate(tableType)

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${schema.name}_template.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Get data quality summary
   */
  static async getDataQualitySummary(tableType: UploadTableType): Promise<any> {
    const { data, error } = await supabase
      .from(tableType)
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    return {
      tableName: tableType,
      totalRecords: data?.length || 0
    }
  }
}
