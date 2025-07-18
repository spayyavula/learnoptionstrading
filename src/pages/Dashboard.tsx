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
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-10 w-10 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Total Value</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(state.totalValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Updated {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className={`h-10 w-10 ${state.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Day Change</p>
                <p className={`text-3xl font-bold ${state.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(state.dayChange)}
                </p>
                <p className={`text-sm ${state.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(state.dayChangePercent)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PieChart className="h-10 w-10 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Buying Power</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(state.buyingPower)}</p>
                <p className="text-xs text-gray-500 mt-1">Available for trading</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-10 w-10 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Positions</p>
                <p className="text-3xl font-bold text-gray-900">{state.positions.length}</p>
                <p className="text-xs text-gray-500 mt-1">Active investments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Ticker */}
      <div className="card shadow-md border-blue-200 mb-6">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100 flex justify-between items-center py-4">
          <h3 className="text-xl font-semibold text-gray-900">Market Overview</h3>
          <div className="text-sm text-gray-500">
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="card-body">
          <TradingViewDirectTicker 
            symbols={tickerSymbols.map(s => s === 'SPY' ? 'AMEX:SPY' : s)}
            width="100%" 
            height={160}
            darkMode={false}
          />
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className="card shadow-md border-blue-200 mb-6">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100 flex justify-between items-center py-4">
          <h3 className="text-xl font-semibold text-gray-900">Market Chart</h3>
          <p className="text-sm text-gray-500 mt-1">
            <a href="https://www.tradingview.com/chart/?symbol=AMEX:SPY" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
              <span>Open in TradingView</span>
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </a>
          </p>
        </div>
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
        {/* Market Movers with enhanced styling */}
        <div className="card shadow-md border-blue-200">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Market Movers</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Top Gainers</h4>
                <div className="space-y-3">
                  {topGainers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{stock.symbol}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(stock.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                          {formatPercent(stock.changePercent)}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          +{formatCurrency(stock.change)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Top Losers</h4>
                <div className="space-y-3">
                  {topLosers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{stock.symbol}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(stock.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded-md">
                          {formatPercent(stock.changePercent)}
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          {formatCurrency(stock.change)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card shadow-md border-blue-200">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <Link to="/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
              View all
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="card-body">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order, index) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.type.toUpperCase()} {order.symbol}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.quantity} shares • {format(order.timestamp, 'MMM dd, HH:mm')}
                      </p>
                    </div>
                    <div className="text-right bg-gray-50 px-3 py-1 rounded-md">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'filled' 
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/app/trading" className="btn btn-primary">
              <TrendingUp className="h-4 w-4" />
              Start Trading
            </Link> 
            <Link to="/app/portfolio" className="btn btn-secondary bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-gray-50">
              <PieChart className="h-4 w-4" />
              View Portfolio
            </Link>
            <Link to="/app/learning" className="btn btn-secondary bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-gray-50">
              <BookOpen className="h-4 w-4" />
              Start Learning
            </Link>
            <Link to="/app/chain" className="btn btn-secondary bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-gray-50">
              <Lightbulb className="h-4 w-4" />
              Option Chain
            </Link>
            <Link to="/app/journal" className="btn btn-secondary bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-gray-50">
              <BookMarked className="h-4 w-4" />
              Trading Journal
            </Link>
            <Link to="/app/arbitrage" className="btn btn-secondary bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-gray-50">
              <Calculator className="h-4 w-4" />
              Find Arbitrage
            </Link>
            <Link to="/app/agent" className="btn btn-secondary bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-gray-50">
              <Bot className="h-4 w-4" />
              Agent API
            </Link>
          </div> 
        </div>
      </div>
      
      {/* Learning Resources */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
            Develop Your Trading Expertise
          </h3>
          <Link to="/app/learning" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
            View all
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link to="/app/learning" className="p-4 border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center space-x-3 mb-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <h4 className="font-medium text-blue-900">Master the Fundamentals</h4>
              </div>
              <p className="text-sm text-blue-700">Build a strong foundation in options trading concepts through structured learning.</p>
            </Link>
            
            <Link to="/app/strategies" className="p-4 border border-green-200 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center space-x-3 mb-2">
                <Lightbulb className="h-6 w-6 text-green-600" />
                <h4 className="font-medium text-green-900">Develop Trading Strategies</h4>
              </div>
              <p className="text-sm text-green-700">Learn to create and test strategies for different market conditions.</p>
            </Link> 
            
            <Link to="/app/journal" className="p-4 border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center space-x-3 mb-2">
                <BookMarked className="h-6 w-6 text-purple-600" />
                <h4 className="font-medium text-purple-900">Reflect & Improve</h4>
              </div>
              <p className="text-sm text-purple-700">Document your learning journey and analyze trades to build expertise.</p>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Community Preview */}
      {CommunityService.hasConfiguredPlatforms() && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Community Activity
            </h3>
            <Link to="/app/community" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
              View all
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="card-body bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{communityStats.totalMembers.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{communityStats.activeToday}</div>
                <div className="text-sm text-gray-500">Active Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{communityStats.tradesShared}</div>
                <div className="text-sm text-gray-500">Trades Shared</div>
              </div>
            </div>
            
            {recentMessages.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Recent Messages</h4>
                {recentMessages.map((message) => (
                  <div key={message.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-white rounded-r-lg shadow-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">{message.author}</span>
                      <span className="text-xs text-gray-500">
                        {format(message.timestamp, 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Page View Counter */}
      <div className="card">
        <div className="card-header bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Site Statistics</h3>
        </div>
        <div className="card-body">
          <PageViewCounter />
        </div>
      </div>

      {/* Indices Ticker Tape */}
      <div className="w-full my-4">
        <div className="rounded shadow overflow-hidden">
          <div ref={indicesTickerRef} />
        </div>
      </div>
      {/* Stocks Ticker Tape */}
      <div className="w-full my-4">
        <div className="rounded shadow overflow-hidden">
          <div ref={stocksTickerRef} />
        </div>
      </div>
      {/* (Optional) Large Liquid Option Stocks Chart */}
      <div
        className="w-full mb-8"
        aria-label="Highly Liquid Option Stocks Chart"
        tabIndex={0}
      >
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
      </div>

      {/* Market Overview - Scrolling Ticker Tape */}
      
      </div>
  )
}