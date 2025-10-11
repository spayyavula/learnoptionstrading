import React, { useEffect, useState } from 'react';

interface XPToastProps {
  xp: number;
  source: string;
  icon?: string;
  duration?: number;
  onClose: () => void;
}

export function XPToast({
  xp,
  source,
  icon = '⭐',
  duration = 3000,
  onClose,
}: XPToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 500);

    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  // Determine color based on XP amount
  const getColor = () => {
    if (xp >= 500) return 'from-yellow-400 to-orange-500'; // Large gain - Gold
    if (xp >= 100) return 'from-purple-400 to-pink-500'; // Medium gain - Purple
    return 'from-blue-400 to-indigo-500'; // Small gain - Blue
  };

  const getGlowColor = () => {
    if (xp >= 500) return 'shadow-yellow-500/50';
    if (xp >= 100) return 'shadow-purple-500/50';
    return 'shadow-blue-500/50';
  };

  return (
    <div
      className={`
        fixed top-20 right-4 z-50
        transform transition-all duration-500 ease-out
        ${isExiting ? 'translate-y-[-20px] opacity-0 scale-90' : 'translate-y-0 opacity-100 scale-100'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className={`
        bg-gradient-to-r ${getColor()} text-white
        rounded-lg shadow-xl ${getGlowColor()}
        px-4 py-3 min-w-[200px]
        flex items-center gap-3
        animate-bounce-in
      `}>
        <div className="text-2xl animate-pulse">{icon}</div>
        <div className="flex-1">
          <div className="font-bold text-lg">+{xp.toLocaleString()} XP</div>
          <div className="text-xs opacity-90">{source}</div>
        </div>
      </div>

      {/* Particle effects for large XP gains */}
      {xp >= 500 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-particle"
              style={{
                left: '50%',
                top: '50%',
                animationDelay: `${i * 0.1}s`,
                transform: `rotate(${i * 45}deg) translateX(30px)`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// XPToast Manager Component
interface XPToastManagerProps {
  maxToasts?: number;
}

interface ToastData {
  id: string;
  xp: number;
  source: string;
  icon?: string;
}

export function XPToastManager({ maxToasts = 3 }: XPToastManagerProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handleXPGain = (event: CustomEvent) => {
      const { xp, source, icon } = event.detail;

      const newToast: ToastData = {
        id: `${Date.now()}-${Math.random()}`,
        xp,
        source,
        icon,
      };

      setToasts(prev => {
        const updated = [...prev, newToast];
        // Keep only the latest maxToasts
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });
    };

    window.addEventListener('gamification:xpgain', handleXPGain as EventListener);

    return () => {
      window.removeEventListener('gamification:xpgain', handleXPGain as EventListener);
    };
  }, [maxToasts]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 80}px)`,
          }}
        >
          <XPToast
            xp={toast.xp}
            source={toast.source}
            icon={toast.icon}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </>
  );
}
