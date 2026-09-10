import { 
  Container, Sprite, Graphics, Text, TextStyle, Texture, 
  TilingSprite, Application, FederatedPointerEvent
} from 'pixi.js';
import { Scene } from '../SceneManager';
import { 
  GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, 
  MAP_CONFIG, FACILITIES, PLAYER_START, MONSTER_SPAWNS, MAP_TRANSITIONS,
  SUBJECT_MAP, SUBJECT_ADVANTAGE, MONSTER_SPECIAL_MOVES, SUBJECT_PLAYER_SKILLS,
  type FacilityData
} from '../config';
import { assignmentToMonster } from '@/lib/game/monsters';

export interface AssignmentData {
  id: string;
  subject: string;
  priority: number;
  title: string;
  status?: string;
  dueDate?: string;
}

let _pendingAssignments: AssignmentData[] = [];

export function setPendingAssignments(assignments: AssignmentData[]): void {
  _pendingAssignments = assignments;
}

type MapType = 'town' | 'field';

export class WorldScene implements Scene {
  name: 'world' = 'world';
  container = new Container();
  
  private currentMap: MapType = 'town';
  private player!: Sprite;
  private cursors: Record<string, boolean> = { left: false, right: false, up: false, down: false };
  private wasd: Record<string, boolean> = { w: false, a: false, s: false, d: false };
  private facilities: Map<string, Sprite> = new Map();
  private facilityLabels: Map<string, Text> = new Map();
  private monsters: Sprite[] = [];
  private monsterLabels: Map<Sprite, Text> = new Map();
  private monsterPeriodLabels: Map<Sprite, Text> = new Map();
  private groundLayer!: TilingSprite;
  private collisionLayer: boolean[][] = [];
  private joystickBase!: Graphics;
  private joystickStick!: Graphics;
  private joystickActive = false;
  private joystickPointerId: number | null = null;
  private joystickPosition = { x: 80, y: GAME_HEIGHT - 80 };
  private moveDirection = { x: 0, y: 0 };
  private playerSpeed = 150;
  private interactionText!: Text;
  private nearFacility: FacilityData | null = null;
  private nearMonster: Sprite | null = null;
  private transitionZones: Array<{ zone: Graphics; transition: any }> = [];
  
  private playerData = {
    userId: '',
    level: 1,
    xp: 0,
    xpToNext: 100,
    gold: 0,
    streak: 0,
    stats: { int: 0, wis: 0, str: 0, end: 0, cre: 0, soc: 0 },
  };

  private assignments: AssignmentData[] = [];
  private lastUpdateTime = 0;
  private onFacilityInteract?: (facility: FacilityData) => void;
  private onBattleStart?: (data: any) => void;
  private onBattleEnd?: (result: any) => void;
  private sceneManager: any;

  constructor() {}

  setSceneManager(manager: any): void {
    this.sceneManager = manager;
  }

  setCallbacks(callbacks: {
    onFacilityInteract?: (facility: FacilityData) => void;
    onBattleStart?: (data: any) => void;
    onBattleEnd?: (result: any) => void;
  }): void {
    this.onFacilityInteract = callbacks.onFacilityInteract;
    this.onBattleStart = callbacks.onBattleStart;
    this.onBattleEnd = callbacks.onBattleEnd;
  }

  init(data: { 
    map?: MapType; 
    playerData?: typeof this.playerData; 
    position?: { x: number; y: number }; 
    assignments?: AssignmentData[];
    callbacks?: any;
  }): void {
    if (data.map) this.currentMap = data.map;
    if (data.playerData) this.playerData = data.playerData;
    if (data.position) {
      PLAYER_START[this.currentMap] = data.position;
    }
    if (data.assignments) {
      this.assignments = data.assignments;
    }
    if (data.callbacks) {
      this.setCallbacks(data.callbacks);
    }
  }

  create(): void {
    if (_pendingAssignments.length > 0) {
      this.assignments = _pendingAssignments;
      _pendingAssignments = [];
    }

    this.createTilemap();
    this.createPlayer();
    this.createInput();
    this.createFacilities();
    this.createMonsters();
    this.createTransitions();
    this.createJoystick();
    this.createInteractionUI();
    this.setupEventListeners();
  }

