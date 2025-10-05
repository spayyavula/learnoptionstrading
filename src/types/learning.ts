export interface LearningModule {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number // in minutes
  prerequisites: string[]
  objectives: string[]
  content: LearningContent[]
  quiz?: Quiz
  practicalExercise?: PracticalExercise
  completed: boolean
  progress: number
}

export interface LearningContent {
  type: 'text' | 'video' | 'interactive' | 'chart' | 'example'
  title: string
  content: string
  data?: any
}

export interface Quiz {
  id: string
  questions: QuizQuestion[]
  passingScore: number
}

export interface QuizQuestion {
  id: string
  question: string
  type: 'multiple-choice' | 'true-false' | 'numerical'
  options?: string[]
  correctAnswer: string | number
  explanation: string
}

export interface PracticalExercise {
  id: string
  title: string
  description: string
  scenario: string
  requirements: ExerciseRequirement[]
  hints: string[]
  solution: string
}

export interface ExerciseRequirement {
  type: 'place-order' | 'analyze-greeks' | 'calculate-pnl' | 'identify-strategy' | 'analyze-adjustment'
  description: string
  criteria: any
}

export interface TradingJournalEntry {
  id: string
  date: Date
  contractTicker: string
  underlyingTicker: string
  strategy: string
  entryPrice: number
  exitPrice?: number
  quantity: number
  reasoning: string
  marketContext: string
  emotionalState: string
  outcome?: 'win' | 'loss' | 'breakeven'
  pnl?: number
  lessonsLearned: string
  tags: string[]
  attachments?: string[]
}

export interface LearningProgress {
  userId: string
  completedModules: string[]
  currentModule?: string
  totalTimeSpent: number
  quizScores: Record<string, number>
  practicalExercisesCompleted: string[]
  journalEntries: number
  achievements: Achievement[]
  level: number
  experience: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: Date
  category: 'trading' | 'learning' | 'analysis' | 'consistency'
}

export interface StrategyTemplate {
  id: string
  name: string
  description: string
  type: 'bullish' | 'bearish' | 'neutral' | 'volatility'
  complexity: 'beginner' | 'intermediate' | 'advanced'
  legs: StrategyLeg[]
  maxRisk: number
  maxProfit: number
  breakeven: number[]
  bestMarketConditions: string[]
  worstMarketConditions: string[]
  timeDecay: 'positive' | 'negative' | 'neutral'
  volatilityImpact: 'positive' | 'negative' | 'neutral'
  instructions?: string[]
  examples?: string[]
}

export interface StrategyLeg {
  action: 'buy' | 'sell'
  optionType: 'call' | 'put'
  strike: number
  expiration: string
  quantity: number
}