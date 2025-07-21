import React, { useEffect, useState } from 'react'
import { BarChart3, Eye, Globe, Clock } from 'lucide-react'

interface PageViewStats {
  totalViews: number
  todayViews: number
  countries: Record<string, number>
  lastUpdated: Date
}

interface PageViewCounterProps {
  className?: string
}

const PageViewCounter: React.FC<PageViewCounterProps> = ({ className }) => {
  const [stats, setStats] = useState<PageViewStats>({
    totalViews: 0,
    todayViews: 0,
    countries: {},
    lastUpdated: new Date()
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize page view counter
    const initPageView = async () => {
      try {
        setLoading(true)
        
        // Get stored stats from localStorage
        const storedStats = localStorage.getItem('pageViewStats')
        let currentStats: PageViewStats
        
        if (storedStats) {
          currentStats = JSON.parse(storedStats)
          currentStats.lastUpdated = new Date(currentStats.lastUpdated)
        } else {
          currentStats = {
            totalViews: 0,
            todayViews: 0,
            countries: {},
            lastUpdated: new Date()
          }
        }
        
        // Check if we need to reset today's count (if last update was yesterday)
        const today = new Date().toDateString()
        const lastUpdateDay = currentStats.lastUpdated.toDateString()
        
        if (today !== lastUpdateDay) {
          currentStats.todayViews = 0
        }
        
        // Increment view counts
        currentStats.totalViews += 1
        currentStats.todayViews += 1
        currentStats.lastUpdated = new Date()
        
        // Try to get user's country
        try {
          const geoResponse = await fetch('https://ipapi.co/json/')
          const geoData = await geoResponse.json()
          
          if (geoData.country_name) {
            const country = geoData.country_name
            currentStats.countries[country] = (currentStats.countries[country] || 0) + 1
          }
        } catch (geoError) {
          console.log('Could not determine location:', geoError)
          // Fallback - count as unknown
          currentStats.countries['Unknown'] = (currentStats.countries['Unknown'] || 0) + 1
        }
        
        // Save updated stats
        localStorage.setItem('pageViewStats', JSON.stringify(currentStats))
        setStats(currentStats)
      } catch (error) {
        console.error('Error tracking page view:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initPageView()
  }, [])

  // Get top countries
  const topCountries = Object.entries(stats.countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Eye className="h-5 w-5 mr-2 text-blue-600" />
        Page Views
      </h3>
      
      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <BarChart3 className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-gray-600">Total Views</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <Clock className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">Today</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.todayViews.toLocaleString()}</div>
            </div>
          </div>
          
          {topCountries.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <Globe className="h-4 w-4 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Top Locations</span>
              </div>
              <div className="space-y-2">
                {topCountries.map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{country}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 text-right">
            Last updated: {stats.lastUpdated.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}

export default PageViewCounter