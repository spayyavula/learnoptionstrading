import { OptionsSentimentService } from './optionsSentimentService'
import { NewsFeedService } from './newsFeedService'
import { FinBERTSentimentService } from './finbertSentimentService'

export class SentimentSyncScheduler {
  private static syncInterval: NodeJS.Timeout | null = null
  private static isRunning = false
  private static readonly DEFAULT_INTERVAL_MS = 60 * 60 * 1000

  static start(intervalMs: number = this.DEFAULT_INTERVAL_MS): void {
    if (this.isRunning) {
      console.log('Sentiment sync scheduler already running')
      return
    }

    console.log(`Starting sentiment sync scheduler with interval: ${intervalMs / 1000 / 60} minutes`)

    this.runSync()

    this.syncInterval = setInterval(() => {
      this.runSync()
    }, intervalMs)

    this.isRunning = true
  }

  static stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.isRunning = false
    console.log('Sentiment sync scheduler stopped')
  }

  private static async runSync(): Promise<void> {
    const startTime = Date.now()
    console.log('===== Starting Sentiment Sync =====')
    console.log(`Time: ${new Date().toISOString()}`)

    try {
      await OptionsSentimentService.syncAllSentiments()

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`===== Sentiment Sync Completed in ${duration}s =====`)
    } catch (error) {
      console.error('Error during sentiment sync:', error)
      console.log('===== Sentiment Sync Failed =====')
    }
  }

  static async syncSpecificTicker(ticker: string): Promise<void> {
    console.log(`Starting sentiment sync for ${ticker}`)

    try {
      const articles = await NewsFeedService.fetchNewsForTicker(ticker, 7)
      console.log(`Fetched ${articles.length} articles for ${ticker}`)

      if (articles.length > 0) {
        const sentiments = await FinBERTSentimentService.analyzeBatch(articles, 10)
        console.log(`Analyzed ${sentiments.length} articles`)
      }

      console.log(`Sentiment sync completed for ${ticker}`)
    } catch (error) {
      console.error(`Error syncing sentiment for ${ticker}:`, error)
    }
  }

  static getStatus(): {
    isRunning: boolean
    interval: number
  } {
    return {
      isRunning: this.isRunning,
      interval: this.DEFAULT_INTERVAL_MS
    }
  }
}

if (typeof window !== 'undefined') {
  const autoStart = import.meta.env.VITE_AUTO_START_SENTIMENT_SYNC === 'true'

  if (autoStart) {
    const intervalMinutes = parseInt(import.meta.env.VITE_SENTIMENT_SYNC_INTERVAL_MINUTES || '60', 10)
    const intervalMs = intervalMinutes * 60 * 1000

    window.addEventListener('load', () => {
      setTimeout(() => {
        SentimentSyncScheduler.start(intervalMs)
      }, 5000)
    })
  }
}
