'use client';

import { Card, CardContent } from '@/components/ui/card';
import { XpBar } from './XpBar';
import { GoldCounter } from './GoldCounter';
import { StreakFire } from './StreakFire';
import { Shield } from 'lucide-react';
import type { PlayerState } from '@/lib/game/types';

interface PlayerCardProps {
  player: PlayerState;
}

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <Card className="border-amber-500/20">
      <CardContent className="p-4 space-y-3">
        {/* Header: Title + Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-muted-foreground">{player.title}</span>
          </div>
        </div>

        {/* XP Bar */}
        <XpBar
          xp={player.xp}
          xpToNext={player.xpToNext}
          level={player.level}
          percent={Math.floor((player.xp % player.xpToNext) / player.xpToNext * 100)}
        />

        {/* Gold + Streak */}
        <div className="flex items-center justify-between">
          <GoldCounter gold={player.gold} />
          <StreakFire streak={player.streak} />
        </div>

        {/* Subject Stats */}
        <div className="grid grid-cols-6 gap-1 text-center">
          {[
            { label: 'INT', value: player.stats.int, color: 'text-red-400' },
            { label: 'WIS', value: player.stats.wis, color: 'text-blue-400' },
            { label: 'STR', value: player.stats.str, color: 'text-orange-400' },
            { label: 'END', value: player.stats.end, color: 'text-green-400' },
            { label: 'CRE', value: player.stats.cre, color: 'text-pink-400' },
            { label: 'SOC', value: player.stats.soc, color: 'text-yellow-400' },
          ].map(stat => (
            <div key={stat.label} className="space-y-0.5">
              <div className={`text-[10px] font-medium ${stat.color}`}>{stat.label}</div>
              <div className="text-xs font-bold">{stat.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
