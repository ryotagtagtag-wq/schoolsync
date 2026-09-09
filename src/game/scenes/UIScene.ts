import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { type SubjectStats } from '../types';

export class UIScene extends Phaser.Scene {
  private playerData: {
    userId: string;
    level: number;
    xp: number;
    xpToNext: number;
    gold: number;
    streak: number;
    title: string;
    stats: SubjectStats;
  } = {
    userId: '',
    level: 1,
    xp: 0,
    xpToNext: 100,
    gold: 0,
    streak: 0,
    title: '見習い賢者',
    stats: { int: 0, wis: 0, str: 0, end: 0, cre: 0, soc: 0 },
  };
  
  // UI要素
  private xpBarFill!: Phaser.GameObjects.Graphics;
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private goldText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private streakFire!: Phaser.GameObjects.Graphics;
  private hpBarFill!: Phaser.GameObjects.Graphics;
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private minimap!: Phaser.GameObjects.RenderTexture;
  private playerIcon!: Phaser.GameObjects.Graphics;
  
  // アニメーション用
  private xpTween: Phaser.Tweens.Tween | null = null;

  constructor() {
    super('UIScene');
  }

  init(data: { playerData?: typeof this.playerData }): void {
    if (data.playerData) {
      this.playerData = { ...this.playerData, ...data.playerData };
    }
  }

  create(): void {
    this.createXPBar();
    this.createGoldDisplay();
    this.createLevelDisplay();
    this.createStreakDisplay();
    this.createHPBar();
    this.createMinimap();
    this.createTitleDisplay();
    
    // WorldSceneからのイベント受信
    this.events.on('update-player-data', this.updatePlayerData, this);
    this.events.on('xp-gain', this.animateXPGain, this);
    this.events.on('gold-gain', this.animateGoldGain, this);
    this.events.on('level-up', this.showLevelUp, this);
  }

