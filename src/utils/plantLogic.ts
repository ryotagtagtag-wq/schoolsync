import { PLANT_STAGES, PlantStage } from '../types';

export function getPlantStage(exp: number): PlantStage {
  return PLANT_STAGES.find(stage => exp >= stage.minExp && exp <= stage.maxExp) || PLANT_STAGES[PLANT_STAGES.length - 1];
}

export function getExpToNextStage(exp: number): number {
  const currentStage = getPlantStage(exp);
  const currentIndex = PLANT_STAGES.indexOf(currentStage);
  
  if (currentIndex >= PLANT_STAGES.length - 1) {
    return 0;
  }
  
  const nextStage = PLANT_STAGES[currentIndex + 1];
  return nextStage.minExp - exp;
}

export function getGrowthProgress(exp: number): number {
  const currentStage = getPlantStage(exp);
  const currentIndex = PLANT_STAGES.indexOf(currentStage);
  
  if (currentIndex >= PLANT_STAGES.length - 1) {
    return 100;
  }
  
  const nextStage = PLANT_STAGES[currentIndex + 1];
  const stageRange = nextStage.minExp - currentStage.minExp;
  const progressInStage = exp - currentStage.minExp;
  
  return Math.min(100, Math.round((progressInStage / stageRange) * 100));
}
