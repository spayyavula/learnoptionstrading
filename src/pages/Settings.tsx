import React, { useState } from 'react'
import { Save, RefreshCw, Download, Upload, AlertTriangle, Database, Activity, CreditCard } from 'lucide-react'
import { useTradingContext } from '../context/TradingContext'
import { StripeService } from '../services/stripeService'
import { ConstantContactService } from '../services/constantContactService'
import PageViewCounter from './PageViewCounter'
import SubscriptionStatus from '../components/SubscriptionStatus'

export default function Settings() {
  const { state } = useTradingContext()
  const [storageStats, setStorageStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  
  const [notifications, setNotifications] = useState({
    orderFills: true,
    priceAlerts: true,
    dailySummary: false,
    marketNews: true
  })
  
  const [riskSettings, setRiskSettings] = useState({
    maxPositionSize: 10000,
    maxDailyLoss: 5000,
    stopLossPercent: 10,
    takeProfitPercent: 20
  })
  
  const [displaySettings, setDisplaySettings] = useState({
    theme: 'light',
    currency: 'USD',
    timeZone: 'America/New_York',
    chartType: 'candlestick'
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleResetAccount = () => {
    if (window.confirm('Are you sure you want to reset your account? This will delete all positions, orders, and trading history. This action cannot be undone.')) {
      localStorage.clear() // Clear all local storage data
      window.location.reload()
    }
  }

  const handleExportData = () => {
    const dataToExport = {
      balance: state.balance,
      buyingPower: state.buyingPower,
      totalValue: state.totalValue,
      positions: state.positions,
      orders: state.orders,
      watchlist: state.watchlist,
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paper-trading-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        localStorage.setItem('paperTradingData', JSON.stringify(data))
        alert('Data imported successfully! The page will reload to apply changes.')
        window.location.reload()
      } catch (error) {
        alert('Error importing data. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  const saveSettings = () => {
    // In a real app, these would be saved to a backend
    localStorage.setItem('tradingSettings', JSON.stringify({
      notifications,
      riskSettings,
      displaySettings
    }))
    alert('Settings saved successfully!')
  }

  const loadStorageStats = async () => {
    setLoadingStats(true)
    try {
      const enableDataPersistence = import.meta.env.VITE_ENABLE_DATA_PERSISTENCE === 'true'
      if (!enableDataPersistence) {
        setStorageStats({
          stockDataPoints: 0,
          optionsDataPoints: 0,
          oldestDate: null,
          newestDate: null,
          message: 'Data persistence is disabled'
        })
        return
      }
      
      const historicalModule = await import('../services/historicalDataService')
      const stats = await historicalModule.HistoricalDataService.getStorageStats()
      setStorageStats(stats)
    } catch (error) {
      console.error('Failed to load storage stats:', error)
      setStorageStats({
        stockDataPoints: 0,
        optionsDataPoints: 0,
        oldestDate: null,
        newestDate: null,
        error: 'Failed to load stats'
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const handleCleanupData = async () => {
    if (window.confirm('Are you sure you want to clean up old historical data? This will remove data older than the retention period.')) {
      try {
        const enableDataPersistence = import.meta.env.VITE_ENABLE_DATA_PERSISTENCE === 'true'
        if (!enableDataPersistence) {
          alert('Data persistence is disabled. No cleanup needed.')
          return
        }
        
        const historicalModule = await import('../services/historicalDataService')
        await historicalModule.HistoricalDataService.cleanupOldData()
        alert('Old data cleaned up successfully!')
        loadStorageStats() // Refresh stats
      } catch (error) {
        alert('Failed to cleanup old data. Please try again.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Subscription Status</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <SubscriptionStatus />
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-blue-800">Subscription Management</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    You can manage your subscription, update payment methods, or cancel at any time from the Stripe customer portal.
                  </p>
                  <div className="mt-3">
                    <button 
                      onClick={() => {
                        const subscription = StripeService.getSubscriptionStatus();
                        if (subscription.active && subscription.subscription?.customer_id) {
                          StripeService.createCustomerPortalSession(subscription.subscription.customer_id)
                            .then(url => window.open(url, '_blank'));
                        } else {
                          window.location.href = '/pricing';
                        }
                      }}
                      className="btn btn-primary text-sm"
                    >
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Overview */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Account Overview</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Account Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(state.balance)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(state.totalValue)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Positions</p>
              <p className="text-2xl font-bold text-gray-900">{state.positions.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{state.orders.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Notification Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Order Fills</p>
                  <p className="text-sm text-gray-500">Get notified when orders are executed</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.orderFills}
                  onChange={(e) => setNotifications({...notifications, orderFills: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                  title="Order Fills Notification"
                  placeholder="Enable order fills notification"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Price Alerts</p>
                  <p className="text-sm text-gray-500">Alerts for watchlist price movements</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.priceAlerts}
                  onChange={(e) => setNotifications({...notifications, priceAlerts: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                  title="Enable price alerts notification"
                  placeholder="Enable price alerts notification"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Daily Summary</p>
                  <p className="text-sm text-gray-500">Daily portfolio performance summary</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.dailySummary}
                  onChange={(e) => setNotifications({...notifications, dailySummary: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                  title="Daily Summary Notification"
                  placeholder="Enable daily summary notification"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Market News</p>
                  <p className="text-sm text-gray-500">Important market news and updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.marketNews}
                  onChange={(e) => setNotifications({...notifications, marketNews: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                  title="Market News Notification"
                  placeholder="Enable market news notification"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Risk Management</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Max Position Size</label>
                <input
                  type="number"
                  className="form-input"
                  value={riskSettings.maxPositionSize}
                  onChange={(e) => setRiskSettings({...riskSettings, maxPositionSize: parseInt(e.target.value)})}
                  placeholder="Enter max position size"
                  title="Max Position Size"
                />
                <p className="text-sm text-gray-500 mt-1">Maximum amount per single position</p>
              </div>
              
              <div className="form-group">
                <label className="form-label">Max Daily Loss</label>
                <input
                  type="number"
                  className="form-input"
                  value={riskSettings.maxDailyLoss}
                  onChange={(e) => setRiskSettings({...riskSettings, maxDailyLoss: parseInt(e.target.value)})}
                  placeholder="Enter max daily loss"
                  title="Max Daily Loss"
                />
                <p className="text-sm text-gray-500 mt-1">Stop trading if daily loss exceeds this amount</p>
              </div>
              
              <div className="form-group">
                <label className="form-label">Default Stop Loss (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={riskSettings.stopLossPercent}
                  onChange={(e) => setRiskSettings({...riskSettings, stopLossPercent: parseInt(e.target.value)})}
                  title="Default Stop Loss (%)"
                  placeholder="Enter default stop loss (%)"
                />
                <p className="text-sm text-gray-500 mt-1">Automatic stop loss percentage</p>
              </div>
              
              <div className="form-group">
                <label className="form-label">Default Take Profit (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={riskSettings.takeProfitPercent}
                  onChange={(e) => setRiskSettings({...riskSettings, takeProfitPercent: parseInt(e.target.value)})}
                  title="Default Take Profit (%)"
                  placeholder="Enter default take profit (%)"
                />
                <p className="text-sm text-gray-500 mt-1">Automatic take profit percentage</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Display Settings</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="form-group">
              <label className="form-label">Theme</label>
              <select
                className="form-select"
                value={displaySettings.theme}
                onChange={(e) => setDisplaySettings({...displaySettings, theme: e.target.value})}
                title="Theme"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select
                className="form-select"
                value={displaySettings.currency}
                onChange={(e) => setDisplaySettings({...displaySettings, currency: e.target.value})}
                title="Currency"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Time Zone</label>
              <select
                className="form-select"
                value={displaySettings.timeZone}
                onChange={(e) => setDisplaySettings({...displaySettings, timeZone: e.target.value})}
                title="Time Zone"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Chart Type</label>
              <select
                className="form-select"
                value={displaySettings.chartType}
                onChange={(e) => setDisplaySettings({...displaySettings, chartType: e.target.value})}
                title="Chart Type"
              >
                <option value="candlestick">Candlestick</option>
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="bar">Bar</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
            <button
              onClick={loadStorageStats}
              disabled={loadingStats}
              className="btn btn-secondary text-sm"
            >
              <Database className="h-4 w-4" />
              {loadingStats ? 'Loading...' : 'Check Storage'}
            </button>
          </div>
        </div>
        <div className="card-body">
          {/* Storage Statistics */}
          {storageStats && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Storage Statistics
              </h4>
              {storageStats.message || storageStats.error ? (
                <p className="text-sm text-gray-600">
                  {storageStats.message || storageStats.error}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Stock Data Points:</span>
                    <span className="ml-2 font-medium">{storageStats.stockDataPoints.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Options Data Points:</span>
                    <span className="ml-2 font-medium">{storageStats.optionsDataPoints.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Oldest Data:</span>
                    <span className="ml-2 font-medium">{storageStats.oldestDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Newest Data:</span>
                    <span className="ml-2 font-medium">{storageStats.newestDate || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Export Data</h4>
              <p className="text-sm text-gray-500 mb-4">Download your trading data as JSON</p>
              <button onClick={handleExportData} className="btn btn-secondary">
                <Download className="h-4 w-4" />
                Export Data
              </button>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Import Data</h4>
              <p className="text-sm text-gray-500 mb-4">Upload previously exported data</p>
              <label className="btn btn-secondary cursor-pointer">
                <Upload className="h-4 w-4" />
                Import Data
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Cleanup Data</h4>
              <p className="text-sm text-gray-500 mb-4">Remove old historical data</p>
              <button onClick={handleCleanupData} className="btn btn-secondary">
                <RefreshCw className="h-4 w-4" />
                Cleanup Old Data
              </button>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Reset Account</h4>
              <p className="text-sm text-gray-500 mb-4">Start fresh with a new account</p>
              <button onClick={handleResetAccount} className="btn btn-danger">
                <AlertTriangle className="h-4 w-4" />
                Reset Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Site Statistics */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Site Statistics</h3>
        </div>
        <div className="card-body">
          <PageViewCounter />
        </div>
      </div>

      {/* Save Settings */}
      <div className="flex justify-end">
        <button onClick={saveSettings} className="btn btn-primary">
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>
    </div>
  )
}