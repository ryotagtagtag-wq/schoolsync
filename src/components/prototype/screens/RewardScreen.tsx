'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePrototypeContext } from '../PrototypeProvider';
import { motion, AnimatePresence } from 'framer-motion';

interface RewardItem {
  id: string;
  name: string;
  rarity: 'normal' | 'rare' | 'epic' | 'legendary';
  effect: string;
  emoji: string;
}

interface RewardScreenProps {
  rewardData?: {
    xpGained: number;
    goldGained: number;
    items: RewardItem[];
    levelUp: boolean;
    monsterId?: string;
  };
}

const RARITY_STYLES: Record<string, {color: string, bg: string, border: string, glow: string}> = {
  normal: {color: '#9CA3AF', bg: '#F3F4F6', border: '#D1D5DB', glow: 'rgba(156,163,175,0.4)'},
  rare: {color: '#3B82F6', bg: '#DBEAFE', border: '#93C5FD', glow: 'rgba(59,130,246,0.4)'},
  epic: {color: '#8B5CF6', bg: '#EDE9FE', border: '#C4B5FD', glow: 'rgba(139,92,246,0.4)'},
  legendary: {color: '#F59E0B', bg: '#FEF3C7', border: '#FCD34D', glow: 'rgba(245,158,11,0.6)'}
};

const ITEM_EMOJIS: Record<string, string> = {
  xp_book: '📖',
  gold_apple: '🍎',
  sage_staff: '🪄',
  arcadia_star: '⭐',
  potion: '🧪',
  streak_shield: '🛡️'
};

