'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { WorldScene, setPendingAssignments, type AssignmentData } from './scenes/WorldScene';
import { BattleScene } from './scenes/BattleScene';
import { UIScene } from './scenes/UIScene';
import { FacilityUIScene } from './scenes/FacilityUIScene';
import type { FacilityData } from './map/tilemap';

interface GameCanvasProps {
  playerData?: {
    userId: string;
    level: number;
    xp: number;
    xpToNext: number;
    gold: number;
    streak: number;
    title: string;
    stats?: {
      int: number;
      wis: number;
      str: number;
      end: number;
      cre: number;
      soc: number;
    };
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
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef<Callbacks>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = { onFacilityInteract, onBattleStart, onBattleEnd, onLevelUp, onFacilityAction };
  }, [onFacilityInteract, onBattleStart, onBattleEnd, onLevelUp, onFacilityAction]);

  const launchFacilityUI = useCallback((facility: FacilityData) => {
    if (!gameRef.current || !playerData) return;
    
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

    gameRef.current.scene.pause('WorldScene');
    gameRef.current.scene.launch('FacilityUIScene', facilityData);
  }, [playerData, assignments]);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    try {
      setPendingAssignments(assignments);

      const game = new Phaser.Game({
        ...gameConfig,
        parent: containerRef.current,
      });

      // Add all scenes, but only BootScene auto-starts
      game.scene.add('BootScene', BootScene, true);
      game.scene.add('WorldScene', WorldScene, false);
      game.scene.add('BattleScene', BattleScene, false);
      game.scene.add('UIScene', UIScene, false);
      game.scene.add('FacilityUIScene', FacilityUIScene, false);

      gameRef.current = game;

      // Wait for BootScene to complete and start WorldScene
      // BootScene.create() calls this.scene.start('WorldScene') after generating assets
      game.events.once('ready', () => {
        // Give BootScene time to start WorldScene
        const checkWorldScene = () => {
          const worldScene = game.scene.getScene('WorldScene');
          if (worldScene && worldScene.scene.isActive()) {
            setupWorldSceneListeners(worldScene);
            const uiScene = game.scene.getScene('UIScene');
            if (uiScene) {
              uiScene.events.on('level-up', (level: number) => {
                callbacksRef.current.onLevelUp?.(level);
              });
            }
            setIsLoaded(true);
            setError(null);
          } else {
            // WorldScene not started yet, check again
            setTimeout(checkWorldScene, 50);
          }
        };
        checkWorldScene();
      });

    } catch (err) {
      console.error('Failed to initialize Phaser game:', err);
      setError('ゲームの初期化に失敗しました');
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [assignments, launchFacilityUI]);

  const setupWorldSceneListeners = (worldScene: Phaser.Scene) => {
    worldScene.events.on('facility-interact', (facility: FacilityData) => {
      launchFacilityUI(facility);
    });
    worldScene.events.on('battle-start', (data: unknown) => {
      callbacksRef.current.onBattleStart?.(data);
    });
    worldScene.events.on('battle-end', (result: { type: 'victory' | 'defeat' | 'flee'; assignmentId?: string; reward?: unknown }) => {
      callbacksRef.current.onBattleEnd?.(result.type, result.assignmentId, result.reward);
    });
  };

  // プレイヤーデータ更新
  useEffect(() => {
    if (!gameRef.current || !playerData) return;
    
    const uiScene = gameRef.current.scene.getScene('UIScene') as Phaser.Scene;
    if (uiScene && uiScene.scene.isActive()) {
      uiScene.events.emit('update-player-data', playerData);
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
