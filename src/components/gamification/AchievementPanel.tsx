import React, { useState, useMemo } from 'react';
import { useGamification } from '../../context/GamificationContext';
import { AchievementCategory, Achievement } from '../../types/gamification';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  first_steps: 'First Steps',
  strategy_mastery: 'Strategy Mastery',
  greeks_guru: 'Greeks Guru',
  risk_management: 'Risk Management',
  profit_milestones: 'Profit Milestones',
  consistency: 'Consistency',
  community: 'Community',
  learning: 'Learning',
};

const RARITY_COLORS = {
  common: 'border-gray-400 bg-gray-50 dark:bg-gray-900/50',
  uncommon: 'border-green-500 bg-green-50 dark:bg-green-900/20',
  rare: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  epic: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
  legendary: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
};

const RARITY_GLOW = {
  common: '',
  uncommon: 'shadow-green-500/30',
  rare: 'shadow-blue-500/40',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-yellow-500/60 animate-pulse',
};

export function AchievementPanel() {
  const { state } = useGamification();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocked, setShowLocked] = useState(true);

  const filteredAchievements = useMemo(() => {
    return state.achievements.filter(achievement => {
      const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory;
      const matchesSearch = achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
      const isUnlocked = state.unlockedAchievements.includes(achievement.id);
      const matchesLocked = showLocked || isUnlocked;

      return matchesCategory && matchesSearch && matchesLocked;
    });
  }, [state.achievements, state.unlockedAchievements, selectedCategory, searchQuery, showLocked]);

  const unlockedCount = state.unlockedAchievements.length;
  const totalCount = state.achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Achievements</h1>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showLocked}
                  onChange={(e) => setShowLocked(e.target.checked)}
                  className="rounded"
                />
                Show Locked
              </label>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-300">
                Progress: {unlockedCount}/{totalCount} achievements unlocked ({Math.round(progressPercent)}%)
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as AchievementCategory)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAchievements.map((achievement) => {
              const isUnlocked = state.unlockedAchievements.includes(achievement.id);
              const progress = state.achievementProgress[achievement.id];

              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={isUnlocked}
                  progress={progress}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No achievements found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: { current: number; total: number };
}

function AchievementCard({ achievement, isUnlocked, progress }: AchievementCardProps) {
  const progressPercent = progress ? (progress.current / progress.total) * 100 : 0;

  return (
    <div
      className={`
        relative rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer
        ${RARITY_COLORS[achievement.rarity]}
        ${isUnlocked ? `${RARITY_GLOW[achievement.rarity]} shadow-lg` : 'opacity-60'}
        hover:scale-105 hover:shadow-xl
      `}
    >
      {/* Icon */}
      <div className="text-5xl mb-3 text-center">
        {isUnlocked ? achievement.icon : '🔒'}
      </div>

      {/* Name */}
      <h3 className="font-bold text-center mb-1 text-gray-900 dark:text-white">
        {isUnlocked ? achievement.name : '???????????'}
      </h3>

      {/* Rarity Badge */}
      <div className="text-center mb-2">
        <span className={`
          inline-block px-2 py-1 rounded-full text-xs font-semibold uppercase
          ${achievement.rarity === 'common' && 'bg-gray-200 text-gray-700'}
          ${achievement.rarity === 'uncommon' && 'bg-green-200 text-green-700'}
          ${achievement.rarity === 'rare' && 'bg-blue-200 text-blue-700'}
          ${achievement.rarity === 'epic' && 'bg-purple-200 text-purple-700'}
          ${achievement.rarity === 'legendary' && 'bg-yellow-200 text-yellow-700'}
        `}>
          {achievement.rarity}
        </span>
      </div>

      {/* Description/Hint */}
      <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-3">
        {isUnlocked ? achievement.description : (achievement.hint || 'Complete to unlock')}
      </p>

      {/* Progress Bar (if in progress) */}
      {!isUnlocked && progress && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-gray-900 dark:text-white font-semibold">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Rewards */}
      <div className="text-center text-sm">
        {isUnlocked ? (
          <div className="text-green-600 dark:text-green-400 font-semibold">
            Earned: {achievement.xpReward} XP
            {achievement.coinReward && ` • ${achievement.coinReward} Coins`}
          </div>
        ) : (
          <div className="text-gray-600 dark:text-gray-400">
            Reward: {achievement.xpReward} XP
            {achievement.coinReward && ` • ${achievement.coinReward} Coins`}
          </div>
        )}
      </div>

      {/* Unlocked Badge */}
      {isUnlocked && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}
