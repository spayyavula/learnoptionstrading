import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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
  Database
} from 'lucide-react'
import { useAuth } from './AuthProvider'

interface FABMenuItem {
  name: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
}

const fabMenuItems: FABMenuItem[] = [
  { name: 'Strategy Builder', href: '/app/strategy-builder', icon: Calculator },
  { name: 'Option Chain', href: '/app/option-chain', icon: PieChart },
  { name: 'Orders', href: '/app/orders', icon: FileText },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Community', href: '/app/community', icon: Users },
  { name: 'Settings', href: '/app/settings', icon: Settings },
  { name: 'Admin', href: '/app/admin', icon: ShieldCheck, adminOnly: true },
  { name: 'Data Manager', href: '/app/data-manager', icon: Database },
]

interface FABMenuProps {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

const FABMenu: React.FC<FABMenuProps> = ({ isOpen, onToggle, className = '' }) => {
  const { user } = useAuth()
  const menuRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const isAdmin = user?.user_metadata?.role === 'admin'

  const visibleItems = fabMenuItems.filter((item) => !item.adminOnly || isAdmin)

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
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onToggle])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touchEnd = e.changedTouches[0].clientY
    const diff = touchStart - touchEnd

    if (diff < -50) {
      onToggle()
    }

    setTouchStart(null)
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] lg:hidden transition-opacity duration-200"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <div
        ref={menuRef}
        className={`fixed bottom-20 right-4 z-[65] lg:hidden ${className}`}
        role="navigation"
        aria-label="Secondary menu"
      >
        {isOpen && (
          <div
            className="mb-4 space-y-2"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="menu"
            aria-orientation="vertical"
          >
            {visibleItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onToggle}
                  className="flex items-center justify-end group animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
                  role="menuitem"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationDuration: '200ms',
                    animationFillMode: 'backwards',
                  }}
                >
                  <span className="mr-3 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                    {item.name}
                  </span>
                  <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 active:scale-95">
                    <Icon className="h-5 w-5" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <button
          onClick={onToggle}
          className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95 hover:shadow-xl touch-manipulation ${
            isOpen ? 'rotate-45' : ''
          }`}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>

        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
    </>
  )
}

export default FABMenu
