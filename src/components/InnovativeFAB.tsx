import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Plus,
  X,
  Calculator,
  PieChart,
  FileText,
  Users,
  Settings,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Database,
  BookOpen,
  Zap,
  Target,
  Lightbulb,
  Activity
} from 'lucide-react'
import { useAuth } from './AuthProvider'

interface FABAction {
  name: string
  href: string
  icon: React.ElementType
  color: string
  category: 'trade' | 'analyze' | 'learn' | 'system'
  adminOnly?: boolean
  contextual?: string[]
}

const fabActions: FABAction[] = [
  { name: 'Strategy Builder', href: '/app/strategy-builder', icon: Calculator, color: 'from-purple-500 to-purple-600', category: 'trade', contextual: ['/app/trading', '/app/portfolio'] },
  { name: 'Option Chain', href: '/app/option-chain', icon: PieChart, color: 'from-blue-500 to-blue-600', category: 'trade', contextual: ['/app/trading', '/app'] },
  { name: 'Orders', href: '/app/orders', icon: FileText, color: 'from-green-500 to-green-600', category: 'trade' },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3, color: 'from-orange-500 to-orange-600', category: 'analyze' },
  { name: 'Regime Analysis', href: '/app/regime', icon: Activity, color: 'from-teal-500 to-teal-600', category: 'analyze' },
  { name: 'Learning', href: '/app/learning', icon: BookOpen, color: 'from-indigo-500 to-indigo-600', category: 'learn' },
  { name: 'Strategies', href: '/app/strategies', icon: Lightbulb, color: 'from-yellow-500 to-yellow-600', category: 'learn' },
  { name: 'Community', href: '/app/community', icon: Users, color: 'from-pink-500 to-pink-600', category: 'system' },
  { name: 'Settings', href: '/app/settings', icon: Settings, color: 'from-gray-500 to-gray-600', category: 'system' },
  { name: 'Admin', href: '/app/admin', icon: ShieldCheck, color: 'from-red-500 to-red-600', category: 'system', adminOnly: true },
]

