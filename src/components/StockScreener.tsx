import React, { useState, useEffect, useMemo } from 'react'
import { Search, Info, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { OptionsScreenerService, type ScreenerResult, type ScreenerFilters } from '../services/optionsScreenerService'
import ScreenerHeatMap from './ScreenerHeatMap'

export default function StockScreener() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSector, setSelectedSector] = useState('ALL')
  const [selectedExpiry, setSelectedExpiry] = useState('October')
  const [liquidOnly, setLiquidOnly] = useState(true)
  const [upcomingEvents, setUpcomingEvents] = useState(false)
  const [oiAction, setOiAction] = useState<'bullish' | 'bearish' | null>(null)
  const [longBuildup, setLongBuildup] = useState(false)
  const [shortCover, setShortCover] = useState(false)
  const [longUnwind, setLongUnwind] = useState(false)
  const [shortBuildup, setShortBuildup] = useState(false)
  const [activeView, setActiveView] = useState<'table' | 'heatmap'>('table')
  const [sortConfig, setSortConfig] = useState<{ key: keyof ScreenerResult; direction: 'asc' | 'desc' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [screenerData, setScreenerData] = useState<ScreenerResult[]>([])

  const sectors = ['ALL', 'INDEX', 'TECHNOLOGY', 'FINANCE', 'HEALTHCARE', 'CONSUMER', 'ENERGY', 'INDUSTRIAL', 'AUTO', 'ENTERTAINMENT', 'TELECOM', 'DEFENSE']
  const expiryDates = ['October', 'November', 'December', 'January', 'February']

  useEffect(() => {
    loadScreenerData()
  }, [selectedExpiry, liquidOnly])

  const loadScreenerData = async () => {
    setLoading(true)
    try {
      const filters: ScreenerFilters = {
        expiry: selectedExpiry,
        liquidOnly,
        upcomingEvents,
        sector: selectedSector !== 'ALL' ? selectedSector : undefined
      }
      const data = await OptionsScreenerService.getScreenerData(filters)
      setScreenerData(data)
    } catch (error) {
      console.error('Error loading screener data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    let filtered = [...screenerData]

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.stock.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedSector !== 'ALL') {
      filtered = filtered.filter(item => item.sector === selectedSector)
    }

    if (oiAction === 'bullish') {
      filtered = filtered.filter(item => {
        if (longBuildup) return item.oiAction === 'Long Buildup'
        if (shortCover) return item.oiAction === 'Short Cover'
        return item.oiAction === 'Long Buildup' || item.oiAction === 'Short Cover'
      })
    }

    if (oiAction === 'bearish') {
      filtered = filtered.filter(item => {
        if (longUnwind) return item.oiAction === 'Long Unwind'
        if (shortBuildup) return item.oiAction === 'Short Buildup'
        return item.oiAction === 'Long Unwind' || item.oiAction === 'Short Buildup'
      })
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
        }

        return 0
      })
    }

    return filtered
  }, [screenerData, searchTerm, selectedSector, oiAction, longBuildup, shortCover, longUnwind, shortBuildup, sortConfig])

  const handleSort = (key: keyof ScreenerResult) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'desc' }
      }
      if (current.direction === 'desc') {
        return { key, direction: 'asc' }
      }
      return null
    })
  }

  const getSortIcon = (key: keyof ScreenerResult) => {
    if (!sortConfig || sortConfig.key !== key) return '↕'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const getOIActionColor = (action?: string) => {
    switch (action) {
      case 'Long Buildup':
        return 'text-green-600 font-medium'
      case 'Short Cover':
        return 'text-green-500'
      case 'Long Unwind':
        return 'text-red-500'
      case 'Short Buildup':
        return 'text-red-600 font-medium'
      default:
        return 'text-gray-600'
    }
  }

  const getPCRColor = (pcr: number) => {
    if (pcr > 1.5) return 'text-green-600 font-medium'
    if (pcr > 1.0) return 'text-green-500'
    if (pcr < 0.5) return 'text-red-600 font-medium'
    if (pcr < 0.7) return 'text-red-500'
    return 'text-gray-900'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">US Stock Options Screener</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-700 font-medium">Live Data</span>
            </div>
          </div>
          <p className="text-gray-600">Real-time options data for DOW 30 and NASDAQ stocks with advanced filtering</p>
        </div>

        <div className="flex gap-6">
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sticky top-4">
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Eg: AAPL, TSLA, NVDA"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sector</label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry</label>
                <select
                  value={selectedExpiry}
                  onChange={(e) => setSelectedExpiry(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  {expiryDates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
                {selectedExpiry === 'October' && (
                  <div className="flex items-center mt-2 px-2 py-1 bg-orange-50 rounded text-xs text-orange-700">
                    <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>Expiry missing?</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-5 pb-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-700">Liquid only</span>
                    <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" title="Filter by liquid options with high volume" />
                  </div>
                  <button
                    onClick={() => setLiquidOnly(!liquidOnly)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      liquidOnly ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        liquidOnly ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Upcoming events</span>
                  <button
                    onClick={() => setUpcomingEvents(!upcomingEvents)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      upcomingEvents ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        upcomingEvents ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-gray-700">OI action</span>
                  <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" title="Filter by Open Interest action patterns" />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      if (oiAction === 'bullish') {
                        setOiAction(null)
                        setLongBuildup(false)
                        setShortCover(false)
                      } else {
                        setOiAction('bullish')
                        setLongUnwind(false)
                        setShortBuildup(false)
                      }
                    }}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                      oiAction === 'bullish' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Bullish</span>
                  </button>

                  {oiAction === 'bullish' && (
                    <div className="ml-7 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-700">Long buildup</span>
                        <button
                          onClick={() => setLongBuildup(!longBuildup)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            longBuildup ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                              longBuildup ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-700">Short cover</span>
                        <button
                          onClick={() => setShortCover(!shortCover)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            shortCover ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                              shortCover ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (oiAction === 'bearish') {
                        setOiAction(null)
                        setLongUnwind(false)
                        setShortBuildup(false)
                      } else {
                        setOiAction('bearish')
                        setLongBuildup(false)
                        setShortCover(false)
                      }
                    }}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                      oiAction === 'bearish' ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    <span>Bearish</span>
                  </button>

                  {oiAction === 'bearish' && (
                    <div className="ml-7 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-700">Long unwind</span>
                        <button
                          onClick={() => setLongUnwind(!longUnwind)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            longUnwind ? 'bg-red-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                              longUnwind ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-700">Short buildup</span>
                        <button
                          onClick={() => setShortBuildup(!shortBuildup)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            shortBuildup ? 'bg-red-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                              shortBuildup ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveView('table')}
                    className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                      activeView === 'table'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setActiveView('heatmap')}
                    className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                      activeView === 'heatmap'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Heat Map
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{filteredData.length}</span> stocks found
                </div>
              </div>

              {activeView === 'table' && (
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
                        <p className="text-gray-600 text-sm">Loading screener data...</p>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th
                            onClick={() => handleSort('stock')}
                            className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              Stock {getSortIcon('stock')}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('futPrice')}
                            className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              Fut Price {getSortIcon('futPrice')}
                              <Info className="h-3 w-3 text-gray-400" />
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('atmIv')}
                            className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              ATM IV {getSortIcon('atmIv')}
                              <Info className="h-3 w-3 text-gray-400" />
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('ivChg')}
                            className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              IV Chg {getSortIcon('ivChg')}
                              <Info className="h-3 w-3 text-gray-400" />
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('ivp')}
                            className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              IVP {getSortIcon('ivp')}
                              <Info className="h-3 w-3 text-gray-400" />
                            </div>
                          </th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Result
                          </th>
                          <th
                            onClick={() => handleSort('oiChgPct')}
                            className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              OI % Chg. {getSortIcon('oiChgPct')}
                              <Info className="h-3 w-3 text-gray-400" />
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('pcr')}
                            className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              PCR {getSortIcon('pcr')}
                              <Info className="h-3 w-3 text-gray-400" />
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('maxPain')}
                            className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            Max Pain {getSortIcon('maxPain')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors cursor-pointer">
                            <td className="px-4 py-3.5 text-sm">
                              <div>
                                <div className="font-semibold text-gray-900">{item.stock}</div>
                                {item.oiAction && (
                                  <div className={`text-xs mt-0.5 ${getOIActionColor(item.oiAction)}`}>
                                    {item.oiAction}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-sm">
                              <div>
                                <div className="font-semibold text-gray-900">{item.futPrice.toFixed(2)}</div>
                                <div className={`text-xs font-medium mt-0.5 ${
                                  item.priceChgPct >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {item.priceChgPct >= 0 ? '+' : ''}{item.priceChgPct.toFixed(1)}%
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-sm font-medium text-gray-900">
                              {item.atmIv.toFixed(1)}
                            </td>
                            <td className="px-4 py-3.5 text-sm">
                              <span className={`font-medium ${item.ivChg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.ivChg >= 0 ? '+' : ''}{item.ivChg.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-gray-900">{item.ivp}</span>
                                <Info className="h-3 w-3 text-gray-400" />
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-gray-700 font-medium">
                              {item.result}
                            </td>
                            <td className="px-4 py-3.5 text-sm">
                              <span className={`font-medium ${item.oiChgPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.oiChgPct.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-sm">
                              <div className="flex items-center gap-1">
                                <span className={`font-semibold ${getPCRColor(item.pcr)}`}>
                                  {item.pcr.toFixed(2)}
                                </span>
                                <Info className="h-3 w-3 text-gray-400" />
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">
                              {item.maxPain}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {!loading && filteredData.length === 0 && (
                    <div className="text-center py-16">
                      <div className="text-gray-400 mb-3">
                        <Search className="h-12 w-12 mx-auto" />
                      </div>
                      <p className="text-gray-600 font-medium mb-1">No results found</p>
                      <p className="text-sm text-gray-500">Try adjusting your filters</p>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'heatmap' && (
                <ScreenerHeatMap data={filteredData} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
