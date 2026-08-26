'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowUp } from 'lucide-react';
import type { UserFacilityState } from '@/lib/game/types';

interface FacilityWithUnlock extends UserFacilityState {
  unlockLevel: number;
}

interface FacilityCardProps {
  facility: FacilityWithUnlock;
  playerLevel: number;
  onUpgrade?: (facilityId: string) => void;
}

export function FacilityCard({ facility, playerLevel, onUpgrade }: FacilityCardProps) {
  const isLocked = playerLevel < facility.unlockLevel;
  const isMaxLevel = facility.level >= facility.maxLevel;

  if (isLocked) {
    return (
      <Card className="opacity-50">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="text-2xl opacity-50">{facility.icon}</div>
          <div className="flex-1">
            <span className="text-sm font-medium text-muted-foreground">{facility.name}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Lv.{facility.unlockLevel}で解放</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="text-2xl">{facility.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{facility.name}</span>
            <span className="text-xs text-muted-foreground">Lv.{facility.level}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {facility.effectType === 'xp_bonus' && `XP +${facility.effectValue}%`}
            {facility.effectType === 'gold_bonus' && `Gold +${facility.effectValue}%`}
            {facility.effectType === 'streak_protect' && `${facility.level}日猶予`}
          </div>
        </div>
        {!isMaxLevel && onUpgrade && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpgrade(facility.facilityId)}
            className="shrink-0"
          >
            <ArrowUp className="h-3 w-3 mr-1" />
            {facility.upgradeCost}G
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
