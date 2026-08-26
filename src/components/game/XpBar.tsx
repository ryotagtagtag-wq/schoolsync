'use client';

interface XpBarProps {
  xp: number;
  xpToNext: number;
  level: number;
  percent: number;
}

export function XpBar({ xp, xpToNext, level, percent }: XpBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Lv.{level}</span>
        <span className="text-muted-foreground">{xp} / {xpToNext} XP</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
