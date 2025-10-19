import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, TrendingUp, Briefcase, BookOpen, Menu } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  label: string
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/app', icon: BarChart3, label: 'Home' },
  { name: 'Trading', href: '/app/trading', icon: TrendingUp, label: 'Trading' },
  { name: 'Portfolio', href: '/app/portfolio', icon: Briefcase, label: 'Portfolio' },
  { name: 'Learning', href: '/app/learning', icon: BookOpen, label: 'Learn' },
]

interface BottomNavigationProps {
  onMenuClick: () => void
  className?: string
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ onMenuClick, className = '' }) => {
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const isActive = (href: string) => {
    if (href === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/dashboard'
    }
    return location.pathname === href
  }

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden transform transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      } ${className}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Primary mobile navigation"
    >
      <div className="bg-white/80 backdrop-blur-lg border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center min-w-[60px] h-full px-2 py-1 rounded-lg transition-all duration-200 touch-manipulation active:scale-95 ${
                  active
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <div className={`relative transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1 font-medium transition-opacity duration-200 ${
                    active ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}

          <button
            onClick={onMenuClick}
            className="flex flex-col items-center justify-center min-w-[60px] h-full px-2 py-1 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 touch-manipulation active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium opacity-0">More</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default BottomNavigation
