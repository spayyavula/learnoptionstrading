import { PolygonOptionsDataService } from './polygonOptionsDataService'

/**
 * Options Data Scheduler Service
 * Handles scheduling and coordination of options data fetching
 */
export class OptionsDataScheduler {
  private static instance: OptionsDataScheduler | null = null
  private schedulerActive = false
  private currentTimeout: number | null = null

  private constructor() {}

  static getInstance(): OptionsDataScheduler {
    if (!this.instance) {
      this.instance = new OptionsDataScheduler()
    }
    return this.instance
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.schedulerActive) {
      console.log('Options data scheduler is already running')
      return
    }

    console.log('Starting options data scheduler...')
    this.schedulerActive = true
    this.scheduleNextFetch()

    // Run initial fetch after a short delay
    globalThis.setTimeout(() => {
      this.runDataFetch().catch(error => {
        console.error('Error in initial options data fetch:', error)
      })
    }, 10000) // 10 seconds delay for initial fetch
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    console.log('Stopping options data scheduler...')
    this.schedulerActive = false
    
    if (this.currentTimeout) {
      try {
        globalThis.clearTimeout(this.currentTimeout)
      } catch (error) {
        console.error('Error clearing timeout:', error)
      }
      this.currentTimeout = null
    }
  }

  /**
   * Schedule the next data fetch
   */
  private scheduleNextFetch(): void {
    if (!this.schedulerActive) return

    try {
      const nextFetchTime = this.calculateNextFetchTime()
      const timeUntilFetch = Math.max(1000, nextFetchTime.getTime() - Date.now()) // Minimum 1 second

      console.log(`Next options data fetch scheduled for: ${nextFetchTime.toISOString()}`)
      console.log(`Time until next fetch: ${Math.round(timeUntilFetch / 1000 / 60)} minutes`)

      this.currentTimeout = globalThis.setTimeout(() => {
        this.runDataFetch().catch(error => {
          console.error('Error in scheduled options data fetch:', error)
          // Continue scheduling even if this fetch failed
          this.scheduleNextFetch()
        })
      }, timeUntilFetch)
    } catch (error) {
      console.error('Error scheduling next fetch:', error)
      // Fallback: try again in 1 hour
      this.currentTimeout = globalThis.setTimeout(() => {
        this.scheduleNextFetch()
      }, 60 * 60 * 1000)
    }
  }

  /**
   * Calculate the next fetch time (after market close)
   */
  private calculateNextFetchTime(): Date {
    const now = new Date()
    
    // Convert to EST
    const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}))
    
    // Set target time to 6 PM EST (1 hour after market close)
    const nextFetch = new Date(est)
    nextFetch.setHours(18, 0, 0, 0)

    // If it's already past 6 PM today, schedule for next business day
    if (est >= nextFetch) {
      nextFetch.setDate(nextFetch.getDate() + 1)
    }

    // Skip weekends
    while (nextFetch.getDay() === 0 || nextFetch.getDay() === 6) {
      nextFetch.setDate(nextFetch.getDate() + 1)
    }

    // Convert back to local time
    return new Date(nextFetch.toLocaleString())
  }

  /**
   * Run the data fetch process
   */
  private async runDataFetch(): Promise<void> {
    if (!this.schedulerActive) return

    try {
      console.log('Running scheduled options data fetch...')
      await PolygonOptionsDataService.fetchAndStoreOptionsData()
      console.log('Scheduled options data fetch completed successfully')
    } catch (error) {
      console.error('Error in scheduled options data fetch:', error)
    }

    // Schedule the next fetch
    this.scheduleNextFetch()
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    active: boolean
    nextFetchTime: Date | null
    timeUntilNextFetch: number | null
  } {
    const nextFetchTime = this.schedulerActive ? this.calculateNextFetchTime() : null
    const timeUntilNextFetch = nextFetchTime ? nextFetchTime.getTime() - Date.now() : null

    return {
      active: this.schedulerActive,
      nextFetchTime,
      timeUntilNextFetch
    }
  }

  /**
   * Trigger manual fetch
   */
  async triggerManualFetch(): Promise<void> {
    console.log('Manual options data fetch triggered via scheduler...')
    await PolygonOptionsDataService.triggerManualFetch()
  }
}