import React, { useState } from 'react';
import { useGamification } from '../../context/GamificationContext';
import { getRankForLevel, getXPForLevel, RANKS } from '../../types/gamification';
import { ArrowLeft, Award, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProfileDashboard() {
  const { state } = useGamification();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'leaderboards'>('overview');

  const rankInfo = getRankForLevel(state.level);
  const xpForNextLevel = getXPForLevel(state.level + 1);
  const xpProgress = (state.currentXP / xpForNextLevel) * 100;

  const stats = [
    { label: 'Total XP', value: state.totalXP.toLocaleString(), icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Achievements', value: `${state.unlockedAchievements.length}/${state.achievements.length}`, icon: <Award className="w-5 h-5" /> },
    { label: 'Current Streak', value: `${state.currentStreak} days`, icon: <Target className="w-5 h-5" /> },
    { label: 'Global Rank', value: `#${state.userRanks.global || '---'}`, icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trader Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              {/* Avatar with Rank Badge */}
              <div className="relative inline-block mb-4">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                  style={{
                    backgroundColor: rankInfo.color,
                    boxShadow: `0 10px 30px ${rankInfo.color}40`,
                  }}
                >
                  {state.level}
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
                  Level {state.level}
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {state.userId || 'Trader'}
              </h2>
              <p className="text-sm" style={{ color: rankInfo.color }}>
                {rankInfo.name}
              </p>

              {state.currentStreak > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full text-sm font-semibold">
                  <span>🔥</span>
                  <span>{state.currentStreak}-day streak</span>
                </div>
              )}

              {state.userRanks.global > 0 && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  🏆 Global Rank #{state.userRanks.global}
                </div>
              )}
            </div>
          </div>

          {/* Level Progress */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Level {state.level} - {rankInfo.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{rankInfo.theme}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {state.currentXP.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  / {xpForNextLevel.toLocaleString()} XP
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
                style={{
                  width: `${xpProgress}%`,
                  background: `linear-gradient(90deg, ${rankInfo.color}, ${rankInfo.color}dd)`,
                  boxShadow: xpProgress > 90 ? `0 0 15px ${rankInfo.color}` : 'none',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference">
                {Math.round(xpProgress)}%
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300">
              Next: <span className="font-semibold">Level {state.level + 1}</span> in{' '}
              <span className="font-semibold">{(xpForNextLevel - state.currentXP).toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Achievements</h3>
            <button
              onClick={() => navigate('/app/gamification/achievements')}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All →
            </button>
          </div>

          {state.unlockedAchievements.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {state.unlockedAchievements.slice(-5).map((achievementId, index) => {
                const achievement = state.achievements.find(a => a.id === achievementId);
                if (!achievement) return null;

                return (
                  <div
                    key={index}
                    className="text-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {achievement.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {achievement.rarity}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No achievements unlocked yet</p>
              <p className="text-sm mt-1">Complete challenges and trade to earn achievements!</p>
            </div>
          )}
        </div>

        {/* Rank Progression */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rank Progression</h3>

          <div className="space-y-3">
            {RANKS.map((rank) => {
              const isUnlocked = state.level >= rank.minLevel;
              const isCurrent = state.level >= rank.minLevel && state.level <= rank.maxLevel;

              return (
                <div
                  key={rank.id}
                  className={`
                    flex items-center gap-4 p-3 rounded-lg border transition-all
                    ${isCurrent
                      ? 'border-2 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                    }
                    ${!isUnlocked && 'opacity-50'}
                  `}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: isUnlocked ? rank.color : '#9ca3af' }}
                  >
                    {isUnlocked ? '✓' : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">{rank.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Levels {rank.minLevel}-{rank.maxLevel} • {rank.focus}
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                      Current
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
