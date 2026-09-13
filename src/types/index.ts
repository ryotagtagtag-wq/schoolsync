export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  category?: TaskCategory;
  estimatedMinutes?: number;
  isTemplate?: boolean;
}

export type TaskCategory = 
  | 'study'      // 勉強・読書
  | 'exercise'   // 運動・ストレッチ
  | 'household'  // 家事・掃除
  | 'hobby'      // 趣味・創作
  | 'health'     // 健康・瞑想
  | 'social'     // 連絡・会話
  | 'custom';    // 自由入力

export const TASK_CATEGORIES: { id: TaskCategory; label: string; emoji: string; templates: string[] }[] = [
  { id: 'study', label: '勉強', emoji: '📚', templates: ['英単語 10個覚える', '教科書 5ページ読む', '問題集 3問解く', '復習 15分'] },
  { id: 'exercise', label: '運動', emoji: '🏃', templates: ['散歩 20分', 'ストレッチ 10分', '筋トレ 3セット', 'ラジオ体操'] },
  { id: 'household', label: '家事', emoji: '🧹', templates: ['部屋の掃除', '食器洗い', '洗濯・干す', 'ゴミ出し'] },
  { id: 'hobby', label: '趣味', emoji: '🎨', templates: ['絵を描く 30分', '楽器練習 15分', '読書 20分', '手芸・工作'] },
  { id: 'health', label: '健康', emoji: '🧘', templates: ['瞑想 5分', '水を飲む 2L', '早寝早起き', 'ストレッチ'] },
  { id: 'social', label: 'つながり', emoji: '💬', templates: ['家族に連絡', '友達に返信', '感謝を伝える', '誰かをほめる'] },
  { id: 'custom', label: '自由', emoji: '✨', templates: [] },
];

export interface Item {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  expGain?: number;
  vitalityGain?: number;
}

export interface OwnedItem extends Item {
  quantity: number;
}

export interface PlantType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  stages: PlantStage[];
  baseVitalityDecayPerHour: number;
}

export interface PlantInstance {
  id: string;
  plantTypeId: string;
  nickname?: string;
  exp: number;
  vitality: number;
  lastWateredAt: number;
  createdAt: number;
  // 卵・ドラゴン関連
  egg?: EggState;
  dragon?: DragonState;
}

export interface EggState {
  hasEgg: boolean;
  discoveredAt?: number;
  growth: number; // 0-100, タスク完了で増加
  hatchedAt?: number;
  dragonBorn: boolean;
  dragonName?: string;
  dragonExp?: number;
}

export interface DragonState {
  name: string;
  level: number;
  exp: number;
  hatchedAt: number;
}

export interface PlantData {
  exp: number;
  coins: number;
  tasks: Task[];
  ownedItems: OwnedItem[];
  plants: PlantInstance[];
  activePlantId: string;
  // アンチチート・統計用
  dailyStats: {
    date: string; // YYYY-MM-DD
    questsCreated: number;
    questsCompleted: number;
    questsDeleted: number;
    streakDays: number;
    lastCompletedDate?: string;
  };
}

export type TabType = 'main' | 'shop' | 'backpack' | 'garden' | 'quest';

export const SHOP_ITEMS: Item[] = [
  { id: 'water', name: 'まほうのじょうろ（お水）', emoji: '💧', description: '植物の元気を回復させます（+30元気）', price: 30, vitalityGain: 30 },
  { id: 'sunlight', name: 'ポカポカたいよう光', emoji: '☀️', description: '植物に経験値を与えます（+20EXP）', price: 50, expGain: 20 },
  { id: 'fertilizer', name: '栄養たっぷりの肥料', emoji: '🧪', description: '植物にたくさん経験値を与えます（+50EXP）', price: 100, expGain: 50 },
];

export const STORAGE_KEY = 'questra_plant_data';

