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
        id: 'long_call', 
        name: 'Long Call',
        description: 'Buy a call option to profit from upward price movement',
        type: 'bullish',
        complexity: 'beginner',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0, // Will be set based on current price
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 100, // Premium paid
        maxProfit: Infinity,
        breakeven: [0], // Strike + premium
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
        volatilityImpact: 'negative',
        instructions: [
          "Also known as Bear Call Spread",
          "Identify resistance level on the underlying",
          "Sell call at or just above resistance",
          "Buy higher strike call for protection",
          "Target 30-45 days to expiration",
          "Take profits at 50% of max profit"
        ],
        examples: [
          "SPY at $580 with resistance at $585. Sell $585 call for $3.00, buy $590 call for $1.50. Net credit $1.50. Max profit $150, max loss $350 if SPY rises above $590."
        ]
      },
      {
        id: 'sell_call',
        name: 'Sell Call',
        description: 'Sell a call option to collect premium with unlimited risk if stock rises',
        type: 'bearish',
        complexity: 'advanced',
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
        bestMarketConditions: ['Bearish', 'Neutral', 'Decreasing volatility'],
        worstMarketConditions: ['Strong bullish', 'Increasing volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          "WARNING: Unlimited risk strategy - use with extreme caution",
          "Best combined with stock ownership (covered call)",
          "Select strike above strong resistance",
          "Monitor position closely for adverse moves",
          "Consider rolling or buying back if underlying rallies",
          "Maintain adequate margin and risk management"
        ],
        examples: [
          "Stock at $100 with strong resistance at $110. Sell $110 call for $2.00. Keep $200 premium if stock stays below $110. Loses $1 for every $1 above $112 breakeven."
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
        bestMarketConditions: ['Bearish', 'Sideways', 'High implied volatility'],
        worstMarketConditions: ['Strong bullish', 'Low volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          "Identify key resistance level",
          "Sell call at or above resistance",
          "Buy higher strike call as protection",
          "Collect net credit upfront",
          "Maximum profit if stock stays below short strike",
          "Exit at 50-75% of max profit"
        ],
        examples: [
          "AAPL at $180. Sell $185 call for $4, buy $190 call for $2. Net credit $2 ($200). Max profit $200 if AAPL below $185. Max loss $300 if above $190."
        ]
      },
      {
        id: 'bear_put_spread',
        name: 'Bear Put Spread',
        description: 'Buy a higher strike put and sell a lower strike put to reduce cost while maintaining defined risk',
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
        bestMarketConditions: ['Moderate bearish', 'Support breakdown expected'],
        worstMarketConditions: ['Bullish', 'Strong sideways'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          "Identify key support level likely to break",
          "Buy put at or near current price",
          "Sell lower strike put as partial financing",
          "Pay net debit for the spread",
          "Maximum profit if stock drops to or below lower strike",
          "Consider closing at 50-75% of max profit"
        ],
        examples: [
          "Stock at $100 expecting drop to $90. Buy $100 put for $5, sell $90 put for $2. Net debit $3 ($300). Max profit $7 ($700) if stock at or below $90. Breakeven at $97."
        ]
      },
      {
        id: 'put_ratio_back_spread',
        name: 'Put Ratio Back Spread',
        description: 'Sell higher strike puts and buy more lower strike puts for limited risk with substantial profit potential',
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
        maxRisk: 200,
        maxProfit: 10000,
        breakeven: [0, 0],
        bestMarketConditions: ['Strong bearish breakdown', 'Increasing volatility'],
        worstMarketConditions: ['Sideways', 'At short strike at expiration'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          "Look for potential breakdown setups",
          "Sell 1 ATM or slightly ITM put",
          "Buy 2 OTM puts at lower strike",
          "Can be established for credit or small debit",
          "Profits from strong downward moves",
          "Manage risk if stock stays near short strike"
        ],
        examples: [
          "Stock at $100. Sell 1x $100 put for $5, buy 2x $90 puts for $2 each. Net credit $1. Max risk occurs at $90 (lose $9). Large profit below $81."
        ]
      },
      {
        id: 'long_calendar_puts',
        name: 'Long Calendar with Puts',
        description: 'Sell near-term put and buy longer-term put at same strike to profit from time decay differential',
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
        maxProfit: 350,
        breakeven: [0, 0],
        bestMarketConditions: ['Gradual bearish', 'At strike at front month expiration'],
        worstMarketConditions: ['Sharp drops away from strike', 'Volatility collapse'],
        timeDecay: 'positive',
        volatilityImpact: 'positive',
        instructions: [
          "Select a stock expected to decline gradually",
          "Choose strike slightly below current price",
          "Sell front month, buy back month at same strike",
          "Maximum profit at strike when front expires",
          "Manage position as front month approaches expiration",
          "Can roll front month for additional credit"
        ],
        examples: [
          "AAPL at $180 expecting slow decline. Sell 30-day $175 put for $4, buy 60-day $175 put for $7. Net debit $3 ($300). Profit if AAPL near $175 as front decays faster."
        ]
      },
      {
        id: 'bear_condor',
        name: 'Bear Condor',
        description: 'Four-leg spread expecting moderate bearish move with defined risk and reward',
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
        maxRisk: 200,
        maxProfit: 300,
        breakeven: [0, 0],
        bestMarketConditions: ['Moderate bearish', 'Below key support'],
        worstMarketConditions: ['Strong bullish', 'High volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          "Use when expecting price to move into lower range",
          "Structure with wider profit zone on downside",
          "All strikes should have equal distance",
          "Target 30-45 DTE for optimal theta decay",
          "Close at 50-75% of max profit",
          "Monitor for early assignment risk"
        ],
        examples: [
          "Stock at $100. Buy $110 put, sell $105 put, sell $95 put, buy $85 put. Profits if stock moves toward $95-$105 range with max profit around $95-$100."
        ]
      },
      {
        id: 'bear_butterfly',
        name: 'Bear Butterfly',
        description: 'Three-strike strategy with weighted middle leg expecting limited downside move',
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
        maxRisk: 100,
        maxProfit: 400,
        breakeven: [0, 0],
        bestMarketConditions: ['Precise downside target', 'Low volatility'],
        worstMarketConditions: ['Moves beyond wings', 'High volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          "Identify a specific price target below current price",
          "Buy OTM put, sell 2 ATM puts at target, buy ITM put",
          "Keep strikes equidistant",
          "Max profit at middle strike at expiration",
          "Exit early if approaching max profit",
          "Low cost, high precision required"
        ],
        examples: [
          "Stock at $105, expecting move to $100. Buy $110 put, sell 2x $100 puts, buy $90 put. Max profit if stock exactly at $100 at expiration."
        ]
      },
      {
        id: 'risk_reversal_bearish',
        name: 'Risk Reversal',
        description: 'Sell call and buy put to profit from bearish moves while collecting premium',
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
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: Infinity,
        maxProfit: 10000,
        breakeven: [0],
        bestMarketConditions: ['Strong bearish conviction', 'Moderate volatility'],
        worstMarketConditions: ['Strong bullish', 'Large upward moves'],
        timeDecay: 'neutral',
        volatilityImpact: 'neutral',
        instructions: [
          "Establishes a bearish position for low or zero cost",
          "Sell OTM call to finance purchase of OTM put",
          "Unlimited risk if stock rallies strongly",
          "Best used with strong bearish conviction",
          "Often used in commodity and forex markets",
          "Monitor position closely for risk management"
        ],
        examples: [
          "Stock at $100. Sell $110 call for $3, buy $90 put for $3. Zero cost structure. Profit below $90, unlimited risk above $110, neutral between."
        ]
      },
      {
        id: 'short_synthetic_future',
        name: 'Short Synthetic Future',
        description: 'Sell call and buy put at same strike to replicate short stock position using options',
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
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: Infinity,
        maxProfit: 10000,
        breakeven: [0],
        bestMarketConditions: ['Strong bearish', 'Any volatility'],
        worstMarketConditions: ['Bullish', 'Large upward moves'],
        timeDecay: 'neutral',
        volatilityImpact: 'neutral',
        instructions: [
          "Replicates shorting 100 shares of stock",
          "Sell ATM call and buy ATM put at same strike",
          "Usually done for near zero cost",
          "Same profit/loss profile as short stock",
          "Uses less capital than shorting stock",
          "No borrow costs but has assignment risk"
        ],
        examples: [
          "Stock at $100. Sell $100 call for $5, buy $100 put for $5. Net zero cost. Behaves like short stock at $100 with unlimited risk above and profit below."
        ]
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
        description: 'Buy lower strike call, sell higher strike call',
        type: 'bullish',
        complexity: 'intermediate',
        legs: [
          {
            action: 'buy',
            optionType: 'call',
            strike: 0, // ATM or slightly OTM
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
        maxRisk: 150, // Net debit
        maxProfit: 350, // Spread width - net debit
        breakeven: [0], // Lower strike + net debit
        bestMarketConditions: ['Moderate bull', 'Low to moderate volatility'],
        worstMarketConditions: ['Bear trending', 'High volatility'],
        timeDecay: 'neutral',
        volatilityImpact: 'negative'
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
        id: 'sell_put',
        name: 'Sell Put',
        description: 'Sell a put option to collect premium with obligation to buy stock if assigned',
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
        maxRisk: 0,
        maxProfit: 100,
        breakeven: [0],
        bestMarketConditions: ['Bullish', 'Neutral', 'Decreasing volatility'],
        worstMarketConditions: ['Strong bearish', 'Increasing volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          "Select a stock you want to own at a lower price",
          "Sell a put at the price you're willing to pay",
          "Collect the premium regardless of outcome",
          "Be prepared to buy the stock if assigned",
          "Best used with cash-secured margin"
        ],
        examples: [
          "AAPL is at $180 and you want to buy it at $175. Sell the $175 put for $3.00 premium. If AAPL stays above $175, you keep the $300 premium. If it drops below, you buy AAPL at an effective price of $172 ($175 - $3 premium)."
        ]
      },
      {
        id: 'bull_put_spread',
        name: 'Bull Put Spread',
        description: 'Sell a higher strike put and buy a lower strike put to collect credit with defined risk',
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
        bestMarketConditions: ['Bullish', 'Neutral', 'Decreasing volatility'],
        worstMarketConditions: ['Bearish', 'Increasing volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          "Identify support level on the underlying",
          "Sell put at or just below support",
          "Buy lower strike put for protection",
          "Target 30-45 days to expiration",
          "Take profits at 50% of max profit"
        ],
        examples: [
          "SPY at $580 with support at $575. Sell $575 put for $3.00, buy $570 put for $1.50. Net credit $1.50. Max profit $150, max loss $350 if SPY drops below $570."
        ]
      },
      {
        id: 'call_ratio_back_spread',
        name: 'Call Ratio Back Spread',
        description: 'Sell lower strike calls and buy more higher strike calls for limited risk with unlimited profit potential',
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
        maxRisk: 200,
        maxProfit: Infinity,
        breakeven: [0, 0],
        bestMarketConditions: ['Strong bullish breakout', 'Increasing volatility'],
        worstMarketConditions: ['Sideways', 'At short strike at expiration'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          "Look for potential breakout setups",
          "Sell 1 ATM or slightly ITM call",
          "Buy 2 OTM calls at higher strike",
          "Can be established for credit or small debit",
          "Profits from strong upward moves"
        ],
        examples: [
          "Stock at $100. Sell 1x $100 call for $5, buy 2x $110 calls for $2 each. Net credit $1. Max risk occurs at $110 (lose $9). Unlimited profit above $119."
        ]
      },
      {
        id: 'long_calendar_calls',
        name: 'Long Calendar with Calls',
        description: 'Sell near-term call and buy longer-term call at same strike to profit from time decay differential',
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
            action: 'buy',
            optionType: 'call',
            strike: 0,
            expiration: '60d',
            quantity: 1
          }
        ],
        maxRisk: 250,
        maxProfit: 350,
        breakeven: [0, 0],
        bestMarketConditions: ['Sideways', 'At strike at front month expiration'],
        worstMarketConditions: ['Strong moves away from strike', 'Volatility collapse'],
        timeDecay: 'positive',
        volatilityImpact: 'positive',
        instructions: [
          "Select a stock expected to stay near current price",
          "Choose strike at or near current price",
          "Sell front month, buy back month at same strike",
          "Maximum profit at strike when front expires",
          "Manage position as front month approaches expiration"
        ],
        examples: [
          "AAPL at $180. Sell 30-day $180 call for $5, buy 60-day $180 call for $8. Net debit $3 ($300). Profit if AAPL stays near $180 as front month decays faster than back month."
        ]
      },
      {
        id: 'bull_condor',
        name: 'Bull Condor',
        description: 'Four-leg spread expecting moderate bullish move with defined risk and reward',
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
        maxRisk: 200,
        maxProfit: 300,
        breakeven: [0, 0],
        bestMarketConditions: ['Moderate bullish', 'Low volatility'],
        worstMarketConditions: ['Strong bearish', 'High volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          "Use when expecting price to move into a range",
          "Structure with wider profit zone on upside",
          "All strikes should have equal distance",
          "Target 30-45 DTE for optimal theta decay",
          "Close at 50-75% of max profit"
        ],
        examples: [
          "Stock at $100. Buy $95 call, sell $100 call, sell $105 call, buy $115 call. Profits if stock moves toward $100-$105 range."
        ]
      },
      {
        id: 'bull_butterfly',
        name: 'Bull Butterfly',
        description: 'Three-strike strategy with weighted middle leg expecting limited upside move',
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
        bestMarketConditions: ['Precise upside target', 'Low volatility'],
        worstMarketConditions: ['Moves beyond wings', 'High volatility'],
        timeDecay: 'positive',
        volatilityImpact: 'negative',
        instructions: [
          "Identify a specific price target above current price",
          "Buy ITM call, sell 2 ATM calls at target, buy OTM call",
          "Keep strikes equidistant",
          "Max profit at middle strike at expiration",
          "Exit early if approaching max profit"
        ],
        examples: [
          "Stock at $95, expecting move to $100. Buy $95 call, sell 2x $100 calls, buy $105 call. Max profit if stock exactly at $100 at expiration."
        ]
      },
      {
        id: 'range_forward',
        name: 'Range Forward',
        description: 'Combination strategy using calls and puts to create a defined profit range',
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
            optionType: 'put',
            strike: 0,
            expiration: '30d',
            quantity: 1
          }
        ],
        maxRisk: 500,
        maxProfit: Infinity,
        breakeven: [0],
        bestMarketConditions: ['Range-bound with upside bias', 'Moderate volatility'],
        worstMarketConditions: ['Strong downward moves', 'Very high volatility'],
        timeDecay: 'neutral',
        volatilityImpact: 'neutral',
        instructions: [
          "Used to lock in a future price range",
          "Buy call for upside participation",
          "Sell put to collect premium and define floor",
          "Common in hedging strategies",
          "Popular for commodity and forex positions"
        ],
        examples: [
          "Stock at $100. Buy $105 call for $3, sell $95 put for $3. Zero cost structure. Profit above $105, obligation to buy at $95, range-bound P&L between."
        ]
      },
      {
        id: 'long_synthetic_future',
        name: 'Long Synthetic Future',
        description: 'Buy call and sell put at same strike to replicate long stock position using options',
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
        maxRisk: 0,
        maxProfit: Infinity,
        breakeven: [0],
        bestMarketConditions: ['Strong bullish', 'Any volatility'],
        worstMarketConditions: ['Bearish', 'Large downward moves'],
        timeDecay: 'neutral',
        volatilityImpact: 'neutral',
        instructions: [
          "Replicates owning 100 shares of stock",
          "Buy ATM call and sell ATM put at same strike",
          "Usually done for near zero cost",
          "Same profit/loss profile as owning stock",
          "Uses less capital than buying stock outright"
        ],
        examples: [
          "Stock at $100. Buy $100 call for $5, sell $100 put for $5. Net zero cost. Behaves like owning stock at $100 with unlimited upside and downside to zero."
        ]
      },
      {
        id: 'straddle',
        name: 'Straddle',
        description: 'Buy call and put at same strike to profit from large moves in either direction',
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
        bestMarketConditions: ['High volatility expected', 'Before earnings or events'],
        worstMarketConditions: ['Sideways', 'Volatility decrease'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          "Use before major announcements or events",
          "Buy ATM call and ATM put at same strike",
          "Needs significant move to profit",
          "Breakevens are strike +/- total premium",
          "Consider selling after volatility spike"
        ],
        examples: [
          "Stock at $100 before earnings. Buy $100 call for $4, buy $100 put for $4. Total cost $8 ($800). Profit if stock moves below $92 or above $108."
        ]
      },
      {
        id: 'strangle',
        name: 'Strangle',
        description: 'Buy OTM call and OTM put to profit from large moves with lower cost than straddle',
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
        maxRisk: 300,
        maxProfit: Infinity,
        breakeven: [0, 0],
        bestMarketConditions: ['Extremely high volatility expected', 'Uncertain direction'],
        worstMarketConditions: ['Sideways', 'Low volatility'],
        timeDecay: 'negative',
        volatilityImpact: 'positive',
        instructions: [
          "Cheaper alternative to straddle",
          "Buy OTM call and OTM put at different strikes",
          "Requires larger move to profit",
          "Best before major binary events",
          "Exit after volatility expansion"
        ],
        examples: [
          "Stock at $100. Buy $110 call for $2, buy $90 put for $2. Total cost $4 ($400). Profit if stock moves below $86 or above $114."
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