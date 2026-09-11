import React from 'react';
import { TabType } from '../types';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  coins: number;
}

const TABS: { id: TabType; label: string; emoji: string }[] = [
  { id: 'main', label: 'メイン', emoji: '🏠' },
  { id: 'shop', label: 'ショップ', emoji: '🛍️' },
  { id: 'backpack', label: 'バックパック', emoji: '🎒' },
];

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, coins }: TabBarProps): React.ReactElement => {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-soft-white border-t border-forest-green/10 shadow-[0_-4px_12px_rgba(45,90,61,0.08)] z-50"
      role="tablist"
      aria-label="メインナビゲーション"
    >
      <div className="grid grid-cols-3 gap-1 p-2 safe-area-inset-bottom">
        {TABS.map((tab: { id: TabType; label: string; emoji: string }) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : ''} flex flex-col items-center gap-1`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-label={`${tab.label}タブ${tab.id === 'shop' && coins > 0 ? `（${coins}コイン所持）` : ''}`}
          >
            <span className="text-xl" aria-hidden="true">{tab.emoji}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