export const PLANT_TYPES: PlantType[] = [
  { id: 'default', name: 'ふしぎなタネ', emoji: '🌱', description: 'どんな姿になるかお楽しみ！', baseVitalityDecayPerHour: 5, stages: [
    { emoji: '🌱', name: 'ふたば', message: 'ちいさな芽が ひょっこり顔を出したよ！', minExp: 0, maxExp: 49 },
    { emoji: '🌿', name: 'わかば', message: 'はっぱが すくすくと、元気にしげってきたね！', minExp: 50, maxExp: 99 },
    { emoji: '🪴', name: 'お気に入りの鉢植え', message: '立派なつぼみが ふくらんできたよ！', minExp: 100, maxExp: 199 },
    { emoji: '🌸', name: 'きれいなお花', message: 'やったー！きれいなお花が さいたよ！おめでとう！', minExp: 200, maxExp: Infinity },
  ]},
  { id: 'sunflower', name: 'ひまわり', emoji: '🌻', description: '太陽が大好き！元気いっぱい育つよ', baseVitalityDecayPerHour: 3, stages: [
    { emoji: '🌱', name: '芽', message: 'ちいさな芽がでたよ！太陽に向かってるね', minExp: 0, maxExp: 49 },
    { emoji: '🌿', name: '若葉', message: '葉っぱが増えて、ぐんぐん背が伸びてる！', minExp: 50, maxExp: 99 },
    { emoji: '🌻', name: 'ひまわり', message: '大きな花が咲いた！太陽みたいに輝いてるよ', minExp: 100, maxExp: 199 },
    { emoji: '🌻', name: '満開のひまわり', message: '種がたくさんできたよ！次も楽しみだね', minExp: 200, maxExp: Infinity },
  ]},
  { id: 'cactus', name: 'サボテン', emoji: '🌵', description: '水が少なくても平気！のんびり育つ', baseVitalityDecayPerHour: 1, stages: [
    { emoji: '🌱', name: 'ちびトゲ', message: '小さなトゲが生えてきたよ', minExp: 0, maxExp: 49 },
    { emoji: '🌿', name: '若いサボテン', message: 'ぷっくり太ってきたね', minExp: 50, maxExp: 99 },
    { emoji: '🌵', name: '立派なサボテン', message: 'トゲトゲかっこいい！花も咲きそう', minExp: 100, maxExp: 199 },
    { emoji: '🌵', name: '花咲くサボテン', message: 'きれいな花が咲いた！レアだよ', minExp: 200, maxExp: Infinity },
  ]},
  { id: 'monstera', name: 'モンステラ', emoji: '🌿', description: '穴あき葉っぱがおしゃれ！人気者', baseVitalityDecayPerHour: 4, stages: [
    { emoji: '🌱', name: '新芽', message: 'ハート形の葉っぱが出てきたよ', minExp: 0, maxExp: 49 },
    { emoji: '🌿', name: '若葉', message: '葉っぱに切れ込みが入ってきた！', minExp: 50, maxExp: 99 },
    { emoji: '🌿', name: 'モンステラ', message: '特徴的な穴あき葉っぱになったよ！', minExp: 100, maxExp: 199 },
    { emoji: '🌿', name: '大株モンステラ', message: '巨大な葉っぱでジャングルみたい！', minExp: 200, maxExp: Infinity },
  ]},
];

export const INITIAL_PLANT_DATA: PlantData = {
  exp: 0,
  coins: 0,
  tasks: [],
  ownedItems: [],
  plants: [{ id: 'plant_1', plantTypeId: 'default', exp: 0, vitality: 100, lastWateredAt: Date.now(), createdAt: Date.now(), egg: { hasEgg: false, growth: 0, dragonBorn: false } }],
  activePlantId: 'plant_1',
  dailyStats: { date: new Date().toISOString().split('T')[0], questsCreated: 0, questsCompleted: 0, questsDeleted: 0, streakDays: 0 },
};

export interface PlantStage { emoji: string; name: string; message: string; minExp: number; maxExp: number; }
export const PLANT_STAGES = PLANT_TYPES[0].stages;