export function RewardScreen({ rewardData }: RewardScreenProps) {
  const { navigate, currentScreen } = usePrototypeContext();
  const [displayXP, setDisplayXP] = useState(0);
  const [displayGold, setDisplayGold] = useState(0);
  const [showItems, setShowItems] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [newLevel, setNewLevel] = useState(1);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string, size: number, life: number, velocityX: number, velocityY: number}>>([]);
  const [floatingCoins, setFloatingCoins] = useState<Array<{id: number, x: number, y: number, rotation: number, scale: number, delay: number}>>([]);
  const particleIdRef = useRef(0);
  const animationIdRef = useRef<number | null>(null);
  const xpGainRef = useRef(0);
  const goldGainRef = useRef(0);

  const xpGained = rewardData?.xpGained || 50;
  const goldGained = rewardData?.goldGained || 20;
  const items = rewardData?.items || [
    {id: 'xp_book', name: '経験値の書', rarity: 'normal' as const, effect: '経験値+50', emoji: '📖'}
  ];
  const levelUp = rewardData?.levelUp || false;

  // パーティクルアニメーションループ
  useEffect(() => {
    const animate = () => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.velocityX,
        y: p.y + p.velocityY,
        velocityY: p.velocityY + 0.05, // 重力
        life: p.life - 1,
        size: p.size * 0.99
      })).filter(p => p.life > 0 && p.size > 0.3));
      
      setFloatingCoins(prev => prev.map(c => ({
        ...c,
        y: c.y - 0.5,
        rotation: c.rotation + 2,
        scale: c.scale * 0.995
      })).filter(c => c.scale > 0.1));
      
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current); };
  }, []);

  const spawnRewardParticles = useCallback((centerX: number, centerY: number, color: string, count: number = 20) => {
    const newParticles = Array.from({length: count}, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      return {
        id: particleIdRef.current++,
        x: centerX,
        y: centerY,
        color,
        size: 3 + Math.random() * 5,
        life: 60 + Math.random() * 40,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed - 2
      };
    });
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const spawnCoins = useCallback((centerX: number, centerY: number, count: number = 15) => {
    const newCoins = Array.from({length: count}, (_, i) => ({
      id: particleIdRef.current++,
      x: centerX + (Math.random() - 0.5) * 200,
      y: centerY + 50,
      rotation: Math.random() * 360,
      scale: 0.8 + Math.random() * 0.4,
      delay: i * 50
    }));
    setFloatingCoins(prev => [...prev, ...newCoins]);
  }, []);

  // カウントアップアニメーション
  useEffect(() => {
    let xpCurrent = 0;
    let goldCurrent = 0;
    const duration = 1500;
    const fps = 60;
    const totalFrames = duration / 1000 * fps;
    const xpPerFrame = xpGained / totalFrames;
    const goldPerFrame = goldGained / totalFrames;

    const animate = () => {
      xpCurrent += xpPerFrame;
      goldCurrent += goldPerFrame;
      
      if (xpCurrent < xpGained) {
        setDisplayXP(Math.floor(xpCurrent));
      } else {
        setDisplayXP(xpGained);
      }
      
      if (goldCurrent < goldGained) {
        setDisplayGold(Math.floor(goldCurrent));
      } else {
        setDisplayGold(goldGained);
      }
      
      if (xpCurrent < xpGained || goldCurrent < goldGained) {
        requestAnimationFrame(animate);
      } else {
        setDisplayXP(xpGained);
        setDisplayGold(goldGained);
        // コインパーティクル発生
        spawnCoins(window.innerWidth / 2, window.innerHeight / 2 - 100);
        // アイテム表示開始
        setTimeout(() => setShowItems(true), 300);
        // レベルアップ演出
        if (levelUp) {
          setTimeout(() => {
            setShowLevelUp(true);
            spawnRewardParticles(window.innerWidth / 2, window.innerHeight / 2 - 50, '#F59E0B', 30);
          }, 800);
        }
      }
    };
    animate();
  }, [xpGained, goldGained, levelUp, spawnCoins, spawnRewardParticles]);

  // 画面遷移時のリセット
  useEffect(() => {
    if (currentScreen === 'reward') {
      setDisplayXP(0);
      setDisplayGold(0);
      setShowItems(false);
      setShowLevelUp(false);
      setParticles([]);
      setFloatingCoins([]);
    }
  }, [currentScreen]);

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentScreen !== 'reward') return;
      if (e.key === 'Enter' || e.key === ' ') {
        if (showLevelUp) {
          setShowLevelUp(false);
          setTimeout(() => navigate('world'), 300);
        } else if (showItems) {
          setTimeout(() => navigate('world'), 300);
        }
      }
      if (e.key === 'Escape') {
        navigate('world');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, showLevelUp, showItems, navigate]);

  if (currentScreen !== 'reward') return null;

  return (
    <div className="prototype-screen reward-screen" style={{ background: 'var(--bg-reward)' }}>
      {/* 背景パーティクル */}
      <div className="reward-bg-particles" style={{ pointerEvents: 'none', zIndex: 1 }}>
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
              zIndex: 2
            }}
          />
        ))}
        {floatingCoins.map(c => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: c.scale }}
            transition={{ duration: 2, delay: c.delay / 1000, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${c.x}px`,
              top: `${c.y}px`,
              transform: `rotate(${c.rotation}deg)`,
              fontSize: `${24 * c.scale}px`,
              pointerEvents: 'none',
              zIndex: 2,
              filter: 'drop-shadow(0 2px 4px rgba(245,158,11,0.4))'
            }}
          >
            💰
          </motion.div>
        ))}
      </div>

      <div className="reward-container">
        {/* 勝利テキスト */}
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="victory-header"
        >
          <div className="victory-icon">🏆</div>
          <h1 className="victory-title">勝利！</h1>
          <p className="victory-subtitle">モンスターを討伐した！</p>
        </motion.div>

        {/* 経験値・ゴールド獲得表示 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
          className="rewards-main"
        >
          {/* XPバー */}
          <div className="reward-card xp-card">
            <div className="reward-icon xp-icon">✨</div>
            <div className="reward-label">獲得経験値</div>
            <motion.div className="reward-value xp-value">
              <span className="xp-number">{displayXP.toLocaleString()}</span>
              <span className="xp-unit">XP</span>
            </motion.div>
            <div className="xp-bar-container">
              <div className="xp-bar">
                <motion.div
                  className="xp-bar-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min((displayXP % 1000) / 10, 100)}%` }}
                  transition={{ duration: 1, delay: 1, ease: 'easeOut' }}
                  style={{ background: 'linear-gradient(90deg, #6B46C1, #8B5CF6)' }}
                />
              </div>
              <span className="xp-next">次のレベルまで: {1000 - (displayXP % 1000)} XP</span>
            </div>
          </div>

          {/* ゴールド */}
          <div className="reward-card gold-card">
            <div className="reward-icon gold-icon">💰</div>
            <div className="reward-label">獲得ゴールド</div>
            <motion.div className="reward-value gold-value">
              <span className="gold-number">{displayGold.toLocaleString()}</span>
              <span className="gold-unit">G</span>
            </motion.div>
            <div className="gold-effect">所持ゴールドに加算されました</div>
          </div>
        </motion.div>

        {/* アイテムドロップ */}
        <AnimatePresence>
          {showItems && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="items-section"
            >
              <h2 className="section-title">
                <span className="title-icon">🎁</span>
                アイテムを獲得！
              </h2>
              <div className="items-grid">
                {items.map((item, index) => {
                  const style = RARITY_STYLES[item.rarity];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.5, y: 50 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index, ease: 'easeOut' }}
                      className="item-card"
                      style={{
                        borderColor: style.border,
                        background: style.bg,
                        boxShadow: `0 0 20px ${style.glow}`
                      }}
                      whileHover={{ scale: 1.02, y: -4 }}
                    >
                      <div className={`rarity-badge ${item.rarity}`}>{item.rarity.toUpperCase()}</div>
                      <div className="item-emoji" style={{fontSize: '3rem'}}>{item.emoji || ITEM_EMOJIS[item.id] || '📦'}</div>
                      <h3 className="item-name" style={{color: style.color}}>{item.name}</h3>
                      <p className="item-effect">{item.effect}</p>
                      <div className="item-rarity-indicator">
                        {item.rarity === 'legendary' && '✨ 伝説のアイテム！ ✨'}
                        {item.rarity === 'epic' && '⭐ エピックアイテム！'}
                        {item.rarity === 'rare' && '💎 レアアイテム！'}
                        {item.rarity === 'normal' && '📦 アイテムゲット'}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* レベルアップ演出 */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              className="levelup-modal-overlay"
              onClick={() => setShowLevelUp(false)}
            >
              <motion.div
                className="levelup-modal"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="levelup-particles">
                  {Array.from({length: 12}).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        x: [0, (Math.random()-0.5)*200], 
                        y: [0, (Math.random()-0.5)*200],
                        opacity: [1, 0],
                        scale: [1, 0]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                      className="levelup-particle"
                      style={{ background: i % 2 === 0 ? '#F59E0B' : '#6B46C1' }}
                    />
                  ))}
                </div>
                <motion.div
                  animate={{ rotate: [0, -3, 3, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="levelup-icon"
                >
                  ⬆️
                </motion.div>
                <h2 className="levelup-title">レベルアップ！</h2>
                <div className="levelup-level-display">
                  <span className="old-level">Lv.{currentLevel}</span>
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="arrow"
                  >
                    →
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="new-level"
                  >
                    Lv.{newLevel || currentLevel + 1}
                  </motion.span>
                </div>
                <p className="levelup-message">
                  称号: <span className="new-title">{(newLevel || currentLevel + 1) >= 5 ? '賢者' : (newLevel || currentLevel + 1) >= 10 ? '大賢者' : '見習い賢者'}</span>
                </p>
                <div className="levelup-stats">
                  <div className="stat-up">🧠 知力 +2</div>
                  <div className="stat-up">💭 精神 +1</div>
                  <div className="stat-up">💪 体力 +1</div>
                  <div className="stat-up">✨ 全ステータス微増</div>
                </div>
                <button onClick={() => setShowLevelUp(false)} className="levelup-continue">
                  街に戻る
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 続行ボタン（レベルアップなしの場合） */}
        {!levelUp && showItems && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            onClick={() => navigate('world')}
            className="continue-btn"
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
          >
            街に戻る
          </motion.button>
        )}
      </div>

      {/* デバッグ用画面切替ボタン */}
      <div className="debug-nav" style={{ zIndex: 100 }}>
        <button onClick={() => navigate('title')} className="debug-btn">📋 タイトル</button>
        <button onClick={() => navigate('world')} className="debug-btn">🗺️ ワールド</button>
        <button onClick={() => navigate('battle', {monsterId: 'golem'})} className="debug-btn">⚔️ バトル</button>
        <button onClick={() => navigate('reward', {xpGained: 80, goldGained: 40, items: [{id:'arcadia_star', name:'アルカディアの星', rarity:'legendary', effect:'全ステータス+10', emoji:'⭐'}], levelUp: true})} className="debug-btn active">🎁 報酬</button>
      </div>
    </div>
  );
}
