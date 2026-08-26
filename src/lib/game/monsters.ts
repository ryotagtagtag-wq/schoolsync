// Monster generation for assignments

import { Monster, SUBJECT_MAP, MONSTER_EMOJIS } from './types';
import { Assignment } from '@/db/schema';

/**
 * Generate a monster from an assignment
 */
export function assignmentToMonster(assignment: Assignment): Monster {
  const subject = assignment.subject || '未知';
  const subjectData = SUBJECT_MAP[subject];

  const difficulty: 1 | 2 | 3 = assignment.priority >= 3
    ? 3
    : assignment.priority === 2
      ? 2
      : 1;

  const emojiPool = MONSTER_EMOJIS[difficulty];
  const emojiIndex = Math.abs(hashCode(assignment.id)) % emojiPool.length;

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
