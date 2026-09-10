'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Application } from 'pixi.js';
import { gameConfig, type PixiApp } from './config';
import { SceneManager, SceneName } from './SceneManager';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { BattleScene } from './scenes/BattleScene';
import { UIScene } from './scenes/UIScene';
import { FacilityUIScene } from './scenes/FacilityUIScene';
import type { FacilityData } from './map/tilemap';
import { setPendingAssignments, type AssignmentData } from './scenes/WorldScene';

interface GameCanvasProps {
  playerData?: {
    userId: string;
    level: number;
    xp: number;
    xpToNext: number;
    gold: number;
    streak: number;
    title: string;
    stats?: { int: number; wis: number; str: number; end: number; cre: number; soc: number };
    facilities?: Array<{ facilityId: string; level: number }>;
  };
  assignments?: AssignmentData[];
  onFacilityInteract?: (facilityId: string) => void;
  onBattleStart?: (monsterData: unknown) => void;
  onBattleEnd?: (result: 'victory' | 'defeat' | 'flee', assignmentId?: string, reward?: unknown) => void;
  onLevelUp?: (newLevel: number) => void;
  onFacilityAction?: (action: string, data?: unknown) => void;
  className?: string;
}

interface Callbacks {
  onFacilityInteract?: (facilityId: string) => void;
  onBattleStart?: (monsterData: unknown) => void;
  onBattleEnd?: (result: 'victory' | 'defeat' | 'flee', assignmentId?: string, reward?: unknown) => void;
  onLevelUp?: (newLevel: number) => void;
  onFacilityAction?: (action: string, data?: unknown) => void;
}

export function GameCanvas({
  playerData,
  assignments = [],
  onFacilityInteract,
  onBattleStart,
  onBattleEnd,
  onLevelUp,
  onFacilityAction,
  className = '',
}: GameCanvasProps) {
  const appRef = useRef<PixiApp | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const callbacksRef = useRef<Callbacks>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update callbacks ref
  useEffect(async () => {
    callbacksRef.current = { onFacilityInteract, onBattleStart, onBattleEnd, onLevelUp, onFacilityAction };
  }, [onFacilityInteract, onBattleStart, onBattleEnd, onLevelUp, onFacilityAction]);

  const launchFacilityUI = useCallback((facility: FacilityData) => {
    if (!sceneManagerRef.current || !playerData) return;
    
    const facilityData = {
      facility,
      playerData: {
        userId: playerData.userId,
        level: playerData.level,
        xp: playerData.xp,
        xpToNext: playerData.xpToNext,
        gold: playerData.gold,
        streak: playerData.streak,
        title: playerData.title,
        stats: playerData.stats || { int: 0, wis: 0, str: 0, end: 0, cre: 0, soc: 0 },
        facilities: playerData.facilities || [],
      },
      assignments: assignments.map(a => ({
        id: a.id,
        title: a.title,
        subject: a.subject,
        priority: a.priority,
        status: a.status,
        dueDate: a.dueDate,
      })),
      onClose: () => {
        callbacksRef.current.onFacilityInteract?.(facility.id);
      },
      onAction: (action: string, data?: unknown) => {
        callbacksRef.current.onFacilityAction?.(action, data);
      },
    };

    sceneManagerRef.current.pause('world');
    sceneManagerRef.current.launch('facility', facilityData);
  }, [playerData, assignments]);

  useEffect(async () => {
    if (appRef.current || !containerRef.current) return;

    try {
      setPendingAssignments(assignments);

      // Create PixiJS Application
      const app = new Application();
      await app.init({
        ...gameConfig,
        parent: containerRef.current,
      });

      appRef.current = app;

      // Create scene manager
      const sceneManager = new SceneManager(app);
      sceneManagerRef.current = sceneManager;

      // Register all scenes
      const bootScene = new BootScene(app, sceneManager);
      sceneManager.register(bootScene);

      const worldScene = new WorldScene();
      worldScene.setSceneManager(sceneManager);
      worldScene.setCallbacks({
        onFacilityInteract: (facility: FacilityData) => {
          callbacksRef.current.onFacilityInteract?.(facility.id);
        },
        onBattleStart: (data: any) => {
          callbacksRef.current.onBattleStart?.(data);
        },
        onBattleEnd: (result: any) => {
          callbacksRef.current.onBattleEnd?.(result.type, result.assignmentId, result.reward);
        },
      });
      sceneManager.register(worldScene);

      const battleScene = new BattleScene(app);
      sceneManager.register(battleScene);

      const uiScene = new UIScene();
      sceneManager.register(uiScene);

      const facilityScene = new FacilityUIScene();
      sceneManager.register(facilityScene);

      // Start with boot scene
      sceneManager.start('boot').then(() => {
        setIsLoaded(true);
        setError(null);
      });

      // Game loop
      app.ticker.add((ticker) => {
        sceneManager.update(ticker.deltaTime);
      });

      // Handle UI scene updates
      app.ticker.add(() => {
        if (sceneManager.getCurrent() === 'world' || sceneManager.getScene('ui')) {
          const uiSceneInstance = sceneManager.getScene('ui') as any;
          uiSceneInstance?.update?.(0);
        }
      });

    } catch (err) {
      console.error('Failed to initialize PixiJS game:', err);
      setError('ゲームの初期化に失敗しました');
    }

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
    };
  }, [assignments, launchFacilityUI]);

  // プレイヤーデータ更新
  useEffect(async () => {
    if (!appRef.current || !playerData) return;
    
    const uiScene = sceneManagerRef.current?.getScene('ui') as any;
    if (uiScene && uiScene.onUpdatePlayerData) {
      uiScene.onUpdatePlayerData(playerData);
    }
  }, [playerData]);

  // ローディング表示
  if (!isLoaded) {
    return (
      <div 
        ref={containerRef}
        id="game-container"
        className={`w-full h-[720px] bg-[#1a1a2e] flex items-center justify-center ${className}`}
        style={{ width: '100%', height: '720px' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6B46C1] border-t-transparent mx-auto mb-4" />
          <p className="text-white text-lg">Loading Questra...</p>
          <p className="text-gray-400 text-sm mt-2">冒険の準備をしています...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div 
        ref={containerRef}
        id="game-container"
        className={`w-full h-[720px] bg-[#1a1a2e] flex items-center justify-center ${className}`}
        style={{ width: '100%', height: '720px' }}
      >
        <div className="text-center text-red-400 p-4">
          <p className="text-xl mb-2">⚠️ エラーが発生しました</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#6B46C1] text-white rounded hover:bg-[#5a3abf] transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      id="game-container"
      className={`w-full ${className}`}
      style={{ width: '100%', height: '720px' }}
    />
  );
}
