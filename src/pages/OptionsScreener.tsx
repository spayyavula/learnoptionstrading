import React from 'react'
import StockScreener from '../components/StockScreener'

export default function OptionsScreener() {
  return <StockScreener />
}

function OptionsScreenerLegacy() {
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

  const sectors = ['ALL', 'BANK', 'IT', 'PHARMA', 'AUTO', 'ENERGY', 'FMCG', 'METAL']
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Options Screener</h1>
          <p className="text-gray-600">Filter and analyze options data across stocks</p>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Eg: HDFCBANK"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>

              {/* Expiry */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                <select
                  value={selectedExpiry}
                  onChange={(e) => setSelectedExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {expiryDates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
                <div className="flex items-center mt-2 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span>Expiry missing?</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700">Liquid only</span>
                    <Info className="h-3 w-3 ml-1 text-gray-400" />
                  </div>
                  <button
                    onClick={() => setLiquidOnly(!liquidOnly)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      liquidOnly ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        liquidOnly ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Upcoming events</span>
                  <button
                    onClick={() => setUpcomingEvents(!upcomingEvents)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      upcomingEvents ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        upcomingEvents ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* OI Action */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">OI action</span>
                  <Info className="h-3 w-3 ml-1 text-gray-400" />
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setOiAction(oiAction === 'bullish' ? null : 'bullish')}
                    className={`flex items-center text-sm ${
                      oiAction === 'bullish' ? 'text-green-600 font-medium' : 'text-gray-600'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Bullish
                  </button>

                  {oiAction === 'bullish' && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Long buildup</span>
                        <button
                          onClick={() => setLongBuildup(!longBuildup)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            longBuildup ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              longBuildup ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Short cover</span>
                        <button
                          onClick={() => setShortCover(!shortCover)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            shortCover ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              shortCover ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setOiAction(oiAction === 'bearish' ? null : 'bearish')}
                    className={`flex items-center text-sm ${
                      oiAction === 'bearish' ? 'text-red-600 font-medium' : 'text-gray-600'
                    }`}
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Bearish
                  </button>

                  {oiAction === 'bearish' && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Long unwind</span>
                        <button
                          onClick={() => setLongUnwind(!longUnwind)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            longUnwind ? 'bg-red-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              longUnwind ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Short buildup</span>
                        <button
                          onClick={() => setShortBuildup(!shortBuildup)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            shortBuildup ? 'bg-red-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
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

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* View Toggle */}
              <div className="border-b border-gray-200 px-4 py-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveView('table')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeView === 'table'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setActiveView('heatmap')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeView === 'heatmap'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Heat Map
                  </button>
                </div>
              </div>

              {/* Table */}
              {activeView === 'table' && (
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th
                            onClick={() => handleSort('stock')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          >
                            Stock {getSortIcon('stock')}
                          </th>
                          <th
                            onClick={() => handleSort('futPrice')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              Fut Price {getSortIcon('futPrice')}
                              <Info className="h-3 w-3 ml-1 text-gray-400" />
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('atmIv')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              ATM IV {getSortIcon('atmIv')}
                              <Info className="h-3 w-3 ml-1 text-gray-400" />
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('ivChg')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              IV Chg {getSortIcon('ivChg')}
                              <Info className="h-3 w-3 ml-1 text-gray-400" />
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('ivp')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              IVP {getSortIcon('ivp')}
                              <Info className="h-3 w-3 ml-1 text-gray-400" />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Result
                          </th>
                          <th
                            onClick={() => handleSort('oiChgPct')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              OI % Chg. {getSortIcon('oiChgPct')}
                              <Info className="h-3 w-3 ml-1 text-gray-400" />
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('pcr')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              PCR {getSortIcon('pcr')}
                              <Info className="h-3 w-3 ml-1 text-gray-400" />
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('maxPain')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          >
                            Max Pain {getSortIcon('maxPain')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {item.stock}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center">
                                <span className="font-medium">{item.futPrice.toFixed(2)}</span>
                                <span className={`ml-2 text-xs ${
                                  item.priceChgPct >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {item.priceChgPct >= 0 ? '+' : ''}{item.priceChgPct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.atmIv.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={item.ivChg >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {item.ivChg >= 0 ? '+' : ''}{item.ivChg.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.ivp}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {item.result}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={item.oiChgPct >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {item.oiChgPct.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center">
                                <span>{item.pcr.toFixed(2)}</span>
                                <Info className="h-3 w-3 ml-1 text-gray-400" />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {item.maxPain}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {!loading && filteredData.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No results found. Try adjusting your filters.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Heatmap View */}
              {activeView === 'heatmap' && (
                <div className="p-8 text-center">
                  <p className="text-gray-500">Heatmap view coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