  private createXPBar(): void {
    const barWidth = 300;
    const barHeight = 20;
    const x = 20;
    const y = 20;
    
    // 背景
    this.xpBarBg = this.add.graphics();
    this.xpBarBg.fillStyle(0x000000, 0.5);
    this.xpBarBg.fillRoundedRect(x, y, barWidth, barHeight, barHeight / 2);
    this.xpBarBg.setScrollFactor(0).setDepth(100);
    
    // 塗りつぶし
    this.xpBarFill = this.add.graphics();
    const percent = this.playerData.xp / this.playerData.xpToNext;
    this.xpBarFill.fillStyle(0x8B5CF6, 1);
    this.xpBarFill.fillRoundedRect(x + 2, y + 2, (barWidth - 4) * percent, barHeight - 4, (barHeight - 4) / 2);
    this.xpBarFill.setScrollFactor(0).setDepth(101);
    
    // XPテキスト
    this.add.text(
      x + barWidth / 2,
      y + barHeight / 2,
      `XP: ${this.playerData.xp} / ${this.playerData.xpToNext}`,
      { font: '12px Noto Sans JP', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(102).setName('xp-text');
  }

  private createGoldDisplay(): void {
    this.goldText = this.add.text(
      GAME_WIDTH - 20,
      20,
      `💰 ${this.playerData.gold.toLocaleString()}`,
      { font: '18px Noto Sans JP', color: '#F59E0B', stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
  }

  private createLevelDisplay(): void {
    this.levelText = this.add.text(
      20,
      55,
      `Lv. ${this.playerData.level}`,
      { font: 'bold 20px Noto Sans JP', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    ).setScrollFactor(0).setDepth(100);
  }

  private createTitleDisplay(): void {
    this.titleText = this.add.text(
      20,
      85,
      this.playerData.title,
      { font: '14px Noto Sans JP', color: '#F59E0B', stroke: '#000000', strokeThickness: 2 }
    ).setScrollFactor(0).setDepth(100);
  }

  private createStreakDisplay(): void {
    const x = GAME_WIDTH - 20;
    const y = 55;
    
    // 炎エフェクト（ストリーク表示）
    this.streakFire = this.add.graphics();
    this.drawStreakFire(x - 80, y, this.playerData.streak);
    this.streakFire.setScrollFactor(0).setDepth(100).setName('streak-fire');
    
    this.streakText = this.add.text(
      x,
      y,
      `🔥 ${this.playerData.streak}日`,
      { font: '16px Noto Sans JP', color: '#F97316', stroke: '#000000', strokeThickness: 2 }
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
  }
  
  private drawStreakFire(x: number, y: number, streak: number): void {
    this.streakFire.clear();
    const intensity = Math.min(streak / 30, 1);
    const count = Math.max(3, Math.floor(5 * intensity));
    
    for (let i = 0; i < count; i++) {
      const offsetX = (i - count / 2) * 12;
      const height = 15 + intensity * 20;
      const width = 8;
      
      const gradient = this.streakFire.createLinearGradient(x + offsetX, y, x + offsetX, y - height);
      gradient.addColorStop(0, '#F97316');
      gradient.addColorStop(0.5, '#F59E0B');
      gradient.addColorStop(1, '#FBBF24');
      
      this.streakFire.fillStyle(gradient as any);
      this.streakFire.fillTriangle(
        x + offsetX, y,
        x + offsetX - width / 2, y - height,
        x + offsetX + width / 2, y - height
      );
    }
    
    // アニメーション用に少し揺らす
    this.tweens.add({
      targets: this.streakFire,
      y: y - 2,
      yoyo: true,
      repeat: -1,
      duration: 500 + Math.random() * 500,
      ease: 'Sine.easeInOut',
    });
  }

  private createHPBar(): void {
    const barWidth = 150;
    const barHeight = 12;
    const x = 20;
    const y = 115;
    
    this.hpBarBg = this.add.graphics();
    this.hpBarBg.fillStyle(0x000000, 0.5);
    this.hpBarBg.fillRoundedRect(x, y, barWidth, barHeight, barHeight / 2);
    this.hpBarBg.setScrollFactor(0).setDepth(100);
    
    this.hpBarFill = this.add.graphics();
    this.hpBarFill.fillStyle(0x10B981, 1);
    this.hpBarFill.fillRoundedRect(x + 1, y + 1, (barWidth - 2) * 0.8, barHeight - 2, (barHeight - 2) / 2);
    this.hpBarFill.setScrollFactor(0).setDepth(101);
    
    this.add.text(
      x + barWidth / 2,
      y + barHeight / 2,
      'HP: 80%',
      { font: '10px Noto Sans JP', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(102).setName('hp-text');
  }

  private createMinimap(): void {
    const size = 150;
    const x = GAME_WIDTH - size - 20;
    const y = GAME_HEIGHT - size - 20;
    
    this.minimap = this.add.renderTexture(x, y, size, size);
    this.minimap.setScrollFactor(0).setDepth(90);
    
    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(x - 2, y - 2, size + 4, size + 4, 10);
    bg.setScrollFactor(0).setDepth(89);
    
    // 枠
    const border = this.add.graphics();
    border.lineStyle(2, 0x6B46C1, 0.5);
    border.strokeRoundedRect(x - 2, y - 2, size + 4, size + 4, 10);
    border.setScrollFactor(0).setDepth(91);
    
    // プレイヤーアイコン
    this.playerIcon = this.add.graphics();
    this.playerIcon.fillStyle(0x6B46C1, 1);
    this.playerIcon.fillCircle(x + size / 2, y + size / 2, 4);
    this.playerIcon.setScrollFactor(0).setDepth(92);
    
    // ミニマップ更新（WorldSceneから位置情報を受け取る想定）
    this.events.on('minimap-update', this.updateMinimap, this);
  }
  
  private updateMinimap(data: { playerX: number; playerY: number; mapWidth: number; mapHeight: number; facilities: Array<{ x: number; y: number; type: string }> }): void {
    if (!this.minimap) return;
    
    const size = this.minimap.width;
    const mapScale = size / Math.max(data.mapWidth, data.mapHeight);
    
    // プレイヤー位置
    const px = data.playerX * mapScale;
    const py = data.playerY * mapScale;
    this.playerIcon.clear();
    this.playerIcon.fillStyle(0x6B46C1, 1);
    this.playerIcon.fillCircle(this.minimap.x + px, this.minimap.y + py, 4);
    
    // 施設マーカー（簡易）
    // 実装は後で拡張
  }

  private updatePlayerData(data: Partial<typeof this.playerData>): void {
    this.playerData = { ...this.playerData, ...data };
    this.refreshDisplay();
  }
  
  private refreshDisplay(): void {
    // XPバー
    const percent = this.playerData.xp / this.playerData.xpToNext;
    const barWidth = 300;
    this.xpBarFill.clear();
    this.xpBarFill.fillStyle(0x8B5CF6, 1);
    this.xpBarFill.fillRoundedRect(22, 22, (barWidth - 4) * percent, 16, 8);
    
    const xpText = this.children.getByName('xp-text') as Phaser.GameObjects.Text;
    if (xpText) {
      xpText.setText(`XP: ${this.playerData.xp} / ${this.playerData.xpToNext}`);
    }
    
    // ゴールド
    this.goldText.setText(`💰 ${this.playerData.gold.toLocaleString()}`);
    
    // レベル
    this.levelText.setText(`Lv. ${this.playerData.level}`);
    
    // 称号
    this.titleText.setText(this.playerData.title);
    
    // ストリーク
    this.streakText.setText(`🔥 ${this.playerData.streak}日`);
    this.drawStreakFire(GAME_WIDTH - 100, 55, this.playerData.streak);
  }
  
  private animateXPGain(amount: number): void {
    // XPバーアニメーション
    const targetXP = this.playerData.xp + amount;
    const targetPercent = targetXP / this.playerData.xpToNext;
    const barWidth = 300;
    
    if (this.xpTween) this.xpTween.stop();
    
    this.xpTween = this.tweens.addCounter({
      from: this.playerData.xp,
      to: targetXP,
      duration: 1000,
      ease: 'Power2',
      onUpdate: (tween) => {
        const currentXP = Math.floor(tween.getValue());
        const currentPercent = currentXP / this.playerData.xpToNext;
        
        this.xpBarFill.clear();
        this.xpBarFill.fillStyle(0x8B5CF6, 1);
        this.xpBarFill.fillRoundedRect(22, 22, (barWidth - 4) * currentPercent, 16, 8);
        
        const xpText = this.children.getByName('xp-text') as Phaser.GameObjects.Text;
        if (xpText) {
          xpText.setText(`XP: ${currentXP} / ${this.playerData.xpToNext}`);
        }
      },
      onComplete: () => {
        this.playerData.xp = targetXP;
        this.refreshDisplay();
      },
    });
    
    // ゴールド風パーティクル
    this.createGainParticles(GAME_WIDTH / 2, 30, 0x8B5CF6, '✨');
  }
  
  private animateGoldGain(amount: number): void {
    const startGold = this.playerData.gold;
    const targetGold = startGold + amount;
    
    this.tweens.addCounter({
      from: startGold,
      to: targetGold,
      duration: 800,
      ease: 'Power2',
      onUpdate: (tween) => {
        this.goldText.setText(`💰 ${Math.floor(tween.getValue()).toLocaleString()}`);
      },
      onComplete: () => {
        this.playerData.gold = targetGold;
      },
    });
    
    // 金パーティクル
    this.createGainParticles(GAME_WIDTH - 100, 40, 0xF59E0B, '💰');
  }
  
  private createGainParticles(x: number, y: number, color: number, emoji: string): void {
    for (let i = 0; i < 8; i++) {
      const text = this.add.text(x, y, emoji, { font: '20px' }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
      
      this.tweens.add({
        targets: text,
        x: x + Phaser.Math.Between(-100, 100),
        y: y - Phaser.Math.Between(50, 150),
        alpha: 0,
        scale: 0.5,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => text.destroy(),
      });
    }
  }
  
  private showLevelUp(newLevel: number): void {
    // レベルアップ演出
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    container.setDepth(500).setScrollFactor(0);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRoundedRect(-200, -100, 400, 200, 20);
    container.add(bg);
    
    const text = this.add.text(0, -30, `🎉 レベルアップ！`, { 
      font: 'bold 32px Noto Sans JP', 
      color: '#F59E0B',
      stroke: '#000000',
      strokeThickness: 4 
    }).setOrigin(0.5);
    container.add(text);
    
    const levelText = this.add.text(0, 20, `Lv. ${this.playerData.level} → Lv. ${newLevel}`, { 
      font: '24px Noto Sans JP', 
      color: '#ffffff' 
    }).setOrigin(0.5);
    container.add(levelText);
    
    const titleText = this.add.text(0, 60, `新しい称号: ${this.getTitleForLevel(newLevel)}`, { 
      font: '18px Noto Sans JP', 
      color: '#8B5CF6' 
    }).setOrigin(0.5);
    container.add(titleText);
    
    // ポップアップアニメーション
    container.setScale(0);
    this.tweens.add({
      targets: container,
      scale: 1.1,
      duration: 300,
      ease: 'Back.out',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.tweens.add({
          targets: container,
          alpha: 0,
          scale: 0.8,
          delay: 2000,
          duration: 500,
          onComplete: () => container.destroy(),
        });
      },
    });
    
    // レベルアップパーティクル
    this.createLevelUpParticles();
  }
  
  private getTitleForLevel(level: number): string {
    if (level >= 50) return '伝説の賢者';
    if (level >= 30) return '大賢者';
    if (level >= 15) return '賢者';
    if (level >= 5) return '見習い賢者・上級';
    return '見習い賢者';
  }
  
  private createLevelUpParticles(): void {
    const particles = this.add.particles(0, 0, 'particle', {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 2000,
      quantity: 10,
      frequency: 100,
      blendMode: 'ADD',
      tint: [0xF59E0B, 0x8B5CF6, 0x10B981, 0x6B46C1],
    });
    
    this.time.delayedCall(3000, () => particles.destroy());
  }
}