  private createTilemap(): void {
    const config = MAP_CONFIG[this.currentMap];
    
    const tilesetTexture = Texture.from('tileset');
    if (tilesetTexture && tilesetTexture.baseTexture.valid) {
      const grassTexture = Texture.from('tileset_0_0');
      if (grassTexture && grassTexture.baseTexture.valid) {
        this.groundLayer = new TilingSprite({
          texture: grassTexture,
          width: config.pixelWidth,
          height: config.pixelHeight,
        });
        this.groundLayer.tileScale.set(1);
        this.container.addChildAt(this.groundLayer, 0);
      }
    } else {
      this.createPlaceholderMap();
    }

    this.createCollisionMap();
    
    this.container.eventMode = 'static';
    this.container.hitArea = new Graphics().rect(0, 0, config.pixelWidth, config.pixelHeight);
  }
  
  private createPlaceholderMap(): void {
    const graphics = new Graphics();
    const config = MAP_CONFIG[this.currentMap];
    
    graphics.rect(0, 0, config.pixelWidth, config.pixelHeight)
      .fill(this.currentMap === 'town' ? 0x8FBC8F : 0x228B22);
    
    graphics.stroke({ width: 1, color: 0x000000, alpha: 0.1 });
    for (let x = 0; x <= config.width; x++) {
      graphics.moveTo(x * TILE_SIZE, 0).lineTo(x * TILE_SIZE, config.pixelHeight);
    }
    for (let y = 0; y <= config.height; y++) {
      graphics.moveTo(0, y * TILE_SIZE).lineTo(config.pixelWidth, y * TILE_SIZE);
    }
    
    if (this.currentMap === 'town') {
      graphics.rect(0, 12 * TILE_SIZE, config.pixelWidth, 2 * TILE_SIZE).fill({ color: 0xD2B48C, alpha: 0.5 });
      graphics.rect(19 * TILE_SIZE, 0, 2 * TILE_SIZE, config.pixelHeight).fill({ color: 0xD2B48C, alpha: 0.5 });
    }
    
    this.container.addChildAt(graphics, 0);
  }

  private createCollisionMap(): void {
    const config = MAP_CONFIG[this.currentMap];
    this.collisionLayer = Array(config.height).fill(null).map(() => Array(config.width).fill(false));
    
    for (let x = 0; x < config.width; x++) {
      this.collisionLayer[0][x] = true;
      this.collisionLayer[config.height - 1][x] = true;
    }
    for (let y = 0; y < config.height; y++) {
      this.collisionLayer[y][0] = true;
      this.collisionLayer[y][config.width - 1] = true;
    }
    
    if (this.currentMap === 'town') {
      FACILITIES.forEach(f => {
        const tx = Math.floor(f.position.x / TILE_SIZE);
        const ty = Math.floor(f.position.y / TILE_SIZE);
        for (let dx = 0; dx < 2; dx++) {
          for (let dy = 0; dy < 2; dy++) {
            if (tx + dx < config.width && ty + dy < config.height) {
              this.collisionLayer[ty + dy][tx + dx] = true;
            }
          }
        }
      });
    }
  }

  private createPlayer(): void {
    const startPos = PLAYER_START[this.currentMap];
    const playerTexture = Texture.from('player_0_0');
    this.player = new Sprite(playerTexture || Texture.WHITE);
    this.player.position.set(startPos.x, startPos.y);
    this.player.scale.set(1.5);
    this.player.anchor.set(0.5);
    this.player.zIndex = 10;
    this.container.addChild(this.player);

    this.playPlayerAnimation('idle', 'down');
  }

  private createInput(): void {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') this.cursors.left = this.wasd.a = true;
    if (key === 'arrowright' || key === 'd') this.cursors.right = this.wasd.d = true;
    if (key === 'arrowup' || key === 'w') this.cursors.up = this.wasd.w = true;
    if (key === 'arrowdown' || key === 's') this.cursors.down = this.wasd.s = true;
    if (key === 'enter') this.handleEnter();
    if (key === ' ') this.handleSpace();
  }

