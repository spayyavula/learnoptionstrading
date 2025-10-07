import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Bot, DollarSign, PieChart, Activity, ArrowUpRight, Users, BookOpen, BookMarked, Lightbulb, Calculator } from 'lucide-react'
import { CommunityService } from '../services/communityService' 
import { useTradingContext } from '../context/TradingContext'
import TradingViewDirectWidget from '../components/TradingViewDirectWidget'
import TradingViewWidget from '../components/TradingViewWidget'
import PageViewCounter from './PageViewCounter'
import YahooFinanceTicker from '../components/YahooFinanceTicker'
import TradingViewDirectTicker from '../components/TradingViewDirectTicker'
import { format } from 'date-fns'

// Ticker symbols
const tickerSymbols = [
  'AAPL',
  'GOOGL',
  'MSFT',
  'TSLA',
  'AMZN',
  'SPY', // SPY is on AMEX (NYSE), not NASDAQ
  'QQQ',
  'NVDA'
]

export default function Dashboard() {
  const { state } = useTradingContext()
  const communityStats = CommunityService.getCommunityStats()
  const recentMessages = CommunityService.getRecentMessages().slice(0, 3)

  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    setTermsAccepted(localStorage.getItem('termsAccepted') === 'true')
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
  }

  const topGainers = state.stocks
    .filter(stock => stock.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3)

  const topLosers = state.stocks
    .filter(stock => stock.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3)

  const recentOrders = state.orders
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5)

  const indicesTickerRef = useRef<HTMLDivElement>(null);
  const stocksTickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Indices ticker
    if (indicesTickerRef.current && !indicesTickerRef.current.querySelector('iframe')) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "proName": "INDEX:SPX", "title": "S&P 500" },
          { "proName": "INDEX:IXIC", "title": "NASDAQ" },
          { "proName": "INDEX:DJI", "title": "Dow 30" },
          { "proName": "INDEX:RUT", "title": "Russell 2000" }
        ],
        "colorTheme": "light",
        "isTransparent": true,
        "displayMode": "adaptive",
        "locale": "en"
      });
      indicesTickerRef.current.appendChild(script);
    }
    // Stocks ticker
    if (stocksTickerRef.current && !stocksTickerRef.current.querySelector('iframe')) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "proName": "NASDAQ:AAPL", "title": "Apple" },
          { "proName": "NASDAQ:MSFT", "title": "Microsoft" },
          { "proName": "NASDAQ:TSLA", "title": "Tesla" },
          { "proName": "NASDAQ:NVDA", "title": "Nvidia" },
          { "proName": "NASDAQ:AMZN", "title": "Amazon" },
          { "proName": "NASDAQ:QQQ", "title": "QQQ" },
          { "proName": "AMEX:SPY", "title": "SPY" }
        ],
        "colorTheme": "light",
        "isTransparent": true,
        "displayMode": "adaptive",
        "locale": "en"
      });
      stocksTickerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="space-y-6">
      {termsAccepted && (
        <div className="bg-green-100 border border-green-300 text-green-800 rounded-lg px-4 py-3 mb-4 text-center font-semibold">
          ✅ You have accepted the latest Terms & Conditions.
        </div>
      )}

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* ...cards unchanged... */}
        {/* (keep all your card code here as in your original) */}
      </div>

      {/* Market Ticker */}
      <div className="card shadow-md border-blue-200 mb-6">
        <div className="card-body">
          {/* Live ticker of highly liquid stocks */}
          <div className="w-full my-4">
            <div className="rounded shadow overflow-hidden">
              <div ref={stocksTickerRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className="card shadow-md border-blue-200 mb-6">
        <div className="card-body">
          <TradingViewWidget
            symbol="AMEX:SPY"
            width="100%" 
            height={600}
            interval="D"
            theme="light"
            studies={["RSI", "MACD", "Volume"]}
            style="candles"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Market Movers */}
        <div className="card shadow-md border-blue-200">
          {/* ...market movers code unchanged... */}
        </div>

        {/* Recent Activity */}
        <div className="card shadow-md border-blue-200">
          {/* ...recent orders code unchanged... */}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card shadow-md border-blue-200">
        {/* ...quick actions code unchanged... */}
      </div>
      
      {/* Learning Resources */}
      <div className="card">
        {/* ...learning resources code unchanged... */}
      </div>
      
      {/* Community Preview */}
      {CommunityService.hasConfiguredPlatforms() && (
        <div className="card">
          {/* ...community preview code unchanged... */}
        </div>
      )}
      
      {/* Liquid Option Stocks */}
      <div className="bg-gradient-to-r from-green-100 to-green-200 py-4 px-6 rounded shadow flex items-center">
        <h3
          className="text-2xl font-extrabold text-green-900 mr-6"
          style={{ letterSpacing: '0.02em' }}
          id="liquid-option-stocks-title"
        >
          Liquid Option Stocks
        </h3>
        <div className="flex-1">
          <iframe
            src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_ticker_liquid&symbols=NASDAQ%3AAAPL%2CNASDAQ%3AMSFT%2CNASDAQ%3ATSLA%2CNASDAQ%3ANVDA%2CNASDAQ%3AAMZN%2CNASDAQ%3AQQQ%2CAMEX%3ASPY&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=light&style=1&timezone=Etc/UTC&hideideas=1&hidelegend=1&hidevolume=1&allow_symbol_change=1"
            height="320"
            width="100%"
            style={{ minWidth: 320, border: 0, background: "transparent" }}
            allowFullScreen={false}
            title="Liquid Options Stocks Chart"
            aria-labelledby="liquid-option-stocks-title"
            tabIndex={0}
          />
        </div>
      </div>

      {/* Page View Counter */}
      <PageViewCounter className="mt-6" />
    </div>
  )
}

/* PageViewCounter component moved to its own file: src/pages/PageViewCounter.tsx */