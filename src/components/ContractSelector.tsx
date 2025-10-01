import React, { useState, useMemo } from 'react'
import { Search, TrendingUp, TrendingDown, Activity, Info } from 'lucide-react'
import { OptionsContract } from '../types/options'
import { GreeksCalculator } from '../services/greeksCalculator'

interface ContractSelectorProps {
  contracts: OptionsContract[]
  onSelectContract: (contract: OptionsContract) => void
  selectedContract?: OptionsContract | null
  underlyingPrice: number
}

type SortField = 'strike' | 'volume' | 'openInterest' | 'iv' | 'delta' | 'last'
type SortDirection = 'asc' | 'desc'

export default function ContractSelector({
  contracts,
  onSelectContract,
  selectedContract,
  underlyingPrice
}: ContractSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'call' | 'put'>('all')
  const [filterMoneyness, setFilterMoneyness] = useState<'all' | 'itm' | 'atm' | 'otm'>('all')
  const [liquidOnly, setLiquidOnly] = useState(true)
  const [sortField, setSortField] = useState<SortField>('volume')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const filteredAndSortedContracts = useMemo(() => {
    let filtered = contracts.filter(contract => {
      if (searchTerm && !contract.ticker.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      if (filterType !== 'all' && contract.contract_type !== filterType) {
        return false
      }

      if (liquidOnly && contract.volume === 0 && contract.open_interest === 0) {
        return false
      }

      if (filterMoneyness !== 'all') {
        const isCall = contract.contract_type === 'call'
        const isITM = isCall
          ? underlyingPrice > contract.strike_price
          : underlyingPrice < contract.strike_price
        const isATM = Math.abs(underlyingPrice - contract.strike_price) / underlyingPrice < 0.05

        if (filterMoneyness === 'itm' && !isITM) return false
        if (filterMoneyness === 'atm' && !isATM) return false
        if (filterMoneyness === 'otm' && (isITM || isATM)) return false
      }

      return true
    })

    filtered.sort((a, b) => {
      let aValue: number, bValue: number

      switch (sortField) {
        case 'strike':
          aValue = a.strike_price
          bValue = b.strike_price
          break
        case 'volume':
          aValue = a.volume
          bValue = b.volume
          break
        case 'openInterest':
          aValue = a.open_interest
          bValue = b.open_interest
          break
        case 'iv':
          aValue = a.implied_volatility
          bValue = b.implied_volatility
          break
        case 'delta':
          aValue = Math.abs(a.delta)
          bValue = Math.abs(b.delta)
          break
        case 'last':
          aValue = a.last
          bValue = b.last
          break
        default:
          return 0
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [contracts, searchTerm, filterType, filterMoneyness, liquidOnly, sortField, sortDirection, underlyingPrice])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getMoneyness = (contract: OptionsContract): { label: string; color: string } => {
    const isCall = contract.contract_type === 'call'
    const isITM = isCall
      ? underlyingPrice > contract.strike_price
      : underlyingPrice < contract.strike_price
    const isATM = Math.abs(underlyingPrice - contract.strike_price) / underlyingPrice < 0.05

    if (isATM) return { label: 'ATM', color: 'bg-yellow-100 text-yellow-800' }
    if (isITM) return { label: 'ITM', color: 'bg-green-100 text-green-800' }
    return { label: 'OTM', color: 'bg-gray-100 text-gray-800' }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getLiquidityScore = (contract: OptionsContract): { score: number; color: string } => {
    const volumeScore = Math.min(contract.volume / 1000, 1) * 0.4
    const oiScore = Math.min(contract.open_interest / 5000, 1) * 0.4
    const spreadScore = contract.ask > 0 ? Math.max(0, 1 - ((contract.ask - contract.bid) / contract.ask)) * 0.2 : 0

    const totalScore = (volumeScore + oiScore + spreadScore) * 100

    if (totalScore >= 70) return { score: totalScore, color: 'text-green-600' }
    if (totalScore >= 40) return { score: totalScore, color: 'text-yellow-600' }
    return { score: totalScore, color: 'text-red-600' }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Selection</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ticker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="call">Calls Only</option>
            <option value="put">Puts Only</option>
          </select>

          <select
            value={filterMoneyness}
            onChange={(e) => setFilterMoneyness(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Moneyness</option>
            <option value="itm">In-The-Money</option>
            <option value="atm">At-The-Money</option>
            <option value="otm">Out-of-The-Money</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={liquidOnly}
              onChange={(e) => setLiquidOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Liquid contracts only</span>
          </label>
          <span className="text-sm text-gray-600">
            {filteredAndSortedContracts.length} of {contracts.length} contracts
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('strike')}
              >
                Strike {sortField === 'strike' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Moneyness
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('last')}
              >
                Last {sortField === 'last' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bid/Ask
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('volume')}
              >
                Volume {sortField === 'volume' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('openInterest')}
              >
                OI {sortField === 'openInterest' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('iv')}
              >
                IV {sortField === 'iv' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('delta')}
              >
                Delta {sortField === 'delta' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Liquidity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedContracts.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                  No contracts found matching your filters
                </td>
              </tr>
            ) : (
              filteredAndSortedContracts.map((contract) => {
                const moneyness = getMoneyness(contract)
                const liquidity = getLiquidityScore(contract)
                const isSelected = selectedContract?.ticker === contract.ticker

                return (
                  <tr
                    key={contract.ticker}
                    onClick={() => onSelectContract(contract)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {contract.ticker}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          contract.contract_type === 'call'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {contract.contract_type === 'call' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {contract.contract_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(contract.strike_price)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${moneyness.color}`}>
                        {moneyness.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(contract.last)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCurrency(contract.bid)} / {formatCurrency(contract.ask)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {contract.volume.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {contract.open_interest.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatPercent(contract.implied_volatility)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {contract.delta.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <Activity className={`h-4 w-4 mr-1 ${liquidity.color}`} />
                        <span className={`font-medium ${liquidity.color}`}>
                          {liquidity.score.toFixed(0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredAndSortedContracts.length > 0 && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Click on a row to select a contract. Liquidity score considers volume, open interest, and bid-ask spread.
              Higher scores indicate more liquid contracts with tighter spreads.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
