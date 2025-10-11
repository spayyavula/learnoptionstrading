import React, { useState, useMemo } from 'react'
import { BookOpen, TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react'
import { LearningService } from '../services/learningService'
import type { StrategyTemplate } from '../types/learning'

interface StrategyTemplateSelectorProps {
  onSelectStrategy: (strategy: StrategyTemplate) => void
  expiryDate?: string
  onExpiryChange?: (expiry: string) => void
}

export default function StrategyTemplateSelector({
  onSelectStrategy,
  expiryDate = '14 Oct',
  onExpiryChange
}: StrategyTemplateSelectorProps) {
  const [activeTab, setActiveTab] = useState<'bullish' | 'bearish' | 'neutral' | 'others'>('bullish')
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)

  const allStrategies = useMemo(() => LearningService.getStrategyTemplates(), [])

  const strategies = useMemo(() => {
    if (activeTab === 'others') {
      return allStrategies.filter(s => s.type === 'volatility')
    }
    return allStrategies.filter(s => s.type === activeTab)
  }, [activeTab, allStrategies])

  const handleStrategyClick = (strategy: StrategyTemplate) => {
    setSelectedStrategy(strategy.id)
    onSelectStrategy(strategy)
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4" />
      case 'bearish':
        return <TrendingDown className="h-4 w-4" />
      case 'neutral':
        return <Minus className="h-4 w-4" />
      case 'others':
        return <Activity className="h-4 w-4" />
      default:
        return null
    }
  }

  const generatePayoffPath = (strategy: StrategyTemplate): string => {
    const width = 100
    const height = 60
    const centerY = height / 2

    if (strategy.type === 'bullish') {
      if (strategy.maxProfit === Infinity) {
        return `M 0,${height} L 30,${centerY} L ${width},0`
      }
      return `M 0,${height} L 30,${centerY} L 70,${height * 0.2} L ${width},${height * 0.2}`
    } else if (strategy.type === 'bearish') {
      if (strategy.maxProfit === Infinity) {
        return `M 0,0 L 30,${centerY} L ${width},${height}`
      }
      return `M 0,${height * 0.2} L 30,${height * 0.2} L 70,${centerY} L ${width},${height}`
    } else if (strategy.type === 'volatility') {
      if (strategy.name === 'Long Straddle' || strategy.name === 'Long Strangle') {
        return `M 0,0 L ${width / 2},${height} L ${width},0`
      } else if (strategy.name === 'Long Iron Butterfly') {
        return `M 0,${height * 0.3} L 30,${height * 0.8} L ${width / 2},${height} L 70,${height * 0.8} L ${width},${height * 0.3}`
      } else if (strategy.name === 'Long Iron Condor') {
        return `M 0,${height * 0.3} L 25,${height * 0.7} L 35,${height * 0.9} L 65,${height * 0.9} L 75,${height * 0.7} L ${width},${height * 0.3}`
      } else if (strategy.name === 'Call Ratio Spread') {
        return `M 0,${height} L 35,${centerY} L 55,${height * 0.2} L 70,${centerY} L ${width},${height}`
      } else if (strategy.name === 'Put Ratio Spread') {
        return `M 0,${height} L 30,${centerY} L 45,${height * 0.2} L 65,${centerY} L ${width},${height}`
      } else if (strategy.name === 'Strip') {
        return `M 0,0 L 45,${height} L ${width},${height * 0.4}`
      } else if (strategy.name === 'Strap') {
        return `M 0,${height * 0.4} L 55,${height} L ${width},0`
      }
      return `M 0,0 L ${width / 2},${height} L ${width},0`
    } else {
      return `M 0,${height} L 25,${centerY} L 50,${height * 0.2} L 75,${centerY} L ${width},${height}`
    }
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          Please click on a ready-made strategy to load it
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            {(['bullish', 'bearish', 'neutral', 'others'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTabIcon(tab)}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="https://www.optionseducation.org/strategies"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Learn Options Strategies
            </a>

            {onExpiryChange && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Expiry</label>
                <select
                  value={expiryDate}
                  onChange={(e) => onExpiryChange(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="14 Oct">14 Oct</option>
                  <option value="21 Oct">21 Oct</option>
                  <option value="28 Oct">28 Oct</option>
                  <option value="4 Nov">4 Nov</option>
                  <option value="11 Nov">11 Nov</option>
                  <option value="18 Nov">18 Nov</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {strategies.map((strategy) => (
          <button
            key={strategy.id}
            onClick={() => handleStrategyClick(strategy)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              selectedStrategy === strategy.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
            }`}
          >
            <svg
              viewBox="0 0 100 60"
              className="w-full h-16 mb-2"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`gradient-${strategy.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={strategy.type === 'bullish' ? '#10b981' : strategy.type === 'bearish' ? '#ef4444' : strategy.type === 'volatility' ? '#f59e0b' : '#3b82f6'} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={strategy.type === 'bullish' ? '#10b981' : strategy.type === 'bearish' ? '#ef4444' : strategy.type === 'volatility' ? '#f59e0b' : '#3b82f6'} stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <line x1="0" y1="30" x2="100" y2="30" stroke="#e5e7eb" strokeWidth="1" />

              <path
                d={generatePayoffPath(strategy)}
                fill="none"
                stroke={strategy.type === 'bullish' ? '#10b981' : strategy.type === 'bearish' ? '#ef4444' : strategy.type === 'volatility' ? '#f59e0b' : '#3b82f6'}
                strokeWidth="2"
              />

              <path
                d={`${generatePayoffPath(strategy)} L 100,60 L 0,60 Z`}
                fill={`url(#gradient-${strategy.id})`}
              />
            </svg>

            <h3 className="text-sm font-semibold text-gray-900 text-center leading-tight">
              {strategy.name}
            </h3>
          </button>
        ))}
      </div>

      {strategies.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No strategies available for this category
        </div>
      )}
    </div>
  )
}
