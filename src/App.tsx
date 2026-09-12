import React, { useState, useRef } from 'react';
import { TabType } from './types';
import { usePlantData } from './hooks/usePlantData';
import { PlantDisplay, PlantDisplayRef } from './components/PlantDisplay';
import { Shop } from './components/Shop';
import { Backpack } from './components/Backpack';
import { Garden } from './components/Garden';
import { Quest } from './components/Quest';
import { TabBar } from './components/TabBar';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const plantDisplayRef = useRef<PlantDisplayRef>(null);
  const {
    data,
    isReady,
    activePlant,
    plantStage,
    nextStageExp,
    currentVitality,
    itemEffect,
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
    createError,
    completeError,
    DAILY_QUEST_CREATE_LIMIT,
    DAILY_QUEST_COMPLETE_LIMIT,
    MIN_COMPLETION_MINUTES,
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
              <span className="font-medium">EXP: {activePlant.exp}</span>
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
              plant={activePlant}
              plantStage={plantStage}
              nextStageExp={nextStageExp}
              currentVitality={currentVitality}
              onPet={petPlant}
              itemEffect={itemEffect}
            />
            
            <section aria-labelledby="tasks-heading">
              <h2 id="tasks-heading" className="text-xl font-bold text-forest-green mb-4 flex items-center gap-2">
                <span aria-hidden="true">📝</span>
                クエスト (メイン画面では簡易表示)
              </h2>
              <p className="text-forest-green/60 text-center py-4">
                詳しいクエスト管理は <strong>「クエスト」タブ</strong> で！
              </p>
            </section>
          </div>
        )}
        
        {activeTab === 'quest' && (
          <div className="animate-pop-in" role="tabpanel" aria-label="クエスト">
            <Quest
              tasks={data.tasks}
              onAddTask={addTask}
              onDeleteTask={deleteTask}
              onToggleTask={toggleTask}
              dailyStats={dailyStats}
              createError={createError}
              completeError={completeError}
              DAILY_QUEST_CREATE_LIMIT={DAILY_QUEST_CREATE_LIMIT}
              DAILY_QUEST_COMPLETE_LIMIT={DAILY_QUEST_COMPLETE_LIMIT}
              MIN_COMPLETION_MINUTES={MIN_COMPLETION_MINUTES}
            />
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
              onUseItem={(itemId) => { useItem(itemId); plantDisplayRef.current?.triggerHappy(); }}
            />
          </div>
        )}
        
        {activeTab === 'garden' && (
          <div className="animate-pop-in" role="tabpanel" aria-label="ガーデン">
            <h2 className="text-xl font-bold text-forest-green mb-4 flex items-center gap-2">
              <span aria-hidden="true">🌿</span>
              ガーデン
            </h2>
            <Garden
              plants={data.plants}
              plantTypes={PLANT_TYPES}
              activePlantId={data.activePlantId}
              onSetActive={setActivePlant}
              onAddPlant={addPlant}
              onDeletePlant={deletePlant}
              onRenamePlant={renamePlant}
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
