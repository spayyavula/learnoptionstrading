import React, { useState, useEffect, useRef } from 'react'
import { Check, X, ChevronDown, Info, TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react'

interface PredictionMarket {
  ticker: string
  title: string
  category: string
  yes_price: number
  no_price: number
  volume: number
  open_interest: number
  end_date: string
  status: string
}

interface SwipeTradingInterfaceProps {
  markets: PredictionMarket[]
  accountBalance?: number
  onSwipeTrade: (market: PredictionMarket, side: 'yes' | 'no', amount: number) => void
  onSkip: (market: PredictionMarket) => void
  onViewDetails?: (market: PredictionMarket) => void
}

export const SwipeTradingInterface: React.FC<SwipeTradingInterfaceProps> = ({
  markets,
  accountBalance = 1000,
  onSwipeTrade,
  onSkip,
  onViewDetails
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeAmount, setSwipeAmount] = useState(25)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showAmountPicker, setShowAmountPicker] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<'yes' | 'no' | 'skip' | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const startTime = useRef(0)

  const currentMarket = markets[currentIndex]
  const hasMoreCards = currentIndex < markets.length - 1

  // Reset state when market changes
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 })
    setSwipeDirection(null)
  }, [currentIndex])

  // Calculate swipe direction and intensity
  const calculateSwipeDirection = (x: number, y: number) => {
    const threshold = 50

    if (Math.abs(y) > threshold && Math.abs(y) > Math.abs(x)) {
      return 'skip'
    } else if (x > threshold) {
      return 'yes'
    } else if (x < -threshold) {
      return 'no'
    }
    return null
  }

  // Calculate rotation based on swipe
  const getRotation = () => {
    const maxRotation = 15
    const normalized = dragOffset.x / 100
    return Math.min(Math.max(normalized * maxRotation, -maxRotation), maxRotation)
  }

  // Calculate opacity for overlays
  const getOverlayOpacity = (direction: 'yes' | 'no' | 'skip') => {
    if (swipeDirection !== direction) return 0

    if (direction === 'skip') {
      return Math.min(Math.abs(dragOffset.y) / 150, 1)
    }
    return Math.min(Math.abs(dragOffset.x) / 150, 1)
  }

  // Handle touch/mouse start
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    startPos.current = { x: clientX, y: clientY }
    startTime.current = Date.now()

    // Long press to show amount picker
    const timer = setTimeout(() => {
      setShowAmountPicker(true)
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
    setLongPressTimer(timer)
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return

    const deltaX = clientX - startPos.current.x
    const deltaY = clientY - startPos.current.y

    setDragOffset({ x: deltaX, y: deltaY })
    setSwipeDirection(calculateSwipeDirection(deltaX, deltaY))

    // Cancel long press if moved too much
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
    }
  }

  const handleEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }

    setIsDragging(false)

    const swipeThreshold = 120
    const direction = calculateSwipeDirection(dragOffset.x, dragOffset.y)

    // Check if swipe was strong enough
    const swipeDistance = direction === 'skip'
      ? Math.abs(dragOffset.y)
      : Math.abs(dragOffset.x)

    if (swipeDistance > swipeThreshold && direction) {
      handleSwipe(direction)
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 })
      setSwipeDirection(null)
    }
  }

  const handleSwipe = (direction: 'yes' | 'no' | 'skip') => {
    if (!currentMarket) return

    // Animate card flying off screen
    const flyDistance = direction === 'skip' ? 1000 : 800
    const flyX = direction === 'yes' ? flyDistance : (direction === 'no' ? -flyDistance : 0)
    const flyY = direction === 'skip' ? flyDistance : 0

    setDragOffset({ x: flyX, y: flyY })

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(direction === 'skip' ? 30 : 50)
    }

    // Execute action after animation
    setTimeout(() => {
      if (direction === 'skip') {
        onSkip(currentMarket)
      } else {
        onSwipeTrade(currentMarket, direction, swipeAmount)
      }

      // Move to next card
      if (hasMoreCards) {
        setCurrentIndex(prev => prev + 1)
      }
    }, 300)
  }

  // Programmatic swipe (from button tap)
  const programmaticSwipe = (direction: 'yes' | 'no' | 'skip') => {
    setSwipeDirection(direction)
    handleSwipe(direction)
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }

  // Tap to view details
  const handleTap = () => {
    const tapDuration = Date.now() - startTime.current
    const moved = Math.abs(dragOffset.x) > 5 || Math.abs(dragOffset.y) > 5

    if (tapDuration < 200 && !moved && onViewDetails) {
      onViewDetails(currentMarket)
    }
  }

  if (!currentMarket) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">All caught up!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You've reviewed all available markets. Check back soon for more!
          </p>
          <button
            onClick={() => setCurrentIndex(0)}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  const yesProb = (currentMarket.yes_price || 0.5) * 100
  const noProb = (currentMarket.no_price || 0.5) * 100

  // Calculate returns
  const yesContracts = Math.floor(swipeAmount / currentMarket.yes_price)
  const noContracts = Math.floor(swipeAmount / currentMarket.no_price)
  const yesWin = yesContracts * (1 - currentMarket.yes_price)
  const noWin = noContracts * (1 - currentMarket.no_price)

  return (
    <div className="relative h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden select-none">
      {/* Header */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Swipe Trading</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentIndex + 1} of {markets.length} markets
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-400">Balance</div>
          <div className="text-lg font-bold dark:text-white">${accountBalance.toFixed(2)}</div>
        </div>
      </div>

      {/* Card Stack - show next 2 cards behind */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        {[2, 1, 0].map((offset) => {
          const index = currentIndex + offset
          if (index >= markets.length) return null

          const market = markets[index]
          const isTopCard = offset === 0
          const scale = 1 - (offset * 0.05)
          const yOffset = offset * -10

          return (
            <div
              key={market.ticker}
              ref={isTopCard ? cardRef : null}
              className="absolute w-full max-w-md"
              style={{
                transform: isTopCard
                  ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${getRotation()}deg)`
                  : `scale(${scale}) translateY(${yOffset}px)`,
                transition: isDragging && isTopCard ? 'none' : 'transform 0.3s ease-out',
                zIndex: 10 - offset,
                opacity: isTopCard ? 1 : 0.5 - (offset * 0.2),
                pointerEvents: isTopCard ? 'auto' : 'none'
              }}
              onTouchStart={isTopCard ? handleTouchStart : undefined}
              onTouchMove={isTopCard ? handleTouchMove : undefined}
              onTouchEnd={isTopCard ? (e) => { handleEnd(); handleTap() } : undefined}
              onMouseDown={isTopCard ? handleMouseDown : undefined}
              onMouseMove={isTopCard ? handleMouseMove : undefined}
              onMouseUp={isTopCard ? (e) => { handleEnd(); handleTap() } : undefined}
              onMouseLeave={isTopCard ? handleEnd : undefined}
            >
              {/* YES Overlay */}
              {isTopCard && (
                <div
                  className="absolute inset-0 bg-green-500 rounded-3xl flex items-center justify-center z-10 pointer-events-none"
                  style={{ opacity: getOverlayOpacity('yes') }}
                >
                  <div className="text-white text-center">
                    <Check className="w-24 h-24 mx-auto mb-2" strokeWidth={3} />
                    <div className="text-3xl font-bold">YES!</div>
                    <div className="text-xl">${swipeAmount} bet</div>
                    <div className="text-lg">Win ${yesWin.toFixed(2)}</div>
                  </div>
                </div>
              )}

              {/* NO Overlay */}
              {isTopCard && (
                <div
                  className="absolute inset-0 bg-red-500 rounded-3xl flex items-center justify-center z-10 pointer-events-none"
                  style={{ opacity: getOverlayOpacity('no') }}
                >
                  <div className="text-white text-center">
                    <X className="w-24 h-24 mx-auto mb-2" strokeWidth={3} />
                    <div className="text-3xl font-bold">NO!</div>
                    <div className="text-xl">${swipeAmount} bet</div>
                    <div className="text-lg">Win ${noWin.toFixed(2)}</div>
                  </div>
                </div>
              )}

              {/* SKIP Overlay */}
              {isTopCard && (
                <div
                  className="absolute inset-0 bg-gray-500 rounded-3xl flex items-center justify-center z-10 pointer-events-none"
                  style={{ opacity: getOverlayOpacity('skip') }}
                >
                  <div className="text-white text-center">
                    <ChevronDown className="w-24 h-24 mx-auto mb-2" strokeWidth={3} />
                    <div className="text-3xl font-bold">SKIP</div>
                  </div>
                </div>
              )}

              {/* Market Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
                {/* Category Badge */}
                <div className="absolute top-4 left-4 z-20">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-sm font-medium rounded-full">
                    {market.category}
                  </span>
                </div>

                {/* Info Button */}
                <button
                  className="absolute top-4 right-4 z-20 w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-lg"
                  onClick={() => onViewDetails?.(market)}
                >
                  <Info className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>

                {/* Main Content */}
                <div className="p-8 pt-16 pb-6">
                  {/* Market Title */}
                  <h2 className="text-2xl font-bold mb-6 dark:text-white leading-tight min-h-[4rem]">
                    {market.title}
                  </h2>

                  {/* Probability Display */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* YES */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border-2 border-green-200 dark:border-green-700">
                      <div className="flex items-center justify-center mb-2">
                        <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">YES</span>
                      </div>
                      <div className="text-4xl font-bold text-center text-green-600 dark:text-green-400">
                        {yesProb.toFixed(0)}%
                      </div>
                      <div className="text-center text-sm text-green-700 dark:text-green-500 mt-1">
                        {yesContracts} contracts
                      </div>
                    </div>

                    {/* NO */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border-2 border-red-200 dark:border-red-700">
                      <div className="flex items-center justify-center mb-2">
                        <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400 mr-2" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-300">NO</span>
                      </div>
                      <div className="text-4xl font-bold text-center text-red-600 dark:text-red-400">
                        {noProb.toFixed(0)}%
                      </div>
                      <div className="text-center text-sm text-red-700 dark:text-red-500 mt-1">
                        {noContracts} contracts
                      </div>
                    </div>
                  </div>

                  {/* Market Stats */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200 dark:border-gray-700 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Volume</div>
                      <div className="font-semibold dark:text-white">
                        {market.volume >= 1000000
                          ? `$${(market.volume / 1000000).toFixed(1)}M`
                          : `$${(market.volume / 1000).toFixed(0)}K`
                        }
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Open Interest</div>
                      <div className="font-semibold dark:text-white">
                        {market.open_interest >= 1000000
                          ? `$${(market.open_interest / 1000000).toFixed(1)}M`
                          : `$${(market.open_interest / 1000).toFixed(0)}K`
                        }
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Closes
                      </div>
                      <div className="font-semibold dark:text-white text-xs">
                        {new Date(market.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Bet Amount Display */}
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Your bet</div>
                        <div className="text-3xl font-bold dark:text-white flex items-center">
                          <DollarSign className="w-7 h-7" />
                          {swipeAmount}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAmountPicker(true)}
                        className="px-4 py-2 bg-white dark:bg-gray-700 rounded-full font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>

                {/* Swipe Instructions */}
                <div className="bg-gray-50 dark:bg-gray-900 px-8 py-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    👈 Swipe left for <span className="font-semibold text-red-600">NO</span> •
                    Swipe right for <span className="font-semibold text-green-600">YES</span> 👉
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    👇 Swipe down to skip • Hold to change amount
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Action Buttons (for desktop/accessibility) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
        <button
          onClick={() => programmaticSwipe('no')}
          className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
        >
          <X className="w-8 h-8 text-white" strokeWidth={3} />
        </button>

        <button
          onClick={() => programmaticSwipe('skip')}
          className="w-14 h-14 bg-gray-400 hover:bg-gray-500 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
        >
          <ChevronDown className="w-6 h-6 text-white" strokeWidth={3} />
        </button>

        <button
          onClick={() => programmaticSwipe('yes')}
          className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
        >
          <Check className="w-8 h-8 text-white" strokeWidth={3} />
        </button>
      </div>

      {/* Amount Picker Modal */}
      {showAmountPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-md p-6 animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold dark:text-white">Bet Amount</h3>
              <button
                onClick={() => setShowAmountPicker(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Preset Amounts */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[10, 25, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => {
                    setSwipeAmount(amount)
                    setShowAmountPicker(false)
                  }}
                  className={`py-4 rounded-xl font-bold text-lg transition-all ${
                    swipeAmount === amount
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Custom Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={swipeAmount}
                  onChange={(e) => setSwipeAmount(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                  min="1"
                  max={accountBalance}
                />
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Max: ${accountBalance.toFixed(2)}
              </div>
            </div>

            <button
              onClick={() => setShowAmountPicker(false)}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
