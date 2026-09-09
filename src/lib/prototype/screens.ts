/**
 * Prototype Screen Types
 * 本番拡張を前提とした画面管理の型定義
 */

export type ScreenId = 'title' | 'world' | 'battle' | 'reward';

export interface ScreenProps {
  onNavigate: (screen: ScreenId, data?: any) => void;
}

export interface BattleData {
  monster: {
    id: string;
    name: string;
    emoji: string;
    type: string;
    hp: number;
    maxHp: number;
    level: number;
  };
  player: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    stats: { int: number; wis: number; str: number; end: number; cre: number; soc: number };
  };
}

export interface RewardData {
  victory: boolean;
  expGained: number;
  goldGained: number;
  items: Array<{
    id: string;
    name: string;
    rarity: 'normal' | 'rare' | 'epic' | 'legendary';
    emoji: string;
    effect: string;
  }>;
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    newTitle: string;
    statGains: { [key: string]: number };
  };
}

export const SCREEN_CONFIG: Record<ScreenId, { title: string; description: string }> = {
  title: { title: 'タイトル/スタート画面', description: 'ゲーム開始、続きから、設定' },
  world: { title: 'メイン画面（ワールドマップ/プレイ中）', description: '街ルトヴィーク、施設、プレイヤー、UI' },
  battle: { title: 'バトル画面', description: 'ターン制バトル、コマンド、エフェクト' },
  reward: { title: '報酬獲得画面', description: '経験値バー、アイテムドロップ、レベルアップ演出' },
};

// モンスターデータ（バトル画面用）
export const MONSTERS: Record<string, {
  id: string;
  name: string;
  emoji: string;
  type: string;
  color: string;
  rarity: 'normal' | 'rare' | 'epic' | 'legendary';
  baseHP: number;
  element: string;
  weakness: string;
}> = {
  golem: {
    id: 'golem',
    name: 'ゴーレム',
    emoji: '🗿',
    type: '知力',
    color: '#3B82F6',
    rarity: 'normal',
    baseHP: 80,
    element: '地',
    weakness: '論理'
  },
  dragon: {
    id: 'dragon',
    name: 'ドラゴン',
    emoji: '🐉',
    type: '精神',
    color: '#8B5CF6',
    rarity: 'rare',
    baseHP: 100,
    element: '風',
    weakness: '語彙'
  },
  mage: {
    id: 'mage',
    name: '魔導師',
    emoji: '🧙',
    type: '精神',
    color: '#EC4899',
    rarity: 'rare',
    baseHP: 90,
    element: '闇',
    weakness: '漢字'
  },
  phoenix: {
    id: 'phoenix',
    name: 'フェニックス',
    emoji: '🐦',
    type: '持久',
    color: '#F97316',
    rarity: 'epic',
    baseHP: 120,
    element: '火',
    weakness: '実験'
  },
  titan: {
    id: 'titan',
    name: 'タイタン',
    emoji: '🗿',
    type: '社交',
    color: '#10B981',
    rarity: 'epic',
    baseHP: 150,
    element: '星',
    weakness: '歴史'
  },
  berserker: {
    id: 'berserker',
    name: 'バーサーカー',
    emoji: '⚔️',
    type: '体力',
    color: '#EF4444',
    rarity: 'normal',
    baseHP: 90,
    element: '風',
    weakness: 'リズム'
  },
  nekomata: {
    id: 'nekomata',
    name: 'ネコマタ',
    emoji: '🐱',
    type: '創造',
    color: '#F59E0B',
    rarity: 'legendary',
    baseHP: 110,
    element: '幻',
    weakness: '想像力'
  }
};

export const MONSTER_NAMES: Record<string, string> = {
  golem: 'ゴーレム',
  dragon: 'ドラゴン',
  mage: '魔導師',
  phoenix: 'フェニックス',
  titan: 'タイタン',
  berserker: 'バーサーカー',
  nekomata: 'ネコマタ'
};

// 施設データ（ワールド画面用）
export const FACILITIES = [
  { id: 'bulletin_board', name: '掲示板', emoji: '📋', x: 150, y: 200, color: '#6B46C1', desc: '課題一覧・フィルタ・検索' },
  { id: 'library', name: '図書館', emoji: '📚', x: 350, y: 120, color: '#8B5CF6', desc: '新規課題作成' },
  { id: 'forge', name: '鍛冶屋', emoji: '⚒️', x: 550, y: 180, color: '#F97316', desc: '施設強化・ボーナス' },
  { id: 'shop', name: '商店', emoji: '🏪', x: 700, y: 280, color: '#F59E0B', desc: 'アイテム購入' },
  { id: 'training_ground', name: '訓練場', emoji: '🏃', x: 800, y: 150, color: '#3B82F6', desc: 'ステータス確認' },
  { id: 'guild', name: 'ギルド', emoji: '🏰', x: 900, y: 350, color: '#10B981', desc: 'グループ協力・クエスト' }
];

// モンスター湧きポイント
export const MONSTER_SPAWNS = [
  { id: 'm1', monsterId: 'golem', x: 200, y: 400, level: 1 },
  { id: 'm2', monsterId: 'dragon', x: 400, y: 450, level: 2 },
  { id: 'm3', monsterId: 'mage', x: 600, y: 380, level: 2 },
  { id: 'm4', monsterId: 'phoenix', x: 750, y: 500, level: 3 },
  { id: 'm5', monsterId: 'titan', x: 900, y: 420, level: 4 },
  { id: 'm6', monsterId: 'berserker', x: 1000, y: 550, level: 2 },
  { id: 'm7', monsterId: 'nekomata', x: 1100, y: 480, level: 5 }
];
