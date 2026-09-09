import type Phaser from 'phaser';

// ===== 既存RPG型定義（src/lib/game/types.tsから流用・拡張）=====

export interface SubjectStats {
  int: number;    // 数学
  wis: number;    // 英語・国語
  str: number;    // 体育
  end: number;    // 理科
  cre: number;    // 芸術
  soc: number;    // 社会
}

export interface UserFacilityState {
  facilityId: string;
  level: number;
}

export interface UserAchievementState {
  achievementId: string;
  unlockedAt: string;
}

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

export interface Monster {
  id: string;
  name: string;
  emoji: string;
  subject: string;
  difficulty: 1 | 2 | 3;
  stars: string;
  color: string;
  hp: number;
  maxHp: number;
  xpReward: number;
  goldReward: number;
  assignmentId?: string;
}

export interface QuestReward {
  xp: number;
  gold: number;
  streakBonus: number;
  earlyBonus: number;
  itemDrop?: ItemDrop;
}

export interface ItemDrop {
  itemId: string;
  quantity: number;
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'consumable' | 'equipment' | 'material';
  effectType: string;
  value: number;
  description: string;
  price: number;
}

export interface UserItem {
  userId: string;
  itemId: string;
  quantity: number;
  equipped: boolean;
}

// 教科とモンスターのマッピング（既存から流用）
export const SUBJECT_MAP: Record<string, { 
  stat: keyof SubjectStats; 
  monster: string; 
  color: string;
  emojis: { 1: string; 2: string; 3: string };
}> = {
  mathematics: { 
    stat: 'int', 
    monster: 'ゴーレム', 
    color: '#3B82F6',
    emojis: { 1: '🗿', 2: '🪨', 3: '🗿' }
  },
  english: { 
    stat: 'wis', 
    monster: 'ドラゴン', 
    color: '#8B5CF6',
    emojis: { 1: '🐉', 2: '🐲', 3: '🐉' }
  },
  japanese: { 
    stat: 'wis', 
    monster: '魔導師', 
    color: '#EC4899',
    emojis: { 1: '🧙', 2: '🧙‍♂️', 3: '🧙‍♀️' }
  },
  science: { 
    stat: 'end', 
    monster: 'フェニックス', 
    color: '#F97316',
    emojis: { 1: '🔥', 2: '🐦‍🔥', 3: '🌅' }
  },
  social: { 
    stat: 'soc', 
    monster: 'タイタン', 
    color: '#10B981',
    emojis: { 1: '🗿', 2: '🏔️', 3: '🌍' }
  },
  physical: { 
    stat: 'str', 
    monster: 'バーサーカー', 
    color: '#EF4444',
    emojis: { 1: '💪', 2: '🤺', 3: '⚔️' }
  },
  art: { 
    stat: 'cre', 
    monster: 'ネコマタ', 
    color: '#F59E0B',
    emojis: { 1: '🐱', 2: '😺', 3: '🎨' }
  },
};

export const DIFFICULTY_STARS = {
  1: '★☆☆',
  2: '★★☆',
  3: '★★★',
};

// ===== Phaserゲーム固有の型定義=====

export interface WorldSceneData {
  player: Phaser.GameObjects.Sprite;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd: { 
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  facilities: Map<string, Phaser.GameObjects.Sprite>;
  monsters: Phaser.GameObjects.Sprite[];
  joystick?: VirtualJoystick;
}

export interface VirtualJoystick {
  base: Phaser.GameObjects.Graphics;
  stick: Phaser.GameObjects.Graphics;
  pointer: Phaser.Input.Pointer | null;
  active: boolean;
  position: { x: number; y: number };
  direction: { x: number; y: number };
}

export interface FacilityData {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockLevel: number;
  maxLevel: number;
  baseCost: number;
  effectType: 'xp_bonus' | 'gold_bonus' | 'streak_protect';
  effectPerLevel: number;
  position: { x: number; y: number };
  buildingType: 'bulletin' | 'library' | 'forge' | 'shop' | 'training' | 'guild';
}

export interface BattleSceneData {
  player: Phaser.GameObjects.Sprite;
  monster: Phaser.GameObjects.Sprite;
  playerHp: number;
  playerMaxHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  turn: 'player' | 'monster';
  actionQueue: BattleAction[];
  log: string[];
}

export interface BattleAction {
  type: 'attack' | 'skill' | 'item' | 'flee';
  actor: 'player' | 'monster';
  damage?: number;
  heal?: number;
  message: string;
}

export interface UISceneData {
  xpBar: Phaser.GameObjects.Graphics;
  goldText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  streakText: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Graphics;
  minimap: Phaser.GameObjects.RenderTexture;
}

// ===== マップ関連=====

export interface TilemapData {
  width: number;
  height: number;
  tileSize: number;
  layers: TileLayer[];
  objects: MapObject[];
}

export interface TileLayer {
  name: string;
  data: number[][];
  visible: boolean;
  collision: boolean;
}

export interface MapObject {
  id: string;
  type: 'facility' | 'monster_spawn' | 'player_start' | 'transition';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, unknown>;
}

// ===== シーン間通信用イベント=====

export const GAME_EVENTS = {
  FACILITY_INTERACT: 'facility-interact',
  MONSTER_ENCOUNTER: 'monster-encounter',
  BATTLE_START: 'battle-start',
  BATTLE_END: 'battle-end',
  LEVEL_UP: 'level-up',
  ITEM_GET: 'item-get',
  PLAYER_MOVE: 'player-move',
  MAP_TRANSITION: 'map-transition',
} as const;

export type GameEvent = typeof GAME_EVENTS[keyof typeof GAME_EVENTS];
