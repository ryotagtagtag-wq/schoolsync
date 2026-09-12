export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  expGain?: number; // アイテム使用時のEXP獲得量
  vitalityGain?: number; // 元気回復量（水やり用）
}

export interface OwnedItem extends Item {
  quantity: number;
}

// 植物の種類定義
export interface PlantType {
  id: string;
  name: string;
  emoji: string; // 代表絵文字（選択画面用）
  description: string;
  stages: PlantStage[]; // この植物専用の成長段階
  baseVitalityDecayPerHour: number; // 1時間あたりの元気減少量
}

// ユーザーが育てている植物のインスタンス
export interface PlantInstance {
  id: string;
  plantTypeId: string;
  nickname?: string;
  exp: number;
  vitality: number; // 0-100
  lastWateredAt: number; // timestamp
  createdAt: number;
}

export interface PlantData {
  exp: number; // 互換性のため残す（メイン植物のEXP）
  coins: number;
  tasks: Task[];
  ownedItems: OwnedItem[];
  plants: PlantInstance[]; // 複数植物対応
  activePlantId: string; // 現在表示中の植物
}

export type TabType = 'main' | 'shop' | 'backpack' | 'garden'; // garden: 植物選択/管理

export const SHOP_ITEMS: Item[] = [
  {
    id: 'water',
    name: 'まほうのじょうろ（お水）',
    emoji: '💧',
    description: '植物の元気を回復させます（+30元気）',
    price: 30,
    vitalityGain: 30,
  },
  {
    id: 'sunlight',
    name: 'ポカポカたいよう光',
    emoji: '☀️',
    description: '植物に経験値を与えます（+20EXP）',
    price: 50,
    expGain: 20,
  },
  {
    id: 'fertilizer',
    name: '栄養たっぷりの肥料',
    emoji: '🧪',
    description: '植物にたくさん経験値を与えます（+50EXP）',
    price: 100,
    expGain: 50,
  },
];

export const STORAGE_KEY = 'questra_plant_data';

// 植物種類マスターデータ
export const PLANT_TYPES: PlantType[] = [
  {
    id: 'default',
    name: 'ふしぎなタネ',
    emoji: '🌱',
    description: 'どんな姿になるかお楽しみ！',
    baseVitalityDecayPerHour: 5,
    stages: [
      { emoji: '🌱', name: 'ふたば', message: 'ちいさな芽が ひょっこり顔を出したよ！', minExp: 0, maxExp: 49 },
      { emoji: '🌿', name: 'わかば', message: 'はっぱが すくすくと、元気にしげってきたね！', minExp: 50, maxExp: 99 },
      { emoji: '🪴', name: 'お気に入りの鉢植え', message: '立派なつぼみが ふくらんできたよ！', minExp: 100, maxExp: 199 },
      { emoji: '🌸', name: 'きれいなお花', message: 'やったー！きれいなお花が さいたよ！おめでとう！', minExp: 200, maxExp: Infinity },
    ],
  },
  {
    id: 'sunflower',
    name: 'ひまわり',
    emoji: '🌻',
    description: '太陽が大好き！元気いっぱい育つよ',
    baseVitalityDecayPerHour: 3,
    stages: [
      { emoji: '🌱', name: '芽', message: 'ちいさな芽がでたよ！太陽に向かってるね', minExp: 0, maxExp: 49 },
      { emoji: '🌿', name: '若葉', message: '葉っぱが増えて、ぐんぐん背が伸びてる！', minExp: 50, maxExp: 99 },
      { emoji: '🌻', name: 'ひまわり', message: '大きな花が咲いた！太陽みたいに輝いてるよ', minExp: 100, maxExp: 199 },
      { emoji: '🌻', name: '満開のひまわり', message: '種がたくさんできたよ！次も楽しみだね', minExp: 200, maxExp: Infinity },
    ],
  },
  {
    id: 'cactus',
    name: 'サボテン',
    emoji: '🌵',
    description: '水が少なくても平気！のんびり育つ',
    baseVitalityDecayPerHour: 1, // ゆっくり減る
    stages: [
      { emoji: '🌱', name: 'ちびトゲ', message: '小さなトゲが生えてきたよ', minExp: 0, maxExp: 49 },
      { emoji: '🌿', name: '若いサボテン', message: 'ぷっくり太ってきたね', minExp: 50, maxExp: 99 },
      { emoji: '🌵', name: '立派なサボテン', message: 'トゲトゲかっこいい！花も咲きそう', minExp: 100, maxExp: 199 },
      { emoji: '🌵', name: '花咲くサボテン', message: 'きれいな花が咲いた！レアだよ', minExp: 200, maxExp: Infinity },
    ],
  },
  {
    id: 'monstera',
    name: 'モンステラ',
    emoji: '🌿',
    description: '穴あき葉っぱがおしゃれ！人気者',
    baseVitalityDecayPerHour: 4,
    stages: [
      { emoji: '🌱', name: '新芽', message: 'ハート形の葉っぱが出てきたよ', minExp: 0, maxExp: 49 },
      { emoji: '🌿', name: '若葉', message: '葉っぱに切れ込みが入ってきた！', minExp: 50, maxExp: 99 },
      { emoji: '🌿', name: 'モンステラ', message: '特徴的な穴あき葉っぱになったよ！', minExp: 100, maxExp: 199 },
      { emoji: '🌿', name: '大株モンステラ', message: '巨大な葉っぱでジャングルみたい！', minExp: 200, maxExp: Infinity },
    ],
  },
];

export const INITIAL_PLANT_DATA: PlantData = {
  exp: 0,
  coins: 0,
  tasks: [],
  ownedItems: [],
  plants: [
    {
      id: 'plant_1',
      plantTypeId: 'default',
      exp: 0,
      vitality: 100,
      lastWateredAt: Date.now(),
      createdAt: Date.now(),
    },
  ],
  activePlantId: 'plant_1',
};

export interface PlantStage {
  emoji: string;
  name: string;
  message: string;
  minExp: number;
  maxExp: number;
}

// 後方互換性のため（既存コードが参照しているため）
export const PLANT_STAGES = PLANT_TYPES[0].stages;
