// RPG「賢者の書」Game Types
// 
// 注意: すべての日付計算は JST (Asia/Tokyo) 基準で行う

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
  achievements: UserAchievementState[];
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
  id: string
  name: string
  emoji: string
  color: string
  subject: string
  difficulty: 1 | 2 | 3
  stars: string
  hp: number
  maxHp: number
  xpReward: number
  goldReward: number
  spawnPeriod: string
}

export interface ItemDrop {
  itemId: string;
  quantity: number;
}

export interface QuestReward {
  xp: number;
  gold: number;
  items: ItemDrop[];
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
  unlockedAt?: Date; // undefined = locked
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

// 科目の相性表（攻撃側 → 弱い相手）
export const SUBJECT_ADVANTAGE: Record<string, string[]> = {
  数学: ['理科'],      // 数学 → 理科に強い
  英語: ['社会'],      // 英語 → 社会に強い
  国語: ['数学'],      // 国語 → 数学に強い
  理科: ['芸術'],      // 理科 → 芸術に強い
  社会: ['体育'],      // 社会 → 体育に強い
  体育: ['理科'],      // 体育 → 理科に強い（※重複修正）
  芸術: ['英語'],      // 芸術 → 英語に強い
};

// 科目別モンスター必殺技
export const MONSTER_SPECIAL_MOVES: Record<string, { name: string; description: string; damageMultiplier: number; effect?: string }> = {
  数学: { name: '📐 方程式爆破', description: '高精度な攻撃', damageMultiplier: 1.5 },
  英語: { name: '📚 翻訳の呪い', description: '防御力低下', damageMultiplier: 1.3, effect: 'defense_down' },
  国語: { name: '📖 暗誦連撃', description: '2-3回連続攻撃', damageMultiplier: 0.7 }, // per hit, hits 2-3 times
  理科: { name: '🔬 実験爆炸', description: '大ダメージ（命中率80%）', damageMultiplier: 2.0, effect: 'miss_chance' },
  社会: { name: '📜 歴史の重み', description: '次のターン行動不能', damageMultiplier: 1.0, effect: 'stun' },
  体育: { name: '🏃 体育祭突撃', description: '攻撃しつつHP回復', damageMultiplier: 1.2, effect: 'self_heal' },
  芸術: { name: '🎨 色彩操作', description: 'ランダムダメージ', damageMultiplier: 1.0 }, // random variance
};

// 科目別プレイヤースキル
export const SUBJECT_PLAYER_SKILLS: Record<string, { name: string; description: string; effect: string }> = {
  数学: { name: '🧮 閃き', description: '次の攻撃がクリティカル確率50%UP', effect: 'crit_boost' },
  英語: { name: '📝 集中', description: '次の攻撃ダメージ+30%', effect: 'damage_boost' },
  国語: { name: '💪 気合', description: 'HP30回復+次の攻撃+20%', effect: 'heal_and_boost' },
  理科: { name: '🧪 実験', description: '固定ダメージ+確率で毒（3ターン継続ダメージ）', effect: 'fixed_damage_poison' },
  社会: { name: '👥 指揮', description: '防御力UP（ダメージ半減1ターン）', effect: 'defense_up' },
  体育: { name: '⚡ 突撃', description: '大ダメージだが反動15', effect: 'heavy_attack_recoil' },
  芸術: { name: '🌈 変幻', description: 'ランダム効果（回復/攻撃UP/防御UP）', effect: 'random_buff' },
};
