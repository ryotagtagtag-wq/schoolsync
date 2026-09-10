import { Application } from 'pixi.js';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const TILE_SIZE = 32;

export const gameConfig = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x1a1a2e,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: false,
  preferWebGL: true,
  powerPreference: 'high-performance' as const,
};

export type PixiApp = Application;

export const MAP_CONFIG = {
  town: {
    width: 40,
    height: 25,
    pixelWidth: 40 * TILE_SIZE,
    pixelHeight: 25 * TILE_SIZE,
  },
  field: {
    width: 60,
    height: 40,
    pixelWidth: 60 * TILE_SIZE,
    pixelHeight: 40 * TILE_SIZE,
  },
};

export const FACILITIES = [
  {
    id: 'bulletin',
    name: '掲示板',
    description: '依頼の一覧を見る\n課題の確認・フィルタ・検索',
    icon: '📋',
    unlockLevel: 1,
    maxLevel: 5,
    baseCost: 100,
    effectType: 'xp_bonus',
    effectPerLevel: 0.05,
    position: { x: 10 * TILE_SIZE, y: 8 * TILE_SIZE },
    buildingType: 'bulletin',
  },
  {
    id: 'library',
    name: '図書館',
    description: '新しい依頼を書く\n教科・優先度・期限を設定',
    icon: '📚',
    unlockLevel: 1,
    maxLevel: 5,
    baseCost: 150,
    effectType: 'gold_bonus',
    effectPerLevel: 0.05,
    position: { x: 18 * TILE_SIZE, y: 6 * TILE_SIZE },
    buildingType: 'library',
  },
  {
    id: 'forge',
    name: '鍛冶屋',
    description: '施設を強化する\n経験値/ゴールドボーナス・連続記録保護',
    icon: '⚒️',
    unlockLevel: 3,
    maxLevel: 10,
    baseCost: 500,
    effectType: 'xp_bonus',
    effectPerLevel: 0.1,
    position: { x: 26 * TILE_SIZE, y: 10 * TILE_SIZE },
    buildingType: 'forge',
  },
  {
    id: 'shop',
    name: '商店',
    description: 'アイテムを買う\n回復・強化アイテムの購入',
    icon: '🏪',
    unlockLevel: 2,
    maxLevel: 5,
    baseCost: 300,
    effectType: 'gold_bonus',
    effectPerLevel: 0.08,
    position: { x: 30 * TILE_SIZE, y: 16 * TILE_SIZE },
    buildingType: 'shop',
  },
  {
    id: 'training',
    name: '訓練場',
    description: 'ステータス確認\nレベル・称号・実績・6ステータス',
    icon: '🏃',
    unlockLevel: 1,
    maxLevel: 5,
    baseCost: 200,
    effectType: 'streak_protect',
    effectPerLevel: 1,
    position: { x: 12 * TILE_SIZE, y: 18 * TILE_SIZE },
    buildingType: 'training',
  },
  {
    id: 'guild',
    name: 'ギルド',
    description: '仲間と協力する\nグループ・ギルドクエスト',
    icon: '🏰',
    unlockLevel: 5,
    maxLevel: 5,
    baseCost: 1000,
    effectType: 'xp_bonus',
    effectPerLevel: 0.15,
    position: { x: 22 * TILE_SIZE, y: 20 * TILE_SIZE },
    buildingType: 'guild',
  },
] as const;

export type FacilityData = typeof FACILITIES[number];

export const PLAYER_START = {
  town: { x: 20 * TILE_SIZE, y: 14 * TILE_SIZE },
  field: { x: 30 * TILE_SIZE, y: 20 * TILE_SIZE },
};

export const MONSTER_SPAWNS = [
  { x: 8 * TILE_SIZE, y: 8 * TILE_SIZE, subject: 'mathematics', radius: 150, maxCount: 3 },
  { x: 15 * TILE_SIZE, y: 10 * TILE_SIZE, subject: 'mathematics', radius: 150, maxCount: 3 },
  { x: 45 * TILE_SIZE, y: 8 * TILE_SIZE, subject: 'english', radius: 150, maxCount: 3 },
  { x: 50 * TILE_SIZE, y: 12 * TILE_SIZE, subject: 'english', radius: 150, maxCount: 3 },
  { x: 10 * TILE_SIZE, y: 22 * TILE_SIZE, subject: 'japanese', radius: 150, maxCount: 3 },
  { x: 30 * TILE_SIZE, y: 18 * TILE_SIZE, subject: 'science', radius: 200, maxCount: 4 },
  { x: 48 * TILE_SIZE, y: 25 * TILE_SIZE, subject: 'social', radius: 150, maxCount: 3 },
  { x: 8 * TILE_SIZE, y: 32 * TILE_SIZE, subject: 'physical', radius: 150, maxCount: 3 },
  { x: 50 * TILE_SIZE, y: 32 * TILE_SIZE, subject: 'art', radius: 150, maxCount: 3 },
];

