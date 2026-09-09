'use client';

import { createContext, useContext, useState, ReactNode, useCallback, type ComponentType } from 'react';
import type { ScreenId, BattleData, RewardData } from '@/lib/prototype/screens';

interface PrototypeContextType {
  currentScreen: ScreenId;
  battleData: BattleData | null;
  rewardData: RewardData | null;
  navigate: (screen: ScreenId, data?: any) => void;
}

interface PrototypeProviderProps {
  children: ReactNode;
  initialScreen?: ScreenId;
}

const PrototypeContext = createContext<PrototypeContextType | null>(null);

const PrototypeProviderComponent: ComponentType<PrototypeProviderProps> = (props) => {
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
    <PrototypeContext.Provider value={{ currentScreen, battleData, rewardData, navigate }}>
      {children}
    </PrototypeContext.Provider>
  );
};

export const PrototypeProvider = PrototypeProviderComponent;

export function usePrototypeContext() {
  const context = useContext(PrototypeContext);
  if (!context) throw new Error('usePrototypeContext must be used within PrototypeProvider');
  return context;
}
