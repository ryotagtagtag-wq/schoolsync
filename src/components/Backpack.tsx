import React from 'react';
import { OwnedItem } from '../types';

interface BackpackProps {
  ownedItems: OwnedItem[];
  onUseItem: (itemId: string) => void;
}

export const Backpack: React.FC<BackpackProps> = ({ ownedItems, onUseItem }) => {
  if (ownedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="card p-8 text-center animate-pop-in max-w-md">
          <span className="text-6xl mb-4 block">🎒</span>
          <h3 className="text-xl font-bold text-forest-green mb-2">バックパックが空っぽだよ</h3>
          <p className="text-forest-green/60 mb-6">
            ショップでアイテムを買って、植物にプレゼントしよう！
          </p>
          <span className="text-2xl">💚</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 pb-8" role="list" aria-label="バックパックの中身">
      {ownedItems.map((item) => (
        <BackpackItem
          key={item.id}
          item={item}
          onUse={() => onUseItem(item.id)}
        />
      ))}
    </div>
  );
};

interface BackpackItemProps {
  item: OwnedItem;
  onUse: () => void;
}

const BackpackItem: React.FC<BackpackItemProps> = ({ item, onUse }) => {
  return (
    <article className="card p-4 animate-pop-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" role="listitem">
      <div className="flex items-center gap-4 flex-1">
        <span className="text-4xl" aria-hidden="true">{item.emoji}</span>
        <div>
          <h3 className="font-bold text-forest-green text-lg">{item.name}</h3>
          <p className="text-forest-green/60 text-sm">{item.description}</p>
          <p className="text-pastel-blue text-sm mt-1">所持数: {item.quantity}個</p>
        </div>
      </div>
      
      <button
        onClick={onUse}
        className="btn-primary whitespace-nowrap sm:flex-shrink-0"
        aria-label={`${item.name}を植物に使う（残り${item.quantity}個）`}
      >
        植物に使う 🌱
      </button>
    </article>
  );
};
