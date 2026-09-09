'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePrototypeContext } from '../PrototypeProvider';
import { MONSTERS, MONSTER_NAMES } from '@/lib/prototype/screens';
import { motion, AnimatePresence } from 'framer-motion';

interface BattleScreenProps {
  onStartBattle?: (monsterId: string) => void;
}

export function BattleScreen({ onStartBattle }: BattleScreenProps) {
  const { navigate, currentScreen, battleData } = usePrototypeContext();
  const [battlePhase, setBattlePhase] = useState<'idle' | 'player-turn' | 'enemy-turn' | 'victory' | 'defeat' | 'fled'>('idle');
  const [playerHP, setPlayerHP] = useState(100);
  const [maxPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);
  const [maxEnemyHP, setMaxEnemyHP] = useState(100);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<'attack' | 'skill' | 'item' | 'flee'>('attack');
  const [damageNumbers, setDamageNumbers] = useState<Array<{id: number, value: number, x: number, y: number, type: 'player' | 'enemy', critical?: boolean, life: number}>>([]);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string, size: number, life: number}>>([]);
  const [levelUp, setLevelUp] = useState(false);
  const animationIdRef = useRef<number | null>(null);
  const damageIdRef = useRef(0);
  const particleIdRef = useRef(0);

  // battleData.monster.id を使用
  const monsterId = battleData?.monster?.id || 'golem';
  const currentMonster = MONSTERS[monsterId] || MONSTERS.golem;

  // バトル開始時の初期化
  useEffect(() => {
    if (currentScreen === 'battle' && battleData?.monster?.id) {
      const monster = MONSTERS[battleData.monster.id];
      setMaxEnemyHP(monster.baseHP || 80);
      setEnemyHP(monster.baseHP || 80);
      setPlayerHP(100);
      setBattlePhase('player-turn');
      setLogMessages([`${MONSTER_NAMES[battleData.monster.id]} が現れた！`]);
      setSelectedCommand('attack');
    }
  }, [currentScreen, battleData]);

  // パーティクル・ダメージ数字アニメーションループ
  useEffect(() => {
    const animate = () => {
      setDamageNumbers(prev => prev.map(d => ({...d, y: d.y - 1, life: d.life - 1})).filter(d => d.life > 0));
      setParticles(prev => prev.map(p => ({...p, life: p.life - 1, size: p.size * 0.98})).filter(p => p.life > 0 && p.size > 0.5));
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationIdRef.current!);
  }, []);

  const addLog = useCallback((message: string) => {
    setLogMessages(prev => [...prev.slice(-4), message]);
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles = Array.from({length: count}, () => ({
      id: particleIdRef.current++,
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      color,
      size: 4 + Math.random() * 6,
      life: 60
    }));
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const showDamage = useCallback((value: number, target: 'player' | 'enemy', critical: boolean = false) => {
    const baseX = target === 'enemy' ? 650 : 200;
    const baseY = target === 'enemy' ? 200 : 400;
    setDamageNumbers(prev => [...prev, {
      id: damageIdRef.current++,
      value,
      x: baseX + (Math.random() - 0.5) * 60,
      y: baseY + (Math.random() - 0.5) * 30,
      type: target,
      critical,
      life: 60
    }]);
    spawnParticles(baseX, baseY, critical ? '#F59E0B' : (target === 'enemy' ? '#EF4444' : '#3B82F6'), critical ? 15 : 8);
  }, [spawnParticles]);

  const executeAttack = useCallback(() => {
    if (battlePhase !== 'player-turn') return;
    
    const playerDamage = 15 + Math.floor(Math.random() * 10);
    const isCritical = Math.random() < 0.15;
    const finalDamage = isCritical ? playerDamage * 2 : playerDamage;
    
    setEnemyHP(prev => Math.max(0, prev - finalDamage));
    showDamage(finalDamage, 'enemy', isCritical);
    addLog(`${MONSTER_NAMES[monsterId]} に ${finalDamage} のダメージ！${isCritical ? ' 会心の一撃！' : ''}`);
    
    if (enemyHP - finalDamage <= 0) {
      setTimeout(() => {
        setBattlePhase('victory');
        addLog(`${MONSTER_NAMES[monsterId]} を倒した！`);
        setTimeout(() => {
          navigate('reward', { 
            monsterId: monsterId,
            xpGained: 50 + Math.floor(Math.random() * 30),
            goldGained: 20 + Math.floor(Math.random() * 20),
            items: [{id: 'xp_book', name: '経験値の書', rarity: 'normal', effect: 'XP+50', emoji: '📖'}],
            levelUp: Math.random() < 0.3
          });
        }, 1500);
      }, 800);
      return;
    }
    
    setBattlePhase('enemy-turn');
    addLog('敵のターン...');
    
    setTimeout(() => {
      const enemyDamage = 8 + Math.floor(Math.random() * 8);
      const enemyCritical = Math.random() < 0.1;
      const finalEnemyDamage = enemyCritical ? Math.floor(enemyDamage * 1.5) : enemyDamage;
      
      setPlayerHP(prev => Math.max(0, prev - finalEnemyDamage));
      showDamage(finalEnemyDamage, 'player', enemyCritical);
      addLog(`${MONSTER_NAMES[monsterId]} の攻撃！ ${finalEnemyDamage} のダメージ！${enemyCritical ? ' 痛恨の一撃！' : ''}`);
      
      if (playerHP - finalEnemyDamage <= 0) {
        setTimeout(() => {
          setBattlePhase('defeat');
          addLog('倒れてしまった...');
        }, 800);
        return;
      }
      
      setBattlePhase('player-turn');
    }, 1000);
  }, [battlePhase, monsterId, enemyHP, playerHP, showDamage, addLog, navigate]);

  const executeSkill = useCallback(() => {
    if (battlePhase !== 'player-turn') return;
    const skillDamage = 25 + Math.floor(Math.random() * 15);
    const isCritical = Math.random() < 0.25;
    const finalDamage = isCritical ? skillDamage * 2 : skillDamage;
    
    setEnemyHP(prev => Math.max(0, prev - finalDamage));
    showDamage(finalDamage, 'enemy', isCritical);
    addLog(`スキル「魔法の矢」！ ${finalDamage} のダメージ！${isCritical ? ' 会心！' : ''}`);
    
    if (enemyHP - finalDamage <= 0) return;
    
    setBattlePhase('enemy-turn');
    setTimeout(() => {
      const enemyDamage = 8 + Math.floor(Math.random() * 8);
      setPlayerHP(prev => Math.max(0, prev - enemyDamage));
      showDamage(enemyDamage, 'player');
      addLog(`${MONSTER_NAMES[monsterId]} の反撃！ ${enemyDamage} のダメージ！`);
      setBattlePhase('player-turn');
    }, 800);
  }, [battlePhase, monsterId, enemyHP, showDamage, addLog]);

  const executeItem = useCallback(() => {
    if (battlePhase !== 'player-turn') return;
    const healAmount = 30;
    setPlayerHP(prev => Math.min(maxPlayerHP, prev + healAmount));
    addLog(`アイテム「ポーション」を使った！ HPが ${healAmount} 回復した！`);
    showDamage(-healAmount, 'player');
    
    setBattlePhase('enemy-turn');
    setTimeout(() => {
      const enemyDamage = 8 + Math.floor(Math.random() * 8);
      setPlayerHP(prev => Math.max(0, prev - enemyDamage));
      showDamage(enemyDamage, 'player');
      addLog(`${MONSTER_NAMES[monsterId]} の反撃！ ${enemyDamage} のダメージ！`);
      setBattlePhase('player-turn');
    }, 800);
  }, [battlePhase, monsterId, maxPlayerHP, showDamage, addLog]);

  const executeFlee = useCallback(() => {
    if (battlePhase !== 'player-turn') return;
    const success = Math.random() < 0.7;
    if (success) {
      addLog('うまく逃げ切った！');
      setBattlePhase('fled');
      setTimeout(() => navigate('world'), 1000);
    } else {
      addLog('逃げられない！');
      setBattlePhase('enemy-turn');
      setTimeout(() => {
        const enemyDamage = 8 + Math.floor(Math.random() * 8);
        setPlayerHP(prev => Math.max(0, prev - enemyDamage));
        showDamage(enemyDamage, 'player');
        addLog(`${MONSTER_NAMES[monsterId]} の攻撃！ ${enemyDamage} のダメージ！`);
        setBattlePhase('player-turn');
      }, 800);
    }
  }, [battlePhase, monsterId, showDamage, addLog, navigate]);

  const handleCommand = useCallback(() => {
    switch (selectedCommand) {
      case 'attack': executeAttack(); break;
      case 'skill': executeSkill(); break;
      case 'item': executeItem(); break;
      case 'flee': executeFlee(); break;
    }
  }, [selectedCommand, executeAttack, executeSkill, executeItem, executeFlee]);

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentScreen !== 'battle' || battlePhase !== 'player-turn') return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          setSelectedCommand(prev => prev === 'attack' ? 'flee' : 
            prev === 'skill' ? 'attack' : 
            prev === 'item' ? 'skill' : 'item');
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          setSelectedCommand(prev => prev === 'attack' ? 'skill' : 
            prev === 'skill' ? 'item' : 
            prev === 'item' ? 'flee' : 'attack');
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleCommand();
          break;
        case 'Escape':
          if (battlePhase === 'player-turn') executeFlee();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, battlePhase, handleCommand]);

  if (currentScreen !== 'battle') return null;

  return (
    <div className="prototype-screen battle-screen" style={{ background: 'var(--bg-battle)' }}>
      {/* 背景エフェクト */}
      <div className="battle-bg-particles">
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0 }}
            transition={{ duration: p.life / 60, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 10
            }}
          />
        ))}
      </div>

      {/* ダメージ数字 */}
      <div className="damage-numbers" style={{ pointerEvents: 'none', zIndex: 20 }}>
        {damageNumbers.map(d => (
          <motion.div
            key={d.id}
            initial={{ opacity: 1, y: 0, scale: d.critical ? 1.5 : 1 }}
            animate={{ opacity: 0, y: -60, scale: d.critical ? 1 : 0.8 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${d.x}px`,
              top: `${d.y}px`,
              color: d.critical ? '#F59E0B' : (d.type === 'enemy' ? '#EF4444' : '#3B82F6'),
              fontSize: d.critical ? '1.8rem' : '1.4rem',
              fontWeight: 'bold',
              fontFamily: 'var(--font-mono)',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              pointerEvents: 'none',
              transformOrigin: 'center'
            }}
          >
            {d.value > 0 ? d.value : `+${Math.abs(d.value)}`}
          </motion.div>
        ))}
      </div>

      <div className="battle-container">
        {/* 上部: モンスター情報 */}
        <div className="enemy-info">
          <div className="enemy-name-badge">
            <span className={`rarity-badge rarity-${currentMonster.rarity}`}>
              {currentMonster.rarity === 'legendary' && '⭐ '}
              {MONSTER_NAMES[monsterId]}
            </span>
            <span className="monster-type">{currentMonster.type}</span>
          </div>
          <div className="hp-bar-container">
            <div className="hp-bar-label">HP</div>
            <div className="hp-bar">
              <motion.div
                className="hp-bar-fill"
                initial={{ width: '100%' }}
                animate={{ width: `${(enemyHP / maxEnemyHP) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ background: enemyHP / maxEnemyHP > 0.3 ? 'linear-gradient(90deg, #EF4444, #F97316)' : 'linear-gradient(90deg, #F97316, #EF4444)' }}
              />
            </div>
            <span className="hp-text">{enemyHP} / {maxEnemyHP}</span>
          </div>
        </div>

        {/* 中央: バトルフィールド */}
        <div className="battle-field">
          {/* プレイヤー（左） */}
          <div className="battle-entity player-side">
            <div className="entity-sprite player-sprite" style={{ background: 'linear-gradient(135deg, #6B46C1, #8B5CF6)' }}>
              🧙
            </div>
            <div className="entity-name">見習い賢者</div>
            <div className="hp-bar-container small">
              <div className="hp-bar">
                <motion.div
                  className="hp-bar-fill"
                  animate={{ width: `${(playerHP / maxPlayerHP) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  style={{ background: playerHP / maxPlayerHP > 0.3 ? 'linear-gradient(90deg, #3B82F6, #6B46C1)' : 'linear-gradient(90deg, #EF4444, #F97316)' }}
                />
              </div>
              <span className="hp-text">{playerHP} / {maxPlayerHP}</span>
            </div>
          </div>

          {/* VS マーカー */}
          <div className="vs-marker">
            <span className="vs-text">VS</span>
          </div>

          {/* モンスター（右） */}
          <div className="battle-entity enemy-side">
            <div className={`entity-sprite monster-sprite rarity-${currentMonster.rarity}`} style={{ background: `linear-gradient(135deg, ${currentMonster.color}, ${currentMonster.color}dd)` }}>
              {currentMonster.emoji}
            </div>
            <div className="entity-name">{MONSTER_NAMES[monsterId]}</div>
          </div>
        </div>

        {/* 下部: コマンドメニュー / ログ */}
        <div className="battle-ui">
          {battlePhase === 'player-turn' && (
            <>
              {/* コマンド選択 */}
              <div className="command-menu">
                <div className="command-grid">
                  {[
                    { id: 'attack', label: '⚔️ こうげき', desc: '通常攻撃', shortcut: '1' },
                    { id: 'skill', label: '✨ スキル', desc: '魔法の矢 (MP)', shortcut: '2' },
                    { id: 'item', label: '🎁 アイテム', desc: 'ポーション', shortcut: '3' },
                    { id: 'flee', label: '🏃 にげる', desc: '戦闘から逃走', shortcut: '4' },
                  ].map(cmd => (
                    <motion.button
                      key={cmd.id}
                      className={`cmd-btn ${selectedCommand === cmd.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCommand(cmd.id as any)}
                      onMouseEnter={() => setSelectedCommand(cmd.id as any)}
                      disabled={battlePhase !== 'player-turn'}
                      whileTap={{ scale: 0.98 }}
                      style={{ background: selectedCommand === cmd.id ? 'var(--accent-primary)' : 'var(--bg-card)' }}
                    >
                      <div className="cmd-main">
                        <span className="cmd-label">{cmd.label}</span>
                        <span className="cmd-shortcut">{cmd.shortcut}</span>
                      </div>
                      <div className="cmd-desc">{cmd.desc}</div>
                    </motion.button>
                  ))}
                </div>
                <div className="command-hint">
                  矢印キーで選択 / Enterで実行
                </div>
              </div>
            </>
          )}

          {battlePhase !== 'player-turn' && (
            <div className="battle-message">
              <AnimatePresence mode="wait">
                <motion.p
                  key={logMessages[logMessages.length - 1]}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="log-message"
                >
                  {logMessages[logMessages.length - 1]}
                </motion.p>
              </AnimatePresence>
              <div className="log-history">
                {logMessages.slice(-4, -1).map((msg, i) => (
                  <p key={i} className="log-history-item">{msg}</p>
                ))}
              </div>
            </div>
          )}

          {(battlePhase === 'victory' || battlePhase === 'defeat' || battlePhase === 'fled') && (
            <div className="battle-result">
              <motion.h2
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={battlePhase === 'victory' ? 'victory-text' : 'defeat-text'}
              >
                {battlePhase === 'victory' ? '勝利！' : battlePhase === 'defeat' ? '敗北...' : '逃走成功'}
              </motion.h2>
            </div>
          )}
        </div>
      </div>

      {/* レベルアップオーバーレイ */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="levelup-overlay"
            onClick={() => setLevelUp(false)}
          >
            <div className="levelup-content">
              <motion.div animate={{ rotate: [0, -5, 5, 0] }} className="levelup-icon">⬆️</motion.div>
              <h2 className="levelup-title">レベルアップ！</h2>
              <p className="levelup-detail">新しい称号とステータスを獲得した！</p>
              <button onClick={() => setLevelUp(false)} className="levelup-close">閉じる</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* デバッグ用画面切替ボタン（スクショ用） */}
      <div className="debug-nav" style={{ zIndex: 100 }}>
        <button onClick={() => navigate('title')} className="debug-btn">📋 タイトル</button>
        <button onClick={() => navigate('world')} className="debug-btn">🗺️ ワールド</button>
        <button onClick={() => navigate('battle', {monster: {id: 'golem'}})} className="debug-btn active">⚔️ バトル</button>
        <button onClick={() => navigate('reward', {xpGained: 80, goldGained: 40, items: [], levelUp: true})} className="debug-btn">🎁 報酬</button>
      </div>
    </div>
  );
}
