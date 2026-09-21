import React, { useState, useRef, useEffect } from 'react';
import { TabType } from './types';
import { usePlantData } from './hooks/usePlantData';
import { PlantDisplay, PlantDisplayRef } from './components/PlantDisplay';
import { Shop } from './components/Shop';
import { Backpack } from './components/Backpack';
import { Garden } from './components/Garden';
import { Quest } from './components/Quest';
import { MorningGreeting } from './components/MorningGreeting';
import { TabBar } from './components/TabBar';
import { EggState } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const plantDisplayRef = useRef<PlantDisplayRef>(null);
  const [showMorningGreeting, setShowMorningGreeting] = useState(false);
   
  const {
    data,
    isReady,
    activePlant,
    plantStage,
    nextStageExp,
    currentVitality,
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
    PLANT_TYPES,
    dailyStats,
    DAILY_QUEST_CREATE_LIMIT,
    DAILY_QUEST_COMPLETE_LIMIT,
    MIN_COMPLETION_MINUTES,
    updateData,
} = usePlantData();

// Debug functions (development only)
     if (import.meta.env.DEV) {
       useEffect(() => {
         (window as any).__QUESTRA_DEBUG = {
           forceEggFound: () => {
             updateData(prev => {
               const plant = prev.plants.find(p => p.id === prev.activePlantId);
               if (!plant) return prev;
               const newEgg: EggState = {
                 hasEgg: true,
                 discoveredAt: Date.now(),
                 growth: 0,
                 hatchedAt: undefined,
                 dragonBorn: false,
                 dragonName: undefined,
                 dragonExp: undefined
               };
               return {
                 ...prev,
                 plants: prev.plants.map(p =>
                   p.id === prev.activePlantId
                     ? {
                         ...p,
                         egg: newEgg
                       }
                     : p
                 )
               };
             });
           },
           forceHatch: () => {
             updateData(prev => {
               const plant = prev.plants.find(p => p.id === prev.activePlantId);
               if (!plant || !plant.egg?.hasEgg) return prev;
               const hatchedAt = Date.now();
               return {
                 ...prev,
                 plants: prev.plants.map(p =>
                   p.id === prev.activePlantId
                     ? {
                         ...p,
                         egg: {
                           ...plant.egg,
                           hatchedAt,
                           dragonBorn: true,
                           growth: 100
                         } as EggState
                       }
                     : p
                 )
               };
             });
           },
           setDragonName: (name: string) => {
             updateData(prev => {
               const plant = prev.plants.find(p => p.id === prev.activePlantId);
               if (!plant || !plant.egg?.hasEgg) return prev;
               return {
                 ...prev,
                 plants: prev.plants.map(p =>
                   p.id === prev.activePlantId
                     ? {
                         ...p,
                         egg: {
                           ...plant.egg,
                           dragonName: name.trim() || undefined,
                           dragonExp: Math.floor(Math.random() * 50) + 50
                         } as EggState
                       }
                     : p
                 )
               };
             });
           },
           getState: () => data
         };
       }, [data, updateData]);
     }

    // 朝の挨拶表示制御
  useEffect(() => {
    if (!isReady) return;
    const today = new Date().toISOString().split('T')[0];
    let lastShown = null;
    try {
      lastShown = localStorage.getItem('morningGreetingLastShown');
    } catch (e) {
      console.warn('Unable to access localStorage for morning greeting:', e);
    }
    if (lastShown !== today) {
      setShowMorningGreeting(true);
    }
  }, [isReady]);

  const handleMorningGreetingComplete = () => {
    setShowMorningGreeting(false);
  };

  const handleMorningEggFound = (_eggState: any) => {
      // エッグが発見されたときの処理
      // MorningGreetingからエッグ発見の通知を受けたら、アクティブな植物のエッグ状態を更新
      updateData(prev => {
        const plant = prev.plants.find(p => p.id === prev.activePlantId);
        if (!plant) return prev;
        
        // エッグ状態を初期化（発見時はgrowth: 0から開始）
        const newEgg: EggState = {
          hasEgg: true,
          discoveredAt: Date.now(),
          growth: 0,
          hatchedAt: undefined,
          dragonBorn: false,
          dragonName: undefined,
          dragonExp: undefined
        };
        return {
          ...prev,
          plants: prev.plants.map(p => 
            p.id === prev.activePlantId ? { ...p, egg: newEgg } : p
          )
        };
      });
    };

  // Determine which component to show based on activeTab
  const renderContent = () => {
    switch (activeTab) {
      case 'main':
        return (
          <div className="space-y-6 pb-24">
            <PlantDisplay
              ref={plantDisplayRef}
              plant={activePlant}
              plantStage={plantStage}
              nextStageExp={nextStageExp}
              currentVitality={currentVitality}
              onPet={petPlant}
              itemEffect={null} // placeholder; could be enhanced
            />
          </div>
        );
      case 'quest':
        return <Quest 
          tasks={data.tasks}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
          onToggleTask={toggleTask}
          dailyStats={dailyStats}
          createError={null} // placeholder
          completeError={null} // placeholder
          DAILY_QUEST_CREATE_LIMIT={DAILY_QUEST_CREATE_LIMIT}
          DAILY_QUEST_COMPLETE_LIMIT={DAILY_QUEST_COMPLETE_LIMIT}
          MIN_COMPLETION_MINUTES={MIN_COMPLETION_MINUTES}
        />;
      case 'shop':
        return <Shop 
          coins={data.coins}
          ownedItems={data.ownedItems}
          onBuyItem={buyItem}
        />;
      case 'backpack':
        return <Backpack 
          ownedItems={data.ownedItems}
          onUseItem={useItem}
        />;
      case 'garden':
        return <Garden
          plants={data.plants}
          plantTypes={PLANT_TYPES}
          activePlantId={data.activePlantId}
          onSetActive={setActivePlant}
          onAddPlant={addPlant}
          onDeletePlant={deletePlant}
          onRenamePlant={renamePlant}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pastel-green/50">
      {/* Morning Greeting Modal */}
      {showMorningGreeting && (
        <MorningGreeting
          plant={activePlant}
          onComplete={handleMorningGreetingComplete}
          onEggFound={handleMorningEggFound}
        />
      )}
      
      <main className="pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {renderContent()}
        </div>
      </main>
      
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        coins={data.coins}
      />
    </div>
  );
};

export default App;
