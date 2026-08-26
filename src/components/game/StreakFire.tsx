'use client';

interface StreakFireProps {
  streak: number;
}

export function StreakFire({ streak }: StreakFireProps) {
  if (streak === 0) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-sm">🔥</span>
        <span className="text-sm">なし</span>
      </div>
    );
  }

  const fireIntensity = streak >= 30 ? 3 : streak >= 7 ? 2 : 1;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm" style={{ filter: `saturate(${0.5 + fireIntensity * 0.25})` }}>
        {'🔥'.repeat(fireIntensity)}
      </span>
      <span className="text-sm font-medium text-foreground">{streak}日</span>
    </div>
  );
}
