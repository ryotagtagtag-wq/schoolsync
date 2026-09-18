import { useState, useCallback, useEffect } from 'react';
import { PlantData, SHOP_ITEMS, PLANT_TYPES } from '../types';
import { loadPlantData, savePlantData, generateId } from '../utils/storage';
import { getPlantStage, getExpToNextStage, getGrowthProgress, calculateVitality, applyItemEffect, createPlantInstance } from '../utils/plantLogic';

export function usePlantData() {
  const [data, setData] = useState<PlantData>(() => loadPlantData());
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => { setIsReady(true); }, []);
  
  // 元気自動再計算（1分ごと）
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
  
  const today = new Date().toISOString().split('T')[0];
  
  const stats = data.dailyStats.date === today ? data.dailyStats : { 
    date: today, questsCreated: 0, questsCompleted: 0, questsDeleted: 0, 
    streakDays: data.dailyStats.streakDays, lastCompletedDate: data.dailyStats.lastCompletedDate 
  };
  
  // タスク追加
  const addTask = useCallback((title: string, category?: string, estimatedMinutes?: number) => {
    if (!title.trim()) return;
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
        streakDays: prev.dailyStats.streakDays 
      };
      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
        dailyStats: { ...newStats, questsCreated: newStats.questsCreated + 1 },
      };
    });
  }, []);
  
  // タスク削除
  const deleteTask = useCallback((taskId: string) => {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;
    const minutesSinceCreated = (Date.now() - task.createdAt) / 60000;
    if (minutesSinceCreated < 10 && !task.completed) return;
    
    updateData(prev => {
      const newStats = prev.dailyStats.date === today ? prev.dailyStats : { 
        date: new Date().toISOString().split('T')[0], questsCreated: 0, questsCompleted: 0, questsDeleted: 0, 
        streakDays: prev.dailyStats.streakDays 
      };
      return {
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId),
        dailyStats: { ...newStats, questsDeleted: newStats.questsDeleted + 1 },
      };
    });
  }, [data.tasks]);
  
  // タスク完了切替
  const toggleTask = useCallback((taskId: string) => {
    updateData(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task) return prev;
      
      const newCompleted = !task.completed;
      let expChange = 0;
      let coinChange = 0;
      let newStreak = prev.dailyStats.streakDays;
      
      if (newCompleted) {
        const minutesSpent = (Date.now() - task.createdAt) / 60000;
        const dailyStats = prev.dailyStats.date === today ? prev.dailyStats : { 
          date: today, questsCreated: 0, questsCompleted: 0, questsDeleted: 0, 
          streakDays: prev.dailyStats.streakDays 
        };
        
        if (dailyStats.questsCompleted >= 10) return prev;
        
        let rewardMultiplier = 1;
        if (minutesSpent < 5) rewardMultiplier = 0.3;
        
        const baseExp = 10;
        const baseCoin = 10;
        const streakBonus = Math.floor(prev.dailyStats.streakDays * 0.05 * baseExp);
        
        expChange = Math.round((baseExp + streakBonus) * rewardMultiplier);
        coinChange = Math.round(baseCoin * rewardMultiplier);
        
        // 卵・ドラゴン処理
        const updatedPlants = prev.plants.map(p => {
          if (p.id !== prev.activePlantId) return p;
          
          let newEgg = p.egg;
          
          if (p.egg if (p.egg && !p.egg.dragonBorn) {if (p.egg && !p.egg.dragonBorn) { p.egg.hasEgg if (p.egg && !p.egg.dragonBorn) {if (p.egg && !p.egg.dragonBorn) { !p.egg.dragonBorn) {
            // 卵がある場合：成長させる
            const newGrowth = Math.min(100, (p.egg.growth || 0) + 15);
            const hatched = newGrowth >= 100 && !p.egg.dragonBorn;
            
            newEgg = {
              ...p.egg!,
              growth: newGrowth,
              hatchedAt: hatched ? Date.now() : p.egg!.hatchedAt,
              dragonBorn: hatched || p.egg!.dragonBorn,
            };
          } else if (!p.egg || !p.egg.hasEgg) {
            // 卵がない場合：25%で卵発見
            if (Math.random() < 0.25) {
              newEgg = { hasEgg: true, discoveredAt: Date.now(), growth: 15, dragonBorn: false };
            }
          }
          
          return { ...p, exp: p.exp + expChange, vitality: Math.min(100, calculateVitality(p) + 5), egg: newEgg };
        });
        
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (prev.dailyStats.lastCompletedDate === today) {
        } else if (prev.dailyStats.lastCompletedDate === yesterday) {
          newStreak = prev.dailyStats.streakDays + 1;
        } else {
          newStreak = 1;
        }
        
        return {
          ...prev,
          exp: Math.max(0, prev.exp + expChange),
          coins: Math.max(0, prev.coins + coinChange),
          tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true, completedAt: Date.now() } : t),
          plants: updatedPlants,
          dailyStats: { 
            date: new Date().toISOString().split('T')[0], 
            questsCreated: dailyStats.questsCreated, 
            questsCompleted: dailyStats.questsCompleted + 1, 
            questsDeleted: dailyStats.questsDeleted, 
            streakDays: newStreak, 
            lastCompletedDate: new Date().toISOString().split('T')[0] 
          },
        };
      } else {
        // 未完了に戻す
        const expChangeBack = -10;
        const coinChangeBack = -10;
        return {
          ...prev,
          exp: Math.max(0, prev.exp + expChangeBack),
          coins: Math.max(0, prev.coins + coinChangeBack),
          tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: false, completedAt: undefined } : t),
          plants: prev.plants.map(p => p.id === prev.activePlantId ? { ...p, exp: Math.max(0, p.exp + expChangeBack) } : p),
        };
      }
    });
  }, []);
  
  // アイテム購入
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
  }, []);
  
  // アイテム使用
  const useItem = useCallback((itemId: string) => {
    updateData(prev => {
      const plant = prev.plants.find(p => p.id === prev.activePlantId);
      if (!plant) return prev;
      
      const { expGain, vitalityGain } = applyItemEffect(plant, itemId);
      
      const item = prev.ownedItems.find(i => i.id === itemId);
      if (!item || item.quantity <= 0) return prev;
      
      const newQuantity = item.quantity - 1;
      return {
        ...prev,
        exp: prev.exp + expGain,
        plants: prev.plants.map(p => {
          if (p.id !== prev.activePlantId) return p;
          return { 
            ...p, 
            exp: p.exp + expGain, 
            vitality: Math.min(100, calculateVitality(p) + vitalityGain), 
            lastWateredAt: vitalityGain > 0 ? Date.now() : p.lastWateredAt 
          };
        }),
        ownedItems: newQuantity > 0
          ? prev.ownedItems.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i)
          : prev.ownedItems.filter(i => i.id !== itemId),
      };
    });
  }, []);
  
  // 植物をなでる
  const petPlant = useCallback(() => {
    updateData(prev => {
      const plant = prev.plants.find(p => p.id === prev.activePlantId);
      if (!plant) return prev;
      return {
        ...prev,
        plants: prev.plants.map(p => 
          p.id === prev.activePlantId ? { ...p, vitality: Math.min(100, calculateVitality(p) + 5) } : p
        ),
      };
    });
  }, []);
  
  // 植物操作
  const setActivePlant = useCallback((plantId: string) => updateData(prev => ({ ...prev, activePlantId: plantId })), []);
  const addPlant = useCallback((plantTypeId: string, nickname?: string) => {
    const newPlant = createPlantInstance(plantTypeId, nickname);
    updateData(prev => ({ ...prev, plants: [...prev.plants, newPlant], activePlantId: newPlant.id }));
  }, []);
  const deletePlant = useCallback((plantId: string) => updateData(prev => {
    if (prev.plants.length <= 1) return prev;
    const newPlants = prev.plants.filter(p => p.id !== plantId);
    return { ...prev, plants: newPlants, activePlantId: prev.activePlantId === plantId ? newPlants[0].id : prev.activePlantId };
  }), []);
  const renamePlant = useCallback((plantId: string, nickname: string) => updateData(prev => ({
    ...prev, plants: prev.plants.map(p => p.id === plantId ? { ...p, nickname: nickname.trim() || undefined } : p)
  })), []);
  
  // 現在のアクティブな植物
  const activePlant = data.plants.find(p => p.id === data.activePlantId) || data.plants[0];
  const currentVitality = calculateVitality(activePlant);
  const plantStage = getPlantStage(activePlant);
  const nextStageExp = getExpToNextStage(activePlant);
  const progress = getGrowthProgress(activePlant);
  
  return {
    data, isReady, activePlant, plantStage, nextStageExp, progress, currentVitality,
    addTask, deleteTask, toggleTask, buyItem, useItem, petPlant,
    setActivePlant, addPlant, deletePlant, renamePlant,
    SHOP_ITEMS, PLANT_TYPES,
    dailyStats: stats,
    DAILY_QUEST_CREATE_LIMIT: 5, 
    DAILY_QUEST_COMPLETE_LIMIT: 10, 
    MIN_COMPLETION_MINUTES: 5,
  };
}
