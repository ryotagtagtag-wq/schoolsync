// Item definitions for the RPG system
// Each item has: id, name, description, icon, rarity, category, effectType, effectValue, price, subject

import { ItemDrop } from './types';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemCategory = 'consumable' | 'weapon' | 'armor' | 'accessory';

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: ItemRarity;
  category: ItemCategory;
  effectType: string | null;
  effectValue: number;
  price: number; // 0 = not purchasable
  subject: string | null; // null = all subjects
}

export const RARITY: Record<ItemRarity, { name: string; color: string; dropChance: number }> = {
  common: { name: 'コモン', color: '#9CA3AF', dropChance: 0.45 },
  uncommon: { name: 'アンコモン', color: '#22C55E', dropChance: 0.30 },
  rare: { name: 'レア', color: '#3B82F6', dropChance: 0.15 },
  epic: { name: 'エピック', color: '#A855F7', dropChance: 0.08 },
  legendary: { name: 'レジェンダリー', color: '#F59E0B', dropChance: 0.02 },
};

// All items in the game
export const ALL_ITEMS: ItemDef[] = [
  // Consumables - healing
  { id: 'hp_potion_s', name: 'HPポーション(小)', description: 'HPを20回復する', icon: '🧪', rarity: 'common', category: 'consumable', effectType: 'heal', effectValue: 20, price: 15, subject: null },
  { id: 'hp_potion_m', name: 'HPポーション(中)', description: 'HPを50回復する', icon: '🧪', rarity: 'uncommon', category: 'consumable', effectType: 'heal', effectValue: 50, price: 40, subject: null },
  { id: 'hp_potion_l', name: 'HPポーション(大)', description: 'HPを120回復する', icon: '🧪', rarity: 'rare', category: 'consumable', effectType: 'heal', effectValue: 120, price: 100, subject: null },
  { id: 'elixir', name: 'エリクサー', description: 'HPを全回復する', icon: '✨', rarity: 'epic', category: 'consumable', effectType: 'heal', effectValue: 999, price: 300, subject: null },

  // Consumables - buffs
  { id: 'xp_scroll', name: '経験の巻物', description: '次の戦闘で獲得XPが2倍になる', icon: '📜', rarity: 'uncommon', category: 'consumable', effectType: 'xp_boost', effectValue: 2, price: 50, subject: null },
  { id: 'gold_charm', name: '金運のお守り', description: '次の戦闘で獲得ゴールドが2倍になる', icon: '🍀', rarity: 'uncommon', category: 'consumable', effectType: 'gold_boost', effectValue: 2, price: 50, subject: null },

  // Subject-specific drops - Math
  { id: 'math_book', name: '数学の教科書', description: '数学の基本を学べる教科書。INT+1', icon: '📕', rarity: 'common', category: 'accessory', effectType: 'stat_boost', effectValue: 1, price: 0, subject: '数学' },
  { id: 'calculator_old', name: '古い電卓', description: 'よく使われた電卓。INT+2', icon: '🔢', rarity: 'uncommon', category: 'accessory', effectType: 'stat_boost', effectValue: 2, price: 0, subject: '数学' },
  { id: 'proof_scroll', name: '証明の巻物', description: '数学の力が宿る巻物。INT+4', icon: '📝', rarity: 'rare', category: 'accessory', effectType: 'stat_boost', effectValue: 4, price: 0, subject: '数学' },

  // Subject-specific drops - English
  { id: 'eng_dict', name: '英和辞典', description: '英語力を高める辞典。WIS+1', icon: '📘', rarity: 'common', category: 'accessory', effectType: 'stat_boost', effectValue: 1, price: 0, subject: '英語' },
  { id: 'eng_novel', name: '英文学作品', description: '名作を原文で読む。WIS+2', icon: '📖', rarity: 'uncommon', category: 'accessory', effectType: 'stat_boost', effectValue: 2, price: 0, subject: '英語' },
  { id: 'eng_headphones', name: 'リスニングヘッドホン', description: '集中力を高める。WIS+4', icon: '🎧', rarity: 'rare', category: 'accessory', effectType: 'stat_boost', effectValue: 4, price: 0, subject: '英語' },

  // Subject-specific drops - Science
  { id: 'beaker', name: '実験ビーカー', description: '理科の実験器具。END+1', icon: '🧪', rarity: 'common', category: 'accessory', effectType: 'stat_boost', effectValue: 1, price: 0, subject: '理科' },
  { id: 'microscope', name: '顕微鏡', description: '小さな世界が広がる。END+2', icon: '🔬', rarity: 'uncommon', category: 'accessory', effectType: 'stat_boost', effectValue: 2, price: 0, subject: '理科' },
  { id: 'telescope', name: '望遠鏡', description: '宇宙を見る力。END+4', icon: '🔭', rarity: 'rare', category: 'accessory', effectType: 'stat_boost', effectValue: 4, price: 0, subject: '理科' },

  // Subject-specific drops - Social Studies
  { id: 'map', name: '古い地図', description: '歴史の道を示す地図。SOC+1', icon: '🗺️', rarity: 'common', category: 'accessory', effectType: 'stat_boost', effectValue: 1, price: 0, subject: '社会' },
  { id: 'compass', name: '方位磁針', description: '正しい道を見つける。SOC+2', icon: '🧭', rarity: 'uncommon', category: 'accessory', effectType: 'stat_boost', effectValue: 2, price: 0, subject: '社会' },
  { id: 'hourglass', name: '砂時計', description: '時の流れを感じる。SOC+4', icon: '⏳', rarity: 'rare', category: 'accessory', effectType: 'stat_boost', effectValue: 4, price: 0, subject: '社会' },

  // Subject-specific drops - PE
  { id: 'running_shoes', name: 'ランニングシューズ', description: '走る力を高める。STR+1', icon: '👟', rarity: 'common', category: 'accessory', effectType: 'stat_boost', effectValue: 1, price: 0, subject: '体育' },
  { id: 'boxing_gloves', name: 'ボクシンググローブ', description: 'パンチ力を高める。STR+2', icon: '🥊', rarity: 'uncommon', category: 'accessory', effectType: 'stat_boost', effectValue: 2, price: 0, subject: '体育' },
  { id: 'champion_belt', name: 'チャンピオンベルト', description: '最強の証。STR+4', icon: '🏆', rarity: 'rare', category: 'accessory', effectType: 'stat_boost', effectValue: 4, price: 0, subject: '体育' },

  // Subject-specific drops - Art
  { id: 'brush', name: '筆セット', description: '芸術の腕を磨く。CRE+1', icon: '🖌️', rarity: 'common', category: 'accessory', effectType: 'stat_boost', effectValue: 1, price: 0, subject: '芸術' },
  { id: 'palette', name: 'パレット', description: '色の力が宿る。CRE+2', icon: '🎨', rarity: 'uncommon', category: 'accessory', effectType: 'stat_boost', effectValue: 2, price: 0, subject: '芸術' },
  { id: 'masterpiece', name: '名画の欠片', description: '天才の灵感。CRE+4', icon: '🖼️', rarity: 'rare', category: 'accessory', effectType: 'stat_boost', effectValue: 4, price: 0, subject: '芸術' },

  // Legendary drops (all subjects)
  { id: 'crown_wisdom', name: '知恵の王冠', description: '全ステータス+3。最も強力な装備', icon: '👑', rarity: 'legendary', category: 'accessory', effectType: 'stat_boost', effectValue: 3, price: 0, subject: null },
  { id: 'dragon_scale', name: 'ドラゴンの鱗', description: '全ステータス+2。伝説の素材', icon: '🐉', rarity: 'epic', category: 'accessory', effectType: 'stat_boost', effectValue: 2, price: 0, subject: null },
  { id: 'phoenix_feather', name: 'フェニックスの羽', description: '戦闘不能から復活する(1回)', icon: '🪶', rarity: 'epic', category: 'consumable', effectType: 'revive', effectValue: 1, price: 0, subject: null },
];

