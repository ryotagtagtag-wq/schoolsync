'use client';

import { useState, useTransition } from 'react';
import { purchaseItem } from '@/actions/inventory';
import { RARITY } from '@/lib/game/items';
import type { ItemDef } from '@/lib/game/items';
import { useRouter } from 'next/navigation';

interface ShopClientProps {
  items: ItemDef[];
  userGold: number;
}

export default function ShopClient({ items, userGold }: ShopClientProps) {
  const [gold, setGold] = useState(userGold);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handlePurchase = (itemId: string, price: number) => {
    startTransition(async () => {
      const result = await purchaseItem(itemId, 1);
      if (result.success) {
        setGold((prev) => prev - price);
        setMessage({ type: 'success', text: '購入成功！' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error || '購入に失敗した' });
      }
      setTimeout(() => setMessage(null), 2000);
    });
  };

  return (
    <div>
      {message && (
        <div
          className={`mb-4 p-3 rounded text-center ${
            message.type === 'success'
              ? 'bg-green-900/50 border border-green-700 text-green-200'
              : 'bg-red-900/50 border border-red-700 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const rarityInfo = RARITY[item.rarity];
          const canAfford = gold >= item.price;

          return (
            <div
              key={item.id}
              className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{item.name}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: rarityInfo.color + '33', color: rarityInfo.color }}
                    >
                      {rarityInfo.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-yellow-400">
                  <span>🪙</span>
                  <span className="font-bold">{item.price}</span>
                </div>
                <button
                  onClick={() => handlePurchase(item.id, item.price)}
                  disabled={!canAfford || isPending}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                    canAfford
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isPending ? '...' : canAfford ? '購入' : 'ゴールド不足'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
