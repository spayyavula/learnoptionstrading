import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Target, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AnalystRecommendationsService, ConsensusRating, RatingChange } from '../services/analystRecommendationsService'

interface AnalystRatingsDisplayProps {
  ticker: string
  currentPrice?: number
}

export default function AnalystRatingsDisplay({ ticker, currentPrice }: AnalystRatingsDisplayProps) {
  const [consensus, setConsensus] = useState<ConsensusRating | null>(null)
  const [recentChanges, setRecentChanges] = useState<RatingChange[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRatingsData()
  }, [ticker])

  const loadRatingsData = async () => {
    setLoading(true)

    const [consensusData, changesData] = await Promise.all([
      AnalystRecommendationsService.getConsensusRating(ticker),
      AnalystRecommendationsService.getRecentRatingChanges(ticker, 30)
    ])

    setConsensus(consensusData)
    setRecentChanges(changesData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!consensus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No analyst ratings available for {ticker}</p>
      </div>
    )
  }

  const ratingsData = [
    { name: 'Strong Buy', count: consensus.strong_buy_count, color: '#16a34a' },
    { name: 'Buy', count: consensus.buy_count, color: '#22c55e' },
    { name: 'Hold', count: consensus.hold_count, color: '#eab308' },
    { name: 'Sell', count: consensus.sell_count, color: '#f97316' },
    { name: 'Strong Sell', count: consensus.strong_sell_count, color: '#dc2626' }
  ]

  const priceTargetUpside = currentPrice && consensus.average_price_target > 0
    ? ((consensus.average_price_target - currentPrice) / currentPrice) * 100
    : null

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Analyst Ratings</h3>
          </div>
          <div className="text-right">
            <div
              className="text-2xl font-bold"
              style={{ color: AnalystRecommendationsService.getRatingColor(consensus.consensus_rating.toLowerCase().replace(' ', '_')) }}
            >
              {consensus.consensus_rating}
            </div>
            <div className="text-sm text-gray-600">Consensus ({consensus.total_analysts} analysts)</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Avg Price Target</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${consensus.average_price_target.toFixed(2)}
            </div>
            {priceTargetUpside !== null && (
              <div className={`text-sm font-medium mt-1 ${priceTargetUpside >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {priceTargetUpside >= 0 ? '+' : ''}{priceTargetUpside.toFixed(1)}% upside
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">High Target</div>
            <div className="text-2xl font-bold text-green-600">
              ${consensus.high_price_target.toFixed(2)}
            </div>
            {currentPrice && (
              <div className="text-sm text-gray-500 mt-1">
                +{(((consensus.high_price_target - currentPrice) / currentPrice) * 100).toFixed(1)}%
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Low Target</div>
            <div className="text-2xl font-bold text-red-600">
              ${consensus.low_price_target.toFixed(2)}
            </div>
            {currentPrice && (
              <div className="text-sm text-gray-500 mt-1">
                {(((consensus.low_price_target - currentPrice) / currentPrice) * 100).toFixed(1)}%
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ratingsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#6b7280" width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {ratingsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {ratingsData.map((rating) => (
            <div key={rating.name} className="text-center">
              <div className="text-2xl font-bold" style={{ color: rating.color }}>
                {rating.count}
              </div>
              <div className="text-xs text-gray-600">{rating.name}</div>
            </div>
          ))}
        </div>
      </div>

      {recentChanges.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Recent Rating Changes</h4>
          <div className="space-y-3">
            {recentChanges.map((change, index) => {
              const isUpgrade = change.change_type === 'upgrade'
              return (
                <div
                  key={index}
                  className={`border-l-4 pl-4 py-3 ${
                    isUpgrade
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isUpgrade ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-semibold ${isUpgrade ? 'text-green-900' : 'text-red-900'}`}>
                          {change.analyst_firm}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 ml-7">
                        {AnalystRecommendationsService.getRatingLabel(change.old_rating)} → {AnalystRecommendationsService.getRatingLabel(change.new_rating)}
                        {change.price_target && (
                          <span className="ml-2 text-gray-600">
                            (Target: ${change.price_target.toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(change.change_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {priceTargetUpside !== null && (
        <div className={`rounded-lg p-4 ${
          priceTargetUpside > 20
            ? 'bg-green-50 border-2 border-green-300'
            : priceTargetUpside > 0
            ? 'bg-blue-50 border-2 border-blue-300'
            : 'bg-red-50 border-2 border-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {priceTargetUpside > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <div>
              <div className="font-semibold text-gray-900">
                {priceTargetUpside > 20
                  ? 'Strong Upside Potential'
                  : priceTargetUpside > 0
                  ? 'Moderate Upside Potential'
                  : 'Limited Upside'}
              </div>
              <div className="text-sm text-gray-600">
                {consensus.total_analysts} analysts project {priceTargetUpside >= 0 ? 'an average' : 'a'} {Math.abs(priceTargetUpside).toFixed(1)}% {priceTargetUpside >= 0 ? 'gain' : 'decline'} to ${consensus.average_price_target.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
