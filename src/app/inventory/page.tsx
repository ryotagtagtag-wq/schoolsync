import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getInventory } from '@/actions/inventory';
import { RARITY } from '@/lib/game/items';
import InventoryClient from './InventoryClient';

export const metadata: Metadata = {
  title: 'バックパック - Questra',
  description: '冒険で手に入れたアイテムを確認・使用できる',
};

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/inventory');
  }

  const inventory = await getInventory();

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">🎒 バックパック</h1>
        <InventoryClient items={inventory} />
      </div>
    </div>
  );
}
