// Gamification Types

export type AchievementCategory =
  | 'first_steps'
  | 'strategy_mastery'
  | 'greeks_guru'
  | 'risk_management'
  | 'profit_milestones'
  | 'consistency'
  | 'community'
  | 'learning';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  xpReward: number;
  coinReward?: number;
  requirement: string;
  hint?: string;
  requirement_value: number;
}

export type ChallengeType = 'daily' | 'weekly' | 'monthly';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  icon: string;
  xpReward: number;
  coinReward?: number;
  requirement: number;
  category: string;
  expiresAt: Date;
}

export type LeaderboardCategory =
  | 'global'
  | 'strategy_master'
  | 'greeks_guru'
  | 'profit_king'
  | 'consistency_champion'
  | 'risk_manager'
  | 'learning_leader'
  | 'social_butterfly'
  | 'achievement_hunter'
  | 'streak_champion';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  xp: number;
  change?: number; // Position change
  value?: number; // Category-specific value
}

export type RewardCategory = 'all' | 'powerups' | 'cosmetics' | 'features' | 'real';

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  cost: number;
  icon: string;
  image?: string;
  isPurchased?: boolean;
  isConsumable: boolean;
  quantity?: number;
}

export interface PowerUp {
  id: string;
  name: string;
  type: 'xp_boost' | 'risk_shield' | 'trade_retry';
  multiplier?: number;
  expiresAt: Date;
  remainingUses?: number;
}

export interface RankInfo {
  id: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  theme: string;
  focus: string;
}

export const RANKS: RankInfo[] = [
  { id: 1, name: 'Novice Trader', minLevel: 1, maxLevel: 10, color: '#94a3b8', theme: '🌱 Seedling', focus: 'Basics, Paper Trading' },
  { id: 2, name: 'Apprentice', minLevel: 11, maxLevel: 20, color: '#22c55e', theme: '📚 Student', focus: 'Strategy Fundamentals' },
  { id: 3, name: 'Strategist', minLevel: 21, maxLevel: 30, color: '#3b82f6', theme: '🎯 Focused', focus: 'Multi-leg Strategies' },
  { id: 4, name: 'Risk Manager', minLevel: 31, maxLevel: 40, color: '#8b5cf6', theme: '🛡️ Protected', focus: 'Greeks & Risk' },
  { id: 5, name: 'Options Veteran', minLevel: 41, maxLevel: 50, color: '#ec4899', theme: '⚔️ Experienced', focus: 'Advanced Tactics' },
  { id: 6, name: 'Market Wizard', minLevel: 51, maxLevel: 60, color: '#f59e0b', theme: '🧙 Magical', focus: 'Market Analysis' },
  { id: 7, name: 'Portfolio Master', minLevel: 61, maxLevel: 70, color: '#ef4444', theme: '💼 Professional', focus: 'Portfolio Optimization' },
  { id: 8, name: 'Elite Trader', minLevel: 71, maxLevel: 80, color: '#14b8a6', theme: '👑 Royal', focus: 'Consistent Profitability' },
  { id: 9, name: 'Options Sensei', minLevel: 81, maxLevel: 90, color: '#a855f7', theme: '🥋 Master', focus: 'Teaching Others' },
  { id: 10, name: 'Trading Legend', minLevel: 91, maxLevel: 100, color: '#fbbf24', theme: '🏆 Legendary', focus: 'Hall of Fame' },
];

export interface GamificationState {
  // User Progress
  userId: string;
  level: number;
  currentXP: number;
  totalXP: number;
  rank: string;

  // Achievements
  achievements: Achievement[];
  unlockedAchievements: string[];
  achievementProgress: Record<string, { current: number; total: number }>;

  // Challenges
  dailyChallenges: Challenge[];
  weeklyChallenges: Challenge[];
  monthlyChallenges: Challenge[];
  challengeProgress: Record<string, { current: number; total: number }>;
  completedChallenges: string[];
  claimedChallenges: string[];

