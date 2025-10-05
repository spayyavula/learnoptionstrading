import type { TradingJournalEntry } from '../types/learning'
import type { OptionsPosition } from '../types/options'

// Lazy load environment variables
const getEnvVars = () => ({
  SLACK_WEBHOOK_URL: import.meta.env.VITE_SLACK_WEBHOOK_URL,
  DISCORD_WEBHOOK_URL: import.meta.env.VITE_DISCORD_WEBHOOK_URL,
  TELEGRAM_BOT_TOKEN: import.meta.env.VITE_TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: import.meta.env.VITE_TELEGRAM_CHAT_ID,
  TELEGRAM_CHANNEL: import.meta.env.VITE_TELEGRAM_CHANNEL,
  WHATSAPP_GROUP_INVITE: import.meta.env.VITE_WHATSAPP_GROUP_INVITE,
  FACEBOOK_GROUP_ID: import.meta.env.VITE_FACEBOOK_GROUP_ID
})

interface CommunityPlatform {
  id: string
  name: string
  icon: string
  color: string
  url?: string
  isConfigured: boolean
}

interface CommunityMessage {
  id: string
  platform: string
  content: string
  author: string
  timestamp: Date
  type: 'trade_alert' | 'market_update' | 'discussion' | 'analysis'
}

interface TradingAlert {
  symbol: string
  action: 'buy' | 'sell'
  price: number
  quantity: number
  strategy: string
  reasoning: string
}

export class CommunityService {
  private static readonly STORAGE_KEY = 'community_data'
  private static readonly MESSAGES_KEY = 'community_messages'
  private static readonly PLATFORMS: CommunityPlatform[] = [
    // These will be initialized in the initializeData method
  ]
  private static initializedPlatforms = false

