import Phaser from 'phaser';

/**
 * アセット生成ユーティリティ
 * PhaserのGraphics APIを使ってプログラム的に全アセットを生成
 * 実際の画像ファイルなしで動作するようにする
 */

export class AssetGenerator {
  private scene: Phaser.Scene;
  private textureManager: Phaser.Textures.TextureManager;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.textureManager = scene.textures;
  }

  generateAll(): void {
    this.generatePlayerSpritesheet();
    this.generateMonsterSpritesheets();
    this.generateBuildingSprites();
    this.generateUISprites();
    this.generateEffectSprites();
    this.generateItemSprites();
    this.generateTileset();
  }

  // ===== プレイヤースプライトシート (32x32, 36フレーム) =====
  private generatePlayerSpritesheet(): void {
    const frameWidth = 32;
    const frameHeight = 32;
    const cols = 9;
    const rows = 4;
    const canvas = this.scene.make.canvas({ 
      width: frameWidth * cols, 
      height: frameHeight * rows, 
      add: false 
    }) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    // カラーパレット
    const colors = {
      hair: '#8B4513',
      skin: '#FFDBAC',
      shirt: '#6B46C1',
      pants: '#1F2937',
      shoes: '#374151',
      outline: '#111827',
    };

    const drawCharacter = (frameX: number, frameY: number, direction: 'down' | 'up' | 'left' | 'right', walking: boolean) => {
      const x = frameX * frameWidth;
      const y = frameY * frameHeight;
      const cx = x + frameWidth / 2;
      const cy = y + frameHeight / 2;
      
      ctx.save();
      ctx.translate(cx, cy);
      
      if (direction === 'left' || direction === 'right') {
        ctx.scale(direction === 'left' ? -1 : 1, 1);
      }
      
      // 歩行アニメーションのオフセット
      const walkOffset = walking ? Math.sin(frameX * Math.PI / 2) * 2 : 0;
      const armSwing = walking ? Math.sin(frameX * Math.PI / 2) * 4 : 0;
      const legSwing = walking ? Math.sin(frameX * Math.PI / 2) * 3 : 0;

      // 影
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // 体（服）
      ctx.fillStyle = colors.shirt;
      ctx.fillRect(-8, -4, 16, 14);
      ctx.strokeStyle = colors.outline;
      ctx.lineWidth = 1;
      ctx.strokeRect(-8, -4, 16, 14);

      // 袖
      ctx.fillStyle = colors.shirt;
      // 左腕
      ctx.fillRect(-12 + armSwing, -2, 6, 10);
      ctx.strokeRect(-12 + armSwing, -2, 6, 10);
      // 右腕
      ctx.fillRect(6 - armSwing, -2, 6, 10);
      ctx.strokeRect(6 - armSwing, -2, 6, 10);

      // 足（ズボン）
      ctx.fillStyle = colors.pants;
      ctx.fillRect(-6, 10 + legSwing, 5, 8);
      ctx.fillRect(1, 10 - legSwing, 5, 8);
      ctx.strokeRect(-6, 10 + legSwing, 5, 8);
      ctx.strokeRect(1, 10 - legSwing, 5, 8);

      // 靴
      ctx.fillStyle = colors.shoes;
      ctx.fillRect(-6, 18 + legSwing, 5, 3);
      ctx.fillRect(1, 18 - legSwing, 5, 3);

      // 頭
      ctx.fillStyle = colors.skin;
      ctx.beginPath();
      ctx.arc(0, -10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 髪
      ctx.fillStyle = colors.hair;
      ctx.beginPath();
      ctx.arc(0, -14, 9, Math.PI, 0);
      ctx.lineTo(9, -10);
      ctx.arc(0, -10, 9, 0, Math.PI);
      ctx.fill();

      // 目
      ctx.fillStyle = colors.outline;
      ctx.fillRect(-4, -12, 2, 2);
      ctx.fillRect(2, -12, 2, 2);

      // 口（向きによって）
      if (direction === 'down') {
        ctx.fillRect(-1, -8, 2, 1);
      }

      ctx.restore();
    };

    // 4方向 × 9フレーム（アイドル3、歩行6）
    const directions: ('down' | 'up' | 'left' | 'right')[] = ['down', 'up', 'left', 'right'];
    directions.forEach((dir, row) => {
      // アイドルフレーム (0-2)
      for (let i = 0; i < 3; i++) {
        drawCharacter(i, row, dir, false);
      }
      // 歩行フレーム (3-8)
      for (let i = 3; i < 9; i++) {
        drawCharacter(i, row, dir, true);
      }
    });

    // 攻撃フレーム (行4、フレーム32-35)
    for (let i = 0; i < 4; i++) {
      drawCharacter(i, 4, 'right', false);
      // 攻撃ポーズ
      const x = i * frameWidth + frameWidth / 2;
      const y = 4 * frameHeight + frameHeight / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = colors.shirt;
      ctx.fillRect(-8, -4, 16, 14);
      // 攻撃モーション：腕を前に
      ctx.fillRect(6, -2 + Math.sin(i * Math.PI / 2) * 4, 10, 6);
      ctx.strokeRect(6, -2 + Math.sin(i * Math.PI / 2) * 4, 10, 6);
      ctx.restore();
    }

    this.textureManager.addCanvas('player', canvas);
  }

  // ===== モンスタースプライトシート (各教科別) =====
  private generateMonsterSpritesheet(name: string, color: string, emoji: string): void {
    const frameWidth = 32;
    const frameHeight = 32;
    const cols = 10;
    const rows = 3;
    const canvas = this.scene.make.canvas({ 
      width: frameWidth * cols, 
      height: frameHeight * rows, 
      add: false 
    }) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    const drawMonster = (frameX: number, frameY: number, anim: 'idle' | 'hit' | 'death') => {
      const x = frameX * frameWidth;
      const y = frameY * frameHeight;
      const cx = x + frameWidth / 2;
      const cy = y + frameHeight / 2;
      
      ctx.save();
      ctx.translate(cx, cy);

      const bob = anim === 'idle' ? Math.sin(frameX * Math.PI) * 2 : 0;
      const hitFlash = anim === 'hit' ? 1 : 0;
      const deathProgress = anim === 'death' ? frameX / 9 : 0;

      // 影
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // メインボディ
      const bodyColor = hitFlash ? '#FFFFFF' : color;
      ctx.fillStyle = bodyColor;
      
      if (emoji.includes('🗿') || emoji.includes('🪨')) {
        // ゴーレム：岩っぽい
        ctx.beginPath();
        ctx.moveTo(-12, 4);
        ctx.lineTo(-10, -8);
        ctx.lineTo(0, -12);
        ctx.lineTo(10, -8);
        ctx.lineTo(12, 4);
        ctx.lineTo(8, 10);
        ctx.lineTo(-8, 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 目
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-5, -4, 3, 3);
        ctx.fillRect(2, -4, 3, 3);
      } else if (emoji.includes('🐉') || emoji.includes('🐲')) {
        // ドラゴン
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // 翼
        ctx.fillStyle = hitFlash ? '#FFFFFF' : this.adjustColor(color, -30);
        ctx.beginPath();
        ctx.moveTo(-14, -2);
        ctx.lineTo(-20, -10);
        ctx.lineTo(-10, 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(14, -2);
        ctx.lineTo(20, -10);
        ctx.lineTo(10, 2);
        ctx.closePath();
        ctx.fill();
        // 目
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-6, -4, 4, 4);
        ctx.fillRect(2, -4, 4, 4);
        // 角
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(-8, -10);
        ctx.lineTo(-10, -16);
        ctx.lineTo(-6, -10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, -10);
        ctx.lineTo(10, -16);
        ctx.lineTo(6, -10);
        ctx.fill();
      } else if (emoji.includes('🧙')) {
        // 魔導師
        // ローブ
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-10, -2);
        ctx.lineTo(0, -14);
        ctx.lineTo(10, -2);
        ctx.lineTo(8, 10);
        ctx.lineTo(-8, 10);
        ctx.closePath();
        ctx.fill();
        // 帽子
        ctx.fillStyle = hitFlash ? '#FFFFFF' : this.adjustColor(color, -20);
        ctx.beginPath();
        ctx.moveTo(-8, -6);
        ctx.lineTo(0, -16);
        ctx.lineTo(8, -6);
        ctx.closePath();
        ctx.fill();
        // 杖
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(10, -10, 3, 20);
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(11.5, -12, 4, 0, Math.PI * 2);
        ctx.fill();
        // 目
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-4, -4, 2, 2);
        ctx.fillRect(2, -4, 2, 2);
      } else if (emoji.includes('🔥') || emoji.includes('🐦') || emoji.includes('🌅')) {
        // フェニックス
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // 炎の羽
        ctx.fillStyle = hitFlash ? '#FFFFFF' : '#F97316';
        for (let i = -1; i <= 1; i += 2) {
          ctx.beginPath();
          ctx.moveTo(i * 8, -2);
          ctx.lineTo(i * 16, -12 + Math.sin(frameX) * 4);
          ctx.lineTo(i * 10, 2);
          ctx.closePath();
          ctx.fill();
        }
        // 炎の尻尾
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(-4, 16);
        ctx.lineTo(4, 16);
        ctx.closePath();
        ctx.fill();
        // 目
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-3, -3, 2, 2);
        ctx.fillRect(1, -3, 2, 2);
      } else if (emoji.includes('🗿') || emoji.includes('🏔️') || emoji.includes('🌍')) {
        // タイタン
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(-12, -6, 24, 20, 4);
        ctx.fill();
        // 腕
        ctx.fillRect(-16 + (anim === 'hit' ? -4 : 0), -2, 8, 12);
        ctx.fillRect(8 + (anim === 'hit' ? 4 : 0), -2, 8, 12);
        // 目
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-5, -2, 4, 4);
        ctx.fillRect(1, -2, 4, 4);
      } else if (emoji.includes('💪') || emoji.includes('🤺') || emoji.includes('⚔️')) {
        // バーサーカー
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        // 筋肉
        ctx.fillStyle = hitFlash ? '#FFFFFF' : this.adjustColor(color, 20);
        ctx.beginPath();
        ctx.ellipse(-6, 0, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, 0, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // 武器
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(10, -8, 4, 16);
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(12, -10);
        ctx.lineTo(16, -16);
        ctx.lineTo(10, -10);
        ctx.fill();
        // 目
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-4, -3, 3, 3);
        ctx.fillRect(1, -3, 3, 3);
      } else if (emoji.includes('🐱') || emoji.includes('😺') || emoji.includes('🎨')) {
        // ネコマタ
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // 耳
        ctx.fillStyle = hitFlash ? '#FFFFFF' : this.adjustColor(color, -20);
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(-12, -18);
        ctx.lineTo(-4, -8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, -8);
        ctx.lineTo(12, -18);
        ctx.lineTo(4, -8);
        ctx.fill();
        // 尻尾（二股）
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(10, 4);
        ctx.lineTo(16, 8);
        ctx.lineTo(14, 10);
        ctx.lineTo(10, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, 4);
        ctx.lineTo(16, 0);
        ctx.lineTo(14, 2);
        ctx.lineTo(10, 4);
        ctx.fill();
        // 目
        ctx.fillStyle = '#1F2937';
        ctx.fillRect(-4, -3, 3, 5);
        ctx.fillRect(1, -3, 3, 5);
        // ひげ
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(-6, -1 + i * 3);
          ctx.lineTo(-10, -2 + i * 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(6, -1 + i * 3);
          ctx.lineTo(10, -2 + i * 3);
          ctx.stroke();
        }
      }

      // 死亡アニメーション
      if (anim === 'death') {
        ctx.globalAlpha = 1 - deathProgress;
        ctx.fillStyle = '#6B7280';
        ctx.fillRect(-16, -16, 32, 32);
      }

      ctx.restore();
    };

    // アイドル (行0, 10フレーム)
    for (let i = 0; i < 10; i++) {
      drawMonster(i, 0, 'idle');
    }
    // ヒット (行1, 2フレーム)
    drawMonster(0, 1, 'hit');
    drawMonster(1, 1, 'hit');
    // 死亡 (行2, 10フレーム)
    for (let i = 0; i < 10; i++) {
      drawMonster(i, 2, 'death');
    }

    this.textureManager.addCanvas(name, canvas);
  }

  private generateMonsterSpritesheets(): void {
    const monsters = [
      { name: 'monster-golem', color: '#3B82F6', emoji: '🗿' },
      { name: 'monster-dragon', color: '#8B5CF6', emoji: '🐉' },
      { name: 'monster-mage', color: '#EC4899', emoji: '🧙' },
      { name: 'monster-phoenix', color: '#F97316', emoji: '🔥' },
      { name: 'monster-titan', color: '#10B981', emoji: '🗿' },
      { name: 'monster-berserker', color: '#EF4444', emoji: '💪' },
      { name: 'monster-nekomata', color: '#F59E0B', emoji: '🐱' },
    ];
    
    monsters.forEach(m => this.generateMonsterSpritesheet(m.name, m.color, m.emoji));
  }

  private adjustColor(color: string, amount: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0xFF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  // ===== 建物スプライト =====
  private generateBuildingSprites(): void {
    const buildings = [
      { name: 'building-bulletin', color: '#8B5CF6', icon: '📋', accent: '#F59E0B' },
      { name: 'building-library', color: '#3B82F6', icon: '📚', accent: '#60A5FA' },
      { name: 'building-forge', color: '#EF4444', icon: '⚒️', accent: '#F97316' },
      { name: 'building-shop', color: '#10B981', icon: '🏪', accent: '#34D399' },
      { name: 'building-training', color: '#F59E0B', icon: '🏃', accent: '#FBBF24' },
      { name: 'building-guild', color: '#6B46C1', icon: '🏰', accent: '#A78BFA' },
    ];

    buildings.forEach(b => {
      const size = 64;
      const canvas = this.scene.make.canvas({ width: size, height: size, add: false }) as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      const cx = size / 2;
      const cy = size / 2;

      // 影
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(cx, size - 4, 24, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 建物本体
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, this.adjustColor(b.color, 30));
      gradient.addColorStop(1, this.adjustColor(b.color, -30));
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - 24, cy - 28, 48, 36);

      // 屋根
      ctx.fillStyle = this.adjustColor(b.color, -40);
      ctx.beginPath();
      ctx.moveTo(cx - 28, cy - 28);
      ctx.lineTo(cx, cy - 44);
      ctx.lineTo(cx + 28, cy - 28);
      ctx.closePath();
      ctx.fill();

      // ドア
      ctx.fillStyle = '#374151';
      ctx.fillRect(cx - 8, cy, 16, 20);
      // ドアノブ
      ctx.fillStyle = b.accent;
      ctx.beginPath();
      ctx.arc(cx + 4, cy + 10, 2, 0, Math.PI * 2);
      ctx.fill();

      // 窓
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(cx - 20, cy - 20, 10, 12);
      ctx.fillRect(cx + 10, cy - 20, 10, 12);
      // 窓枠
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 20, cy - 20, 10, 12);
      ctx.strokeRect(cx + 10, cy - 20, 10, 12);

      // アイコン表示
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.icon, cx, cy - 36);

      // アクセントライン
      ctx.fillStyle = b.accent;
      ctx.fillRect(cx - 24, cy - 30, 48, 3);

      this.textureManager.addCanvas(b.name, canvas);
    });
  }

  // ===== UIスプライト =====
  private generateUISprites(): void {
    // パネル
    this.generatePanel();
    // ボタン
    this.generateButton();
    // XPバー
    this.generateXPBar();
    // HPバー
    this.generateHPBar();
    // ジョイスティック
    this.generateJoystick();
  }

  private generatePanel(): void {
    const canvas = this.scene.make.canvas({ width: 200, height: 100, add: false }) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const r = 10;
    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 200, 100, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(107, 70, 193, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    this.textureManager.addCanvas('ui-panel', canvas);
  }

  private generateButton(): void {
    const canvas = this.scene.make.canvas({ width: 180, height: 50, add: false }) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const r = 10;
    const gradient = ctx.createLinearGradient(0, 0, 0, 50);
    gradient.addColorStop(0, '#6B46C1');
    gradient.addColorStop(1, '#5a3abf');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, 180, 50, r);
    ctx.fill();
    // ハイライト
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.roundRect(2, 2, 176, 20, r);
    ctx.fill();
    this.textureManager.addCanvas('ui-button', canvas);
  }

  private generateXPBar(): void {
    const canvas = this.scene.make.canvas({ width: 300, height: 20, add: false }) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 300, 20);
    // 進捗（サンプル50%）
    const gradient = ctx.createLinearGradient(0, 0, 300, 0);
    gradient.addColorStop(0, '#8B5CF6');
    gradient.addColorStop(1, '#A78BFA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 150, 20);
    // 光沢
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(0, 0, 150, 8);
    this.textureManager.addCanvas('ui-xpbar', canvas);
  }

  private generateHPBar(): void {
    const canvas = this.scene.make.canvas({ width: 150, height: 12, add: false }) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 150, 12);
    const gradient = ctx.createLinearGradient(0, 0, 150, 0);
    gradient.addColorStop(0, '#10B981');
    gradient.addColorStop(1, '#34D399');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 120, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(0, 0, 120, 5);
    this.textureManager.addCanvas('ui-hpbar', canvas);
  }

  private generateJoystick(): void {
    // ベース
    const baseCanvas = this.scene.make.canvas({ width: 120, height: 120, add: false }) as HTMLCanvasElement;
    const bctx = baseCanvas.getContext('2d')!;
    bctx.fillStyle = 'rgba(0,0,0,0.3)';
    bctx.beginPath();
    bctx.arc(60, 60, 60, 0, Math.PI * 2);
    bctx.fill();
    // リング
    bctx.strokeStyle = 'rgba(107,70,193,0.5)';
    bctx.lineWidth = 3;
    bctx.beginPath();
    bctx.arc(60, 60, 55, 0, Math.PI * 2);
    bctx.stroke();
    this.textureManager.addCanvas('joystick-base', baseCanvas);

    // スティック
    const stickCanvas = this.scene.make.canvas({ width: 60, height: 60, add: false }) as HTMLCanvasElement;
    const sctx = stickCanvas.getContext('2d')!;
    const gradient = sctx.createRadialGradient(30, 30, 0, 30, 30, 30);
    gradient.addColorStop(0, '#A78BFA');
    gradient.addColorStop(1, '#6B46C1');
    sctx.fillStyle = gradient;
    sctx.beginPath();
    sctx.arc(30, 30, 30, 0, Math.PI * 2);
    sctx.fill();
    // ハイライト
    sctx.fillStyle = 'rgba(255,255,255,0.4)';
    sctx.beginPath();
    sctx.arc(25, 25, 10, 0, Math.PI * 2);
    sctx.fill();
    this.textureManager.addCanvas('joystick-stick', stickCanvas);
  }

  // ===== エフェクトスプライト =====
  private generateEffectSprites(): void {
    this.generateParticle();
    this.generateExplosion();
    this.generateHitEffect();
  }

  private generateParticle(): void {
    const canvas = this.scene.make.canvas({ width: 8, height: 8, add: false }) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(4, 4, 4, 0, Math.PI * 2);
    ctx.fill();
    this.textureManager.addCanvas('particle', canvas);
  }

  private generateExplosion(): void {
    const frameCount = 16;
    const frameSize = 64;
    const canvas = this.scene.make.canvas({ 
      width: frameSize * frameCount, 
      height: frameSize, 
      add: false 
    }) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    for (let i = 0; i < frameCount; i++) {
      const progress = i / (frameCount - 1);
      const x = i * frameSize;
      const cx = x + frameSize / 2;
      const cy = frameSize / 2;
      const maxRadius = 30;

      ctx.save();
      ctx.translate(cx, cy);

      // 外側のリング
      ctx.strokeStyle = `rgba(245, 158, 11, ${1 - progress})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, maxRadius * progress, 0, Math.PI * 2);
      ctx.stroke();

      // 中間リング
      ctx.strokeStyle = `rgba(139, 92, 246, ${1 - progress})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, maxRadius * progress * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      // 内側のフラッシュ
      if (progress < 0.3) {
        ctx.fillStyle = `rgba(255,255,255,${1 - progress * 3})`;
        ctx.beginPath();
        ctx.arc(0, 0, maxRadius * progress * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // パーティクル
      ctx.fillStyle = `rgba(245, 158, 11, ${1 - progress})`;
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const dist = maxRadius * progress * (0.5 + Math.random() * 0.5);
        ctx.beginPath();
        ctx.arc(
          Math.cos(angle) * dist,
          Math.sin(angle) * dist,
          3 * (1 - progress),
          0, Math.PI * 2
        );
        ctx.fill();
      }

      ctx.restore();
    }

    this.textureManager.addCanvas('explosion', canvas);
  }

  private generateHitEffect(): void {
    const frameCount = 8;
    const frameSize = 32;
    const canvas = this.scene.make.canvas({ 
      width: frameSize * frameCount, 
      height: frameSize, 
      add: false 
    }) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    for (let i = 0; i < frameCount; i++) {
      const progress = i / (frameCount - 1);
      const x = i * frameSize;
      const cx = x + frameSize / 2;
      const cy = frameSize / 2;

      ctx.save();
      ctx.translate(cx, cy);

      // 十字形のフラッシュ
      ctx.fillStyle = `rgba(255,255,255,${1 - progress})`;
      const size = 16 * (1 - progress * 0.5);
      ctx.fillRect(-size/2, -2, size, 4);
      ctx.fillRect(-2, -size/2, 4, size);

      // 外側のリング
      ctx.strokeStyle = `rgba(239, 68, 68, ${1 - progress})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 12 * (1 + progress), 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    this.textureManager.addCanvas('hit-effect', canvas);
  }

  // ===== アイテムスプライト =====
  private generateItemSprites(): void {
    const items = [
      { name: 'item-xp-book', color: '#8B5CF6', emoji: '📖', glow: '#A78BFA' },
      { name: 'item-gold-apple', color: '#F59E0B', emoji: '🍎', glow: '#FBBF24' },
      { name: 'item-sage-staff', color: '#6B46C1', emoji: '🪄', glow: '#A78BFA' },
      { name: 'item-arcadia-star', color: '#F59E0B', emoji: '⭐', glow: '#FBBF24' },
    ];

    items.forEach(item => {
      const canvas = this.scene.make.canvas({ width: 48, height: 48, add: false }) as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      const cx = 24;
      const cy = 24;

      // 影
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(cx, 40, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // 光る背景
      const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
      glowGradient.addColorStop(0, item.glow + '80');
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();

      // アイテム本体
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.emoji, cx, cy);

      // レアリティ枠
      ctx.strokeStyle = item.glow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.stroke();

      this.textureManager.addCanvas(item.name, canvas);
    });
  }

  // ===== タイルセット =====
  private generateTileset(): void {
    const tileSize = 32;
    const cols = 16;
    const rows = 16;
    const canvas = this.scene.make.canvas({ 
      width: tileSize * cols, 
      height: tileSize * rows, 
      add: false 
    }) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    const drawTile = (x: number, y: number, type: string) => {
      const tx = x * tileSize;
      const ty = y * tileSize;
      ctx.save();
      ctx.translate(tx, ty);

      switch (type) {
        case 'grass':
          // 芝生
          ctx.fillStyle = '#2D7D32';
          ctx.fillRect(0, 0, tileSize, tileSize);
          // 草のディテール
          ctx.fillStyle = '#388E3C';
          for (let i = 0; i < 8; i++) {
            const gx = Math.random() * tileSize;
            const gy = Math.random() * tileSize;
            ctx.fillRect(gx, gy, 2, 2);
          }
          break;
        case 'dirt':
          // 土
          ctx.fillStyle = '#8D6E63';
          ctx.fillRect(0, 0, tileSize, tileSize);
          ctx.fillStyle = '#6D4C41';
          for (let i = 0; i < 12; i++) {
            ctx.fillRect(Math.random() * tileSize, Math.random() * tileSize, 1, 1);
          }
          break;
        case 'path':
          // 道
          ctx.fillStyle = '#D7CCC8';
          ctx.fillRect(0, 0, tileSize, tileSize);
          ctx.strokeStyle = '#BCAAA4';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, tileSize/2);
          ctx.lineTo(tileSize, tileSize/2);
          ctx.stroke();
          break;
        case 'water':
          // 水
          const wGradient = ctx.createLinearGradient(0, 0, 0, tileSize);
          wGradient.addColorStop(0, '#1565C0');
          wGradient.addColorStop(1, '#0D47A1');
          ctx.fillStyle = wGradient;
          ctx.fillRect(0, 0, tileSize, tileSize);
          // 波紋
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(tileSize/2, tileSize/2, 4 + i * 6, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case 'tree':
          // 木
          // 幹
          ctx.fillStyle = '#5D4037';
          ctx.fillRect(tileSize/2 - 4, tileSize/2, 8, 16);
          // 葉
          ctx.fillStyle = '#2E7D32';
          ctx.beginPath();
          ctx.arc(tileSize/2, tileSize/2 - 4, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#388E3C';
          ctx.beginPath();
          ctx.arc(tileSize/2 - 4, tileSize/2 - 8, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(tileSize/2 + 4, tileSize/2 - 8, 10, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'building-floor':
          ctx.fillStyle = '#E0E0E0';
          ctx.fillRect(0, 0, tileSize, tileSize);
          ctx.strokeStyle = '#BDBDBD';
          ctx.lineWidth = 1;
          for (let i = 0; i <= tileSize; i += 8) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, tileSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(tileSize, i);
            ctx.stroke();
          }
          break;
        case 'building-wall':
          ctx.fillStyle = '#757575';
          ctx.fillRect(0, 0, tileSize, tileSize);
          // レンガパターン
          ctx.strokeStyle = '#616161';
          ctx.lineWidth = 1;
          for (let y = 0; y < tileSize; y += 8) {
            for (let x = (y % 16 === 0 ? 0 : -4); x < tileSize; x += 16) {
              ctx.strokeRect(x, y, 16, 8);
            }
          }
          break;
        default:
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, tileSize, tileSize);
      }

      ctx.restore();
    };

    // タイル配置
    // 行0-3: 基本地形
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < cols; x++) {
        if (y === 0) drawTile(x, y, 'grass');
        else if (y === 1) drawTile(x, y, 'dirt');
        else if (y === 2) drawTile(x, y, 'path');
        else drawTile(x, y, 'water');
      }
    }
    // 行4-7: 木
    for (let y = 4; y < 8; y++) {
      for (let x = 0; x < cols; x++) {
        drawTile(x, y, 'tree');
      }
    }
    // 行8-11: 建物床
    for (let y = 8; y < 12; y++) {
      for (let x = 0; x < cols; x++) {
        drawTile(x, y, 'building-floor');
      }
    }
    // 行12-15: 建物壁
    for (let y = 12; y < 16; y++) {
      for (let x = 0; x < cols; x++) {
        drawTile(x, y, 'building-wall');
      }
    }

    this.textureManager.addCanvas('tileset', canvas);
  }
}

// BootSceneで呼び出す用の関数
export function generateAllAssets(scene: Phaser.Scene): void {
  const generator = new AssetGenerator(scene);
  generator.generateAll();
}
