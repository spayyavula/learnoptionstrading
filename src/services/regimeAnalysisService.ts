import type { MarketRegime, TradingStrategy, RegimeAnalysis, MarketData, RegimeIndicator } from '../types/regimes'

export class RegimeAnalysisService {
  private static readonly REGIMES: MarketRegime[] = [
    {
      id: 'bull_trending',
      name: 'Bull Trending',
      description: 'Strong upward price movement with high momentum and increasing volume',
      characteristics: [
        'Price above all major moving averages',
        'RSI between 50-80',
        'MACD positive and rising',
        'Volume increasing on up days',
        'VIX below 20'
      ],
      indicators: [
        { name: 'Price vs SMA200', value: 0, threshold: 1.05, signal: 'bullish', weight: 0.3 },
        { name: 'RSI', value: 0, threshold: 50, signal: 'bullish', weight: 0.2 },
        { name: 'MACD', value: 0, threshold: 0, signal: 'bullish', weight: 0.2 },
        { name: 'VIX', value: 0, threshold: 20, signal: 'bullish', weight: 0.3 }
      ],
      volatility: 'medium',
      trend: 'bullish',
      duration: '2-6 months',
      probability: 0
    },
    {
      id: 'bear_trending',
      name: 'Bear Trending',
      description: 'Strong downward price movement with high momentum and panic selling',
      characteristics: [
        'Price below all major moving averages',
        'RSI below 30',
        'MACD negative and falling',
        'Volume increasing on down days',
        'VIX above 30'
      ],
      indicators: [
        { name: 'Price vs SMA200', value: 0, threshold: 0.95, signal: 'bearish', weight: 0.3 },
        { name: 'RSI', value: 0, threshold: 30, signal: 'bearish', weight: 0.2 },
        { name: 'MACD', value: 0, threshold: 0, signal: 'bearish', weight: 0.2 },
        { name: 'VIX', value: 0, threshold: 30, signal: 'bearish', weight: 0.3 }
      ],
      volatility: 'high',
      trend: 'bearish',
      duration: '1-4 months',
      probability: 0
    },
    {
      id: 'sideways_range',
      name: 'Sideways Range',
      description: 'Price moving within a defined range with no clear directional bias',
      characteristics: [
        'Price oscillating between support and resistance',
        'RSI between 30-70',
        'MACD oscillating around zero',
        'Low volume',
        'VIX between 15-25'
      ],
      indicators: [
        { name: 'Price Range', value: 0, threshold: 0.05, signal: 'neutral', weight: 0.4 },
        { name: 'RSI Range', value: 0, threshold: 40, signal: 'neutral', weight: 0.2 },
        { name: 'Volume', value: 0, threshold: 0.8, signal: 'neutral', weight: 0.2 },
        { name: 'VIX', value: 0, threshold: 20, signal: 'neutral', weight: 0.2 }
      ],
      volatility: 'low',
      trend: 'sideways',
      duration: '1-3 months',
      probability: 0
    },
    {
      id: 'high_volatility',
      name: 'High Volatility',
      description: 'Extreme price swings with uncertainty and emotional trading',
      characteristics: [
        'Large daily price movements (>2%)',
        'VIX above 25',
        'Whipsaw price action',
        'High volume spikes',
        'News-driven moves'
      ],
      indicators: [
        { name: 'Daily Range', value: 0, threshold: 0.02, signal: 'neutral', weight: 0.3 },
        { name: 'VIX', value: 0, threshold: 25, signal: 'neutral', weight: 0.4 },
        { name: 'Volume Spike', value: 0, threshold: 1.5, signal: 'neutral', weight: 0.3 }
      ],
      volatility: 'high',
      trend: 'sideways',
      duration: '2-8 weeks',
      probability: 0
    },
    {
      id: 'low_volatility',
      name: 'Low Volatility',
      description: 'Calm market conditions with minimal price movement and low volume',
      characteristics: [
        'Small daily price movements (<1%)',
        'VIX below 15',
        'Low volume',
        'Tight trading ranges',
        'Complacent sentiment'
      ],
      indicators: [
        { name: 'Daily Range', value: 0, threshold: 0.01, signal: 'neutral', weight: 0.3 },
        { name: 'VIX', value: 0, threshold: 15, signal: 'neutral', weight: 0.4 },
        { name: 'Volume', value: 0, threshold: 0.7, signal: 'neutral', weight: 0.3 }
      ],
      volatility: 'low',
      trend: 'sideways',
      duration: '1-6 months',
      probability: 0
    }
  ]

