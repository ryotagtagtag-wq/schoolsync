import React from 'react';
import { Item, OwnedItem } from '../types';
import { SHOP_ITEMS } from '../types';

interface ShopProps {
  coins: number;
  ownedItems: OwnedItem[];
  onBuyItem: (itemId: string) => boolean;
}

export const Shop: React.FC<ShopProps> = ({ coins, ownedItems, onBuyItem }) => {
  return (
    <div className="space-y-6 pb-8">
      <div className="card p-4 text-center animate-pop-in">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl">💰</span>
          <span className="text-2xl font-bold text-forest-green">{coins} コイン</span>
        </div>
        <p className="text-forest-green/60 text-sm">クエストを完了してコインを貯めよう！</p>
      </div>
      
      <div className="space-y-4" role="list" aria-label="ショップアイテム">
        {SHOP_ITEMS.map((item) => {
          const owned = ownedItems.find(i => i.id === item.id);
          const quantity = owned?.quantity || 0;
          const canAfford = coins >= item.price;
          
          return (
            <ShopItem
              key={item.id}
              item={item}
              quantity={quantity}
              canAfford={canAfford}
              onBuy={() => onBuyItem(item.id)}
            />
          );
        })}
      </div>
      
      <div className="card p-6 text-center text-forest-green/60">
        <p className="text-lg mb-2">🌿 お店の品揃えは以上だよ</p>
        <p className="text-sm">クエストをがんばってコインを貯めてね！</p>
      </div>
    </div>
  );
};

interface ShopItemProps {
  item: Item;
  quantity: number;
  canAfford: boolean;
  onBuy: () => void;
}

const ShopItem: React.FC<ShopItemProps> = ({ item, quantity, canAfford, onBuy }) => {
  return (
    <article className="card p-4 animate-pop-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" role="listitem">
      <div className="flex items-center gap-4 flex-1">
        <span className="text-4xl" aria-hidden="true">{item.emoji}</span>
        <div>
          <h3 className="font-bold text-forest-green text-lg">{item.name}</h3>
          <p className="text-forest-green/60 text-sm">{item.description}</p>
          {quantity > 0 && (
            <p className="text-pastel-blue text-sm mt-1">✨ 所持数: {quantity}個</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:flex-shrink-0">
        <span className="font-bold text-forest-green text-lg">
          {item.price} 💰
        </span>
        <button
          onClick={onBuy}
          disabled={!canAfford}
          className="btn-primary whitespace-nowrap"
          aria-label={`${item.name}を${item.price}コインで購入する${!canAfford ? '（コインが足りません）' : ''}`}
        >
          購入
        </button>
      </div>
    </article>
  );
};
