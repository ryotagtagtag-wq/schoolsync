import { Container, Graphics, Text, TextStyle, Sprite, Texture } from 'pixi.js';
import { Scene } from '../SceneManager';
import { GAME_WIDTH, GAME_HEIGHT, FACILITIES, SUBJECT_MAP, type FacilityData } from '../config';
import type { PlayerState } from './UIScene';

interface FacilityUISceneData {
  facility: FacilityData;
  playerData: PlayerState;
  assignments?: Array<{
    id: string;
    title: string;
    subject: string;
    priority: number;
    status: string;
    dueDate?: string;
  }>;
  onClose: () => void;
  onAction?: (action: string, data?: unknown) => void;
}

export class FacilityUIScene implements Scene {
  name: 'facility' = 'facility';
  container = new Container();
  
  private data!: FacilityUISceneData;
  private facility!: FacilityData;
  private playerData!: PlayerState;
  private background!: Graphics;
  private mainContainer!: Container;
  private isClosing = false;

  init(data: FacilityUISceneData): void {
    this.data = data;
    this.facility = data.facility;
    this.playerData = data.playerData;
  }

  create(): void {
    this.createBackground();
    this.createFacilityUI();
    this.setupInput();
  }

  private createBackground(): void {
    this.background = new Graphics();
    this.background.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x000000, alpha: 0.85 });
    this.background.eventMode = 'static';
    this.background.on('pointerdown', () => this.closeFacility());
    this.container.addChild(this.background);

    this.mainContainer = new Container();
    this.mainContainer.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.mainContainer.zIndex = 101;
    this.container.addChild(this.mainContainer);

    const panelBg = new Graphics();
    panelBg.roundRect(-450, -300, 900, 600, 16)
      .fill({ color: 0x1a1a2e, alpha: 0.98 })
      .stroke({ width: 3, color: 0x6B46C1 });
    this.mainContainer.addChild(panelBg);

    const panelHit = new Graphics();
    panelHit.rect(-450, -300, 900, 600).fill({ color: 0xFFFFFF, alpha: 0.01 });
    panelHit.eventMode = 'static';
    this.mainContainer.addChild(panelHit);
  }

  private createFacilityUI(): void {
    this.createHeader();
    
    switch (this.facility.id) {
      case 'bulletin':
        this.createBulletinBoard();
        break;
      case 'library':
        this.createLibrary();
        break;
      case 'forge':
        this.createForge();
        break;
      case 'shop':
        this.createShop();
        break;
      case 'training':
        this.createTrainingGround();
        break;
      case 'guild':
        this.createGuild();
        break;
      default:
        this.createDefaultFacility();
    }

    this.createCloseButton();
  }

  private createHeader(): void {
    const y = -280;
    
    const iconText = new Text(this.facility.icon, new TextStyle({ fontSize: 48 }));
    iconText.anchor.set(0.5);
    iconText.position.set(-400, y);
    this.mainContainer.addChild(iconText);

    const nameText = new Text(this.facility.name, new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 28, fontWeight: 'bold', fill: 0xF59E0B,
      stroke: { color: 0x000000, width: 3 }
    }));
    nameText.anchor.set(0, 0.5);
    nameText.position.set(-330, y - 10);
    this.mainContainer.addChild(nameText);

    const descText = new Text(this.facility.description, new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 14, fill: 0xFFFFFF, lineHeight: 20
    }));
    descText.anchor.set(0, 0.5);
    descText.position.set(-330, y + 30);
    this.mainContainer.addChild(descText);

    const facilityLevel = this.playerData.facilities?.find(f => f.facilityId === this.facility.id)?.level || 1;
    const levelText = new Text(`Lv. ${facilityLevel} / ${this.facility.maxLevel}`, new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 20, fontWeight: 'bold', fill: 0x8B5CF6,
      stroke: { color: 0x000000, width: 2 }
    }));
    levelText.anchor.set(1, 0.5);
    levelText.position.set(350, y - 10);
    this.mainContainer.addChild(levelText);

    const nextCost = this.facility.baseCost * Math.pow(1.5, facilityLevel - 1);
    const costText = new Text(`次: ${Math.floor(nextCost)} 💰`, new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 14, fill: 0xF59E0B
    }));
    costText.anchor.set(1, 0.5);
    costText.position.set(350, y + 25);
    this.mainContainer.addChild(costText);
  }

  private createCloseButton(): void {
    const btn = this.createButton(380, -270, '✕ 閉じる', 0xEF4444, () => this.closeFacility(), 100, 40);
    this.mainContainer.addChild(btn);
  }

  private createBulletinBoard(): void {
    const assignments = this.data.assignments || [];
    const yStart = -200;
    
    const titleText = new Text('📋 依頼一覧', new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 22, fontWeight: 'bold', fill: 0xFFFFFF
    }));
    titleText.anchor.set(0, 0.5);
    titleText.position.set(-400, yStart);
    this.mainContainer.addChild(titleText);

    if (assignments.length === 0) {
      const emptyText = new Text('依頼はありません\n図書館で新しい依頼を作成しましょう', new TextStyle({
        fontFamily: 'Noto Sans JP', fontSize: 18, fill: 0x888888, align: 'center'
      }));
      emptyText.anchor.set(0.5);
      this.mainContainer.addChild(emptyText);
      return;
    }

    const listContainer = new Container();
    listContainer.position.set(-420, yStart + 40);
    this.mainContainer.addChild(listContainer);

    assignments.slice(0, 10).forEach((assignment, index) => {
      const y = index * 55;
      const subjectData = SUBJECT_MAP[assignment.subject as keyof typeof SUBJECT_MAP] || { 
        monster: 'モンスター', color: 0x6B7280, emojis: { 1: '❓', 2: '❓', 3: '❓' }
      };
      const priorityColors = { 1: 0x10B981, 2: 0xF59E0B, 3: 0xEF4444 };
      const priorityLabels = { 1: '低', 2: '中', 3: '高' };
      const statusColors: Record<string, number> = {
        pending: 0xF59E0B, in_progress: 0x3B82F6, completed: 0x10B981, overdue: 0xEF4444,
      };
      const statusLabels: Record<string, string> = {
        pending: '未着手', in_progress: '進行中', completed: '完了', overdue: '期限切れ',
      };

      const itemBg = new Graphics();
      itemBg.roundRect(-5, y - 22, 820, 50, 8).fill({ color: 0x16213e, alpha: 0.8 });
      itemBg.stroke({ width: 1, color: subjectData.color, alpha: 0.5 });
      listContainer.addChild(itemBg);

      const emoji = subjectData.emojis[assignment.priority as 1 | 2 | 3];
      const monsterText = new Text(`${emoji} ${subjectData.monster}`, new TextStyle({ fontSize: 16, fill: subjectData.color }));
      monsterText.anchor.set(0, 0.5);
      monsterText.position.set(10, y);
      listContainer.addChild(monsterText);

      const titleText = new Text(assignment.title, new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 16, fontWeight: 'bold', fill: 0xFFFFFF }));
      titleText.anchor.set(0, 0.5);
      titleText.position.set(100, y);
      listContainer.addChild(titleText);

      const priorityBg = new Graphics();
      priorityBg.roundRect(500, y - 12, 70, 24, 12).fill(priorityColors[assignment.priority as 1 | 2 | 3] || 0x6B7280);
      const priorityText = new Text(`優先${priorityLabels[assignment.priority as 1 | 2 | 3]}`, new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 12, fill: 0xFFFFFF }));
      priorityText.anchor.set(0.5);
      priorityText.position.set(535, y);
      listContainer.addChild(priorityBg, priorityText);

      const statusBg = new Graphics();
      statusBg.roundRect(590, y - 12, 80, 24, 12).fill(statusColors[assignment.status] || 0x6B7280);
      const statusText = new Text(statusLabels[assignment.status] || '不明', new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 12, fill: 0xFFFFFF }));
      statusText.anchor.set(0.5);
      statusText.position.set(630, y);
      listContainer.addChild(statusBg, statusText);

      let dueText = '期限なし';
      if (assignment.dueDate) {
        const due = new Date(assignment.dueDate);
        dueText = `${due.getMonth() + 1}/${due.getDate()} ${due.getHours()}:${due.getMinutes().toString().padStart(2, '0')}`;
        if (assignment.status === 'overdue') dueText += ' ⚠️';
      }
      const dueDateText = new Text(dueText, new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 13, fill: assignment.status === 'overdue' ? 0xEF4444 : 0xAAAAAA }));
      dueDateText.anchor.set(1, 0.5);
      dueDateText.position.set(700, y);
      listContainer.addChild(dueDateText);
    });
  }

  private createLibrary(): void {
    const yStart = -200;
    
    const titleText = new Text('📚 新しい依頼を書く', new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 22, fontWeight: 'bold', fill: 0xFFFFFF }));
    titleText.anchor.set(0.5);
    titleText.position.set(0, yStart);
    this.mainContainer.addChild(titleText);

    const descText = new Text('教科、優先度、期限を設定して新しい依頼を作成します', new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 14, fill: 0xAAAAAA, align: 'center'
    }));
    descText.anchor.set(0.5);
    descText.position.set(0, yStart + 40);
    this.mainContainer.addChild(descText);

    const subjects = [
      { key: 'mathematics', name: '数学', emoji: '🗿' },
      { key: 'english', name: '英語', emoji: '🐉' },
      { key: 'japanese', name: '国語', emoji: '🧙' },
      { key: 'science', name: '理科', emoji: '🔥' },
      { key: 'social', name: '社会', emoji: '🗿' },
      { key: 'physical', name: '体育', emoji: '💪' },
      { key: 'art', name: '芸術', emoji: '🐱' },
    ];

    subjects.forEach((subject, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = -300 + col * 200;
      const y = yStart + 100 + row * 80;
      
      const btn = this.createButton(x, y, `${subject.emoji} ${subject.name}`, 0x3B82F6, () => {
        this.data.onAction?.('create_assignment', { subject: subject.key });
      }, 160, 50);
      this.mainContainer.addChild(btn);
    });

    const priorityLabel = new Text('優先度:', new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 16, fill: 0xFFFFFF }));
    priorityLabel.anchor.set(0, 0.5);
    priorityLabel.position.set(-300, yStart + 220);
    this.mainContainer.addChild(priorityLabel);

    [1, 2, 3].forEach((p, i) => {
      const colors = [0x10B981, 0xF59E0B, 0xEF4444];
      const labels = ['低', '中', '高'];
      const btn = this.createButton(-200 + i * 120, yStart + 220, `優先${labels[i]}`, colors[i], () => {
        this.data.onAction?.('set_priority', { priority: p });
      }, 100, 40);
      this.mainContainer.addChild(btn);
    });
  }

  private createForge(): void {
    const yStart = -200;
    
    const titleText = new Text('⚒️ 施設強化', new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 22, fontWeight: 'bold', fill: 0xFFFFFF }));
    titleText.anchor.set(0.5);
    titleText.position.set(0, yStart);
    this.mainContainer.addChild(titleText);

    const descText = new Text('ゴールドを使って施設を強化し、ボーナス効果を得られます', new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 14, fill: 0xAAAAAA, align: 'center'
    }));
    descText.anchor.set(0.5);
    descText.position.set(0, yStart + 40);
    this.mainContainer.addChild(descText);

    const ownedFacilities = this.playerData.facilities || [];
    
    FACILITIES.forEach((facility, index) => {
      const owned = ownedFacilities.find(f => f.facilityId === facility.id);
      const level = owned?.level || 0;
      const isUnlocked = level > 0 || facility.unlockLevel === 1;
      const y = yStart + 80 + index * 70;
      
      const itemBg = new Graphics();
      itemBg.roundRect(-400, y - 25, 800, 55, 8)
        .fill({ color: isUnlocked ? 0x16213e : 0x0a0a1a, alpha: 0.8 })
        .stroke({ width: 1, color: isUnlocked ? 0x6B46C1 : 0x333333, alpha: 0.5 });
      this.mainContainer.addChild(itemBg);

      const nameText = new Text(`${facility.icon} ${facility.name}`, new TextStyle({
        fontFamily: 'Noto Sans JP', fontSize: 18, fontWeight: 'bold', fill: isUnlocked ? 0xFFFFFF : 0x555555
      }));
      nameText.anchor.set(0, 0.5);
      nameText.position.set(-380, y);
      this.mainContainer.addChild(nameText);

      if (!isUnlocked) {
        const lockText = new Text(`Lv.${facility.unlockLevel}で解放`, new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 12, fill: 0x777777 }));
        lockText.anchor.set(0, 0.5);
        lockText.position.set(-380, y + 20);
        this.mainContainer.addChild(lockText);
      } else {
        const levelText = new Text(`Lv. ${level} / ${facility.maxLevel}`, new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 16, fill: 0xF59E0B }));
        levelText.anchor.set(0, 0.5);
        levelText.position.set(-100, y);
        this.mainContainer.addChild(levelText);

        const effectNames: Record<string, string> = {
          xp_bonus: '経験値ボーナス',
          gold_bonus: 'ゴールドボーナス',
          streak_protect: '連続記録保護',
        };
        const effectText = new Text(`${effectNames[facility.effectType]} +${(facility.effectPerLevel * 100 * level).toFixed(0)}%`, new TextStyle({
          fontFamily: 'Noto Sans JP', fontSize: 14, fill: 0x8B5CF6
        }));
        effectText.anchor.set(0, 0.5);
        effectText.position.set(50, y);
        this.mainContainer.addChild(effectText);

        if (level < facility.maxLevel) {
          const nextCost = Math.floor(facility.baseCost * Math.pow(1.5, level - 1));
          const canAfford = this.playerData.gold >= nextCost;
          const btn = this.createButton(350, y, `強化 ${nextCost}💰`, canAfford ? 0x10B981 : 0x6B7280, () => {
            if (canAfford) {
              this.data.onAction?.('upgrade_facility', { facilityId: facility.id, cost: nextCost });
            }
          }, 140, 40, !canAfford);
          this.mainContainer.addChild(btn);
        } else {
          const maxText = new Text('MAX', new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 16, fontWeight: 'bold', fill: 0xF59E0B }));
          maxText.anchor.set(0.5);
          maxText.position.set(350, y);
          this.mainContainer.addChild(maxText);
        }
      }
    });
  }

  private createShop(): void {
    const yStart = -200;
    
    const titleText = new Text('🏪 商店', new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 22, fontWeight: 'bold', fill: 0xFFFFFF }));
    titleText.anchor.set(0.5);
    titleText.position.set(0, yStart);
    this.mainContainer.addChild(titleText);

    const goldText = new Text(`所持: ${this.playerData.gold.toLocaleString()} 💰`, new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 18, fontWeight: 'bold', fill: 0xF59E0B }));
    goldText.anchor.set(1, 0.5);
    goldText.position.set(380, yStart);
    this.mainContainer.addChild(goldText);

    const categories = [
      { key: 'consumable', name: '消費アイテム', emoji: '🍎', color: 0x10B981 },
      { key: 'equipment', name: '装備アイテム', emoji: '⚔️', color: 0x8B5CF6 },
      { key: 'material', name: '素材', emoji: '💎', color: 0xF59E0B },
    ];

    categories.forEach((cat, index) => {
      const btn = this.createButton(-300 + index * 250, yStart + 80, `${cat.emoji} ${cat.name}`, cat.color, () => {
        this.data.onAction?.('shop_category', { category: cat.key });
      }, 220, 60);
      this.mainContainer.addChild(btn);
    });

    const invBtn = this.createButton(0, yStart + 180, '🎒 バックパックを開く', 0x6B46C1, () => {
      this.data.onAction?.('open_inventory');
    }, 250, 50);
    this.mainContainer.addChild(invBtn);
  }

  private createTrainingGround(): void {
    const yStart = -200;
    
    const titleText = new Text('🏃 訓練場 - ステータス', new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 22, fontWeight: 'bold', fill: 0xFFFFFF }));
    titleText.anchor.set(0.5);
    titleText.position.set(0, yStart);
    this.mainContainer.addChild(titleText);

    const infoY = yStart + 60;
    const infoText = new Text(
      `Lv. ${this.playerData.level}  ${this.playerData.title}\n` +
      `XP: ${this.playerData.xp.toLocaleString()} / ${this.playerData.xpToNext.toLocaleString()}\n` +
      `💰 ${this.playerData.gold.toLocaleString()}    🔥 ${this.playerData.streak}日連続`,
      { fontFamily: 'Noto Sans JP', fontSize: 16, fill: 0xFFFFFF, lineHeight: 24 }
    );
    infoText.anchor.set(0, 0);
    infoText.position.set(-400, infoY);
    this.mainContainer.addChild(infoText);

    const stats = this.playerData.stats || { int: 0, wis: 0, str: 0, end: 0, cre: 0, soc: 0 };
    const statInfos = [
      { key: 'int', name: '知力(数学)', emoji: '🧠', color: 0x3B82F6 },
      { key: 'wis', name: '精神(英語・国語)', emoji: '💭', color: 0x8B5CF6 },
      { key: 'str', name: '体力(体育)', emoji: '💪', color: 0xEF4444 },
      { key: 'end', name: '持久(理科)', emoji: '🏃', color: 0xF97316 },
      { key: 'cre', name: '創造(芸術)', emoji: '🎨', color: 0xF59E0B },
      { key: 'soc', name: '社交(社会)', emoji: '🤝', color: 0x10B981 },
    ];

    statInfos.forEach((stat, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = -350 + col * 250;
      const y = infoY + 100 + row * 90;
      
      const value = stats[stat.key as keyof typeof stats] || 0;
      
      const cardContainer = new Container();
      cardContainer.position.set(x, y);
      
      const cardBg = new Graphics();
      cardBg.roundRect(-100, -35, 200, 70, 12).fill({ color: 0x16213e, alpha: 0.8 }).stroke({ width: 2, color: stat.color, alpha: 0.8 });
      cardContainer.addChild(cardBg);
      
      const emojiText = new Text(stat.emoji, new TextStyle({ fontSize: 28 }));
      emojiText.anchor.set(0.5);
      emojiText.position.set(0, -20);
      cardContainer.addChild(emojiText);
      
      const nameText = new Text(stat.name, new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 13, fill: 0xCCCCCC }));
      nameText.anchor.set(0.5);
      nameText.position.set(0, 10);
      cardContainer.addChild(nameText);
      
      const valueText = new Text(value.toString(), new TextStyle({
        fontFamily: 'Noto Sans JP', fontSize: 24, fontWeight: 'bold', fill: stat.color,
        stroke: { color: 0x000000, width: 2 }
      }));
      valueText.anchor.set(0.5);
      valueText.position.set(0, 30);
      cardContainer.addChild(valueText);
      
      this.mainContainer.addChild(cardContainer);
    });

    const achBtn = this.createButton(0, yStart + 280, '🏆 称号・実績を見る', 0xF59E0B, () => {
      this.data.onAction?.('view_achievements');
    }, 220, 50);
    this.mainContainer.addChild(achBtn);
  }

  private createGuild(): void {
    const yStart = -200;
    
    const titleText = new Text('🏰 ギルド', new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 22, fontWeight: 'bold', fill: 0xFFFFFF }));
    titleText.anchor.set(0.5);
    titleText.position.set(0, yStart);
    this.mainContainer.addChild(titleText);

    const descText = new Text('仲間と協力してギルドクエストに挑戦しましょう', new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 14, fill: 0xAAAAAA, align: 'center'
    }));
    descText.anchor.set(0.5);
    descText.position.set(0, yStart + 50);
    this.mainContainer.addChild(descText);

    const guildFeatures = [
      { key: 'create_group', label: '➕ グループ作成', color: 0x3B82F6 },
      { key: 'join_group', label: '🔍 グループを探す', color: 0x8B5CF6 },
      { key: 'guild_quests', label: '📜 ギルドクエスト', color: 0xF59E0B },
      { key: 'my_groups', label: '👥 参加中のグループ', color: 0x10B981 },
    ];

    guildFeatures.forEach((feature, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = -250 + col * 300;
      const y = yStart + 120 + row * 80;
      
      const btn = this.createButton(x, y, feature.label, feature.color, () => {
        this.data.onAction?.(feature.key);
      }, 250, 55);
      this.mainContainer.addChild(btn);
    });

    const unlockLevel = this.facility.unlockLevel;
    if (this.playerData.level < unlockLevel) {
      const lockText = new Text(`🔒 Lv.${unlockLevel}でギルド機能が解放されます`, new TextStyle({
        fontFamily: 'Noto Sans JP', fontSize: 16, fill: 0x777777, align: 'center'
      }));
      lockText.anchor.set(0.5);
      lockText.position.set(0, yStart + 280);
      this.mainContainer.addChild(lockText);
    }
  }

  private createDefaultFacility(): void {
    const text = new Text(`${this.facility.name}は建設中です`, new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 20, fill: 0x888888, align: 'center' }));
    text.anchor.set(0.5);
    this.mainContainer.addChild(text);
  }

  private createButton(
    x: number, y: number, label: string, color: number, callback: () => void,
    width: number = 180, height: number = 50, disabled: boolean = false
  ): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const bg = new Graphics();
    bg.roundRect(-width / 2, -height / 2, width, height, 10).fill({ color: disabled ? 0x333333 : color, alpha: disabled ? 0.5 : 1 });
    
    const text = new Text(label, new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 16, fontWeight: 'bold', fill: disabled ? 0x777777 : 0xFFFFFF }));
    text.anchor.set(0.5);
    
    container.addChild(bg, text);
    container.eventMode = 'static';
    container.cursor = disabled ? 'default' : 'pointer';
    
    if (!disabled) {
      container.on('pointerdown', callback);
      container.on('pointerover', () => bg.clear().roundRect(-width / 2, -height / 2, width, height, 10).fill({ color, alpha: 0.8 }));
      container.on('pointerout', () => bg.clear().roundRect(-width / 2, -height / 2, width, height, 10).fill({ color, alpha: 1 }));
    }
    
    return container;
  }

  private setupInput(): void {}

  private closeFacility(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    
    const duration = 200;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      
      this.mainContainer.alpha = 1 - eased;
      this.background.alpha = 0.85 * (1 - eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.data.onClose();
        this.destroy();
      }
    };
    
    requestAnimationFrame(animate);
  }

  update(): void {}

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
