'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Monster } from '@/lib/game/types';

interface MonsterCardProps {
  monster: Monster;
  onClick?: () => void;
}

const DIFFICULTY_LABELS = {
  1: '初級',
  2: '中級',
  3: '上級',
} as const;

export function MonsterCard({ monster, onClick }: MonsterCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${onClick ? 'active:scale-[0.98]' : ''}`}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-3 p-3">
        <div className="text-2xl">{monster.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${monster.color}`}>{monster.name}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {DIFFICULTY_LABELS[monster.difficulty]}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{monster.stars}</div>
        </div>
      </CardContent>
    </Card>
  );
}
