import React, { useState } from 'react';
import { useGamification } from '../../context/GamificationContext';
import { getXPForLevel, getRankForLevel } from '../../types/gamification';
import { useNavigate } from 'react-router-dom';

interface GamificationHUDProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
  showStreak?: boolean;
  showRank?: boolean;
}

export function GamificationHUD({
  position = 'top-right',
  compact = true,
  showStreak = true,
  showRank = false,
}: GamificationHUDProps) {
  const { state } = useGamification();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const xpForNextLevel = getXPForLevel(state.level + 1);
  const xpProgress = (state.currentXP / xpForNextLevel) * 100;
  const rankInfo = getRankForLevel(state.level);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 transition-all duration-300 cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate('/app/gamification/profile')}
      role="complementary"
      aria-label="Gamification progress"
    >
      <div className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700
        p-3 min-w-[280px] transition-all duration-300
        ${isHovered ? 'scale-105 shadow-xl' : ''}
      `}>
        {/* Level and XP */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
              style={{ backgroundColor: rankInfo.color }}
            >
              {state.level}
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Level {state.level}</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {state.currentXP.toLocaleString()} XP
              </div>
            </div>
          </div>

          {/* Rank Badge */}
          {showRank && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span>🏆</span>
              <span>#{state.userRanks.global || '---'}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
            style={{
              width: `${xpProgress}%`,
              backgroundColor: rankInfo.color,
              boxShadow: xpProgress > 90 ? `0 0 10px ${rankInfo.color}` : 'none',
            }}
          />
        </div>

        {/* Bottom Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-500 dark:text-gray-400">
            {xpForNextLevel - state.currentXP} XP to Level {state.level + 1}
          </div>

          {showStreak && state.currentStreak > 0 && (
            <div className="flex items-center gap-1 text-orange-500 font-semibold">
              <span>🔥</span>
              <span>{state.currentStreak} day{state.currentStreak !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Hover Tooltip */}
        {isHovered && (
          <div className="absolute top-full right-0 mt-2 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl min-w-[200px] z-50">
            <div className="font-semibold mb-1">{rankInfo.name}</div>
            <div className="text-xs text-gray-300 mb-2">{rankInfo.theme}</div>
            <div className="text-xs text-gray-400">
              Next: Level {state.level + 1} in {(xpForNextLevel - state.currentXP).toLocaleString()} XP
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
