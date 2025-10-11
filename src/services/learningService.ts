import type { 
  LearningModule, 
  TradingJournalEntry, 
  LearningProgress, 
  Achievement, 
  StrategyTemplate,
  Quiz,
  PracticalExercise 
} from '../types/learning'

export class LearningService {
  private static readonly STORAGE_KEY = 'options_learning_data'
  private static readonly JOURNAL_KEY = 'trading_journal'
  private static readonly PROGRESS_KEY = 'learning_progress'

  /**
   * Get all learning modules
   */
  static getLearningModules(): LearningModule[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
      return this.getDefaultModules()
    } catch (error) {
      console.error('Error loading learning modules:', error)
      return this.getDefaultModules()
    }
  }

  /**
   * Get learning progress for user
   */
  static getLearningProgress(): LearningProgress {
    try {
      const stored = localStorage.getItem(this.PROGRESS_KEY)
      if (stored) {
        const progress = JSON.parse(stored)
        return {
          ...progress,
          achievements: progress.achievements?.map((a: any) => ({
            ...a,
            unlockedAt: new Date(a.unlockedAt)
          })) || []
        }
      }
      return this.getDefaultProgress()
    } catch (error) {
      console.error('Error loading learning progress:', error)
      return this.getDefaultProgress()
    }
  }

  /**
   * Update learning progress
   */
  static updateProgress(progress: Partial<LearningProgress>): void {
    const currentProgress = this.getLearningProgress()
    const updatedProgress = { ...currentProgress, ...progress }
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(updatedProgress))
  }

  /**
   * Complete a learning module
   */
  static completeModule(moduleId: string, score?: number): void {
    const progress = this.getLearningProgress()
    
    if (!progress.completedModules.includes(moduleId)) {
      progress.completedModules.push(moduleId)
      progress.experience += 100
      
      // Check for level up
      const newLevel = Math.floor(progress.experience / 500) + 1
      if (newLevel > progress.level) {
        progress.level = newLevel
        this.unlockAchievement('level_up', `Reached Level ${newLevel}`)
      }
    }
    
    if (score !== undefined) {
      progress.quizScores[moduleId] = score
    }
    
    this.updateProgress(progress)
  }

  /**
   * Get trading journal entries
   */
  static getJournalEntries(): TradingJournalEntry[] {
    try {
      const stored = localStorage.getItem(this.JOURNAL_KEY)
      if (stored) {
        const entries = JSON.parse(stored)
        return entries.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        }))
      }
      return []
    } catch (error) {
      console.error('Error loading journal entries:', error)
      return []
    }
  }

  /**
   * Add trading journal entry
   */
  static addJournalEntry(entry: Omit<TradingJournalEntry, 'id' | 'date'>): TradingJournalEntry {
    const entries = this.getJournalEntries()
    const newEntry: TradingJournalEntry = {
      ...entry,
      id: `journal_${Date.now()}`,
      date: new Date()
    }
    
    entries.push(newEntry)
    localStorage.setItem(this.JOURNAL_KEY, JSON.stringify(entries))
    
    // Update progress
    const progress = this.getLearningProgress()
    progress.journalEntries = entries.length
    progress.experience += 25
    
    // Check for journal achievements
    if (entries.length === 1) {
      this.unlockAchievement('first_journal', 'First Journal Entry')
    } else if (entries.length === 10) {
      this.unlockAchievement('journal_10', '10 Journal Entries')
    } else if (entries.length === 50) {
      this.unlockAchievement('journal_50', '50 Journal Entries')
    }
    
    this.updateProgress(progress)
    return newEntry
  }

  /**
   * Update journal entry
   */
  static updateJournalEntry(id: string, updates: Partial<TradingJournalEntry>): void {
    const entries = this.getJournalEntries()
    const index = entries.findIndex(entry => entry.id === id)
    
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates }
      localStorage.setItem(this.JOURNAL_KEY, JSON.stringify(entries))
    }
  }

  /**
   * Delete journal entry
   */
  static deleteJournalEntry(id: string): void {
    const entries = this.getJournalEntries()
    const filtered = entries.filter(entry => entry.id !== id)
    localStorage.setItem(this.JOURNAL_KEY, JSON.stringify(filtered))
    
    // Update progress
    const progress = this.getLearningProgress()
    progress.journalEntries = filtered.length
    this.updateProgress(progress)
  }

  /**
   * Get strategy templates
   */
  static getStrategyTemplates(): StrategyTemplate[] {
    return [
      {
        id: 'buy_call',
        name: 'Buy Call',
        description: 'Buy a call option to profit from upward price movement with unlimited upside potential',
        type: 'bullish',
        complexity: 'beginner',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 100,
        maxProfit: Infinity,
        breakeven: [0],
        bestMarketConditions: ['Bull trending', 'Low volatility expanding', 'Positive catalyst expected'],
        worstMarketConditions: ['Bear trending', 'Sideways with time decay', 'High time decay'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          'Identify a stock with bullish momentum or upcoming positive catalyst',
          'Buy an at-the-money or slightly out-of-the-money call',
          'Plan to hold until 50-75% profit or expiration approaches',
          'Set a stop loss at 50% of premium paid',
          'Consider rolling to later expiration if thesis remains intact'
        ],
        examples: [
          'Stock XYZ is trading at $100 with strong earnings expected. Buy the $100 call for $3.00 expiring in 30 days. If XYZ rises to $110, the call is worth $10.00, giving a profit of $7.00 per share ($700 per contract).'
        ]
      },
      {
        id: 'sell_put',
        name: 'Sell Put',
        description: 'Sell a put option to collect premium, betting the stock will stay above the strike price',
        type: 'bullish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 5000,
        maxProfit: 100,
        breakeven: [0],
        bestMarketConditions: ['Bullish to neutral outlook', 'High implied volatility', 'Strong support levels'],
        worstMarketConditions: ['Strong bearish trend', 'Breaking support', 'Increasing volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Select stocks you would be willing to own at the strike price',
          'Ensure adequate cash to cover potential assignment',
          'Target 1-2% return on capital per month',
          'Consider buying back at 50-75% of max profit',
          'Use technical support levels to select strike prices'
        ],
        examples: [
          'Stock ABC is at $50 with support at $45. Sell the $48 put for $1.50. If ABC stays above $48, you keep the $150 premium. Breakeven is $46.50 ($48 strike - $1.50 premium).'
        ]
      },
      {
        id: 'long_call',
        name: 'Long Call',
        description: 'Buy a call option to profit from upward price movement',
        type: 'bullish',
        complexity: 'beginner',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 100,
        maxProfit: Infinity,
        breakeven: [0],
        bestMarketConditions: ['Bull trending', 'Low volatility expanding'],
        worstMarketConditions: ['Bear trending', 'Sideways with time decay'],
        timeDecay: 'negative',
        volatilityImpact: 'positive'
      },
      {
        id: 'call_debit_spread',
        name: 'Call Debit Spread',
        description: 'Buy a lower strike call and sell a higher strike call to reduce cost and define risk',
        type: 'bullish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0, // Lower strike
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0, // Higher strike
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 200, // Net debit paid
        maxProfit: 300, // Spread width minus net debit
        breakeven: [0], // Lower strike plus net debit
        bestMarketConditions: ['Moderate bull', 'Low to moderate volatility'],
        worstMarketConditions: ['Bear trending', 'Sideways with time decay'],
        timeDecay: 'negative',
        volatilityImpact: 'positive'
      },
      {
        id: 'put_credit_spread',
        name: 'Put Credit Spread',
        description: 'Sell a higher strike put and buy a lower strike put to collect premium with defined risk',
        type: 'bullish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'sell',
            optionType: 'put',
            strike: 0, // Higher strike
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0, // Lower strike
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 400, // Spread width minus net credit
        maxProfit: 100, // Net credit received
        breakeven: [0], // Short put strike minus net credit
        bestMarketConditions: ['Bullish', 'Neutral', 'Decreasing volatility'],
        worstMarketConditions: ['Bearish', 'Increasing volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative'
      },
      {
        id: 'long_put',
        name: 'Long Put',
        description: 'Buy a put option to profit from downward price movement',
        type: 'bearish',
        complexity: 'beginner',
        legs: [
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 100,
        maxProfit: Infinity, // Strike - premium
        breakeven: [0], // Strike - premium
        bestMarketConditions: ['Bear trending', 'High volatility'],
        worstMarketConditions: ['Bull trending', 'Low volatility'],
        timeDecay: 'negative',
        volatilityImpact: 'positive'
      },
      {
        id: 'put_debit_spread',
        name: 'Put Debit Spread',
        description: 'Buy a higher strike put and sell a lower strike put to reduce cost and define risk',
        type: 'bearish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'buy',
            optionType: 'put',
            strike: 0, // Higher strike
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0, // Lower strike
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 200, // Net debit paid
        maxProfit: 300, // Spread width minus net debit
        breakeven: [0], // Higher strike minus net debit
        bestMarketConditions: ['Moderate bear', 'Low to moderate volatility'],
        worstMarketConditions: ['Bull trending', 'Sideways with time decay'],
        timeDecay: 'negative',
        volatilityImpact: 'positive'
      },
      {
        id: 'call_credit_spread',
        name: 'Call Credit Spread',
        description: 'Sell a lower strike call and buy a higher strike call to collect premium with defined risk',
        type: 'bearish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'sell',
            optionType: 'call',
            strike: 0, // Lower strike
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0, // Higher strike
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 400, // Spread width minus net credit
        maxProfit: 100, // Net credit received
        breakeven: [0], // Short call strike plus net credit
        bestMarketConditions: ['Bearish', 'Neutral', 'Decreasing volatility'],
        worstMarketConditions: ['Bullish', 'Increasing volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative'
      },
      {
        id: 'covered_call',
        name: 'Covered Call',
        description: 'Own stock and sell call options for income',
        type: 'neutral',
        complexity: 'intermediate',
        legs: [
          {
            action: 'sell',
            optionType: 'call',
            strike: 0, // Above current price
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 0, // Unlimited downside on stock
        maxProfit: 200, // Premium + (Strike - Stock Price)
        breakeven: [0], // Stock price - premium
        bestMarketConditions: ['Sideways', 'Mild bullish'],
        worstMarketConditions: ['Strong bull', 'Strong bear'],
        timeDecay: 'positive',
        volatilityImpact: 'negative'
      },
      {
        id: 'cash_secured_put',
        name: 'Cash-Secured Put',
        description: 'Sell a put option while setting aside cash to buy shares if assigned',
        type: 'neutral',
        complexity: 'intermediate',
        legs: [
          {
            action: 'sell',
            optionType: 'put',
            strike: 0, // At or below current price
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 0, // Strike price minus premium (substantial)
        maxProfit: 100, // Premium received
        breakeven: [0], // Strike price minus premium
        bestMarketConditions: ['Sideways', 'Mild bullish', 'Decreasing volatility'],
        worstMarketConditions: ['Strong bear', 'Increasing volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative'
      },
      {
        id: 'bull_call_spread',
        name: 'Bull Call Spread',
        description: 'Buy lower strike call, sell higher strike call for defined risk bullish strategy',
        type: 'bullish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 150,
        maxProfit: 350,
        breakeven: [0],
        bestMarketConditions: ['Moderate bull', 'Low to moderate volatility', 'Defined upside target'],
        worstMarketConditions: ['Bear trending', 'High volatility', 'Uncertain direction'],
        timeDecay: 'neutral',
        volatilityImpact: 'negative',
        instructions: [
          'Buy an at-the-money or slightly out-of-the-money call',
          'Sell a further out-of-the-money call for credit',
          'Keep spread width 5-10 points for most underlyings',
          'Target net debit of 33-50% of spread width',
          'Close at 75% of max profit or if breakout occurs'
        ],
        examples: [
          'Stock DEF at $100. Buy $100 call for $4.00, sell $105 call for $2.00, net debit $2.00. Max profit $3.00 ($5 spread - $2 debit) if DEF above $105. Max loss $2.00 if below $100.'
        ]
      },
      {
        id: 'bull_put_spread',
        name: 'Bull Put Spread',
        description: 'Sell higher strike put, buy lower strike put to collect premium with defined risk',
        type: 'bullish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 400,
        maxProfit: 100,
        breakeven: [0],
        bestMarketConditions: ['Bullish', 'Neutral', 'Decreasing volatility', 'Strong support'],
        worstMarketConditions: ['Bearish', 'Breaking support', 'Increasing volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Sell put at support level, buy lower put for protection',
          'Target credit of 20-33% of spread width',
          'Use 30-45 days to expiration for optimal time decay',
          'Close at 50% of max profit to reduce risk',
          'Roll down and out if support breaks'
        ],
        examples: [
          'Stock GHI at $100 with support at $95. Sell $97 put for $2.00, buy $92 put for $0.50, net credit $1.50. Max profit $150 if GHI above $97. Max loss $350 if below $92.'
        ]
      },
      {
        id: 'call_ratio_back_spread',
        name: 'Call Ratio Back Spread',
        description: 'Sell one call and buy multiple calls at higher strike for unlimited profit potential',
        type: 'bullish',
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 2
          }
        ],
        maxRisk: 300,
        maxProfit: Infinity,
        breakeven: [0, 0],
        bestMarketConditions: ['Strong bullish expectation', 'Volatile upward moves', 'Low implied volatility'],
        worstMarketConditions: ['Moderate rise ending at long call strike', 'High volatility premium'],
        timeDecay: 'neutral',
        volatilityImpact: 'positive',
        instructions: [
          'Sell one lower strike call, buy two higher strike calls',
          'Aim for net credit or small debit',
          'Works best when expecting sharp upward move',
          'Maximum risk occurs if stock ends at higher strike',
          'Unlimited profit above upper breakeven point'
        ],
        examples: [
          'Stock JKL at $100. Sell 1x $100 call for $5.00, buy 2x $105 calls for $2.50 each, net credit $0. Max risk $500 at $105. Profit increases above $105, unlimited to upside.'
        ]
      },
      {
        id: 'long_calendar_calls',
        name: 'Long Calendar with Calls',
        description: 'Sell near-term call, buy longer-term call at same strike to profit from time decay differential',
        type: 'bullish',
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '60d',
            quantity: 1
          }
        ],
        maxRisk: 250,
        maxProfit: 400,
        breakeven: [0, 0],
        bestMarketConditions: ['Neutral to bullish bias', 'Stable to rising volatility', 'Time decay advantage'],
        worstMarketConditions: ['Sharp moves in either direction', 'Volatility collapse'],
        timeDecay: 'positive',
        volatilityImpact: 'positive',
        instructions: [
          'Select strike at or slightly above current price',
          'Sell front-month call, buy back-month call',
          'Maximum profit if stock is at strike when short call expires',
          'Plan to close or roll when short option has 7-10 days left',
          'Works best in stable, slightly rising markets'
        ],
        examples: [
          'Stock MNO at $80. Sell 30-day $82 call for $2.50, buy 60-day $82 call for $4.50, net debit $2.00. Max profit if MNO at $82 in 30 days. Then hold or sell remaining long call.'
        ]
      },
      {
        id: 'bull_condor',
        name: 'Bull Condor',
        description: 'Four-leg strategy combining bull put spread and bear call spread for defined risk credit strategy',
        type: 'bullish',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 350,
        maxProfit: 150,
        breakeven: [0, 0],
        bestMarketConditions: ['Bullish bias with range expectation', 'High implied volatility', 'Rising markets'],
        worstMarketConditions: ['Strong bearish breakdown', 'High volatility increase'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Structure similar to iron condor but with bullish skew',
          'Place put spread closer to current price than call spread',
          'Target 20-30% return on risk',
          'Manage at 50% of max profit',
          'Consider adjustments if one side tested'
        ],
        examples: [
          'Stock PQR at $100. Buy $95 put, sell $98 put, sell $108 call, buy $113 call for net credit $1.50. Max profit $150 if PQR between $98-$108. Max loss $350.'
        ]
      },
      {
        id: 'bull_butterfly',
        name: 'Bull Butterfly',
        description: 'Buy one lower strike call, sell two middle strike calls, buy one higher strike call',
        type: 'bullish',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 2
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 100,
        maxProfit: 400,
        breakeven: [0, 0],
        bestMarketConditions: ['Precise bullish price target', 'Low volatility', 'Expected controlled rise'],
        worstMarketConditions: ['Large directional moves', 'High volatility', 'Unpredictable movement'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Use calls for bullish butterfly structure',
          'Buy one lower strike call, sell two middle strike calls, buy one higher strike call',
          'All strikes should be equidistant',
          'Max profit at middle strike at expiration',
          'Close early at 50-75% of max profit'
        ],
        examples: [
          'Stock STU at $95. Buy $95 call, sell 2x $100 calls, buy $105 call for net debit $1.00. Max profit $4.00 if STU at $100 at expiration. Risk limited to $1.00 debit.'
        ]
      },
      {
        id: 'range_forward',
        name: 'Range Forward',
        description: 'Combine long call and short put at different strikes to create synthetic long position',
        type: 'bullish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 5000,
        maxProfit: Infinity,
        breakeven: [0],
        bestMarketConditions: ['Strong bullish conviction', 'High put premiums', 'Expected sharp rise'],
        worstMarketConditions: ['Bearish reversal', 'Strong downward breakout'],
        timeDecay: 'neutral',
        volatilityImpact: 'neutral',
        instructions: [
          'Buy OTM call for upside participation',
          'Sell OTM put to finance the call purchase',
          'Creates synthetic long position with modified risk',
          'Significant risk below short put strike',
          'Best when put premiums are elevated'
        ],
        examples: [
          'Stock VWX at $100. Buy $105 call for $2.00, sell $95 put for $2.00, net zero cost. Profit above $105, loss below $95, range-bound between breakevens.'
        ]
      },
      {
        id: 'long_synthetic_future',
        name: 'Long Synthetic Future',
        description: 'Buy call and sell put at same strike to replicate long stock position',
        type: 'bullish',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 10000,
        maxProfit: Infinity,
        breakeven: [0],
        bestMarketConditions: ['Strong bullish outlook', 'Alternative to buying stock', 'Defined time horizon'],
        worstMarketConditions: ['Bearish reversal', 'Unexpected negative catalyst'],
        timeDecay: 'neutral',
        volatilityImpact: 'neutral',
        instructions: [
          'Buy ATM call and sell ATM put at same strike',
          'Creates synthetic long stock position',
          'Limited capital requirement vs buying stock',
          'Delta approximately +1.0 (moves with stock)',
          'Monitor for assignment risk on short put'
        ],
        examples: [
          'Stock YZ at $100. Buy $100 call for $5.00, sell $100 put for $5.00, net zero. Position gains $1 for every $1 rise in YZ, loses $1 for every $1 decline. Similar to owning 100 shares.'
        ]
      },
      {
        id: 'calendar_spread',
        name: 'Calendar Spread',
        description: 'Sell near-term option and buy longer-term option at same strike',
        type: 'neutral',
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'call',
            strike: 0, // At-the-money
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0, // Same strike
            expiration: '60d',
            quantity: 1
          }
        ],
        maxRisk: 250, // Net debit paid
        maxProfit: 350, // Variable based on volatility changes
        breakeven: [0, 0], // Complex, depends on volatility
        bestMarketConditions: ['Sideways', 'Stable volatility'],
        worstMarketConditions: ['Strong directional moves', 'Volatility collapse'],
        timeDecay: 'positive',
        volatilityImpact: 'positive'
      },
      {
        id: 'iron_condor',
        name: 'Iron Condor',
        description: 'Sell call and put spreads for range-bound profit',
        type: 'neutral', 
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'put',
            strike: 0, // Lower strike
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0, // Even lower strike
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0, // Higher strike
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0, // Even higher strike
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 350, // Spread width - net credit
        maxProfit: 150, // Net credit
        breakeven: [0, 0], // Two breakeven points
        bestMarketConditions: ['Sideways', 'Low volatility'],
        worstMarketConditions: ['High volatility', 'Strong directional moves'], 
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          "Identify a stock or ETF that's trading in a range",
          "Sell an OTM put spread below support",
          "Sell an OTM call spread above resistance",
          "Aim for 30-45 days until expiration",
          "Consider taking profits at 50% of max profit"
        ],
        examples: [
          "SPY is trading at $450 with support at $440 and resistance at $460. Sell the $435/$430 put spread and the $465/$470 call spread for a total credit of $1.50. Max profit is $150 per contract if SPY stays between $435 and $465."
        ]
      }
      ,
      {
        id: 'butterfly_spread',
        name: 'Butterfly Spread',
        description: 'Buy one lower strike option, sell two middle strike options, buy one higher strike option',
        type: 'neutral',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0, // Lower strike
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0, // Middle strike
            expiration: '30d',
            quantity: 2
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0, // Higher strike
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 100, // Net debit paid
        maxProfit: 400, // Distance between strikes minus net debit
        breakeven: [0, 0], // Two breakeven points
        bestMarketConditions: ['Precise price target', 'Low volatility'],
        worstMarketConditions: ['Strong directional moves', 'High volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          "Select a stock with a clear price target",
          "Buy a lower strike call, sell two middle strike calls, buy a higher strike call",
          "Keep all strikes equidistant (e.g., $5 apart)",
          "Maximum profit occurs if stock is at middle strike at expiration",
          "Consider closing early if profit reaches 50-75% of maximum"
        ],
        examples: [
          "AAPL is trading at $180 and you expect it to be at $185 in 30 days. Buy the $175 call, sell two $185 calls, and buy the $195 call for a net debit of $3.00. Max profit of $7.00 occurs if AAPL is exactly at $185 at expiration."
        ]
      },
      {
        id: 'short_straddle',
        name: 'Short Straddle',
        description: 'Sell both a call and put at the same strike to profit from low volatility and minimal price movement',
        type: 'neutral',
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: Infinity,
        maxProfit: 200,
        breakeven: [0, 0],
        bestMarketConditions: ['Very low volatility', 'Range-bound market', 'High IV about to collapse'],
        worstMarketConditions: ['High volatility', 'Large directional moves', 'Upcoming catalyst'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Use on stocks with high implied volatility expecting a volatility crush',
          'Sell ATM call and put at the same strike',
          'Maximum profit if stock stays at strike at expiration',
          'Unlimited risk on both sides - requires careful monitoring',
          'Consider closing at 50% of max profit to reduce risk'
        ],
        examples: [
          'Stock ABC at $100 with high IV before earnings. Sell $100 call for $4.00, sell $100 put for $4.00, net credit $8.00. Max profit $800 if ABC at $100 at expiration. Breakevens at $92 and $108.'
        ]
      },
      {
        id: 'iron_butterfly',
        name: 'Iron Butterfly',
        description: 'Sell ATM call and put spreads for defined risk neutral strategy with high probability',
        type: 'neutral',
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 400,
        maxProfit: 100,
        breakeven: [0, 0],
        bestMarketConditions: ['Low volatility', 'Narrow price range', 'Stable market'],
        worstMarketConditions: ['High volatility', 'Large price moves', 'Directional breakout'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Sell ATM put and call, buy OTM put and call for protection',
          'All options typically equidistant from ATM strike',
          'Maximum profit if stock stays at middle strike',
          'Defined risk with narrower profit range than iron condor',
          'Close at 50-75% of max profit'
        ],
        examples: [
          'Stock DEF at $50. Sell $50 call and $50 put for $3 each. Buy $45 put and $55 call for $1 each. Net credit $4.00. Max profit $400 at $50, max loss $100 below $46 or above $54.'
        ]
      },
      {
        id: 'short_strangle',
        name: 'Short Strangle',
        description: 'Sell OTM call and put to profit from range-bound movement with wider profit zone than straddle',
        type: 'neutral',
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: Infinity,
        maxProfit: 150,
        breakeven: [0, 0],
        bestMarketConditions: ['Low to moderate volatility', 'Range-bound market', 'Decreasing IV'],
        worstMarketConditions: ['High volatility', 'Large directional moves', 'Breaking key levels'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Sell OTM call above current price and OTM put below',
          'Strikes typically 1-2 standard deviations from current price',
          'Wider profit range but less premium than short straddle',
          'Unlimited risk requires careful position sizing',
          'Consider closing at 50% profit or rolling tested side'
        ],
        examples: [
          'Stock GHI at $100. Sell $110 call for $2.00, sell $90 put for $2.00, net credit $4.00. Max profit $400 if GHI between $90-$110. Breakevens at $86 and $114.'
        ]
      },
      {
        id: 'short_iron_condor',
        name: 'Short Iron Condor',
        description: 'Sell call and put spreads with defined risk for range-bound profit',
        type: 'neutral',
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 400,
        maxProfit: 100,
        breakeven: [0, 0],
        bestMarketConditions: ['Low volatility', 'Range-bound market', 'High probability of staying in range'],
        worstMarketConditions: ['High volatility', 'Trending market', 'Breaking support/resistance'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Sell OTM put spread and OTM call spread',
          'Keep spreads equidistant for balanced risk',
          'Target 1-2 standard deviation strikes',
          'Close at 50% of max profit',
          'Manage early if one side tested'
        ],
        examples: [
          'Stock JKL at $100. Sell $95 put/buy $90 put, sell $105 call/buy $110 call for net credit $1.50. Max profit $150 between $95-$105, max loss $350 below $90 or above $110.'
        ]
      },
      {
        id: 'batman',
        name: 'Batman',
        description: 'Complex strategy combining butterflies and condors for a unique payoff profile resembling batman wings',
        type: 'neutral',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 2
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 2
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 2
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 200,
        maxProfit: 300,
        breakeven: [0, 0, 0],
        bestMarketConditions: ['Moderate volatility', 'Two potential price targets', 'Range-bound with specific levels'],
        worstMarketConditions: ['Very high volatility', 'Unpredictable movement', 'Strong trend'],
        timeDecay: 'positive',
        volatilityImpact: 'neutral',
        instructions: [
          'Combine two butterfly spreads at different strikes',
          'Creates two profit peaks resembling batman ears',
          'Use when expecting price to settle at one of two levels',
          'Requires precise strike selection and management',
          'Close at 50-75% profit on either peak'
        ],
        examples: [
          'Stock MNO at $100. Structure butterflies at $95 and $105. Max profit zones if MNO settles near either level. Complex but profitable in ranging markets with two support/resistance levels.'
        ]
      },
      {
        id: 'double_plateau',
        name: 'Double Plateau',
        description: 'Create two flat profit zones using multiple butterflies for maximum probability in range',
        type: 'neutral',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 3
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 4
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 3
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 250,
        maxProfit: 400,
        breakeven: [0, 0, 0, 0],
        bestMarketConditions: ['Low volatility', 'Defined range', 'Two support/resistance zones'],
        worstMarketConditions: ['High volatility', 'Large breakout', 'No defined range'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Combine multiple butterfly spreads to create flat profit zones',
          'Profit maximized across two price ranges',
          'Use when stock has clear support and resistance',
          'Complex execution requires careful leg management',
          'Best for experienced traders with clear technical levels'
        ],
        examples: [
          'Stock PQR at $100 trading between $95-$105. Structure creates flat profit zones at $97-$98 and $102-$103. Max profit if PQR settles in either zone at expiration.'
        ]
      },
      {
        id: 'jade_lizard',
        name: 'Jade Lizard',
        description: 'Sell call spread and naked put to collect premium with no upside risk',
        type: 'neutral',
        complexity: 'intermediate',
        legs: [
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 5000,
        maxProfit: 200,
        breakeven: [0],
        bestMarketConditions: ['Neutral to bullish bias', 'High IV', 'Strong support level'],
        worstMarketConditions: ['Bearish breakdown', 'Breaking support', 'Large downward move'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Sell OTM put for premium collection',
          'Sell call spread at higher strikes for additional credit',
          'Credit collected should exceed call spread width (no upside risk)',
          'Bullish bias with downside risk like naked put',
          'Best when IV is elevated and expecting neutral to bullish movement'
        ],
        examples: [
          'Stock STU at $100. Sell $95 put for $3.00, sell $105 call for $2.00, buy $110 call for $1.00. Net credit $4.00 exceeds $5 call spread width. No upside risk, downside risk below $91.'
        ]
      },
      {
        id: 'reverse_jade_lizard',
        name: 'Reverse Jade Lizard',
        description: 'Sell put spread and naked call to collect premium with no downside risk',
        type: 'neutral',
        complexity: 'intermediate',
        legs: [
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: Infinity,
        maxProfit: 200,
        breakeven: [0],
        bestMarketConditions: ['Neutral to bearish bias', 'High IV', 'Strong resistance level'],
        worstMarketConditions: ['Bullish breakout', 'Breaking resistance', 'Large upward move'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Sell OTM call for premium collection',
          'Sell put spread at lower strikes for additional credit',
          'Credit collected should exceed put spread width (no downside risk)',
          'Bearish bias with upside risk like naked call',
          'Best when IV is elevated and expecting neutral to bearish movement'
        ],
        examples: [
          'Stock VWX at $100. Sell $105 call for $3.00, sell $95 put for $2.00, buy $90 put for $1.00. Net credit $4.00 exceeds $5 put spread width. No downside risk, upside risk above $109.'
        ]
      },
      {
        id: 'buy_put',
        name: 'Buy Put',
        description: 'Purchase a put option to profit from downward price movement with limited risk',
        type: 'bearish',
        complexity: 'beginner',
        legs: [
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 100,
        maxProfit: Infinity,
        breakeven: [0],
        bestMarketConditions: ['Strong bearish trend', 'Increasing volatility', 'Negative catalyst expected'],
        worstMarketConditions: ['Bullish trend', 'Sideways movement', 'High time decay'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          'Identify a stock with bearish momentum or upcoming negative catalyst',
          'Buy an at-the-money or slightly out-of-the-money put',
          'Plan to hold until 50-75% profit or expiration approaches',
          'Set a stop loss at 50% of premium paid',
          'Consider rolling to later expiration if thesis remains intact'
        ],
        examples: [
          'Stock XYZ is trading at $100 with weak earnings expected. Buy the $100 put for $3.00 expiring in 30 days. If XYZ drops to $90, the put is worth $10.00, giving a profit of $7.00 per share ($700 per contract).'
        ]
      },
      {
        id: 'sell_call',
        name: 'Sell Call',
        description: 'Sell a call option to collect premium, betting the stock will not rise above the strike',
        type: 'bearish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: Infinity,
        maxProfit: 100,
        breakeven: [0],
        bestMarketConditions: ['Bearish to neutral outlook', 'High implied volatility', 'Declining volatility expected'],
        worstMarketConditions: ['Strong bullish trend', 'Low volatility expanding', 'Positive catalyst'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'WARNING: Naked call selling has unlimited risk. Consider using a spread instead',
          'Only sell calls on stocks you believe will not rise',
          'Ensure adequate margin and capital to cover potential assignment',
          'Monitor position closely and have exit plan for adverse moves',
          'Consider buying back at 50-75% of max profit to reduce risk'
        ],
        examples: [
          'Stock ABC is at $50 with high implied volatility. Sell the $55 call for $2.00. If ABC stays below $55, you keep the $200 premium. Breakeven is $57 ($55 strike + $2 premium). Above $57, losses are unlimited.'
        ]
      },
      {
        id: 'bear_call_spread',
        name: 'Bear Call Spread',
        description: 'Sell a lower strike call and buy a higher strike call to profit from bearish moves with defined risk',
        type: 'bearish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 400,
        maxProfit: 100,
        breakeven: [0],
        bestMarketConditions: ['Bearish to neutral bias', 'High implied volatility', 'Expected range-bound movement'],
        worstMarketConditions: ['Strong bullish breakout', 'Low volatility with upward momentum'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Sell an out-of-the-money call at resistance level',
          'Buy a further out-of-the-money call for protection',
          'Keep spread width 5-10 points for most underlyings',
          'Target credit of 20-33% of spread width',
          'Close at 50% of max profit or roll if breached'
        ],
        examples: [
          'Stock DEF at $100 with resistance at $105. Sell $105 call for $2.50, buy $110 call for $1.00, net credit $1.50. Max profit $150 if DEF stays below $105. Max loss $350 if above $110.'
        ]
      },
      {
        id: 'bear_put_spread_detailed',
        name: 'Bear Put Spread',
        description: 'Buy a higher strike put and sell a lower strike put to reduce cost while maintaining bearish exposure',
        type: 'bearish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 200,
        maxProfit: 300,
        breakeven: [0],
        bestMarketConditions: ['Moderate bearish outlook', 'Expected downward move', 'Lower cost than long put'],
        worstMarketConditions: ['Bullish reversal', 'Sideways with time decay'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          'Buy an at-the-money or slightly in-the-money put',
          'Sell a further out-of-the-money put for credit',
          'Net debit should be less than 75% of spread width',
          'Best with 30-45 days to expiration',
          'Close at 75% of max profit or if thesis invalidated'
        ],
        examples: [
          'Stock GHI at $90. Buy $90 put for $4.00, sell $85 put for $2.00, net debit $2.00. Max profit $3.00 ($5 spread - $2 debit) if GHI drops below $85. Max loss $2.00 if above $90.'
        ]
      },
      {
        id: 'put_ratio_back_spread',
        name: 'Put Ratio Back Spread',
        description: 'Sell one put and buy multiple puts at a lower strike for unlimited profit potential',
        type: 'bearish',
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 2
          }
        ],
        maxRisk: 300,
        maxProfit: Infinity,
        breakeven: [0, 0],
        bestMarketConditions: ['Strong bearish expectation', 'Volatile downward moves', 'Low implied volatility'],
        worstMarketConditions: ['Moderate decline ending at short put', 'High volatility premium'],
        timeDecay: 'neutral',
        volatilityImpact: 'positive',
        instructions: [
          'Sell one higher strike put, buy two lower strike puts',
          'Aim for net credit or small debit',
          'Works best when expecting sharp downward move',
          'Maximum risk occurs if stock ends at lower strike',
          'Unlimited profit below lower breakeven point'
        ],
        examples: [
          'Stock JKL at $100. Sell 1x $100 put for $5.00, buy 2x $95 puts for $2.50 each, net credit $0. Max risk $500 at $95. Profit increases below $95, unlimited to downside.'
        ]
      },
      {
        id: 'long_calendar_puts',
        name: 'Long Calendar with Puts',
        description: 'Sell near-term put, buy longer-term put at same strike to profit from time decay differential',
        type: 'bearish',
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '60d',
            quantity: 1
          }
        ],
        maxRisk: 250,
        maxProfit: 400,
        breakeven: [0, 0],
        bestMarketConditions: ['Neutral to bearish bias', 'Stable to declining volatility', 'Time decay advantage'],
        worstMarketConditions: ['Sharp moves in either direction', 'Volatility collapse'],
        timeDecay: 'positive',
        volatilityImpact: 'positive',
        instructions: [
          'Select strike at or slightly below current price',
          'Sell front-month put, buy back-month put',
          'Maximum profit if stock is at strike when short put expires',
          'Plan to close or roll when short option has 7-10 days left',
          'Works best in stable, slightly declining markets'
        ],
        examples: [
          'Stock MNO at $80. Sell 30-day $80 put for $3.00, buy 60-day $80 put for $5.00, net debit $2.00. Max profit if MNO at $80 in 30 days. Then hold or sell remaining long put.'
        ]
      },
      {
        id: 'bear_condor',
        name: 'Bear Condor',
        description: 'Four-leg strategy combining bear call spread and bull put spread for defined risk credit strategy',
        type: 'bearish',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 350,
        maxProfit: 150,
        breakeven: [0, 0],
        bestMarketConditions: ['Bearish bias with range expectation', 'High implied volatility', 'Declining markets'],
        worstMarketConditions: ['Strong bullish breakout', 'High volatility increase'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Structure similar to iron condor but with bearish skew',
          'Place call spread closer to current price than put spread',
          'Target 20-30% return on risk',
          'Manage at 50% of max profit',
          'Consider adjustments if one side tested'
        ],
        examples: [
          'Stock PQR at $100. Buy $90 put, sell $95 put, sell $102 call, buy $107 call for net credit $1.50. Max profit $150 if PQR between $95-$102. Max loss $350.'
        ]
      },
      {
        id: 'bear_butterfly',
        name: 'Bear Butterfly',
        description: 'Sell one lower strike option, buy two middle strike options, sell one higher strike option',
        type: 'bearish',
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 2
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 100,
        maxProfit: 400,
        breakeven: [0, 0],
        bestMarketConditions: ['Precise bearish price target', 'Low volatility', 'Expected controlled decline'],
        worstMarketConditions: ['Large directional moves', 'High volatility', 'Unpredictable movement'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Use puts for bearish butterfly structure',
          'Sell one higher strike put, buy two middle strike puts, sell one lower strike put',
          'All strikes should be equidistant',
          'Max profit at middle strike at expiration',
          'Close early at 50-75% of max profit'
        ],
        examples: [
          'Stock STU at $105. Sell $110 put, buy 2x $105 puts, sell $100 put for net debit $1.00. Max profit $4.00 if STU at $105 at expiration. Risk limited to $1.00 debit.'
        ]
      },
      {
        id: 'risk_reversal',
        name: 'Risk Reversal',
        description: 'Sell out-of-the-money call and buy out-of-the-money put for bearish synthetic position',
        type: 'bearish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: Infinity,
        maxProfit: Infinity,
        breakeven: [0],
        bestMarketConditions: ['Strong bearish conviction', 'High call premiums', 'Expected sharp decline'],
        worstMarketConditions: ['Bullish reversal', 'Strong upward breakout'],
        timeDecay: 'neutral',
        volatilityImpact: 'neutral',
        instructions: [
          'Buy OTM put for downside participation',
          'Sell OTM call to finance the put purchase',
          'Creates synthetic short position with modified risk',
          'Unlimited risk above short call strike',
          'Best when call premiums are elevated'
        ],
        examples: [
          'Stock VWX at $100. Buy $95 put for $2.00, sell $105 call for $2.00, net zero cost. Profit below $95, loss above $105, range-bound between breakevens.'
        ]
      },
      {
        id: 'short_synthetic_future',
        name: 'Short Synthetic Future',
        description: 'Sell call and buy put at same strike to replicate short stock position',
        type: 'bearish',
        complexity: 'advanced',
        legs: [
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: Infinity,
        maxProfit: Infinity,
        breakeven: [0],
        bestMarketConditions: ['Strong bearish outlook', 'Alternative to shorting stock', 'Defined time horizon'],
        worstMarketConditions: ['Bullish reversal', 'Unexpected positive catalyst'],
        timeDecay: 'neutral',
        volatilityImpact: 'neutral',
        instructions: [
          'Sell ATM call and buy ATM put at same strike',
          'Creates synthetic short stock position',
          'Limited capital requirement vs shorting stock',
          'Delta approximately -1.0 (moves opposite to stock)',
          'Monitor for assignment risk on short call'
        ],
        examples: [
          'Stock YZ at $100. Sell $100 call for $5.00, buy $100 put for $5.00, net zero. Position gains $1 for every $1 decline in YZ, loses $1 for every $1 increase. Similar to shorting 100 shares.'
        ]
      },
      {
        id: 'long_straddle',
        name: 'Long Straddle',
        description: 'Buy ATM call and put to profit from large price moves in either direction',
        type: 'volatility',
        complexity: 'intermediate',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 600,
        maxProfit: Infinity,
        breakeven: [0, 0],
        bestMarketConditions: ['Expecting large move', 'Low IV before event', 'Earnings or catalyst pending'],
        worstMarketConditions: ['High IV that will collapse', 'Sideways market', 'Slow time decay'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          'Buy ATM call and ATM put at same strike price',
          'Best used before major events like earnings',
          'Requires significant price movement to be profitable',
          'Two breakeven points: strike ± total premium paid',
          'Consider closing if volatility spikes before event'
        ],
        examples: [
          'Stock ABC at $100 before earnings. Buy $100 call for $4, buy $100 put for $4, total cost $8. Profit if ABC moves below $92 or above $108. Max loss $800 if ABC stays at $100.'
        ]
      },
      {
        id: 'long_strangle',
        name: 'Long Strangle',
        description: 'Buy OTM call and put to profit from large moves with lower cost than straddle',
        type: 'volatility',
        complexity: 'intermediate',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 400,
        maxProfit: Infinity,
        breakeven: [0, 0],
        bestMarketConditions: ['Expecting large move', 'Low IV', 'Uncertain direction but high magnitude'],
        worstMarketConditions: ['High IV environment', 'Low volatility expected', 'Range-bound movement'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          'Buy OTM call above current price and OTM put below',
          'Cheaper than straddle but requires larger move to profit',
          'Wider breakeven points than straddle',
          'Best when expecting explosive move but unsure of direction',
          'Consider closing at 50-100% profit before expiration'
        ],
        examples: [
          'Stock DEF at $100. Buy $105 call for $2, buy $95 put for $2, total cost $4. Profit if DEF moves below $91 or above $109. Lower cost than straddle but wider breakevens.'
        ]
      },
      {
        id: 'long_iron_butterfly',
        name: 'Long Iron Butterfly',
        description: 'Buy ATM call and put spreads for defined risk volatility play',
        type: 'volatility',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 350,
        maxProfit: 150,
        breakeven: [0, 0],
        bestMarketConditions: ['Expecting volatility expansion', 'Large move anticipated', 'Before major catalyst'],
        worstMarketConditions: ['Range-bound market', 'Volatility contraction', 'At center strike at expiration'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          'Buy OTM put and call, sell ATM put and call',
          'Profits from large moves in either direction',
          'Defined risk unlike long straddle',
          'Maximum loss if stock stays at center strike',
          'Close early if significant move occurs'
        ],
        examples: [
          'Stock GHI at $100. Buy $95 put, sell $100 put, sell $100 call, buy $105 call for net debit $3.50. Max loss $350 at $100, max profit $150 below $96.50 or above $103.50.'
        ]
      },
      {
        id: 'long_iron_condor',
        name: 'Long Iron Condor',
        description: 'Buy call and put spreads at wings to profit from large moves with defined risk',
        type: 'volatility',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 350,
        maxProfit: 150,
        breakeven: [0, 0],
        bestMarketConditions: ['Large breakout expected', 'High volatility event', 'Uncertain direction'],
        worstMarketConditions: ['Range-bound movement', 'Between short strikes', 'Low volatility'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          'Buy put spread at lower strikes, buy call spread at higher strikes',
          'Profits outside the short strike range',
          'Opposite of short iron condor',
          'Maximum loss between short strikes',
          'Maximum profit outside long strikes'
        ],
        examples: [
          'Stock JKL at $100. Buy $90 put, sell $95 put, sell $105 call, buy $110 call for net debit $3.50. Max loss $350 between $95-$105, max profit $150 below $91.50 or above $108.50.'
        ]
      },
      {
        id: 'call_ratio_spread',
        name: 'Call Ratio Spread',
        description: 'Sell more calls than you buy to profit from moderate bullish move with volatility collapse',
        type: 'volatility',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 2
          }
        ],
        maxRisk: Infinity,
        maxProfit: 300,
        breakeven: [0, 0],
        bestMarketConditions: ['Moderate bullish move expected', 'High IV to collapse', 'Limited upside anticipated'],
        worstMarketConditions: ['Large upward breakout', 'Explosive rally', 'Above upper breakeven'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Buy 1 lower strike call, sell 2 higher strike calls',
          'Can be done for credit or small debit',
          'Maximum profit at higher (short) strike',
          'Unlimited risk above upper breakeven',
          'Best when expecting controlled rise with IV crush'
        ],
        examples: [
          'Stock MNO at $100. Buy 1x $100 call for $5, sell 2x $105 calls for $3 each, net credit $1. Max profit $600 at $105. Unlimited risk above $111.'
        ]
      },
      {
        id: 'put_ratio_spread',
        name: 'Put Ratio Spread',
        description: 'Sell more puts than you buy to profit from moderate bearish move with volatility collapse',
        type: 'volatility',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'sell',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 2
          }
        ],
        maxRisk: Infinity,
        maxProfit: 300,
        breakeven: [0, 0],
        bestMarketConditions: ['Moderate bearish move expected', 'High IV to collapse', 'Limited downside anticipated'],
        worstMarketConditions: ['Large downward crash', 'Explosive decline', 'Below lower breakeven'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          'Buy 1 higher strike put, sell 2 lower strike puts',
          'Can be done for credit or small debit',
          'Maximum profit at lower (short) strike',
          'Significant downside risk below lower breakeven',
          'Best when expecting controlled decline with IV crush'
        ],
        examples: [
          'Stock PQR at $100. Buy 1x $100 put for $5, sell 2x $95 puts for $3 each, net credit $1. Max profit $600 at $95. Significant risk below $89.'
        ]
      },
      {
        id: 'strip',
        name: 'Strip',
        description: 'Buy 1 call and 2 puts to profit from large moves with bearish bias',
        type: 'volatility',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 1
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 2
          }
        ],
        maxRisk: 800,
        maxProfit: Infinity,
        breakeven: [0, 0],
        bestMarketConditions: ['Large move expected with bearish bias', 'Low IV', 'More downside than upside potential'],
        worstMarketConditions: ['Sideways market', 'High IV that collapses', 'Minimal movement'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          'Buy 1 ATM call and 2 ATM puts at same strike',
          'More expensive than straddle due to extra put',
          'Profits more from downward moves than upward',
          'Use when expecting volatility with bearish skew',
          'Lower upside breakeven, two downside profit zones'
        ],
        examples: [
          'Stock STU at $100 before earnings. Buy 1x $100 call for $4, buy 2x $100 puts for $4 each, total cost $12. Bigger profit potential below $88, smaller profit above $112.'
        ]
      },
      {
        id: 'strap',
        name: 'Strap',
        description: 'Buy 2 calls and 1 put to profit from large moves with bullish bias',
        type: 'volatility',
        complexity: 'advanced',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '30d',
            quantity: 2
          },
          {
            action: 'buy',
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 800,
        maxProfit: Infinity,
        breakeven: [0, 0],
        bestMarketConditions: ['Large move expected with bullish bias', 'Low IV', 'More upside than downside potential'],
        worstMarketConditions: ['Sideways market', 'High IV that collapses', 'Minimal movement'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          'Buy 2 ATM calls and 1 ATM put at same strike',
          'More expensive than straddle due to extra call',
          'Profits more from upward moves than downward',
          'Use when expecting volatility with bullish skew',
          'Two upside profit zones, lower downside breakeven'
        ],
        examples: [
          'Stock VWX at $100 before product launch. Buy 2x $100 calls for $4 each, buy 1x $100 put for $4, total cost $12. Bigger profit potential above $112, smaller profit below $88.'
        ]
      }
    ]
  }

  /**
   * Unlock achievement
   */
  private static unlockAchievement(id: string, title: string): void {
    const progress = this.getLearningProgress()
    
    if (!progress.achievements.find(a => a.id === id)) {
      const achievement: Achievement = {
        id,
        title,
        description: `Achievement unlocked: ${title}`,
        icon: '🏆',
        unlockedAt: new Date(),
        category: 'learning'
      }
      
      progress.achievements.push(achievement)
      this.updateProgress(progress)
    }
  }

  /**
   * Get default learning modules
   */
  private static getDefaultModules(): LearningModule[] {
    return [
      {
        id: 'options_basics',
        title: 'Options Trading Fundamentals',
        description: 'Learn the basic concepts of options trading including calls, puts, and key terminology',
        difficulty: 'beginner',
        estimatedTime: 45,
        prerequisites: [],
        objectives: [
          'Understand what options are and how they work',
          'Distinguish between calls and puts',
          'Learn key options terminology',
          'Understand expiration and exercise'
        ],
        content: [
          {
            type: 'text',
            title: 'What are Options?',
            content: 'Options are financial contracts that give you the right, but not the obligation, to buy or sell an underlying asset at a specific price within a certain time period. Think of them as insurance policies for stocks - you pay a premium for the right to buy or sell at a predetermined price.'
          },
          {
            type: 'text',
            title: 'Call Options',
            content: 'A call option gives you the right to BUY a stock at a specific price (strike price) before expiration. You would buy a call if you think the stock price will go UP. If the stock price rises above your strike price, you can profit from the difference.'
          },
          {
            type: 'text',
            title: 'Put Options',
            content: 'A put option gives you the right to SELL a stock at a specific price before expiration. You would buy a put if you think the stock price will go DOWN. If the stock price falls below your strike price, you can profit from the difference.'
          },
          {
            type: 'example',
            title: 'Call Option Example',
            content: 'AAPL is trading at $180. You buy a $185 call expiring in 30 days for $3. If AAPL rises to $190, your option is worth $5 ($190 - $185), giving you a $2 profit per share ($5 - $3 premium paid).'
          }
        ],
        quiz: {
          id: 'options_basics_quiz',
          questions: [
            {
              id: 'q1',
              question: 'What does a call option give you the right to do?',
              type: 'multiple-choice',
              options: ['Buy a stock', 'Sell a stock', 'Both buy and sell', 'Neither'],
              correctAnswer: 'Buy a stock',
              explanation: 'A call option gives you the right to BUY a stock at the strike price.'
            },
            {
              id: 'q2',
              question: 'If you think a stock price will decrease, which option would you buy?',
              type: 'multiple-choice',
              options: ['Call option', 'Put option', 'Both', 'Neither'],
              correctAnswer: 'Put option',
              explanation: 'Put options increase in value when the stock price decreases.'
            },
            {
              id: 'q3',
              question: 'True or False: You are obligated to exercise an option before expiration.',
              type: 'true-false',
              correctAnswer: 'False',
              explanation: 'Options give you the RIGHT, not the obligation, to buy or sell. You can let them expire worthless.'
            }
          ],
          passingScore: 80
        },
        practicalExercise: {
          id: 'basic_option_analysis',
          title: 'Analyze Basic Options',
          description: 'Practice identifying profitable options scenarios',
          scenario: 'AAPL is currently trading at $180. Analyze the following options and determine which would be profitable if AAPL moves to $190.',
          requirements: [
            {
              type: 'analyze-greeks',
              description: 'Identify which option would be profitable',
              criteria: { targetPrice: 190, currentPrice: 180 }
            }
          ],
          hints: [
            'Consider the strike price relative to the target price',
            'Remember that calls profit from upward moves',
            'Factor in the premium paid'
          ],
          solution: 'The $185 call would be profitable as it would be worth $5 ($190 - $185) at expiration, minus the premium paid.'
        },
        completed: false,
        progress: 0
      },
      {
        id: 'risk_adjustment',
        title: 'Risk Management & Position Adjustment',
        description: 'Learn how to manage risk and adjust existing positions to reduce exposure',
        difficulty: 'intermediate',
        estimatedTime: 60,
        prerequisites: ['options_basics', 'options_greeks'],
        objectives: [
          'Understand position sizing principles',
          'Learn techniques for adjusting existing trades',
          'Master defensive position management',
          'Develop a risk management framework'
        ],
        content: [
          {
            type: 'text',
            title: 'Position Sizing Fundamentals',
            content: 'Position sizing is your first line of defense in risk management. Never risk more than 1-5% of your portfolio on a single options trade. For beginners, start with 1% and gradually increase as you gain experience. Remember that options can expire worthless, so proper position sizing is crucial for long-term success.'
          },
          {
            type: 'text',
            title: 'Rolling Techniques',
            content: 'Rolling is a powerful adjustment technique that involves closing your current position and opening a new one with different parameters. You can roll out (to a later expiration), roll up/down (to a different strike), or both. This gives your trade more time to work or adjusts your risk profile as market conditions change.'
          },
          {
            type: 'text',
            title: 'Adding Protective Legs',
            content: 'When a trade moves against you, consider adding protective legs to limit further losses. For example, if you bought a call that\'s losing value, you could sell a higher strike call to create a spread, defining your maximum loss. This reduces both risk and profit potential but can be a smart defensive move.'
          },
          {
            type: 'example',
            title: 'Rolling Example',
            content: 'You bought an AAPL $180 call expiring in 30 days for $5.00. After 15 days, AAPL is still at $175 and your call is worth $2.50. Instead of taking the loss, you could roll out to a 60-day $180 call for $7.00. By selling your current call for $2.50 and buying the new one, your net additional cost is $4.50 ($7.00 - $2.50), and you now have more time for your thesis to play out.'
          }
        ],
        quiz: {
          id: 'risk_adjustment_quiz',
          questions: [
            {
              id: 'q1',
              question: 'What is the primary purpose of position sizing?',
              type: 'multiple-choice',
              options: ['Maximize profits', 'Limit risk exposure', 'Increase leverage', 'Reduce commissions'],
              correctAnswer: 'Limit risk exposure',
              explanation: 'Position sizing is primarily about limiting risk exposure to ensure that no single trade can significantly damage your portfolio.'
            },
            {
              id: 'q2',
              question: 'When rolling an options position "out", you are:',
              type: 'multiple-choice',
              options: ['Moving to a higher strike price', 'Moving to a lower strike price', 'Moving to a later expiration date', 'Adding more contracts'],
              correctAnswer: 'Moving to a later expiration date',
              explanation: 'Rolling "out" means extending the time horizon by moving to a later expiration date.'
            },
            {
              id: 'q3',
              question: 'True or False: Adding a protective leg to a position always increases your maximum profit potential.',
              type: 'true-false',
              correctAnswer: 'False',
              explanation: 'Adding a protective leg typically reduces both risk AND profit potential, creating a more balanced risk/reward profile.'
            }
          ],
          passingScore: 80
        },
        practicalExercise: {
          id: 'risk_adjustment_exercise',
          title: 'Practice Position Adjustment',
          description: 'Apply risk management techniques to an existing position',
          scenario: 'You bought 1 SPY $580 call for $5.00. After a week, SPY has dropped to $570 and your call is now worth $2.50. How would you adjust this position?',
          requirements: [
            {
              type: 'analyze-adjustment',
              description: 'Choose the best adjustment strategy',
              criteria: { position: 'long_call', market: 'bearish' }
            }
          ],
          hints: [
            'Consider the remaining time to expiration',
            'Think about your conviction in the original trade idea',
            'Evaluate the cost vs. benefit of each adjustment technique'
          ],
          solution: 'Converting to a spread by selling a higher strike call would reduce your risk exposure while allowing some profit potential if SPY recovers. Alternatively, rolling out to a later expiration gives your trade more time to work.'
        },
        completed: false,
        progress: 0
      },
      {
        id: 'options_greeks',
        title: 'Understanding the Greeks',
        description: 'Master Delta, Gamma, Theta, and Vega to understand how options prices change',
        difficulty: 'intermediate',
        estimatedTime: 60,
        prerequisites: ['options_basics'],
        objectives: [
          'Understand what each Greek measures',
          'Learn how Greeks affect option prices',
          'Use Greeks for risk management',
          'Apply Greeks in strategy selection'
        ],
        content: [
          {
            type: 'text',
            title: 'Delta: Price Sensitivity',
            content: 'Delta measures how much an option\'s price changes for every $1 move in the underlying stock. Call options have positive delta (0 to 1), put options have negative delta (0 to -1). A delta of 0.5 means the option price moves $0.50 for every $1 stock move.'
          },
          {
            type: 'text',
            title: 'Gamma: Delta\'s Rate of Change',
            content: 'Gamma measures how much delta changes as the stock price moves. High gamma means delta changes rapidly, making the option more sensitive to price movements. At-the-money options have the highest gamma.'
          },
          {
            type: 'text',
            title: 'Theta: Time Decay',
            content: 'Theta measures how much an option loses value each day due to time passing. All options lose value as expiration approaches (time decay). Theta is always negative for long options and accelerates as expiration nears.'
          },
          {
            type: 'text',
            title: 'Vega: Volatility Sensitivity',
            content: 'Vega measures how much an option\'s price changes for every 1% change in implied volatility. Higher volatility increases option prices. Long options have positive vega (benefit from volatility increases).'
          },
          {
            type: 'interactive',
            title: 'Greeks Calculator',
            content: 'Use the options chain to see how Greeks change with different strikes and expirations.',
            data: { type: 'greeks_calculator' }
          }
        ],
        quiz: {
          id: 'greeks_quiz',
          questions: [
            {
              id: 'q1',
              question: 'An option has a delta of 0.6. If the stock moves up $2, how much should the option price increase?',
              type: 'numerical',
              correctAnswer: 1.2,
              explanation: 'Delta of 0.6 × $2 stock move = $1.20 option price increase'
            },
            {
              id: 'q2',
              question: 'Which Greek measures time decay?',
              type: 'multiple-choice',
              options: ['Delta', 'Gamma', 'Theta', 'Vega'],
              correctAnswer: 'Theta',
              explanation: 'Theta measures how much value an option loses each day due to time passing.'
            },
            {
              id: 'q3',
              question: 'True or False: Vega is higher for options with more time to expiration.',
              type: 'true-false',
              correctAnswer: 'True',
              explanation: 'Longer-dated options are more sensitive to volatility changes, so they have higher vega.'
            }
          ],
          passingScore: 80
        },
        completed: false,
        progress: 0
      },
      {
        id: 'basic_strategies',
        title: 'Basic Options Strategies',
        description: 'Learn fundamental strategies: long calls, long puts, covered calls, and protective puts',
        difficulty: 'intermediate',
        estimatedTime: 75,
        prerequisites: ['options_basics', 'options_greeks'],
        objectives: [
          'Master the four basic options strategies',
          'Understand when to use each strategy',
          'Calculate profit/loss scenarios',
          'Manage risk effectively'
        ],
        content: [
          {
            type: 'text',
            title: 'Long Call Strategy',
            content: 'Buying a call option is the most basic bullish strategy. You profit if the stock price rises above the strike price plus the premium paid. Maximum risk is limited to the premium paid, while profit potential is unlimited.'
          },
          {
            type: 'text',
            title: 'Long Put Strategy',
            content: 'Buying a put option is the basic bearish strategy. You profit if the stock price falls below the strike price minus the premium paid. Maximum risk is the premium paid, maximum profit is the strike price minus premium.'
          },
          {
            type: 'text',
            title: 'Covered Call Strategy',
            content: 'Own 100 shares of stock and sell a call option against it. This generates income from the premium but caps your upside if the stock rises above the strike price. Best used in neutral to mildly bullish markets.'
          },
          {
            type: 'text',
            title: 'Protective Put Strategy',
            content: 'Own stock and buy a put option as insurance. This limits your downside risk while maintaining upside potential. The put acts like an insurance policy for your stock position.'
          }
        ],
        practicalExercise: {
          id: 'strategy_selection',
          title: 'Choose the Right Strategy',
          description: 'Given different market scenarios, select the most appropriate basic strategy',
          scenario: 'You own 100 shares of TSLA at $250. You\'re moderately bullish but want to generate income. Which strategy should you use?',
          requirements: [
            {
              type: 'identify-strategy',
              description: 'Select the best strategy for this scenario',
              criteria: { scenario: 'income_generation', position: 'long_stock' }
            }
          ],
          hints: [
            'You already own the stock',
            'You want to generate income',
            'You\'re only moderately bullish'
          ],
          solution: 'Covered Call - sell a call option against your stock position to generate premium income while maintaining most upside potential.'
        },
        completed: false,
        progress: 0
      },
      {
        id: 'advanced_strategies',
        title: 'Advanced Options Strategies',
        description: 'Learn complex strategies: spreads, straddles, strangles, and iron condors',
        difficulty: 'advanced',
        estimatedTime: 90,
        prerequisites: ['basic_strategies'],
        objectives: [
          'Understand multi-leg strategies',
          'Learn spread strategies',
          'Master volatility strategies',
          'Apply advanced risk management'
        ],
        content: [
          {
            type: 'text',
            title: 'Bull Call Spread',
            content: 'Buy a lower strike call and sell a higher strike call with the same expiration. This reduces the cost compared to buying a call alone but also limits profit potential. Best for moderate bullish moves.'
          },
          {
            type: 'text',
            title: 'Iron Condor',
            content: 'Sell a call spread and a put spread simultaneously. Profits when the stock stays within a range. High probability strategy but limited profit potential. Best in low volatility environments.'
          },
          {
            type: 'text',
            title: 'Long Straddle',
            content: 'Buy a call and put with the same strike and expiration. Profits from large moves in either direction. Best before earnings or events that could cause big price swings.'
          }
        ],
        completed: false,
        progress: 0
      },
      {
        id: 'risk_management',
        title: 'Options Risk Management',
        description: 'Learn to manage risk, position sizing, and when to exit trades',
        difficulty: 'intermediate',
        estimatedTime: 50,
        prerequisites: ['basic_strategies'],
        objectives: [
          'Understand position sizing',
          'Learn exit strategies',
          'Master risk/reward ratios',
          'Develop trading rules'
        ],
        content: [
          {
            type: 'text',
            title: 'Position Sizing',
            content: 'Never risk more than 2-5% of your account on a single options trade. Options can expire worthless, so proper position sizing is crucial for long-term success.'
          },
          {
            type: 'text',
            title: 'Exit Strategies',
            content: 'Have a plan before entering any trade. Set profit targets (often 25-50% of maximum profit) and stop losses (often 2x the credit received or 50% of debit paid).'
          }
        ],
        completed: false,
        progress: 0
      },
      {
        id: 'market_analysis',
        title: 'Market Analysis for Options',
        description: 'Learn to analyze market conditions and choose appropriate strategies',
        difficulty: 'advanced',
        estimatedTime: 80,
        prerequisites: ['advanced_strategies', 'risk_management'],
        objectives: [
          'Analyze market regimes',
          'Understand volatility cycles',
          'Match strategies to market conditions',
          'Use technical analysis for options'
        ],
        content: [
          {
            type: 'text',
            title: 'Market Regimes',
            content: 'Different market conditions favor different options strategies. Bull markets favor call strategies, bear markets favor put strategies, and sideways markets favor income strategies.'
          },
          {
            type: 'text',
            title: 'Volatility Analysis',
            content: 'Implied volatility is crucial for options pricing. Buy options when IV is low and sell options when IV is high. Use the VIX and historical volatility to gauge market fear and opportunity.'
          }
        ],
        completed: false,
        progress: 0
      }
    ]
  }

  /**
   * Get default progress
   */
  private static getDefaultProgress(): LearningProgress {
    return {
      userId: 'default',
      completedModules: [],
      currentModule: 'options_basics',
      totalTimeSpent: 0,
      quizScores: {},
      practicalExercisesCompleted: [],
      journalEntries: 0,
      achievements: [],
      level: 1,
      experience: 0
    }
  }

  /**
   * Initialize default data
   */
  static initializeDefaultData(): void {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.getDefaultModules()))
    }
    if (!localStorage.getItem(this.PROGRESS_KEY)) {
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(this.getDefaultProgress()))
    }
  }

  /**
   * Reset all learning data
   */
  static resetLearningData(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.JOURNAL_KEY)
    localStorage.removeItem(this.PROGRESS_KEY)
    this.initializeDefaultData()
  }

  /**
   * Export learning data
   */
  static exportLearningData(): string {
    return JSON.stringify({
      modules: this.getLearningModules(),
      progress: this.getLearningProgress(),
      journal: this.getJournalEntries(),
      exportDate: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Get learning statistics
   */
  static getLearningStats(): {
    totalModules: number
    completedModules: number
    completionRate: number
    totalTimeSpent: number
    averageQuizScore: number
    journalEntries: number
    achievements: number
    currentLevel: number
  } {
    const modules = this.getLearningModules()
    const progress = this.getLearningProgress()
    
    const quizScores = Object.values(progress.quizScores)
    const averageQuizScore = quizScores.length > 0 
      ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length 
      : 0

    return {
      totalModules: modules.length,
      completedModules: progress.completedModules.length,
      completionRate: (progress.completedModules.length / modules.length) * 100,
      totalTimeSpent: progress.totalTimeSpent,
      averageQuizScore,
      journalEntries: progress.journalEntries,
      achievements: progress.achievements.length,
      currentLevel: progress.level
    }
  }
}