  private static readonly STRATEGIES: TradingStrategy[] = [
    // Bull Trending Strategies
    {
      id: 'bull_call_spread',
      name: 'Bull Call Spread',
      description: 'Buy lower strike call, sell higher strike call to profit from moderate upward movement',
      regimeId: 'bull_trending',
     type: 'bullish',
      timeframe: 'short',
      riskLevel: 'medium',
      expectedReturn: 15,
      maxDrawdown: 8,
      winRate: 65,
      instructions: [
        {
          step: 1,
          action: 'Buy Call Option',
          description: 'Purchase a call option at or slightly out-of-the-money',
          timing: 'When regime is confirmed',
          conditions: ['RSI > 50', 'Price above SMA20', 'MACD positive']
        },
        {
          step: 2,
          action: 'Sell Call Option',
          description: 'Sell a call option with higher strike price (same expiration)',
          timing: 'Immediately after buying the lower strike',
          conditions: ['Strike price 5-10% above current price']
        },
        {
          step: 3,
          action: 'Monitor Position',
          description: 'Track price movement and regime indicators',
          timing: 'Daily',
          conditions: ['Watch for regime change signals']
        },
        {
          step: 4,
          action: 'Exit Strategy',
          description: 'Close position when target is reached or regime changes',
          timing: 'At 50% profit or regime change',
          conditions: ['Take profit at 50% max gain', 'Exit if RSI < 40']
        }
      ],
      examples: [
        {
          scenario: 'SPY Bull Call Spread',
          setup: 'SPY at $580, buy $580 call, sell $590 call',
          entry: 'Net debit: $3.50',
          exit: 'SPY moves to $588, close for $7.00',
          result: 'Profit: $3.50 (100% return)',
          pnl: 350
        }
      ],
      risks: [
        'Limited profit potential',
        'Time decay affects both legs',
        'Early assignment risk on short call'
      ],
      benefits: [
        'Lower cost than buying call outright',
        'Defined maximum risk',
        'Profits from moderate upward movement'
      ]
    },
    {
      id: 'covered_call',
      name: 'Covered Call',
      description: 'Own stock and sell call options to generate income in moderately bullish markets',
      regimeId: 'bull_trending',
     type: 'bullish',
      timeframe: 'medium',
      riskLevel: 'low',
      expectedReturn: 8,
      maxDrawdown: 5,
      winRate: 75,
      instructions: [
        {
          step: 1,
          action: 'Own the Stock',
          description: 'Hold 100 shares of the underlying stock',
          timing: 'Before implementing strategy',
          conditions: ['Bullish on stock long-term']
        },
        {
          step: 2,
          action: 'Sell Call Option',
          description: 'Sell out-of-the-money call option',
          timing: 'When IV is elevated',
          conditions: ['Strike 5-10% above current price', 'High implied volatility']
        },
        {
          step: 3,
          action: 'Collect Premium',
          description: 'Receive premium income immediately',
          timing: 'At trade execution',
          conditions: ['Premium > 1% of stock value']
        },
        {
          step: 4,
          action: 'Manage Assignment',
          description: 'Be prepared to sell stock if called away',
          timing: 'At expiration or early assignment',
          conditions: ['Stock price above strike price']
        }
      ],
      examples: [
        {
          scenario: 'AAPL Covered Call',
          setup: 'Own 100 AAPL at $185, sell $195 call',
          entry: 'Collect $2.50 premium',
          exit: 'AAPL stays below $195, keep premium',
          result: 'Income: $250 (1.35% return)',
          pnl: 250
        }
      ],
      risks: [
        'Limited upside if stock rallies strongly',
        'Still exposed to downside risk',
        'Opportunity cost if stock soars'
      ],
      benefits: [
        'Generate income from stock holdings',
        'Lower breakeven point',
        'Works well in sideways to moderately bullish markets'
      ]
    },

    // Bear Trending Strategies
    {
      id: 'bear_put_spread',
      name: 'Bear Put Spread',
      description: 'Buy higher strike put, sell lower strike put to profit from moderate downward movement',
      regimeId: 'bear_trending',
     type: 'bearish',
      timeframe: 'short',
      riskLevel: 'medium',
      expectedReturn: 18,
      maxDrawdown: 10,
      winRate: 60,
      instructions: [
        {
          step: 1,
          action: 'Buy Put Option',
          description: 'Purchase a put option at or slightly out-of-the-money',
          timing: 'When bear regime is confirmed',
          conditions: ['RSI < 50', 'Price below SMA20', 'MACD negative']
        },
        {
          step: 2,
          action: 'Sell Put Option',
          description: 'Sell a put option with lower strike price (same expiration)',
          timing: 'Immediately after buying the higher strike',
          conditions: ['Strike price 5-10% below current price']
        },
        {
          step: 3,
          action: 'Monitor Position',
          description: 'Track price movement and regime indicators',
          timing: 'Daily',
          conditions: ['Watch for regime change signals']
        },
        {
          step: 4,
          action: 'Exit Strategy',
          description: 'Close position when target is reached or regime changes',
          timing: 'At 50% profit or regime change',
          conditions: ['Take profit at 50% max gain', 'Exit if RSI > 60']
        }
      ],
      examples: [
        {
          scenario: 'QQQ Bear Put Spread',
          setup: 'QQQ at $500, buy $500 put, sell $490 put',
          entry: 'Net debit: $4.00',
          exit: 'QQQ drops to $492, close for $8.00',
          result: 'Profit: $4.00 (100% return)',
          pnl: 400
        }
      ],
      risks: [
        'Limited profit potential',
        'Time decay affects both legs',
        'Early assignment risk on short put'
      ],
      benefits: [
        'Lower cost than buying put outright',
        'Defined maximum risk',
        'Profits from moderate downward movement'
      ]
    },
    {
      id: 'protective_put',
      name: 'Protective Put',
      description: 'Buy put options to protect existing stock positions during bear markets',
      regimeId: 'bear_trending',
     type: 'bearish',
      timeframe: 'medium',
      riskLevel: 'low',
      expectedReturn: -5,
      maxDrawdown: 3,
      winRate: 85,
      instructions: [
        {
          step: 1,
          action: 'Own the Stock',
          description: 'Hold stock position you want to protect',
          timing: 'Before bear regime begins',
          conditions: ['Long-term bullish on stock']
        },
        {
          step: 2,
          action: 'Buy Put Option',
          description: 'Purchase put option as insurance',
          timing: 'When bear signals appear',
          conditions: ['Strike price 5-10% below current price']
        },
        {
          step: 3,
          action: 'Monitor Protection',
          description: 'Track how put value changes with stock price',
          timing: 'Daily',
          conditions: ['Put gains value as stock falls']
        },
        {
          step: 4,
          action: 'Decide on Exercise',
          description: 'Exercise put if stock falls significantly',
          timing: 'Near expiration or major decline',
          conditions: ['Stock price below strike price']
        }
      ],
      examples: [
        {
          scenario: 'TSLA Protective Put',
          setup: 'Own 100 TSLA at $250, buy $240 put for $8',
          entry: 'Insurance cost: $800',
          exit: 'TSLA drops to $220, put worth $20',
          result: 'Protection: Limited loss to $18/share',
          pnl: -800
        }
      ],
      risks: [
        'Cost of insurance reduces returns',
        'Put expires worthless if stock rises',
        'Time decay erodes put value'
      ],
      benefits: [
        'Limits downside risk',
        'Allows keeping stock position',
        'Peace of mind during volatility'
      ]
    },

    // Sideways Range Strategies
    {
      id: 'iron_condor',
      name: 'Iron Condor',
      description: 'Sell call and put spreads to profit from low volatility and range-bound movement',
      regimeId: 'sideways_range',
     type: 'neutral',
      timeframe: 'short',
      riskLevel: 'medium',
      expectedReturn: 12,
      maxDrawdown: 15,
      winRate: 70,
      instructions: [
        {
          step: 1,
          action: 'Sell Call Spread',
          description: 'Sell call, buy higher strike call',
          timing: 'When range is established',
          conditions: ['Price in middle of range', 'High IV']
        },
        {
          step: 2,
          action: 'Sell Put Spread',
          description: 'Sell put, buy lower strike put',
          timing: 'Simultaneously with call spread',
          conditions: ['Strikes equidistant from current price']
        },
        {
          step: 3,
          action: 'Collect Premium',
          description: 'Receive net credit from both spreads',
          timing: 'At trade execution',
          conditions: ['Credit > 30% of spread width']
        },
        {
          step: 4,
          action: 'Manage Position',
          description: 'Close early if profit target hit or range breaks',
          timing: 'At 25-50% profit or range break',
          conditions: ['Price stays within range']
        }
      ],
      examples: [
        {
          scenario: 'SPY Iron Condor',
          setup: 'SPY at $580, sell $570/$575 put spread, sell $585/$590 call spread',
          entry: 'Net credit: $1.50',
          exit: 'SPY stays between $575-$585, keep credit',
          result: 'Profit: $150 (30% return)',
          pnl: 150
        }
      ],
      risks: [
        'Large losses if price moves outside range',
        'Multiple legs increase complexity',
        'Assignment risk on short options'
      ],
      benefits: [
        'Profits from time decay',
        'High probability of success',
        'Works well in low volatility'
      ]
    },
    {
      id: 'short_straddle',
      name: 'Short Straddle',
      description: 'Sell call and put at same strike to profit from low volatility',
      regimeId: 'low_volatility',
     type: 'neutral',
      timeframe: 'short',
      riskLevel: 'high',
      expectedReturn: 20,
      maxDrawdown: 25,
      winRate: 55,
      instructions: [
        {
          step: 1,
          action: 'Sell Call Option',
          description: 'Sell at-the-money call option',
          timing: 'When IV is high relative to expected movement',
          conditions: ['High implied volatility', 'Low expected movement']
        },
        {
          step: 2,
          action: 'Sell Put Option',
          description: 'Sell at-the-money put option (same strike and expiration)',
          timing: 'Simultaneously with call',
          conditions: ['Same strike as call option']
        },
        {
          step: 3,
          action: 'Collect Premium',
          description: 'Receive premium from both options',
          timing: 'At trade execution',
          conditions: ['Total premium > 3% of stock price']
        },
        {
          step: 4,
          action: 'Manage Risk',
          description: 'Close position if price moves significantly',
          timing: 'If price moves beyond breakeven',
          conditions: ['Price stays near strike price']
        }
      ],
      examples: [
        {
          scenario: 'AAPL Short Straddle',
          setup: 'AAPL at $185, sell $185 call and put',
          entry: 'Collect $8.00 total premium',
          exit: 'AAPL stays near $185, options expire worthless',
          result: 'Profit: $800 (keep full premium)',
          pnl: 800
        }
      ],
      risks: [
        'Unlimited risk if stock moves significantly',
        'Assignment risk on both sides',
        'Requires precise timing'
      ],
      benefits: [
        'High premium collection',
        'Profits from time decay',
        'Benefits from volatility crush'
      ]
    },

    // High Volatility Strategies
    {
      id: 'long_straddle',
      name: 'Long Straddle',
      description: 'Buy call and put at same strike to profit from large price movements',
      regimeId: 'high_volatility',
     type: 'volatility',
      timeframe: 'short',
      riskLevel: 'medium',
      expectedReturn: 25,
      maxDrawdown: 12,
      winRate: 45,
      instructions: [
        {
          step: 1,
          action: 'Buy Call Option',
          description: 'Purchase at-the-money call option',
          timing: 'Before expected volatility event',
          conditions: ['Low implied volatility', 'Expected big move']
        },
        {
          step: 2,
          action: 'Buy Put Option',
          description: 'Purchase at-the-money put option (same strike and expiration)',
          timing: 'Simultaneously with call',
          conditions: ['Same strike as call option']
        },
        {
          step: 3,
          action: 'Wait for Movement',
          description: 'Hold position through volatility event',
          timing: 'Until significant price movement occurs',
          conditions: ['Price moves beyond breakeven points']
        },
        {
          step: 4,
          action: 'Exit Strategy',
          description: 'Close profitable leg or both legs',
          timing: 'When target profit reached',
          conditions: ['Price moves significantly in either direction']
        }
      ],
      examples: [
        {
          scenario: 'NVDA Earnings Straddle',
          setup: 'NVDA at $1400, buy $1400 call and put before earnings',
          entry: 'Total cost: $80',
          exit: 'NVDA moves to $1520 after earnings',
          result: 'Call worth $120, profit: $40',
          pnl: 4000
        }
      ],
      risks: [
        'High cost to enter position',
        'Time decay hurts both options',
        'Needs large movement to profit'
      ],
      benefits: [
        'Profits from big moves in either direction',
        'Limited risk (premium paid)',
        'Great for earnings or events'
      ]
    }
  ]

