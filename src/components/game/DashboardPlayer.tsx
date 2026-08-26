'use client';

import { useEffect, useState } from 'react';
import { PlayerCard } from './PlayerCard';
import { LevelUpModal } from './LevelUpModal';
import type { PlayerState } from '@/lib/game/types';

export function DashboardPlayer() {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);

  useEffect(() => {
    let previousLevel = 0;

    async function fetchProfile() {
      try {
        const res = await fetch('/api/player/profile');
        if (res.ok) {
          const data = await res.json();
          setPlayer(data);

          // Check for level up
          if (previousLevel > 0 && data.level > previousLevel) {
            setNewLevel(data.level);
            setShowLevelUp(true);
          }
          previousLevel = data.level;
        }
      } catch (error) {
        console.error('Failed to fetch player profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 min-h-[100px]">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-2 bg-muted rounded-full w-full" />
        <div className="h-4 bg-muted rounded w-1/3" />
      </div>
    );
  }

  if (!player) return null;

  return (
    <>
      <PlayerCard player={player} />
      {showLevelUp && (
        <LevelUpModal newLevel={newLevel} onClose={() => setShowLevelUp(false)} />
      )}
    </>
  );
}
