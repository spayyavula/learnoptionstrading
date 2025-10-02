import React, { useEffect, useState } from 'react'
import { liveOptionsDataService, LiquidTicker } from '../services/liveOptionsDataService'

interface TickerSelectorProps {
  selectedTicker: string
  onTickerChange: (ticker: string) => void
}

export const TickerSelector: React.FC<TickerSelectorProps> = ({
  selectedTicker,
  onTickerChange
}) => {
  const [tickers, setTickers] = useState<LiquidTicker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    loadTickers()
  }, [])

  const loadTickers = async () => {
    setLoading(true)
    const data = await liveOptionsDataService.fetchLiquidTickers()
    setTickers(data)
    setLoading(false)
  }

  const filteredTickers = tickers.filter(
    ticker =>
      ticker.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticker.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedTickerData = tickers.find(t => t.ticker === selectedTicker)

  const formatNumber = (num: number | undefined): string => {
    if (!num) return 'N/A'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(0)
  }

  const formatPrice = (price: number | undefined): string => {
    if (!price) return 'N/A'
    return `$${price.toFixed(2)}`
  }

  return (
    <div className="ticker-selector-container">
      <div className="ticker-selector-header">
        <label className="ticker-label">Select Ticker:</label>
        <div className="ticker-dropdown-wrapper">
          <button
            className="ticker-selected-button"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="ticker-selected-content">
              <span className="ticker-symbol">{selectedTicker}</span>
              {selectedTickerData && (
                <>
                  <span className="ticker-price">{formatPrice(selectedTickerData.current_price)}</span>
                  <span className="ticker-name">{selectedTickerData.name}</span>
                </>
              )}
            </div>
            <svg
              className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>

          {showDropdown && (
            <div className="ticker-dropdown-menu">
              <div className="ticker-search-wrapper">
                <input
                  type="text"
                  className="ticker-search-input"
                  placeholder="Search tickers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="ticker-list">
                {loading ? (
                  <div className="ticker-loading">Loading tickers...</div>
                ) : filteredTickers.length === 0 ? (
                  <div className="ticker-empty">No tickers found</div>
                ) : (
                  filteredTickers.map(ticker => (
                    <button
                      key={ticker.ticker}
                      className={`ticker-item ${selectedTicker === ticker.ticker ? 'selected' : ''}`}
                      onClick={() => {
                        onTickerChange(ticker.ticker)
                        setShowDropdown(false)
                        setSearchTerm('')
                      }}
                    >
                      <div className="ticker-item-header">
                        <span className="ticker-item-symbol">{ticker.ticker}</span>
                        <span className="ticker-item-price">{formatPrice(ticker.current_price)}</span>
                      </div>
                      <div className="ticker-item-details">
                        <span className="ticker-item-name">{ticker.name}</span>
                      </div>
                      <div className="ticker-item-metrics">
                        <div className="ticker-metric">
                          <span className="metric-label">Avg Vol:</span>
                          <span className="metric-value">{formatNumber(ticker.avg_daily_volume)}</span>
                        </div>
                        <div className="ticker-metric">
                          <span className="metric-label">Avg OI:</span>
                          <span className="metric-value">{formatNumber(ticker.avg_open_interest)}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ticker-selector-container {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .ticker-selector-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .ticker-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1f2937;
        }

        .ticker-dropdown-wrapper {
          position: relative;
          flex: 1;
          max-width: 500px;
        }

        .ticker-selected-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ticker-selected-button:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .ticker-selected-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .ticker-symbol {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1f2937;
          min-width: 60px;
        }

        .ticker-price {
          font-size: 1rem;
          font-weight: 600;
          color: #059669;
          min-width: 80px;
        }

        .ticker-name {
          font-size: 0.9rem;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dropdown-arrow {
          transition: transform 0.2s;
          color: #6b7280;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .ticker-dropdown-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 500px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .ticker-search-wrapper {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .ticker-search-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .ticker-search-input:focus {
          border-color: #3b82f6;
        }

        .ticker-list {
          overflow-y: auto;
          max-height: 400px;
        }

        .ticker-loading,
        .ticker-empty {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .ticker-item {
          width: 100%;
          padding: 0.75rem 1rem;
          text-align: left;
          background: white;
          border: none;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ticker-item:hover {
          background: #f9fafb;
        }

        .ticker-item.selected {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
        }

        .ticker-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .ticker-item-symbol {
          font-size: 1rem;
          font-weight: 700;
          color: #1f2937;
        }

        .ticker-item-price {
          font-size: 0.95rem;
          font-weight: 600;
          color: #059669;
        }

        .ticker-item-details {
          margin-bottom: 0.5rem;
        }

        .ticker-item-name {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .ticker-item-metrics {
          display: flex;
          gap: 1rem;
        }

        .ticker-metric {
          display: flex;
          gap: 0.25rem;
          font-size: 0.8rem;
        }

        .metric-label {
          color: #9ca3af;
        }

        .metric-value {
          color: #4b5563;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .ticker-selector-header {
            flex-direction: column;
            align-items: stretch;
          }

          .ticker-dropdown-wrapper {
            max-width: none;
          }

          .ticker-selected-content {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .ticker-name {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
