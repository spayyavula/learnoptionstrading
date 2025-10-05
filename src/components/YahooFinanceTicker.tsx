import React, { useEffect, useRef } from 'react'

interface YahooFinanceTickerProps {
  symbols: string[]
  width?: string | number
  height?: string | number
  darkMode?: boolean
  container_id?: string
}

const YahooFinanceTicker: React.FC<YahooFinanceTickerProps> = ({
  symbols,
  width = '100%',
  height = 60,
  darkMode = false,
  container_id
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
      // Create ticker container
      const tickerContainer = document.createElement('div')
      tickerContainer.className = 'yahoo-finance-ticker'
      tickerContainer.style.display = 'flex'
      tickerContainer.style.overflowX = 'auto'
      tickerContainer.style.padding = '10px 0'
      tickerContainer.style.backgroundColor = darkMode ? '#1a1a1a' : '#f8f9fa'
      tickerContainer.style.borderRadius = '0.5rem'
      
      // Add symbols
      symbols.forEach(symbol => {
        const symbolElement = document.createElement('a')
        symbolElement.href = `https://finance.yahoo.com/quote/${symbol}`
        symbolElement.target = '_blank'
        symbolElement.rel = 'noopener noreferrer'
        symbolElement.className = 'yahoo-finance-ticker-symbol'
        symbolElement.style.display = 'inline-flex'
        symbolElement.style.flexDirection = 'column'
        symbolElement.style.alignItems = 'center'
        symbolElement.style.justifyContent = 'center'
        symbolElement.style.padding = '0 15px'
        symbolElement.style.minWidth = '120px'
        symbolElement.style.textDecoration = 'none'
        symbolElement.style.color = darkMode ? '#e0e0e0' : '#333'
        
        // Symbol name
        const symbolName = document.createElement('div')
        symbolName.textContent = symbol
        symbolName.style.fontWeight = 'bold'
        symbolName.style.fontSize = '14px'
        symbolName.style.marginBottom = '5px'
        
        // Create placeholder for price and change (will be filled with mock data)
        const priceElement = document.createElement('div')
        priceElement.id = `${symbol}-price`
        priceElement.textContent = 'Loading...'
        priceElement.style.fontSize = '13px'
        
        const changeElement = document.createElement('div')
        changeElement.id = `${symbol}-change`
        changeElement.textContent = ''
        changeElement.style.fontSize = '12px'
        
        symbolElement.appendChild(symbolName)
        symbolElement.appendChild(priceElement)
        symbolElement.appendChild(changeElement)
        tickerContainer.appendChild(symbolElement)
      })
      
      containerRef.current.appendChild(tickerContainer)
      
      // For demo purposes, update with mock data
      setTimeout(() => {
        symbols.forEach(symbol => {
          const priceElement = document.getElementById(`${symbol}-price`)
          const changeElement = document.getElementById(`${symbol}-change`)
          
          if (priceElement && changeElement) {
            const mockPrice = Math.floor(Math.random() * 1000) + 100
            const mockChange = (Math.random() * 10) - 5
            const mockChangePercent = (mockChange / mockPrice) * 100
            
            priceElement.textContent = `$${mockPrice.toFixed(2)}`
            changeElement.textContent = `${mockChange >= 0 ? '+' : ''}${mockChange.toFixed(2)} (${mockChange >= 0 ? '+' : ''}${mockChangePercent.toFixed(2)}%)`
            changeElement.style.color = mockChange >= 0 ? '#22c55e' : '#ef4444'
          }
        })
      }, 1000)
    } catch (error) {
      console.error('Error initializing Yahoo Finance ticker:', error)
      
      // Show error message
      if (containerRef.current) {
        containerRef.current.innerHTML = '<div style="text-align: center; padding: 10px; color: #888;">Failed to load ticker</div>'
      }
    }
    
    return cleanup
  }, [symbols, width, height, darkMode])

  const containerId = container_id || `yahoo-finance-ticker-${Math.random().toString(36).substring(2, 11)}`

  return (
    <div 
      ref={containerRef}
      id={containerId}
      className="yahoo-finance-ticker-container"
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width, 
        height: typeof height === 'number' ? `${height}px` : height
      }}
    />
  )
}

export default YahooFinanceTicker