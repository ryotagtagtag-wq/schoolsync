'use client';

import { useEffect, ReactNode } from 'react';

/**
 * 共通スタイル定義
 * 本番でもそのまま使えるCSS変数ベースのデザインシステム
 */

const prototypeStyles = `
:root {
  /* カラーパレット - Questraテーマ */
  --color-bg-primary: #0a0a12;
  --color-bg-secondary: #12121f;
  --color-bg-card: #1a1a2e;
  --color-bg-elevated: #22223a;
  
  --color-primary: #6B46C1;
  --color-primary-light: #8b5cf6;
  --color-primary-dark: #5533a8;
  --color-primary-glow: rgba(107, 70, 193, 0.4);
  
  --color-gold: #F59E0B;
  --color-gold-light: #fbbf24;
  --color-gold-dark: #d97706;
  --color-gold-glow: rgba(245, 158, 11, 0.4);
  
  --color-accent-blue: #3B82F6;
  --color-accent-green: #10B981;
  --color-accent-red: #EF4444;
  --color-accent-purple: #8B5CF6;
  --color-accent-pink: #EC4899;
  --color-accent-orange: #F97316;
  
  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #64748b;
  --color-text-on-primary: #ffffff;
  
  --color-border: #334155;
  --color-border-light: #475569;
  
  /* レアリティカラー */
  --rarity-normal: #9CA3AF;
  --rarity-rare: #3B82F6;
  --rarity-epic: #8B5CF6;
  --rarity-legendary: #F59E0B;
  
  /* スペーシング */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* タイポグラフィ */
  --font-base: 'Noto Sans JP', 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-display: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif;
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
  
  /* ボーダー */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* シャドウ */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px var(--color-primary-glow);
  --shadow-gold-glow: 0 0 20px var(--color-gold-glow);
  
  /* トランジション */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
  
  /* Z-index */
  --z-bg: 0;
  --z-content: 10;
  --z-overlay: 20;
  --z-modal: 30;
  --z-toast: 40;
  --z-nav: 50;
}

/* リセット・ベース */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-base);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* スクリーン共通レイアウト */
.prototype-screen {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.prototype-screen__bg {
  position: absolute;
  inset: 0;
  z-index: var(--z-bg);
  background: var(--color-bg-primary);
}

.prototype-screen__bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(ellipse at 20% 20%, rgba(107, 70, 193, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(245, 158, 11, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.prototype-screen__content {
  position: relative;
  z-index: var(--z-content);
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ボタン共通 */
.prototype-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  font-family: var(--font-base);
  font-size: var(--text-base);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  text-decoration: none;
  white-space: nowrap;
}

.prototype-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prototype-btn--primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-text-on-primary);
  box-shadow: var(--shadow-md), var(--shadow-glow);
}

.prototype-btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
  filter: brightness(1.1);
}

.prototype-btn--primary:active:not(:disabled) {
  transform: translateY(0);
}

.prototype-btn--secondary {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 2px solid var(--color-border);
}

.prototype-btn--secondary:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-bg-elevated);
}

.prototype-btn--gold {
  background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-dark) 100%);
  color: var(--color-bg-primary);
  box-shadow: var(--shadow-md), var(--shadow-gold-glow);
}

.prototype-btn--gold:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--shadow-gold-glow);
  filter: brightness(1.1);
}

.prototype-btn--large {
  padding: var(--space-lg) var(--space-2xl);
  font-size: var(--text-lg);
}

.prototype-btn--icon {
  padding: var(--space-md);
  border-radius: var(--radius-full);
}

.prototype-btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
}

.prototype-btn--ghost:hover:not(:disabled) {
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
}

/* カード共通 */
.prototype-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

.prototype-card:hover {
  border-color: var(--color-border-light);
  box-shadow: var(--shadow-lg);
}

.prototype-card--glow {
  box-shadow: var(--shadow-md), 0 0 30px var(--color-primary-glow);
}

/* バー共通 */
.prototype-bar {
  width: 100%;
  height: 12px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.prototype-bar__fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-slow) ease-out;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
}

.prototype-bar--gold .prototype-bar__fill {
  background: linear-gradient(90deg, var(--color-gold) 0%, var(--color-gold-light) 100%);
}

.prototype-bar--hp .prototype-bar__fill {
  background: linear-gradient(90deg, var(--color-accent-green) 0%, #34d399 100%);
}

.prototype-bar--hp-low .prototype-bar__fill {
  background: linear-gradient(90deg, var(--color-accent-red) 0%, #f87171 100%);
}

.prototype-bar__label {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 var(--space-sm);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-text-on-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

/* パネル共通 */
.prototype-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}

/* グリッド */
.prototype-grid {
  display: grid;
  gap: var(--space-md);
}

.prototype-grid--2 { grid-template-columns: repeat(2, 1fr); }
.prototype-grid--3 { grid-template-columns: repeat(3, 1fr); }
.prototype-grid--4 { grid-template-columns: repeat(4, 1fr); }
.prototype-grid--6 { grid-template-columns: repeat(6, 1fr); }

@media (max-width: 768px) {
  .prototype-grid--2,
  .prototype-grid--3,
  .prototype-grid--4,
  .prototype-grid--6 {
    grid-template-columns: 1fr;
  }
}

/* アニメーション */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.prototype-animate-fade-in { animation: fadeIn var(--transition-base) ease-out; }
.prototype-animate-slide-up { animation: slideUp var(--transition-slow) ease-out; }
.prototype-animate-slide-down { animation: slideDown var(--transition-slow) ease-out; }
.prototype-animate-pulse { animation: pulse 2s ease-in-out infinite; }
.prototype-animate-bounce { animation: bounce 2s ease-in-out infinite; }
.prototype-animate-float { animation: float 3s ease-in-out infinite; }

.prototype-animate-delay-1 { animation-delay: 100ms; }
.prototype-animate-delay-2 { animation-delay: 200ms; }
.prototype-animate-delay-3 { animation-delay: 300ms; }
.prototype-animate-delay-4 { animation-delay: 400ms; }
.prototype-animate-delay-5 { animation-delay: 500ms; }

/* スクロールバー */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--color-bg-secondary); }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: var(--radius-full); }
::-webkit-scrollbar-thumb:hover { background: var(--color-border-light); }

/* フォーカス */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ユーティリティ */
.prototype-text-gradient {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-gold) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.prototype-text-gold {
  background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.prototype-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;

/**
 * スタイルを注入して子要素をレンダリングするコンポーネント
 */
export function PrototypeStyles({ children }: { children: ReactNode }) {
  useEffect(() => {
    // クライアントサイドで一度だけスタイルを注入
    const styleId = 'prototype-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = prototypeStyles;
      document.head.appendChild(style);
    }
  }, []);

  return <>{children}</>;
}
