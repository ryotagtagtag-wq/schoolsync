import { Container, Graphics, Text, TextStyle, Sprite, Texture } from 'pixi.js';
import { Scene } from '../SceneManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

interface PlayerState {
  userId: string;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  streak: number;
  title: string;
  stats?: { int: number; wis: number; str: number; end: number; cre: number; soc: number };
  facilities?: Array<{ facilityId: string; level: number }>;
}

export class UIScene implements Scene {
  name: 'ui' = 'ui';
  container = new Container();
  
  private playerData: PlayerState = {
    userId: '', level: 1, xp: 0, xpToNext: 100, gold: 0, streak: 0, title: '見習い',
    stats: { int: 0, wis: 0, str: 0, end: 0, cre: 0, soc: 0 }
  };
  
  private xpBar!: Graphics;
  private xpText!: Text;
  private goldText!: Text;
  private streakText!: Text;
  private levelText!: Text;
  private titleText!: Text;

  create(): void {
    this.createHUD();
  }

  private createHUD(): void {
    const topBar = new Graphics();
    topBar.rect(0, 0, GAME_WIDTH, 80).fill({ color: 0x1a1a2e, alpha: 0.95 });
    topBar.stroke({ width: 2, color: 0x6B46C1, alpha: 0.5 });
    this.container.addChild(topBar);

    this.levelText = new Text('Lv. 1', new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 20, fontWeight: 'bold', fill: 0xF59E0B
    }));
    this.levelText.position.set(20, 10);
    this.container.addChild(this.levelText);

    this.titleText = new Text('見習い', new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 14, fill: 0xA78BFA
    }));
    this.titleText.position.set(20, 40);
    this.container.addChild(this.titleText);

    const xpBg = new Graphics();
    xpBg.roundRect(150, 15, 300, 20, 10).fill({ color: 0x000000, alpha: 0.5 });
    this.container.addChild(xpBg);

    this.xpBar = new Graphics();
    this.xpBar.position.set(150, 15);
    this.container.addChild(this.xpBar);

    this.xpText = new Text('0 / 100', new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 12, fill: 0xFFFFFF
    }));
    this.xpText.anchor.set(0.5);
    this.xpText.position.set(300, 25);
    this.container.addChild(this.xpText);

    const goldIcon = new Text('🪙', new TextStyle({ fontSize: 20 }));
    goldIcon.position.set(GAME_WIDTH - 200, 15);
    this.container.addChild(goldIcon);

    this.goldText = new Text('0', new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 18, fontWeight: 'bold', fill: 0xF59E0B
    }));
    this.goldText.anchor.set(1, 0);
    this.goldText.position.set(GAME_WIDTH - 220, 15);
    this.container.addChild(this.goldText);

    const streakIcon = new Text('🔥', new TextStyle({ fontSize: 20 }));
    streakIcon.position.set(GAME_WIDTH - 350, 15);
    this.container.addChild(streakIcon);

    this.streakText = new Text('0日', new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 16, fill: 0xEF4444
    }));
    this.streakText.anchor.set(1, 0);
    this.streakText.position.set(GAME_WIDTH - 370, 15);
    this.container.addChild(this.streakText);

    this.createMiniStats();
  }

  private createMiniStats(): void {
    const statNames = [
      { key: 'int', label: '知力', icon: '🧠', color: 0x3B82F6 },
      { key: 'wis', label: '精神', icon: '🔮', color: 0x8B5CF6 },
      { key: 'str', label: '腕力', icon: '💪', color: 0xEF4444 },
      { key: 'end', label: '耐久', icon: '🛡️', color: 0x10B981 },
      { key: 'cre', label: '創造', icon: '🎨', color: 0xF59E0B },
      { key: 'soc', label: '社交', icon: '💬', color: 0xEC4899 },
    ];

    statNames.forEach((stat, i) => {
      const x = 20 + i * 100;
      const y = GAME_HEIGHT - 60;

      const bg = new Graphics();
      bg.roundRect(x - 5, y - 5, 90, 50, 8).fill({ color: 0x1a1a2e, alpha: 0.8 });
      bg.stroke({ width: 1, color: stat.color, alpha: 0.5 });
      this.container.addChild(bg);

      const icon = new Text(stat.icon, new TextStyle({ fontSize: 20 }));
      icon.position.set(x + 5, y);
      this.container.addChild(icon);

      const label = new Text(stat.label, new TextStyle({
        fontFamily: 'Noto Sans JP', fontSize: 10, fill: 0xAAAAAA
      }));
      label.position.set(x + 30, y);
      this.container.addChild(label);

      const valueText = new Text('0', new TextStyle({
        fontFamily: 'Noto Sans JP', fontSize: 16, fontWeight: 'bold', fill: stat.color
      }));
      valueText.anchor.set(0.5, 0);
      valueText.position.set(x + 45, y + 20);
      (valueText as any).statKey = stat.key;
      this.container.addChild(valueText);
    });
  }

  private updateXPBar(): void {
    this.xpBar.clear();
    const ratio = this.playerData.xpToNext > 0 ? this.playerData.xp / this.playerData.xpToNext : 0;
    this.xpBar.roundRect(0, 0, 300 * ratio, 20, 10).fill(0x8B5CF6);
    this.xpBar.roundRect(0, 0, 300 * ratio, 8).fill({ color: 0xFFFFFF, alpha: 0.3 });
    this.xpText.text = `${this.playerData.xp.toLocaleString()} / ${this.playerData.xpToNext.toLocaleString()}`;
  }

  update(delta: number): void {}

  onUpdatePlayerData(data: PlayerState): void {
    this.playerData = data;
    this.levelText.text = `Lv. ${data.level}`;
    this.titleText.text = data.title;
    this.goldText.text = data.gold.toLocaleString;
    this.streakText.text = `${data.streak}日`;
    this.updateXPBar();

    if (data.stats) {
      for (const child of this.container.children) {
        if ((child as any).statKey && data.stats[(child as any).statKey]) {
          child.text = data.stats[(child as any).statKey].toString();
        }
      }
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