  private onKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') this.cursors.left = this.wasd.a = false;
    if (key === 'arrowright' || key === 'd') this.cursors.right = this.wasd.d = false;
    if (key === 'arrowup' || key === 'w') this.cursors.up = this.wasd.w = false;
    if (key === 'arrowdown' || key === 's') this.cursors.down = this.wasd.s = false;
  }

  private handleEnter(): void {
    if (this.nearFacility) {
      this.onFacilityInteract?.(this.nearFacility);
    } else if (this.nearMonster) {
      this.startBattle(this.nearMonster);
    } else {
      for (const { zone, transition } of this.transitionZones) {
        if (this.isPlayerInZone(zone)) {
          this.changeMap(transition.targetMap, transition.targetPosition);
          break;
        }
      }
    }
  }

  private handleSpace(): void {
    if (this.nearMonster) {
      this.startBattle(this.nearMonster);
    }
  }

  private createFacilities(): void {
    for (const facility of FACILITIES) {
      const buildingTexture = Texture.from(`building-${facility.buildingType}`);
      const sprite = new Sprite(buildingTexture || Texture.WHITE);
      sprite.position.set(
        facility.position.x + TILE_SIZE,
        facility.position.y + TILE_SIZE
      );
      sprite.scale.set(2);
      sprite.anchor.set(0.5);
      sprite.zIndex = 5;
      (sprite as any).facilityData = facility;
      
      this.facilities.set(facility.id, sprite);
      this.container.addChild(sprite);

      const label = new Text(facility.name, new TextStyle({
        fontFamily: 'Noto Sans JP',
        fontSize: 12,
        fill: 0xFFFFFF,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
      }));
      label.anchor.set(0.5);
      label.position.set(facility.position.x + TILE_SIZE, facility.position.y - 20);
      label.zIndex = 6;
      this.facilityLabels.set(facility.id, label);
      this.container.addChild(label);
    }
  }

  private createMonsters(): void {
    if (this.currentMap !== 'field') return;

    const subjectToTexture: Record<string, string> = {
      '数学': 'mathematics', '英語': 'english', '国語': 'japanese',
      '理科': 'science', '社会': 'social', '体育': 'physical', '芸術': 'art',
    };
    const subjectToEmojiKey: Record<string, string> = {
      '数学': 'mathematics', '英語': 'english', '国語': 'japanese',
      '理科': 'science', '社会': 'social', '体育': 'physical', '芸術': 'art',
    };
    const emojiForSubject = (subject: string, difficulty: number): string => {
      const key = subjectToEmojiKey[subject] || subject;
      return SUBJECT_MAP[key as keyof typeof SUBJECT_MAP]?.emojis[difficulty as 1 | 2 | 3] || '❓';
    };

    const spawnPeriodLabel: Record<string, { emoji: string; name: string }> = {
      morning: { emoji: '🌅', name: '朝' },
      afternoon: { emoji: '☀️', name: '昼' },
      evening: { emoji: '🌆', name: '夕方' },
      night: { emoji: '🌙', name: '夜' },
      overdue: { emoji: '⚠️', name: '期限切れ' },
    };

    const now = new Date();
    const jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const currentHour = jstNow.getHours();

    const isActivePeriod = (period: string): boolean => {
      if (period === 'overdue') return true;
      if (period === 'morning') return currentHour >= 5 && currentHour < 12;
      if (period === 'afternoon') return currentHour >= 12 && currentHour < 17;
      if (period === 'evening') return currentHour >= 17 && currentHour < 21;
      if (period === 'night') return currentHour >= 21 || currentHour < 5;
      return true;
    };

    if (this.assignments.length === 0) return;

    const spawnX = 640;
    const spawnY = 480;
    const maxVisible = Math.min(this.assignments.length, 10);

    for (let i = 0; i < maxVisible; i++) {
      const assignment = this.assignments[i];
      const offsetAngle = (i / maxVisible) * Math.PI * 2;
      const offsetDist = 80 + Math.random() * 40;
      const x = spawnX + Math.cos(offsetAngle) * offsetDist;
      const y = spawnY + Math.sin(offsetAngle) * offsetDist;

      const englishSubject = subjectToTexture[assignment.subject] || assignment.subject;
      const textureKey = `monster-${englishSubject}`;
      const difficulty = (assignment.priority >= 3 ? 3 : assignment.priority === 2 ? 2 : 1) as 1 | 2 | 3;
      const emoji = emojiForSubject(assignment.subject, difficulty);

      const monsterResult = assignmentToMonster(
        { id: assignment.id, subject: assignment.subject, priority: assignment.priority, dueDate: assignment.dueDate } as any,
        this.playerData.level
      );

      const period = monsterResult.spawnPeriod || 'day';
      const periodInfo = spawnPeriodLabel[period] || { emoji: '❓', name: '不明' };
      const isActive = isActivePeriod(period);

      if (!isActive && period !== 'overdue') continue;

      const monsterTexture = Texture.from(textureKey + '_0_0');
      const sprite = new Sprite(monsterTexture || Texture.WHITE);
      sprite.position.set(x, y);
      sprite.scale.set(1.5);
      sprite.anchor.set(0.5);
      sprite.zIndex = 10;
      (sprite as any).monsterData = {
        subject: englishSubject,
        difficulty,
        emoji,
        assignmentId: assignment.id,
        hp: monsterResult.hp,
        maxHp: monsterResult.maxHp,
        xpReward: monsterResult.xpReward,
        goldReward: monsterResult.goldReward,
        spawnPeriod: period,
        isActivePeriod: isActive,
      };

      this.monsters.push(sprite);
      this.container.addChild(sprite);

      const label = new Text(`${emoji} ${periodInfo.emoji}`, new TextStyle({ fontSize: 18 }));
      label.anchor.set(0.5);
      label.position.set(x, y - 30);
      label.zIndex = 11;
      this.monsterLabels.set(sprite, label);
      this.container.addChild(label);

      if (period === 'overdue') {
        const periodLabel = new Text(`⚠️ ${periodInfo.name}`, new TextStyle({
          fontFamily: 'Noto Sans JP',
          fontSize: 12,
          fill: 0xEF4444,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 4,
        }));
        periodLabel.anchor.set(0.5);
        periodLabel.position.set(x, y + 30);
        periodLabel.zIndex = 11;
        this.monsterPeriodLabels.set(sprite, periodLabel);
        this.container.addChild(periodLabel);
      }

      this.scheduleRandomMovement(sprite);
    }
  }
  
  private scheduleRandomMovement(monster: Sprite): void {
    const move = () => {
      if (!this.monsters.includes(monster)) return;
      
      const angle = Math.random() * Math.PI * 2;
      const baseSpeed = 30;
      const speedMultiplier = (monster as any).monsterData?.moveSpeedMultiplier || 1.0;
      const speed = baseSpeed * speedMultiplier;
      
      (monster as any).velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };
      
      const delayMultiplier = speedMultiplier > 1 ? 0.6 : 1.0;
      setTimeout(move, Phaser.Math.Between(2000, 5000) * delayMultiplier);
    };
    
    move();
  }

  private createTransitions(): void {
    for (const transition of MAP_TRANSITIONS) {
      if ((this.currentMap === 'town' && transition.id === 'town-to-field') ||
          (this.currentMap === 'field' && transition.id === 'field-to-town')) {
        const zone = new Graphics();
        zone.rect(transition.x, transition.y, transition.width, transition.height)
          .fill({ color: 0x6B46C1, alpha: 0.2 })
          .stroke({ width: 2, color: 0x6B46C1 });
        zone.zIndex = 4;
        (zone as any).transitionData = transition.properties;
        this.transitionZones.push({ zone, transition: transition.properties });
        this.container.addChild(zone);
      }
    }
  }

  private isPlayerInZone(zone: Graphics): boolean {
    const bounds = zone.getBounds();
    return bounds.contains(this.player.x, this.player.y);
  }

  private createJoystick(): void {
    const x = 80;
    const y = GAME_HEIGHT - 80;
    this.joystickPosition = { x, y };
    
    this.joystickBase = new Graphics();
    this.joystickBase.circle(x, y, 60).fill({ color: 0x000000, alpha: 0.3 });
    this.joystickBase.zIndex = 100;
    this.container.addChild(this.joystickBase);
    
    this.joystickStick = new Graphics();
    this.joystickStick.circle(x, y, 30).fill({ color: 0x6B46C1, alpha: 0.8 });
    this.joystickStick.zIndex = 101;
    this.container.addChild(this.joystickStick);
    
    this.container.on('pointerdown', this.onJoystickStart.bind(this));
    this.container.on('pointermove', this.onJoystickMove.bind(this));
    this.container.on('pointerup', this.onJoystickEnd.bind(this));
    this.container.on('pointerupoutside', this.onJoystickEnd.bind(this));
  }
  
  private onJoystickStart(e: FederatedPointerEvent): void {
    const distance = Math.hypot(e.globalX - this.joystickPosition.x, e.globalY - this.joystickPosition.y);
    if (distance <= 80 && e.globalX < GAME_WIDTH / 2) {
      this.joystickActive = true;
      this.joystickPointerId = e.pointerId;
    }
  }
  
  private onJoystickMove(e: FederatedPointerEvent): void {
    if (!this.joystickActive || this.joystickPointerId !== e.pointerId) return;
    
    const dx = e.globalX - this.joystickPosition.x;
    const dy = e.globalY - this.joystickPosition.y;
    const distance = Math.hypot(dx, dy);
    const maxDistance = 50;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      this.joystickStick.position.set(
        this.joystickPosition.x + Math.cos(angle) * maxDistance,
        this.joystickPosition.y + Math.sin(angle) * maxDistance
      );
      this.moveDirection.x = Math.cos(angle);
      this.moveDirection.y = Math.sin(angle);
    } else {
      this.joystickStick.position.set(e.globalX, e.globalY);
      this.moveDirection.x = dx / maxDistance;
      this.moveDirection.y = dy / maxDistance;
    }
  }
  
  private onJoystickEnd(e: FederatedPointerEvent): void {
    if (this.joystickPointerId === e.pointerId) {
      this.joystickActive = false;
      this.joystickPointerId = null;
      this.joystickStick.position.set(this.joystickPosition.x, this.joystickPosition.y);
      this.moveDirection = { x: 0, y: 0 };
    }
  }

  private createInteractionUI(): void {
    this.interactionText = new Text('', new TextStyle({
      fontFamily: 'Noto Sans JP',
      fontSize: 16,
      fill: 0xF59E0B,
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 12, y: 6 },
      align: 'center',
    }));
    this.interactionText.anchor.set(0.5);
    this.interactionText.position.set(GAME_WIDTH / 2, GAME_HEIGHT - 60);
    this.interactionText.zIndex = 100;
    this.interactionText.visible = false;
    this.container.addChild(this.interactionText);
  }

  private setupEventListeners(): void {}

  private showInteraction(text: string): void {
    this.interactionText.text = text;
    this.interactionText.visible = true;
  }
  
  private hideInteraction(): void {
    this.interactionText.visible = false;
    this.nearFacility = null;
    this.nearMonster = null;
  }

  private changeMap(targetMap: MapType, position: { x: number; y: number }): void {
    this.sceneManager?.start('world', { 
      map: targetMap, 
      playerData: this.playerData,
      position,
    });
  }

  private getSubjectName(subject: string): string {
    const names: Record<string, string> = {
      mathematics: '数学', english: '英語', japanese: '国語',
      science: '理科', social: '社会', physical: '体育', art: '芸術',
    };
    return names[subject] || subject;
  }

  private startBattle(monster: Sprite): void {
    const data = (monster as any).monsterData;
    const battleData = {
      subject: data.subject,
      difficulty: data.difficulty,
      assignmentId: data.assignmentId,
      monsterId: `monster-${Date.now()}`,
      hp: data.hp,
      maxHp: data.maxHp,
      xpReward: data.xpReward,
      goldReward: data.goldReward,
      spawnPeriod: data.spawnPeriod,
      isActivePeriod: data.isActivePeriod,
      playerData: this.playerData,
      onVictory: (reward: { xp: number; gold: number; items: any[] }) => {
        this.onBattleEnd?.({ type: 'victory', assignmentId: data.assignmentId, reward });
        this.sceneManager?.resume('world');
      },
      onDefeat: () => {
        this.onBattleEnd?.({ type: 'defeat', assignmentId: data.assignmentId });
        this.sceneManager?.resume('world');
      },
      onFlee: () => {
        this.onBattleEnd?.({ type: 'flee', assignmentId: data.assignmentId });
        this.sceneManager?.resume('world');
      },
    };

    this.sceneManager?.pause('world');
    this.sceneManager?.launch('battle', battleData);
  }

  private checkInteractionDistance(): void {
    let nearFacility = false;
    let nearMonster = false;
    
    for (const [id, facility] of this.facilities) {
      const distance = Math.hypot(this.player.x - facility.x, this.player.y - facility.y);
      if (distance < 60) {
        this.nearFacility = FACILITIES.find(f => f.id === id) || null;
        nearFacility = true;
        break;
      }
    }
    
    for (const monster of this.monsters) {
      if (monster.visible) {
        const distance = Math.hypot(this.player.x - monster.x, this.player.y - monster.y);
        if (distance < 50) {
          this.nearMonster = monster;
          nearMonster = true;
          break;
        }
      }
    }
    
    if (!nearFacility && !nearMonster) {
      this.hideInteraction();
    } else if (this.nearFacility) {
      this.showInteraction(`[Enter] ${this.nearFacility.name} - ${this.nearFacility.description.split('\n')[0]}`);
    } else if (this.nearMonster) {
      const data = (this.nearMonster as any).monsterData;
      const subjectName = this.getSubjectName(data.subject);
      const periodLabel: Record<string, string> = {
        morning: '🌅朝', afternoon: '☀️昼', evening: '🌆夕', night: '🌙夜', overdue: '⚠️期限切れ'
      };
      const periodText = data.spawnPeriod ? ` ${periodLabel[data.spawnPeriod] || ''}` : '';
      const activeText = data.isActivePeriod === false ? ' (非活性)' : '';
      this.showInteraction(`[Space] バトル! ${data.emoji} ${subjectName} (難易度${data.difficulty})${periodText}${activeText}`);
    }
  }

  private handleMovement(delta: number): void {
    let velocityX = 0;
    let velocityY = 0;
    let moving = false;
    let animSuffix = 'down';
    
    if (this.cursors.left || this.wasd.a) {
      velocityX = -this.playerSpeed;
      animSuffix = 'left';
      moving = true;
    } else if (this.cursors.right || this.wasd.d) {
      velocityX = this.playerSpeed;
      animSuffix = 'right';
      moving = true;
    }
    
    if (this.cursors.up || this.wasd.w) {
      velocityY = -this.playerSpeed;
      if (!moving) animSuffix = 'up';
      moving = true;
    } else if (this.cursors.down || this.wasd.s) {
      velocityY = this.playerSpeed;
      if (!moving) animSuffix = 'down';
      moving = true;
    }
    
    if (!moving && (this.moveDirection.x !== 0 || this.moveDirection.y !== 0)) {
      velocityX = this.moveDirection.x * this.playerSpeed;
      velocityY = this.moveDirection.y * this.playerSpeed;
      moving = true;
      
      if (Math.abs(this.moveDirection.x) > Math.abs(this.moveDirection.y)) {
        animSuffix = this.moveDirection.x > 0 ? 'right' : 'left';
      } else {
        animSuffix = this.moveDirection.y > 0 ? 'down' : 'up';
      }
    }
    
    const newX = this.player.x + velocityX * delta / 60;
    const newY = this.player.y + velocityY * delta / 60;
    
    if (!this.checkCollision(newX, this.player.y)) {
      this.player.x = newX;
    }
    if (!this.checkCollision(this.player.x, newY)) {
      this.player.y = newY;
    }
    
    const config = MAP_CONFIG[this.currentMap];
    this.player.x = Math.max(20, Math.min(config.pixelWidth - 20, this.player.x));
    this.player.y = Math.max(20, Math.min(config.pixelHeight - 20, this.player.y));
    
    if (moving) {
      this.playPlayerAnimation('walk', animSuffix);
    } else {
      this.playPlayerAnimation('idle', animSuffix);
    }
  }

  private checkCollision(x: number, y: number): boolean {
    const config = MAP_CONFIG[this.currentMap];
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    
    if (tx < 0 || tx >= config.width || ty < 0 || ty >= config.height) return true;
    
    const radius = 15;
    const corners = [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y - radius },
      { x: x - radius, y: y + radius },
      { x: x + radius, y: y + radius },
    ];
    
    return corners.some(c => {
      const ctx = Math.floor(c.x / TILE_SIZE);
      const cty = Math.floor(c.y / TILE_SIZE);
      return ctx >= 0 && ctx < config.width && cty >= 0 && cty < config.height && this.collisionLayer[cty][ctx];
    });
  }

  private playPlayerAnimation(action: 'idle' | 'walk' | 'attack', direction: string): void {
    const frameKey = `player_${this.getDirectionRow(direction)}_${action === 'walk' ? 3 : 0}`;
    const texture = Texture.from(frameKey);
    if (texture && texture.baseTexture.valid) {
      this.player.texture = texture;
    }
  }

  private getDirectionRow(direction: string): number {
    const rows: Record<string, number> = { down: 0, up: 1, left: 2, right: 3 };
    return rows[direction] || 0;
  }

  private updateMonsterPositions(delta: number): void {
    for (const monster of this.monsters) {
      const velocity = (monster as any).velocity;
      if (velocity) {
        const newX = monster.x + velocity.x * delta / 60;
        const newY = monster.y + velocity.y * delta / 60;
        
        if (!this.checkCollision(newX, monster.y)) monster.x = newX;
        if (!this.checkCollision(monster.x, newY)) monster.y = newY;
        
        const label = this.monsterLabels.get(monster);
        if (label) label.position.set(monster.x, monster.y - 30);
        
        const periodLabel = this.monsterPeriodLabels.get(monster);
        if (periodLabel) periodLabel.position.set(monster.x, monster.y + 30);
      }
    }
  }

  update(delta: number): void {
    this.handleMovement(delta);
    this.updateMonsterPositions(delta);
    this.checkInteractionDistance();
  }

  private handleMovement(delta: number): void {
    let velocityX = 0;
    let velocityY = 0;
    let moving = false;
    let animSuffix = 'down';
    
    if (this.cursors.left || this.wasd.a) {
      velocityX = -this.playerSpeed;
      animSuffix = 'left';
      moving = true;
    } else if (this.cursors.right || this.wasd.d) {
      velocityX = this.playerSpeed;
      animSuffix = 'right';
      moving = true;
    }
    
    if (this.cursors.up || this.wasd.w) {
      velocityY = -this.playerSpeed;
      if (!moving) animSuffix = 'up';
      moving = true;
    } else if (this.cursors.down || this.wasd.s) {
      velocityY = this.playerSpeed;
      if (!moving) animSuffix = 'down';
      moving = true;
    }
    
    if (!moving && (this.moveDirection.x !== 0 || this.moveDirection.y !== 0)) {
      velocityX = this.moveDirection.x * this.playerSpeed;
      velocityY = this.moveDirection.y * this.playerSpeed;
      moving = true;
      
      if (Math.abs(this.moveDirection.x) > Math.abs(this.moveDirection.y)) {
        animSuffix = this.moveDirection.x > 0 ? 'right' : 'left';
      } else {
        animSuffix = this.moveDirection.y > 0 ? 'down' : 'up';
      }
    }
    
    const newX = this.player.x + velocityX * delta / 60;
    const newY = this.player.y + velocityY * delta / 60;
    
    if (!this.checkCollision(newX, this.player.y)) {
      this.player.x = newX;
    }
    if (!this.checkCollision(this.player.x, newY)) {
      this.player.y = newY;
    }
    
    const config = MAP_CONFIG[this.currentMap];
    this.player.x = Math.max(20, Math.min(config.pixelWidth - 20, this.player.x));
    this.player.y = Math.max(20, Math.min(config.pixelHeight - 20, this.player.y));
    
    if (moving) {
      this.playPlayerAnimation('walk', animSuffix);
    } else {
      this.playPlayerAnimation('idle', animSuffix);
    }
  }

  private checkCollision(x: number, y: number): boolean {
    const config = MAP_CONFIG[this.currentMap];
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    
    if (tx < 0 || tx >= config.width || ty < 0 || ty >= config.height) return true;
    
    const radius = 15;
    const corners = [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y - radius },
      { x: x - radius, y: y + radius },
      { x: x + radius, y: y + radius },
    ];
    
    return corners.some(c => {
      const ctx = Math.floor(c.x / TILE_SIZE);
      const cty = Math.floor(c.y / TILE_SIZE);
      return ctx >= 0 && ctx < config.width && cty >= 0 && cty < config.height && this.collisionLayer[cty][ctx];
    });
  }

  private playPlayerAnimation(action: 'idle' | 'walk' | 'attack', direction: string): void {
    const frameKey = `player_${this.getDirectionRow(direction)}_${action === 'walk' ? 3 : 0}`;
    const texture = Texture.from(frameKey);
    if (texture && texture.baseTexture.valid) {
      this.player.texture = texture;
    }
  }

  private getDirectionRow(direction: string): number {
    const rows: Record<string, number> = { down: 0, up: 1, left: 2, right: 3 };
    return rows[direction] || 0;
  }

  private updateMonsterPositions(delta: number): void {
    for (const monster of this.monsters) {
      const velocity = (monster as any).velocity;
      if (velocity) {
        const newX = monster.x + velocity.x * delta / 60;
        const newY = monster.y + velocity.y * delta / 60;
        
        if (!this.checkCollision(newX, monster.y)) monster.x = newX;
        if (!this.checkCollision(monster.x, newY)) monster.y = newY;
        
        const label = this.monsterLabels.get(monster);
        if (label) label.position.set(monster.x, monster.y - 30);
        
        const periodLabel = this.monsterPeriodLabels.get(monster);
        if (periodLabel) periodLabel.position.set(monster.x, monster.y + 30);
      }
    }
  }

  update(delta: number): void {
    this.handleMovement(delta);
    this.updateMonsterPositions(delta);
    this.checkInteractionDistance();
  }

  private checkInteractionDistance(): void {
    let nearFacility = false;
    let nearMonster = false;
    
    for (const [id, facility] of this.facilities) {
      const distance = Math.hypot(this.player.x - facility.x, this.player.y - facility.y);
      if (distance < 60) {
        this.nearFacility = FACILITIES.find(f => f.id === id) || null;
        nearFacility = true;
        break;
      }
    }
    
    for (const monster of this.monsters) {
      if (monster.visible) {
        const distance = Math.hypot(this.player.x - monster.x, this.player.y - monster.y);
        if (distance < 50) {
          this.nearMonster = monster;
          nearMonster = true;
          break;
        }
      }
    }
    
    if (!nearFacility && !nearMonster) {
      this.hideInteraction();
    } else if (this.nearFacility) {
      this.showInteraction(`[Enter] ${this.nearFacility.name} - ${this.nearFacility.description.split('\n')[0]}`);
    } else if (this.nearMonster) {
      const data = (this.nearMonster as any).monsterData;
      const subjectName = this.getSubjectName(data.subject);
      const periodLabel: Record<string, string> = {
        morning: '🌅朝', afternoon: '☀️昼', evening: '🌆夕', night: '🌙夜', overdue: '⚠️期限切れ'
      };
      const periodText = data.spawnPeriod ? ` ${periodLabel[data.spawnPeriod] || ''}` : '';
      const activeText = data.isActivePeriod === false ? ' (非活性)' : '';
      this.showInteraction(`[Space] バトル! ${data.emoji} ${subjectName} (難易度${data.difficulty})${periodText}${activeText}`);
    }
  }

  private showInteraction(text: string): void {
    this.interactionText.text = text;
    this.interactionText.visible = true;
  }
  
  private hideInteraction(): void {
    this.interactionText.visible = false;
    this.nearFacility = null;
    this.nearMonster = null;
  }

  private changeMap(targetMap: MapType, position: { x: number; y: number }): void {
    this.sceneManager?.start('world', { 
      map: targetMap, 
      playerData: this.playerData,
      position,
    });
  }

  private getSubjectName(subject: string): string {
    const names: Record<string, string> = {
      mathematics: '数学', english: '英語', japanese: '国語',
      science: '理科', social: '社会', physical: '体育', art: '芸術',
    };
    return names[subject] || subject;
  }

  private startBattle(monster: Sprite): void {
    const data = (monster as any).monsterData;
    const battleData = {
      subject: data.subject,
      difficulty: data.difficulty,
      assignmentId: data.assignmentId,
      monsterId: `monster-${Date.now()}`,
      hp: data.hp,
      maxHp: data.maxHp,
      xpReward: data.xpReward,
      goldReward: data.goldReward,
      spawnPeriod: data.spawnPeriod,
      isActivePeriod: data.isActivePeriod,
      playerData: this.playerData,
      onVictory: (reward: { xp: number; gold: number; items: any[] }) => {
        this.onBattleEnd?.({ type: 'victory', assignmentId: data.assignmentId, reward });
        this.sceneManager?.resume('world');
      },
      onDefeat: () => {
        this.onBattleEnd?.({ type: 'defeat', assignmentId: data.assignmentId });
        this.sceneManager?.resume('world');
      },
      onFlee: () => {
        this.onBattleEnd?.({ type: 'flee', assignmentId: data.assignmentId });
        this.sceneManager?.resume('world');
      },
    };

    this.sceneManager?.pause('world');
    this.sceneManager?.launch('battle', battleData);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));
    this.container.destroy({ children: true });
  }
}

const Phaser = {
  Math: {
    Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
  },
};
