import { Graphics, Texture, BaseTexture, Sprite, Container, Point } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, FACILITIES, type FacilityData } from './config';

export class AssetGenerator {
  private app: any;

  constructor(app: any) {
    this.app = app;
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

    const container = new Container();
    
    const colors = {
      hair: 0x8B4513,
      skin: 0xFFDBAC,
      shirt: 0x6B46C1,
      pants: 0x1F2937,
      shoes: 0x374151,
      outline: 0x111827,
    };

    function drawCharacter(frameX: number, frameY: number, direction: 'down' | 'up' | 'left' | 'right', walking: boolean): void {
      const graphics = new Graphics();
      const x = frameX * frameWidth;
      const y = frameY * frameHeight;
      const cx = x + frameWidth / 2;
      const cy = y + frameHeight / 2;

      graphics.position.set(cx, cy);

      if (direction === 'left' || direction === 'right') {
        graphics.scale.x = direction === 'left' ? -1 : 1;
      }

      const armSwing = walking ? Math.sin(frameX * Math.PI / 2) * 4 : 0;
      const legSwing = walking ? Math.sin(frameX * Math.PI / 2) * 3 : 0;

      graphics.ellipse(0, 14, 10, 3).fill({ color: 0x000000, alpha: 0.2 });
      graphics.rect(-8, -4, 16, 14).fill(colors.shirt).stroke({ width: 1, color: colors.outline });
      graphics.rect(-12 + armSwing, -2, 6, 10).fill(colors.shirt).stroke({ width: 1, color: colors.outline });
      graphics.rect(6 - armSwing, -2, 6, 10).fill(colors.shirt).stroke({ width: 1, color: colors.outline });
      graphics.rect(-6, 10 + legSwing, 5, 8).fill(colors.pants).stroke({ width: 1, color: colors.outline });
      graphics.rect(1, 10 - legSwing, 5, 8).fill(colors.pants).stroke({ width: 1, color: colors.outline });
      graphics.rect(-6, 18 + legSwing, 5, 3).fill(colors.shoes);
      graphics.rect(1, 18 - legSwing, 5, 3).fill(colors.shoes);
      graphics.circle(0, -10, 8).fill(colors.skin).stroke({ width: 1, color: colors.outline });
      graphics.arc(0, -14, 9, Math.PI, 0, true).lineTo(9, -10).arc(0, -10, 9, 0, Math.PI, true).fill(colors.hair);
      graphics.rect(-4, -12, 2, 2).fill(colors.outline);
      graphics.rect(2, -12, 2, 2).fill(colors.outline);
      if (direction === 'down') {
        graphics.rect(-1, -8, 2, 1).fill(colors.outline);
      }
      container.addChild(graphics);
    }

    const directions: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
    directions.forEach((dir: 'down' | 'up' | 'left' | 'right', row: number) => {
      for (let i = 0; i < 3; i++) drawCharacter(i, row, dir, false);
      for (let i = 3; i < 9; i++) drawCharacter(i, row, dir, true);
    });

    for (let i = 0; i < 4; i++) {
      drawCharacter(i, 4, 'right', false);
      const graphics = new Graphics();
      const x = i * frameWidth + frameWidth / 2;
      const y = 4 * frameHeight + frameHeight / 2;
      graphics.position.set(x, y);
      graphics.rect(-8, -4, 16, 14).fill(colors.shirt).stroke({ width: 1, color: colors.outline });
      graphics.rect(6, -2 + Math.sin(i * Math.PI / 2) * 4, 10, 6).fill(colors.shirt).stroke({ width: 1, color: colors.outline });
      container.addChild(graphics);
    }

    const texture = this.app.renderer.generateTexture(container, { resolution: 1 });
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const frameTexture = new Texture(texture.baseTexture, {
          x: col * frameWidth,
          y: row * frameHeight,
          width: frameWidth,
          height: frameHeight,
        });
        Texture.addToCache(frameTexture, `player_${row}_${col}`);
      }
    }
    Texture.addToCache(texture, 'player');
  }
  // ===== モンスタースプライトシート =====
  private generateMonsterSpritesheet(name: string, color: number, emoji: string): void {
    const frameWidth = 32;
    const frameHeight = 32;
    const cols = 10;
    const rows = 3;

    const container = new Container();

    const drawMonster = (frameX: number, frameY: number, anim: 'idle' | 'hit' | 'death') => {
      const graphics = new Graphics();
      const x = frameX * frameWidth;
      const y = frameY * frameHeight;
      const cx = x + frameWidth / 2;
      const cy = y + frameHeight / 2;

      graphics.position.set(cx, cy);

      const bob = anim === 'idle' ? Math.sin(frameX * Math.PI) * 2 : 0;
      const hitFlash = anim === 'hit' ? 1 : 0;
      const deathProgress = anim === 'death' ? frameX / 9 : 0;

      // 影
      graphics.ellipse(0, 12, 12, 4).fill({ color: 0x000000, alpha: 0.3 });

      const bodyColor = hitFlash ? 0xFFFFFF : color;
      graphics.beginPath();
      graphics.fillStyle(bodyColor);
      
      if (emoji.includes('🗿') || emoji.includes('🪨')) {
        // ゴーレム：岩っぽい
        graphics.moveTo(-12, 4).lineTo(-10, -8).lineTo(0, -12).lineTo(10, -8).lineTo(12, 4).lineTo(8, 10).lineTo(-8, 10).closePath().fill().stroke({ width: 2, color: 0x374151 });
        graphics.rect(-5, -4, 3, 3).fill(0xF59E0B);
        graphics.rect(2, -4, 3, 3).fill(0xF59E0B);
      } else if (emoji.includes('🐉') || emoji.includes('🐲')) {
        // ドラゴン
        graphics.ellipse(0, 0, 14, 10).fill();
        graphics.moveTo(-14, -2).lineTo(-20, -10).lineTo(-10, 2).closePath().fill(hitFlash ? 0xFFFFFF : this.adjustColor(color, -30)).stroke({ width: 1, color: 0x374151 });
        graphics.moveTo(14, -2).lineTo(20, -10).lineTo(10, 2).closePath().fill(hitFlash ? 0xFFFFFF : this.adjustColor(color, -30)).stroke({ width: 1, color: 0x374151 });
        graphics.rect(-6, -4, 4, 4).fill(0xEF4444);
        graphics.rect(2, -4, 4, 4).fill(0xEF4444);
        graphics.moveTo(-8, -10).lineTo(-10, -16).lineTo(-6, -10).closePath().fill(0xF59E0B);
        graphics.moveTo(8, -10).lineTo(10, -16).lineTo(6, -10).closePath().fill(0xF59E0B);
      } else if (emoji.includes('🧙')) {
        // 魔導師
        graphics.moveTo(-10, -2).lineTo(0, -14).lineTo(10, -2).lineTo(8, 10).lineTo(-8, 10).closePath().fill();
        graphics.moveTo(-8, -6).lineTo(0, -16).lineTo(8, -6).closePath().fill(hitFlash ? 0xFFFFFF : this.adjustColor(color, -20));
        graphics.rect(10, -10, 3, 20).fill(0x8B4513);
        graphics.circle(11.5, -12, 4).fill(0xF59E0B);
        graphics.rect(-4, -4, 2, 2).fill(0xFFFFFF);
        graphics.rect(2, -4, 2, 2).fill(0xFFFFFF);
      } else if (emoji.includes('🔥') || emoji.includes('🐦') || emoji.includes('🌅')) {
        // フェニックス
        graphics.ellipse(0, 0, 12, 10).fill();
        for (let i = -1; i <= 1; i += 2) {
          graphics.moveTo(i * 8, -2).lineTo(i * 16, -12 + Math.sin(frameX) * 4).lineTo(i * 10, 2).closePath().fill(hitFlash ? 0xFFFFFF : 0xF97316);
        }
        graphics.moveTo(0, 8).lineTo(-4, 16).lineTo(4, 16).closePath().fill(hitFlash ? 0xFFFFFF : 0xF97316);
        graphics.rect(-3, -3, 2, 2).fill(0xFFFFFF);
        graphics.rect(1, -3, 2, 2).fill(0xFFFFFF);
      } else if (emoji.includes('🗿') || emoji.includes('🏔️') || emoji.includes('🌍')) {
        // タイタン
        graphics.roundRect(-12, -6, 24, 20, 4).fill();
        graphics.rect(-16 + (anim === 'hit' ? -4 : 0), -2, 8, 12).fill();
        graphics.rect(8 + (anim === 'hit' ? 4 : 0), -2, 8, 12).fill();
        graphics.rect(-5, -2, 4, 4).fill(0xF59E0B);
        graphics.rect(1, -2, 4, 4).fill(0xF59E0B);
      } else if (emoji.includes('💪') || emoji.includes('🤺') || emoji.includes('⚔️')) {
        // バーサーカー
        graphics.ellipse(0, 0, 13, 11).fill();
        graphics.ellipse(-6, 0, 5, 7).fill(hitFlash ? 0xFFFFFF : this.adjustColor(color, 20));
        graphics.ellipse(6, 0, 5, 7).fill(hitFlash ? 0xFFFFFF : this.adjustColor(color, 20));
        graphics.rect(10, -8, 4, 16).fill(0x8B4513);
        graphics.moveTo(12, -10).lineTo(16, -16).lineTo(10, -10).closePath().fill(0xEF4444);
        graphics.rect(-4, -3, 3, 3).fill(0xFFFFFF);
        graphics.rect(1, -3, 3, 3).fill(0xFFFFFF);
      } else if (emoji.includes('🐱') || emoji.includes('😺') || emoji.includes('🎨')) {
        // ネコマタ
        graphics.ellipse(0, 0, 11, 10).fill();
        graphics.moveTo(-8, -8).lineTo(-12, -18).lineTo(-4, -8).closePath().fill(hitFlash ? 0xFFFFFF : this.adjustColor(color, -20));
        graphics.moveTo(8, -8).lineTo(12, -18).lineTo(4, -8).closePath().fill(hitFlash ? 0xFFFFFF : this.adjustColor(color, -20));
        graphics.moveTo(10, 4).lineTo(16, 8).lineTo(14, 10).lineTo(10, 4).closePath().fill();
        graphics.moveTo(10, 4).lineTo(16, 0).lineTo(14, 2).lineTo(10, 4).closePath().fill();
        graphics.rect(-4, -3, 3, 5).fill(0x1F2937);
        graphics.rect(1, -3, 3, 5).fill(0x1F2937);
        for (let i = 0; i < 3; i++) {
          graphics.moveTo(-6, -1 + i * 3).lineTo(-10, -2 + i * 3).stroke({ width: 1, color: 0x1F2937 });
          graphics.moveTo(6, -1 + i * 3).lineTo(10, -2 + i * 3).stroke({ width: 1, color: 0x1F2937 });
        }
      }

      // 死亡アニメーション
      if (anim === 'death') {
        graphics.globalAlpha = 1 - deathProgress;
        graphics.rect(-16, -16, 32, 32).fill(0x6B7280);
      }

      container.addChild(graphics);
    }

    // アイドル (行0, 10フレーム)
    for (let i = 0; i < 10; i++) drawMonster(i, 0, 'idle');
    // ヒット (行1, 2フレーム)
    drawMonster(0, 1, 'hit');
    drawMonster(1, 1, 'hit');
    // 死亡 (行2, 10フレーム)
    for (let i = 0; i < 10; i++) drawMonster(i, 2, 'death');

    const texture = this.app.renderer.generateTexture(container, { resolution: 1 });
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const frameTexture = new Texture(texture.baseTexture, {
          x: col * frameWidth,
          y: row * frameHeight,
          width: frameWidth,
          height: frameHeight,
        });
        Texture.addToCache(frameTexture, `${name}_${row}_${col}`);
      }
    }
    Texture.addToCache(texture, name);
  }

  private generateMonsterSpritesheets(): void {
    const monsters = [
      { name: 'monster-golem', color: 0x3B82F6, emoji: '🗿' },
      { name: 'monster-dragon', color: 0x8B5CF6, emoji: '🐉' },
      { name: 'monster-mage', color: 0xEC4899, emoji: '🧙' },
      { name: 'monster-phoenix', color: 0xF97316, emoji: '🔥' },
      { name: 'monster-titan', color: 0x10B981, emoji: '🗿' },
      { name: 'monster-berserker', color: 0xEF4444, emoji: '💪' },
      { name: 'monster-nekomata', color: 0xF59E0B, emoji: '🐱' },
    ];
    monsters.forEach(m => this.generateMonsterSpritesheet(m.name, m.color, m.emoji));
  }

  private adjustColor(color: number, amount: number): number {
    const r = Math.max(0, Math.min(255, ((color >> 16) & 0xFF) + amount));
    const g = Math.max(0, Math.min(255, ((color >> 8) & 0xFF) + amount));
    const b = Math.max(0, Math.min(255, (color & 0xFF) + amount));
    return (r << 16) | (g << 8) | b;
  }

  // ===== 建物スプライト =====
  private generateBuildingSprites(): void {
    FACILITIES.forEach(facility => {
      const size = 64;
      const graphics = new Graphics();
      const cx = size / 2;
      const cy = size / 2;
      const color = this.hexToNumber(facility.icon === '📋' ? '#8B5CF6' : 
        facility.icon === '📚' ? '#3B82F6' :
        facility.icon === '⚒️' ? '#EF4444' :
        facility.icon === '🏪' ? '#10B981' :
        facility.icon === '🏃' ? '#F59E0B' : '#6B46C1');
      const accent = this.hexToNumber(facility.icon === '📋' ? '#F59E0B' :
        facility.icon === '📚' ? '#60A5FA' :
        facility.icon === '⚒️' ? '#F97316' :
        facility.icon === '🏪' ? '#34D399' :
        facility.icon === '🏃' ? '#FBBF24' : '#A78BFA');

      // 影
      graphics.ellipse(cx, size - 4, 24, 6).fill({ color: 0x000000, alpha: 0.3 });

      // 建物本体
      graphics.rect(cx - 24, cy - 28, 48, 36).fill({ color, alpha: 1 });
      graphics.rect(cx - 24, cy - 28, 48, 36).stroke({ width: 2, color: this.adjustColor(color, -30) });

      // 屋根
      graphics.moveTo(cx - 28, cy - 28).lineTo(cx, cy - 44).lineTo(cx + 28, cy - 28).closePath().fill(this.adjustColor(color, -40));

      // ドア
      graphics.rect(cx - 8, cy, 16, 20).fill(0x374151);
      graphics.circle(cx + 4, cy + 10, 2).fill(accent);

      // 窓
      graphics.rect(cx - 20, cy - 20, 10, 12).fill(0xFEF3C7).stroke({ width: 1, color: 0x374151 });
      graphics.rect(cx + 10, cy - 20, 10, 12).fill(0xFEF3C7).stroke({ width: 1, color: 0x374151 });

      // アイコン表示（テキストの代わりにシンプルな形状）
      // アクセントライン
      graphics.rect(cx - 24, cy - 30, 48, 3).fill(accent);

      const texture = this.app.renderer.generateTexture(graphics, { resolution: 1 });
      Texture.addToCache(texture, `building-${facility.buildingType}`);
    });
  }

  // ===== UIスプライト =====
  private generateUISprites(): void {
    this.generatePanel();
    this.generateButton();
    this.generateXPBar();
    this.generateHPBar();
    this.generateJoystick();
  }

  private generatePanel(): void {
    const graphics = new Graphics();
    const r = 10;
    graphics.roundRect(0, 0, 200, 100, r).fill({ color: 0x1a1a2e, alpha: 0.9 }).stroke({ width: 2, color: 0x6B46C1, alpha: 0.5 });
    const texture = this.app.renderer.generateTexture(graphics, { resolution: 1 });
    Texture.addToCache(texture, 'ui-panel');
  }

  private generateButton(): void {
    const graphics = new Graphics();
    const r = 10;
    graphics.roundRect(0, 0, 180, 50, r).fill(0x6B46C1);
    graphics.roundRect(2, 2, 176, 20, r).fill({ color: 0xFFFFFF, alpha: 0.2 });
    const texture = this.app.renderer.generateTexture(graphics, { resolution: 1 });
    Texture.addToCache(texture, 'ui-button');
  }

  private generateXPBar(): void {
    const graphics = new Graphics();
    graphics.rect(0, 0, 300, 20).fill({ color: 0x000000, alpha: 0.5 });
    graphics.rect(0, 0, 150, 20).fill(0x8B5CF6);
    graphics.rect(0, 0, 150, 8).fill({ color: 0xFFFFFF, alpha: 0.3 });
    const texture = this.app.renderer.generateTexture(graphics, { resolution: 1 });
    Texture.addToCache(texture, 'ui-xpbar');
  }

  private generateHPBar(): void {
    const graphics = new Graphics();
    graphics.rect(0, 0, 150, 12).fill({ color: 0x000000, alpha: 0.5 });
    graphics.rect(0, 0, 120, 12).fill(0x10B981);
    graphics.rect(0, 0, 120, 5).fill({ color: 0xFFFFFF, alpha: 0.3 });
    const texture = this.app.renderer.generateTexture(graphics, { resolution: 1 });
    Texture.addToCache(texture, 'ui-hpbar');
  }

  private generateJoystick(): void {
    // ベース
    const baseGraphics = new Graphics();
    baseGraphics.circle(60, 60, 60).fill({ color: 0x000000, alpha: 0.3 });
    baseGraphics.circle(60, 60, 55).stroke({ width: 3, color: 0x6B46C1, alpha: 0.5 });
    const baseTexture = this.app.renderer.generateTexture(baseGraphics, { resolution: 1 });
    Texture.addToCache(baseTexture, 'joystick-base');

    // スティック
    const stickGraphics = new Graphics();
    stickGraphics.circle(30, 30, 30).fill(0x6B46C1);
    stickGraphics.circle(25, 25, 10).fill({ color: 0xFFFFFF, alpha: 0.4 });
    const stickTexture = this.app.renderer.generateTexture(stickGraphics, { resolution: 1 });
    Texture.addToCache(stickTexture, 'joystick-stick');
  }

  // ===== エフェクトスプライト =====
  private generateEffectSprites(): void {
    this.generateParticle();
    this.generateExplosion();
    this.generateHitEffect();
  }

  private generateParticle(): void {
    const graphics = new Graphics();
    graphics.circle(4, 4, 4).fill(0xFFFFFF);
    const texture = this.app.renderer.generateTexture(graphics, { resolution: 1 });
    Texture.addToCache(texture, 'particle');
  }

  private generateExplosion(): void {
    const frameCount = 16;
    const frameSize = 64;
    const container = new Container();

    for (let i = 0; i < frameCount; i++) {
      const graphics = new Graphics();
      const progress = i / (frameCount - 1);
      const x = i * frameSize;
      const cx = x + frameSize / 2;
      const cy = frameSize / 2;
      const maxRadius = 30;

      graphics.position.set(cx, cy);

      graphics.circle(0, 0, maxRadius * progress).stroke({ width: 4, color: 0xF59E0B, alpha: 1 - progress });
      graphics.circle(0, 0, maxRadius * progress * 0.7).stroke({ width: 3, color: 0x8B5CF6, alpha: 1 - progress });

      if (progress < 0.3) {
        graphics.circle(0, 0, maxRadius * progress * 1.5).fill({ color: 0xFFFFFF, alpha: 1 - progress * 3 });
      }

      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const dist = maxRadius * progress * (0.5 + Math.random() * 0.5);
        graphics.circle(Math.cos(angle) * dist, Math.sin(angle) * dist, 3 * (1 - progress)).fill({ color: 0xF59E0B, alpha: 1 - progress });
      }

      container.addChild(graphics);
    }

    const texture = this.app.renderer.generateTexture(container, { resolution: 1 });
    for (let i = 0; i < frameCount; i++) {
      const frameTexture = new Texture(texture.baseTexture, {
        x: i * frameSize,
        y: 0,
        width: frameSize,
        height: frameSize,
      });
      Texture.addToCache(frameTexture, `explosion_${i}`);
    }
    Texture.addToCache(texture, 'explosion');
  }

  private generateHitEffect(): void {
    const frameCount = 8;
    const frameSize = 32;
    const container = new Container();

    for (let i = 0; i < frameCount; i++) {
      const graphics = new Graphics();
      const progress = i / (frameCount - 1);
      const x = i * frameSize;
      const cx = x + frameSize / 2;
      const cy = frameSize / 2;

      graphics.position.set(cx, cy);

      const size = 16 * (1 - progress * 0.5);
      graphics.rect(-size/2, -2, size, 4).fill({ color: 0xFFFFFF, alpha: 1 - progress });
      graphics.rect(-2, -size/2, 4, size).fill({ color: 0xFFFFFF, alpha: 1 - progress });

      graphics.circle(0, 0, 12 * (1 + progress)).stroke({ width: 2, color: 0xEF4444, alpha: 1 - progress });

      container.addChild(graphics);
    }

    const texture = this.app.renderer.generateTexture(container, { resolution: 1 });
    for (let i = 0; i < frameCount; i++) {
      const frameTexture = new Texture(texture.baseTexture, {
        x: i * frameSize,
        y: 0,
        width: frameSize,
        height: frameSize,
      });
      Texture.addToCache(frameTexture, `hit-effect_${i}`);
    }
    Texture.addToCache(texture, 'hit-effect');
  }

  // ===== アイテムスプライト =====
  private generateItemSprites(): void {
    const items = [
      { name: 'item-xp-book', color: 0x8B5CF6, emoji: '📖', glow: 0xA78BFA },
      { name: 'item-gold-apple', color: 0xF59E0B, emoji: '🍎', glow: 0xFBBF24 },
      { name: 'item-sage-staff', color: 0x6B46C1, emoji: '🪄', glow: 0xA78BFA },
      { name: 'item-arcadia-star', color: 0xF59E0B, emoji: '⭐', glow: 0xFBBF24 },
    ];

    items.forEach(item => {
      const graphics = new Graphics();
      const cx = 24;
      const cy = 24;

      // 影
      graphics.ellipse(cx, 40, 16, 4).fill({ color: 0x000000, alpha: 0.2 });

      // 光る背景
      graphics.circle(cx, cy, 24).fill({ color: item.glow, alpha: 0.5 });

      // アイテム本体
      graphics.rect(cx - 10, cy - 10, 20, 20).fill(item.color);

      // レアリティ枠
      graphics.circle(cx, cy, 20).stroke({ width: 3, color: item.glow });

      const texture = this.app.renderer.generateTexture(graphics, { resolution: 1 });
      Texture.addToCache(texture, item.name);
    });
  }

  // ===== タイルセット =====
  private generateTileset(): void {
    const tileSize = 32;
    const cols = 16;
    const rows = 16;
    const container = new Container();

    const drawTile = (x: number, y: number, type: string) => {
      const graphics = new Graphics();
      const tx = x * tileSize;
      const ty = y * tileSize;
      graphics.position.set(tx + tileSize / 2, ty + tileSize / 2);

      switch (type) {
        case 'grass':
          graphics.rect(-tileSize/2, -tileSize/2, tileSize, tileSize).fill(0x2D7D32);
          for (let i = 0; i < 8; i++) {
            graphics.rect(Math.random() * tileSize - tileSize/2, Math.random() * tileSize - tileSize/2, 2, 2).fill(0x388E3C);
          }
          break;
        case 'dirt':
          graphics.rect(-tileSize/2, -tileSize/2, tileSize, tileSize).fill(0x8D6E63);
          for (let i = 0; i < 12; i++) {
            graphics.rect(Math.random() * tileSize - tileSize/2, Math.random() * tileSize - tileSize/2, 1, 1).fill(0x6D4C41);
          }
          break;
        case 'path':
          graphics.rect(-tileSize/2, -tileSize/2, tileSize, tileSize).fill(0xD7CCC8);
          graphics.moveTo(-tileSize/2, 0).lineTo(tileSize/2, 0).stroke({ width: 1, color: 0xBCAAA4 });
          break;
        case 'water':
          graphics.rect(-tileSize/2, -tileSize/2, tileSize, tileSize).fill(0x1565C0);
          for (let i = 0; i < 3; i++) {
            graphics.circle(0, 0, 4 + i * 6).stroke({ width: 1, color: 0xFFFFFF, alpha: 0.2 });
          }
          break;
        case 'tree':
          graphics.rect(-4, tileSize/2, 8, 16).fill(0x5D4037);
          graphics.circle(0, -4, 14).fill(0x2E7D32);
          graphics.circle(-4, -8, 10).fill(0x388E3C);
          graphics.circle(4, -8, 10).fill(0x388E3C);
          break;
        case 'building-floor':
          graphics.rect(-tileSize/2, -tileSize/2, tileSize, tileSize).fill(0xE0E0E0);
          for (let i = 0; i <= tileSize; i += 8) {
            graphics.moveTo(i - tileSize/2, -tileSize/2).lineTo(i - tileSize/2, tileSize/2).stroke({ width: 1, color: 0xBDBDBD });
            graphics.moveTo(-tileSize/2, i - tileSize/2).lineTo(tileSize/2, i - tileSize/2).stroke({ width: 1, color: 0xBDBDBD });
          }
          break;
        case 'building-wall':
          graphics.rect(-tileSize/2, -tileSize/2, tileSize, tileSize).fill(0x757575);
          for (let y = 0; y < tileSize; y += 8) {
            for (let x = (y % 16 === 0 ? 0 : -4); x < tileSize; x += 16) {
              graphics.rect(x - tileSize/2, y - tileSize/2, 16, 8).stroke({ width: 1, color: 0x616161 });
            }
          }
          break;
        default:
          graphics.rect(-tileSize/2, -tileSize/2, tileSize, tileSize).fill(0x1a1a2e);
      }

      container.addChild(graphics);
    }

    // タイル配置
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < cols; x++) {
        if (y === 0) drawTile(x, y, 'grass');
        else if (y === 1) drawTile(x, y, 'dirt');
        else if (y === 2) drawTile(x, y, 'path');
        else drawTile(x, y, 'water');
      }
    }
    for (let y = 4; y < 8; y++) {
      for (let x = 0; x < cols; x++) drawTile(x, y, 'tree');
    }
    for (let y = 8; y < 12; y++) {
      for (let x = 0; x < cols; x++) drawTile(x, y, 'building-floor');
    }
    for (let y = 12; y < 16; y++) {
      for (let x = 0; x < cols; x++) drawTile(x, y, 'building-wall');
    }

    const texture = this.app.renderer.generateTexture(container, { resolution: 1 });
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const frameTexture = new Texture(texture.baseTexture, {
          x: col * tileSize,
          y: row * tileSize,
          width: tileSize,
          height: tileSize,
        });
        Texture.addToCache(frameTexture, `tileset_${row}_${col}`);
      }
    }
    Texture.addToCache(texture, 'tileset');
  }

  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }
}

export function generateAllAssets(app: any): void {
  const generator = new AssetGenerator(app);
  generator.generateAll();
}
