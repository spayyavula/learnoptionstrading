import React, { useState } from 'react';
import './OptionChain.css';

type Option = {
  symbol: string;
  expiry: string;
  strike: number;
  type: 'call' | 'put';
  bid?: number;
  ask?: number;
  last?: number;
  change?: number;
  volume?: number;
  openInterest?: number;
  iv?: number;
  inTheMoney?: boolean;
  exchange?: string;
  lastTradeDate?: string;
};

type OptionChainProps = {
  optionsData: Option[];
};

const OptionChain: React.FC<OptionChainProps> = ({ optionsData }) => {
  // Group options by expiry
  const groupedByExpiry = optionsData.reduce((acc, option) => {
    acc[option.expiry] = acc[option.expiry] || [];
    acc[option.expiry].push(option);
    return acc;
  }, {} as Record<string, Option[]>);

  const expiries = Object.keys(groupedByExpiry).sort();
  const [selectedExpiry, setSelectedExpiry] = useState(expiries[0] ?? '');

  // Get unique strikes for selected expiry
  const options = groupedByExpiry[selectedExpiry] ?? [];
  const strikes = [
    ...new Set(options.map(option => option.strike))
  ].sort((a, b) => a - b);

  return (
    <div className="option-chain-container">
      {/* Mobile scroll hint */}
      <div className="block lg:hidden bg-blue-50 border border-blue-200 rounded p-2 mb-2 text-xs text-blue-700">
        <span className="font-semibold">💡 Tip:</span> Scroll horizontally to see all option data
      </div>

      {/* Expiry strip */}
      <div className="expiry-strip">
        {expiries.map(expiry => (
          <button
            key={expiry}
            className={`expiry-btn${expiry === selectedExpiry ? ' active' : ''}`}
            onClick={() => setSelectedExpiry(expiry)}
          >
            {expiry}
          </button>
        ))}
      </div>

      {/* Option chain for selected expiry */}
      <div className="option-expiry-group">
        <h3>Expiry: {selectedExpiry}</h3>
        <div className="option-chain-scroll-wrapper">
        <table className="option-chain-table">
          <thead>
            <tr>
              <th>Call Symbol</th>
              <th>Call Exchange</th>
              <th>Call Bid</th>
              <th>Call Ask</th>
              <th>Call Last</th>
              <th>Call Change</th>
              <th>Call Vol</th>
              <th>Call IV</th>
              <th>Call OI</th>
              <th>Call Last Trade</th>
              <th>Strike</th>
              <th>Put Symbol</th>
              <th>Put Exchange</th>
              <th>Put Bid</th>
              <th>Put Ask</th>
              <th>Put Last</th>
              <th>Put Change</th>
              <th>Put Vol</th>
              <th>Put IV</th>
              <th>Put OI</th>
              <th>Put Last Trade</th>
            </tr>
          </thead>
          <tbody>
            {strikes.map(strike => {
              const call = options.find(
                o => o.strike === strike && o.type === 'call'
              );
              const put = options.find(
                o => o.strike === strike && o.type === 'put'
              );
              if (!call && !put) return null;
              const callClass = call?.inTheMoney ? 'itm' : 'otm';
              const putClass = put?.inTheMoney ? 'itm' : 'otm';
              return (
                <tr key={strike}>
                  <td className={callClass}>{call?.symbol ?? '-'}</td>
                  <td className={callClass}>{call?.exchange ?? '-'}</td>
                  <td className={callClass}>{call?.bid ?? '-'}</td>
                  <td className={callClass}>{call?.ask ?? '-'}</td>
                  <td className={callClass}>{call?.last ?? '-'}</td>
                  <td className={callClass}>{call?.change ?? '-'}</td>
                  <td className={callClass}>{call?.volume ?? '-'}</td>
                  <td className={callClass}>{call?.iv ?? '-'}</td>
                  <td className={callClass}>{call?.openInterest ?? '-'}</td>
                  <td className={callClass}>{call?.lastTradeDate ?? '-'}</td>
                  <td>{strike}</td>
                  <td className={putClass}>{put?.symbol ?? '-'}</td>
                  <td className={putClass}>{put?.exchange ?? '-'}</td>
                  <td className={putClass}>{put?.bid ?? '-'}</td>
                  <td className={putClass}>{put?.ask ?? '-'}</td>
                  <td className={putClass}>{put?.last ?? '-'}</td>
                  <td className={putClass}>{put?.change ?? '-'}</td>
                  <td className={putClass}>{put?.volume ?? '-'}</td>
                  <td className={putClass}>{put?.iv ?? '-'}</td>
                  <td className={putClass}>{put?.openInterest ?? '-'}</td>
                  <td className={putClass}>{put?.lastTradeDate ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default OptionChain;

// Example usage (remove or replace with your actual data)
const mockOptionsData: Option[] = [
  { symbol: 'SPY240726C00580000', expiry: '2024-07-26', strike: 580, type: "call", bid: 1.2, ask: 1.5, last: 1.3, change: 0.1, volume: 100, openInterest: 200, iv: 0.25, inTheMoney: false, exchange: 'CBOE', lastTradeDate: '2024-07-23' },
  { symbol: 'SPY240726P00580000', expiry: '2024-07-26', strike: 580, type: "put", bid: 2.2, ask: 2.5, last: 2.3, change: -0.1, volume: 80, openInterest: 150, iv: 0.27, inTheMoney: true, exchange: 'CBOE', lastTradeDate: '2024-07-23' },
  { symbol: 'SPY240802C00580000', expiry: '2024-08-02', strike: 580, type: "call", bid: 1.8, ask: 2.0, last: 1.9, change: 0.2, volume: 120, openInterest: 210, iv: 0.28, inTheMoney: false, exchange: 'CBOE', lastTradeDate: '2024-07-23' },
  { symbol: 'SPY240802P00580000', expiry: '2024-08-02', strike: 580, type: "put", bid: 2.8, ask: 3.0, last: 2.9, change: -0.2, volume: 90, openInterest: 160, iv: 0.29, inTheMoney: true, exchange: 'CBOE', lastTradeDate: '2024-07-23' },
];

<OptionChain optionsData={mockOptionsData} />