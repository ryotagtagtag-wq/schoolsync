import { useState, useImperativeHandle, forwardRef } from 'react';
import { PlantStage, PlantInstance } from '../types';
import { getGrowthProgress, isPotStage } from '../utils/plantLogic';

export interface PlantDisplayRef {
  triggerHappy: () => void;
}

interface PlantDisplayProps {
  plant: PlantInstance;
  plantStage: PlantStage;
  nextStageExp: number | null;
  currentVitality: number;
  onPet: () => void;
  itemEffect: { exp: number; vitality: number; message: string } | null;
}

export const PlantDisplay = forwardRef<PlantDisplayRef, PlantDisplayProps>(({
  plant,
  plantStage,
  nextStageExp,
  currentVitality,
  onPet,
  itemEffect,
}, ref) => {
  const [isHappy, setIsHappy] = useState(false);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const progress = getGrowthProgress(plant);
  const showPot = !isPotStage(plant);
  
  const triggerHappy = () => {
    setIsHappy(true);
    const newSparkles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setSparkles(newSparkles);
    
    setTimeout(() => {
      setIsHappy(false);
      setSparkles([]);
    }, 2000);
    
    onPet();
  };
  
  useImperativeHandle(ref, () => ({
    triggerHappy,
  }));

  // 元気ステータス
  const getVitalityColor = (v: number) => {
    if (v >= 80) return 'text-forest-green';
    if (v >= 50) return 'text-pastel-green';
    if (v >= 20) return 'text-pastel-orange';
    return 'text-pastel-red';
  };
  
  const getVitalityEmoji = (v: number) => {
    if (v >= 80) return '😊';
    if (v >= 50) return '🙂';
    if (v >= 20) return '😐';
    return '😢';
  };

  return (
    <div className="flex flex-col items-center pt-2 pb-4">
      {/* 元気バー */}
      <div className="w-full max-w-xs mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className={getVitalityColor(currentVitality)} font-medium>
            元気: {Math.round(currentVitality)}% {getVitalityEmoji(currentVitality)}
          </span>
        </div>
        <div className="h-2 bg-forest-green/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              currentVitality >= 50 ? 'bg-forest-green' : currentVitality >= 20 ? 'bg-pastel-orange' : 'bg-pastel-red'
            }`}
            style={{ width: `${currentVitality}%` }}
            role="progressbar"
            aria-valuenow={Math.round(currentVitality)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="植物の元気"
          />
        </div>
      </div>
      
      <div className="relative w-64 h-64 flex items-end justify-center">
        {showPot && (
          <>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 ml-3 w-32 h-16 rounded-b-xl bg-warm-brown/30 border-2 border-warm-brown/50" />
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 ml-3 w-28 h-12 rounded-lg bg-warm-brown/50 border border-warm-brown/60" />
          </>
        )}
        
        {sparkles.map(sparkle => (
          <div
            key={sparkle.id}
            className="absolute text-yellow-300 text-2xl animate-sparkle pointer-events-none"
            style={{
              left: `${sparkle.x}%`,
              bottom: `${sparkle.y + 20}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            ✨
          </div>
        ))}
        
        <div
          className={`absolute bottom-20 left-1/2 -translate-x-1/2 text-9xl transition-all duration-500 ${
            isHappy ? 'wiggle' : ''
          }`}
          role="img"
          aria-label={`植物: ${plantStage.name}`}
        >
          {plantStage.emoji}
        </div>
        
        {isHappy && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-pop-in text-forest-green font-bold text-lg whitespace-nowrap">
            わーい！💕
          </div>
        )}
        
        {/* アイテム使用エフェクト */}
        {itemEffect && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pop-in text-center pointer-events-none z-10">
            {itemEffect.exp > 0 && (
              <div className="text-2xl font-bold text-pastel-yellow animate-float-up">
                +{itemEffect.exp} EXP ✨
              </div>
            )}
            {itemEffect.vitality > 0 && (
              <div className="text-2xl font-bold text-pastel-green animate-float-up">
                元気 +{itemEffect.vitality} 💚
              </div>
            )}
            {itemEffect.message && !itemEffect.exp && !itemEffect.vitality && (
              <div className="text-xl font-bold text-forest-green animate-float-up">
                {itemEffect.message}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center px-4">
        <h2 className="text-2xl font-bold text-forest-green mb-2">
          {plant.nickname ? `${plant.nickname}（${plantStage.name}）` : plantStage.name}
        </h2>
        <p className="text-text-dark/80 text-base leading-relaxed">
          {plantStage.message}
        </p>
      </div>
      
      {nextStageExp !== null && (
        <div className="mt-6 w-full max-w-xs">
          <div className="flex justify-between text-xs text-forest-green/60 mb-1">
            <span>EXP: {plant.exp}</span>
            <span>次の段階まで: {nextStageExp} EXP</span>
          </div>
          <div className="h-3 bg-forest-green/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-forest-green rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="植物の成長進捗"
            />
          </div>
        </div>
      )}
      
      <button
        onClick={triggerHappy}
        className="mt-6 btn-secondary text-sm px-5 py-2"
        aria-label="植物をなでて喜ばせる（元気少し回復）"
      >
        💚 なでなでして喜ばせる
      </button>
    </div>
  );
});

PlantDisplay.displayName = 'PlantDisplay';
