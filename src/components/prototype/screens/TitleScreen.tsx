'use client';

import { useEffect, useState } from 'react';

interface TitleScreenProps {
  onStart: () => void;
  onContinue: () => void;
  onSettings: () => void;
}

interface Particle {
  width: number;
  height: number;
  left: number;
  top: number;
  animationDelay: number;
  animationDuration: number;
}

export function TitleScreen({ onStart, onContinue, onSettings }: TitleScreenProps) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setVisible(true); 
    setMounted(true);
    
    // クライアントサイドでのみパーティクル生成
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        width: Math.random() * 8 + 4,
        height: Math.random() * 8 + 4,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 5,
        animationDuration: Math.random() * 10 + 10
      });
    }
    setParticles(newParticles);
  }, []);

  // サーバー側では空の配列を返し、ハイドレーション後にクライアントで生成
  const displayParticles = mounted ? particles : Array.from({length: 20}, (_, i) => ({
    width: 6,
    height: 6,
    left: (i * 5) % 100,
    top: (i * 7) % 100,
    animationDelay: i * 0.25,
    animationDuration: 15
  }));

  return (
    <div className="prototype-screen prototype-animate-fade-in" role="main" aria-label="タイトル画面">
      <div className="prototype-screen__bg" aria-hidden="true" />
      
      <main className="prototype-screen__content flex flex-col items-center justify-center px-4">
        <div 
          className="absolute inset-0 overflow-hidden pointer-events-none" 
          aria-hidden="true"
          suppressHydrationWarning
        >
          {displayParticles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-purple-500/30 animate-float"
              style={{
                width: `${p.width}px`,
                height: `${p.height}px`,
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.animationDelay}s`,
                animationDuration: `${p.animationDuration}s`
              }}
            />
          ))}
        </div>

        <div className="text-center space-y-6">
          <h1 className="prototype-animate-slide-up text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-yellow-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
            Questra
          </h1>
          <p className="prototype-animate-slide-up text-xl md:text-2xl text-purple-300 font-medium">
            〜見習い賢者の冒険録〜
          </p>
          <p className="prototype-animate-slide-up text-base md:text-lg text-gray-400 max-w-md mx-auto">
            学校の課題をRPGで楽しく管理しよう！<br />
            モンスターを倒して経験値とアイテムをゲット！
          </p>

          <div className="prototype-animate-slide-up flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              onClick={onStart}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-xl font-bold text-lg shadow-xl hover:from-purple-500 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 border-2 border-purple-400/50"
            >
              🚀 冒険を始める
            </button>
            <button
              onClick={onContinue}
              className="group px-8 py-4 bg-white/5 text-white rounded-xl font-bold text-lg border-2 border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-200"
            >
              📖 続きから遊ぶ
            </button>
          </div>

          <button
            onClick={onSettings}
            className="prototype-animate-fade-in text-gray-500 hover:text-gray-300 text-sm mt-6 transition-colors"
          >
            ⚙️ 設定
          </button>

          <p className="prototype-animate-fade-in text-xs text-gray-600 mt-8 font-mono">
            v0.1.0-prototype | Developed by game_ryo
          </p>
        </div>
      </main>
    </div>
  );
}
