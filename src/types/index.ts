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
}

export interface OwnedItem extends Item {
  quantity: number;
}

export interface PlantData {
  exp: number;
  coins: number;
  tasks: Task[];
  ownedItems: OwnedItem[];
}

export type TabType = 'main' | 'shop' | 'backpack';

export const SHOP_ITEMS: Item[] = [
  {
    id: 'water',
    name: 'まほうのじょうろ（お水）',
    emoji: '💧',
    description: '植物を元気にする魔法のお水です',
    price: 30,
  },
  {
    id: 'sunlight',
    name: 'ポカポカたいよう光',
    emoji: '☀️',
    description: '温かい太陽の光を植物に届けます',
    price: 50,
  },
  {
    id: 'fertilizer',
    name: '栄養たっぷりの肥料',
    emoji: '🧪',
    description: '植物がぐんぐん育つ栄養剤です',
    price: 100,
  },
];

export const STORAGE_KEY = 'questra_plant_data';

export const INITIAL_PLANT_DATA: PlantData = {
  exp: 0,
  coins: 0,
  tasks: [],
  ownedItems: [],
};

export interface PlantStage {
  emoji: string;
  name: string;
  message: string;
  minExp: number;
  maxExp: number;
}

export const PLANT_STAGES: PlantStage[] = [
  {
    emoji: '🌱',
    name: 'ふたば',
    message: 'ちいさな芽が ひょっこり顔を出したよ！（目標:50EXP）',
    minExp: 0,
    maxExp: 49,
  },
  {
    emoji: '🌿',
    name: 'わかば',
    message: 'はっぱが すくすくと、元気にしげってきたね！',
    minExp: 50,
    maxExp: 99,
  },
  {
    emoji: '🪴',
    name: 'お気に入りの鉢植え',
    message: '立派なつぼみが ふくらんできたよ！',
    minExp: 100,
    maxExp: 199,
  },
  {
    emoji: '🌸',
    name: 'きれいなお花',
    message: 'やったー！きれいなお花が さいたよ！おめでとう！',
    minExp: 200,
    maxExp: Infinity,
  },
];
