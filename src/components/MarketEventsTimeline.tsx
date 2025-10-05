import React, { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { MarketEventsService, MarketEvent } from '../services/marketEventsService'

interface MarketEventsTimelineProps {
  ticker: string
  daysAhead?: number
  daysBack?: number
  onEventClick?: (event: MarketEvent) => void
}

export default function MarketEventsTimeline({
  ticker,
  daysAhead = 30,
  daysBack = 90,
  onEventClick
}: MarketEventsTimelineProps) {
  const [events, setEvents] = useState<MarketEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'future' | 'past'>('all')

  useEffect(() => {
    loadEvents()
  }, [ticker, daysAhead, daysBack])

  const loadEvents = async () => {
    setLoading(true)
    const data = await MarketEventsService.getMarketEvents(ticker, daysAhead, daysBack)
    setEvents(data)
    setLoading(false)
  }

  const getFilteredEvents = () => {
    if (filter === 'future') {
      return events.filter(e => e.is_future_event)
    } else if (filter === 'past') {
      return events.filter(e => !e.is_future_event)
    }
    return events
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, string> = {
      earnings: '📊',
      fda_approval: '💊',
      merger: '🤝',
      dividend: '💰',
      stock_split: '✂️',
      product_launch: '🚀',
      guidance_update: '📈',
      regulatory: '⚖️',
      economic_data: '📉',
      other: '📌'
    }
    return icons[eventType] || '📌'
  }

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[severity] || colors.medium}`}>
        {severity.toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const filteredEvents = getFilteredEvents()

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Market Events Timeline</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('future')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'future'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Historical
            </button>
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          {ticker} has {filteredEvents.length} {filter !== 'all' ? filter : ''} event{filteredEvents.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No events found for this period</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event, index) => {
              const daysUntil = MarketEventsService.getDaysUntilEvent(event.event_date)
              const isPast = daysUntil < 0
              const isToday = daysUntil === 0
              const isNear = daysUntil > 0 && daysUntil <= 7

              return (
                <div
                  key={event.id || index}
                  onClick={() => onEventClick?.(event)}
                  className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                    isToday
                      ? 'border-blue-500 bg-blue-50'
                      : isNear
                      ? 'border-orange-300 bg-orange-50'
                      : isPast
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getEventIcon(event.event_type)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.event_title}</h4>
                          <p className="text-sm text-gray-600">
                            {formatDate(event.event_date)}
                            {!isPast && (
                              <span className="ml-2 text-blue-600 font-medium">
                                {isToday ? '(Today)' : `(in ${daysUntil} day${daysUntil === 1 ? '' : 's'})`}
                              </span>
                            )}
                            {isPast && (
                              <span className="ml-2 text-gray-500">
                                ({Math.abs(daysUntil)} day{Math.abs(daysUntil) === 1 ? '' : 's'} ago)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {event.event_description && (
                        <p className="text-sm text-gray-700 mb-3 ml-11">{event.event_description}</p>
                      )}

                      <div className="flex items-center gap-3 ml-11">
                        {getSeverityBadge(event.impact_severity)}
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {event.event_type.replace('_', ' ').toUpperCase()}
                        </span>
                        {event.surprise_factor !== undefined && event.surprise_factor !== null && (
                          <span
                            className={`text-xs px-2 py-1 rounded font-medium ${
                              event.surprise_factor > 10
                                ? 'bg-green-100 text-green-800'
                                : event.surprise_factor < -10
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {event.surprise_factor > 0 ? '+' : ''}
                            {event.surprise_factor.toFixed(1)}% vs Est.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
