import React, { useEffect, useState, useMemo } from 'react'
import '../components/OptionChain.css'

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

export default function OptionsChain() {
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [expiry, setExpiry] = useState<string>('') // ISO date string
  const [expiries, setExpiries] = useState<string[]>([])
  const [underlyingPrice, setUnderlyingPrice] = useState<number | null>(null)
  const [strikeRange, setStrikeRange] = useState<[number, number]>([0, 0])
  const [allStrikes, setAllStrikes] = useState<number[]>([])
  const [strike, setStrike] = useState<number>(600); // Default value
  const [strikeLow, setStrikeLow] = useState<number>(450);
  const [strikeHigh, setStrikeHigh] = useState<number>(750);
  const [view, setView] = useState<'straddle' | 'list'>('straddle');

  // Fetch SPY options contracts
  useEffect(() => {
    setLoading(true);
    let allContracts: any[] = [];
    let url = `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=SPY&apiKey=${import.meta.env.VITE_POLYGON_API_KEY}`;

    const fetchAllPages = async () => {
      while (url) {
        const res = await fetch(url);
        const data = await res.json();
        allContracts = allContracts.concat(data.results || []);
        url = data.next_url ? `${data.next_url}&apiKey=${import.meta.env.VITE_POLYGON_API_KEY}` : null;
      }
      return allContracts;
    };

    const fetchSnapshots = async () => {
      const res = await fetch(`https://api.polygon.io/v3/snapshot/options/SPY?apiKey=${import.meta.env.VITE_POLYGON_API_KEY}`);
      const data = await res.json();
      return data.results || [];
    };

    const loadData = async () => {
      try {
        // 1. Fetch contracts
        const contractsRaw = await fetchAllPages();

        // 2. Fetch live snapshot data
        const snapshotsRaw = await fetchSnapshots();

        // 3. Build a map for fast lookup
        const snapshotMap = new Map<string, any>();
        snapshotsRaw.forEach((snap: any) => {
          snapshotMap.set(snap.details.ticker, snap);
        });

        // 4. Merge contract and snapshot data
        const contracts = contractsRaw.map((opt: any) => {
          const snap = snapshotMap.get(opt.ticker);
          return {
            ticker: opt.ticker,
            type: opt.contract_type,
            strike: opt.strike_price,
            expiry: opt.expiration_date,
            bid: snap?.last_quote?.bid ?? null,
            ask: snap?.last_quote?.ask ?? null,
            last: snap?.last_trade?.price ?? null,
            volume: snap?.day?.volume ?? null,
            open_interest: snap?.open_interest ?? null,
            implied_volatility: snap?.greeks?.iv ?? null,
            delta: snap?.greeks?.delta ?? null,
            gamma: snap?.greeks?.gamma ?? null,
            theta: snap?.greeks?.theta ?? null,
            vega: snap?.greeks?.vega ?? null,
            intrinsic_value: snap?.greeks?.intrinsic_value ?? null,
            time_value: snap?.greeks?.time_value ?? null,
            probability_of_profit: snap?.greeks?.delta ? Math.round(Math.abs(snap.greeks.delta) * 100) : undefined
          };
        });

        // 5. Aggregate unique expiries (next 3 months)
        const allExpiries = Array.from(new Set(contracts.map(c => c.expiry)));
        const today = new Date();
        const threeMonthsLater = new Date(today);
        threeMonthsLater.setMonth(today.getMonth() + 3);

        const filteredExpiries = allExpiries
          .filter(dateStr => {
            const date = new Date(dateStr);
            return date >= today && date <= threeMonthsLater;
          })
          .sort();

        setExpiries(filteredExpiries as string[]);
        setExpiry(typeof filteredExpiries[0] === 'string' ? filteredExpiries[0] : '');
        setOptions(contracts);
        setLoading(false);
      } catch (err) {
        console.error('Polygon fetch error:', err);
        setLoading(false);
      }
    };

    loadData();
  }, [])

  // Fetch underlying price for SPY
  useEffect(() => {
    fetch(`https://api.polygon.io/v2/aggs/ticker/SPY/prev?adjusted=true&apiKey=${import.meta.env.VITE_POLYGON_API_KEY}`)
      .then(res => res.json())
      .then(data => {
        setUnderlyingPrice(data.results?.[0]?.c ?? null)
      })
      .catch(() => setUnderlyingPrice(null))
  }, [])

  // Update strike range and all strikes when expiry or options change
  useEffect(() => {
    const filtered = options.filter(opt => opt.expiry === expiry)
    const strikes = Array.from(new Set(filtered.map(opt => opt.strike))).sort((a, b) => a - b)
    setAllStrikes(strikes)
    if (strikes.length > 0) {
      // Default range: ATM ± 10 strikes
      if (underlyingPrice) {
        const atmIndex = strikes.findIndex(strike => strike >= underlyingPrice)
        const start = Math.max(atmIndex - 10, 0)
        const end = Math.min(atmIndex + 10, strikes.length - 1)
        setStrikeRange([strikes[start], strikes[end]])
      } else {
        setStrikeRange([strikes[0], strikes[strikes.length - 1]])
      }
    }
  }, [options, expiry, underlyingPrice])

  // Filter options for selected expiry and strike range
  const filteredOptions = useMemo(() => {
    return options.filter(opt =>
      opt.expiry === expiry &&
      opt.strike >= strikeLow &&
      opt.strike <= strikeHigh
    );
  }, [options, expiry, strikeLow, strikeHigh]);

  // Handle strike range change
  const handleStrikeRangeChange = (min: number, max: number) => {
    setStrikeRange([min, max])
  }

  // Sample contracts data
  useEffect(() => {
    const contracts = [
      { ticker: 'SPY240726C00580000', type: 'call', strike: 580, expiry: '2024-07-26', bid: 1.2, ask: 1.5, last: 1.3, volume: 100, open_interest: 200, implied_volatility: 0.25, delta: 0.5 },
      { ticker: 'SPY240802C00580000', type: 'call', strike: 580, expiry: '2024-08-02', bid: 1.8, ask: 2.0, last: 1.9, volume: 120, open_interest: 210, implied_volatility: 0.28, delta: 0.52 },
      // Add more contracts with different expiries
    ];
    setOptions(contracts);
    const allExpiries = Array.from(new Set(contracts.map(c => c.expiry)));
    setExpiries(allExpiries as string[]);
    setExpiry(typeof allExpiries[0] === 'string' ? allExpiries[0] : '');
    setLoading(false);
  }, []);

  // WebSocket for real-time options data
  useEffect(() => {
    const ws = new WebSocket('wss://socket.polygon.io/options');

    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'auth', params: import.meta.env.VITE_POLYGON_API_KEY }));
      ws.send(JSON.stringify({ action: 'subscribe', params: 'Q.*' })); // Subscribe to all option quotes
    };

    ws.onmessage = (event) => {
      const messages = JSON.parse(event.data);
      // Example: handle quote updates
      messages.forEach(msg => {
        if (msg.ev === 'Q') {
          // msg contains quote data for an option contract
          // Update your state here (merge with existing options)
        }
      });
    };

    ws.onerror = (err) => {
      console.error('Polygon WebSocket error:', err);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: '1rem', background: '#f9f9f9', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2rem' }}>SPY Options Chain</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        <label>
          Expiry:
          <select
            value={expiry}
            onChange={e => setExpiry(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {expiries.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>Strike Range:</label>
          <input
            type="range"
            min={450}
            max={750}
            value={strikeLow}
            onChange={e => {
              const val = Number(e.target.value);
              setStrikeLow(val > strikeHigh ? strikeHigh : val);
            }}
            className="strike-range-input"
            title="Select minimum strike"
            placeholder="Min strike"
          />
          <input
            type="range"
            min={450}
            max={750}
            value={strikeHigh}
            onChange={e => {
              const val = Number(e.target.value);
              setStrikeHigh(val < strikeLow ? strikeLow : val);
            }}
            className="strike-range-input"
            title="Select maximum strike"
            placeholder="Max strike"
            style={{ width: 120 }}
          />
          <span>{strikeHigh}</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setView(view === 'straddle' ? 'list' : 'straddle')}
            style={{
              padding: '6px 18px',
              borderRadius: 4,
              border: 'none',
              background: '#0074d9',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {view === 'straddle' ? 'Switch to List View' : 'Switch to Straddle View'}
          </button>
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading options...</div>
      ) : (
        <>
          {view === 'straddle' ? (
            // Straddle View: Calls and Puts side-by-side for each strike
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: '1rem' }}>
              <thead>
                <tr>
                  <th>Call Bid</th>
                  <th>Call Ask</th>
                  <th>Call Last</th>
                  <th>Call IV</th>
                  <th>Call Delta</th>
                  <th>Strike</th>
                  <th>Put Bid</th>
                  <th>Put Ask</th>
                  <th>Put Last</th>
                  <th>Put IV</th>
                  <th>Put Delta</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(filteredOptions.map(opt => opt.strike)))
                  .sort((a, b) => a - b)
                  .map(strike => {
                    const call = filteredOptions.find(opt => opt.strike === strike && opt.type === 'call');
                    const put = filteredOptions.find(opt => opt.strike === strike && opt.type === 'put');
                    if (!call && !put) return null;
                    return (
                      <tr key={strike}>
                        <td>{call?.bid ?? '-'}</td>
                        <td>{call?.ask ?? '-'}</td>
                        <td>{call?.last ?? '-'}</td>
                        <td>{call?.implied_volatility ?? '-'}</td>
                        <td>{call?.delta ?? '-'}</td>
                        <td style={{ fontWeight: 'bold', background: '#e9ecef', textAlign: 'center' }}>{strike}</td>
                        <td>{put?.bid ?? '-'}</td>
                        <td>{put?.ask ?? '-'}</td>
                        <td>{put?.last ?? '-'}</td>
                        <td>{put?.implied_volatility ?? '-'}</td>
                        <td>{put?.delta ?? '-'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            // List View: Each contract as a row
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: '1rem' }}>
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
                    <td>{opt.delta !== null ? opt.delta : '--'}</td>
                    <td>{opt.gamma}</td>
                    <td>{opt.theta}</td>
                    <td>{opt.vega}</td>
                    <td>{opt.intrinsic_value}</td>
                    <td>{opt.time_value}</td>
                    <td style={{ fontWeight: 'bold', color: '#2563eb' }}>
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
          )}
        </>
      )}
    </div>
  )
}