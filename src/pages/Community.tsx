import React, { useState, useEffect } from 'react'
import { 
  Users, 
  MessageCircle, 
  TrendingUp, 
  Share2, 
  Settings,
  ExternalLink,
  Activity,
  Clock,
  Hash,
  Send,
  Bell,
  Globe,
  Zap,
  Webhook,
  Key,
  Lock,
  Save,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react'
import { CommunityService } from '../services/communityService'
import { useTradingContext } from '../context/TradingContext'
import { useOptionsContext } from '../context/OptionsContext'
import { LearningService } from '../services/learningService'

export default function Community() {
  const { state: tradingState } = useTradingContext()
  const { state: optionsState } = useOptionsContext()
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [shareMessage, setShareMessage] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [communityStats, setCommunityStats] = useState<any>(null)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configPlatform, setConfigPlatform] = useState<string | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, string>>({})
  const [configTesting, setConfigTesting] = useState(false)
  const [configSuccess, setConfigSuccess] = useState<boolean | null>(null)
  const [journalEntries, setJournalEntries] = useState<any[]>([])

  useEffect(() => {
    // Initialize community data
    CommunityService.initializeData()
    loadCommunityData()
    
    // Load journal entries for sharing
    setJournalEntries(LearningService.getJournalEntries())
    
    // Set up refresh interval
    const interval = setInterval(() => {
      loadCommunityData()
    }, 60000) // Refresh every minute
    
    return () => clearInterval(interval)
  }, [])

  const loadCommunityData = () => {
    setCommunityStats(CommunityService.getCommunityStats())
    setRecentMessages(CommunityService.getRecentMessages())
  }

  const platforms = CommunityService.getPlatforms()
  const configuredPlatforms = CommunityService.getConfiguredPlatforms()

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handleJoinPlatform = (platformId: string) => {
    CommunityService.joinPlatform(platformId)
  }

  const handleShareMessage = async () => {
    if (!shareMessage.trim()) return

    setIsSharing(true)
    try {
      await CommunityService.shareMarketAnalysis(
        'Community Update',
        shareMessage,
        selectedPlatforms
      )
      setShareMessage('')
      setSelectedPlatforms([])
      loadCommunityData() // Refresh data
      alert('Message shared successfully!')
    } catch (error) {
      alert('Failed to share message. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  const handleShareTrade = async (symbol: string) => {
    const position = tradingState.positions.find(p => p.symbol === symbol)
    if (!position) return

    const tradeAlertData = {
      symbol: position.symbol,
      action: 'buy' as const,
      price: position.currentPrice,
      quantity: position.quantity,
      strategy: 'Long Position',
      reasoning: `Strong position in ${symbol} with ${position.unrealizedPnLPercent.toFixed(2)}% unrealized P&L`
    }

    try {
      await CommunityService.shareTradingAlert(tradeAlertData, selectedPlatforms)
      loadCommunityData() // Refresh data
      alert('Trade shared to community!')
    } catch (error) {
      alert('Failed to share trade. Please try again.')
    }
  }

  const handleShareOptionsPosition = async (contractTicker: string) => {
    const position = optionsState.positions.find(p => p.contractTicker === contractTicker)
    if (!position) return

    try {
      await CommunityService.sharePosition(position, selectedPlatforms)
      loadCommunityData() // Refresh data
      alert('Options position shared to community!')
    } catch (error) {
      alert('Failed to share position. Please try again.')
    }
  }

  const handleShareJournalEntry = async (entryId: string) => {
    const entry = journalEntries.find(e => e.id === entryId)
    if (!entry) return

    try {
      await CommunityService.shareJournalEntry(entry, selectedPlatforms)
      loadCommunityData() // Refresh data
      alert('Journal entry shared to community!')
    } catch (error) {
      alert('Failed to share journal entry. Please try again.')
    }
  }

  const handleConfigurePlatform = (platformId: string) => {
    setConfigPlatform(platformId)
    setConfigValues({})
    setConfigSuccess(null)
    setShowConfigModal(true)
  }

  const handleSaveConfig = async () => {
    if (!configPlatform) return
    
    setConfigTesting(true)
    
    try {
      // In a real app, this would save to environment variables or a backend
      const success = CommunityService.configurePlatform(configPlatform, configValues)
      setConfigSuccess(success)
      
      if (success) {
        // Simulate successful configuration for demo
        setTimeout(() => {
          setShowConfigModal(false)
          // Reload the page to simulate the platform being configured
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setConfigSuccess(false)
      console.error('Failed to save configuration:', error)
    } finally {
      setConfigTesting(false)
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getPlatformIcon = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId)
    return platform?.icon || '💬'
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'trade_alert': return 'text-green-600 bg-green-50'
      case 'analysis': return 'text-blue-600 bg-blue-50'
      case 'market_update': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getConfigFields = (platformId: string) => {
    switch (platformId) {
      case 'slack':
        return [
          { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/services/...' }
        ]
      case 'discord':
        return [
          { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://discord.com/api/webhooks/...' }
        ]
      case 'telegram':
        return [
          { key: 'bot_token', label: 'Bot Token', type: 'text', placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' },
          { key: 'chat_id', label: 'Chat ID', type: 'text', placeholder: '-1001234567890' },
          { key: 'channel', label: 'Channel Username (optional)', type: 'text', placeholder: 'optionsworld' }
        ]
      case 'whatsapp':
        return [
          { key: 'group_invite', label: 'Group Invite Code', type: 'text', placeholder: 'ABC123DEF456' }
        ]
      case 'facebook':
        return [
          { key: 'group_id', label: 'Group ID', type: 'text', placeholder: '1234567890' }
        ]
      default:
        return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Community Overview */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Trading Community</h2>
              <p className="text-gray-600 mt-2">
                Connect with fellow traders, share insights, and learn together
              </p>
            </div>
            <Globe className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <div className="card-body">
          {communityStats && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{communityStats.totalMembers.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{communityStats.activeToday}</div>
                <div className="text-sm text-gray-500">Active Today</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{communityStats.tradesShared}</div>
                <div className="text-sm text-gray-500">Trades Shared</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{configuredPlatforms.length}</div>
                <div className="text-sm text-gray-500">Platforms</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Platform Connections */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Community Platforms
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {platforms.map((platform) => (
                <div key={platform.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{platform.icon}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{platform.name}</h4>
                      <p className="text-sm text-gray-500">
                        {platform.isConfigured ? 'Connected' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {platform.isConfigured && (
                      <div className="text-sm text-gray-500">
                        {communityStats?.platformStats.find(s => s.platform === platform.name)?.members || 0} members
                      </div>
                    )}
                    <div className="flex space-x-2">
                      {platform.isConfigured ? (
                        <button
                          onClick={() => handleJoinPlatform(platform.id)}
                          className="btn btn-primary"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Join
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConfigurePlatform(platform.id)}
                          className="btn btn-secondary"
                        >
                          <Settings className="h-4 w-4" />
                          Configure
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {configuredPlatforms.length === 0 && (
              <div className="text-center py-8">
                <Settings className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No platforms configured</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure your community platforms to start connecting with other traders.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Community Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </h3>
          </div>
          <div className="card-body">
            {recentMessages.length > 0 ? (
              <div className="space-y-4">
                {recentMessages.slice(0, 10).map((message) => (
                  <div key={message.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{getPlatformIcon(message.platform)}</span>
                          <span className="font-medium text-gray-900">{message.author}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMessageTypeColor(message.type)}`}>
                            {message.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{message.content.length > 150 ? message.content.substring(0, 150) + '...' : message.content}</p>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeAgo(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Community messages will appear here once platforms are configured.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share to Community */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            Share with Community
          </h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {/* Platform Selection */}
            <div>
              <label className="form-label">Select Platforms</label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => handlePlatformToggle(platform.id)}
                    disabled={!platform.isConfigured}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                      !platform.isConfigured 
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                        : selectedPlatforms.includes(platform.id)
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{platform.icon}</span>
                    <span className="text-sm font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
              {platforms.every(p => !p.isConfigured) && (
                <p className="text-sm text-yellow-600 mt-2">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Configure at least one platform to enable sharing
                </p>
              )}
            </div>

            {/* Message Input */}
            <div>
              <label className="form-label">Message</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Share your market insights, trading ideas, or analysis with the community..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
              />
            </div>

            {/* Share Button */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {selectedPlatforms.length > 0 
                  ? `Sharing to ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''}`
                  : 'Select platforms to share'
                }
              </div>
              <button
                onClick={handleShareMessage}
                disabled={!shareMessage.trim() || selectedPlatforms.length === 0 || isSharing || platforms.every(p => !p.isConfigured)}
                className="btn btn-primary"
              >
                <Send className="h-4 w-4" />
                {isSharing ? 'Sharing...' : 'Share Message'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Share Trades */}
      {(tradingState.positions.length > 0 || optionsState.positions.length > 0 || journalEntries.length > 0) && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Share Your Trades
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-6">
              {/* Stock Positions */}
              {tradingState.positions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Stock Positions</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tradingState.positions.slice(0, 3).map((position) => (
                      <div key={position.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{position.symbol}</h4>
                          <span className={`text-sm font-medium ${
                            position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {position.unrealizedPnLPercent >= 0 ? '+' : ''}{position.unrealizedPnLPercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          {position.quantity} shares @ ${position.avgPrice.toFixed(2)}
                        </div>
                        <button
                          onClick={() => handleShareTrade(position.symbol)}
                          disabled={platforms.every(p => !p.isConfigured) || selectedPlatforms.length === 0}
                          className="w-full btn btn-secondary text-sm disabled:opacity-50"
                        >
                          <Share2 className="h-3 w-3" />
                          Share Trade
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Options Positions */}
              {optionsState.positions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Options Positions</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {optionsState.positions.slice(0, 3).map((position) => (
                      <div key={position.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{position.contractTicker}</h4>
                          <span className={`text-sm font-medium ${
                            position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {position.unrealizedPnLPercent >= 0 ? '+' : ''}{position.unrealizedPnLPercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          {position.quantity} contracts @ ${position.avgPrice.toFixed(2)}
                        </div>
                        <button
                          onClick={() => handleShareOptionsPosition(position.contractTicker)}
                          disabled={platforms.every(p => !p.isConfigured) || selectedPlatforms.length === 0}
                          className="w-full btn btn-secondary text-sm disabled:opacity-50"
                        >
                          <Share2 className="h-3 w-3" />
                          Share Position
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Journal Entries */}
              {journalEntries.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Journal Entries</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {journalEntries.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{entry.contractTicker}</h4>
                          <span className={`text-sm font-medium ${
                            entry.outcome === 'win' ? 'text-green-600' : 
                            entry.outcome === 'loss' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {entry.outcome?.toUpperCase() || 'OPEN'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          {entry.strategy} • {new Date(entry.date).toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => handleShareJournalEntry(entry.id)}
                          disabled={platforms.every(p => !p.isConfigured) || selectedPlatforms.length === 0}
                          className="w-full btn btn-secondary text-sm disabled:opacity-50"
                        >
                          <Share2 className="h-3 w-3" />
                          Share Journal Entry
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Platforms Warning */}
              {platforms.every(p => !p.isConfigured) && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-700">
                      Configure at least one platform to share your trades with the community.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Community Guidelines */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Community Guidelines
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">✅ Do's</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Share educational content and analysis</li>
                <li>• Be respectful and constructive</li>
                <li>• Use proper risk disclaimers</li>
                <li>• Help fellow traders learn</li>
                <li>• Share both wins and losses</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">❌ Don'ts</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Give financial advice</li>
                <li>• Spam or self-promote excessively</li>
                <li>• Share insider information</li>
                <li>• Guarantee returns or outcomes</li>
                <li>• Engage in toxic behavior</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Disclaimer:</strong> All content shared is for educational purposes only. 
              This is not financial advice. Always do your own research and consult with a financial advisor.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Configuration Modal */}
      {showConfigModal && configPlatform && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowConfigModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Configure {platforms.find(p => p.id === configPlatform)?.name}
                    </h3>
                    
                    <div className="space-y-4">
                      {getConfigFields(configPlatform).map(field => (
                        <div key={field.key}>
                          <label className="form-label">{field.label}</label>
                          <input
                            type={field.type}
                            className="form-input"
                            placeholder={field.placeholder}
                            value={configValues[field.key] || ''}
                            onChange={(e) => setConfigValues({...configValues, [field.key]: e.target.value})}
                          />
                        </div>
                      ))}

                      {configPlatform === 'slack' && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                            <HelpCircle className="h-4 w-4 mr-2" />
                            How to get a Slack Webhook URL
                          </h4>
                          <ol className="text-sm text-blue-800 space-y-1 list-decimal pl-4">
                            <li>Go to your Slack workspace</li>
                            <li>Create a new Slack app from the <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Slack API dashboard</a></li>
                            <li>Enable "Incoming Webhooks"</li>
                            <li>Create a new webhook URL for a specific channel</li>
                            <li>Copy the webhook URL and paste it here</li>
                          </ol>
                        </div>
                      )}

                      {configPlatform === 'discord' && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                            <HelpCircle className="h-4 w-4 mr-2" />
                            How to get a Discord Webhook URL
                          </h4>
                          <ol className="text-sm text-blue-800 space-y-1 list-decimal pl-4">
                            <li>Go to your Discord server</li>
                            <li>Edit a channel → Integrations → Webhooks</li>
                            <li>Create a new webhook</li>
                            <li>Copy the webhook URL and paste it here</li>
                          </ol>
                        </div>
                      )}

                      {configPlatform === 'telegram' && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                            <HelpCircle className="h-4 w-4 mr-2" />
                            How to set up Telegram
                          </h4>
                          <ol className="text-sm text-blue-800 space-y-1 list-decimal pl-4">
                            <li>Create a bot using <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">BotFather</a></li>
                            <li>Copy the bot token provided</li>
                            <li>Add the bot to your group or channel</li>
                            <li>Get the chat ID by sending a message and checking <a href="https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">this URL</a></li>
                          </ol>
                        </div>
                      )}

                      {configSuccess !== null && (
                        <div className={`p-4 rounded-lg ${configSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
                          <div className="flex items-center">
                            {configSuccess ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                <p className="text-sm text-green-800">Configuration successful! Platform connected.</p>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                                <p className="text-sm text-red-800">Configuration failed. Please check your settings and try again.</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSaveConfig}
                  disabled={configTesting || Object.keys(configValues).length === 0}
                  className="btn btn-primary"
                >
                  {configTesting ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Testing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Configuration
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="btn btn-secondary mr-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}