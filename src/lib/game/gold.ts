// Gold calculations

/**
 * Calculate gold reward for completing a task
 * Base: priority × 10
 * Modifiers: streak bonus, early clear bonus, overdue penalty, facility bonus
 */
export function calculateGoldReward(params: {
  priority: number;
  streak: number;
  isEarlyClear: boolean; // completed before 50% of time elapsed
  isOverdue: boolean;
  facilityBonusPercent: number; // from 菜園 facility
}): number {
  const base = params.priority * 10;
  let multiplier = 1;

  // Streak bonus: +5% per day, max 50%
  multiplier += Math.min(params.streak * 0.05, 0.5);

  // Early clear bonus: +50%
  if (params.isEarlyClear) multiplier += 0.5;

  // Overdue penalty: -50%
  if (params.isOverdue) multiplier *= 0.5;

  // Facility bonus: 菜園
  multiplier += params.facilityBonusPercent / 100;

  return Math.floor(base * multiplier);
}

/**
 * Calculate facility upgrade cost
 * Base cost × level
 */
export function facilityUpgradeCost(baseCost: number, currentLevel: number): number {
  return baseCost * currentLevel;
}