  /**
   * Analyze current market regime based on market data
   */
  static analyzeRegime(marketData: MarketData): RegimeAnalysis {
    const regimes = this.calculateRegimeProbabilities(marketData)
    const currentRegime = regimes.reduce((prev, current) => 
      current.probability > prev.probability ? current : prev
    )

    const confidence = currentRegime.probability
    const timeInRegime = this.estimateTimeInRegime(currentRegime, marketData)
    
    const nextRegimeProb = regimes
      .filter(r => r.id !== currentRegime.id)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 2)
      .map(regime => ({ regime, probability: regime.probability }))

    const recommendedStrategies = this.getRecommendedStrategies(currentRegime.id)
    const warnings = this.generateWarnings(currentRegime, marketData)

    return {
      currentRegime,
      confidence,
      timeInRegime,
      nextRegimeProb,
      recommendedStrategies,
      warnings
    }
  }

  /**
   * Calculate probability for each regime based on market indicators
   */
  private static calculateRegimeProbabilities(marketData: MarketData): MarketRegime[] {
    return this.REGIMES.map(regime => {
      let score = 0
      let totalWeight = 0

      const updatedIndicators = regime.indicators.map(indicator => {
        let value = 0
        let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral'

        switch (indicator.name) {
          case 'Price vs SMA200':
            value = marketData.price / marketData.movingAverages.sma200
            signal = value > indicator.threshold ? 'bullish' : 'bearish'
            break
          case 'RSI':
            value = marketData.rsi
            if (regime.id === 'bull_trending') {
              signal = value > indicator.threshold ? 'bullish' : 'bearish'
            } else if (regime.id === 'bear_trending') {
              signal = value < indicator.threshold ? 'bearish' : 'bullish'
            } else {
              signal = value > 30 && value < 70 ? 'neutral' : 'bearish'
            }
            break
          case 'MACD':
            value = marketData.macd
            signal = value > indicator.threshold ? 'bullish' : 'bearish'
            break
          case 'VIX':
            value = marketData.vix
            if (regime.id === 'bull_trending' || regime.id === 'low_volatility') {
              signal = value < indicator.threshold ? 'bullish' : 'bearish'
            } else if (regime.id === 'bear_trending' || regime.id === 'high_volatility') {
              signal = value > indicator.threshold ? 'bearish' : 'bullish'
            } else {
              signal = 'neutral'
            }
            break
          case 'Daily Range':
            const dailyRange = Math.abs(marketData.price * 0.02) // Mock 2% daily range
            value = dailyRange / marketData.price
            signal = value > indicator.threshold ? 'neutral' : 'neutral'
            break
          case 'Volume':
            value = marketData.volume / 1000000 // Normalize volume
            signal = 'neutral'
            break
        }

        // Calculate score contribution
        const isMatch = (regime.trend === 'bullish' && signal === 'bullish') ||
                       (regime.trend === 'bearish' && signal === 'bearish') ||
                       (regime.trend === 'sideways' && signal === 'neutral')

        if (isMatch) {
          score += indicator.weight
        }
        totalWeight += indicator.weight

        return { ...indicator, value, signal }
      })

      const probability = Math.max(0, Math.min(1, score / totalWeight))

      return {
        ...regime,
        indicators: updatedIndicators,
        probability
      }
    })
  }

  /**
   * Estimate time spent in current regime
   */
  private static estimateTimeInRegime(regime: MarketRegime, marketData: MarketData): number {
    // Mock calculation - in real implementation, this would track regime changes over time
    const baseTime = Math.random() * 30 + 10 // 10-40 days
    
    // Adjust based on volatility
    const volatilityMultiplier = regime.volatility === 'high' ? 0.5 : 
                                regime.volatility === 'low' ? 1.5 : 1.0
    
    return Math.round(baseTime * volatilityMultiplier)
  }

  /**
   * Get recommended strategies for a regime
   */
  private static getRecommendedStrategies(regimeId: string): TradingStrategy[] {
    return this.STRATEGIES.filter(strategy => strategy.regimeId === regimeId)
  }

  /**
   * Generate warnings based on regime and market conditions
   */
  private static generateWarnings(regime: MarketRegime, marketData: MarketData): string[] {
    const warnings: string[] = []

    if (regime.volatility === 'high') {
      warnings.push('High volatility detected - use smaller position sizes')
    }

    if (marketData.vix > 30) {
      warnings.push('Extreme fear in market - consider protective strategies')
    }

    if (marketData.rsi > 80) {
      warnings.push('Market may be overbought - watch for reversal signals')
    } else if (marketData.rsi < 20) {
      warnings.push('Market may be oversold - potential bounce opportunity')
    }

    if (regime.id === 'bear_trending' && marketData.volume > 1.5) {
      warnings.push('High volume selling - trend may accelerate')
    }

    return warnings
  }

  /**
   * Get all available regimes
   */
  static getAllRegimes(): MarketRegime[] {
    return [...this.REGIMES]
  }

  /**
   * Get all available strategies
   */
  static getAllStrategies(): TradingStrategy[] {
    return [...this.STRATEGIES]
  }

  /**
   * Get strategy by ID
   */
  static getStrategy(id: string): TradingStrategy | undefined {
    return this.STRATEGIES.find(strategy => strategy.id === id)
  }

  /**
   * Get strategies for specific regime
   */
  static getStrategiesForRegime(regimeId: string): TradingStrategy[] {
    return this.STRATEGIES.filter(strategy => strategy.regimeId === regimeId)
  }

  /**
   * Generate mock market data for demonstration
   */
  static generateMockMarketData(): MarketData {
    const basePrice = 580
    const priceVariation = (Math.random() - 0.5) * 20
    const price = basePrice + priceVariation

    return {
      price,
      volume: Math.random() * 2000000 + 500000,
      volatility: Math.random() * 0.3 + 0.1,
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 10,
      bollingerBands: {
        upper: price * 1.02,
        middle: price,
        lower: price * 0.98
      },
      movingAverages: {
        sma20: price * (0.98 + Math.random() * 0.04),
        sma50: price * (0.96 + Math.random() * 0.08),
        sma200: price * (0.92 + Math.random() * 0.16)
      },
      vix: Math.random() * 40 + 10,
      timestamp: new Date()
    }
  }
}