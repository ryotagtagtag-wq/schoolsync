// Monster generation for assignments
// 
// 注意: すべての日付計算は JST (Asia/Tokyo) 基準で行う

import { Monster, SUBJECT_MAP, MONSTER_EMOJIS } from './types';
import { Assignment } from '@/db/schema';

/**
 * Determine spawn period from due date (JST)
 */
function getSpawnPeriod(dueDate: Date): string {
  const now = new Date();
  // Convert to JST
  const jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const jstDue = new Date(dueDate.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  
  // Check if overdue
  if (jstDue < jstNow) {
    return 'overdue';
  }
  
  const hour = jstDue.getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Calculate days until due (positive = future, negative = overdue)
 */
function getDaysUntilDue(dueDate: Date): number {
  const now = new Date();
  const jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const jstDue = new Date(dueDate.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  
  // Reset to midnight for day comparison
  jstNow.setHours(0, 0, 0, 0);
  jstDue.setHours(0, 0, 0, 0);
  
  const diffMs = jstDue.getTime() - jstNow.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Generate a monster from an assignment
 */
export function assignmentToMonster(assignment: Assignment, level: number = 1): Monster {
  const subject = assignment.subject || '未知';
  const subjectData = SUBJECT_MAP[subject];

  // Base difficulty from priority
  let difficulty: 1 | 2 | 3 = assignment.priority >= 3
    ? 3
    : assignment.priority === 2
      ? 2
      : 1;

  // Increase difficulty for urgent deadlines
  const daysUntilDue = getDaysUntilDue(assignment.dueDate);
  if (daysUntilDue <= 0) {
    // Overdue = max difficulty
    difficulty = 3;
  } else if (daysUntilDue === 1) {
    // Due tomorrow = +1 difficulty (cap at 3)
    difficulty = Math.min(3, difficulty + 1) as 1 | 2 | 3;
  } else if (daysUntilDue === 2) {
    // Due in 2 days = slight boost for high priority
    if (difficulty === 1) difficulty = 2;
  }

  const emojiPool = MONSTER_EMOJIS[difficulty];
  const emojiIndex = Math.abs(hashCode(assignment.id)) % emojiPool.length;

  const hpMultiplier = { 1: 1, 2: 1.5, 3: 2.5 }[difficulty];
  const maxHp = Math.floor(50 * hpMultiplier * (1 + level * 0.1));
  
  // Adjust rewards based on urgency
  const urgencyMultiplier = daysUntilDue <= 0 ? 1.5 : daysUntilDue <= 2 ? 1.2 : 1.0;
  const xpReward = Math.floor(20 * difficulty * (1 + level * 0.05) * urgencyMultiplier);
  const goldReward = Math.floor(10 * difficulty * (1 + level * 0.03) * urgencyMultiplier);

  const spawnPeriod = getSpawnPeriod(assignment.dueDate);

  return {
    id: assignment.id,
    name: subjectData
      ? `${subject}${subjectData.monster}`
      : `未知のモンスター`,
    emoji: subjectData ? subjectData.monster : emojiPool[emojiIndex],
    color: subjectData?.color || 'text-gray-500',
    subject,
    difficulty,
    stars: '★'.repeat(difficulty) + '☆'.repeat(3 - difficulty),
    hp: maxHp,
    maxHp,
    xpReward,
    goldReward,
    spawnPeriod,
  };
}

/**
 * Simple string hash for deterministic emoji selection
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
