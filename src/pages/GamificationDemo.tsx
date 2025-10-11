import React, { useState } from 'react';
import { useGamification } from '../context/GamificationContext';
import { ArrowLeft, Trophy, Target, Award, Flame, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GamificationDemo() {
  const navigate = useNavigate();
  const { state, awardXP, unlockAchievement, updateChallengeProgress, recordTrade } = useGamification();
  const [selectedAchievement, setSelectedAchievement] = useState('');

  const handleAwardXP = (amount: number, source: string, icon?: string) => {
    awardXP(amount, source, icon);
  };

  const handleUnlockAchievement = () => {
    if (selectedAchievement) {
      unlockAchievement(selectedAchievement);
    }
  };

  const handleRecordTrade = () => {
    recordTrade();
    // Simulate trade XP
    awardXP(25, 'Trade Executed', '🎯');

    // Update challenge progress
    const dailyTradeChallenge = state.dailyChallenges.find(c => c.id === 'daily_trades_3');
    if (dailyTradeChallenge) {
      const current = state.challengeProgress[dailyTradeChallenge.id]?.current || 0;
      updateChallengeProgress(dailyTradeChallenge.id, current + 1, dailyTradeChallenge.requirement);
    }
  };

  const unlockedAchievements = state.achievements.filter(a =>
    state.unlockedAchievements.includes(a.id)
  );

  const lockedAchievements = state.achievements.filter(a =>
    !state.unlockedAchievements.includes(a.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gamification Demo</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Test gamification features and see how they work</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Current Stats
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Level:</span>
                <span className="font-bold text-gray-900 dark:text-white">{state.level}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Current XP:</span>
                <span className="font-bold text-gray-900 dark:text-white">{state.currentXP}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total XP:</span>
                <span className="font-bold text-gray-900 dark:text-white">{state.totalXP}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Rank:</span>
                <span className="font-bold text-gray-900 dark:text-white">{state.rank}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Current Streak:</span>
                <span className="font-bold text-orange-500">{state.currentStreak} days 🔥</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Options Coins:</span>
                <span className="font-bold text-yellow-500">{state.optionsCoins} 💰</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Achievements:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {state.unlockedAchievements.length} / {state.achievements.length}
                </span>
              </div>
            </div>
          </div>

          {/* XP Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Award XP
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => handleAwardXP(50, 'Small Bonus', '⭐')}
                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
              >
                +50 XP (Small Bonus)
              </button>

              <button
                onClick={() => handleAwardXP(200, 'Medium Bonus', '🎯')}
                className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors"
              >
                +200 XP (Medium Bonus)
              </button>

              <button
                onClick={() => handleAwardXP(1000, 'Large Bonus', '💎')}
                className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
              >
                +1000 XP (Large Bonus)
              </button>

              <button
                onClick={handleRecordTrade}
                className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
              >
                Simulate Trade (+25 XP + Streak)
              </button>
            </div>
          </div>

          {/* Achievement Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Unlock Achievement
            </h2>

            <div className="space-y-3">
              <select
                value={selectedAchievement}
                onChange={(e) => setSelectedAchievement(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select an achievement...</option>
                {lockedAchievements.map(achievement => (
                  <option key={achievement.id} value={achievement.id}>
                    {achievement.icon} {achievement.name} ({achievement.rarity})
                  </option>
                ))}
              </select>

              <button
                onClick={handleUnlockAchievement}
                disabled={!selectedAchievement}
                className="w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                Unlock Selected Achievement
              </button>

              {unlockedAchievements.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Recently Unlocked:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {unlockedAchievements.slice(-5).map(achievement => (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs"
                      >
                        <span>{achievement.icon}</span>
                        <span>{achievement.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Quick Actions
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/app/gamification/profile')}
                className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                View Profile Dashboard
              </button>

              <button
                onClick={() => navigate('/app/gamification/achievements')}
                className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                View Achievements
              </button>

              <button
                onClick={() => navigate('/app/gamification/challenges')}
                className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                View Challenges
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('gamification_state');
                  window.location.reload();
                }}
                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
              >
                Reset Gamification Data
              </button>
            </div>
          </div>

          {/* Challenge Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Daily Challenges Progress
            </h2>

            <div className="space-y-3">
              {state.dailyChallenges.map(challenge => {
                const progress = state.challengeProgress[challenge.id] || { current: 0, total: challenge.requirement };
                const progressPercent = (progress.current / progress.total) * 100;
                const isCompleted = state.completedChallenges.includes(challenge.id);

                return (
                  <div key={challenge.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{challenge.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{challenge.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.description}</p>
                        </div>
                      </div>
                      {isCompleted && (
                        <div className="text-green-500 font-bold">✓</div>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {progress.current}/{progress.total}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-indigo-600'}`}
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Reward: {challenge.xpReward} XP
                      {challenge.coinReward && ` • ${challenge.coinReward} Coins`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