// Lookup helpers
export const ITEMS_BY_ID: Record<string, ItemDef> = Object.fromEntries(
  ALL_ITEMS.map((item) => [item.id, item])
);

export const ITEMS_BY_RARITY: Record<ItemRarity, ItemDef[]> = {
  common: ALL_ITEMS.filter((i) => i.rarity === 'common'),
  uncommon: ALL_ITEMS.filter((i) => i.rarity === 'uncommon'),
  rare: ALL_ITEMS.filter((i) => i.rarity === 'rare'),
  epic: ALL_ITEMS.filter((i) => i.rarity === 'epic'),
  legendary: ALL_ITEMS.filter((i) => i.rarity === 'legendary'),
};

// Drop calculation: pick a random rarity tier, then a random item from that tier
export function getRandomDrop(): ItemDrop | null {
  const roll = Math.random();
  let cumulative = 0;
  let selectedRarity: ItemRarity = 'common';

  for (const [rarity, info] of Object.entries(RARITY)) {
    cumulative += info.dropChance;
    if (roll < cumulative) {
      selectedRarity = rarity as ItemRarity;
      break;
    }
  }

  const pool = ITEMS_BY_RARITY[selectedRarity];
  if (pool.length === 0) return null;

  const item = pool[Math.floor(Math.random() * pool.length)];
  return { itemId: item.id, quantity: 1 };
}

// Subject-specific drop: higher chance for subject-matching items
export function getSubjectDrops(subject: string): ItemDrop[] {
  const drops: ItemDrop[] = [];

  // 30% chance for a subject-specific item
  if (Math.random() < 0.30) {
    const subjectItems = ALL_ITEMS.filter((i) => i.subject === subject);
    if (subjectItems.length > 0) {
      const item = subjectItems[Math.floor(Math.random() * subjectItems.length)];
      drops.push({ itemId: item.id, quantity: 1 });
    }
  }

  // Also roll for a general drop
  const generalDrop = getRandomDrop();
  if (generalDrop) {
    drops.push(generalDrop);
  }

  return drops;
}
