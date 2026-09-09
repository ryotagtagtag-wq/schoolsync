'use client';

import { GameCanvas } from '@/game/GameCanvas';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { updateAssignment } from '@/actions/assignments';
import { awardReward } from '@/actions/player';
import { addItem } from '@/actions/inventory';
import type { PlayerState } from '@/lib/game/types';
import type { AssignmentData } from '@/game/scenes/WorldScene';

interface PlayGameClientProps {
  playerData?: PlayerState | null;
  assignments?: AssignmentData[];
}

export default function PlayGameClient({ playerData, assignments = [] }: PlayGameClientProps) {
  const router = useRouter();
  const startTransition = useTransition();

  const handleFacilityInteract = (facilityId: string) => {
    // 施設UIが閉じられた後に呼ばれる（従来のナビゲーション用フォールバック）
    const facilityRoutes: Record<string, string> = {
      'bulletin': '/dashboard/assignments',
      'library': '/dashboard/assignments/new',
      'forge': '/profile',
      'shop': '/shop',
      'training': '/profile',
      'guild': '/groups',
    };

    const route = facilityRoutes[facilityId];
    if (route) {
      router.push(route);
    }
  };

  const handleFacilityAction = (action: string, data?: unknown) => {
    // 施設内アクションの処理
    switch (action) {
      case 'create_assignment':
        router.push(`/dashboard/assignments/new?subject=${data?.subject || ''}`);
        break;
      case 'set_priority':
        // 優先度設定は作成ページで処理
        break;
      case 'upgrade_facility':
        // 施設強化はプロフィールページで処理（またはAPI呼び出し）
        router.push('/profile');
        break;
      case 'shop_category':
        router.push(`/shop?category=${data?.category || ''}`);
        break;
      case 'open_inventory':
        router.push('/inventory');
        break;
      case 'view_achievements':
        router.push('/profile');
        break;
      case 'create_group':
      case 'join_group':
      case 'guild_quests':
      case 'my_groups':
        router.push('/groups');
        break;
    }
  };

  const handleBattleEnd = (result: 'victory' | 'defeat' | 'flee', assignmentId?: string, reward?: unknown) => {
    if (result !== 'victory' || !assignmentId || !reward) return;

    startTransition(async () => {
      // Mark assignment as completed
      const updateResult = await updateAssignment(assignmentId, {
        status: 'completed',
      });

      // Award XP and gold to player
      const rewardResult = await awardReward({
        xp: reward.xp || 0,
        gold: reward.gold || 0,
      });

      // Award item drops to inventory
      if (reward.items && Array.isArray(reward.items)) {
        for (const drop of reward.items) {
          try {
            await addItem(drop.itemId, drop.quantity);
          } catch {
            // Item award failed silently — don't block battle completion
          }
        }
      }

      if (updateResult.success || rewardResult.success) {
        // Refresh server components to reflect new player data
        router.refresh();
      }
    });
  };

  // PlayerStateをGameCanvas用の型に変換
  const canvasPlayerData = playerData ? {
    userId: playerData.userId,
    level: playerData.level,
    xp: playerData.xp,
    xpToNext: playerData.xpToNext,
    gold: playerData.gold,
    streak: playerData.streak,
    title: playerData.title,
    stats: playerData.stats,
    facilities: playerData.facilities,
  } : undefined;

  return (
    <main className="relative w-full h-screen">
      <GameCanvas
        playerData={canvasPlayerData}
        assignments={assignments}
        onFacilityInteract={handleFacilityInteract}
        onFacilityAction={handleFacilityAction}
        onBattleEnd={handleBattleEnd}
        className="w-full h-screen"
      />

      {/* オーバーレイUI: ゲーム外のナビゲーション */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between p-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <a
            href="/dashboard"
            className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-white/20 text-sm font-medium transition-colors"
          >
            ← ダッシュボード
          </a>
          <button
            onClick={() => router.push('/inventory')}
            className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-white/20 text-sm font-medium transition-colors"
          >
            🎒 バックパック
          </button>
          <button
            onClick={() => router.push('/shop')}
            className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-white/20 text-sm font-medium transition-colors"
          >
            🏪 ショップ
          </button>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-white/70 text-sm font-mono">
            Questra v0.1
          </span>
        </div>
      </div>
    </main>
  );
}
