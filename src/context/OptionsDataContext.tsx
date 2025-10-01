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
  
  const scheduler = OptionsDataScheduler.getInstance()

  // Auto-start scheduler on mount
  useEffect(() => {
    console.log('OptionsDataProvider: Auto-starting scheduler...')
    scheduler.start()

    return () => {
      console.log('OptionsDataProvider: Stopping scheduler on unmount...')
      scheduler.stop()
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
    try {
      await scheduler.triggerManualFetch()
      await refreshStats()
    } catch (error) {
      console.error('Error triggering manual fetch:', error)
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