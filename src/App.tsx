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

const CAT_EMOJI: Record<string, string> = {
  study: '📚', exercise: '🏃', household: '🧹', hobby: '🎨', health: '🧘', social: '💬', custom: '✨',
};

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
  } = usePlantData();
  
  // 朝の挨拶表示制御
  useEffect(() => {
    if (!isReady) return;
    const today = new Date().toISOString().split('T')[0];
    const lastShown = localStorage.getItem('morningGreetingLastShown');
    if (lastShown !== today) {
      setShowMorningGreeting(true);
    }
  }, [isReady]);

  const handleMorningGreetingComplete = () => {
    setShowMorningGreeting(false);
  };

  const handleMorningEggFound = (eggState: any) => {
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
              itemEffect={null}
            />
            
            <section aria-labelledby="tasks-heading">
              <h2 id="tasks-heading" className="text-xl font-bold text-forest-green mb-4 flex items-center gap-2">
                <span aria-hidden="true">📝</span>
                今日のクエスト
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.tasks.filter(t => !t.completed).length === 0 ? (
                  <div className="card p-6 text-center animate-pop-in">
                    <span className="text-3xl mb-2 block">📝</span>
                    <p className="text-forest-green/60">クエストがありません</p>
                    <p className="text-forest-green/50 text-sm mt-1">「クエスト」タブで追加しよう！</p>
                  </div>
                ) : (
                  <>
                    {data.tasks.filter(t => !t.completed).slice(0, 3).map(task => {
                      return (
                        <article key={task.id} className="card p-3 animate-pop-in flex items-center gap-3">
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="w-6 h-6 rounded border-2 border-forest-green/30 flex-shrink-0"
                            aria-label="完了する"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-forest-green truncate">{task.title}</p>
                            {task.category && (
                              <span className="text-xs text-forest-green/60">
                                {CAT_EMOJI[task.category] || '✨'} {task.category}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => toggleTask(task.id)} 
                            className="text-forest-green/50 hover:text-forest-green"
                            aria-label="完了する"
                          >
                            ✓
                          </button>
                        </article>
                      );
                    })}
                  </>
                )}
                {data.tasks.filter(t => !t.completed).length > 3 && (
                  <button 
                    onClick={() => setActiveTab('quest')}
                    className="w-full btn-secondary text-sm"
                  >
                    すべて見る（{data.tasks.filter(t => !t.completed).length}件） →
                  </button>
                )}
              </div>
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
              createError={null}
              completeError={null}
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
      
      {/* 朝の挨拶モーダル */}
      {showMorningGreeting && (
        <MorningGreeting
          plant={activePlant}
          onComplete={handleMorningGreetingComplete}
          onEggFound={handleMorningEggFound}
        />
      )}
      
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        coins={data.coins}
      />
    </div>
  );
};

export default App;
