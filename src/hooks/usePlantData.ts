import { useState, useCallback, useEffect } from 'react';
import { PlantData, Task, SHOP_ITEMS } from '../types';
import { loadPlantData, savePlantData, generateId } from '../utils/storage';
import { getPlantStage } from '../utils/plantLogic';

export function usePlantData() {
  const [data, setData] = useState<PlantData>(() => loadPlantData());
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    setIsReady(true);
  }, []);
  
  const updateData = useCallback((updater: (prev: PlantData) => PlantData) => {
    setData(prev => {
      const next = updater(prev);
      savePlantData(next);
      return next;
    });
  }, []);
  
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
        exp: Math.max(0, prev.exp + expChange),
        coins: Math.max(0, prev.coins + coinChange),
        tasks: prev.tasks.map(t => 
          t.id === taskId ? { ...t, completed: newCompleted } : t
        ),
      };
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
          ? prev.ownedItems.map(i => 
              i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [...prev.ownedItems, { ...shopItem, quantity: 1 }],
      };
    });
    return success;
  }, [updateData]);
  
  const useItem = useCallback((itemId: string) => {
    updateData(prev => {
      const item = prev.ownedItems.find(i => i.id === itemId);
      if (!item || item.quantity <= 0) return prev;
      
      const newQuantity = item.quantity - 1;
      return {
        ...prev,
        ownedItems: newQuantity > 0
          ? prev.ownedItems.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i)
          : prev.ownedItems.filter(i => i.id !== itemId),
      };
    });
  }, [updateData]);
  
  const plantStage = getPlantStage(data.exp);
  const nextStageExp = plantStage.maxExp === Infinity ? null : plantStage.maxExp + 1;
  
  return {
    data,
    isReady,
    plantStage,
    nextStageExp,
    addTask,
    deleteTask,
    toggleTask,
    buyItem,
    useItem,
  };
}
