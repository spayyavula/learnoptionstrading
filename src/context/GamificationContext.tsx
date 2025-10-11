import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  GamificationState,
  Achievement,
  Challenge,
  PowerUp,
  LeaderboardCategory,
  LeaderboardEntry,
  XPSource,
  getXPForLevel,
  getRankForLevel,
  getStreakMultiplier,
} from '../types/gamification';
import {
  SAMPLE_ACHIEVEMENTS,
  generateDailyChallenges,
  generateWeeklyChallenges,
  generateMonthlyChallenges,
} from '../services/gamificationDataService';

interface GamificationContextType {
  state: GamificationState;
  awardXP: (xp: number, source: string, icon?: string) => void;
  unlockAchievement: (achievementId: string) => void;
  updateAchievementProgress: (achievementId: string, progress: number, total: number) => void;
  updateChallengeProgress: (challengeId: string, progress: number, total: number) => void;
  completeChallenge: (challengeId: string) => void;
  claimChallengeReward: (challengeId: string) => void;
  incrementStreak: () => void;
  breakStreak: () => void;
  recordTrade: () => void;
  purchaseReward: (rewardId: string, cost: number) => void;
  activatePowerUp: (powerUp: PowerUp) => void;
  updateLeaderboard: (category: LeaderboardCategory, entries: LeaderboardEntry[]) => void;
  updateSettings: (settings: Partial<Pick<GamificationState, 'notifications' | 'sounds' | 'animations'>>) => void;
}

type GamificationAction =
  | { type: 'AWARD_XP'; payload: { xp: number; source: string; icon?: string } }
  | { type: 'LEVEL_UP'; payload: { newLevel: number } }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: { achievementId: string } }
  | { type: 'UPDATE_ACHIEVEMENT_PROGRESS'; payload: { achievementId: string; current: number; total: number } }
  | { type: 'UPDATE_CHALLENGE_PROGRESS'; payload: { challengeId: string; current: number; total: number } }
  | { type: 'COMPLETE_CHALLENGE'; payload: { challengeId: string } }
  | { type: 'CLAIM_CHALLENGE_REWARD'; payload: { challengeId: string; xp: number; coins: number } }
  | { type: 'INCREMENT_STREAK' }
  | { type: 'BREAK_STREAK' }
  | { type: 'RECORD_TRADE'; payload: { date: Date } }
  | { type: 'PURCHASE_REWARD'; payload: { rewardId: string; cost: number } }
  | { type: 'ACTIVATE_POWERUP'; payload: { powerUp: PowerUp } }
  | { type: 'UPDATE_LEADERBOARD'; payload: { category: LeaderboardCategory; entries: LeaderboardEntry[] } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Pick<GamificationState, 'notifications' | 'sounds' | 'animations'>> }
  | { type: 'LOAD_STATE'; payload: GamificationState };

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const initialState: GamificationState = {
  userId: '',
  level: 1,
  currentXP: 0,
  totalXP: 0,
  rank: 'Novice Trader',
  achievements: SAMPLE_ACHIEVEMENTS,
  unlockedAchievements: [],
  achievementProgress: {},
  dailyChallenges: generateDailyChallenges(),
  weeklyChallenges: generateWeeklyChallenges(),
  monthlyChallenges: generateMonthlyChallenges(),
  challengeProgress: {},
  completedChallenges: [],
  claimedChallenges: [],
  currentStreak: 0,
  longestStreak: 0,
  tradingDays: [],
  lastTradeDate: null,
  leaderboards: {
    global: [],
    strategy_master: [],
    greeks_guru: [],
    profit_king: [],
    consistency_champion: [],
    risk_manager: [],
    learning_leader: [],
    social_butterfly: [],
    achievement_hunter: [],
    streak_champion: [],
  },
  userRanks: {
    global: 0,
    strategy_master: 0,
    greeks_guru: 0,
    profit_king: 0,
    consistency_champion: 0,
    risk_manager: 0,
    learning_leader: 0,
    social_butterfly: 0,
    achievement_hunter: 0,
    streak_champion: 0,
  },
  optionsCoins: 0,
  purchasedRewards: [],
  activePowerUps: [],
  notifications: true,
  sounds: true,
  animations: true,
};