  /**
   * Initialize community data
   */
  static initializeData(): void {
    // Initialize platforms if not already done
    if (!this.initializedPlatforms) {
      const env = getEnvVars()
      
      this.PLATFORMS.length = 0 // Clear array
      this.PLATFORMS.push(
        {
          id: 'slack',
          name: 'Slack',
          icon: '💬',
          color: '#4A154B',
          url: env.SLACK_WEBHOOK_URL,
          isConfigured: !!env.SLACK_WEBHOOK_URL
        },
        {
          id: 'discord',
          name: 'Discord',
          icon: '🎮',
          color: '#5865F2',
          url: env.DISCORD_WEBHOOK_URL,
          isConfigured: !!env.DISCORD_WEBHOOK_URL
        },
        {
          id: 'telegram',
          name: 'Telegram',
          icon: '✈️',
          color: '#0088CC',
          url: `https://t.me/${env.TELEGRAM_CHANNEL}`,
          isConfigured: !!env.TELEGRAM_BOT_TOKEN && !!env.TELEGRAM_CHAT_ID
        },
        {
          id: 'whatsapp',
          name: 'WhatsApp',
          icon: '📱',
          color: '#25D366',
          url: `https://chat.whatsapp.com/${env.WHATSAPP_GROUP_INVITE}`,
          isConfigured: !!env.WHATSAPP_GROUP_INVITE
        },
        {
          id: 'facebook',
          name: 'Facebook',
          icon: '📘',
          color: '#1877F2',
          url: `https://facebook.com/groups/${env.FACEBOOK_GROUP_ID}`,
          isConfigured: !!env.FACEBOOK_GROUP_ID
        }
      )
      
      this.initializedPlatforms = true
    }
    
    // Initialize storage if not exists
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        totalMembers: 15420,
        activeToday: 342,
        tradesShared: 1250,
        platformStats: [
          { platform: 'Discord', members: 8500 },
          { platform: 'Telegram', members: 3200 },
          { platform: 'Slack', members: 2100 },
          { platform: 'WhatsApp', members: 1200 },
          { platform: 'Facebook', members: 420 }
        ]
      }))
    }

    // Initialize messages if not exists
    if (!localStorage.getItem(this.MESSAGES_KEY)) {
      localStorage.setItem(this.MESSAGES_KEY, JSON.stringify([
        {
          id: '1',
          platform: 'discord',
          content: 'Great SPY call analysis! Thanks for sharing the setup.',
          author: 'TraderMike',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          type: 'discussion'
        },
        {
          id: '2',
          platform: 'telegram',
          content: 'BUY AAPL $185 Call - Strong bullish momentum detected',
          author: 'OptionsBot',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          type: 'trade_alert'
        },
        {
          id: '3',
          platform: 'slack',
          content: 'Market regime analysis: Transitioning to high volatility phase',
          author: 'MarketAnalyst',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          type: 'analysis'
        },
        {
          id: '4',
          platform: 'discord',
          content: 'Just closed my TSLA position for a 15% gain. The key was timing the entry after the earnings dip.',
          author: 'ElectricTrader',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: 'trade_alert'
        },
        {
          id: '5',
          platform: 'whatsapp',
          content: 'Anyone watching the Fed announcement today? Expecting volatility in the QQQ options chain.',
          author: 'MarketWatcher',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          type: 'discussion'
        },
        {
          id: '6',
          platform: 'telegram',
          content: 'MARKET UPDATE: S&P 500 breaks key resistance level at 5200. Watch for continuation pattern.',
          author: 'ChartMaster',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          type: 'market_update'
        },
        {
          id: '7',
          platform: 'slack',
          content: 'Iron condor strategy working well in this sideways market. 80% probability of profit with 45 DTE.',
          author: 'OptionsPro',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          type: 'analysis'
        }
      ]))
    }
  }

  /**
   * Get all available community platforms
   */
  static getPlatforms(): CommunityPlatform[] {
    return [...this.PLATFORMS]
  }

  /**
   * Get configured platforms only
   */
  static getConfiguredPlatforms(): CommunityPlatform[] {
    return this.PLATFORMS.filter(platform => platform.isConfigured)
  }

  /**
   * Share trading alert to community platforms
   */
  static async shareTradingAlert(alert: TradingAlert, platforms: string[] = []): Promise<void> {
    const message = this.formatTradingAlert(alert)
    const targetPlatforms = platforms.length > 0 
      ? this.PLATFORMS.filter(p => platforms.includes(p.id))
      : this.getConfiguredPlatforms()

    const promises = targetPlatforms.map(platform => 
      this.sendMessage(platform.id, message, 'trade_alert', alert.symbol)
    )

    try {
      await Promise.allSettled(promises)
      console.log(`Trading alert shared to ${targetPlatforms.length} platforms`)
      
      // Add to local messages for demo
      this.addLocalMessage({
        platform: targetPlatforms[0]?.id || 'discord',
        content: message,
        author: 'You',
        type: 'trade_alert'
      })
    } catch (error) {
      console.error('Failed to share trading alert:', error)
    }
  }

  /**
   * Share market analysis to community
   */
  static async shareMarketAnalysis(
    title: string, 
    analysis: string, 
    platforms: string[] = []
  ): Promise<void> {
    const message = this.formatMarketAnalysis(title, analysis)
    const targetPlatforms = platforms.length > 0 
      ? this.PLATFORMS.filter(p => platforms.includes(p.id))
      : this.getConfiguredPlatforms()

    const promises = targetPlatforms.map(platform => 
      this.sendMessage(platform.id, message, 'analysis')
    )

    try {
      await Promise.allSettled(promises)
      console.log(`Market analysis shared to ${targetPlatforms.length} platforms`)
      
      // Add to local messages for demo
      this.addLocalMessage({
        platform: targetPlatforms[0]?.id || 'discord',
        content: message,
        author: 'You',
        type: 'analysis'
      })
    } catch (error) {
      console.error('Failed to share market analysis:', error)
    }
  }

  /**
   * Join community platform
   */
  static joinPlatform(platformId: string): void {
    const platform = this.PLATFORMS.find(p => p.id === platformId)
    if (platform?.url) {
      window.open(platform.url, '_blank', 'noopener,noreferrer')
    } else {
      console.warn(`Platform ${platformId} not configured or URL not available`)
    }
  }

  /**
   * Send message to specific platform
   */
  private static async sendMessage(
    platformId: string, 
    message: string, 
    type: CommunityMessage['type'],
    symbol?: string
  ): Promise<void> {
    switch (platformId) {
      case 'slack':
        await this.sendToSlack(message, type, symbol)
        break
      case 'discord':
        await this.sendToDiscord(message, type, symbol)
        break
      case 'telegram':
        await this.sendToTelegram(message, type)
        break
      case 'whatsapp':
        this.shareToWhatsApp(message)
        break
      case 'facebook':
        this.shareToFacebook(message)
        break
      default:
        console.warn(`Platform ${platformId} not supported`)
    }
  }

  /**
   * Send message to Slack
   */
  private static async sendToSlack(message: string, type: string, symbol?: string): Promise<void> {
    const { SLACK_WEBHOOK_URL: webhookUrl } = getEnvVars()
    if (!webhookUrl) {
      console.warn('Slack webhook URL not configured')
      return
    }

    try {
      // For demo purposes, we'll simulate the API call
      if (import.meta.env.DEV) {
        console.log('DEV MODE: Simulating Slack webhook call')
        await new Promise(resolve => setTimeout(resolve, 500))
        return
      }

      // In production, this would be a real API call
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          username: 'Options World Bot',
          icon_emoji: ':chart_with_upwards_trend:',
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: message
              }
            }
          ]
        })
      })
    } catch (error) {
      console.error('Failed to send to Slack:', error)
    }
  }

  /**
   * Send message to Discord
   */
  private static async sendToDiscord(message: string, type: string, symbol?: string): Promise<void> {
    const { DISCORD_WEBHOOK_URL: webhookUrl } = getEnvVars()
    if (!webhookUrl) {
      console.warn('Discord webhook URL not configured')
      return
    }

    try {
      // For demo purposes, we'll simulate the API call
      if (import.meta.env.DEV) {
        console.log('DEV MODE: Simulating Discord webhook call')
        await new Promise(resolve => setTimeout(resolve, 500))
        return
      }

      // In production, this would be a real API call
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          username: 'Options World Bot',
          avatar_url: 'https://i.imgur.com/R66g1Pe.jpg',
          embeds: [
            {
              title: type === 'trade_alert' ? `Trading Alert: ${symbol}` : 
                     type === 'analysis' ? 'Market Analysis' : 
                     'Community Update',
              description: message.substring(0, 100) + '...',
              color: type === 'trade_alert' ? 5763719 : 3447003, // Green for trades, blue for others
              footer: {
                text: "Options World Trading Community"
              },
              timestamp: new Date().toISOString()
            }
          ]
        })
      })
    } catch (error) {
      console.error('Failed to send to Discord:', error)
    }
  }

  /**
   * Send message to Telegram
   */
  private static async sendToTelegram(message: string, type: string): Promise<void> {
    const { TELEGRAM_BOT_TOKEN: botToken, TELEGRAM_CHAT_ID: chatId } = getEnvVars()
    
    if (!botToken || !chatId) {
      console.warn('Telegram bot token or chat ID not configured')
      return
    }

    try {
      // For demo purposes, we'll simulate the API call
      if (import.meta.env.DEV) {
        console.log('DEV MODE: Simulating Telegram API call')
        await new Promise(resolve => setTimeout(resolve, 500))
        return
      }

      // In production, this would be a real API call
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      })
    } catch (error) {
      console.error('Failed to send to Telegram:', error)
    }
  }

  /**
   * Share to WhatsApp (opens WhatsApp with pre-filled message)
   */
  private static shareToWhatsApp(message: string): void {
    const { WHATSAPP_GROUP_INVITE: groupInvite } = getEnvVars()
    const encodedMessage = encodeURIComponent(message)
    
    if (groupInvite) {
      window.open(`https://chat.whatsapp.com/${groupInvite}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
    }
  }

  /**
   * Share to Facebook (opens Facebook with pre-filled post)
   */
  private static shareToFacebook(message: string): void {
    const { FACEBOOK_GROUP_ID: groupId } = getEnvVars()
    const encodedMessage = encodeURIComponent(message)
    
    if (groupId) {
      window.open(`https://facebook.com/groups/${groupId}`, '_blank')
    } else {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}&quote=${encodedMessage}`, '_blank')
    }
  }

  /**
   * Format trading alert message
   */
  private static formatTradingAlert(alert: TradingAlert): string {
    const emoji = alert.action === 'buy' ? '🟢' : '🔴'
    const action = alert.action.toUpperCase()
    
    return `${emoji} **TRADING ALERT** ${emoji}

**${action} ${alert.symbol}**
💰 Price: $${alert.price.toFixed(2)}
📊 Quantity: ${alert.quantity}
🎯 Strategy: ${alert.strategy}

**Analysis:**
${alert.reasoning}

⚠️ This is for educational purposes only. Not financial advice.

#OptionsTrading #${alert.symbol} #TradingAlert`
  }

  /**
   * Format market analysis message
   */
  private static formatMarketAnalysis(title: string, analysis: string): string {
    return `📈 **MARKET ANALYSIS** 📈

**${title}**

${analysis}

💡 Join our community for more insights and trading discussions!

#MarketAnalysis #OptionsTrading #TradingCommunity`
  }

  /**
   * Add message to local storage (for demo purposes)
   */
  private static addLocalMessage(messageData: {
    platform: string,
    content: string,
    author: string,
    type: CommunityMessage['type']
  }): void {
    const messages = this.getRecentMessages()
    
    const newMessage: CommunityMessage = {
      id: Date.now().toString(),
      platform: messageData.platform,
      content: messageData.content,
      author: messageData.author,
      timestamp: new Date(),
      type: messageData.type
    }
    
    messages.unshift(newMessage)
    
    // Keep only the most recent 50 messages
    const updatedMessages = messages.slice(0, 50)
    
    localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(updatedMessages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString()
    }))))
    
    // Update stats
    const stats = this.getCommunityStats()
    stats.tradesShared += 1
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats))
  }

  /**
   * Get community statistics
   */
  static getCommunityStats(): {
    totalMembers: number
    activeToday: number
    tradesShared: number
    platformStats: { platform: string; members: number }[]
  } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading community stats:', error)
    }
    
    // Default stats
    return {
      totalMembers: 15420,
      activeToday: 342,
      tradesShared: 1250,
      platformStats: [
        { platform: 'Discord', members: 8500 },
        { platform: 'Telegram', members: 3200 },
        { platform: 'Slack', members: 2100 },
        { platform: 'WhatsApp', members: 1200 },
        { platform: 'Facebook', members: 420 }
      ]
    }
  }

  /**
   * Get recent community messages
   */
  static getRecentMessages(): CommunityMessage[] {
    try {
      const stored = localStorage.getItem(this.MESSAGES_KEY)
      if (stored) {
        const messages = JSON.parse(stored)
        return messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }
    } catch (error) {
      console.error('Error loading community messages:', error)
    }
    
    return []
  }

  /**
   * Check if any platforms are configured
   */
  static hasConfiguredPlatforms(): boolean {
    return this.getConfiguredPlatforms().length > 0
  }

  /**
   * Get platform configuration status
   */
  static getPlatformStatus(): Record<string, boolean> {
    return this.PLATFORMS.reduce((status, platform) => {
      status[platform.id] = platform.isConfigured
      return status
    }, {} as Record<string, boolean>)
  }

  /**
   * Share journal entry to community
   */
  static async shareJournalEntry(entry: TradingJournalEntry, platforms: string[] = []): Promise<void> {
    const message = this.formatJournalEntry(entry)
    const targetPlatforms = platforms.length > 0 
      ? this.PLATFORMS.filter(p => platforms.includes(p.id))
      : this.getConfiguredPlatforms()

    const promises = targetPlatforms.map(platform => 
      this.sendMessage(platform.id, message, 'trade_alert', entry.underlyingTicker)
    )

    try {
      await Promise.allSettled(promises)
      console.log(`Journal entry shared to ${targetPlatforms.length} platforms`)
      
      // Add to local messages for demo
      this.addLocalMessage({
        platform: targetPlatforms[0]?.id || 'discord',
        content: message,
        author: 'You',
        type: 'trade_alert'
      })
    } catch (error) {
      console.error('Failed to share journal entry:', error)
    }
  }

  /**
   * Format journal entry for sharing
   */
  private static formatJournalEntry(entry: TradingJournalEntry): string {
    const outcomeEmoji = entry.outcome === 'win' ? '✅' : entry.outcome === 'loss' ? '❌' : '⚖️'
    
    return `📝 **TRADE JOURNAL** 📝

**${entry.contractTicker} (${entry.underlyingTicker})**
📊 Strategy: ${entry.strategy}
💰 Entry: $${entry.entryPrice.toFixed(2)} | Exit: $${entry.exitPrice?.toFixed(2) || 'Open'}
🔢 Quantity: ${entry.quantity}
${outcomeEmoji} Outcome: ${entry.outcome?.toUpperCase() || 'OPEN'} ${entry.pnl ? `(${entry.pnl >= 0 ? '+' : ''}$${entry.pnl.toFixed(2)})` : ''}

**Reasoning:**
${entry.reasoning}

**Market Context:**
${entry.marketContext}

**Lessons Learned:**
${entry.lessonsLearned}

${entry.tags.map(tag => `#${tag}`).join(' ')}
#TradingJournal #OptionsTrading`
  }

  /**
   * Share options position to community
   */
  static async sharePosition(position: OptionsPosition, platforms: string[] = []): Promise<void> {
    const message = this.formatPosition(position)
    const targetPlatforms = platforms.length > 0 
      ? this.PLATFORMS.filter(p => platforms.includes(p.id))
      : this.getConfiguredPlatforms()

    const promises = targetPlatforms.map(platform => 
      this.sendMessage(platform.id, message, 'trade_alert', position.underlyingTicker)
    )

    try {
      await Promise.allSettled(promises)
      console.log(`Position shared to ${targetPlatforms.length} platforms`)
      
      // Add to local messages for demo
      this.addLocalMessage({
        platform: targetPlatforms[0]?.id || 'discord',
        content: message,
        author: 'You',
        type: 'trade_alert'
      })
    } catch (error) {
      console.error('Failed to share position:', error)
    }
  }

  /**
   * Format position for sharing
   */
  private static formatPosition(position: OptionsPosition): string {
    const emoji = position.unrealizedPnL >= 0 ? '🟢' : '🔴'
    const pnlText = position.unrealizedPnL >= 0 ? '+' : ''
    
    return `${emoji} **POSITION UPDATE** ${emoji}

**${position.contractTicker} (${position.underlyingTicker})**
📊 Type: ${position.contractType.toUpperCase()}
💰 Strike: $${position.strikePrice.toFixed(2)} | Expiry: ${position.expirationDate}
🔢 Quantity: ${position.quantity}
💵 Current Price: $${position.currentPrice.toFixed(2)}
📈 P&L: ${pnlText}$${position.unrealizedPnL.toFixed(2)} (${pnlText}${position.unrealizedPnLPercent.toFixed(2)}%)

**Greeks:**
Delta: ${position.delta.toFixed(3)}
Gamma: ${position.gamma.toFixed(3)}
Theta: ${position.theta.toFixed(3)}
Vega: ${position.vega.toFixed(3)}

#OptionsTrading #${position.underlyingTicker} #PositionUpdate`
  }

  /**
   * Configure a platform (for demo purposes)
   */
  static configurePlatform(platformId: string, config: any): boolean {
    // In a real app, this would save the configuration to a backend
    // For demo, we'll just simulate success
    console.log(`Configuring platform ${platformId} with:`, config)
    
    // Simulate API delay
    return true
  }
}