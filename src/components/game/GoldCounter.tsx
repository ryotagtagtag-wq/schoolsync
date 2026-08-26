'use client';

import { Coins } from 'lucide-react';

interface GoldCounterProps {
  gold: number;
}

export function GoldCounter({ gold }: GoldCounterProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Coins className="h-4 w-4 text-yellow-500" />
      <span className="text-sm font-medium text-foreground">{gold.toLocaleString()}</span>
    </div>
  );
}
