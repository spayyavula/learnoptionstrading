import React, { useState, useEffect } from 'react';
import { useGamification } from '../../context/GamificationContext';
import { Challenge, ChallengeType } from '../../types/gamification';
import { ArrowLeft, Clock, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ChallengeDashboard() {
  const { state, claimChallengeReward } = useGamification();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ChallengeType>('daily');

  const challenges = {
    daily: state.dailyChallenges,
    weekly: state.weeklyChallenges,
    monthly: state.monthlyChallenges,
  };

  const currentChallenges = challenges[activeTab];

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Challenges</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <TabButton
              active={activeTab === 'daily'}
              onClick={() => setActiveTab('daily')}
              count={state.dailyChallenges.filter(c => state.completedChallenges.includes(c.id) && !state.claimedChallenges.includes(c.id)).length}
            >
              Daily
            </TabButton>
            <TabButton
              active={activeTab === 'weekly'}
              onClick={() => setActiveTab('weekly')}
              count={state.weeklyChallenges.filter(c => state.completedChallenges.includes(c.id) && !state.claimedChallenges.includes(c.id)).length}
            >
              Weekly
            </TabButton>
            <TabButton
              active={activeTab === 'monthly'}
              onClick={() => setActiveTab('monthly')}
              count={state.monthlyChallenges.filter(c => state.completedChallenges.includes(c.id) && !state.claimedChallenges.includes(c.id)).length}
            >
              Monthly
            </TabButton>
          </div>
        </div>
      </div>

      {/* Challenge List */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <ChallengeTimer type={activeTab} expiresAt={currentChallenges[0]?.expiresAt} />
        </div>

        {currentChallenges.length > 0 ? (
          <div className="space-y-4">
            {currentChallenges.map((challenge) => {
              const progress = state.challengeProgress[challenge.id] || { current: 0, total: challenge.requirement };
              const isCompleted = state.completedChallenges.includes(challenge.id);
              const isClaimed = state.claimedChallenges.includes(challenge.id);

              return (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  progress={progress.current}
                  total={progress.total}
                  isCompleted={isCompleted}
                  isClaimed={isClaimed}
                  onClaim={() => claimChallengeReward(challenge.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No {activeTab} challenges available</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Check back soon for new challenges!</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}

function TabButton({ active, onClick, count, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-6 py-2 rounded-lg font-semibold transition-colors
        ${active
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }
      `}
    >
      {children}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}

interface ChallengeTimerProps {
  type: ChallengeType;
  expiresAt?: Date;
}

function ChallengeTimer({ type, expiresAt }: ChallengeTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const getIcon = () => {
    if (type === 'daily') return '🌅';
    if (type === 'weekly') return '📅';
    return '🏆';
  };

  const getLabel = () => {
    if (type === 'daily') return 'DAILY CHALLENGES';
    if (type === 'weekly') return 'WEEKLY CHALLENGES';
    return 'MONTHLY CHALLENGE';
  };

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getIcon()}</span>
          <div>
            <h3 className="text-lg font-bold">{getLabel()}</h3>
            {timeLeft && (
              <p className="text-sm opacity-90">Resets in {timeLeft}</p>
            )}
          </div>
        </div>
        <Clock className="w-6 h-6 opacity-75" />
      </div>
    </div>
  );
}

interface ChallengeCardProps {
  challenge: Challenge;
  progress: number;
  total: number;
  isCompleted: boolean;
  isClaimed: boolean;
  onClaim: () => void;
}

function ChallengeCard({ challenge, progress, total, isCompleted, isClaimed, onClaim }: ChallengeCardProps) {
  const progressPercent = (progress / total) * 100;

  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all
      ${isCompleted && !isClaimed
        ? 'border-green-500 shadow-lg shadow-green-500/20'
        : 'border-gray-200 dark:border-gray-700'
      }
      ${isClaimed && 'opacity-60'}
    `}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="text-4xl">{challenge.icon}</div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {challenge.title}
                {isClaimed && <span className="ml-2 text-sm text-gray-500">(Claimed)</span>}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {challenge.description}
              </p>
            </div>

            {isCompleted && (
              <div className="text-green-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {progress}/{total} {isCompleted && '✓'}
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isCompleted ? 'bg-green-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Rewards & Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                <span>⭐</span>
                <span>+{challenge.xpReward} XP</span>
              </div>
              {challenge.coinReward && (
                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-semibold">
                  <span>💰</span>
                  <span>+{challenge.coinReward} Coins</span>
                </div>
              )}
            </div>

            {isCompleted && !isClaimed && (
              <button
                onClick={onClaim}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors animate-pulse"
              >
                <Gift className="w-4 h-4" />
                Claim Reward
              </button>
            )}

            {isClaimed && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Reward claimed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
