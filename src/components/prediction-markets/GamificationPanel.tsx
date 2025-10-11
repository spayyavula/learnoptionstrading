import React, { useState } from 'react'
import { Trophy, Flame, Target, Award, Star, Lock, TrendingUp, Calendar, Zap } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress?: number
  total?: number
  reward: string
}

interface Challenge {
  id: string
  title: string
  description: string
  progress: number
  total: number
  reward: string
  timeLeft: string
  type: 'weekly' | 'monthly' | 'daily'
}

interface GamificationPanelProps {
  userId: string
  level: number
  xp: number
  xpToNext: number
  streak: number
  achievements: Achievement[]
  challenges: Challenge[]
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({
  level,
  xp,
  xpToNext,
  streak,
  achievements,
  challenges
}) => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'challenges' | 'streak'>('achievements')

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const lockedAchievements = achievements.filter(a => !a.unlocked)

  const streakRewards = [
    { days: 7, reward: '$5 bonus', unlocked: streak >= 7 },
    { days: 30, reward: 'Premium badge', unlocked: streak >= 30 },
    { days: 90, reward: 'Exclusive markets', unlocked: streak >= 90 }
  ]

  const getLevelPerks = (lvl: number) => {
    const perks = []
    if (lvl >= 5) perks.push('Advanced analytics')
    if (lvl >= 8) perks.push('Custom alerts (5 max)')
    if (lvl >= 10) perks.push('Reduced fees (0.3%)')
    if (lvl >= 15) perks.push('Copy trading')
    if (lvl >= 20) perks.push('API access')
    return perks
  }

  const currentPerks = getLevelPerks(level)
  const nextPerks = getLevelPerks(level + 1).filter(p => !currentPerks.includes(p))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with Level */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium opacity-90 mb-1">Level {level}</div>
            <div className="text-2xl font-bold">Seasoned Predictor</div>
          </div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>
        </div>

        {/* XP Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>XP: {xp.toLocaleString()}</span>
            <span>{xpToNext.toLocaleString()} to Level {level + 1}</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${(xp / (xp + xpToNext)) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Perks */}
        {currentPerks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-xs font-medium opacity-90 mb-2">Active Perks:</div>
            <div className="flex flex-wrap gap-2">
              {currentPerks.map(perk => (
                <span
                  key={perk}
                  className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium"
                >
                  ✓ {perk}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'achievements'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Award className="w-4 h-4 inline mr-2" />
          Achievements
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'challenges'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          Challenges
        </button>
        <button
          onClick={() => setActiveTab('streak')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'streak'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Flame className="w-4 h-4 inline mr-2" />
          Streak
        </button>
      </div>

      <div className="p-6">
        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            {/* Unlocked */}
            {unlockedAchievements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Unlocked ({unlockedAchievements.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {unlockedAchievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-700"
                    >
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {achievement.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {achievement.description}
                      </div>
                      <div className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                        {achievement.reward}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked */}
            {lockedAchievements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Locked ({lockedAchievements.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {lockedAchievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 opacity-60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl grayscale">{achievement.icon}</div>
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {achievement.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {achievement.description}
                      </div>
                      {achievement.progress !== undefined && achievement.total && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="font-medium">{achievement.progress}/{achievement.total}</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            {challenges.map(challenge => {
              const progressPercent = (challenge.progress / challenge.total) * 100
              const isComplete = challenge.progress >= challenge.total

              return (
                <div
                  key={challenge.id}
                  className={`p-4 rounded-lg border-2 ${
                    isComplete
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Target className={`w-4 h-4 ${
                          isComplete ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                        }`} />
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {challenge.type} Challenge
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {challenge.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {challenge.description}
                      </p>
                    </div>
                    {isComplete && (
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {challenge.progress}/{challenge.total}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isComplete ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Time left: {challenge.timeLeft}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                      <Star className="w-4 h-4" />
                      <span>{challenge.reward}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {challenges.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No active challenges. Check back soon!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Streak Tab */}
        {activeTab === 'streak' && (
          <div className="space-y-6">
            {/* Current Streak */}
            <div className="text-center py-8 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
              <Flame className="w-16 h-16 text-orange-500 mx-auto mb-3" />
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {streak}
              </div>
              <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                Day Streak! 🎉
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Trade today to keep it going
              </p>
            </div>

            {/* Weekly Calendar */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">This Week</h4>
              <div className="grid grid-cols-7 gap-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                  const isComplete = i < streak % 7
                  const isToday = i === (new Date().getDay() + 6) % 7

                  return (
                    <div key={i} className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{day}</div>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                          isComplete
                            ? 'bg-green-500 text-white'
                            : isToday
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 ring-2 ring-blue-500'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}
                      >
                        {isComplete ? '✓' : '•'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Streak Rewards */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Streak Rewards</h4>
              <div className="space-y-3">
                {streakRewards.map(reward => (
                  <div
                    key={reward.days}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      reward.unlocked
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        reward.unlocked
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}>
                        {reward.unlocked ? <TrendingUp className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {reward.days} Day Streak
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {reward.reward}
                        </div>
                      </div>
                    </div>
                    {!reward.unlocked && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {reward.days - streak} more days
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next Level Preview */}
      {nextPerks.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Unlock at Level {level + 1}:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {nextPerks.map(perk => (
              <span
                key={perk}
                className="px-2 py-1 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800"
              >
                🔒 {perk}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
