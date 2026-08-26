// XP and Level calculations

/**
 * XP required to reach level N from level N-1
 * Formula: 100 * (N ^ 1.5)
 */
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Total XP required to reach a specific level from level 1
 */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i + 1);
  }
  return total;
}

/**
 * Calculate level from total XP
 */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  let accumulated = 0;
  while (accumulated <= totalXp) {
    level++;
    accumulated += xpForLevel(level);
  }
  return level - 1;
}

/**
 * Get XP progress within current level (0 to xpToNext)
 */
export function xpProgress(totalXp: number): { currentLevel: number; xpInLevel: number; xpToNext: number; percent: number } {
  const currentLevel = levelFromXp(totalXp);
  const prevTotal = totalXpForLevel(currentLevel);
  const xpInLevel = totalXp - prevTotal;
  const xpToNext = xpForLevel(currentLevel + 1);
  const percent = Math.min(100, Math.floor((xpInLevel / xpToNext) * 100));
  return { currentLevel, xpInLevel, xpToNext, percent };
}

/**
 * Calculate XP reward for completing a task
 * Base: priority × 10, with streak bonus
 */
export function calculateXpReward(priority: number, streak: number, subjectBonus: number = 0): number {
  const base = priority * 10;
  const streakMultiplier = 1 + Math.min(streak * 0.05, 0.5); // +5% per day, max 50%
  const subjectMultiplier = 1 + subjectBonus;
  return Math.floor(base * streakMultiplier * subjectMultiplier);
}
