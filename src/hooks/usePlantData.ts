import { useState, useCallback, useEffect } from 'react';
import { PlantData, Task, SHOP_ITEMS, PLANT_TYPES } from '../types';
import { loadPlantData, savePlantData, generateId } from '../utils/storage';
import { getPlantStage, getExpToNextStage, getGrowthProgress, calculateVitality, applyItemEffect, createPlantInstance } from '../utils/plantLogic';

export function usePlantData() {
  const [data, setData] = useState<PlantData>(() => loadPlantData());
  const [isReady, setIsReady] = useState(false);
  const [itemEffect, setItemEffect] = useState<{ exp: number; vitality: number; message: string } | null>(null);
  
  useEffect(() => {
    setIsReady(true);
  }, []);
  
  // 定期的に元気を再計算（1分ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const updatedPlants = prev.plants.map(plant => ({
          ...plant,
          vitality: calculateVitality(plant),
        }));
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
  
  // 現在のアクティブな植物を取得
  const activePlant = data.plants.find(p => p.id === data.activePlantId) || data.plants[0];
  const plantType = PLANT_TYPES.find(t => t.id === activePlant.plantTypeId) || PLANT_TYPES[0];
  const currentVitality = calculateVitality(activePlant);
  const plantStage = getPlantStage(activePlant);
  const nextStageExp = getExpToNextStage(activePlant);
  const progress = getGrowthProgress(activePlant);
  
  // タスク操作
  const addTask = useCallback((title: string) => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: generateId(),
      title: title.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    updateData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
  }, [updateData]);
  
  const deleteTask = useCallback((taskId: string) => {
    updateData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  }, [updateData]);
  
  const toggleTask = useCallback((taskId: string) => {
    updateData(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task) return prev;
      
      const newCompleted = !task.completed;
      const expChange = newCompleted ? 10 : -10;
      const coinChange = newCompleted ? 10 : -10;
      
      return {
        ...prev,
        exp: Math.max(0, prev.exp + expChange), // 後方互換性
        coins: Math.max(0, prev.coins + coinChange),
        tasks: prev.tasks.map(t => 
          t.id === taskId ? { ...t, completed: newCompleted } : t
        ),
        // アクティブな植物にもEXP反映
        plants: prev.plants.map(p => 
          p.id === prev.activePlantId 
            ? { ...p, exp: Math.max(0, p.exp + expChange) }
            : p
        ),
      };
    });
  }, [updateData]);
  
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
          ? prev.ownedItems.map(i => 
              i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [...prev.ownedItems, { ...shopItem, quantity: 1 }],
      };
    });
    return success;
  }, [updateData]);
  
  // アイテム使用（EXP・元気付与 + エフェクト表示）
  const useItem = useCallback((itemId: string) => {
    updateData(prev => {
      const plant = prev.plants.find(p => p.id === prev.activePlantId);
      if (!plant) return prev;
      
      const { expGain, vitalityGain, message } = applyItemEffect(plant, itemId);
      
      // エフェクト表示用にセット
      if (expGain > 0 || vitalityGain > 0) {
        setItemEffect({ exp: expGain, vitality: vitalityGain, message });
        setTimeout(() => setItemEffect(null), 2000);
      }
      
      const item = prev.ownedItems.find(i => i.id === itemId);
      if (!item || item.quantity <= 0) return prev;
      
      const newQuantity = item.quantity - 1;
      
      return {
        ...prev,
        exp: prev.exp + expGain, // 後方互換
        plants: prev.plants.map(p => {
          if (p.id !== prev.activePlantId) return p;
          return {
            ...p,
            exp: p.exp + expGain,
            vitality: Math.min(100, calculateVitality(p) + vitalityGain),
            lastWateredAt: vitalityGain > 0 ? Date.now() : p.lastWateredAt,
          };
        }),
        ownedItems: newQuantity > 0
          ? prev.ownedItems.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i)
          : prev.ownedItems.filter(i => i.id !== itemId),
      };
    });
  }, [updateData]);
  
  // 植物をなでる（アイテムなしで喜ばせる）
  const petPlant = useCallback(() => {
    updateData(prev => {
      const plant = prev.plants.find(p => p.id === prev.activePlantId);
      if (!plant) return prev;
      
      setItemEffect({ exp: 0, vitality: 0, message: 'なでなで♡' });
      setTimeout(() => setItemEffect(null), 1500);
      
      return {
        ...prev,
        plants: prev.plants.map(p => 
          p.id === prev.activePlantId 
            ? { ...p, vitality: Math.min(100, calculateVitality(p) + 5) }
            : p
        ),
      };
    });
  }, [updateData]);
  
  // 植物切り替え
  const setActivePlant = useCallback((plantId: string) => {
    updateData(prev => ({ ...prev, activePlantId: plantId }));
  }, [updateData]);
  
  // 新しい植物を追加
  const addPlant = useCallback((plantTypeId: string, nickname?: string) => {
    const newPlant = createPlantInstance(plantTypeId, nickname);
    updateData(prev => ({
      ...prev,
      plants: [...prev.plants, newPlant],
      activePlantId: newPlant.id,
    }));
  }, [updateData]);
  
  // 植物削除
  const deletePlant = useCallback((plantId: string) => {
    updateData(prev => {
      if (prev.plants.length <= 1) return prev; // 最後の1つは消せない
      const newPlants = prev.plants.filter(p => p.id !== plantId);
      return {
        ...prev,
        plants: newPlants,
        activePlantId: prev.activePlantId === plantId ? newPlants[0].id : prev.activePlantId,
      };
    });
  }, [updateData]);
  
  // 植物のニックネーム変更
  const renamePlant = useCallback((plantId: string, nickname: string) => {
    updateData(prev => ({
      ...prev,
      plants: prev.plants.map(p => 
        p.id === plantId ? { ...p, nickname: nickname.trim() || undefined } : p
      ),
    }));
  }, [updateData]);
  
  return {
    data,
    isReady,
    // 現在の植物関連
    activePlant,
    plantType,
    plantStage,
    nextStageExp,
    progress,
    currentVitality,
    itemEffect,
    // 操作
    addTask,
    deleteTask,
    toggleTask,
    buyItem,
    useItem,
    petPlant,
    setActivePlant,
    addPlant,
    deletePlant,
    renamePlant,
    // 定数
    SHOP_ITEMS,
    PLANT_TYPES,
  };
}
