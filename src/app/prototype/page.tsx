'use client';

import { useState } from 'react';
import { PrototypeStyles } from '@/components/prototype/PrototypeStyles';
import { TitleScreen } from '@/components/prototype/screens/TitleScreen';
import { WorldScreen } from '@/components/prototype/screens/WorldScreen';
import { BattleScreen } from '@/components/prototype/screens/BattleScreen';
import { RewardScreen } from '@/components/prototype/screens/RewardScreen';

type ScreenId = 'title' | 'world' | 'battle' | 'reward';

interface BattleData {
  monster?: { id: string };
}

interface RewardData {
  xpGained: number;
  goldGained: number;
  items: any[];
  levelUp: boolean;
  monsterId?: string;
}

export default function PrototypePage() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('title');
  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const [rewardData, setRewardData] = useState<RewardData | null>(null);

  const navigate = (screen: ScreenId, data?: any) => {
    setCurrentScreen(screen);
    if (screen === 'battle' && data) setBattleData(data);
    if (screen === 'reward' && data) setRewardData(data);
    if (screen === 'title') {
      setBattleData(null);
      setRewardData(null);
    }
  };

  return (
    <PrototypeStyles>
      <div className="prototype-app">
        {currentScreen === 'title' && (
          <TitleScreen 
            onStart={() => navigate('world')} 
            onContinue={() => navigate('world')} 
            onSettings={() => {}}
          />
        )}
        {currentScreen === 'world' && (
          <WorldScreen 
            onBattleStart={(monsterId: string) => { 
              setBattleData({monster: {id: monsterId}}); 
              navigate('battle'); 
            }} 
          />
        )}
        {currentScreen === 'battle' && (
          <BattleScreen />
        )}
        {currentScreen === 'reward' && rewardData && (
          <RewardScreen rewardData={rewardData} />
        )}
        
        {/* デバッグ用画面切替ボタン */}
        <div className="debug-nav" style={{ pointerEvents: 'auto' }}>
          <button onClick={() => navigate('title')} className="debug-btn">📋 タイトル</button>
          <button onClick={() => navigate('world')} className="debug-btn">🗺️ ワールド</button>
          <button onClick={() => { setBattleData({monster: {id: 'golem'}}); navigate('battle'); }} className="debug-btn">⚔️ バトル</button>
          <button onClick={() => { setRewardData({xpGained: 80, goldGained: 40, items: [{id:'arcadia_star', name:'アルカディアの星', rarity:'legendary', effect:'全ステータス+10', emoji:'⭐'}], levelUp: true}); navigate('reward'); }} className="debug-btn">🎁 報酬</button>
        </div>
      </div>
    </PrototypeStyles>
  );
}
