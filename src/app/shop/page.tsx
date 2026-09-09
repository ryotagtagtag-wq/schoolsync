import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getShopItems } from '@/actions/inventory';
import { getPlayerProfile } from '@/actions/player';
import ShopClient from './ShopClient';

export const metadata: Metadata = {
  title: '冒険者商店 - Questra',
  description: '冒険で使うアイテムを購入できる',
};

export default async function ShopPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/shop');
  }

  const shopItems = getShopItems();
  const profileResult = await getPlayerProfile();
  const gold = profileResult.success ? profileResult.data?.gold ?? 0 : 0;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">🏪 冒険者商店</h1>
          <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-700 px-4 py-2 rounded-lg">
            <span className="text-yellow-400">🪙</span>
            <span className="text-yellow-200 font-bold">{gold}</span>
          </div>
        </div>
        <ShopClient items={shopItems} userGold={gold} />
      </div>
    </div>
  );
}
