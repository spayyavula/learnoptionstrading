# Options Trading Gamification - UX Specifications

## Table of Contents
1. [Design System](#design-system)
2. [Core Components](#core-components)
3. [Component Specifications](#component-specifications)
4. [Interaction Patterns](#interaction-patterns)
5. [Animation Guidelines](#animation-guidelines)
6. [Responsive Design](#responsive-design)
7. [Accessibility](#accessibility)

---

## Design System

### Color Palette

#### Primary Colors
```css
--gamification-primary: #6366f1;      /* Indigo - Primary actions */
--gamification-primary-hover: #4f46e5;
--gamification-primary-light: #818cf8;
--gamification-primary-dark: #3730a3;
```

#### Rank Colors
```css
--rank-novice: #94a3b8;        /* Slate - Levels 1-10 */
--rank-apprentice: #22c55e;    /* Green - Levels 11-20 */
--rank-strategist: #3b82f6;    /* Blue - Levels 21-30 */
--rank-risk-manager: #8b5cf6;  /* Purple - Levels 31-40 */
--rank-veteran: #ec4899;       /* Pink - Levels 41-50 */
--rank-wizard: #f59e0b;        /* Amber - Levels 51-60 */
--rank-master: #ef4444;        /* Red - Levels 61-70 */
--rank-elite: #14b8a6;         /* Teal - Levels 71-80 */
--rank-sensei: #a855f7;        /* Violet - Levels 81-90 */
--rank-legend: #fbbf24;        /* Gold - Levels 91-100 */
```

#### Achievement Rarity Colors
```css
--achievement-common: #71717a;     /* Gray */
--achievement-uncommon: #22c55e;   /* Green */
--achievement-rare: #3b82f6;       /* Blue */
--achievement-epic: #a855f7;       /* Purple */
--achievement-legendary: #f59e0b;  /* Gold */
```

#### Status Colors
```css
--status-success: #22c55e;
--status-warning: #f59e0b;
--status-error: #ef4444;
--status-info: #3b82f6;
```

#### Neutral Colors
```css
--neutral-50: #f8fafc;
--neutral-100: #f1f5f9;
--neutral-200: #e2e8f0;
--neutral-300: #cbd5e1;
--neutral-700: #334155;
--neutral-800: #1e293b;
--neutral-900: #0f172a;
```

### Typography

#### Font Stack
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'Poppins', 'Inter', sans-serif;
--font-mono: 'Fira Code', 'Consolas', monospace;
```

#### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
```

### Spacing System
```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

### Border Radius
```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
```

### Animation Timing
```css
--transition-fast: 150ms;
--transition-base: 250ms;
--transition-slow: 350ms;
--transition-slower: 500ms;

--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## Core Components

### Component Architecture

```
src/components/gamification/
├── GamificationProvider.tsx       # Context provider for gamification state
├── GamificationHUD.tsx            # Main HUD overlay
├── Profile/
│   ├── ProfileCard.tsx            # Compact profile card
│   ├── ProfileDashboard.tsx       # Full profile page
│   ├── LevelProgressBar.tsx       # XP progress bar
│   ├── RankBadge.tsx              # Rank display badge
│   └── StatsOverview.tsx          # Key stats display
├── Achievements/
│   ├── AchievementPanel.tsx       # Achievement browser
│   ├── AchievementCard.tsx        # Single achievement card
│   ├── AchievementNotification.tsx # Achievement unlock toast
│   ├── AchievementGrid.tsx        # Grid of achievements
│   └── AchievementProgress.tsx    # Progress towards achievement
├── Challenges/
│   ├── ChallengeDashboard.tsx     # Challenge hub
│   ├── ChallengeCard.tsx          # Single challenge card
│   ├── DailyChallenges.tsx        # Daily challenges widget
│   ├── WeeklyChallenges.tsx       # Weekly challenges widget
│   └── ChallengeTimer.tsx         # Challenge countdown
├── Leaderboards/
│   ├── LeaderboardPanel.tsx       # Leaderboard browser
│   ├── LeaderboardTable.tsx       # Leaderboard table
│   ├── LeaderboardEntry.tsx       # Single leaderboard row
│   └── LeaderboardFilters.tsx     # Category/time filters
├── Streaks/
│   ├── StreakTracker.tsx          # Streak display widget
│   ├── StreakCalendar.tsx         # Visual streak calendar
│   └── StreakRewards.tsx          # Streak milestone rewards
├── Rewards/
│   ├── RewardsShop.tsx            # Rewards marketplace
│   ├── RewardCard.tsx             # Single reward item
│   └── RewardsPurchaseModal.tsx   # Purchase confirmation
├── Notifications/
│   ├── XPToast.tsx                # XP earned notification
│   ├── LevelUpModal.tsx           # Level up celebration
│   ├── StreakWarning.tsx          # Streak about to break
│   └── NotificationCenter.tsx     # All notifications
└── Social/
    ├── FriendsList.tsx            # Friends management
    ├── ClanPanel.tsx              # Clan/team management
    └── CompetitionBracket.tsx     # Tournament bracket
```

---

## Component Specifications

### 1. GamificationHUD (Main Overlay)

**Purpose**: Persistent on-screen display of key gamification elements

**Location**: Top-right corner of the app (non-intrusive)

**Visual Structure**:
```
┌─────────────────────────────────────┐
│  Level 42  [════════════70%]  12,450│
│  ⚡ Streak: 7 days    🏆 Rank: #156 │
└─────────────────────────────────────┘
```

**Component Props**:
```typescript
interface GamificationHUDProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
  showStreak?: boolean;
  showRank?: boolean;
  onClick?: () => void;
}
```

**States**:
- **Default**: Compact view with level, XP bar, streak
- **Hover**: Slightly enlarged with tooltip showing next level
- **XP Gain**: Pulsing animation when XP is earned
- **Level Up**: Golden glow effect
- **Streak Danger**: Red pulsing if streak is about to break

**Interactions**:
- Click: Opens full Profile Dashboard
- Hover: Shows detailed tooltip with next level requirements
- XP earned: Animates progress bar fill + shows "+XP" floating text

**Accessibility**:
- `role="complementary"`
- `aria-label="Gamification progress"`
- Keyboard shortcut: `Ctrl+G` to focus

---

### 2. ProfileDashboard (Full Profile Page)

**Purpose**: Comprehensive view of user's gamification progress

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back                     TRADER PROFILE                    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────┐  ┌────────────────────────────────┐│
│  │   [Avatar/Badge]     │  │  LEVEL 42 - RISK MANAGER       ││
│  │   JohnTrader123      │  │  [════════════════70%]          ││
│  │   ⚡ 7-day streak    │  │  12,450 / 17,500 XP            ││
│  │   🏆 Global #156     │  │                                 ││
│  └──────────────────────┘  │  Next: Level 43 in 5,050 XP    ││
│                             └────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │                    RECENT ACHIEVEMENTS                    ││
│  │  [Achievement 1]  [Achievement 2]  [Achievement 3]        ││
│  │  [Achievement 4]  [Achievement 5]  [View All →]          ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐│
│  │ TRADES          │  │ WIN RATE        │  │ STRATEGIES    ││
│  │ 342             │  │ 67.8%           │  │ 18 Mastered   ││
│  └─────────────────┘  └─────────────────┘  └───────────────┘│
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                   ACTIVITY CHART                          ││
│  │  [Heatmap showing trading activity over last 90 days]    ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐│
│  │ XP BREAKDOWN   │  │ LEADERBOARDS   │  │ ACHIEVEMENTS    ││
│  │ (Tab Content)  │  │ (Tab Content)  │  │ (Tab Content)   ││
│  └────────────────┘  └────────────────┘  └─────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

**Component Props**:
```typescript
interface ProfileDashboardProps {
  userId?: string;  // If viewing another user's profile
  editable?: boolean;  // Can edit own profile
}
```

**Sections**:

1. **Hero Section**
   - User avatar with rank badge overlay
   - Username and current rank
   - Level progress bar (large, prominent)
   - Current XP / Total XP needed
   - Streak count with fire emoji
   - Global rank position

2. **Recent Achievements** (4-6 most recent)
   - Achievement icons with rarity glow
   - Click to view achievement details
   - "View All" button to open Achievement Panel

3. **Stats Grid**
   - Total trades
   - Win rate percentage
   - Strategies mastered
   - Total profit/loss
   - Risk score
   - Greeks knowledge score

4. **Activity Heatmap**
   - GitHub-style contribution graph
   - Shows trading activity over last 90 days
   - Darker = more active
   - Hover shows day details

5. **Tabbed Content**
   - **XP Breakdown**: Pie chart of XP sources
   - **Leaderboards**: User's ranks across categories
   - **Achievements**: Full achievement list

**Responsive Behavior**:
- Desktop: 3-column layout
- Tablet: 2-column layout
- Mobile: Single column, stacked

---

### 3. LevelProgressBar

**Purpose**: Visual XP progress indicator

**Variants**:

**A. Compact (for HUD)**
```
Level 42  [════════════70%]  12,450 XP
```

**B. Full-width (for Profile)**
```
┌────────────────────────────────────────────────────────┐
│ LEVEL 42 - RISK MANAGER                                │
│ ██████████████████████████░░░░░░░░ 70% (12,450/17,500) │
│                                    Next: Level 43       │
└────────────────────────────────────────────────────────┘
```

**Component Props**:
```typescript
interface LevelProgressBarProps {
  currentLevel: number;
  currentXP: number;
  xpForNextLevel: number;
  rank: string;
  variant?: 'compact' | 'full';
  showPercentage?: boolean;
  animated?: boolean;
}
```

**Visual Features**:
- Gradient fill based on rank color
- Shimmer effect on fill
- Smooth animation when XP increases
- Glow effect when near level up (>90%)
- Level number badge on left
- XP numbers on right

**Animation**:
```css
/* XP gain animation */
@keyframes xpGain {
  0% { width: var(--old-width); }
  100% { width: var(--new-width); }
}

/* Near level-up glow */
@keyframes levelUpGlow {
  0%, 100% { box-shadow: 0 0 10px var(--rank-color); }
  50% { box-shadow: 0 0 20px var(--rank-color); }
}
```

---

### 4. AchievementPanel

**Purpose**: Browse and track all achievements

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back                  ACHIEVEMENTS                  🔍 Search│
├──────────────────────────────────────────────────────────────┤
│  [All] [First Steps] [Strategy] [Greeks] [Risk] [Profit] ... │
├──────────────────────────────────────────────────────────────┤
│  Progress: 42/100 achievements unlocked (42%)                 │
│  [══════════════════░░░░░░░░░░░░░░░░░░░░░░░░░] 42%          │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  ✅ UNLOCKED│  │  ✅ UNLOCKED│  │  🔒 LOCKED  │          │
│  │   [Icon]    │  │   [Icon]    │  │   [Icon]    │          │
│  │ First Trade │  │ Iron Condor │  │ ???????????  │          │
│  │  COMMON     │  │    RARE     │  │  LEGENDARY  │          │
│  │ Place your  │  │ Execute 10  │  │ Progress:   │          │
│  │ first trade │  │ iron condors│  │ 5/100       │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                                │
│  [More achievement cards...]                                  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**Component Props**:
```typescript
interface AchievementPanelProps {
  initialCategory?: AchievementCategory;
  searchQuery?: string;
  showLocked?: boolean;
  sortBy?: 'recent' | 'rarity' | 'progress';
}
```

**Features**:

1. **Category Tabs**
   - All
   - First Steps
   - Strategy Mastery
   - Greeks Guru
   - Risk Management
   - Profit Milestones
   - Consistency
   - Community
   - Learning

2. **Search Bar**
   - Real-time filtering
   - Search by name or description

3. **Overall Progress Bar**
   - Shows X/100 achievements unlocked
   - Visual percentage bar

4. **Achievement Grid**
   - 3-4 columns on desktop
   - 2 columns on tablet
   - 1 column on mobile
   - Auto-height cards

5. **Achievement Card States**
   - **Unlocked**: Full color, shows unlock date
   - **In Progress**: Partially dimmed, shows progress bar
   - **Locked**: Grayscale, shows "???" or hint

**Interactions**:
- Click card: Opens detailed modal
- Hover: Shows tooltip with description
- Filter by category
- Sort by recent/rarity/progress
- Toggle show/hide locked achievements

---

### 5. AchievementCard

**Purpose**: Single achievement display

**States**:

**A. Unlocked**
```
┌─────────────────────────┐
│    ✨ [Golden Icon]     │
│   FIRST IRON CONDOR     │
│   ──────────────────    │
│   Rare Achievement      │
│   Unlocked: 2 days ago  │
│   +500 XP               │
└─────────────────────────┘
```

**B. In Progress**
```
┌─────────────────────────┐
│    🔓 [Dimmed Icon]     │
│   CONDOR MASTER         │
│   ──────────────────    │
│   Epic Achievement      │
│   [████████░░] 8/10     │
│   Reward: +1000 XP      │
└─────────────────────────┘
```

**C. Locked (Hidden)**
```
┌─────────────────────────┐
│    🔒 [Mystery Icon]    │
│   ???????????????     │
│   ──────────────────    │
│   Legendary Achievement │
│   "Master volatility"   │
│   Reward: ???           │
└─────────────────────────┘
```

**Component Props**:
```typescript
interface AchievementCardProps {
  achievement: Achievement;
  progress?: number;
  total?: number;
  unlocked: boolean;
  unlockedAt?: Date;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  xpReward: number;
  coinReward?: number;
  requirement: string;
  hint?: string;
}
```

**Visual Design**:
- **Border**: Glows with rarity color when unlocked
- **Background**: Gradient overlay for unlocked achievements
- **Icon**: Large, centered, animated on unlock
- **Rarity Badge**: Color-coded pill at top
- **Progress Bar**: For in-progress achievements
- **Unlock Date**: "Unlocked X days ago"
- **Rewards**: XP and coin amounts

**Rarity Visual Treatments**:
```css
/* Common - Gray, no glow */
.achievement-common {
  border: 2px solid var(--achievement-common);
}

/* Uncommon - Green, subtle glow */
.achievement-uncommon {
  border: 2px solid var(--achievement-uncommon);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
}

/* Rare - Blue, medium glow */
.achievement-rare {
  border: 2px solid var(--achievement-rare);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
}

/* Epic - Purple, strong glow */
.achievement-epic {
  border: 2px solid var(--achievement-epic);
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
}

/* Legendary - Gold, radiant glow */
.achievement-legendary {
  border: 2px solid var(--achievement-legendary);
  box-shadow: 0 0 25px rgba(245, 158, 11, 0.6);
  animation: legendaryPulse 2s infinite;
}

@keyframes legendaryPulse {
  0%, 100% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.6); }
  50% { box-shadow: 0 0 35px rgba(245, 158, 11, 0.8); }
}
```

---

### 6. AchievementNotification (Toast)

**Purpose**: Celebrate achievement unlock in real-time

**Visual**:
```
┌────────────────────────────────────────┐
│  🎉 ACHIEVEMENT UNLOCKED! 🎉           │
│  ────────────────────────────────────  │
│         ✨ [Large Icon]                │
│     FIRST IRON CONDOR MASTER           │
│                                        │
│  You've executed your first iron      │
│  condor spread!                        │
│                                        │
│  +500 XP  💰 +50 Coins                │
│  [View Achievement]                    │
└────────────────────────────────────────┘
```

**Component Props**:
```typescript
interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
  onViewDetails: () => void;
  autoClose?: boolean;
  duration?: number;  // Default: 5000ms
}
```

**Animation Sequence**:
1. **Entrance** (0-500ms): Slide in from top with bounce
2. **Icon** (500-1000ms): Icon scales up with glow effect
3. **Confetti** (0-2000ms): Particle explosion around icon
4. **Text** (1000-1500ms): Title fades in with scale
5. **Hold** (1500-4500ms): Display achievement details
6. **Exit** (4500-5000ms): Fade out with slide up

**Audio**:
- Play achievement unlock sound (optional, user setting)
- Different sounds for different rarities

**Interaction**:
- Click anywhere: View full achievement details
- Click X: Dismiss early
- Auto-close after 5 seconds

---

### 7. ChallengeDashboard

**Purpose**: Hub for daily, weekly, and monthly challenges

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back                  CHALLENGES                           │
├──────────────────────────────────────────────────────────────┤
│  [Daily] [Weekly] [Monthly]                                   │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  🌅 DAILY CHALLENGES - Resets in 04:32:15                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ✅ Place 3 trades                           [█████] 3/3│  │
│  │    +100 XP earned                                       │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 📈 Close a profitable trade                 [████░] 1/1│  │
│  │    +150 XP • Click to claim reward                     │  │
│  │    [Claim Reward]                                       │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🎯 Use Greeks in a decision                 [███░░] 0/1│  │
│  │    +75 XP                                               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  📅 WEEKLY CHALLENGES - Resets in 3 days                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🔥 Maintain a 7-day streak                 [████░] 5/7 │  │
│  │    +500 XP                                              │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 📚 Complete 5 strategy lessons            [███░░] 3/5  │  │
│  │    +300 XP                                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  🏆 MONTHLY CHALLENGE - Resets in 18 days                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 💰 Achieve 20% portfolio growth           [██░░░] 8/20 │  │
│  │    +2000 XP • 💎 Legendary Badge                       │  │
│  │    Current progress: 8.2%                               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Component Props**:
```typescript
interface ChallengeDashboardProps {
  initialTab?: 'daily' | 'weekly' | 'monthly';
  highlightNew?: boolean;
}
```

**Features**:

1. **Tab Navigation**
   - Daily / Weekly / Monthly tabs
   - Badge showing number of completable challenges

2. **Challenge Cards**
   - Challenge icon and title
   - Progress bar with fraction (e.g., 3/5)
   - XP reward amount
   - "Claim Reward" button when completed
   - Completion checkmark

3. **Timer Display**
   - Countdown to challenge reset
   - Different colors for urgency:
     - Green: >24 hours
     - Yellow: 6-24 hours
     - Red: <6 hours

4. **Challenge States**
   - **Not Started**: Gray progress bar, no checkmark
   - **In Progress**: Colored progress bar, shows progress
   - **Completed**: Green checkmark, "Claim Reward" button
   - **Claimed**: Dimmed with checkmark

**Interactions**:
- Click "Claim Reward": Triggers XP animation, marks as claimed
- Click challenge card: Shows challenge details modal
- Hover: Shows tooltip with requirements

---

### 8. ChallengeCard

**Purpose**: Individual challenge display

**Visual States**:

**A. In Progress**
```
┌─────────────────────────────────────────────┐
│ 📈 Close 5 Profitable Trades                │
│                                             │
│ [████████████░░░░░] 60% (3/5)              │
│                                             │
│ Reward: +250 XP • 💰 25 Coins              │
│ Time remaining: 18h 32m                     │
└─────────────────────────────────────────────┘
```

**B. Completed (Unclaimed)**
```
┌─────────────────────────────────────────────┐
│ ✅ Place 3 Trades Today                     │
│                                             │
│ [████████████████████] 100% (3/3) ✓        │
│                                             │
│ Reward: +100 XP • 💰 10 Coins              │
│ [🎁 Claim Reward]                          │
└─────────────────────────────────────────────┘
```

**C. Claimed**
```
┌─────────────────────────────────────────────┐
│ ✅ Use Greeks in Decision (Claimed)         │
│                                             │
│ [████████████████████] 100% (1/1) ✓        │
│                                             │
│ Earned: +75 XP • 💰 10 Coins               │
│ Claimed 2 hours ago                         │
└─────────────────────────────────────────────┘
```

**Component Props**:
```typescript
interface ChallengeCardProps {
  challenge: Challenge;
  progress: number;
  total: number;
  completed: boolean;
  claimed: boolean;
  expiresAt: Date;
  onClaim: () => void;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  icon: string;
  xpReward: number;
  coinReward?: number;
  requirement: number;
  category: string;
}
```

**Animations**:
- Progress bar fills smoothly
- "Claim Reward" button pulses when ready
- Checkmark appears with bounce on completion
- Confetti burst when claiming reward

---

### 9. LeaderboardPanel

**Purpose**: Display global and category-specific rankings

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back                 LEADERBOARDS              🔄 Refresh  │
├──────────────────────────────────────────────────────────────┤
│  [Global] [Strategy] [Greeks] [Profit] [Consistency] ...     │
│  [All Time] [This Month] [This Week] [Today]                 │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  YOUR RANK: #156 🔺 +12 positions this week                  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Rank │ Player          │ Level │ XP      │ Change    │  │
│  ├──────┼─────────────────┼───────┼─────────┼───────────┤  │
│  │  🥇1 │ TradeMaster99   │  100  │ 277,500 │ --        │  │
│  │  🥈2 │ OptionsKing     │   98  │ 265,000 │ 🔺 +1     │  │
│  │  🥉3 │ GreeksGuru      │   97  │ 260,500 │ 🔻 -1     │  │
│  │   4  │ IronCondorPro   │   95  │ 248,000 │ --        │  │
│  │   5  │ DeltaHedger     │   94  │ 242,000 │ --        │  │
│  │  ... │ ...             │  ...  │ ...     │ ...       │  │
│  │  156 │ 👤 YOU          │   42  │  12,450 │ 🔺 +12    │  │
│  │  ... │ ...             │  ...  │ ...     │ ...       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  [Load More]                                                  │
└──────────────────────────────────────────────────────────────┘
```

**Component Props**:
```typescript
interface LeaderboardPanelProps {
  initialCategory?: LeaderboardCategory;
  initialTimeframe?: 'all' | 'month' | 'week' | 'day';
  userId: string;
}

type LeaderboardCategory =
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
```

**Features**:

1. **Category Tabs**
   - Global (overall XP)
   - Strategy Mastery
   - Greeks Knowledge
   - Profit Generation
   - Consistency
   - Risk Management
   - Learning
   - Social Activity
   - Achievements
   - Streak Length

2. **Timeframe Filters**
   - All Time
   - This Month
   - This Week
   - Today

3. **User Position Highlight**
   - Always visible at top (your rank)
   - Shows rank change (up/down arrows)
   - Highlighted row in table

4. **Leaderboard Table**
   - Top 100 displayed
   - Load more on scroll
   - Shows:
     - Rank (with medals for top 3)
     - Player name/avatar
     - Level
     - Total XP
     - Position change

5. **Refresh Button**
   - Manually refresh rankings
   - Shows last updated time

**Visual Elements**:
- Top 3 get special treatment:
  - 🥇 Gold medal - #1
  - 🥈 Silver medal - #2
  - 🥉 Bronze medal - #3
- Current user row highlighted with different background
- Rank changes shown with colored arrows:
  - 🔺 Green up arrow for improvement
  - 🔻 Red down arrow for decline
  - -- for no change

---

### 10. StreakTracker

**Purpose**: Display and motivate daily trading streak

**Compact Widget**:
```
┌──────────────────────────────┐
│  🔥 7-DAY STREAK! 🔥        │
│                              │
│  [█][█][█][█][█][█][█]      │
│  Mon Tue Wed Thu Fri Sat Sun │
│                              │
│  Next milestone: 14 days     │
│  Reward: +100 XP + $10       │
│                              │
│  ⚠️ Don't break the streak! │
│  Trade today to continue     │
└──────────────────────────────┘
```

**Full Calendar View**:
```
┌──────────────────────────────────────────────┐
│  🔥 STREAK TRACKER 🔥                       │
├──────────────────────────────────────────────┤
│  Current Streak: 7 days                      │
│  Longest Streak: 21 days                     │
│  Total Active Days: 156                      │
├──────────────────────────────────────────────┤
│                                              │
│  JANUARY 2025                                │
│  ──────────────────────────────────────────  │
│  Sun Mon Tue Wed Thu Fri Sat                 │
│   -   -   -   1💚  2💚  3💚  4💚            │
│   5💚  6💚  7💚  8🔥  9🔥 10🔥 11🔥          │
│  12🔥 13🔥 14🔥 15❌ 16💚 17💚 18💚          │
│  19💚 20💚 21❌ 22❌ 23❌ 24❌ 25❌          │
│  26❌ 27❌ 28❌ 29❌ 30❌ 31❌  -             │
│                                              │
│  Legend:                                     │
│  🔥 Current streak • 💚 Active • ❌ Missed  │
├──────────────────────────────────────────────┤
│  STREAK MILESTONES                           │
│  ✅ 3 days  - +50 XP                        │
│  ✅ 7 days  - +100 XP + $5                  │
│  🔒 14 days - +200 XP + $10                 │
│  🔒 30 days - +500 XP + $25 + Bronze Badge  │
│  🔒 60 days - +1000 XP + $50 + Silver Badge │
│  🔒 90 days - +2000 XP + $100 + Gold Badge  │
└──────────────────────────────────────────────┘
```

**Component Props**:
```typescript
interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  tradingDays: Date[];
  view?: 'compact' | 'calendar';
  showMilestones?: boolean;
}
```

**Features**:

1. **Streak Counter**
   - Current streak in days
   - Fire emoji animation (grows with streak)
   - Longest streak record

2. **Visual Calendar**
   - GitHub-style heatmap
   - Color-coded days:
     - 🔥 Red/Orange - Current streak days
     - 💚 Green - Past active days
     - ❌ Gray - Missed days
   - Hover shows day details

3. **Milestone Progress**
   - Shows next milestone
   - Lists all milestone rewards
   - Completed milestones checked

4. **Streak Warning**
   - If no trade today: "Don't break the streak!"
   - Red warning when streak at risk
   - Push notification option

**Animations**:
- Fire emoji grows larger with longer streaks
- Pulsing effect when streak at risk
- Confetti when reaching milestone
- Smooth calendar updates

---

### 11. LevelUpModal

**Purpose**: Celebration when player levels up

**Visual**:
```
┌──────────────────────────────────────────┐
│                                          │
│              🎉 LEVEL UP! 🎉            │
│                                          │
│         ╔═════════════════╗             │
│         ║                 ║             │
│         ║       43        ║             │
│         ║                 ║             │
│         ╚═════════════════╝             │
│                                          │
│      🎊 CONGRATULATIONS! 🎊             │
│                                          │
│   You've reached Level 43!               │
│   RISK MANAGER Rank                      │
│                                          │
│   ──────────────────────────────────     │
│                                          │
│   UNLOCKED:                              │
│   ✓ Advanced Greeks Calculator           │
│   ✓ Portfolio Risk Analyzer              │
│   ✓ +5 Watchlist Slots                   │
│                                          │
│   Next Unlock: Level 45                  │
│   • Multi-leg Strategy Templates         │
│                                          │
│   [Continue Trading] [View Profile]      │
│                                          │
└──────────────────────────────────────────┘
```

**Component Props**:
```typescript
interface LevelUpModalProps {
  newLevel: number;
  rank: string;
  unlockedFeatures: string[];
  nextUnlock: {
    level: number;
    features: string[];
  };
  onClose: () => void;
  onViewProfile: () => void;
}
```

**Animation Sequence**:
1. **Backdrop Fade** (0-300ms): Dark overlay fades in
2. **Modal Entrance** (300-800ms): Modal scales up with bounce
3. **Confetti** (500-3000ms): Particle explosion from center
4. **Level Number** (800-1200ms): Large number animates in
5. **Rank Badge** (1200-1600ms): Rank badge appears below
6. **Unlocked Features** (1600-2400ms): Features fade in one by one
7. **Sound Effect**: Victory/level-up sound plays

**Visual Effects**:
- Gold particle effects
- Radial gradient background
- Glow effect around level number
- Confetti physics simulation
- Smooth fade transitions

**Interactions**:
- Auto-dismiss after 10 seconds
- Click "Continue Trading": Close modal, return to trading
- Click "View Profile": Navigate to profile dashboard
- Click outside: Dismiss modal
- ESC key: Dismiss modal

---

### 12. XPToast (Notification)

**Purpose**: Real-time XP gain feedback

**Visual**:
```
┌─────────────────────────────┐
│  +100 XP 🎯                │
│  Trade Executed             │
└─────────────────────────────┘
```

**Component Props**:
```typescript
interface XPToastProps {
  xp: number;
  source: string;  // e.g., "Trade Executed", "Challenge Completed"
  icon?: string;
  duration?: number;  // Default: 3000ms
  position?: 'top-right' | 'top-center' | 'bottom-right';
}
```

**Animation**:
```css
/* Entrance */
@keyframes xpToastEntrance {
  0% {
    transform: translateY(-100%) scale(0.8);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* Exit */
@keyframes xpToastExit {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-20px) scale(0.9);
    opacity: 0;
  }
}
```

**Variants**:
- **Small gain** (<100 XP): Blue, simple toast
- **Medium gain** (100-500 XP): Purple, with glow
- **Large gain** (>500 XP): Gold, with particle effects

**Stacking**:
- Multiple toasts stack vertically
- Max 3 visible at once
- Older toasts dismissed when new arrive

---

### 13. RewardsShop

**Purpose**: Marketplace for spending Options Coins

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back              REWARDS SHOP           Balance: 💰 1,250 │
├──────────────────────────────────────────────────────────────┤
│  [All] [Power-ups] [Cosmetics] [Features] [Real Rewards]     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  🎁 FEATURED REWARDS                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ [Image]    │  │ [Image]    │  │ [Image]    │             │
│  │ 2X XP BOOST│  │ RISK SHIELD│  │ $25 GIFT   │             │
│  │ 💰 200     │  │ 💰 500     │  │ 💰 5,000   │             │
│  │ [Buy Now]  │  │ [Buy Now]  │  │ [Buy Now]  │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│                                                                │
│  🔥 POWER-UPS (Consumables)                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ 2X XP      │  │ Risk Shield│  │ Trade Retry│             │
│  │ 24 hours   │  │ 1 use      │  │ 1 use      │             │
│  │ 💰 200     │  │ 💰 500     │  │ 💰 300     │             │
│  │ [Buy Now]  │  │ [Buy Now]  │  │ [Buy Now]  │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│                                                                │
│  🎨 COSMETICS                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ Gold Theme │  │ Animated   │  │ Custom     │             │
│  │ Profile    │  │ Profile    │  │ Title      │             │
│  │ 💰 1,000   │  │ 💰 2,000   │  │ 💰 500     │             │
│  │ [Buy Now]  │  │ [Purchased]│  │ [Buy Now]  │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│                                                                │
│  💵 REAL REWARDS                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ $10 Amazon │  │ $25 Amazon │  │ $50 Cash   │             │
│  │ Gift Card  │  │ Gift Card  │  │ Withdrawal │             │
│  │ 💰 2,000   │  │ 💰 5,000   │  │ 💰 10,000  │             │
│  │ [Buy Now]  │  │ [Buy Now]  │  │ [Buy Now]  │             │
│  └────────────┘  └────────────┘  └────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

**Component Props**:
```typescript
interface RewardsShopProps {
  userBalance: number;
  initialCategory?: RewardCategory;
}

type RewardCategory = 'all' | 'powerups' | 'cosmetics' | 'features' | 'real';

interface Reward {
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
```

**Features**:

1. **Balance Display**
   - Shows current Options Coins balance
   - Prominently displayed in header

2. **Category Tabs**
   - All
   - Power-ups (XP boosts, shields, retries)
   - Cosmetics (themes, avatars, titles)
   - Features (unlock premium features)
   - Real Rewards (gift cards, cash)

3. **Reward Cards**
   - Reward image/icon
   - Name and description
   - Cost in Options Coins
   - "Buy Now" or "Purchased" button
   - Quantity remaining (for consumables)

4. **Purchase Flow**
   - Click "Buy Now"
   - Confirmation modal
   - Deduct coins
   - Show success animation
   - Update inventory

**Real Rewards Requirements**:
- Must verify email
- Account must be >30 days old
- Must have minimum level (e.g., Level 20)
- Compliance with local regulations

---

## Interaction Patterns

### 1. XP Gain Flow

**User Action** → **XP Award** → **Notification** → **Update Progress**

```
1. User places trade
2. System calculates XP: base (25) + bonuses
3. XPToast appears: "+125 XP 🎯 Trade Executed"
4. Progress bar animates to new XP value
5. If level up threshold crossed:
   a. LevelUpModal appears
   b. Confetti animation
   c. Show unlocked features
6. Update HUD display
```

**XP Calculation Example**:
```typescript
function calculateTradeXP(trade: Trade): number {
  let xp = 25; // Base XP

  // Bonus for profit
  if (trade.profit > 0) {
    xp += 50; // Profitable trade
    xp += Math.floor(trade.profitPercent / 10) * 10; // +10 XP per 10% profit
  }

  // Bonus for using Greeks
  if (trade.usedGreeks) {
    xp += 25;
  }

  // Bonus for risk management
  if (trade.hadStopLoss) {
    xp += 15;
  }

  // Streak multiplier
  const streakMultiplier = getStreakMultiplier(currentStreak);
  xp = Math.floor(xp * streakMultiplier);

  return xp;
}
```

### 2. Achievement Unlock Flow

**Condition Met** → **Check Achievement** → **Unlock** → **Notification**

```
1. User completes achievement requirement
2. System checks achievement conditions
3. If unlocked:
   a. Achievement marked as unlocked
   b. Timestamp recorded
   c. AchievementNotification appears
   d. Award XP and coins
   e. Update progress bars
   f. Play sound effect
4. Check for chain achievements (unlock one → unlock another)
```

### 3. Challenge Completion Flow

**Progress Update** → **Check Completion** → **Enable Claim** → **Claim Reward**

```
1. User makes progress towards challenge
2. Update challenge progress bar
3. If challenge completed:
   a. Show completion checkmark
   b. Enable "Claim Reward" button
   c. Button pulses to draw attention
4. User clicks "Claim Reward":
   a. Award XP and coins
   b. Show XPToast
   c. Confetti animation
   d. Mark challenge as claimed
   e. Update stats
```

### 4. Streak Maintenance Flow

**Daily Check** → **Streak Status** → **Update/Break** → **Notification**

```
1. User logs in
2. Check if trade placed yesterday
3. If yes:
   a. Increment streak counter
   b. Show StreakTracker widget
   c. Check for milestone
   d. If milestone reached: award bonus
4. If no:
   a. Check if grace period applies
   b. If not: break streak
   c. Show "Streak broken" notification
   d. Reset to 0 days
5. If no trade today yet:
   a. Show reminder: "Don't break the streak!"
   b. Send push notification (if enabled)
```

### 5. Leaderboard Update Flow

**Action Completed** → **Recalculate Rank** → **Update Leaderboard**

```
1. User earns XP
2. Recalculate user's rank in background
3. If rank changed:
   a. Update leaderboard display
   b. Show rank change arrow (🔺 or 🔻)
   c. If major milestone (e.g., Top 100):
      - Show notification
      - Award bonus XP
4. Update cached leaderboard data
5. Throttle updates to prevent spam (max every 5 min)
```

---

## Animation Guidelines

### Principles

1. **Meaningful Motion**: Animations should serve a purpose (feedback, guidance, delight)
2. **Consistent Timing**: Use standard durations for similar actions
3. **Respect User Preferences**: Honor `prefers-reduced-motion`
4. **Performance**: Use GPU-accelerated properties (transform, opacity)
5. **Natural Feel**: Use appropriate easing curves

### Standard Durations

```css
--animation-instant: 100ms;   /* Instant feedback */
--animation-fast: 200ms;      /* Quick transitions */
--animation-normal: 300ms;    /* Default */
--animation-slow: 500ms;      /* Emphasis */
--animation-slower: 800ms;    /* Celebration */
```

### Common Animations

#### 1. Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn var(--animation-normal) var(--ease-out);
}
```

#### 2. Slide Up
```css
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up {
  animation: slideUp var(--animation-normal) var(--ease-out);
}
```

#### 3. Scale Bounce
```css
@keyframes scaleBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.scale-bounce {
  animation: scaleBounce var(--animation-slow) var(--ease-bounce);
}
```

#### 4. Progress Bar Fill
```css
@keyframes progressFill {
  from { width: var(--start-width); }
  to { width: var(--end-width); }
}

.progress-bar-fill {
  animation: progressFill var(--animation-slow) var(--ease-out);
}
```

#### 5. Pulse (Attention)
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.pulse {
  animation: pulse 2s var(--ease-default) infinite;
}
```

#### 6. Shimmer (Loading)
```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

#### 7. Confetti Explosion
```typescript
// Confetti particle animation (using JavaScript)
interface ConfettiParticle {
  x: number;
  y: number;
  color: string;
  velocity: { x: number; y: number };
  rotation: number;
  rotationSpeed: number;
}

function createConfetti(count: number = 50): ConfettiParticle[] {
  return Array.from({ length: count }, () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    color: randomColor(),
    velocity: {
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 10 - 5,
    },
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
  }));
}

// Animate confetti particles with gravity
function animateConfetti(particles: ConfettiParticle[]) {
  particles.forEach(particle => {
    particle.x += particle.velocity.x;
    particle.y += particle.velocity.y;
    particle.velocity.y += 0.3; // Gravity
    particle.rotation += particle.rotationSpeed;
  });
}
```

#### 8. Floating XP Numbers
```css
@keyframes floatUp {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-50px) scale(1.2);
    opacity: 0;
  }
}

.xp-float {
  animation: floatUp 1s var(--ease-out) forwards;
}
```

### Reduced Motion

**Always respect user preferences**:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

### Component Adaptations

#### ProfileDashboard
- **Desktop**: 3-column layout with sidebar
- **Tablet**: 2-column layout, stats grid
- **Mobile**: Single column, stacked cards

#### AchievementPanel
- **Desktop**: 4-column grid
- **Tablet**: 3-column grid
- **Mobile**: 1-column list (larger cards)

#### LeaderboardPanel
- **Desktop**: Full table with all columns
- **Tablet**: Hide "Change" column
- **Mobile**: Compact rows, show only rank/name/XP

#### ChallengeDashboard
- **Desktop**: Side-by-side daily/weekly
- **Tablet**: Stacked daily/weekly
- **Mobile**: Single challenge per row

### Touch Targets

- **Minimum size**: 44x44px (Apple HIG)
- **Recommended**: 48x48px (Material Design)
- **Spacing**: 8px minimum between touch targets

---

## Accessibility

### ARIA Labels

```typescript
// Example: Achievement Card
<div
  role="article"
  aria-label={`${achievement.name} achievement`}
  aria-describedby={`achievement-desc-${achievement.id}`}
>
  <img
    src={achievement.icon}
    alt={achievement.unlocked ? achievement.name : 'Locked achievement'}
    aria-hidden={!achievement.unlocked}
  />
  <h3>{achievement.unlocked ? achievement.name : '???'}</h3>
  <p id={`achievement-desc-${achievement.id}`}>
    {achievement.description}
  </p>
  {!achievement.unlocked && (
    <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={total}>
      {progress} / {total}
    </div>
  )}
</div>
```

### Keyboard Navigation

#### Global Shortcuts
- `Ctrl+G`: Open Gamification HUD
- `Ctrl+A`: Open Achievements Panel
- `Ctrl+C`: Open Challenges Dashboard
- `Ctrl+L`: Open Leaderboards
- `Ctrl+P`: Open Profile Dashboard

#### Component Navigation
- `Tab`: Move between interactive elements
- `Enter` / `Space`: Activate buttons
- `Escape`: Close modals/panels
- `Arrow Keys`: Navigate lists/tables

### Screen Reader Support

```typescript
// Announce XP gains
function announceXPGain(xp: number, source: string) {
  const announcement = `Earned ${xp} experience points from ${source}`;

  // Create live region
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.textContent = announcement;

  document.body.appendChild(liveRegion);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 1000);
}
```

### Color Contrast

**WCAG 2.1 Level AA Compliance**:
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Testing Tools**:
- Chrome DevTools: Contrast ratio in color picker
- axe DevTools: Automated accessibility testing
- WAVE: Web accessibility evaluation tool

### Focus Indicators

```css
/* Clear focus indicator */
*:focus-visible {
  outline: 2px solid var(--gamification-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Custom focus for specific components */
.achievement-card:focus-visible {
  outline: 3px solid var(--achievement-rare);
  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.2);
}
```

---

## Implementation Priority

### Phase 1: Core Components (Weeks 1-2)
1. GamificationProvider (Context)
2. GamificationHUD
3. LevelProgressBar
4. XPToast
5. LevelUpModal

### Phase 2: Achievements & Challenges (Weeks 3-4)
6. AchievementCard
7. AchievementPanel
8. AchievementNotification
9. ChallengeCard
10. ChallengeDashboard

### Phase 3: Social & Progression (Weeks 5-6)
11. ProfileDashboard
12. LeaderboardPanel
13. StreakTracker
14. StreakCalendar

### Phase 4: Rewards & Polish (Weeks 7-8)
15. RewardsShop
16. Animation refinements
17. Accessibility improvements
18. Performance optimization

---

## Technical Notes

### State Management

```typescript
// GamificationContext structure
interface GamificationState {
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

interface GamificationActions {
  // XP & Levels
  awardXP: (xp: number, source: string) => void;
  levelUp: () => void;

  // Achievements
  unlockAchievement: (achievementId: string) => void;
  updateAchievementProgress: (achievementId: string, progress: number) => void;

  // Challenges
  updateChallengeProgress: (challengeId: string, progress: number) => void;
  completeChallenge: (challengeId: string) => void;
  claimChallengeReward: (challengeId: string) => void;

  // Streaks
  incrementStreak: () => void;
  breakStreak: () => void;

  // Rewards
  purchaseReward: (rewardId: string) => void;
  activatePowerUp: (powerUpId: string) => void;

  // Leaderboards
  updateLeaderboard: (category: LeaderboardCategory, entries: LeaderboardEntry[]) => void;
}
```

### Data Persistence

```typescript
// Save to Supabase
interface GamificationData {
  user_id: string;
  level: number;
  current_xp: number;
  total_xp: number;
  rank: string;
  current_streak: number;
  longest_streak: number;
  options_coins: number;
  unlocked_achievements: string[];
  completed_challenges: string[];
  claimed_challenges: string[];
  purchased_rewards: string[];
  last_trade_date: string;
  created_at: string;
  updated_at: string;
}

// Real-time sync with Supabase
const { data, error } = await supabase
  .from('gamification_data')
  .upsert({
    user_id: userId,
    ...gamificationState,
    updated_at: new Date().toISOString(),
  });
```

### Performance Optimizations

1. **Lazy Loading**: Load achievement icons on-demand
2. **Virtual Scrolling**: For long leaderboard lists
3. **Memoization**: Cache expensive calculations
4. **Debouncing**: Throttle XP updates
5. **Web Workers**: Process leaderboard ranking in background
6. **RequestAnimationFrame**: Smooth animations

---

## Design Assets Needed

### Icons (96 total)
- 10 rank badges (Novice → Legend)
- 50 achievement icons (various categories)
- 10 challenge type icons
- 10 reward item icons
- 8 stat icons (trades, win rate, etc.)
- 8 power-up icons

### Illustrations
- Level up celebration
- Achievement unlock celebration
- Streak fire animation frames
- Confetti particles
- Empty states (no achievements, no challenges)

### Animations
- Confetti particle system
- XP bar fill animation
- Level badge glow effect
- Achievement unlock sequence
- Streak fire growth stages

---

## Conclusion

This UX specification provides a comprehensive blueprint for implementing the Options Trading Gamification system. Each component is designed to:

1. **Motivate**: Provide clear goals and rewards
2. **Educate**: Reinforce learning through achievements
3. **Engage**: Create addictive, habit-forming loops
4. **Delight**: Surprise and celebrate user success

**Next Steps**:
1. Review and approve UX specifications
2. Create design mockups in Figma
3. Begin Phase 1 implementation (Core Components)
4. Set up Supabase tables for gamification data
5. Integrate with existing trading platform

**Estimated Timeline**: 8 weeks for full implementation
**Estimated Effort**: 320-400 developer hours

---

*Document Version: 1.0*
*Last Updated: 2025-01-11*
*Author: Options Trading Platform Team*
