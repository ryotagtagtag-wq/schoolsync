import { db } from './index';
import { achievements, facilities } from './schema';

const ACHIEVEMENT_DATA = [
  // First Steps
  {
    id: 'first_clear',
    name: '初めての討伐',
    description: '初めて課題を完了した',
    icon: '⚔️',
    category: 'first_steps',
    xpReward: 50,
    goldReward: 25,
    conditionType: 'total_clears',
    conditionValue: 1,
    titleReward: null,
  },
  {
    id: 'level_5',
    name: '見習い卒業',
    description: 'Lv.5に到達',
    icon: '🎓',
    category: 'first_steps',
    xpReward: 100,
    goldReward: 50,
    conditionType: 'level_reach',
    conditionValue: 5,
    titleReward: '見習い卒業生',
  },
  {
    id: 'level_10',
    name: '賢者への道',
    description: 'Lv.10に到達',
    icon: '📚',
    category: 'first_steps',
    xpReward: 200,
    goldReward: 100,
    conditionType: 'level_reach',
    conditionValue: 10,
    titleReward: '賢者見習い',
  },

  // Streak
  {
    id: 'streak_3',
    name: '三日坊主脱却',
    description: '3日連続で課題を完了',
    icon: '🔥',
    category: 'streak',
    xpReward: 75,
    goldReward: 30,
    conditionType: 'streak_days',
    conditionValue: 3,
    titleReward: null,
  },
  {
    id: 'streak_7',
    name: '週間の修行',
    description: '7日連続で課題を完了',
    icon: '🔥',
    category: 'streak',
    xpReward: 150,
    goldReward: 75,
    conditionType: 'streak_days',
    conditionValue: 7,
    titleReward: '連日の賢者',
  },
  {
    id: 'streak_30',
    name: '月の猛者',
    description: '30日連続で課題を完了',
    icon: '🔥',
    category: 'streak',
    xpReward: 500,
    goldReward: 250,
    conditionType: 'streak_days',
    conditionValue: 30,
    titleReward: '不滅の賢者',
  },

  // Mastery
  {
    id: 'clear_10',
    name: '十の討伐',
    description: '累計10課題を完了',
    icon: '🗡️',
    category: 'mastery',
    xpReward: 100,
    goldReward: 50,
    conditionType: 'total_clears',
    conditionValue: 10,
    titleReward: null,
  },
  {
    id: 'clear_50',
    name: '五十の冒険',
    description: '累計50課題を完了',
    icon: '🗡️',
    category: 'mastery',
    xpReward: 300,
    goldReward: 150,
    conditionType: 'total_clears',
    conditionValue: 50,
    titleReward: '冒険者',
  },
  {
    id: 'clear_100',
    name: '百の伝説',
    description: '累計100課題を完了',
    icon: '🗡️',
    category: 'mastery',
    xpReward: 500,
    goldReward: 300,
    conditionType: 'total_clears',
    conditionValue: 100,
    titleReward: '伝説の賢者',
  },

  // Building
  {
    id: 'first_build',
    name: '最初の建築',
    description: '初めて施設を建設した',
    icon: '🏗️',
    category: 'building',
    xpReward: 50,
    goldReward: 0,
    conditionType: 'facilities_built',
    conditionValue: 1,
    titleReward: null,
  },
];

const FACILITY_DATA = [
  {
    id: 'library',
    name: '書庫',
    description: '賢者の書の基本施設。すべての冒険が始まる場所。',
    icon: '📚',
    unlockLevel: 1,
    maxLevel: 10,
    baseCost: 100,
    effectType: 'xp_bonus',
    effectPerLevel: 5,
  },
  {
    id: 'study_room',
    name: '個室',
    description: '集中して学べる場所。XP獲得量が増える。',
    icon: '📖',
    unlockLevel: 5,
    maxLevel: 5,
    baseCost: 200,
    effectType: 'xp_bonus',
    effectPerLevel: 10,
  },
  {
    id: 'dojo',
    name: '道場',
    description: '修行の場。ストリーク保護（1日猶予）を獲得。',
    icon: '🥋',
    unlockLevel: 10,
    maxLevel: 3,
    baseCost: 500,
    effectType: 'streak_protect',
    effectPerLevel: 1,
  },
  {
    id: 'garden',
    name: '菜園',
    description: 'ゴールドを育てる。Gold獲得量が増える。',
    icon: '🌿',
    unlockLevel: 15,
    maxLevel: 5,
    baseCost: 300,
    effectType: 'gold_bonus',
    effectPerLevel: 10,
  },
  {
    id: 'tower',
    name: '塔',
    description: '賢者の塔。高レベルの冒険が解放される。',
    icon: '🗼',
    unlockLevel: 30,
    maxLevel: 3,
    baseCost: 1000,
    effectType: 'xp_bonus',
    effectPerLevel: 20,
  },
];

export async function seedGameData() {
  console.log('🎮 Seeding game data...');

  for (const ach of ACHIEVEMENT_DATA) {
    await db.insert(achievements).values(ach).onConflictDoNothing();
  }
  console.log(`  ✅ ${ACHIEVEMENT_DATA.length} achievements seeded`);

  for (const fac of FACILITY_DATA) {
    await db.insert(facilities).values(fac).onConflictDoNothing();
  }
  console.log(`  ✅ ${FACILITY_DATA.length} facilities seeded`);

  console.log('🎮 Game data seeding complete!');
}
