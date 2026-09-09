'use client';

import { useState, useEffect } from 'react';
import { FACILITIES, MONSTER_SPAWNS, MONSTERS, MONSTER_NAMES } from '@/lib/prototype/screens';

interface WorldScreenProps {
  onBattleStart: (monsterId: string) => void;
}

type FacilityType = typeof FACILITIES[0];
type MonsterSpawnType = typeof MONSTER_SPAWNS[0];

export function WorldScreen({ onBattleStart }: WorldScreenProps) {
  const [playerPos, setPlayerPos] = useState({ x: 400, y: 300 });
  const [targetPos, setTargetPos] = useState({ x: 400, y: 300 });
  const [showTooltip, setShowTooltip] = useState<{facility: FacilityType | null, monster: MonsterSpawnType | null}>({facility: null, monster: null});
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const [xp, setXp] = useState(1250);
  const [gold, setGold] = useState(850);
  const [level, setLevel] = useState(3);
  const [streak, setStreak] = useState(7);
  const [title] = useState('見習い賢者');

  const speed = 4;
  const maxX = 1200;
  const maxY = 600;

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed(prev => new Set(prev).add(e.key.toLowerCase()));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeysPressed(prev => { const next = new Set(prev); next.delete(e.key.toLowerCase()); return next; });
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  // 移動ループ
  useEffect(() => {
    const animate = () => {
      setPlayerPos(prev => {
        let { x, y } = prev;
        if (keysPressed.has('arrowup') || keysPressed.has('w')) y = Math.max(50, y - speed);
        if (keysPressed.has('arrowdown') || keysPressed.has('s')) y = Math.min(maxY - 50, y + speed);
        if (keysPressed.has('arrowleft') || keysPressed.has('a')) x = Math.max(50, x - speed);
        if (keysPressed.has('arrowright') || keysPressed.has('d')) x = Math.min(maxX - 50, x + speed);
        return { x, y };
      });
    };
    const id = setInterval(animate, 16);
    return () => clearInterval(id);
  }, [keysPressed]);

  // 施設・モンスターとの距離チェック
  useEffect(() => {
    const checkProximity = () => {
      let nearestFacility: FacilityType | null = null;
      let nearestMonster: MonsterSpawnType | null = null;
      let minFacilityDist = 80;
      let minMonsterDist = 60;

      FACILITIES.forEach((f: FacilityType) => {
        const dist = Math.hypot(playerPos.x - f.x, playerPos.y - f.y);
        if (dist < minFacilityDist) { minFacilityDist = dist; nearestFacility = f; }
      });

      MONSTER_SPAWNS.forEach((m: MonsterSpawnType) => {
        const dist = Math.hypot(playerPos.x - m.x, playerPos.y - m.y);
        if (dist < minMonsterDist) { minMonsterDist = dist; nearestMonster = m; }
      });

      setShowTooltip({ facility: nearestFacility, monster: nearestMonster });

      // 型アサーションしてから使用
      if (nearestMonster !== null && minMonsterDist < 30) {
        onBattleStart((nearestMonster as MonsterSpawnType).monsterId);
      }
    };
    const id = setInterval(checkProximity, 100);
    return () => clearInterval(id);
  }, [playerPos, onBattleStart]);

  // タッチ/クリック移動
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTargetPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // ミニマップクリック
  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = maxX / rect.width;
    const scaleY = maxY / rect.height;
    setTargetPos({ x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY });
  };

  const xpForLevel = (lvl: number) => Math.floor(100 * Math.pow(lvl, 1.5));
  const xpToNext = xpForLevel(level + 1) - xpForLevel(level);
  const xpInLevel = xp - xpForLevel(level);
  const xpPercent = Math.min(100, (xpInLevel / xpToNext) * 100);

  // ツールチップ用のモンスター取得
  const getTooltipMonster = () => {
    if (!showTooltip.monster) return null;
    return MONSTERS[showTooltip.monster.monsterId];
  };
  const tooltipMonster = getTooltipMonster();

  return (
    <div className="prototype-screen world-screen" onClick={handleClick} style={{ background: 'var(--bg-primary)' }}>
      {/* 背景グリッド */}
      <div className="world-grid" aria-hidden="true" />
      
      {/* 施設 */}
      {FACILITIES.map(facility => (
        <div
          key={facility.id}
          className={`facility-marker ${showTooltip.facility?.id === facility.id ? 'hovered' : ''}`}
          style={{ left: `${facility.x}px`, top: `${facility.y}px` }}
          onMouseEnter={() => setShowTooltip(prev => ({...prev, facility}))}
          onMouseLeave={() => setShowTooltip(prev => ({...prev, facility: null}))}
        >
          <div className="facility-icon" style={{ background: facility.color }}>{facility.emoji}</div>
          <div className="facility-name">{facility.name}</div>
        </div>
      ))}

      {/* モンスター */}
      {MONSTER_SPAWNS.map(spawn => {
        const monster = MONSTERS[spawn.monsterId];
        return (
          <div
            key={spawn.id}
            className={`monster-marker ${showTooltip.monster?.id === spawn.id ? 'hovered' : ''}`}
            style={{ left: `${spawn.x}px`, top: `${spawn.y}px` }}
            onMouseEnter={() => setShowTooltip(prev => ({...prev, monster: spawn}))}
            onMouseLeave={() => setShowTooltip(prev => ({...prev, monster: null}))}
          >
            <div className="monster-sprite" style={{ background: `linear-gradient(135deg, ${monster.color}, ${monster.color}dd)` }}>
              {monster.emoji}
            </div>
            <div className="monster-info">
              <span className="monster-name">{MONSTER_NAMES[spawn.monsterId]}</span>
              <span className={`monster-type type-${monster.rarity}`}>{monster.type} Lv.{spawn.level}</span>
            </div>
          </div>
        );
      })}

      {/* プレイヤー */}
      <div
        className="player-sprite"
        style={{ left: `${playerPos.x}px`, top: `${playerPos.y}px` }}
        aria-label="プレイヤー"
      >
        <div className="player-char">🧙</div>
        <div className="player-name">見習い賢者</div>
      </div>

      {/* UI: ステータスバー */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-label">LV</span>
          <span className="status-value">{level}</span>
        </div>
        <div className="status-item xp-bar-container">
          <span className="status-label">XP</span>
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
          </div>
          <span className="status-value">{xpInLevel.toLocaleString()} / {xpToNext.toLocaleString()}</span>
        </div>
        <div className="status-item">
          <span className="status-label">💰</span>
          <span className="status-value">{gold.toLocaleString()}</span>
        </div>
        <div className="status-item streak">
          <span className="status-label">🔥</span>
          <span className="status-value">{streak}日</span>
        </div>
        <div className="status-item title">
          <span className="status-value">{title}</span>
        </div>
      </div>

      {/* ツールチップ */}
      {(showTooltip.facility || showTooltip.monster) && (
        <div className="tooltip">
          {showTooltip.facility && (
            <div className="tooltip-facility">
              <div className="tooltip-icon" style={{ background: showTooltip.facility.color }}>{showTooltip.facility.emoji}</div>
              <div className="tooltip-text">
                <strong>{showTooltip.facility.name}</strong>
                <span>{showTooltip.facility.desc}</span>
              </div>
            </div>
          )}
          {showTooltip.monster && tooltipMonster && (
            <div className="tooltip-monster">
              <div className="tooltip-icon" style={{ background: `linear-gradient(135deg, ${tooltipMonster.color}, ${tooltipMonster.color}dd)` }}>{tooltipMonster.emoji}</div>
              <div className="tooltip-text">
                <strong>{MONSTER_NAMES[showTooltip.monster.monsterId]}</strong>
                <span>{tooltipMonster.type}・レアリティ: {tooltipMonster.rarity}</span>
                <span>HP: {tooltipMonster.baseHP} / 弱点: {tooltipMonster.weakness}</span>
                <span className="hint">接触でバトル開始！</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ミニマップ */}
      <div className="minimap" onClick={handleMiniMapClick} role="img" aria-label="ミニマップ">
        <div className="minimap-bg" />
        {FACILITIES.map(f => (
          <div key={f.id} className="minimap-facility" style={{ left: `${f.x / maxX * 100}%`, top: `${f.y / maxY * 100}%` }} title={f.name} />
        ))}
        {MONSTER_SPAWNS.map(m => (
          <div key={m.id} className="minimap-monster" style={{ left: `${m.x / maxX * 100}%`, top: `${m.y / maxY * 100}%` }} />
        ))}
        <div className="minimap-player" style={{ left: `${playerPos.x / maxX * 100}%`, top: `${playerPos.y / maxY * 100}%` }} />
      </div>

      {/* 操作ヒント */}
      <div className="controls-hint">
        <span>← → ↑ ↓ / WASD: 移動</span>
        <span>クリック: 目的地設定</span>
        <span>ミニマップクリック: 瞬間移動</span>
      </div>
    </div>
  );
}
