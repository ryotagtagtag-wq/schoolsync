// Streak tracking
// 
// 注意: すべての日付計算は JST (Asia/Tokyo) 基準で行う

/**
 * Check if the user's streak should be updated
 * Returns the new streak count
 */
export function calculateStreak(
  currentStreak: number,
  lastActiveDate: string | null, // YYYY-MM-DD
  today: string // YYYY-MM-DD
): { newStreak: number; isStreakContinued: boolean; isStreakBroken: boolean } {
  if (!lastActiveDate) {
    return { newStreak: 1, isStreakContinued: false, isStreakBroken: false };
  }

  // Same day - no change
  if (lastActiveDate === today) {
    return { newStreak: currentStreak, isStreakContinued: true, isStreakBroken: false };
  }

  // Calculate days difference
  const lastDate = new Date(lastActiveDate + 'T00:00:00+09:00');
  const todayDate = new Date(today + 'T00:00:00+09:00');
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day - streak continues
    return { newStreak: currentStreak + 1, isStreakContinued: true, isStreakBroken: false };
  } else {
    // Streak broken
    return { newStreak: 1, isStreakContinued: false, isStreakBroken: true };
  }
}

/**
 * Get streak bonus multiplier
 */
export function streakMultiplier(streak: number): number {
  return 1 + Math.min(streak * 0.05, 0.5);
}

/**
 * Format streak for display
 */
export function formatStreak(streak: number): string {
  if (streak === 0) return '🔥 なし';
  if (streak < 7) return `🔥 ${streak}日`;
  if (streak < 30) return `🔥🔥 ${streak}日`;
  return `🔥🔥🔥 ${streak}日`;
}
