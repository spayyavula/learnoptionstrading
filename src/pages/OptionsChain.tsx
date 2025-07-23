import { useEffect, useState, useMemo } from 'react'

type Option = {
  ticker: string
  type: string
  strike: number
  expiry: string
  bid: number
  ask: number
  last: number
  volume: number
  open_interest: number
  implied_volatility: number
  delta: number
  gamma?: number
  theta?: number
  vega?: number
  intrinsic_value?: number
  time_value?: number
  probability_of_profit?: number
}

import styles from './OptionsChain.module.css'

export default function OptionsChain() {
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [expiry, setExpiry] = useState<string>('') // default empty, will be set after fetch
  const [expiries, setExpiries] = useState<string[]>([])
  const [minVolume, setMinVolume] = useState<number>(100)
  const [sortBy, setSortBy] = useState<'prob' | 'volume' | 'iv' | 'riskreward'>('prob')
  const [arbitrageRows, setArbitrageRows] = useState<any[]>([])
  const [underlyingPrice, setUnderlyingPrice] = useState<number | null>(null)

  // Fetch options contracts
  useEffect(() => {
    setLoading(true)
    fetch('https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=SPY&apiKey=YOUR_POLYGON_API_KEY')
      .then(res => res.json())
      .then(data => {
        const contracts = (data.results || []).map((opt: any) => ({
          ticker: opt.ticker,
          type: opt.contract_type,
          strike: opt.strike_price,
          expiry: opt.expiration_date,
          bid: opt.bid ?? 0,
          ask: opt.ask ?? 0,
          last: opt.last ?? 0,
          volume: opt.volume ?? 0,
          open_interest: opt.open_interest ?? 0,
          implied_volatility: opt.implied_volatility ?? 0,
          delta: opt.delta ?? 0,
          gamma: opt.gamma ?? 0,
          theta: opt.theta ?? 0,
          vega: opt.vega ?? 0,
          intrinsic_value: opt.intrinsic_value ?? 0,
          time_value: opt.time_value ?? 0,
          probability_of_profit: opt.delta ? Math.round(Math.abs(opt.delta) * 100) : undefined
        }))
        const uniqueExpiries = Array.from(new Set(contracts.map((c: Option) => c.expiry)))
        setExpiries(uniqueExpiries as string[])
        // Set default expiry to first available if not set
        if (uniqueExpiries.length > 0 && !expiry) {
          setExpiry(uniqueExpiries[0] as string)
        }
        setOptions(contracts)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Set expiry to first available when expiries change and expiry is not set
    if (expiries.length > 0 && !expiry) {
      setExpiry(expiries[0])
    }
  }, [expiries, expiry])

  // Fetch underlying price for SPY
  useEffect(() => {
    fetch('https://api.polygon.io/v2/aggs/ticker/SPY/prev?adjusted=true&apiKey=YOUR_POLYGON_API_KEY')
      .then(res => res.json())
      .then(data => {
        setUnderlyingPrice(data.results?.[0]?.c ?? null)
      })
      .catch(() => setUnderlyingPrice(null))
  }, [])

  // Arbitrage detection (simple: call/put parity)
  useEffect(() => {
    if (!options.length) return
    const rows: any[] = []
    const calls = options.filter(o => o.type === 'call' && o.expiry === expiry)
    const puts = options.filter(o => o.type === 'put' && o.expiry === expiry)
    calls.forEach(call => {
      const put = puts.find(p => p.strike === call.strike)
      if (put) {
        const parity = call.last - put.last - (call.strike - 0) // 0 = risk-free rate approx
        if (Math.abs(parity) > 1) {
          rows.push({
            strike: call.strike,
            expiry: call.expiry,
            callPrice: call.last,
            putPrice: put.last,
            parity,
          })
        }
      }
    })
    setArbitrageRows(rows)
  }, [options, expiry])

  // Filter for ATM, 10 above, 10 below
  const filteredOptions = useMemo(() => {
    const filtered = options
      .filter(opt => opt.expiry === expiry)
      .filter(opt => opt.volume >= minVolume)
    if (!underlyingPrice || filtered.length === 0) return []
    const strikes = Array.from(new Set(filtered.map(opt => opt.strike))).sort((a, b) => a - b)
    const atmIndex = strikes.findIndex(strike => strike >= underlyingPrice)
    const start = Math.max(atmIndex - 10, 0)
    const selectedStrikes = strikes.slice(start, atmIndex + 11) // 10 below, ATM, 10 above
    return filtered.filter(opt => selectedStrikes.includes(opt.strike))
      .sort((a, b) => {
        switch (sortBy) {
          case 'prob':
            return (b.probability_of_profit ?? 0) - (a.probability_of_profit ?? 0)
          case 'volume':
            return b.volume - a.volume
          case 'iv':
            return b.implied_volatility - a.implied_volatility
          case 'riskreward':
            return ((b.intrinsic_value ?? 0) / (b.ask || 1)) - ((a.intrinsic_value ?? 0) / (a.ask || 1))
          default:
            return 0
        }
      })
  }, [options, expiry, minVolume, sortBy, underlyingPrice])

  return (
    <div className="options-chain-container">
      <h2 className="options-chain-title">SPY Options Chain</h2>
      <div className="options-chain-controls">
        <label>
          Expiry:
          <select value={expiry} onChange={e => setExpiry(e.target.value)} className="options-chain-select">
            {expiries.length === 0 ? (
              <option value="">Loading...</option>
            ) : (
              expiries.map(e => <option key={e} value={e}>{e}</option>)
            )}
          </select>
        </label>
        <label>
          Min Volume:
          <input type="number" value={minVolume} onChange={e => setMinVolume(Number(e.target.value))} className="options-chain-input" />
        </label>
        <label>
          Sort By:
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="options-chain-select">
            <option value="prob">Probability of Profit</option>
            <option value="volume">Volume</option>
            <option value="iv">Implied Volatility</option>
            <option value="riskreward">Risk/Reward</option>
          </select>
        </label>
      </div>
      {loading ? (
        <div className="options-chain-loading">Loading options...</div>
      ) : (
        <>
        <table className="options-chain-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Type</th>
              <th>Strike</th>
              <th>Expiry</th>
              <th>Bid</th>
              <th>Ask</th>
              <th>Last</th>
              <th>Volume</th>
              <th>OI</th>
              <th>IV</th>
              <th>Delta</th>
              <th>Gamma</th>
              <th>Theta</th>
              <th>Vega</th>
              <th>Intrinsic</th>
              <th>Time Value</th>
              <th>Prob. of Profit</th>
              <th>Risk/Reward</th>
            </tr>
          </thead>
          <tbody>
            {filteredOptions.map(opt => (
              <tr key={opt.ticker}>
                <td>{opt.ticker}</td>
                <td>{opt.type}</td>
                <td>{opt.strike}</td>
                <td>{opt.expiry}</td>
                <td>{opt.bid}</td>
                <td>{opt.ask}</td>
                <td>{opt.last}</td>
                <td>{opt.volume}</td>
                <td>{opt.open_interest}</td>
                <td>{opt.implied_volatility}</td>
                <td>{opt.delta}</td>
                <td>{opt.gamma}</td>
                <td>{opt.theta}</td>
                <td>{opt.vega}</td>
                <td>{opt.intrinsic_value}</td>
                <td>{opt.time_value}</td>
                <td className="options-chain-profit">
                  {opt.probability_of_profit ? `${opt.probability_of_profit}%` : '--'}
                </td>
                <td>
                  {opt.intrinsic_value && opt.ask
                    ? (opt.intrinsic_value / opt.ask).toFixed(2)
                    : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="options-chain-arbitrage-title">Arbitrage Opportunities</h3>
        <table className="options-chain-arbitrage-table">
          <thead>
            <tr>
              <th>Strike</th>
              <th>Expiry</th>
              <th>Call Price</th>
              <th>Put Price</th>
              <th>Parity</th>
            </tr>
          </thead>
          <tbody>
            {arbitrageRows.map(row => (
              <tr key={row.strike + row.expiry} className={Math.abs(row.parity) > 1 ? "options-chain-arbitrage-highlight" : undefined}>
                <td>{row.strike}</td>
                <td>{row.expiry}</td>
                <td>{row.callPrice}</td>
                <td>{row.putPrice}</td>
                <td>{row.parity.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {arbitrageRows.length === 0 && (
          <div className="options-chain-no-arbitrage">
            No clear arbitrage opportunities found for selected expiry.
          </div>
        )}
        </>
      )}
      <p className="options-chain-description">
        This table shows SPY options contracts (ATM, 10 above, 10 below) with greeks, risk/reward, and highlights arbitrage opportunities. Use filters and sorting to find the best trades!
      </p>
    </div>
  )
}