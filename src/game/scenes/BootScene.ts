import Phaser from 'phaser';
import { generateAllAssets } from '../generateAssets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // ローディングバー表示
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1a1a2e, 0.9);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 60);
    progressBox.lineStyle(2, 0x6B46C1, 1);
    progressBox.strokeRect(width / 2 - 160, height / 2 - 30, 320, 60);
    
    const loadingText = this.add.text(width / 2, height / 2 - 55, 'Questra', {
      font: 'bold 28px Noto Sans JP',
      color: '#F59E0B',
      stroke: '#1a1a2e',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5);
    
    const subtitleText = this.add.text(width / 2, height / 2 - 20, '見習い賢者の冒険録', {
      font: '14px Noto Sans JP',
      color: '#A78BFA',
    }).setOrigin(0.5, 0.5);
    
    const percentText = this.add.text(width / 2, height / 2 + 10, '0%', {
      font: '16px Noto Sans JP',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);
    
    const tipText = this.add.text(width / 2, height / 2 + 45, 'アセットを生成中...', {
      font: '12px Noto Sans JP',
      color: '#6B7280',
    }).setOrigin(0.5, 0.5);
    
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x6B46C1, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 10, 300 * value, 20);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      subtitleText.destroy();
      percentText.destroy();
      tipText.destroy();
    });

    // ダミーのロード（プログレスバー表示用）
    this.load.on('progress', () => {});
    this.load.start();
    
    // 即座に完了させる（アセットは生成で作るため）
    this.load.emit('complete');
  }

  create(): void {
    // プログラム的に全アセットを生成
    generateAllAssets(this);
    
    // アニメーション定義
    this.createAnimations();
    
    // 次のシーンへ
    this.scene.start('WorldScene', { map: 'town' });
  }
  
  private createAnimations(): void {
    // プレイヤーアニメーション（生成したスプライトシート使用）
    // アイドル
    ['down', 'up', 'left', 'right'].forEach((dir, row) => {
      this.anims.create({
        key: `player-idle-${dir}`,
        frames: this.anims.generateFrameNumbers('player', { start: row * 9, end: row * 9 + 2 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: `player-walk-${dir}`,
        frames: this.anims.generateFrameNumbers('player', { start: row * 9 + 3, end: row * 9 + 8 }),
        frameRate: 10,
        repeat: -1,
      });
    });
    
    // 攻撃
    this.anims.create({
      key: 'player-attack',
      frames: this.anims.generateFrameNumbers('player', { start: 36, end: 39 }),
      frameRate: 12,
      repeat: 0,
    });
    
    // モンスター共通アニメーション
    const monsters = ['golem', 'dragon', 'mage', 'phoenix', 'titan', 'berserker', 'nekomata'];
    monsters.forEach(monster => {
      this.anims.create({
        key: `monster-${monster}-idle`,
        frames: this.anims.generateFrameNumbers(`monster-${monster}`, { start: 0, end: 9 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: `monster-${monster}-hit`,
        frames: this.anims.generateFrameNumbers(`monster-${monster}`, { start: 10, end: 11 }),
        frameRate: 10,
        repeat: 0,
      });
      this.anims.create({
        key: `monster-${monster}-death`,
        frames: this.anims.generateFrameNumbers(`monster-${monster}`, { start: 20, end: 29 }),
        frameRate: 8,
        repeat: 0,
      });
      
      // 後方互換用のエイリアス
      this.anims.create({
        key: 'monster-idle',
        frames: this.anims.generateFrameNumbers(`monster-${monster}`, { start: 0, end: 9 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: 'monster-hit',
        frames: this.anims.generateFrameNumbers(`monster-${monster}`, { start: 10, end: 11 }),
        frameRate: 10,
        repeat: 0,
      });
      this.anims.create({
        key: 'monster-death',
        frames: this.anims.generateFrameNumbers(`monster-${monster}`, { start: 20, end: 29 }),
        frameRate: 8,
        repeat: 0,
      });
    });
    
    // エフェクトアニメーション
    this.anims.create({
      key: 'explosion',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 15 }),
      frameRate: 20,
      repeat: 0,
    });
    this.anims.create({
      key: 'hit-effect',
      frames: this.anims.generateFrameNumbers('hit-effect', { start: 0, end: 7 }),
      frameRate: 15,
      repeat: 0,
    });
  }
}
