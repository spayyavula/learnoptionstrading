import React from 'react'
import { 
  Database, 
  Clock, 
  Play, 
  Square, 
  RefreshCw, 
  Activity,
  Calendar,
  BarChart3,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useOptionsData } from '../context/OptionsDataContext'
import { format } from 'date-fns'

export default function OptionsDataManager() {
  const {
    schedulerStatus,
    dataStats,
    isLoading,
    startScheduler,
    stopScheduler,
    triggerManualFetch,
    refreshStats
  } = useOptionsData()

  const formatTimeUntilNext = (milliseconds: number | null) => {
    if (!milliseconds) return 'N/A'
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Options Data Manager</h2>
              <p className="text-gray-600 mt-2">
                Automated Polygon.io options data collection and Supabase storage
              </p>
            </div>
            <Database className="h-12 w-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Scheduler Status */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {schedulerStatus.active ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Scheduler Status</p>
                <p className={`text-2xl font-bold ${schedulerStatus.active ? 'text-green-600' : 'text-red-600'}`}>
                  {schedulerStatus.active ? 'Active' : 'Stopped'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Next Fetch</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatTimeUntilNext(schedulerStatus.timeUntilNextFetch)}
                </p>
                <p className="text-xs text-gray-500">
                  {schedulerStatus.nextFetchTime 
                    ? format(schedulerStatus.nextFetchTime, 'MMM dd, HH:mm')
                    : 'Not scheduled'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Contracts</p>
                <p className="text-2xl font-bold text-gray-900">{dataStats.totalContracts}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Data Points</p>
                <p className="text-2xl font-bold text-gray-900">{dataStats.dataPoints.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Scheduler Controls</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={startScheduler}
              disabled={schedulerStatus.active}
              className="btn btn-success"
            >
              <Play className="h-4 w-4" />
              Start Scheduler
            </button>
            
            <button
              onClick={stopScheduler}
              disabled={!schedulerStatus.active}
              className="btn btn-danger"
            >
              <Square className="h-4 w-4" />
              Stop Scheduler
            </button>
            
            <button
              onClick={triggerManualFetch}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Manual Fetch
            </button>
            
            <button
              onClick={refreshStats}
              className="btn btn-secondary"
            >
              <Activity className="h-4 w-4" />
              Refresh Stats
            </button>
          </div>
        </div>
      </div>

      {/* Data Statistics */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Data Statistics</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Collection Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Fetch:</span>
                  <span className="font-medium">
                    {dataStats.lastFetch 
                      ? format(dataStats.lastFetch, 'MMM dd, yyyy HH:mm')
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Next Scheduled:</span>
                  <span className="font-medium">
                    {format(dataStats.nextScheduledFetch, 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Collection Window:</span>
                  <span className="font-medium">Last 14 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Update Frequency:</span>
                  <span className="font-medium">Daily after market close</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Data Coverage</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tracked Underlyings:</span>
                  <span className="font-medium">SPY, QQQ, AAPL, TSLA, NVDA, MSFT, AMZN, GOOGL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contract Types:</span>
                  <span className="font-medium">Calls & Puts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiration Range:</span>
                  <span className="font-medium">Up to 60 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Data Points per Contract:</span>
                  <span className="font-medium">14 days × OHLCV + Greeks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configuration
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">API Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Polygon.io API:</span>
                  <span className={`font-medium ${
                    import.meta.env.VITE_POLYGON_API_KEY && import.meta.env.VITE_POLYGON_API_KEY !== 'demo_api_key'
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {import.meta.env.VITE_POLYGON_API_KEY && import.meta.env.VITE_POLYGON_API_KEY !== 'demo_api_key'
                      ? 'Configured' 
                      : 'Not Configured'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Real-time Data:</span>
                  <span className={`font-medium ${
                    import.meta.env.VITE_ENABLE_REAL_TIME_DATA === 'true' 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {import.meta.env.VITE_ENABLE_REAL_TIME_DATA === 'true' ? 'Enabled' : 'Mock Mode'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rate Limiting:</span>
                  <span className="font-medium text-green-600">1 req/sec</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Storage Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Database:</span>
                  <span className="font-medium text-green-600">Supabase</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Data Persistence:</span>
                  <span className={`font-medium ${
                    import.meta.env.VITE_ENABLE_DATA_PERSISTENCE === 'true' 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {import.meta.env.VITE_ENABLE_DATA_PERSISTENCE === 'true' ? 'Enabled' : 'Local Only'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Retention Period:</span>
                  <span className="font-medium">{import.meta.env.VITE_HISTORICAL_DATA_RETENTION_DAYS || 30} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Schedule Information
          </h3>
        </div>
        <div className="card-body">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Automated Data Collection</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Data collection runs daily at 6:00 PM EST (1 hour after market close)</li>
              <li>• Collects the last 14 days of options data for tracked underlyings</li>
              <li>• Includes OHLCV data, Greeks (Delta, Gamma, Theta, Vega), and implied volatility</li>
              <li>• Automatically skips weekends and holidays</li>
              <li>• Rate-limited to respect Polygon.io API limits</li>
              <li>• Falls back to mock data if API is unavailable</li>
            </ul>
          </div>
          
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Requires valid Polygon.io API key for real data</li>
              <li>• Supabase configuration needed for persistent storage</li>
              <li>• Manual fetch available for testing and immediate updates</li>
              <li>• Scheduler automatically restarts after application reload</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}