export const MAP_TRANSITIONS = [
  {
    id: 'town-to-field',
    type: 'transition',
    x: 20 * TILE_SIZE,
    y: 24 * TILE_SIZE,
    width: 64,
    height: 32,
    properties: {
      targetMap: 'field' as const,
      targetPosition: { x: 30 * TILE_SIZE, y: 5 * TILE_SIZE },
    },
  },
  {
    id: 'field-to-town',
    type: 'transition',
    x: 30 * TILE_SIZE,
    y: 2 * TILE_SIZE,
    width: 64,
    height: 32,
    properties: {
      targetMap: 'town' as const,
      targetPosition: { x: 20 * TILE_SIZE, y: 22 * TILE_SIZE },
    },
  },
];

export const SUBJECT_MAP = {
  mathematics: { monster: 'ゴーレム', color: 0x3B82F6, emojis: { 1: '🗿', 2: '🗿', 3: '🗿' } },
  english: { monster: 'ドラゴン', color: 0x8B5CF6, emojis: { 1: '🐉', 2: '🐉', 3: '🐉' } },
  japanese: { monster: '魔導師', color: 0xEC4899, emojis: { 1: '🧙', 2: '🧙', 3: '🧙' } },
  science: { monster: 'フェニックス', color: 0xF97316, emojis: { 1: '🔥', 2: '🐦', 3: '🌅' } },
  social: { monster: 'タイタン', color: 0x10B981, emojis: { 1: '🗿', 2: '🏔️', 3: '🌍' } },
  physical: { monster: 'バーサーカー', color: 0xEF4444, emojis: { 1: '💪', 2: '🤺', 3: '⚔️' } },
  art: { monster: 'ネコマタ', color: 0xF59E0B, emojis: { 1: '🐱', 2: '😺', 3: '🎨' } },
} as const;

export type SubjectKey = keyof typeof SUBJECT_MAP;

export const SUBJECT_ADVANTAGE: Record<SubjectKey, SubjectKey[]> = {
  mathematics: ['science', 'physical'],
  english: ['mathematics', 'social'],
  japanese: ['english', 'art'],
  science: ['japanese', 'physical'],
  social: ['science', 'art'],
  physical: ['english', 'social'],
  art: ['mathematics', 'science'],
};

export const MONSTER_SPECIAL_MOVES = {
  mathematics: { name: '岩石落とし', cooldown: 3, effect: 'stun', power: 1.3 },
  english: { name: '竜の息吹', cooldown: 4, effect: 'burn', power: 1.4 },
  japanese: { name: '言霊の呪い', cooldown: 3, effect: 'silence', power: 1.2 },
  science: { name: '爆発実験', cooldown: 3, effect: 'aoe_burn', power: 1.3 },
  social: { name: '歴史の重圧', cooldown: 4, effect: 'defense_down', power: 1.2 },
  physical: { name: '渾身の一撃', cooldown: 2, effect: 'crit_up', power: 1.5 },
  art: { name: '幻惑の舞', cooldown: 3, effect: 'confuse', power: 1.2 },
} as const;

export const SUBJECT_PLAYER_SKILLS = {
  mathematics: { name: '論理的思考', effect: 'defense_up', cooldown: 3 },
  english: { name: '音読', effect: 'heal', cooldown: 4 },
  japanese: { name: '言霊', effect: 'magic_up', cooldown: 3 },
  science: { name: '実験', effect: 'aoe_damage', cooldown: 4 },
  social: { name: '調査', effect: 'reveal_weakness', cooldown: 3 },
  physical: { name: '気合', effect: 'attack_up', cooldown: 2 },
  art: { name: '即興', effect: 'random_buff', cooldown: 3 },
} as const;
