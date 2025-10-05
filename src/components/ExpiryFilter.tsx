import React from 'react'
import { OptionsExpiry } from '../services/liveOptionsDataService'

interface ExpiryFilterProps {
  expiries: OptionsExpiry[]
  selectedExpiryType: string
  selectedExpiryDate: string | null
  onExpiryTypeChange: (type: string) => void
  onExpiryDateChange: (date: string) => void
}

const EXPIRY_TYPES = [
  { value: 'All', label: 'All', color: '#6b7280' },
  { value: '0DTE', label: '0DTE', color: '#dc2626' },
  { value: 'Daily', label: 'Daily', color: '#ea580c' },
  { value: 'Weekly', label: 'Weekly', color: '#f59e0b' },
  { value: 'Monthly', label: 'Monthly', color: '#10b981' },
  { value: 'Quarterly', label: 'Quarterly', color: '#3b82f6' },
  { value: 'LEAPS', label: 'LEAPS', color: '#8b5cf6' }
]

export const ExpiryFilter: React.FC<ExpiryFilterProps> = ({
  expiries,
  selectedExpiryType,
  selectedExpiryDate,
  onExpiryTypeChange,
  onExpiryDateChange
}) => {
  const filteredExpiries = selectedExpiryType === 'All'
    ? expiries
    : expiries.filter(e => e.expiry_type === selectedExpiryType)

  const getExpiryTypeColor = (type: string): string => {
    return EXPIRY_TYPES.find(t => t.value === type)?.color || '#6b7280'
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    return `${month} ${day}`
  }

  const formatDTE = (days: number): string => {
    if (days === 0) return 'Today'
    if (days === 1) return '1 day'
    return `${days} days`
  }

  const getTotalVolume = (expiry: OptionsExpiry): number => {
    return expiry.total_call_volume + expiry.total_put_volume
  }

  const getTotalOI = (expiry: OptionsExpiry): number => {
    return expiry.total_call_open_interest + expiry.total_put_open_interest
  }

  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="expiry-filter-container">
      <div className="expiry-type-tabs">
        {EXPIRY_TYPES.map(type => (
          <button
            key={type.value}
            className={`expiry-type-tab ${selectedExpiryType === type.value ? 'active' : ''}`}
            style={{
              borderColor: selectedExpiryType === type.value ? type.color : 'transparent',
              '--tab-color': type.color
            } as React.CSSProperties}
            onClick={() => onExpiryTypeChange(type.value)}
          >
            <span className="tab-label">{type.label}</span>
            <span className="tab-count">
              {selectedExpiryType === 'All' && type.value !== 'All'
                ? expiries.filter(e => e.expiry_type === type.value).length
                : type.value === 'All'
                ? expiries.length
                : null}
            </span>
          </button>
        ))}
      </div>

      <div className="expiry-dates-strip">
        {filteredExpiries.length === 0 ? (
          <div className="no-expiries">No expiries available for this filter</div>
        ) : (
          filteredExpiries.map(expiry => (
            <button
              key={expiry.expiration_date}
              className={`expiry-date-card ${selectedExpiryDate === expiry.expiration_date ? 'selected' : ''}`}
              style={{
                borderLeftColor: getExpiryTypeColor(expiry.expiry_type)
              }}
              onClick={() => onExpiryDateChange(expiry.expiration_date)}
            >
              <div className="expiry-date-header">
                <span className="expiry-date">{formatDate(expiry.expiration_date)}</span>
                <span
                  className="expiry-badge"
                  style={{ backgroundColor: getExpiryTypeColor(expiry.expiry_type) }}
                >
                  {expiry.expiry_type}
                </span>
              </div>
              <div className="expiry-dte">
                {formatDTE(expiry.days_to_expiry)}
              </div>
              <div className="expiry-metrics">
                <div className="expiry-metric">
                  <span className="metric-icon">📊</span>
                  <span className="metric-value">{formatLargeNumber(getTotalVolume(expiry))}</span>
                  <span className="metric-label">Vol</span>
                </div>
                <div className="expiry-metric">
                  <span className="metric-icon">🔓</span>
                  <span className="metric-value">{formatLargeNumber(getTotalOI(expiry))}</span>
                  <span className="metric-label">OI</span>
                </div>
              </div>
              <div className="expiry-ratio">
                <div className="ratio-bar">
                  <div
                    className="ratio-fill ratio-calls"
                    style={{
                      width: `${(expiry.total_call_volume / (getTotalVolume(expiry) || 1)) * 100}%`
                    }}
                  />
                  <div
                    className="ratio-fill ratio-puts"
                    style={{
                      width: `${(expiry.total_put_volume / (getTotalVolume(expiry) || 1)) * 100}%`
                    }}
                  />
                </div>
                <div className="ratio-labels">
                  <span className="ratio-label-calls">Calls</span>
                  <span className="ratio-label-puts">Puts</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <style>{`
        .expiry-filter-container {
          margin-bottom: 2rem;
        }

        .expiry-type-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .expiry-type-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: white;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-size: 0.95rem;
          font-weight: 600;
          color: #4b5563;
        }

        .expiry-type-tab:hover {
          background: #f9fafb;
          transform: translateY(-1px);
        }

        .expiry-type-tab.active {
          border-width: 2px;
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          color: var(--tab-color);
        }

        .tab-label {
          font-weight: 600;
        }

        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.5rem;
          height: 1.5rem;
          padding: 0 0.5rem;
          background: #f3f4f6;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #6b7280;
        }

        .expiry-type-tab.active .tab-count {
          background: var(--tab-color);
          color: white;
        }

        .expiry-dates-strip {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding: 0.5rem 0;
          scroll-behavior: smooth;
        }

        .expiry-dates-strip::-webkit-scrollbar {
          height: 8px;
        }

        .expiry-dates-strip::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }

        .expiry-dates-strip::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .expiry-dates-strip::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .no-expiries {
          padding: 2rem;
          text-align: center;
          color: #9ca3af;
          font-size: 0.95rem;
        }

        .expiry-date-card {
          min-width: 200px;
          padding: 1rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-left-width: 4px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .expiry-date-card:hover {
          border-color: #d1d5db;
          border-left-color: inherit;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .expiry-date-card.selected {
          border-color: #3b82f6;
          border-left-color: inherit;
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.2);
          background: #eff6ff;
        }

        .expiry-date-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .expiry-date {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1f2937;
        }

        .expiry-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
        }

        .expiry-dte {
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 0.75rem;
        }

        .expiry-metrics {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .expiry-metric {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8rem;
        }

        .metric-icon {
          font-size: 1rem;
        }

        .metric-value {
          font-weight: 700;
          color: #1f2937;
        }

        .metric-label {
          color: #9ca3af;
        }

        .expiry-ratio {
          margin-top: 0.75rem;
        }

        .ratio-bar {
          display: flex;
          height: 6px;
          background: #f3f4f6;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.25rem;
        }

        .ratio-fill {
          transition: width 0.3s;
        }

        .ratio-calls {
          background: #10b981;
        }

        .ratio-puts {
          background: #ef4444;
        }

        .ratio-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .ratio-label-calls {
          color: #10b981;
        }

        .ratio-label-puts {
          color: #ef4444;
        }

        @media (max-width: 768px) {
          .expiry-type-tabs {
            gap: 0.25rem;
          }

          .expiry-type-tab {
            padding: 0.5rem 0.75rem;
            font-size: 0.85rem;
          }

          .expiry-date-card {
            min-width: 180px;
          }
        }
      `}</style>
    </div>
  )
}
