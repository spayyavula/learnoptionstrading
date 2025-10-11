import React, { useState, useEffect } from 'react'
import { ConfigService, ConfigKey, ConfigSummary } from '../services/configService'
import { Key, Save, Upload, Download, RefreshCw, Check, X, AlertTriangle, Info, Lock, Eye, EyeOff } from 'lucide-react'

export default function ConfigManager() {
  const [configs, setConfigs] = useState<ConfigKey[]>([])
  const [summary, setSummary] = useState<ConfigSummary[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState<Record<string, boolean>>({})
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})
  const [validationStatus, setValidationStatus] = useState<any>(null)
  const [statusInfo, setStatusInfo] = useState<any>(null)

  useEffect(() => {
    loadConfigs()
    loadStatus()
  }, [])

  const loadConfigs = async () => {
    setLoading(true)
    try {
      const [allConfigs, summaryData] = await Promise.all([
        ConfigService.getAllConfigs(),
        ConfigService.getConfigSummary()
      ])
      setConfigs(allConfigs)
      setSummary(summaryData)

      const initialValues: Record<string, string> = {}
      allConfigs.forEach(config => {
        initialValues[config.key] = config.value || ''
      })
      setEditValues(initialValues)
    } catch (error) {
      console.error('Error loading configs:', error)
      alert('Error loading configurations. Make sure you have admin privileges.')
    } finally {
      setLoading(false)
    }
  }

  const loadStatus = async () => {
    try {
      const [status, validation] = await Promise.all([
        ConfigService.getConfigurationStatus(),
        ConfigService.validateConfiguration()
      ])
      setStatusInfo(status)
      setValidationStatus(validation)
    } catch (error) {
      console.error('Error loading status:', error)
    }
  }

  const handleSave = async (key: string) => {
    setSaving(true)
    try {
      await ConfigService.setConfigValue(key, editValues[key])
      setEditMode({ ...editMode, [key]: false })
      await loadConfigs()
      await loadStatus()
      alert('Configuration saved successfully')
    } catch (error) {
      console.error('Error saving config:', error)
      alert('Error saving configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleSyncFromEnv = async () => {
    if (!confirm('This will sync values from your local .env file to the database. Continue?')) {
      return
    }

    setSaving(true)
    try {
      const result = await ConfigService.syncFromLocalEnv()
      await loadConfigs()
      await loadStatus()
      alert(`Synced ${result.synced} configurations. ${result.errors.length} errors.`)
    } catch (error) {
      console.error('Error syncing:', error)
      alert('Error syncing from environment')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      const envContent = await ConfigService.exportToEnv()
      const blob = new Blob([envContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `.env.backup-${new Date().toISOString().split('T')[0]}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Error exporting configuration')
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.env,.txt'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        if (!content) return

        if (!confirm(`Import ${file.name}? This will update existing configurations.`)) {
          return
        }

        setSaving(true)
        try {
          const imported = await ConfigService.importFromEnv(content)
          await loadConfigs()
          await loadStatus()
          alert(`Imported ${imported} configurations`)
        } catch (error) {
          console.error('Error importing:', error)
          alert('Error importing configuration')
        } finally {
          setSaving(false)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const filteredConfigs = selectedCategory === 'all'
    ? configs
    : configs.filter(c => c.category === selectedCategory)

  const categories = Array.from(new Set(configs.map(c => c.category)))

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200'
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-gray-700 bg-gray-50 border-gray-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const toggleShowValue = (key: string) => {
    setShowValues({ ...showValues, [key]: !showValues[key] })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading configurations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Key className="h-8 w-8 mr-3 text-blue-600" />
                Configuration Manager
              </h1>
              <p className="text-gray-600 mt-2">Manage all application environment variables securely</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSyncFromEnv}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                <span>Sync from .env</span>
              </button>
              <button
                onClick={handleImport}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {validationStatus && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Configs</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {statusInfo?.total || 0}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg border-2 border-green-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Configured</span>
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-700 mt-2">
                  {statusInfo?.configured || 0}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-700">Missing</span>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-700 mt-2">
                  {statusInfo?.missing || 0}
                </div>
              </div>

              <div className={`rounded-lg border-2 p-4 ${
                validationStatus.valid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${validationStatus.valid ? 'text-green-700' : 'text-red-700'}`}>
                    Status
                  </span>
                  {validationStatus.valid ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className={`text-2xl font-bold mt-2 ${
                  validationStatus.valid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validationStatus.valid ? 'Valid' : 'Invalid'}
                </div>
              </div>
            </div>
          )}

          {validationStatus && !validationStatus.valid && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Configuration Errors
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {validationStatus.errors.map((error: string, i: number) => (
                  <li key={i} className="text-sm text-red-800">{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({configs.length})
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors capitalize ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.replace(/_/g, ' ')} ({configs.filter(c => c.category === category).length})
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredConfigs.map(config => {
            const isEditing = editMode[config.key]
            const isConfigured = config.value && config.value.trim() !== ''
            const shouldShow = showValues[config.key]

            return (
              <div
                key={config.id}
                className={`bg-white rounded-lg border-2 p-4 transition-all ${
                  isConfigured ? 'border-gray-200' : 'border-yellow-300 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-mono font-semibold text-gray-900">{config.key}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(config.priority)}`}>
                        {config.priority.toUpperCase()}
                      </span>
                      {config.is_required && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          REQUIRED
                        </span>
                      )}
                      {isConfigured ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>

                    {config.description && (
                      <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                    )}

                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues[config.key] || ''}
                          onChange={(e) => setEditValues({ ...editValues, [config.key]: e.target.value })}
                          className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                          placeholder="Enter value..."
                        />
                      ) : (
                        <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm flex items-center justify-between">
                          <span className={isConfigured ? 'text-gray-900' : 'text-gray-400'}>
                            {isConfigured
                              ? (shouldShow ? config.value : '••••••••••••••••')
                              : 'Not configured'
                            }
                          </span>
                          {isConfigured && (
                            <button
                              onClick={() => toggleShowValue(config.key)}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                            >
                              {shouldShow ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(config.key)}
                          disabled={saving}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditMode({ ...editMode, [config.key]: false })
                            setEditValues({ ...editValues, [config.key]: config.value || '' })
                          }}
                          className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditMode({ ...editMode, [config.key]: true })}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredConfigs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Key className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No configurations found in this category</p>
          </div>
        )}
      </div>
    </div>
  )
}