function gamificationReducer(state: GamificationState, action: GamificationAction): GamificationState {
  switch (action.type) {
    case 'AWARD_XP': {
      const { xp, source } = action.payload;

      // Apply streak multiplier
      const multiplier = getStreakMultiplier(state.currentStreak);
      const finalXP = Math.floor(xp * multiplier);

      const newTotalXP = state.totalXP + finalXP;
      let newLevel = state.level;
      let newCurrentXP = state.currentXP + finalXP;

      // Check for level up
      const xpForNextLevel = getXPForLevel(newLevel + 1);
      if (newCurrentXP >= xpForNextLevel) {
        newLevel += 1;
        newCurrentXP = newCurrentXP - xpForNextLevel;

        // Trigger level up event (will be handled by component)
        window.dispatchEvent(new CustomEvent('gamification:levelup', {
          detail: { level: newLevel, rank: getRankForLevel(newLevel).name }
        }));
      }

      // Trigger XP gain event
      window.dispatchEvent(new CustomEvent('gamification:xpgain', {
        detail: { xp: finalXP, source, icon: action.payload.icon }
      }));

      return {
        ...state,
        currentXP: newCurrentXP,
        totalXP: newTotalXP,
        level: newLevel,
        rank: getRankForLevel(newLevel).name,
      };
    }

    case 'LEVEL_UP': {
      return {
        ...state,
        level: action.payload.newLevel,
        rank: getRankForLevel(action.payload.newLevel).name,
      };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      const { achievementId } = action.payload;

      if (state.unlockedAchievements.includes(achievementId)) {
        return state;
      }

      // Find achievement
      const achievement = state.achievements.find(a => a.id === achievementId);

      if (achievement) {
        // Trigger achievement unlock event
        window.dispatchEvent(new CustomEvent('gamification:achievement', {
          detail: { achievement }
        }));

        // Award XP and coins
        const newState = {
          ...state,
          unlockedAchievements: [...state.unlockedAchievements, achievementId],
        };

        // Award XP
        return gamificationReducer(newState, {
          type: 'AWARD_XP',
          payload: {
            xp: achievement.xpReward,
            source: `Achievement: ${achievement.name}`,
            icon: achievement.icon,
          }
        });
      }

      return state;
    }

    case 'UPDATE_ACHIEVEMENT_PROGRESS': {
      const { achievementId, current, total } = action.payload;

      return {
        ...state,
        achievementProgress: {
          ...state.achievementProgress,
          [achievementId]: { current, total },
        },
      };
    }

    case 'UPDATE_CHALLENGE_PROGRESS': {
      const { challengeId, current, total } = action.payload;

      const newProgress = {
        ...state.challengeProgress,
        [challengeId]: { current, total },
      };

      // Check if challenge is completed
      if (current >= total && !state.completedChallenges.includes(challengeId)) {
        return {
          ...state,
          challengeProgress: newProgress,
          completedChallenges: [...state.completedChallenges, challengeId],
        };
      }

      return {
        ...state,
        challengeProgress: newProgress,
      };
    }

    case 'COMPLETE_CHALLENGE': {
      const { challengeId } = action.payload;

      if (state.completedChallenges.includes(challengeId)) {
        return state;
      }

      return {
        ...state,
        completedChallenges: [...state.completedChallenges, challengeId],
      };
    }

    case 'CLAIM_CHALLENGE_REWARD': {
      const { challengeId, xp, coins } = action.payload;

      if (state.claimedChallenges.includes(challengeId)) {
        return state;
      }

      const newState = {
        ...state,
        claimedChallenges: [...state.claimedChallenges, challengeId],
        optionsCoins: state.optionsCoins + coins,
      };

      // Award XP
      return gamificationReducer(newState, {
        type: 'AWARD_XP',
        payload: { xp, source: 'Challenge Reward', icon: '🏆' }
      });
    }

    case 'INCREMENT_STREAK': {
      const newStreak = state.currentStreak + 1;
      const newLongest = Math.max(newStreak, state.longestStreak);

      // Check for streak milestone
      window.dispatchEvent(new CustomEvent('gamification:streak', {
        detail: { streak: newStreak }
      }));

      return {
        ...state,
        currentStreak: newStreak,
        longestStreak: newLongest,
      };
    }

    case 'BREAK_STREAK': {
      window.dispatchEvent(new CustomEvent('gamification:streakbreak', {
        detail: { brokenStreak: state.currentStreak }
      }));

      return {
        ...state,
        currentStreak: 0,
      };
    }

    case 'RECORD_TRADE': {
      const { date } = action.payload;
      const tradingDays = [...state.tradingDays, date];

      return {
        ...state,
        tradingDays,
        lastTradeDate: date,
      };
    }

    case 'PURCHASE_REWARD': {
      const { rewardId, cost } = action.payload;

      if (state.optionsCoins < cost) {
        console.warn('Insufficient Options Coins');
        return state;
      }

      return {
        ...state,
        optionsCoins: state.optionsCoins - cost,
        purchasedRewards: [...state.purchasedRewards, rewardId],
      };
    }

    case 'ACTIVATE_POWERUP': {
      const { powerUp } = action.payload;

      return {
        ...state,
        activePowerUps: [...state.activePowerUps, powerUp],
      };
    }

    case 'UPDATE_LEADERBOARD': {
      const { category, entries } = action.payload;

      // Find user's rank
      const userRank = entries.findIndex(e => e.userId === state.userId) + 1;

      return {
        ...state,
        leaderboards: {
          ...state.leaderboards,
          [category]: entries,
        },
        userRanks: {
          ...state.userRanks,
          [category]: userRank,
        },
      };
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        ...action.payload,
      };
    }

    case 'LOAD_STATE': {
      return action.payload;
    }

    default:
      return state;
  }
}

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gamificationReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('gamification_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Convert date strings back to Date objects
        parsed.tradingDays = parsed.tradingDays?.map((d: string) => new Date(d)) || [];
        parsed.lastTradeDate = parsed.lastTradeDate ? new Date(parsed.lastTradeDate) : null;
        parsed.activePowerUps = parsed.activePowerUps?.map((p: any) => ({
          ...p,
          expiresAt: new Date(p.expiresAt),
        })) || [];

        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (error) {
        console.error('Failed to load gamification state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gamification_state', JSON.stringify(state));
  }, [state]);

  const awardXP = useCallback((xp: number, source: string, icon?: string) => {
    dispatch({ type: 'AWARD_XP', payload: { xp, source, icon } });
  }, []);

  const unlockAchievement = useCallback((achievementId: string) => {
    dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: { achievementId } });
  }, []);

  const updateAchievementProgress = useCallback((achievementId: string, progress: number, total: number) => {
    dispatch({ type: 'UPDATE_ACHIEVEMENT_PROGRESS', payload: { achievementId, current: progress, total } });

    // Auto-unlock if progress reaches total
    if (progress >= total) {
      unlockAchievement(achievementId);
    }
  }, [unlockAchievement]);

  const updateChallengeProgress = useCallback((challengeId: string, progress: number, total: number) => {
    dispatch({ type: 'UPDATE_CHALLENGE_PROGRESS', payload: { challengeId, current: progress, total } });
  }, []);

  const completeChallenge = useCallback((challengeId: string) => {
    dispatch({ type: 'COMPLETE_CHALLENGE', payload: { challengeId } });
  }, []);

  const claimChallengeReward = useCallback((challengeId: string) => {
    // Find challenge
    const challenge = [
      ...state.dailyChallenges,
      ...state.weeklyChallenges,
      ...state.monthlyChallenges
    ].find(c => c.id === challengeId);

    if (challenge) {
      dispatch({
        type: 'CLAIM_CHALLENGE_REWARD',
        payload: {
          challengeId,
          xp: challenge.xpReward,
          coins: challenge.coinReward || 0,
        }
      });
    }
  }, [state.dailyChallenges, state.weeklyChallenges, state.monthlyChallenges]);

  const incrementStreak = useCallback(() => {
    dispatch({ type: 'INCREMENT_STREAK' });
  }, []);

  const breakStreak = useCallback(() => {
    dispatch({ type: 'BREAK_STREAK' });
  }, []);

  const recordTrade = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already traded today
    const tradedToday = state.tradingDays.some(day => {
      const d = new Date(day);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    if (!tradedToday) {
      dispatch({ type: 'RECORD_TRADE', payload: { date: today } });

      // Check streak
      if (state.lastTradeDate) {
        const lastTrade = new Date(state.lastTradeDate);
        lastTrade.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        if (lastTrade.getTime() === yesterday.getTime()) {
          incrementStreak();
        } else if (lastTrade.getTime() < yesterday.getTime()) {
          breakStreak();
          incrementStreak(); // Start new streak
        }
      } else {
        incrementStreak(); // First trade
      }
    }
  }, [state.tradingDays, state.lastTradeDate, incrementStreak, breakStreak]);

  const purchaseReward = useCallback((rewardId: string, cost: number) => {
    dispatch({ type: 'PURCHASE_REWARD', payload: { rewardId, cost } });
  }, []);

  const activatePowerUp = useCallback((powerUp: PowerUp) => {
    dispatch({ type: 'ACTIVATE_POWERUP', payload: { powerUp } });
  }, []);

  const updateLeaderboard = useCallback((category: LeaderboardCategory, entries: LeaderboardEntry[]) => {
    dispatch({ type: 'UPDATE_LEADERBOARD', payload: { category, entries } });
  }, []);

  const updateSettings = useCallback((settings: Partial<Pick<GamificationState, 'notifications' | 'sounds' | 'animations'>>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const value: GamificationContextType = {
    state,
    awardXP,
    unlockAchievement,
    updateAchievementProgress,
    updateChallengeProgress,
    completeChallenge,
    claimChallengeReward,
    incrementStreak,
    breakStreak,
    recordTrade,
    purchaseReward,
    activatePowerUp,
    updateLeaderboard,
    updateSettings,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