  // Streaks
  currentStreak: number;
  longestStreak: number;
  tradingDays: Date[];
  lastTradeDate: Date | null;

  // Leaderboards
  leaderboards: Record<LeaderboardCategory, LeaderboardEntry[]>;
  userRanks: Record<LeaderboardCategory, number>;

  // Rewards
  optionsCoins: number;
  purchasedRewards: string[];
  activePowerUps: PowerUp[];

  // Settings
  notifications: boolean;
  sounds: boolean;
  animations: boolean;
}

export interface XPSource {
  amount: number;
  source: string;
  icon?: string;
}

// XP Requirements per level (exponential growth)
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

// Get total XP needed to reach a level
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

// Get rank info for a given level
export function getRankForLevel(level: number): RankInfo {
  return RANKS.find(rank => level >= rank.minLevel && level <= rank.maxLevel) || RANKS[0];
}

// Calculate streak multiplier
export function getStreakMultiplier(streak: number): number {
  if (streak < 3) return 1.0;
  if (streak < 7) return 1.25;
  if (streak < 14) return 1.5;
  if (streak < 30) return 1.75;
  if (streak < 60) return 2.0;
  if (streak < 90) return 2.25;
  return 2.5; // Max multiplier
}

// Streak milestone rewards
export interface StreakMilestone {
  days: number;
  xpBonus: number;
  cashReward?: number;
  badge?: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, xpBonus: 50 },
  { days: 7, xpBonus: 100, cashReward: 5 },
  { days: 14, xpBonus: 200, cashReward: 10 },
  { days: 30, xpBonus: 500, cashReward: 25, badge: 'Bronze Streak' },
  { days: 60, xpBonus: 1000, cashReward: 50, badge: 'Silver Streak' },
  { days: 90, xpBonus: 2000, cashReward: 100, badge: 'Gold Streak' },
  { days: 180, xpBonus: 5000, cashReward: 250, badge: 'Platinum Streak' },
  { days: 365, xpBonus: 10000, cashReward: 500, badge: 'Diamond Streak' },
];

// Level unlock features
export interface LevelUnlock {
  level: number;
  features: string[];
}

export const LEVEL_UNLOCKS: LevelUnlock[] = [
  { level: 5, features: ['Advanced Charts', '+5 Watchlist Slots'] },
  { level: 10, features: ['Options Chain Scanner', 'Real-time Greeks'] },
  { level: 15, features: ['Multi-leg Strategy Builder', '+10 Watchlist Slots'] },
  { level: 20, features: ['Paper Trading Competitions', 'Custom Alerts'] },
  { level: 25, features: ['Portfolio Risk Analyzer', 'Advanced Greeks Calculator'] },
  { level: 30, features: ['Backtesting Engine', '+15 Watchlist Slots'] },
  { level: 35, features: ['Strategy Templates Library', 'Auto-hedging Tools'] },
  { level: 40, features: ['Volatility Surface Viewer', 'Custom Indicators'] },
  { level: 45, features: ['AI Trade Suggestions', '+20 Watchlist Slots'] },
  { level: 50, features: ['Elite Trader Badge', 'Premium Support'] },
  { level: 55, features: ['Advanced Risk Metrics', 'Portfolio Optimization'] },
  { level: 60, features: ['Market Wizard Tools', '+25 Watchlist Slots'] },
  { level: 65, features: ['Institutional-grade Analytics', 'Custom API Access'] },
  { level: 70, features: ['Portfolio Master Suite', 'Advanced Backtesting'] },
  { level: 75, features: ['Real-time Market Scanner', '+30 Watchlist Slots'] },
  { level: 80, features: ['Elite Trader Lounge Access', 'Priority Execution'] },
  { level: 85, features: ['Sensei Mentorship Program', 'Teaching Tools'] },
  { level: 90, features: ['Legend Dashboard', '+50 Watchlist Slots'] },
  { level: 95, features: ['Hall of Fame Entry', 'Unlimited Features'] },
  { level: 100, features: ['Trading Legend Status', 'Lifetime Premium Access'] },
];
