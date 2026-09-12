import { PlantType, PlantInstance, PlantStage, PLANT_TYPES, SHOP_ITEMS } from '../types';

/** 現在の植物タイプを取得 */
export function getPlantType(plantTypeId: string): PlantType {
  return PLANT_TYPES.find(t => t.id === plantTypeId) || PLANT_TYPES[0];
}

/** 植物インスタンスの現在の成長段階を取得 */
export function getPlantStage(plant: PlantInstance): PlantStage {
  const plantType = getPlantType(plant.plantTypeId);
  return plantType.stages.find(s => plant.exp >= s.minExp && plant.exp <= s.maxExp) 
    || plantType.stages[plantType.stages.length - 1];
}

/** 次の段階までの必要EXPを取得 */
export function getExpToNextStage(plant: PlantInstance): number | null {
  const stage = getPlantStage(plant);
  if (stage.maxExp === Infinity) return null;
  return stage.maxExp + 1 - plant.exp;
}

/** 成長進捗率（0-100）を取得 */
export function getGrowthProgress(plant: PlantInstance): number {
  const stage = getPlantStage(plant);
  if (stage.maxExp === Infinity) return 100;
  const progress = ((plant.exp - stage.minExp) / (stage.maxExp - stage.minExp)) * 100;
  return Math.max(0, Math.min(100, progress));
}

/** 元気の自然減衰を計算して適用（最終水やりからの経過時間ベース） */
export function calculateVitality(plant: PlantInstance): number {
  const plantType = getPlantType(plant.plantTypeId);
  const hoursSinceWatered = (Date.now() - plant.lastWateredAt) / (1000 * 60 * 60);
  const decay = hoursSinceWatered * plantType.baseVitalityDecayPerHour;
  return Math.max(0, Math.min(100, plant.vitality - decay));
}

/** 元気レベルに応じた状態メッセージを取得 */
export function getVitalityStatus(vitality: number): { label: string; color: string; emoji: string } {
  if (vitality >= 80) return { label: 'とても元気', color: 'text-forest-green', emoji: '😊' };
  if (vitality >= 50) return { label: '元気', color: 'text-pastel-green', emoji: '🙂' };
  if (vitality >= 20) return { label: 'ちょっと疲れてる', color: 'text-pastel-orange', emoji: '😐' };
  return { label: '元気がない…', color: 'text-pastel-red', emoji: '😢' };
}

/** 植物が鉢付き絵文字かどうか（鉢植えステージ以降） */
export function isPotStage(plant: PlantInstance): boolean {
  const stage = getPlantStage(plant);
  return stage.minExp >= 100;
}

/** 新しい植物インスタンスを作成 */
export function createPlantInstance(plantTypeId: string, nickname?: string): PlantInstance {
  return {
    id: `plant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    plantTypeId,
    nickname,
    exp: 0,
    vitality: 100,
    lastWateredAt: Date.now(),
    createdAt: Date.now(),
  };
}

/** アイテム使用時の効果を適用 */
export function applyItemEffect(_plant: PlantInstance, itemId: string): { expGain: number; vitalityGain: number; message: string } {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return { expGain: 0, vitalityGain: 0, message: '' };
  
  const expGain = item.expGain || 0;
  const vitalityGain = item.vitalityGain || 0;
  
  let message = '';
  if (expGain > 0 && vitalityGain > 0) {
    message = `経験値+${expGain} 元気+${vitalityGain}！`;
  } else if (expGain > 0) {
    message = `経験値+${expGain}！`;
  } else if (vitalityGain > 0) {
    message = `元気が${vitalityGain}回復した！`;
  }
  
  return { expGain, vitalityGain, message };
}
