'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
}

export function LevelUpModal({ newLevel, onClose }: LevelUpModalProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <Card className="border-amber-500/50 shadow-2xl shadow-amber-500/20 animate-slide-in max-w-sm w-full mx-4">
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-6xl animate-bounce">🎉</div>
          <div>
            <h2 className="text-2xl font-bold text-amber-500">LEVEL UP!</h2>
            <p className="text-3xl font-bold mt-2">Lv.{newLevel}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            賢者の書に新しい一页が記された。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
