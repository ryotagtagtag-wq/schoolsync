import { PlantData, INITIAL_PLANT_DATA } from '../types';

export function loadPlantData(): PlantData {
  try {
    const stored = localStorage.getItem('questra_plant_data');
    if (!stored) return INITIAL_PLANT_DATA;
    
    const parsed = JSON.parse(stored);
    
    // 旧データ形式からの移行
    if (!parsed.plants) {
      // 旧形式: exp, coins, tasks, ownedItems のみ
      return {
        exp: parsed.exp || 0,
        coins: parsed.coins || 0,
        tasks: parsed.tasks || [],
        ownedItems: parsed.ownedItems || [],
        plants: [{
          id: 'plant_1',
          plantTypeId: 'default',
          exp: parsed.exp || 0,
          vitality: 100,
          lastWateredAt: Date.now(),
          createdAt: Date.now(),
        }],
        activePlantId: 'plant_1',
      };
    }
    
    // 新形式の場合はそのまま返す（不足フィールドはデフォルトで補完）
    return {
      exp: parsed.exp || 0,
      coins: parsed.coins || 0,
      tasks: parsed.tasks || [],
      ownedItems: parsed.ownedItems || [],
      plants: parsed.plants.map((p: any) => ({
        id: p.id,
        plantTypeId: p.plantTypeId || 'default',
        nickname: p.nickname,
        exp: p.exp || 0,
        vitality: p.vitality !== undefined ? p.vitality : 100,
        lastWateredAt: p.lastWateredAt || Date.now(),
        createdAt: p.createdAt || Date.now(),
      })),
      activePlantId: parsed.activePlantId || (parsed.plants[0]?.id || 'plant_1'),
    };
  } catch {
    return INITIAL_PLANT_DATA;
  }
}

export function savePlantData(data: PlantData): void {
  try {
    localStorage.setItem('questra_plant_data', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save plant data:', e);
  }
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
