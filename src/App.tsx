import React, { useState, useRef } from 'react';
import { TabType } from './types';
import { usePlantData } from './hooks/usePlantData';
import { PlantDisplay, PlantDisplayRef } from './components/PlantDisplay';
import { TaskList } from './components/TaskList';
import { Shop } from './components/Shop';
import { Backpack } from './components/Backpack';
import { TabBar } from './components/TabBar';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const plantDisplayRef = useRef<PlantDisplayRef>(null);
  const {
    data,
    isReady,
    plantStage,
    nextStageExp,
    addTask,
    deleteTask,
    toggleTask,
    buyItem,
    useItem,
  } = usePlantData();
  
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce-gentle">🌱</div>
          <p className="text-forest-green text-lg font-medium">Questra を読み込み中...</p>
          <p className="text-forest-green/60 text-sm mt-2">小さな冒険の準備をしています</p>
        </div>
      </div>
    );
  }
  
  const handleBackpackItemUse = (itemId: string) => {
    useItem(itemId);
    plantDisplayRef.current?.triggerHappy();
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-sm border-b border-forest-green/10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-forest-green flex items-center gap-2">
              <span aria-hidden="true">🌱</span>
              Questra
            </h1>
            <div className="flex items-center gap-3 text-forest-green">
              <span className="font-medium">EXP: {data.exp}</span>
              <span className="flex items-center gap-1 bg-pastel-yellow px-3 py-1 rounded-full">
                <span aria-hidden="true">💰</span>
                <span className="font-bold">{data.coins}</span>
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-md mx-auto px-4 pt-6">
        {activeTab === 'main' && (
          <div className="space-y-6 animate-pop-in" role="tabpanel" aria-label="メイン">
            <PlantDisplay
              ref={plantDisplayRef}
              exp={data.exp}
              plantStage={plantStage}
              nextStageExp={nextStageExp}
            />
            
            <section aria-labelledby="tasks-heading">
              <h2 id="tasks-heading" className="text-xl font-bold text-forest-green mb-4 flex items-center gap-2">
                <span aria-hidden="true">📋</span>
                クエストリスト
              </h2>
              <TaskList
                tasks={data.tasks}
                onAddTask={addTask}
                onDeleteTask={deleteTask}
                onToggleTask={toggleTask}
              />
            </section>
          </div>
        )}
        
        {activeTab === 'shop' && (
          <div className="animate-pop-in" role="tabpanel" aria-label="ショップ">
            <h2 className="text-xl font-bold text-forest-green mb-4 flex items-center gap-2">
              <span aria-hidden="true">🛍️</span>
              ショップ
            </h2>
            <Shop
              coins={data.coins}
              ownedItems={data.ownedItems}
              onBuyItem={buyItem}
            />
          </div>
        )}
        
        {activeTab === 'backpack' && (
          <div className="animate-pop-in" role="tabpanel" aria-label="バックパック">
            <h2 className="text-xl font-bold text-forest-green mb-4 flex items-center gap-2">
              <span aria-hidden="true">🎒</span>
              バックパック
            </h2>
            <Backpack
              ownedItems={data.ownedItems}
              onUseItem={handleBackpackItemUse}
            />
          </div>
        )}
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