interface InnovativeFABProps {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

type MenuMode = 'radial' | 'speed-dial' | 'contextual'

const InnovativeFAB: React.FC<InnovativeFABProps> = ({ isOpen, onToggle, className = '' }) => {
  const { user } = useAuth()
  const location = useLocation()
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const [menuMode, setMenuMode] = useState<MenuMode>('speed-dial')
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [isLongPress, setIsLongPress] = useState(false)
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const [recentActions, setRecentActions] = useState<string[]>([])

  const isAdmin = user?.user_metadata?.role === 'admin'

  // Get contextual actions based on current page
  const getContextualActions = () => {
    const contextual = fabActions.filter(
      (action) => action.contextual?.includes(location.pathname) && (!action.adminOnly || isAdmin)
    )
    return contextual.length > 0 ? contextual : fabActions.filter((item) => !item.adminOnly || isAdmin).slice(0, 4)
  }

  // Get actions by category
  const getActionsByCategory = (category: string) => {
    return fabActions.filter((action) => action.category === category && (!action.adminOnly || isAdmin))
  }

  // Determine which actions to show based on mode
  const getVisibleActions = () => {
    if (menuMode === 'contextual') {
      return getContextualActions()
    }
    return fabActions.filter((item) => !item.adminOnly || isAdmin)
  }

  const visibleActions = getVisibleActions()

  // Load recent actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('fab_recent_actions')
    if (stored) {
      setRecentActions(JSON.parse(stored))
    }
  }, [])

  // Track action usage
  const trackAction = (href: string) => {
    const updated = [href, ...recentActions.filter((a) => a !== href)].slice(0, 3)
    setRecentActions(updated)
    localStorage.setItem('fab_recent_actions', JSON.stringify(updated))
  }

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle()
        }
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onToggle()
        setIsLongPress(false)
      }
    }

    if (isOpen || isLongPress) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, isLongPress, onToggle])

  // Long press detection
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })

    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true)
      setMenuMode('contextual')
      // Haptic feedback simulation
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !longPressTimer.current) return

    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStart.x)
    const deltaY = Math.abs(touch.clientY - touchStart.y)

    // Cancel long press if moved too much
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (!touchStart || isLongPress) {
      setIsLongPress(false)
      return
    }

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touchStart.y - touch.clientY

    // Swipe down to close
    if (deltaY < -50 && isOpen) {
      onToggle()
    }

    // Swipe left to change mode
    if (deltaX < -50 && isOpen) {
      setMenuMode((prev) => prev === 'speed-dial' ? 'radial' : 'speed-dial')
    }

    setTouchStart(null)
  }

  // Create ripple effect
  const addRipple = (e: React.MouseEvent) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples((prev) => [...prev, { x, y, id }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    addRipple(e)
    onToggle()
  }

  // Calculate radial menu positions
  const getRadialPosition = (index: number, total: number) => {
    const radius = 120
    const startAngle = -180
    const endAngle = -90
    const angleStep = (endAngle - startAngle) / (total - 1)
    const angle = (startAngle + angleStep * index) * (Math.PI / 180)

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
  }

  // Calculate speed dial positions
  const getSpeedDialPosition = (index: number) => {
    return {
      x: 0,
      y: -(index + 1) * 68,
    }
  }

  return (
    <>
      {/* Backdrop */}
      {(isOpen || isLongPress) && (
        <div
          className="fixed inset-0 bg-gradient-to-br from-black/30 to-black/20 backdrop-blur-sm z-[55] lg:hidden transition-all duration-300"
          onClick={() => {
            if (isOpen) onToggle()
            if (isLongPress) setIsLongPress(false)
          }}
          aria-hidden="true"
        >
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"
                style={{
                  left: `${20 + i * 10}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  animationDelay: `${i * 200}ms`,
                  animationDuration: '2s',
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div
        ref={menuRef}
        className={`fixed bottom-20 right-4 z-[65] lg:hidden ${className}`}
        role="navigation"
        aria-label="Quick actions menu"
      >
        {/* Mode indicator */}
        {(isOpen || isLongPress) && (
          <div className="absolute -top-12 right-0 bg-gray-900/90 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
            {isLongPress ? '⚡ Quick Actions' : menuMode === 'radial' ? '🎯 Radial' : '🚀 Speed Dial'}
          </div>
        )}

        {/* Quick Actions from Long Press */}
        {isLongPress && !isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4">
            {getContextualActions().slice(0, 3).map((action, index) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  onClick={() => {
                    setIsLongPress(false)
                    trackAction(action.href)
                  }}
                  className="flex items-center gap-2 group"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <span className="text-xs font-medium text-gray-900 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                    {action.name}
                  </span>
                  <div className={`w-11 h-11 bg-gradient-to-br ${action.color} rounded-full shadow-lg flex items-center justify-center text-white transform group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Main Menu Items */}
        {isOpen && !isLongPress && (
          <div className="relative">
            {visibleActions.map((action, index) => {
              const Icon = action.icon
              const position = menuMode === 'radial'
                ? getRadialPosition(index, visibleActions.length)
                : getSpeedDialPosition(index)

              return (
                <Link
                  key={action.name}
                  to={action.href}
                  onClick={() => {
                    onToggle()
                    trackAction(action.href)
                  }}
                  className="absolute bottom-0 right-0 flex items-center gap-3 group touch-manipulation"
                  role="menuitem"
                  style={{
                    transform: menuMode === 'radial'
                      ? `translate(${position.x}px, ${position.y}px)`
                      : `translateY(${position.y}px)`,
                    transitionDelay: `${index * 30}ms`,
                    animation: `fabItemAppear 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 40}ms backwards`,
                  }}
                >
                  {/* Label */}
                  <span className="mr-2 px-3 py-2 bg-gray-900/90 text-white text-sm font-medium rounded-lg shadow-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap group-hover:scale-105">
                    {action.name}
                  </span>

                  {/* Action Button */}
                  <div
                    className={`relative w-12 h-12 bg-gradient-to-br ${action.color} rounded-full shadow-xl flex items-center justify-center text-white transform group-hover:scale-125 group-active:scale-95 transition-all duration-200`}
                  >
                    <Icon className="h-5 w-5" />

                    {/* Pulse ring for recent actions */}
                    {recentActions.includes(action.href) && (
                      <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Main FAB Button */}
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 hover:shadow-blue-500/50 touch-manipulation overflow-hidden ${
            isOpen ? 'rotate-45 scale-110' : 'rotate-0'
          } ${isLongPress ? 'scale-125 shadow-purple-500/50' : ''}`}
          aria-label={isOpen ? 'Close menu' : 'Open quick actions'}
          aria-expanded={isOpen}
        >
          {/* Ripple effects */}
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="absolute w-full h-full rounded-full bg-white/30 animate-ripple"
              style={{
                left: ripple.x - 32,
                top: ripple.y - 32,
              }}
            />
          ))}

          {/* Rotating gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin-slow" />

          {/* Icon */}
          <div className="relative z-10">
            {isLongPress ? (
              <Zap className="h-7 w-7 animate-pulse" />
            ) : isOpen ? (
              <X className="h-7 w-7" />
            ) : (
              <Plus className="h-7 w-7" />
            )}
          </div>

          {/* Activity indicator */}
          {!isOpen && !isLongPress && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-500 to-red-500 rounded-full border-2 border-white animate-pulse">
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping" />
            </div>
          )}
        </button>

        {/* Hint text */}
        {!isOpen && !isLongPress && (
          <div className="absolute -top-8 right-0 text-xs text-gray-600 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm opacity-0 animate-hint pointer-events-none">
            Long press for quick actions
          </div>
        )}
      </div>

      {/* Category pills (when menu is open) */}
      {isOpen && menuMode === 'speed-dial' && (
        <div className="fixed bottom-24 left-4 right-4 z-[64] lg:hidden flex gap-2 justify-center animate-in fade-in slide-in-from-bottom-2">
          {['trade', 'analyze', 'learn', 'system'].map((category, index) => {
            const count = getActionsByCategory(category).length
            return (
              <button
                key={category}
                onClick={() => {
                  // Filter by category logic could go here
                }}
                className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

export default InnovativeFAB
