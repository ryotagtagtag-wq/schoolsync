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
  const [phase, setPhase] = useState<'greeting' | 'eggFound'>('greeting');

  const teacherType = getTeacherType(plant.plantTypeId);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastShown = localStorage.getItem('morningGreetingLastShown');
    
    if (lastShown === today) {
      onComplete();
      return;
    }

    setShowModal(true);
    const greetingText = getRandomLine(teacherType, 'morning');
    setGreeting(greetingText);
    setPhase('greeting');

    // 卵発見判定（25%）
    if (Math.random() < 0.25) {
      setTimeout(() => {
        setPhase('eggFound');
        const eggLine = getRandomLine(teacherType, 'eggFound');
        setGreeting(eggLine);
        onEggFound?.({ hasEgg: true, plantType: plant.plantTypeId });
      }, 2000);
    }

    localStorage.setItem('morningGreetingLastShown', today);
  }, [plant.plantTypeId, onComplete]);

  const handleComplete = () => {
    if (phase === 'greeting') {
      const completeLine = getRandomLine(teacherType, 'afterComplete');
      setGreeting(completeLine);
      setTimeout(() => {
        setShowModal(false);
        onComplete();
      }, 1500);
    } else if (phase === 'eggFound') {
      // 卵発見後はそのまま閉じる（後でドラゴン画像追加用に状態保存）
      setShowModal(false);
      onComplete();
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl p-6 m-4 max-w-sm animate-pop-in relative">
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
          <div className="text-6xl mb-4 animate-bounce-gentle" aria-hidden="true">
            {phase === 'eggFound' ? '🥚' : '🌱'}
          </div>

          <p className="text-forest-green text-lg font-medium mb-6 whitespace-pre-line">
            {greeting}
          </p>

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
        </div>
      </div>
    </div>
  );
};

export default MorningGreeting;
