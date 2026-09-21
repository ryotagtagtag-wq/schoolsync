import { PlantData, INITIAL_PLANT_DATA } from '../types';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDefaultDailyStats() {
  return {
    date: getTodayString(),
    questsCreated: 0,
    questsCompleted: 0,
    questsDeleted: 0,
    streakDays: 0,
  };
}

export function loadPlantData(): PlantData {
   // Guard against storage access errors (e.g., in restricted contexts)
   try {
     const stored = localStorage.getItem('questra_plant_data');
     if (!stored) return INITIAL_PLANT_DATA;
     
     const parsed = JSON.parse(stored);
     
     // 旧データ形式からの移行
     if (!parsed.plants) {
       return {
         exp: parsed.exp || 0,
         coins: parsed.coins || 0,
         tasks: (parsed.tasks || []).map((t: any) => ({
           id: t.id, title: t.title, completed: t.completed, createdAt: t.createdAt,
           completedAt: t.completedAt, category: t.category, estimatedMinutes: t.estimatedMinutes,
           isTemplate: t.isTemplate,
         })),
         ownedItems: parsed.ownedItems || [],
         plants: [{
           id: 'plant_1', plantTypeId: 'default', exp: parsed.exp || 0,
           vitality: 100, lastWateredAt: Date.now(), createdAt: Date.now(),
         }],
         activePlantId: 'plant_1',
         dailyStats: getDefaultDailyStats(),
       };
     }
     
     // dailyStats の日付チェック・リセット
     let dailyStats = parsed.dailyStats || getDefaultDailyStats();
     const today = getTodayString();
     if (dailyStats.date !== today) {
       // ストリーク継続判定
       const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
       const streak = dailyStats.lastCompletedDate === yesterday ? dailyStats.streakDays + 1 : 
                      dailyStats.lastCompletedDate === today ? dailyStats.streakDays : 0;
       dailyStats = { ...getDefaultDailyStats(), streakDays: streak };
     }
     
     return {
       exp: parsed.exp || 0,
       coins: parsed.coins || 0,
       tasks: (parsed.tasks || []).map((t: any) => ({
         id: t.id, title: t.title, completed: t.completed, createdAt: t.createdAt,
         completedAt: t.completedAt, category: t.category, estimatedMinutes: t.estimatedMinutes,
         isTemplate: t.isTemplate,
       })),
       ownedItems: parsed.ownedItems || [],
       plants: parsed.plants.map((p: any) => ({
         id: p.id, plantTypeId: p.plantTypeId || 'default', nickname: p.nickname,
         exp: p.exp || 0, vitality: p.vitality !== undefined ? p.vitality : 100,
         lastWateredAt: p.lastWateredAt || Date.now(), createdAt: p.createdAt || Date.now(),
       })),
       activePlantId: parsed.activePlantId || (parsed.plants[0]?.id || 'plant_1'),
       dailyStats,
     };
   } catch (e) {
     console.warn('Failed to load plant data from localStorage:', e);
     return INITIAL_PLANT_DATA;
   }
 }

export function savePlantData(data: PlantData): void {
   try {
     localStorage.setItem('questra_plant_data', JSON.stringify(data));
   } catch (e) {
     console.warn('Failed to save plant data to localStorage:', e);
   }
 }

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
