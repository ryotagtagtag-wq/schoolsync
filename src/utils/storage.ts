import { PlantData, INITIAL_PLANT_DATA, STORAGE_KEY } from '../types';

export function loadPlantData(): PlantData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_PLANT_DATA;
    
    const parsed = JSON.parse(stored);
    
    return {
      exp: typeof parsed.exp === 'number' ? parsed.exp : 0,
      coins: typeof parsed.coins === 'number' ? parsed.coins : 0,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      ownedItems: Array.isArray(parsed.ownedItems) ? parsed.ownedItems : [],
    };
  } catch (error) {
    console.warn('Failed to load plant data from localStorage:', error);
    return INITIAL_PLANT_DATA;
  }
}

export function savePlantData(data: PlantData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save plant data to localStorage:', error);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
