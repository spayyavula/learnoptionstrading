import React, { useEffect, useRef } from 'react'

interface TradingViewDirectTickerProps {
  symbols: string[]
  width?: string | number
  height?: number
  darkMode?: boolean
}

const TradingViewDirectTicker: React.FC<TradingViewDirectTickerProps> = ({
  symbols,
  width = '100%',
  height = 60,
  darkMode = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const indicesTickerRef = useRef<HTMLDivElement>(null);
  const stocksTickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up function
    const cleanup = () => {
      if (containerRef.current && containerRef.current.innerHTML) {
        containerRef.current.innerHTML = ''
      }
    }
    
    // Clean up first
    cleanup()
    
    if (!containerRef.current) return
    
    try {
      // Clear any existing content first
      containerRef.current.innerHTML = '';
      
      // Create ticker container
      const tickerContainer = document.createElement('div')
      tickerContainer.className = 'tradingview-ticker'
      tickerContainer.style.display = 'flex' 
      tickerContainer.style.overflowX = 'auto'
      tickerContainer.style.padding = '15px 0'
      tickerContainer.style.backgroundColor = darkMode ? '#1a1a1a' : '#f1f5f9'
      tickerContainer.style.borderRadius = '0.5rem'
      tickerContainer.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
      
      // Add symbols
      symbols.forEach(symbol => {
        const symbolElement = document.createElement('a')
        symbolElement.href = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`
        symbolElement.target = '_blank'
        symbolElement.rel = 'noopener noreferrer'
        symbolElement.className = 'tradingview-ticker-symbol'
        symbolElement.style.display = 'inline-flex'
        symbolElement.style.flexDirection = 'column'
        symbolElement.style.alignItems = 'center'
        symbolElement.style.justifyContent = 'center'
        symbolElement.style.padding = '10px 20px'
        symbolElement.style.minWidth = '140px'
        symbolElement.style.textDecoration = 'none'
        symbolElement.style.color = darkMode ? '#e0e0e0' : '#333'
        
        // Symbol name
        const symbolName = document.createElement('div')
        symbolName.textContent = symbol
        symbolName.style.fontWeight = '800'
        symbolName.style.backgroundColor = darkMode ? '#2a2a2a' : '#e2e8f0'
        symbolName.style.padding = '3px 10px'
        symbolName.style.fontSize = '16px'
        symbolName.style.borderRadius = '4px'
        symbolName.style.marginBottom = '5px'
        
        // Create placeholder for price and change (will be filled with mock data)
        const priceElement = document.createElement('div')
        priceElement.id = `${symbol}-price`
        priceElement.textContent = 'Loading...'
        priceElement.style.fontSize = '18px'
        priceElement.style.fontWeight = '700'
        
        const changeElement = document.createElement('div')
        changeElement.id = `${symbol}-change`
        changeElement.textContent = ''
        changeElement.style.fontWeight = '600'
        changeElement.style.fontSize = '14px'
        changeElement.style.marginTop = '3px'
        
        symbolElement.appendChild(symbolName)
        symbolElement.appendChild(priceElement)
        symbolElement.appendChild(changeElement)
        tickerContainer.appendChild(symbolElement)
      })
      
      containerRef.current.appendChild(tickerContainer)
      
      // For demo purposes, update with mock data
      setTimeout(() => {
        if (!containerRef.current) return; // Check if component is still mounted
        
        symbols.forEach((symbol) => {
          const priceElement = document.getElementById(`${symbol}-price`)
          const changeElement = document.getElementById(`${symbol}-change`)
          
          if (priceElement && changeElement) {
            const mockPrice = Math.floor(Math.random() * 1000) + 100
            const mockChange = (Math.random() * 10) - 5
            const mockChangePercent = (mockChange / mockPrice) * 100

            priceElement.textContent = `$${mockPrice.toFixed(2)}`
            changeElement.textContent = `${mockChange >= 0 ? '+' : ''}${mockChange.toFixed(2)} (${mockChange >= 0 ? '+' : ''}${mockChangePercent.toFixed(2)}%)`
            changeElement.style.color = mockChange >= 0 ? '#22c55e' : '#ef4444'
            changeElement.style.padding = '3px 8px'
            changeElement.style.borderRadius = '4px'
            changeElement.style.backgroundColor = mockChange >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
          }
        })
      }, 1000); // 1 second delay for mock data update
    } catch (error) {
      console.error('Error initializing TradingView ticker:', error)
      
      // Show error message
      if (containerRef.current) {
        containerRef.current.innerHTML = '<div style="text-align: center; padding: 10px; color: #888;">Failed to load ticker</div>'
      }
    }
    
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
    
    return cleanup
  }, [symbols, width, height, darkMode]); // Dependencies array

  return (
    <div 
      ref={containerRef}
      className="tradingview-ticker-container"
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height, 
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}
    />
  )
}

export default TradingViewDirectTicker