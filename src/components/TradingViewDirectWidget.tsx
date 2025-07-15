import React, { useEffect, useRef } from 'react'

interface TradingViewDirectWidgetProps { 
  symbol: string
  width?: string | number
  height?: number
  interval?: string
  theme?: 'light' | 'dark'
  showToolbar?: boolean
  showDrawings?: boolean
  showIndicators?: boolean
}

const TradingViewDirectWidget: React.FC<TradingViewDirectWidgetProps> = ({
  symbol,
  width = '100%',
  height = 500,
  interval = 'D',
  theme = 'light',
  showToolbar = true,
  showDrawings = true,
  showIndicators = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Clean up function
    const cleanup = () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
    
    // Clean up first
    cleanup()
    
    if (!containerRef.current) return
    
    try {
      // Create direct link container
      const linkContainer = document.createElement('div')
      linkContainer.className = 'tradingview-link-container'
      linkContainer.style.width = '100%' 
      linkContainer.style.height = '100%'
      linkContainer.style.display = 'flex'
      linkContainer.style.flexDirection = 'column' 
      linkContainer.style.alignItems = 'center'
      linkContainer.style.justifyContent = 'center'
      linkContainer.style.backgroundColor = theme === 'dark' ? '#1a1a1a' : '#f8f9fa'
      linkContainer.style.borderRadius = '0.5rem'
      linkContainer.style.padding = '2rem'
      linkContainer.style.textAlign = 'center'
      
      // Create chart placeholder
      const chartPlaceholder = document.createElement('div')
      chartPlaceholder.style.width = '100%'
      chartPlaceholder.style.height = '70%' 
      chartPlaceholder.style.backgroundColor = theme === 'dark' ? '#2a2a2a' : '#f1f5f9'
      chartPlaceholder.style.borderRadius = '0.5rem'
      chartPlaceholder.style.marginBottom = '1.5rem'
      chartPlaceholder.style.display = 'flex'
      chartPlaceholder.style.alignItems = 'center'
      chartPlaceholder.style.justifyContent = 'center'
      
      // Add chart icon
      const chartIcon = document.createElement('div')
      chartIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${theme === 'dark' ? '#e0e0e0' : '#6c757d'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      `
      
      chartPlaceholder.appendChild(chartIcon)
      
      // Create message
      const message = document.createElement('div')
      message.style.marginBottom = '1rem'
      message.style.fontSize = '18px' 
      message.style.fontWeight = '500'
      message.style.color = theme === 'dark' ? '#e0e0e0' : '#343a40'
      message.textContent = `View ${symbol} Chart on TradingView`
      
      // Create description
      const description = document.createElement('div')
      description.style.marginBottom = '1.5rem'
      description.style.fontSize = '14px' 
      description.style.color = theme === 'dark' ? '#adb5bd' : '#6c757d'
      description.textContent = 'Click the button below to access advanced charting tools with TradingView (free account available)'
      
      // Format symbol to ensure it has exchange prefix if needed
      const formattedSymbol = symbol.includes(':') ? symbol : 
        symbol === 'SPY' ? 'AMEX:SPY' : 
        symbol === 'QQQ' ? 'NASDAQ:QQQ' :
        symbol === 'AAPL' ? 'NASDAQ:AAPL' :
        symbol === 'MSFT' ? 'NASDAQ:MSFT' :
        symbol === 'GOOGL' ? 'NASDAQ:GOOGL' :
        symbol === 'AMZN' ? 'NASDAQ:AMZN' :
        symbol === 'TSLA' ? 'NASDAQ:TSLA' :
        symbol === 'NVDA' ? 'NASDAQ:NVDA' :
        `NASDAQ:${symbol}` 
      
      // Construct the URL with parameters
      const baseUrl = 'https://www.tradingview.com/chart'
      const params = new URLSearchParams()
      params.append('symbol', formattedSymbol)
      
      // Add interval parameter if it's not the default
      if (interval !== 'D') {
        params.append('interval', interval)
      }
      
      // Add theme parameter if it's dark
      if (theme === 'dark') {
        params.append('theme', 'dark')
      }
      
      // Create link button
      const linkButton = document.createElement('a')
      linkButton.href = `${baseUrl}/?${params.toString()}`
      linkButton.target = '_blank' 
      linkButton.rel = 'noopener noreferrer'
      linkButton.style.display = 'inline-flex'
      linkButton.style.alignItems = 'center'
      linkButton.style.justifyContent = 'center'
      linkButton.style.padding = '0.75rem 1.5rem'
      linkButton.style.backgroundColor = '#2962FF'
      linkButton.style.color = 'white'
      linkButton.style.borderRadius = '0.375rem'
      linkButton.style.fontWeight = '500'
      linkButton.style.textDecoration = 'none'
      linkButton.style.transition = 'background-color 150ms'
      linkButton.textContent = 'Open Advanced Chart' 
      
      // Add hover effect
      linkButton.onmouseover = () => {
        linkButton.style.backgroundColor = '#1E53E5'
      }
      linkButton.onmouseout = () => {
        linkButton.style.backgroundColor = '#2962FF'
      }
      
      // Create credentials info
      const credentialsInfo = document.createElement('div')
      credentialsInfo.style.marginTop = '1rem'
      credentialsInfo.style.fontSize = '12px' 
      credentialsInfo.style.color = theme === 'dark' ? '#adb5bd' : '#6c757d'
      credentialsInfo.textContent = 'Use your own TradingView account credentials to log in'
      
      // Assemble the container
      linkContainer.appendChild(chartPlaceholder)
      linkContainer.appendChild(message)
      linkContainer.appendChild(description)
      linkContainer.appendChild(linkButton)
      linkContainer.appendChild(credentialsInfo)
      
      containerRef.current.appendChild(linkContainer)
    } catch (error) { 
      console.error('Error initializing TradingView widget:', error)
      
      // Show error message
      if (containerRef.current) {
        containerRef.current.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888;">Failed to load TradingView widget</div>'
      }
    }
    
    return cleanup
  }, [symbol, width, height, interval, theme, showToolbar, showDrawings, showIndicators])

  return (
    <div 
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width, 
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    />
  )
}

export default TradingViewDirectWidget