'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { ScreenId, BattleData, RewardData } from '@/lib/prototype/screens';

interface ScreenContextType {
  currentScreen: ScreenId;
  battleData: BattleData | null;
  rewardData: RewardData | null;
  navigate: (screen: ScreenId, data?: any) => void;
  goToScreen: (screen: ScreenId, data?: any) => void;
}

const ScreenContext = createContext<ScreenContextType | null>(null);

export function ScreenProvider(props: { children: ReactNode; initialScreen?: ScreenId }) {
  const { children, initialScreen = 'title' } = props;
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(initialScreen);
  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const [rewardData, setRewardData] = useState<RewardData | null>(null);

  const navigate = useCallback((screen: ScreenId, data?: any) => {
    setCurrentScreen(screen);
    if (screen === 'battle' && data) setBattleData(data);
    if (screen === 'reward' && data) setRewardData(data);
    if (screen === 'title') {
      setBattleData(null);
      setRewardData(null);
    }
  }, []);

  return (
    <ScreenContext.Provider value={{ currentScreen, battleData, rewardData, navigate, goToScreen: navigate }}>
      {children}
    </ScreenContext.Provider>
  );
}

export function useScreen() {
  const context = useContext(ScreenContext);
  if (!context) throw new Error('useScreen must be used within ScreenProvider');
  return context;
}

// エイリアス（互換性のため）
export const usePrototype = useScreen;
