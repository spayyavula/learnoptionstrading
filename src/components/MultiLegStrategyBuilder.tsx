import React, { useState, useEffect } from 'react'
import { X, Check, Info } from 'lucide-react'
import type { OptionsContract } from '../types/options'
import { StrategyValidationService, type StrategyLeg, type ValidationResult } from '../services/strategyValidationService'
import { OptionsChainFilterService } from '../services/optionsChainFilterService'
import { KellyCriterionService, MultiLegKellyInput, KellyCalculationResult } from '../services/kellyCriterionService'
import { TradingHistoryService, UserTradingMetrics } from '../services/tradingHistoryService'
import QuantitySelector from './QuantitySelector'
import StrategyMetrics from './StrategyMetrics'
import InteractivePayoffDiagram from './InteractivePayoffDiagram'

interface MultiLegStrategyBuilderProps {
  strategyName: string
  contracts: OptionsContract[]
  onLegsSelected: (legs: StrategyLeg[], validation: ValidationResult, quantity: number, kellyType: 'full' | 'half' | 'quarter') => void
  onBack: () => void
  accountBalance: number
  buyingPower: number
  underlyingPrice: number
}

export default function MultiLegStrategyBuilder({
  strategyName,
  contracts,
  onLegsSelected,
  onBack,
  accountBalance,
  buyingPower,
  underlyingPrice
}: MultiLegStrategyBuilderProps) {
  const [buyLegTicker, setBuyLegTicker] = useState<string>('')
  const [sellLegTicker, setSellLegTicker] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [kellyType, setKellyType] = useState<'full' | 'half' | 'quarter'>('half')
  const [kellyCalculation, setKellyCalculation] = useState<KellyCalculationResult | null>(null)
  const [metrics, setMetrics] = useState<UserTradingMetrics | null>(null)
  const [showKellyInfo, setShowKellyInfo] = useState(false)

  const callContracts = contracts.filter(c => c.contract_type === 'call')

  const filteredResult = OptionsChainFilterService.filterATMContracts(
    callContracts,
    underlyingPrice,
    'call',
    2,
    1
  )

  const calls = filteredResult.filteredContracts

  const buyContract = calls.find(c => c.ticker === buyLegTicker)
  const sellContract = calls.find(c => c.ticker === sellLegTicker)

  const availableSellCalls = buyContract
    ? calls.filter(c => c.strike_price > buyContract.strike_price)
    : []

  useEffect(() => {
    loadMetrics()
  }, [])

  useEffect(() => {
    if (buyContract && sellContract) {
      calculateKellyRecommendation()
    }
  }, [buyContract, sellContract, metrics, accountBalance])

  const loadMetrics = async () => {
    try {
      const userMetrics = await TradingHistoryService.getUserMetrics()
      setMetrics(userMetrics)
    } catch (error) {
      console.error('Error loading trading metrics:', error)
    }
  }

  const calculateKellyRecommendation = () => {
    if (!buyContract || !sellContract) return

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

    const netDebit = buyContract.last - sellContract.last

    const input: MultiLegKellyInput = {
      winRate,
      averageWin,
      averageLoss,
      accountBalance,
      buyLegPremium: buyContract.last,
      sellLegPremium: sellContract.last,
      netDebit
    }

    const result = KellyCriterionService.calculateMultiLegPositionSize(input)
    setKellyCalculation(result)
  }

  const handleContinue = () => {
    if (!buyContract || !sellContract) return

    const legs: StrategyLeg[] = [
      { contract: buyContract, action: 'buy', quantity: 1 },
      { contract: sellContract, action: 'sell', quantity: 1 }
    ]

    const validation = StrategyValidationService.validateStrategy(strategyName, legs)
    onLegsSelected(legs, validation, quantity, kellyType)
  }

  const isValid = buyContract && sellContract && quantity > 0 && quantity <= 100

  const netDebitPerContract = buyContract && sellContract ? buyContract.last - sellContract.last : 0
  const totalCost = netDebitPerContract * 100

  const kellyRecommendedQuantity = kellyCalculation?.recommendedContracts[kellyType] || 0

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden mt-6">
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white">{strategyName}</h3>
          <p className="text-green-100 text-sm mt-1">Select contracts and position size below</p>
        </div>
        <button onClick={onBack} className="p-2 hover:bg-green-800 rounded-lg transition-colors">
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                Showing <strong>{calls.length} ATM-centered CALL contracts</strong> (1 below, ATM, 2 above ${filteredResult.atmStrike})
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg border-2 border-green-300 p-5">
            <div className="flex items-center mb-4">
              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">
                1
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Buy Call</h4>
                <p className="text-xs text-gray-600">Lower Strike (Long Position)</p>
              </div>
              {buyContract && <Check className="h-6 w-6 text-green-600 ml-auto" />}
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Strike Price
            </label>
            <select
              value={buyLegTicker}
              onChange={(e) => {
                setBuyLegTicker(e.target.value)
                setSellLegTicker('')
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base font-medium bg-white"
            >
              <option value="">Select strike...</option>
              {calls.map(c => {
                const display = OptionsChainFilterService.formatStrikeDisplay(c, filteredResult.atmStrike, underlyingPrice)
                return (
                  <option key={c.ticker} value={c.ticker}>
                    {display}
                  </option>
                )
              })}
            </select>

            {buyContract && (
              <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Strike:</span>
                  <span className="text-sm font-bold text-gray-900">${buyContract.strike_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Premium:</span>
                  <span className="text-sm font-bold text-green-700">${buyContract.last.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Delta:</span>
                  <span className="text-sm font-bold text-gray-900">{buyContract.delta.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">IV:</span>
                  <span className="text-sm font-bold text-gray-900">{(buyContract.implied_volatility * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-green-200">
                  <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                  <span className="text-base font-bold text-red-700">-${(buyContract.last * 100).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-red-50 to-white rounded-lg border-2 border-red-300 p-5">
            <div className="flex items-center mb-4">
              <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">
                2
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Sell Call</h4>
                <p className="text-xs text-gray-600">Higher Strike (Short Position)</p>
              </div>
              {sellContract && <Check className="h-6 w-6 text-green-600 ml-auto" />}
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Strike Price
            </label>
            <select
              value={sellLegTicker}
              onChange={(e) => setSellLegTicker(e.target.value)}
              disabled={!buyContract}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base font-medium bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {buyContract ? 'Select strike...' : 'Select buy leg first'}
              </option>
              {availableSellCalls.map(c => {
                const display = OptionsChainFilterService.formatStrikeDisplay(c, filteredResult.atmStrike, underlyingPrice)
                return (
                  <option key={c.ticker} value={c.ticker}>
                    {display}
                  </option>
                )
              })}
            </select>

            {sellContract && (
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Strike:</span>
                  <span className="text-sm font-bold text-gray-900">${sellContract.strike_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Premium:</span>
                  <span className="text-sm font-bold text-red-700">${sellContract.last.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Delta:</span>
                  <span className="text-sm font-bold text-gray-900">{sellContract.delta.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">IV:</span>
                  <span className="text-sm font-bold text-gray-900">{(sellContract.implied_volatility * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-red-200">
                  <span className="text-sm font-medium text-gray-700">Total Credit:</span>
                  <span className="text-base font-bold text-green-700">+${(sellContract.last * 100).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {buyContract && sellContract && (
          <>
            <StrategyMetrics
              strategyName={strategyName}
              buyLeg={buyContract}
              sellLeg={sellContract}
              quantity={quantity}
              underlyingPrice={underlyingPrice}
            />

            <InteractivePayoffDiagram
              legs={[
                { type: buyContract.contract_type, strike: buyContract.strike_price, premium: buyContract.last, action: 'buy', quantity: 1 },
                { type: sellContract.contract_type, strike: sellContract.strike_price, premium: sellContract.last, action: 'sell', quantity: 1 }
              ]}
              strategyName={strategyName}
              underlyingPrice={underlyingPrice}
              className="mt-6"
            />

            <div className="border-t-2 border-gray-300 pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Position Sizing</h3>

              <QuantitySelector
                quantity={quantity}
                onQuantityChange={setQuantity}
                totalCost={totalCost}
                accountBalance={accountBalance}
                buyingPower={buyingPower}
                maxQuantity={100}
                kellyRecommendation={kellyRecommendedQuantity}
                showKellyHighlight={true}
              />
            </div>

            {kellyCalculation && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-blue-900">Kelly Criterion Recommendations</h4>
                  <button
                    onClick={() => setShowKellyInfo(!showKellyInfo)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>

                {showKellyInfo && (
                  <div className="mb-4 p-3 bg-white rounded border border-blue-200 text-sm text-gray-700">
                    <p className="mb-2">
                      Kelly Criterion calculates optimal position sizing based on your buy leg premium (${buyContract.last.toFixed(2)}) and historical win rate.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Quarter Kelly:</strong> Most conservative, recommended for beginners</li>
                      <li><strong>Half Kelly:</strong> Balanced approach, recommended for most traders</li>
                      <li><strong>Full Kelly:</strong> Aggressive, only for experienced traders</li>
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {(['quarter', 'half', 'full'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setKellyType(type)
                        setQuantity(kellyCalculation.recommendedContracts[type])
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        kellyType === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1 capitalize">{type} Kelly</div>
                      <div className="text-xs text-gray-600 mb-2">
                        {type === 'quarter' && 'Conservative'}
                        {type === 'half' && 'Recommended'}
                        {type === 'full' && 'Aggressive'}
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {kellyCalculation.recommendedContracts[type]}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">contracts</div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">Kelly %:</span>
                    <span className="font-semibold">{KellyCriterionService.formatKellyPercentage(kellyCalculation.kellyPercentage)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-700">Risk Level:</span>
                    <span className={`font-semibold ${KellyCriterionService.getRiskLevelColor(kellyCalculation.riskLevel)}`}>
                      {kellyCalculation.riskLevel.toUpperCase()}
                    </span>
                  </div>
                </div>

                {kellyCalculation.warnings.length > 0 && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                    {kellyCalculation.warnings.map((warning, idx) => (
                      <p key={idx} className="text-sm text-orange-800">{warning}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {isValid && (
        <div className="bg-gradient-to-r from-green-50 via-green-100 to-green-50 border-t-2 border-green-500 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-green-900 flex items-center">
                <Check className="h-6 w-6 mr-2 bg-green-500 text-white rounded-full p-1" />
                Ready to Place Order
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {quantity} contract{quantity > 1 ? 's' : ''} • Total cost: ${(totalCost * quantity).toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 transition-colors"
            >
              Continue to Review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
