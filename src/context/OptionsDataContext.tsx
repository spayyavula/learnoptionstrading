import React, { createContext, useContext, useEffect, useState } from 'react'
import { OptionsDataScheduler } from '../services/optionsDataScheduler'
import { PolygonOptionsDataService } from '../services/polygonOptionsDataService'

interface OptionsDataContextType {
  schedulerStatus: {
    active: boolean
    nextFetchTime: Date | null
    timeUntilNextFetch: number | null
  }
  dataStats: {
    lastFetch: Date | null
    totalContracts: number
    dataPoints: number
    nextScheduledFetch: Date
  }
  isLoading: boolean
  startScheduler: () => void
  stopScheduler: () => void
  triggerManualFetch: () => Promise<void>
  refreshStats: () => Promise<void>
}

const OptionsDataContext = createContext<OptionsDataContextType | null>(null)

export function OptionsDataProvider({ children }: { children: React.ReactNode }) {
  const [schedulerStatus, setSchedulerStatus] = useState({
    active: false,
    nextFetchTime: null as Date | null,
    timeUntilNextFetch: null as number | null
  })

  const [dataStats, setDataStats] = useState({
    lastFetch: null as Date | null,
    totalContracts: 0,
    dataPoints: 0,
    nextScheduledFetch: new Date()
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scheduler = OptionsDataScheduler.getInstance()

  // Auto-start scheduler on mount with error handling
  useEffect(() => {
    const startSchedulerSafely = async () => {
      try {
        console.log('OptionsDataProvider: Auto-starting scheduler...')

        const dataPersistenceEnabled = import.meta.env.VITE_ENABLE_DATA_PERSISTENCE === 'true'
        if (!dataPersistenceEnabled) {
          console.warn('⚠️ Data persistence is disabled. Historical data will not be stored.')
          setError('Data persistence is disabled. Enable VITE_ENABLE_DATA_PERSISTENCE in your .env file.')
        }

        scheduler.start()
        setError(null)
      } catch (err) {
        console.error('Failed to start options data scheduler:', err)
        setError(`Failed to start scheduler: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    startSchedulerSafely()

    return () => {
      try {
        console.log('OptionsDataProvider: Stopping scheduler on unmount...')
        scheduler.stop()
      } catch (err) {
        console.error('Error stopping scheduler:', err)
      }
    }
  }, [scheduler])

  // Update scheduler status periodically
  useEffect(() => {
    const updateStatus = () => {
      setSchedulerStatus(scheduler.getStatus())
    }

    updateStatus()
    const interval = setInterval(updateStatus, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [scheduler])

  // Load initial data stats
  useEffect(() => {
    refreshStats()
  }, [])

  const startScheduler = () => {
    scheduler.start()
    setSchedulerStatus(scheduler.getStatus())
  }

  const stopScheduler = () => {
    scheduler.stop()
    setSchedulerStatus(scheduler.getStatus())
  }

  const triggerManualFetch = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await scheduler.triggerManualFetch()
      await refreshStats()
      console.log('Manual fetch completed successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during fetch'
      console.error('Error triggering manual fetch:', error)
      setError(`Failed to fetch data: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshStats = async () => {
    try {
      const stats = await PolygonOptionsDataService.getDataFetchStats()
      setDataStats(stats)
    } catch (error) {
      console.error('Error refreshing stats:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh stats')
    }
  }

  return (
    <OptionsDataContext.Provider value={{
      schedulerStatus,
      dataStats,
      isLoading,
      startScheduler,
      stopScheduler,
      triggerManualFetch,
      refreshStats
    }}>
      {children}
    </OptionsDataContext.Provider>
  )
}

export function useOptionsData() {
  const context = useContext(OptionsDataContext)
  if (!context) {
    throw new Error('useOptionsData must be used within an OptionsDataProvider')
  }
  return context
}