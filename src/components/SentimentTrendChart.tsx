import React, { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { OptionsSentimentService, type SentimentTrend } from '../services/optionsSentimentService'
import { TrendingUp, BarChart3 } from 'lucide-react'

interface SentimentTrendChartProps {
  ticker: string
  daysBack?: number
  height?: number
}

export function SentimentTrendChart({ ticker, daysBack = 7, height = 300 }: SentimentTrendChartProps) {
  const [trends, setTrends] = useState<SentimentTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<'line' | 'area'>('area')

  useEffect(() => {
    loadTrends()
  }, [ticker, daysBack])

  const loadTrends = async () => {
    setLoading(true)
    try {
      const data = await OptionsSentimentService.getSentimentTrends(ticker, daysBack)
      setTrends(data)
    } catch (error) {
      console.error('Error loading sentiment trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = React.useMemo(() => {
    return trends.map(trend => ({
      time: `${trend.date} ${trend.hour}:00`,
      score: trend.sentiment_score,
      volume: trend.volume,
      momentum: trend.momentum,
      category: trend.sentiment_category
    }))
  }, [trends])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{data.time}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Score:</span>
              <span
                className="font-semibold"
                style={{ color: OptionsSentimentService.getSentimentColor(data.score) }}
              >
                {data.score.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Volume:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{data.volume}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Momentum:</span>
              <span className={`font-semibold ${data.momentum > 0 ? 'text-green-600' : data.momentum < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {data.momentum > 0 ? '+' : ''}{data.momentum.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Category:</span>
              <span className="font-semibold text-gray-900 dark:text-white capitalize">
                {data.category.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (trends.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400" style={{ height }}>
          <BarChart3 className="w-12 h-12 mb-2" />
          <p>No sentiment trend data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sentiment Trend - {ticker}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartType === 'line'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartType === 'area'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Area
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9ca3af' }}
              domain={[-100, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Sentiment Score"
            />
          </LineChart>
        ) : (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9ca3af' }}
              domain={[-100, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorScore)"
              name="Sentiment Score"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-gray-600 dark:text-gray-400 mb-1">Average Score</div>
          <div
            className="text-xl font-bold"
            style={{
              color: OptionsSentimentService.getSentimentColor(
                chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length
              )
            }}
          >
            {(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length).toFixed(1)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-gray-600 dark:text-gray-400 mb-1">Total Articles</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {chartData.reduce((sum, d) => sum + d.volume, 0)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-gray-600 dark:text-gray-400 mb-1">Trend Direction</div>
          <div className="flex items-center gap-2">
            {chartData[chartData.length - 1]?.momentum > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingUp className="w-5 h-5 text-red-500 transform rotate-180" />
            )}
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {chartData[chartData.length - 1]?.momentum > 0 ? 'Rising' : 'Falling'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
