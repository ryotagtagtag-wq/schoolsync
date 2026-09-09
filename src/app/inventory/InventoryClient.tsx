'use client';

import { useState, useTransition } from 'react';
import { useItem } from '@/actions/inventory';
import { RARITY, ITEMS_BY_ID } from '@/lib/game/items';
import type { ItemRarity } from '@/lib/game/items';
import { useRouter } from 'next/navigation';

interface InventoryItem {
  id: string;
  itemId: string;
  quantity: number;
  acquiredAt: Date;
  name: string;
  description: string;
  icon: string;
  rarity: ItemRarity;
  category: string;
  effectType: string | null;
  effectValue: number;
  subject: string | null;
}

interface InventoryClientProps {
  items: InventoryItem[];
}

const CATEGORY_LABELS: Record<string, string> = {
  consumable: '消耗品',
  weapon: '武器',
  armor: '防具',
  accessory: '装備',
};

export default function InventoryClient({ items }: InventoryClientProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleUseItem = (itemId: string) => {
    startTransition(async () => {
      const result = await useItem(itemId);
      if (result.success) {
        setMessage(`${result.item?.name}を使った！`);
        setSelectedItem(null);
        router.refresh();
      } else {
        setMessage(result.error || 'アイテムを使用できなかった');
      }
      setTimeout(() => setMessage(null), 2000);
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-4">📦</p>
        <p>まだアイテムがない</p>
        <p className="text-sm mt-2">モンスターを倒してアイテムを獲得しよう！</p>
      </div>
    );
  }

  // Group by category
  const grouped = items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div>
      {message && (
        <div className="mb-4 p-3 rounded bg-green-900/50 border border-green-700 text-green-200 text-center">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(grouped).map(([category, catItems]) => (
          <div key={category} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <h2 className="text-lg font-semibold mb-3 text-gray-200">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="space-y-2">
              {catItems.map((item) => {
                const rarityInfo = RARITY[item.rarity];
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedItem?.id === item.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: rarityInfo.color + '33', color: rarityInfo.color }}
                          >
                            {rarityInfo.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">{item.description}</p>
                      </div>
                      <span className="text-sm text-gray-300">×{item.quantity}</span>
                    </div>

                    {selectedItem?.id === item.id && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-sm text-gray-300 mb-3">{item.description}</p>
                        {item.subject && (
                          <p className="text-xs text-gray-500 mb-2">対象教科: {item.subject}</p>
                        )}
                        {item.category === 'consumable' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseItem(item.itemId);
                            }}
                            disabled={isPending}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded text-sm font-medium transition-colors"
                          >
                            {isPending ? '使用中...' : '使う'}
                          </button>
                        )}
                        {item.category !== 'consumable' && (
                          <p className="text-xs text-blue-400">装備中は戦闘で自動適用</p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
