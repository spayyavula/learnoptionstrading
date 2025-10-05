import React, { useState, useEffect } from 'react'
import { Info, AlertCircle, TrendingUp, Scale } from 'lucide-react'
import { KellyCriterionService, KellyCalculationResult } from '../services/kellyCriterionService'
import { TradingHistoryService, UserTradingMetrics } from '../services/tradingHistoryService'

interface KellyCriterionProps {
  accountBalance: number
  contractPrice: number
  onRecommendedQuantity: (quantity: number) => void
  selectedKellyType?: 'full' | 'half' | 'quarter'
}

export default function KellyCriterion({
  accountBalance,
  contractPrice,
  onRecommendedQuantity,
  selectedKellyType = 'half'
}: KellyCriterionProps) {
  const [metrics, setMetrics] = useState<UserTradingMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [kellyType, setKellyType] = useState<'full' | 'half' | 'quarter'>(selectedKellyType)
  const [calculation, setCalculation] = useState<KellyCalculationResult | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    loadMetrics()
  }, [])

  useEffect(() => {
    if (metrics || (!metrics && !loading)) {
      calculatePositionSize()
    }
  }, [metrics, accountBalance, contractPrice, loading])

  useEffect(() => {
    if (calculation) {
      updateRecommendedQuantity()
    }
  }, [kellyType, calculation])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const userMetrics = await TradingHistoryService.getUserMetrics()
      setMetrics(userMetrics)
    } catch (error) {
      console.error('Error loading trading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePositionSize = () => {
    const defaults = KellyCriterionService.getDefaultMetrics(metrics?.total_trades || 0)

    const winRate = metrics && metrics.total_trades >= 10
      ? metrics.win_rate
      : defaults.winRate

    const averageWin = metrics && metrics.total_trades >= 10
      ? metrics.average_win
      : 100

    const averageLoss = metrics && metrics.total_trades >= 10
      ? metrics.average_loss
      : 50

    const result = KellyCriterionService.calculatePositionSize({
      winRate,
      averageWin,
      averageLoss,
      accountBalance,
      contractPrice
    })

    setCalculation(result)
  }

  const updateRecommendedQuantity = () => {
    if (!calculation) return

    const quantity = calculation.recommendedContracts[kellyType]
    onRecommendedQuantity(quantity)
  }

  const handleKellyTypeChange = (type: 'full' | 'half' | 'quarter') => {
    setKellyType(type)
  }

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Loading Kelly Criterion data...</p>
      </div>
    )
  }

  if (!calculation) {
    return null
  }

  const hasEnoughHistory = metrics && metrics.total_trades >= 10
  const winRate = metrics?.win_rate || 0.5
  const winLossRatio = metrics?.win_loss_ratio || 1.5

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Scale className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-blue-900">Kelly Criterion Position Sizing</h3>
          </div>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-blue-600 hover:text-blue-800"
            title="Learn about Kelly Criterion"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>

        {showExplanation && (
          <div className="mt-3 p-3 bg-white rounded border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">What is Kelly Criterion?</h4>
            <p className="text-sm text-gray-700 mb-2">
              The Kelly Criterion is a mathematical formula that helps determine optimal position sizing based on your historical win rate and average win/loss ratio. It maximizes long-term growth while managing risk.
            </p>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li><strong>Full Kelly:</strong> Maximum growth but higher volatility</li>
              <li><strong>Half Kelly:</strong> Recommended - balances growth and safety</li>
              <li><strong>Quarter Kelly:</strong> Most conservative approach</li>
            </ul>
            <a
              href="https://www.investopedia.com/articles/trading/04/091504.asp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm mt-2 inline-block"
            >
              Learn more about Kelly Criterion
            </a>
          </div>
        )}
      </div>

      {!hasEnoughHistory && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">Using Default Values</p>
            <p className="text-sm text-yellow-700 mt-1">
              You have {metrics?.total_trades || 0} completed trades. Kelly Criterion works best with at least 10 trades.
              Using conservative defaults (50% win rate, 1.5:1 win/loss ratio) until you build more history.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Your Trading Stats</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Trades:</span>
              <span className="font-medium">{metrics?.total_trades || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Win Rate:</span>
              <span className="font-medium">{(winRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg Win:</span>
              <span className="font-medium text-green-600">
                ${metrics?.average_win.toFixed(2) || '100.00'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg Loss:</span>
              <span className="font-medium text-red-600">
                ${metrics?.average_loss.toFixed(2) || '50.00'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Win/Loss Ratio:</span>
              <span className="font-medium">{winLossRatio.toFixed(2)}:1</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Kelly Calculation</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Kelly %:</span>
              <span className="font-medium">
                {KellyCriterionService.formatKellyPercentage(calculation.kellyPercentage)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Risk Level:</span>
              <span className={`font-medium ${KellyCriterionService.getRiskLevelColor(calculation.riskLevel)}`}>
                {calculation.riskLevel.toUpperCase()}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                {KellyCriterionService.getRiskLevelDescription(calculation.riskLevel)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Select Position Size</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleKellyTypeChange('quarter')}
            className={`p-4 rounded-lg border-2 transition-all ${
              kellyType === 'quarter'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-medium text-gray-900 mb-1">Quarter Kelly</div>
            <div className="text-xs text-gray-600 mb-2">Most Conservative</div>
            <div className="text-lg font-bold text-gray-900">
              {calculation.recommendedContracts.quarter} contracts
            </div>
            <div className="text-xs text-gray-600 mt-1">
              ${calculation.quarterKellySize.toFixed(2)}
            </div>
          </button>

          <button
            onClick={() => handleKellyTypeChange('half')}
            className={`p-4 rounded-lg border-2 transition-all ${
              kellyType === 'half'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-medium text-gray-900 mb-1">Half Kelly</div>
            <div className="text-xs text-gray-600 mb-2">Recommended</div>
            <div className="text-lg font-bold text-blue-600">
              {calculation.recommendedContracts.half} contracts
            </div>
            <div className="text-xs text-gray-600 mt-1">
              ${calculation.halfKellySize.toFixed(2)}
            </div>
          </button>

          <button
            onClick={() => handleKellyTypeChange('full')}
            className={`p-4 rounded-lg border-2 transition-all ${
              kellyType === 'full'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-medium text-gray-900 mb-1">Full Kelly</div>
            <div className="text-xs text-gray-600 mb-2">Aggressive</div>
            <div className="text-lg font-bold text-gray-900">
              {calculation.recommendedContracts.full} contracts
            </div>
            <div className="text-xs text-gray-600 mt-1">
              ${calculation.fullKellySize.toFixed(2)}
            </div>
          </button>
        </div>
      </div>

      {calculation.warnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {calculation.warnings.map((warning, index) => (
                <p key={index} className="text-sm text-orange-800">{warning}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-gray-700">
            Recommended: <strong>{calculation.recommendedContracts[kellyType]} contracts</strong>
          </span>
        </div>
        <a
          href="https://www.investopedia.com/articles/trading/04/091504.asp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Learn More
        </a>
      </div>
    </div>
  )
}
