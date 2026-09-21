import React, { useEffect, useState } from 'react';
import { PlantInstance } from '../types';
import { getRandomLine, getTeacherType } from '../data/teacherLines';

interface MorningGreetingProps {
  plant: PlantInstance;
  onComplete: () => void;
  onEggFound?: (eggState: any) => void;
}

export const MorningGreeting: React.FC<MorningGreetingProps> = ({
  plant,
  onComplete,
  onEggFound,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [phase, setPhase] = useState<'greeting' | 'eggFound' | 'hatching' | 'dragonBorn' | 'nameInput'>('greeting');
  const [eggProgress, setEggProgress] = useState(0);
  const [dragonName, setDragonName] = useState('');

  const teacherType = getTeacherType(plant.plantTypeId);

useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let lastShown = null;
    try {
      lastShown = localStorage.getItem('morningGreetingLastShown');
    } catch (e) {
      console.warn('Unable to access localStorage for morning greeting:', e);
    }
    
    if (lastShown === today) {
      onComplete();
      return;
    }
    
    setShowModal(true);
    const greetingText = getRandomLine(teacherType, 'morning');
    setGreeting(greetingText);
    setPhase('greeting');
    
    // 卵発見判定（25%）
    if (Math.random() < 0.25 && (!plant.egg || !plant.egg.hasEgg)) {
      setTimeout(() => {
        setPhase('eggFound');
        const eggLine = getRandomLine(teacherType, 'eggFound');
        setGreeting(eggLine);
        onEggFound?.({ hasEgg: true, plantType: plant.plantTypeId });
      }, 2000);
    }
    
    try {
      localStorage.setItem('morningGreetingLastShown', today);
    } catch (e) {
      console.warn('Unable to save morning greeting timestamp to localStorage:', e);
    }
  }, [plant.plantTypeId, onComplete]);

  // 孵化プログレス自動進行
  useEffect(() => {
    if (phase !== 'hatching') return;
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        // 孵化完了
        setPhase('dragonBorn');
        const bornLine = getRandomLine(teacherType, 'dragonBorn');
        setGreeting(bornLine);
      } else {
        setEggProgress(progress);
        const hatchingLine = getRandomLine(teacherType, 'eggGrowing');
        setGreeting(hatchingLine);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [phase, teacherType]);

  const handleComplete = () => {
    if (phase === 'greeting') {
      const completeLine = getRandomLine(teacherType, 'afterComplete');
      setGreeting(completeLine);
      setTimeout(() => {
        setShowModal(false);
        onComplete();
      }, 1500);
    } else if (phase === 'eggFound') {
      // 孵化フェーズへ
      setPhase('hatching');
      setEggProgress(0);
      setGreeting(getRandomLine(teacherType, 'eggGrowing'));
    } else if (phase === 'dragonBorn') {
      // 名前入力フェーズへ
      setPhase('nameInput');
    } else if (phase === 'nameInput') {
      // 名前入力完了
      setShowModal(false);
      onComplete();
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dragonName.trim()) return;
    setPhase('dragonBorn');
    const greetingLine = getRandomLine(teacherType, 'dragonGreeting');
    setGreeting(`${dragonName}と名付けたよ！${greetingLine}`);
    setTimeout(() => {
      setShowModal(false);
      onComplete();
    }, 2000);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl p-6 m-4 max-w-sm animate-pop-in relative">
        {/* Close button (only for greeting phase?) */}
        {phase === 'greeting' && (
          <button
            onClick={handleComplete}
            className="absolute top-2 right-2 text-forest-green/50 hover:text-forest-green"
            aria-label="閉じる"
          >
            ×
          </button>
        )}

        <div className="text-center">
          {/* Image based on phase */}
{phase === 'eggFound' || phase === 'hatching' ? (
             <img
               src="https://ik.imagekit.io/ryopc/%E5%8D%B5%E7%94%BB%E5%83%8F.png"
               alt={phase === 'eggFound' ? '不思議な卵' : '孵化中の卵'}
               className={`w-32 h-32 mx-auto ${phase === 'eggFound' ? 'animate-bounce-gentle' : 'animate-pulse'}`}
             />
           ) : phase === 'dragonBorn' || phase === 'nameInput' ? (
            <img
              src="https://ik.imagekit.io/ryopc/%E3%83%88%E3%82%99%E3%83%A9%E3%82%B3%E3%82%99%E3%83%B3%E5%AD%B5%E5%8C%96.png"
              alt="ドラゴン"
              className="w-40 h-40 mx-auto animate-bounce-gentle"
            />
          ) : (
            <div className="text-6xl mb-4 animate-bounce-gentle" aria-hidden="true">
              🌱
            </div>
          )}

          {/* Greeting text */}
          <p className="text-forest-green text-lg font-medium mb-6 whitespace-pre-line">
            {greeting}
          </p>

          {/* Hatching progress bar */}
          {phase === 'hatching' && (
            <div className="mb-4">
              <div className="h-3 bg-forest-green/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pastel-orange rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${eggProgress}%` }}
                />
              </div>
              <p className="text-xs text-forest-green/60 mt-1">
                孵化中... {Math.floor(eggProgress)}%
              </p>
            </div>
          )}

          {/* Name input form */}
          {phase === 'nameInput' && (
            <form onSubmit={handleNameSubmit} className="mt-4">
              <input
                type="text"
                value={dragonName}
                onChange={e => setDragonName(e.target.value)}
                placeholder="ドラゴンの名前をつけてね"
                className="w-full p-3 border border-forest-green/30 rounded-lg text-forest-green placeholder-forest-green/40 mb-3"
                maxLength={10}
                autoFocus
              />
              <button type="submit" className="w-full btn-primary">
                名前をつける 🐉
              </button>
            </form>
          )}

          {/* Buttons based on phase */}
          {phase === 'greeting' && (
            <button
              onClick={handleComplete}
              className="mt-6 w-full btn-primary"
            >
              わかった！ 💚
            </button>
          )}
          {phase === 'eggFound' && (
            <button
              onClick={handleComplete}
              className="mt-6 w-full btn-primary"
            >
              見守る 🥚
            </button>
          )}
          {phase === 'dragonBorn' && !dragonName && (
            <button
              onClick={handleComplete}
              className="mt-6 w-full btn-primary"
            >
              会えた！ 🐉
            </button>
          )}
          {(phase === 'dragonBorn' && dragonName) && (
            <button
              onClick={handleComplete}
              className="mt-6 w-full btn-primary"
            >
              仲間になった！ 🐉
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MorningGreeting;
