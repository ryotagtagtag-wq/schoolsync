import { useState, useCallback, useEffect } from 'react';
import { PlantData, SHOP_ITEMS, PLANT_TYPES } from '../types';
import { loadPlantData, savePlantData, generateId } from '../utils/storage';
import { getPlantStage, getExpToNextStage, getGrowthProgress, calculateVitality, applyItemEffect, createPlantInstance } from '../utils/plantLogic';

const DAILY_QUEST_CREATE_LIMIT = 5;
const DAILY_QUEST_COMPLETE_LIMIT = 10;
const MIN_COMPLETION_MINUTES = 5;
const DELETE_COOLDOWN_MINUTES = 10;

export function usePlantData() {
  const [data, setData] = useState<PlantData>(() => loadPlantData());
  const [isReady, setIsReady] = useState(false);
  const [itemEffect, setItemEffect] = useState<{ exp: number; vitality: number; message: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  
  useEffect(() => { setIsReady(true); }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const updatedPlants = prev.plants.map(plant => ({ ...plant, vitality: calculateVitality(plant) }));
        if (updatedPlants.some((p, i) => p.vitality !== prev.plants[i].vitality)) {
          return { ...prev, plants: updatedPlants };
        }
        return prev;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const updateData = useCallback((updater: (prev: PlantData) => PlantData) => {
    setData(prev => {
      const next = updater(prev);
      savePlantData(next);
      return next;
    });
  }, []);
  
  const activePlant = data.plants.find(p => p.id === data.activePlantId) || data.plants[0];
  const currentVitality = calculateVitality(activePlant);
  const plantStage = getPlantStage(activePlant);
  const nextStageExp = getExpToNextStage(activePlant);
  const progress = getGrowthProgress(activePlant);
  
  const today = new Date().toISOString().split('T')[0];
  const stats = data.dailyStats.date === today ? data.dailyStats : { 
    date: today, questsCreated: 0, questsCompleted: 0, questsDeleted: 0, 
    streakDays: data.dailyStats.streakDays, lastCompletedDate: data.dailyStats.lastCompletedDate 
  };
  
  const addTask = useCallback((title: string, category?: string, estimatedMinutes?: number) => {
    if (!title.trim()) return;
    setCreateError(null);
    
    if (stats.questsCreated >= DAILY_QUEST_CREATE_LIMIT) {
      setCreateError(`今日はもう ${DAILY_QUEST_CREATE_LIMIT} 個までしかクエストを作れません。明日までお待ちください。`);
      return;
    }
    
    const newTask = {
      id: generateId(),
      title: title.trim(),
      completed: false,
      createdAt: Date.now(),
      category: category as any,
      estimatedMinutes,
      isTemplate: !!category,
    };
    updateData(prev => {
      const newStats = prev.dailyStats.date === today ? prev.dailyStats : { 
        date: today, questsCreated: 0, questsCompleted: 0, questsDeleted: 0, 
        streakDays: prev.dailyStats.streakDays, lastCompletedDate: prev.dailyStats.lastCompletedDate 
      };
      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
        dailyStats: { ...newStats, questsCreated: newStats.questsCreated + 1 },
      };
    });
  }, [updateData, stats.questsCreated]);
  
  const deleteTask = useCallback((taskId: string) => {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const minutesSinceCreated = (Date.now() - task.createdAt) / 60000;
    if (minutesSinceCreated < DELETE_COOLDOWN_MINUTES && !task.completed) {
      setCreateError(`作成から ${DELETE_COOLDOWN_MINUTES} 分経たないと削除できません。`);
      return;
    }
    
    updateData(prev => {
      const newStats = prev.dailyStats.date === today ? prev.dailyStats : { 
        date: today, questsCreated: 0, questsCompleted: 0, questsDeleted: 0, 
        streakDays: prev.dailyStats.streakDays, lastCompletedDate: prev.dailyStats.lastCompletedDate 
      };
      return {
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId),
        dailyStats: { ...newStats, questsDeleted: newStats.questsDeleted + 1 },
      };
    });
  }, [updateData, data.tasks]);
  
  const toggleTask = useCallback((taskId: string) => {
    updateData(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task) return prev;
      
      const newCompleted = !task.completed;
      let expChange = 0;
      let coinChange = 0;
      let newStreak = prev.dailyStats.streakDays;
      let newLastCompleted = prev.dailyStats.lastCompletedDate;
      
      if (newCompleted) {
        const minutesSpent = (Date.now() - task.createdAt) / 60000;
        const dailyStats = prev.dailyStats.date === today ? prev.dailyStats : { 
          date: today, questsCreated: 0, questsCompleted: 0, questsDeleted: 0, 
          streakDays: prev.dailyStats.streakDays, lastCompletedDate: prev.dailyStats.lastCompletedDate 
        };
        
        if (dailyStats.questsCompleted >= DAILY_QUEST_COMPLETE_LIMIT) {
          setCompleteError(`今日はもう ${DAILY_QUEST_COMPLETE_LIMIT} 個までしか報酬付きで完了できません。`);
          return prev;
        }
        
        let rewardMultiplier = 1;
        if (minutesSpent < MIN_COMPLETION_MINUTES) {
          rewardMultiplier = 0.3;
        }
        
        const baseExp = 10;
        const baseCoin = 10;
        const streakBonus = Math.floor(prev.dailyStats.streakDays * 0.05 * baseExp);
        
        expChange = Math.round((baseExp + streakBonus) * rewardMultiplier);
        coinChange = Math.round(baseCoin * rewardMultiplier);
        
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (prev.dailyStats.lastCompletedDate === today) {
        } else if (prev.dailyStats.lastCompletedDate === yesterday) {
          newStreak = prev.dailyStats.streakDays + 1;
        } else {
          newStreak = 1;
        }
        newLastCompleted = today;
        
        return {
          ...prev,
          exp: Math.max(0, prev.exp + expChange),
          coins: Math.max(0, prev.coins + coinChange),
          tasks: prev.tasks.map(t => 
            t.id === taskId ? { ...t, completed: true, completedAt: Date.now() } : t
          ),
          plants: prev.plants.map(p => 
            p.id === prev.activePlantId ? { ...p, exp: Math.max(0, p.exp + expChange) } : p
          ),
          dailyStats: {
            ...dailyStats,
            questsCompleted: dailyStats.questsCompleted + 1,
            streakDays: newStreak,
            lastCompletedDate: newLastCompleted,
          },
        };
      } else {
        expChange = -10;
        coinChange = -10;
        return {
          ...prev,
          exp: Math.max(0, prev.exp + expChange),
          coins: Math.max(0, prev.coins + coinChange),
          tasks: prev.tasks.map(t => 
            t.id === taskId ? { ...t, completed: false, completedAt: undefined } : t
          ),
          plants: prev.plants.map(p => 
            p.id === prev.activePlantId ? { ...p, exp: Math.max(0, p.exp + expChange) } : p
          ),
        };
      }
    });
  }, [updateData]);
  
  const buyItem = useCallback((itemId: string) => {
    const shopItem = SHOP_ITEMS.find(item => item.id === itemId);
    if (!shopItem) return false;
    
    let success = false;
    updateData(prev => {
      if (prev.coins < shopItem.price) return prev;
      success = true;
      const existingItem = prev.ownedItems.find(i => i.id === itemId);
      return {
        ...prev,
        coins: prev.coins - shopItem.price,
        ownedItems: existingItem
          ? prev.ownedItems.map(i => i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i)
          : [...prev.ownedItems, { ...shopItem, quantity: 1 }],
      };
    });
    return success;
  }, [updateData]);
  
  const useItem = useCallback((itemId: string) => {
    updateData(prev => {
      const plant = prev.plants.find(p => p.id === prev.activePlantId);
      if (!plant) return prev;
      
      const { expGain, vitalityGain, message } = applyItemEffect(plant, itemId);
      if (expGain > 0 || vitalityGain > 0) {
        setItemEffect({ exp: expGain, vitality: vitalityGain, message });
        setTimeout(() => setItemEffect(null), 2000);
      }
      
      const item = prev.ownedItems.find(i => i.id === itemId);
      if (!item || item.quantity <= 0) return prev;
      
      const newQuantity = item.quantity - 1;
      return {
        ...prev,
        exp: prev.exp + expGain,
        plants: prev.plants.map(p => {
          if (p.id !== prev.activePlantId) return p;
          return { ...p, exp: p.exp + expGain, vitality: Math.min(100, calculateVitality(p) + vitalityGain), lastWateredAt: vitalityGain > 0 ? Date.now() : p.lastWateredAt };
        }),
        ownedItems: newQuantity > 0
          ? prev.ownedItems.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i)
          : prev.ownedItems.filter(i => i.id !== itemId),
      };
    });
  }, [updateData]);
  
  const petPlant = useCallback(() => {
    updateData(prev => {
      const plant = prev.plants.find(p => p.id === prev.activePlantId);
      if (!plant) return prev;
      setItemEffect({ exp: 0, vitality: 0, message: 'なでなで♡' });
      setTimeout(() => setItemEffect(null), 1500);
      return {
        ...prev,
        plants: prev.plants.map(p => 
          p.id === prev.activePlantId ? { ...p, vitality: Math.min(100, calculateVitality(p) + 5) } : p
        ),
      };
    });
  }, [updateData]);
  
  const setActivePlant = useCallback((plantId: string) => updateData(prev => ({ ...prev, activePlantId: plantId })), [updateData]);
  const addPlant = useCallback((plantTypeId: string, nickname?: string) => {
    const newPlant = createPlantInstance(plantTypeId, nickname);
    updateData(prev => ({ ...prev, plants: [...prev.plants, newPlant], activePlantId: newPlant.id }));
  }, [updateData]);
  const deletePlant = useCallback((plantId: string) => updateData(prev => {
    if (prev.plants.length <= 1) return prev;
    const newPlants = prev.plants.filter(p => p.id !== plantId);
    return { ...prev, plants: newPlants, activePlantId: prev.activePlantId === plantId ? newPlants[0].id : prev.activePlantId };
  }), [updateData]);
  const renamePlant = useCallback((plantId: string, nickname: string) => updateData(prev => ({
    ...prev, plants: prev.plants.map(p => p.id === plantId ? { ...p, nickname: nickname.trim() || undefined } : p)
  })), [updateData]);
  
  return {
    data, isReady, activePlant, plantStage, nextStageExp, progress, currentVitality, itemEffect,
    createError, completeError,
    addTask, deleteTask, toggleTask, buyItem, useItem, petPlant,
    setActivePlant, addPlant, deletePlant, renamePlant,
    SHOP_ITEMS, PLANT_TYPES,
    dailyStats: stats,
    DAILY_QUEST_CREATE_LIMIT, DAILY_QUEST_COMPLETE_LIMIT, MIN_COMPLETION_MINUTES,
  };
}
