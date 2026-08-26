// RPG「賢者の書」Game Types

export interface PlayerState {
  userId: string;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  streak: number;
  title: string;
  stats: SubjectStats;
  facilities: UserFacilityState[];
  recentAchievements: UserAchievementState[];
}

export interface SubjectStats {
  int: number; // 数学
  wis: number; // 英語
  str: number; // 体育
  end: number; // 理科
  cre: number; // 芸術
  soc: number; // 社会
}

export interface Monster {
  id: string;
  name: string;
  emoji: string;
  color: string; // tailwind color class
  subject: string;
  difficulty: 1 | 2 | 3;
  stars: string; // ★☆☆ etc
}

export interface QuestReward {
  xp: number;
  gold: number;
  streakBonus: number; // multiplier
  earlyBonus: boolean;
}

export interface UserFacilityState {
  facilityId: string;
  name: string;
  icon: string;
  level: number;
  maxLevel: number;
  effectType: string;
  effectValue: number;
  upgradeCost: number;
}

export interface UserAchievementState {
  achievementId: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt: Date;
}

export const SUBJECT_MAP: Record<string, { name: string; stat: keyof SubjectStats; monster: string; color: string }> = {
  数学: { name: '数学', stat: 'int', monster: 'ゴーレム', color: 'text-red-500' },
  英語: { name: '英語', stat: 'wis', monster: 'ドラゴン', color: 'text-blue-500' },
  国語: { name: '国語', stat: 'wis', monster: '魔導師', color: 'text-purple-500' },
  理科: { name: '理科', stat: 'end', monster: 'フェニックス', color: 'text-green-500' },
  社会: { name: '社会', stat: 'soc', monster: 'タイタン', color: 'text-yellow-500' },
  体育: { name: '体育', stat: 'str', monster: 'バーサーカー', color: 'text-orange-500' },
  芸術: { name: '芸術', stat: 'cre', monster: 'ネコマタ', color: 'text-pink-500' },
};

export const MONSTER_EMOJIS: Record<number, string[]> = {
  1: ['🗿', '🐍', '🍄', '🦇', '🕷️'],
  2: ['🐉', '👻', '🧟', '🐺', '🐗'],
  3: ['💀', '👹', '🤖', '🦹', '👾'],
};
