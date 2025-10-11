import React, { useEffect, useState } from 'react';
import { getRankForLevel, LEVEL_UNLOCKS } from '../../types/gamification';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
  onViewProfile: () => void;
}

export function LevelUpModal({ newLevel, onClose, onViewProfile }: LevelUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const rankInfo = getRankForLevel(newLevel);
  const unlock = LEVEL_UNLOCKS.find(u => u.level === newLevel);
  const nextUnlock = LEVEL_UNLOCKS.find(u => u.level > newLevel);

  useEffect(() => {
    // Auto-dismiss confetti after 3 seconds
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    // Auto-dismiss modal after 10 seconds
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300
        ${isExiting ? 'opacity-0' : 'opacity-100'}
      `}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`
          relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full
          transform transition-all duration-500 ease-out
          ${isExiting ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}
        `}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="levelup-title"
        aria-modal="true"
      >
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  backgroundColor: ['#fbbf24', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6'][Math.floor(Math.random() * 6)],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="text-center">
          {/* Title */}
          <h2 id="levelup-title" className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            🎉 LEVEL UP! 🎉
          </h2>

          {/* Level Badge */}
          <div className="flex justify-center mb-6 animate-scale-bounce">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-2xl"
              style={{
                backgroundColor: rankInfo.color,
                boxShadow: `0 0 40px ${rankInfo.color}80`,
              }}
            >
              {newLevel}
            </div>
          </div>

          {/* Congratulations */}
          <div className="mb-6">
            <p className="text-2xl font-semibold mb-1 text-gray-900 dark:text-white">
              🎊 CONGRATULATIONS! 🎊
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              You've reached Level {newLevel}!
            </p>
            <p
              className="text-md font-semibold mt-2"
              style={{ color: rankInfo.color }}
            >
              {rankInfo.name}
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4" />

          {/* Unlocked Features */}
          {unlock && unlock.features.length > 0 && (
            <div className="mb-6 text-left">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                UNLOCKED:
              </h3>
              <ul className="space-y-2">
                {unlock.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-700 dark:text-gray-300 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Unlock */}
          {nextUnlock && (
            <div className="mb-6 text-left">
              <h3 className="text-sm font-semibold mb-2 text-gray-500 dark:text-gray-400">
                Next Unlock: Level {nextUnlock.level}
              </h3>
              <ul className="space-y-1">
                {nextUnlock.features.slice(0, 2).map((feature, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                  >
                    <span>•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Continue Trading
            </button>
            <button
              onClick={() => {
                handleClose();
                onViewProfile();
              }}
              className="flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
              style={{
                backgroundColor: rankInfo.color,
                boxShadow: `0 4px 14px ${rankInfo.color}40`,
              }}
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Level Up Manager Component
export function LevelUpManager() {
  const [levelUpData, setLevelUpData] = useState<{ level: number; rank: string } | null>(null);

  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      const { level, rank } = event.detail;
      setLevelUpData({ level, rank });

      // Play sound effect (if enabled)
      if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        // You can add a sound effect here
      }
    };

    window.addEventListener('gamification:levelup', handleLevelUp as EventListener);

    return () => {
      window.removeEventListener('gamification:levelup', handleLevelUp as EventListener);
    };
  }, []);

  if (!levelUpData) return null;

  return (
    <LevelUpModal
      newLevel={levelUpData.level}
      onClose={() => setLevelUpData(null)}
      onViewProfile={() => {
        setLevelUpData(null);
        window.location.href = '/app/gamification/profile';
      }}
    />
  );
}
