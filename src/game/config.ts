import Phaser from 'phaser';

export const gameConfig: Phaser.Core.Config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: 0x1a1a2e,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 640,
      height: 360,
    },
    max: {
      width: 1920,
      height: 1080,
    },
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: process.env.NODE_ENV === 'development',
    },
  },
  scene: [
    'BootScene',
    'WorldScene',
    'BattleScene',
    'UIScene',
  ],
  render: {
    pixelArt: true,
    antialias: false,
  },
  input: {
    gamepad: true,
  },
};

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const TILE_SIZE = 32;
