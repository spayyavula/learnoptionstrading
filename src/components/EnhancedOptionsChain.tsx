import React, { useEffect, useState, useMemo } from 'react'
import { liveOptionsDataService, LiveOptionsContract, OptionsExpiry, DataServiceStatus } from '../services/liveOptionsDataService'
import { TickerSelector } from './TickerSelector'
import { ExpiryFilter } from './ExpiryFilter'

interface StrikeRow {
  strike: number
  call: LiveOptionsContract | null
  put: LiveOptionsContract | null
}

export const EnhancedOptionsChain: React.FC = () => {
  const [selectedTicker, setSelectedTicker] = useState('SPY')
  const [underlyingPrice, setUnderlyingPrice] = useState<number | null>(null)
  const [contracts, setContracts] = useState<LiveOptionsContract[]>([])
  const [expiries, setExpiries] = useState<OptionsExpiry[]>([])
  const [selectedExpiryType, setSelectedExpiryType] = useState('All')
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [strikeRange, setStrikeRange] = useState<{ min: number; max: number }>({ min: 0, max: 9999 })
  const [minVolume, setMinVolume] = useState(0)
  const [sortBy, setSortBy] = useState<string>('strike')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [serviceStatus, setServiceStatus] = useState<DataServiceStatus | null>(null)
  const [showMockDataNotice, setShowMockDataNotice] = useState(false)

  useEffect(() => {
    const status = liveOptionsDataService.getStatus()
    setServiceStatus(status)
    console.log('[EnhancedOptionsChain] Service Status:', status)
    console.log('[EnhancedOptionsChain] API Key Configured:', status.hasApiKey ? 'YES ✓' : 'NO ✗')
    loadData()
  }, [selectedTicker])

  useEffect(() => {
    if (selectedExpiryDate) {
      loadOptionsForExpiry()
    }
  }, [selectedExpiryDate, selectedTicker])

  useEffect(() => {
    const ws = liveOptionsDataService.connectWebSocket(
      [selectedTicker],
      handleWebSocketMessage
    )

    return () => {
      liveOptionsDataService.disconnectWebSocket()
    }
  }, [selectedTicker])

  const loadData = async () => {
    setLoading(true)
    console.log(`[EnhancedOptionsChain] Loading data for ticker: ${selectedTicker}`)

    try {
      const status = liveOptionsDataService.getStatus()
      setServiceStatus(status)
      console.log('[EnhancedOptionsChain] Data Source:', status.hasApiKey ? 'Live API Data' : 'Mock Data')

      const [price, expiryData] = await Promise.all([
        liveOptionsDataService.getUnderlyingPrice(selectedTicker),
        liveOptionsDataService.fetchExpiriesForTicker(selectedTicker)
      ])

      console.log(`[EnhancedOptionsChain] Loaded ${expiryData.length} expiries for ${selectedTicker}`)
      setUnderlyingPrice(price)
      setExpiries(expiryData)

      if (expiryData.length > 0) {
        setShowMockDataNotice(!status.hasApiKey)
        if (!selectedExpiryDate) {
          const defaultExpiry = expiryData.find(e => e.expiry_type === 'Weekly') || expiryData[0]
          setSelectedExpiryDate(defaultExpiry.expiration_date)
          console.log(`[EnhancedOptionsChain] Default expiry selected: ${defaultExpiry.expiration_date}`)
        }
      } else {
        setShowMockDataNotice(true)
        console.warn('[EnhancedOptionsChain] No expiry data found, showing mock data notice')
      }
    } catch (error) {
      console.error('[EnhancedOptionsChain] Error loading data:', error)
      setShowMockDataNotice(true)
    } finally {
      setLoading(false)
    }
  }

  const loadOptionsForExpiry = async () => {
    if (!selectedExpiryDate) return

    const data = await liveOptionsDataService.fetchOptionsForTicker(
      selectedTicker,
      selectedExpiryDate
    )
    setContracts(data)

    if (data.length > 0 && underlyingPrice) {
      const strikes = Array.from(new Set(data.map(c => c.strike_price))).sort((a, b) => a - b)
      const atmIndex = strikes.findIndex(s => s >= underlyingPrice)
      const rangeSize = 15

      if (atmIndex >= 0) {
        const minStrike = strikes[Math.max(0, atmIndex - rangeSize)]
        const maxStrike = strikes[Math.min(strikes.length - 1, atmIndex + rangeSize)]
        setStrikeRange({ min: minStrike, max: maxStrike })
      }
    }
  }

  const syncData = async () => {
    setSyncing(true)
    try {
      await liveOptionsDataService.syncOptionsDataForTicker(selectedTicker)
      await loadData()
      if (selectedExpiryDate) {
        await loadOptionsForExpiry()
      }
    } catch (error) {
      console.error('Error syncing data:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleWebSocketMessage = (msg: any) => {
    console.log('WebSocket message:', msg)
  }

  const filteredAndSortedRows = useMemo(() => {
    const callsMap = new Map<number, LiveOptionsContract>()
    const putsMap = new Map<number, LiveOptionsContract>()

    contracts
      .filter(c => c.volume >= minVolume)
      .filter(c => c.strike_price >= strikeRange.min && c.strike_price <= strikeRange.max)
      .forEach(contract => {
        if (contract.contract_type === 'call') {
          callsMap.set(contract.strike_price, contract)
        } else {
          putsMap.set(contract.strike_price, contract)
        }
      })

    const allStrikes = Array.from(
      new Set([...callsMap.keys(), ...putsMap.keys()])
    ).sort((a, b) => a - b)

    let rows: StrikeRow[] = allStrikes.map(strike => ({
      strike,
      call: callsMap.get(strike) || null,
      put: putsMap.get(strike) || null
    }))

    if (sortBy !== 'strike') {
      rows.sort((a, b) => {
        let aVal = 0, bVal = 0

        const getSortValue = (row: StrikeRow, side: 'call' | 'put') => {
          const contract = side === 'call' ? row.call : row.put
          if (!contract) return 0

          switch (sortBy) {
            case 'volume': return contract.volume
            case 'oi': return contract.open_interest
            case 'iv': return contract.implied_volatility
            case 'delta': return Math.abs(contract.delta)
            default: return 0
          }
        }

        aVal = Math.max(getSortValue(a, 'call'), getSortValue(a, 'put'))
        bVal = Math.max(getSortValue(b, 'call'), getSortValue(b, 'put'))

        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      })
    } else if (sortOrder === 'desc') {
      rows.reverse()
    }

    return rows
  }, [contracts, strikeRange, minVolume, sortBy, sortOrder])

  const isITM = (contract: LiveOptionsContract | null): boolean => {
    if (!contract || !underlyingPrice) return false
    return contract.contract_type === 'call'
      ? contract.strike_price < underlyingPrice
      : contract.strike_price > underlyingPrice
  }

  const formatPrice = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-'
    return `$${value.toFixed(2)}`
  }

  const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-'
    return `${(value * 100).toFixed(1)}%`
  }

  const formatGreek = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-'
    return value.toFixed(3)
  }

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-'
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  const getVolumeBarWidth = (volume: number): number => {
    const maxVolume = Math.max(...contracts.map(c => c.volume))
    return maxVolume > 0 ? (volume / maxVolume) * 100 : 0
  }

  return (
    <div className="enhanced-options-chain">
      <div className="chain-header">
        <div className="header-left">
          <h1 className="chain-title">Live Options Chain</h1>
          {serviceStatus && (
            <span className={`data-source-badge ${serviceStatus.hasApiKey ? 'live' : 'demo'}`}>
              {serviceStatus.hasApiKey ? '🟢 Live Data Available' : '⚠️ Demo Data Only'}
            </span>
          )}
        </div>
        <button
          className="sync-button"
          onClick={syncData}
          disabled={syncing || !serviceStatus?.hasApiKey}
          title={!serviceStatus?.hasApiKey ? 'API key required for live data sync' : 'Sync live data from Polygon API'}
        >
          {syncing ? '⟳ Syncing...' : '↻ Sync Data'}
        </button>
      </div>

      {showMockDataNotice && (
        <div className="mock-data-notice">
          <div className="notice-icon">ℹ️</div>
          <div className="notice-content">
            <strong>Showing Demo Data</strong>
            <p>
              You're viewing sample options data. To fetch live data from markets, you need to:
            </p>
            <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              <li>Get a free API key from Polygon.io</li>
              <li>Add it to your <code>.env</code> file as <code>VITE_POLYGON_API_KEY=your_api_key</code></li>
              <li>Restart the development server</li>
              <li>Click the "Sync Data" button to load live options data</li>
            </ol>
            <a
              href="https://polygon.io/dashboard/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="notice-link"
            >
              Get a free API key from Polygon.io →
            </a>
            {serviceStatus && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#78350f' }}>
                <strong>Status:</strong> {serviceStatus.message}
              </p>
            )}
          </div>
          <button className="notice-close" onClick={() => setShowMockDataNotice(false)}>✕</button>
        </div>
      )}

      <TickerSelector
        selectedTicker={selectedTicker}
        onTickerChange={setSelectedTicker}
      />

      {underlyingPrice && (
        <div className="underlying-price-banner">
          <span className="price-label">Underlying Price:</span>
          <span className="price-value">${underlyingPrice.toFixed(2)}</span>
        </div>
      )}

      <ExpiryFilter
        expiries={expiries}
        selectedExpiryType={selectedExpiryType}
        selectedExpiryDate={selectedExpiryDate || ''}
        onExpiryTypeChange={setSelectedExpiryType}
        onExpiryDateChange={setSelectedExpiryDate}
      />

      <div className="chain-controls">
        <div className="control-group">
          <label>Min Volume:</label>
          <input
            type="number"
            value={minVolume}
            onChange={(e) => setMinVolume(Number(e.target.value))}
            min="0"
            step="100"
          />
        </div>

        <div className="control-group">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="strike">Strike</option>
            <option value="volume">Volume</option>
            <option value="oi">Open Interest</option>
            <option value="iv">IV</option>
            <option value="delta">Delta</option>
          </select>
        </div>

        <div className="control-group">
          <label>Order:</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div className="control-group">
          <label>Strike Range:</label>
          <input
            type="number"
            value={strikeRange.min}
            onChange={(e) => setStrikeRange(prev => ({ ...prev, min: Number(e.target.value) }))}
            step="5"
          />
          <span>to</span>
          <input
            type="number"
            value={strikeRange.max}
            onChange={(e) => setStrikeRange(prev => ({ ...prev, max: Number(e.target.value) }))}
            step="5"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading options chain...</div>
      ) : (
        <div className="chain-table-wrapper">
          <table className="options-chain-table">
            <thead>
              <tr>
                <th colSpan={6} className="section-header call-section">CALLS</th>
                <th className="strike-header">STRIKE</th>
                <th colSpan={6} className="section-header put-section">PUTS</th>
              </tr>
              <tr>
                <th>Bid</th>
                <th>Ask</th>
                <th>Last</th>
                <th>Volume</th>
                <th>OI</th>
                <th>IV</th>
                <th className="strike-column">Price</th>
                <th>IV</th>
                <th>OI</th>
                <th>Volume</th>
                <th>Last</th>
                <th>Ask</th>
                <th>Bid</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRows.map(row => {
                const callITM = isITM(row.call)
                const putITM = isITM(row.put)
                const isATM = underlyingPrice && Math.abs(row.strike - underlyingPrice) < (underlyingPrice * 0.02)

                return (
                  <tr key={row.strike} className={isATM ? 'atm-row' : ''}>
                    <td className={`call-cell ${callITM ? 'itm' : 'otm'}`}>
                      {formatPrice(row.call?.bid)}
                    </td>
                    <td className={`call-cell ${callITM ? 'itm' : 'otm'}`}>
                      {formatPrice(row.call?.ask)}
                    </td>
                    <td className={`call-cell ${callITM ? 'itm' : 'otm'}`}>
                      {formatPrice(row.call?.last)}
                    </td>
                    <td className={`call-cell ${callITM ? 'itm' : 'otm'}`}>
                      <div className="volume-cell">
                        <div
                          className="volume-bar call-volume-bar"
                          style={{ width: `${getVolumeBarWidth(row.call?.volume || 0)}%` }}
                        />
                        <span className="volume-text">{formatNumber(row.call?.volume)}</span>
                      </div>
                    </td>
                    <td className={`call-cell ${callITM ? 'itm' : 'otm'}`}>
                      {formatNumber(row.call?.open_interest)}
                    </td>
                    <td className={`call-cell ${callITM ? 'itm' : 'otm'}`}>
                      {formatPercent(row.call?.implied_volatility)}
                    </td>
                    <td className="strike-cell">
                      <strong>${row.strike.toFixed(2)}</strong>
                    </td>
                    <td className={`put-cell ${putITM ? 'itm' : 'otm'}`}>
                      {formatPercent(row.put?.implied_volatility)}
                    </td>
                    <td className={`put-cell ${putITM ? 'itm' : 'otm'}`}>
                      {formatNumber(row.put?.open_interest)}
                    </td>
                    <td className={`put-cell ${putITM ? 'itm' : 'otm'}`}>
                      <div className="volume-cell">
                        <span className="volume-text">{formatNumber(row.put?.volume)}</span>
                        <div
                          className="volume-bar put-volume-bar"
                          style={{ width: `${getVolumeBarWidth(row.put?.volume || 0)}%` }}
                        />
                      </div>
                    </td>
                    <td className={`put-cell ${putITM ? 'itm' : 'otm'}`}>
                      {formatPrice(row.put?.last)}
                    </td>
                    <td className={`put-cell ${putITM ? 'itm' : 'otm'}`}>
                      {formatPrice(row.put?.ask)}
                    </td>
                    <td className={`put-cell ${putITM ? 'itm' : 'otm'}`}>
                      {formatPrice(row.put?.bid)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .enhanced-options-chain {
          max-width: 1600px;
          margin: 0 auto;
          padding: 2rem;
          background: #f9fafb;
        }

        .chain-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .chain-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .data-source-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .data-source-badge.live {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
          border: 1px solid #10b981;
        }

        .data-source-badge.demo {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          border: 1px solid #f59e0b;
        }

        .sync-button {
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sync-button:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .sync-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mock-data-notice {
          display: flex;
          align-items: start;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border-left: 4px solid #f59e0b;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
          position: relative;
        }

        .notice-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .notice-content {
          flex: 1;
        }

        .notice-content strong {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: #92400e;
          margin-bottom: 0.5rem;
        }

        .notice-content p {
          font-size: 0.9rem;
          color: #78350f;
          margin: 0 0 0.75rem 0;
          line-height: 1.5;
        }

        .notice-content code {
          display: block;
          background: rgba(255, 255, 255, 0.7);
          padding: 0.5rem;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
          color: #92400e;
          margin: 0.5rem 0;
        }

        .notice-link {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 1rem;
          background: #f59e0b;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .notice-link:hover {
          background: #d97706;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
        }

        .notice-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #92400e;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
          transition: opacity 0.2s;
        }

        .notice-close:hover {
          opacity: 0.7;
        }

        .underlying-price-banner {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 8px;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .price-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .price-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }

        .chain-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .control-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #4b5563;
        }

        .control-group input,
        .control-group select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .control-group input:focus,
        .control-group select:focus {
          border-color: #3b82f6;
        }

        .control-group input[type="number"] {
          width: 100px;
        }

        .loading-state {
          padding: 4rem;
          text-align: center;
          font-size: 1.1rem;
          color: #6b7280;
        }

        .chain-table-wrapper {
          overflow-x: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .options-chain-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .options-chain-table th {
          padding: 0.75rem 0.5rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          font-weight: 600;
          text-align: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .section-header {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.5rem;
        }

        .call-section {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
        }

        .put-section {
          background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
          color: #991b1b;
        }

        .strike-header {
          background: #f3f4f6;
          color: #1f2937;
          font-weight: 700;
        }

        .strike-column {
          background: #f9fafb;
          font-weight: 600;
        }

        .options-chain-table td {
          padding: 0.75rem 0.5rem;
          border: 1px solid #f3f4f6;
          text-align: center;
        }

        .call-cell {
          background: white;
          transition: background 0.2s;
        }

        .call-cell.itm {
          background: #ecfdf5;
          color: #065f46;
          font-weight: 600;
        }

        .put-cell {
          background: white;
          transition: background 0.2s;
        }

        .put-cell.itm {
          background: #fef2f2;
          color: #991b1b;
          font-weight: 600;
        }

        .strike-cell {
          background: #f9fafb;
          font-weight: 700;
          color: #1f2937;
          font-size: 1rem;
          border-left: 2px solid #d1d5db;
          border-right: 2px solid #d1d5db;
        }

        .atm-row {
          background: #fef3c7;
        }

        .atm-row .strike-cell {
          background: #fbbf24;
          color: #92400e;
        }

        .volume-cell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 60px;
        }

        .volume-bar {
          position: absolute;
          left: 0;
          height: 100%;
          opacity: 0.3;
          transition: width 0.3s;
        }

        .call-volume-bar {
          background: #10b981;
        }

        .put-volume-bar {
          background: #ef4444;
          left: auto;
          right: 0;
        }

        .volume-text {
          position: relative;
          z-index: 1;
          font-weight: 600;
        }

        @media (max-width: 1200px) {
          .enhanced-options-chain {
            padding: 1rem;
          }

          .chain-title {
            font-size: 1.5rem;
          }

          .options-chain-table {
            font-size: 0.8rem;
          }

          .options-chain-table th,
          .options-chain-table td {
            padding: 0.5rem 0.25rem;
          }
        }
      `}</style>
    </div>
  )
}
