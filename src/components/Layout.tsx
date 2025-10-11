import React, { useMemo, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3, Briefcase, TrendingUp, FileText, PieChart,
  Settings, Users, Menu, X, BookOpen, Lightbulb, CreditCard,
  Calculator, Bot, AlertTriangle, ChevronDown, ChevronRight,
  ShieldCheck, UserCircle, LogOut, User, Layers, TrendingDown
 } from 'lucide-react'
import Disclaimer from './Disclaimer'
import SubscriptionBanner from './SubscriptionBanner'
import { useAuth } from './AuthProvider'

// Define menu categories with their items
const menuCategories = [
  {
    name: 'Main',
    items: [
      { name: 'Dashboard', href: '/app', icon: BarChart3 }
    ]
  },
  {
    name: 'Trading',
    icon: TrendingUp,
    items: [
      { name: 'Portfolio', href: '/app/portfolio', icon: Briefcase },
      { name: 'Trading', href: '/app/trading', icon: TrendingUp },
      { name: 'Option Chain', href: '/app/option-chain', icon: PieChart },
      { name: 'Orders', href: '/app/orders', icon: FileText },
      { name: 'Prediction Markets', href: '/app/prediction-markets', icon: TrendingDown }
    ]
  },
  {
    name: 'Analysis',
    icon: PieChart,
    items: [
      { name: 'Analytics', href: '/app/analytics', icon: PieChart },
      { name: 'Screener', href: '/app/screener', icon: BarChart3 },
      { name: 'Sentiment Analysis', href: '/app/sentiment', icon: TrendingUp },
      { name: 'Sentiment HeatMap', href: '/app/sentiment-heatmap', icon: BarChart3 },
      { name: 'Event Analysis', href: '/app/events', icon: TrendingUp },
      { name: 'Regime Analysis', href: '/app/regime', icon: PieChart },
      { name: 'Options Arbitrage', href: '/app/arbitrage', icon: Calculator }
    ]
  },
  {
    name: 'Education',
    icon: BookOpen,
    items: [
      { name: 'Learning', href: '/app/learning', icon: BookOpen },
      { name: 'Strategies', href: '/app/strategies', icon: Lightbulb },
      { name: 'Templates', href: '/app/templates', icon: Layers },
      { name: 'Journal', href: '/app/journal', icon: FileText }
    ]
  },
  {
    name: 'Community',
    items: [
      { name: 'Community', href: '/app/community', icon: Users }
    ]
  },
  {
    name: 'Account',
    icon: UserCircle,
    items: [
      { name: 'My Profile', href: '/app/profile', icon: UserCircle },
      { name: 'Broker Connections', href: '/app/brokers', icon: CreditCard },
      { name: 'Settings', href: '/app/settings', icon: Settings }
    ]
  },
  {
    name: 'System',
    items: [
      { name: 'Admin', href: '/app/admin', icon: ShieldCheck },
      { name: 'Data Manager', href: '/app/data-manager', icon: Settings },
      { name: 'Agent API', href: '/agent', icon: Bot }
    ]
  }
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>(['Main'])
  
  // Memoize the active navigation item to prevent unnecessary re-renders
  const activeItem = useMemo(() => {
    // Flatten all items to find the active one
    const allItems = menuCategories.flatMap(category => category.items)
    return allItems.find(item => item.href === location.pathname)
  }, [location.pathname])

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    )
  }

  // Check if an item is active to expand its category automatically
  useEffect(() => {
    if (activeItem) {
      // Find which category contains the active item
      const activeCategory = menuCategories.find(category => 
        category.items.some(item => item.href === location.pathname)
      )
      
      if (activeCategory && !expandedCategories.includes(activeCategory.name)) {
        setExpandedCategories(prev => [...prev, activeCategory.name])
      }
    }
  }, [location.pathname, activeItem])

  const handleSignOut = async () => {
    try {
      console.log('🔓 Signing out...')
      const { error } = await signOut()
      if (error) {
        console.error('🔓 Sign out error:', error)
      } else {
        console.log('🔓 Sign out successful')
        // Clear any demo mode remnants
        localStorage.removeItem('demo_mode')
        localStorage.removeItem('demo_user')
        setUserMenuOpen(false)
        // Redirect to login page
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('🔓 Error signing out:', error)
    }
  }

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-menu-container')) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [userMenuOpen])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Paper Trading</h1>
            <button
              type="button"
              title="Close sidebar menu"
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {menuCategories.map((category) => (
              <div key={category.name} className="space-y-1">
                {category.items.length > 1 ? (
                  <>
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                    >
                      <div className="flex items-center">
                        {category.icon && <category.icon className="mr-3 h-5 w-5 text-gray-400" />}
                        <span>{category.name}</span>
                      </div>
                      {expandedCategories.includes(category.name) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {expandedCategories.includes(category.name) && (
                      <div className="ml-4 space-y-1 border-l border-gray-200 pl-3">
                        {category.items.map((item) => {
                          const Icon = item.icon
                          const isActive = location.pathname === item.href
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                              {item.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  // Single items don't need expansion
                  category.items.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                        {item.name}
                      </Link>
                    )
                  })
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Options Academy</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {menuCategories.map((category) => (
              <div key={category.name} className="space-y-1">
                {category.items.length > 1 ? (
                  <>
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                    >
                      <div className="flex items-center">
                        {category.icon && <category.icon className="mr-3 h-5 w-5 text-gray-400" />}
                        <span>{category.name}</span>
                      </div>
                      {expandedCategories.includes(category.name) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {expandedCategories.includes(category.name) && (
                      <div className="ml-4 space-y-1 border-l border-gray-200 pl-3">
                        {category.items.map((item) => {
                          const Icon = item.icon
                          const isActive = location.pathname === item.href
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                              {item.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  // Single items don't need expansion
                  category.items.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                        {item.name}
                      </Link>
                    )
                  })
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeItem?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  <span>Learning Mode</span>
                </div>
                
                {/* User Menu */}
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.email}
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900">
                          {user?.user_metadata?.full_name || 'User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user?.email}
                        </div>
                      </div>

                      <Link
                        to="/app/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <UserCircle className="h-4 w-4 mr-3" />
                        My Profile
                      </Link>
                      
                      <Link
                        to="/app/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </Link>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"> 
            {/* Persistent mini disclaimer for trading pages */}
            <SubscriptionBanner className="mb-4" />
            
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm text-blue-700 flex items-center">
              <BookOpen className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
              <p>
                <strong>Learning Focus:</strong> This academy is designed to help you develop trading expertise, not to maximize profits. Focus on learning and skill development.
              </p>
            </div>
            
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}