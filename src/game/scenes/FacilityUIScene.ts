import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { FACILITIES, type FacilityData } from '../map/tilemap';
import { SUBJECT_MAP } from '../../lib/game/types';
import type { PlayerState, SubjectStats } from '../../lib/game/types';

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

export class FacilityUIScene extends Phaser.Scene {
  private facilityData!: FacilityUISceneData;
  private facility!: FacilityData;
  private playerData!: PlayerState;
  private container!: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Graphics;
  private isClosing = false;

  constructor() {
    super('FacilityUIScene');
  }

  init(data: FacilityUISceneData): void {
    this.facilityData = data;
    this.facility = data.facility;
    this.playerData = data.playerData;
  }

  create(): void {
    this.createBackground();
    this.createFacilityUI();
    this.setupInput();
  }

  private createBackground(): void {
    this.background = this.add.graphics();
    this.background.fillStyle(0x000000, 0.85);
    this.background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.background.setScrollFactor(0).setDepth(100);

    this.container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.container.setDepth(101).setScrollFactor(0);

    const panelWidth = 900;
    const panelHeight = 600;
    
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a1a2e, 0.98);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
    panelBg.lineStyle(3, 0x6B46C1, 1);
    panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
    this.container.add(panelBg);
  }

  private createFacilityUI(): void {
    const { facility } = this.facilityData;
    
    this.createHeader(facility);
    
    switch (facility.id) {
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

  private createHeader(facility: FacilityData): void {
    const y = -280;
    
    const iconText = this.add.text(-400, y, facility.icon, { font: '48px' }).setOrigin(0.5);
    const nameText = this.add.text(-330, y - 10, facility.name, { 
      font: 'bold 28px Noto Sans JP', 
      color: '#F59E0B',
      stroke: '#000000',
      strokeThickness: 3 
    }).setOrigin(0, 0.5);
    const descText = this.add.text(-330, y + 30, facility.description, { 
      font: '14px Noto Sans JP', 
      color: '#ffffff',
      lineSpacing: 4 
    }).setOrigin(0, 0.5);

    const facilityLevel = this.playerData.facilities?.find(f => f.facilityId === facility.id)?.level || 1;
    const levelText = this.add.text(350, y - 10, `Lv. ${facilityLevel} / ${facility.maxLevel}`, { 
      font: 'bold 20px Noto Sans JP', 
      color: '#8B5CF6',
      stroke: '#000000',
      strokeThickness: 2 
    }).setOrigin(1, 0.5);

    const nextCost = facility.baseCost * Math.pow(1.5, facilityLevel - 1);
    const costText = this.add.text(350, y + 25, `次: ${Math.floor(nextCost)} 💰`, { 
      font: '14px Noto Sans JP', 
      color: '#F59E0B' 
    }).setOrigin(1, 0.5);

    this.container.add([iconText, nameText, descText, levelText, costText]);
  }

  private createCloseButton(): void {
    const btn = this.createButton(380, -270, '✕ 閉じる', 0xEF4444, () => this.closeFacility(), 100, 40);
    this.container.add(btn);
  }

  private createBulletinBoard(): void {
    const assignments = this.facilityData.assignments || [];
    const yStart = -200;
    
    const titleText = this.add.text(-400, yStart, '📋 依頼一覧', { 
      font: 'bold 22px Noto Sans JP', 
      color: '#ffffff' 
    }).setOrigin(0, 0.5);
    this.container.add(titleText);

    if (assignments.length === 0) {
      const emptyText = this.add.text(0, 0, '依頼はありません\n図書館で新しい依頼を作成しましょう', { 
        font: '18px Noto Sans JP', 
        color: '#888888',
        align: 'center'
      }).setOrigin(0.5);
      this.container.add(emptyText);
      return;
    }

    const listContainer = this.add.container(-420, yStart + 40);
    this.container.add(listContainer);

    assignments.slice(0, 10).forEach((assignment, index) => {
      const y = index * 55;
      const subjectData = SUBJECT_MAP[assignment.subject] || { 
        monster: 'モンスター', 
        color: '#6B7280',
        emojis: { 1: '❓', 2: '❓', 3: '❓' }
      };
      const priorityColors = { 1: '#10B981', 2: '#F59E0B', 3: '#EF4444' };
      const priorityLabels = { 1: '低', 2: '中', 3: '高' };
      const statusColors: Record<string, string> = {
        pending: '#F59E0B',
        in_progress: '#3B82F6',
        completed: '#10B981',
        overdue: '#EF4444',
      };
      const statusLabels: Record<string, string> = {
        pending: '未着手',
        in_progress: '進行中',
        completed: '完了',
        overdue: '期限切れ',
      };

      const itemBg = this.add.graphics();
      itemBg.fillStyle(0x16213e, 0.8);
      itemBg.fillRoundedRect(-5, -22, 820, 50, 8);
      itemBg.lineStyle(1, subjectData.color, 0.5);
      itemBg.strokeRoundedRect(-5, -22, 820, 50, 8);

      const emoji = subjectData.emojis[assignment.priority as 1 | 2 | 3];
      const monsterText = this.add.text(10, y, `${emoji} ${subjectData.monster}`, { 
        font: '16px', 
        color: subjectData.color 
      }).setOrigin(0, 0.5);

      const titleText = this.add.text(100, y, assignment.title, { 
        font: 'bold 16px Noto Sans JP', 
        color: '#ffffff' 
      }).setOrigin(0, 0.5);

      const priorityBg = this.add.graphics();
      priorityBg.fillStyle(priorityColors[assignment.priority as 1 | 2 | 3] || '#6B7280', 1);
      priorityBg.fillRoundedRect(500, y - 12, 70, 24, 12);
      const priorityText = this.add.text(535, y, `優先${priorityLabels[assignment.priority as 1 | 2 | 3]}`, { 
        font: '12px Noto Sans JP', 
        color: '#ffffff' 
      }).setOrigin(0.5);

      const statusBg = this.add.graphics();
      statusBg.fillStyle(statusColors[assignment.status] || '#6B7280', 1);
      statusBg.fillRoundedRect(590, y - 12, 80, 24, 12);
      const statusText = this.add.text(630, y, statusLabels[assignment.status] || '不明', { 
        font: '12px Noto Sans JP', 
        color: '#ffffff' 
      }).setOrigin(0.5);

      let dueText = '期限なし';
      if (assignment.dueDate) {
        const due = new Date(assignment.dueDate);
        dueText = `${due.getMonth() + 1}/${due.getDate()} ${due.getHours()}:${due.getMinutes().toString().padStart(2, '0')}`;
        if (assignment.status === 'overdue') dueText += ' ⚠️';
      }
      const dueDateText = this.add.text(700, y, dueText, { 
        font: '13px Noto Sans JP', 
        color: assignment.status === 'overdue' ? '#EF4444' : '#aaaaaa' 
      }).setOrigin(1, 0.5);

      listContainer.add([itemBg, monsterText, titleText, priorityBg, priorityText, statusBg, statusText, dueDateText]);
    });
  }

  private createLibrary(): void {
    const yStart = -200;
    
    const titleText = this.add.text(-400, yStart, '📚 新しい依頼を書く', { 
      font: 'bold 22px Noto Sans JP', 
      color: '#ffffff' 
    }).setOrigin(0, 0.5);
    this.container.add(titleText);

    const descText = this.add.text(0, yStart + 40, '教科、優先度、期限を設定して新しい依頼を作成します', { 
      font: '14px Noto Sans JP', 
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5);
    this.container.add(descText);

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
        this.facilityData.onAction?.('create_assignment', { subject: subject.key });
      }, 160, 50);
      this.container.add(btn);
    });

    const priorityLabel = this.add.text(-300, yStart + 220, '優先度:', { 
      font: '16px Noto Sans JP', 
      color: '#ffffff' 
    }).setOrigin(0, 0.5);
    this.container.add(priorityLabel);

    [1, 2, 3].forEach((p, i) => {
      const colors = [0x10B981, 0xF59E0B, 0xEF4444];
      const labels = ['低', '中', '高'];
      const btn = this.createButton(-200 + i * 120, yStart + 220, `優先${labels[i]}`, colors[i], () => {
        this.facilityData.onAction?.('set_priority', { priority: p });
      }, 100, 40);
      this.container.add(btn);
    });
  }

  private createForge(): void {
    const yStart = -200;
    
    const titleText = this.add.text(-400, yStart, '⚒️ 施設強化', { 
      font: 'bold 22px Noto Sans JP', 
      color: '#ffffff' 
    }).setOrigin(0, 0.5);
    this.container.add(titleText);

    const descText = this.add.text(0, yStart + 40, 'ゴールドを使って施設を強化し、ボーナス効果を得られます', { 
      font: '14px Noto Sans JP', 
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5);
    this.container.add(descText);

    const ownedFacilities = this.playerData.facilities || [];
    
    FACILITIES.forEach((facility, index) => {
      const owned = ownedFacilities.find(f => f.facilityId === facility.id);
      const level = owned?.level || 0;
      const isUnlocked = level > 0 || facility.unlockLevel === 1;
      const y = yStart + 80 + index * 70;
      
      const itemBg = this.add.graphics();
      itemBg.fillStyle(isUnlocked ? 0x16213e : 0x0a0a1a, 0.8);
      itemBg.fillRoundedRect(-400, y - 25, 800, 55, 8);
      if (isUnlocked) {
        itemBg.lineStyle(1, 0x6B46C1, 0.5);
      } else {
        itemBg.lineStyle(1, 0x333333, 0.5);
      }
      itemBg.strokeRoundedRect(-400, y - 25, 800, 55, 8);
      this.container.add(itemBg);

      const nameText = this.add.text(-380, y, `${facility.icon} ${facility.name}`, { 
        font: 'bold 18px Noto Sans JP', 
        color: isUnlocked ? '#ffffff' : '#555555' 
      }).setOrigin(0, 0.5);
      this.container.add(nameText);

      if (!isUnlocked) {
        const lockText = this.add.text(-380, y + 20, `Lv.${facility.unlockLevel}で解放`, { 
          font: '12px Noto Sans JP', 
          color: '#777777' 
        }).setOrigin(0, 0.5);
        this.container.add(lockText);
      } else {
        const levelText = this.add.text(-100, y, `Lv. ${level} / ${facility.maxLevel}`, { 
          font: '16px Noto Sans JP', 
          color: '#F59E0B' 
        }).setOrigin(0, 0.5);
        this.container.add(levelText);

        const effectNames: Record<string, string> = {
          xp_bonus: '経験値ボーナス',
          gold_bonus: 'ゴールドボーナス',
          streak_protect: '連続記録保護',
        };
        const effectText = this.add.text(50, y, `${effectNames[facility.effectType]} +${(facility.effectPerLevel * 100 * level).toFixed(0)}%`, { 
          font: '14px Noto Sans JP', 
          color: '#8B5CF6' 
        }).setOrigin(0, 0.5);
        this.container.add(effectText);

        if (level < facility.maxLevel) {
          const nextCost = Math.floor(facility.baseCost * Math.pow(1.5, level - 1));
          const canAfford = this.playerData.gold >= nextCost;
          const btn = this.createButton(350, y, `強化 ${nextCost}💰`, canAfford ? 0x10B981 : 0x6B7280, () => {
            if (canAfford) {
              this.facilityData.onAction?.('upgrade_facility', { facilityId: facility.id, cost: nextCost });
            }
          }, 140, 40, !canAfford);
          this.container.add(btn);
        } else {
          const maxText = this.add.text(350, y, 'MAX', { 
            font: 'bold 16px Noto Sans JP', 
            color: '#F59E0B' 
          }).setOrigin(0.5);
          this.container.add(maxText);
        }
      }
    });
  }

  private createShop(): void {
    const yStart = -200;
    
    const titleText = this.add.text(-400, yStart, '🏪 商店', { 
      font: 'bold 22px Noto Sans JP', 
      color: '#ffffff' 
    }).setOrigin(0, 0.5);
    this.container.add(titleText);

    const goldText = this.add.text(380, yStart, `所持: ${this.playerData.gold.toLocaleString()} 💰`, { 
      font: 'bold 18px Noto Sans JP', 
      color: '#F59E0B' 
    }).setOrigin(1, 0.5);
    this.container.add(goldText);

    const categories = [
      { key: 'consumable', name: '消費アイテム', emoji: '🍎', color: '#10B981' },
      { key: 'equipment', name: '装備アイテム', emoji: '⚔️', color: '#8B5CF6' },
      { key: 'material', name: '素材', emoji: '💎', color: '#F59E0B' },
    ];

    categories.forEach((cat, index) => {
      const btn = this.createButton(-300 + index * 250, yStart + 80, `${cat.emoji} ${cat.name}`, cat.color, () => {
        this.facilityData.onAction?.('shop_category', { category: cat.key });
      }, 220, 60);
      this.container.add(btn);
    });

    const invBtn = this.createButton(0, yStart + 180, '🎒 バックパックを開く', 0x6B46C1, () => {
      this.facilityData.onAction?.('open_inventory');
    }, 250, 50);
    this.container.add(invBtn);
  }

  private createTrainingGround(): void {
    const yStart = -200;
    
    const titleText = this.add.text(-400, yStart, '🏃 訓練場 - ステータス', { 
      font: 'bold 22px Noto Sans JP', 
      color: '#ffffff' 
    }).setOrigin(0, 0.5);
    this.container.add(titleText);

    const infoY = yStart + 60;
    const infoText = this.add.text(-400, infoY, 
      `Lv. ${this.playerData.level}  ${this.playerData.title}\n` +
      `XP: ${this.playerData.xp.toLocaleString()} / ${this.playerData.xpToNext.toLocaleString()}\n` +
      `💰 ${this.playerData.gold.toLocaleString()}    🔥 ${this.playerData.streak}日連続`,
      { font: '16px Noto Sans JP', color: '#ffffff', lineSpacing: 8 }
    ).setOrigin(0, 0);
    this.container.add(infoText);

    const stats = this.playerData.stats;
    const statInfos = [
      { key: 'int', name: '知力(数学)', emoji: '🧠', color: '#3B82F6' },
      { key: 'wis', name: '精神(英語・国語)', emoji: '💭', color: '#8B5CF6' },
      { key: 'str', name: '体力(体育)', emoji: '💪', color: '#EF4444' },
      { key: 'end', name: '持久(理科)', emoji: '🏃', color: '#F97316' },
      { key: 'cre', name: '創造(芸術)', emoji: '🎨', color: '#F59E0B' },
      { key: 'soc', name: '社交(社会)', emoji: '🤝', color: '#10B981' },
    ];

    statInfos.forEach((stat, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = -350 + col * 250;
      const y = infoY + 100 + row * 90;
      
      const value = stats[stat.key as keyof SubjectStats] || 0;
      
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x16213e, 0.8);
      cardBg.fillRoundedRect(-100, -35, 200, 70, 12);
      cardBg.lineStyle(2, stat.color, 0.8);
      cardBg.strokeRoundedRect(-100, -35, 200, 70, 12);
      
      const statContainer = this.add.container(x, y);
      statContainer.add(cardBg);
      
      const emojiText = this.add.text(0, -20, stat.emoji, { font: '28px' }).setOrigin(0.5);
      const nameText = this.add.text(0, 10, stat.name, { 
        font: '13px Noto Sans JP', 
        color: '#cccccc' 
      }).setOrigin(0.5);
      const valueText = this.add.text(0, 30, value.toString(), { 
        font: 'bold 24px Noto Sans JP', 
        color: stat.color,
        stroke: '#000000',
        strokeThickness: 2 
      }).setOrigin(0.5);
      
      statContainer.add([emojiText, nameText, valueText]);
      this.container.add(statContainer);
    });

    const achBtn = this.createButton(0, yStart + 280, '🏆 称号・実績を見る', 0xF59E0B, () => {
      this.facilityData.onAction?.('view_achievements');
    }, 220, 50);
    this.container.add(achBtn);
  }

  private createGuild(): void {
    const yStart = -200;
    
    const titleText = this.add.text(-400, yStart, '🏰 ギルド', { 
      font: 'bold 22px Noto Sans JP', 
      color: '#ffffff' 
    }).setOrigin(0, 0.5);
    this.container.add(titleText);

    const descText = this.add.text(0, yStart + 50, '仲間と協力してギルドクエストに挑戦しましょう', { 
      font: '14px Noto Sans JP', 
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5);
    this.container.add(descText);

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
        this.facilityData.onAction?.(feature.key);
      }, 250, 55);
      this.container.add(btn);
    });

    const unlockLevel = this.facility.unlockLevel;
    if (this.playerData.level < unlockLevel) {
      const lockText = this.add.text(0, yStart + 280, 
        `🔒 Lv.${unlockLevel}でギルド機能が解放されます`, { 
        font: '16px Noto Sans JP', 
        color: '#777777',
        align: 'center'
      }).setOrigin(0.5);
      this.container.add(lockText);
    }
  }

  private createDefaultFacility(): void {
    const text = this.add.text(0, 0, `${this.facility.name}は建設中です`, { 
      font: '20px Noto Sans JP', 
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5);
    this.container.add(text);
  }

  private createButton(
    x: number, 
    y: number, 
    label: string, 
    color: number, 
    callback: () => void,
    width: number = 180,
    height: number = 50,
    disabled: boolean = false
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const bg = this.add.graphics();
    bg.fillStyle(disabled ? 0x333333 : color, disabled ? 0.5 : 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    
    const text = this.add.text(0, 0, label, { 
      font: 'bold 16px Noto Sans JP', 
      color: disabled ? '#777777' : '#ffffff' 
    }).setOrigin(0.5);
    
    container.add([bg, text]);
    container.setSize(width, height);
    
    if (!disabled) {
      container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', callback);
      container.on('pointerover', () => bg.fillStyle(color, 0.8));
      container.on('pointerout', () => bg.fillStyle(color, 1));
    }
    
    return container;
  }

  private setupInput(): void {
    this.input.keyboard!.on('keydown-ESC', () => this.closeFacility());
    
    this.background.setInteractive(new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);
    this.background.on('pointerdown', () => this.closeFacility());
    
    this.container.setInteractive(new Phaser.Geom.Rectangle(-450, -300, 900, 600), Phaser.Geom.Rectangle.Contains);
    this.container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
    });
  }

  private closeFacility(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    
    this.tweens.add({
      targets: [this.container, this.background],
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.facilityData.onClose();
        this.scene.stop();
      }
    });
  }
}
