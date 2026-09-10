import Phaser from 'phaser';
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { 
  TOWN_TILEMAP, FIELD_TILEMAP, MAP_CONFIG, 
  FACILITIES, PLAYER_START, MONSTER_SPAWNS, MAP_TRANSITIONS 
} from '../map/tilemap';
import { SUBJECT_MAP, type Monster, type FacilityData, type MapObject } from '../types';
import { assignmentToMonster } from '@/lib/game/monsters';

export interface AssignmentData {
  id: string;
  subject: string;
  priority: number;
  title: string;
}

// Module-level storage for assignments (set by GameCanvas before scene starts)
let _pendingAssignments: AssignmentData[] = [];

export function setPendingAssignments(assignments: AssignmentData[]): void {
  _pendingAssignments = assignments;
}

export class WorldScene extends Phaser.Scene {
  private currentMap: 'town' | 'field' = 'town';
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private facilities: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private monsters: Phaser.GameObjects.Sprite[] = [];
  private tilemap!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private collisionLayer!: Phaser.Tilemaps.TilemapLayer;
  private joystickBase!: Phaser.GameObjects.Graphics;
  private joystickStick!: Phaser.GameObjects.Graphics;
  private joystickActive = false;
  private joystickPointer: Phaser.Input.Pointer | null = null;
  private joystickPosition = { x: 0, y: 0 };
  private moveDirection = { x: 0, y: 0 };
  private playerSpeed = 150;
  private interactionText!: Phaser.GameObjects.Text;
  private nearFacility: FacilityData | null = null;
  private nearMonster: Phaser.GameObjects.Sprite | null = null;
  private transitionObjects: MapObject[] = [];
  
  // データ受け渡し用
  private playerData: {
    userId: string;
    level: number;
    xp: number;
    gold: number;
    streak: number;
  } = { userId: '', level: 1, xp: 0, gold: 0, streak: 0 };

  private assignments: AssignmentData[] = [];

  constructor() {
    super('WorldScene');
  }

  init(data: { map?: 'town' | 'field'; playerData?: typeof this.playerData; position?: { x: number; y: number }; assignments?: AssignmentData[] }): void {
    if (data.map) this.currentMap = data.map;
    if (data.playerData) this.playerData = data.playerData;
    if (data.position) {
      PLAYER_START[this.currentMap] = data.position;
    }
    if (data.assignments) {
      this.assignments = data.assignments;
    }
  }

  create(): void {
    // Read assignments from module-level storage (set by GameCanvas)
    if (_pendingAssignments.length > 0) {
      this.assignments = _pendingAssignments;
      _pendingAssignments = [];
    }

    // Wait for tileset texture to be ready
    if (!this.textures.exists('tileset')) {
      this.time.delayedCall(100, () => this.create(), [], this);
      return;
    }

    this.createTilemap();
    this.createPlayer();
    this.createInput();
    this.createFacilities();
    this.createMonsters();
    this.createTransitions();
    this.createJoystick();
    this.createInteractionUI();
    this.setupCamera();
    this.setupCollisions();
    this.setupEvents();
  }

  private createTilemap(): void {
    const config = MAP_CONFIG[this.currentMap];
    const tilemapData = this.currentMap === 'town' ? TOWN_TILEMAP : FIELD_TILEMAP;
    
    this.tilemap = this.make.tilemap({ 
      data: tilemapData.layers[0].data, 
      tileWidth: TILE_SIZE, 
      tileHeight: TILE_SIZE,
      width: config.width,
      height: config.height,
    });
    
    // タイルセット（プレースホルダー画像使用、後で差し替え）
    const tileset = this.tilemap.addTilesetImage('tileset', 'tileset', TILE_SIZE, TILE_SIZE, 0, 0);
    
    if (tileset) {
      this.groundLayer = this.tilemap.createLayer('ground', tileset, 0, 0);
      this.collisionLayer = this.tilemap.createLayer('collision', tileset, 0, 0);
      this.collisionLayer.setCollision(1);
      this.collisionLayer.setVisible(false);
    } else {
      // タイルセットがない場合はグラフィックスで代用
      this.createPlaceholderMap();
    }
    
    // ワールド境界設定
    this.physics.world.setBounds(0, 0, config.pixelWidth, config.pixelHeight);
  }
  
  private createPlaceholderMap(): void {
    // タイルセットがない場合の簡易マップ描画
    const graphics = this.add.graphics();
    const config = MAP_CONFIG[this.currentMap];
    
    // 背景
    graphics.fillStyle(this.currentMap === 'town' ? 0x8FBC8F : 0x228B22);
    graphics.fillRect(0, 0, config.pixelWidth, config.pixelHeight);
    
    // グリッド線
    graphics.lineStyle(1, 0x000000, 0.1);
    for (let x = 0; x <= config.width; x++) {
      graphics.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, config.pixelHeight);
    }
    for (let y = 0; y <= config.height; y++) {
      graphics.lineBetween(0, y * TILE_SIZE, config.pixelWidth, y * TILE_SIZE);
    }
    
    // 道（街のみ）
    if (this.currentMap === 'town') {
      graphics.fillStyle(0xD2B48C, 0.5);
      // 中央の十字路
      graphics.fillRect(0, 12 * TILE_SIZE, config.pixelWidth, 2 * TILE_SIZE);
      graphics.fillRect(19 * TILE_SIZE, 0, 2 * TILE_SIZE, config.pixelHeight);
    }
  }

  private createPlayer(): void {
    const startPos = PLAYER_START[this.currentMap];
    this.player = this.add.sprite(startPos.x, startPos.y, 'player');
    this.player.setScale(1.5);
    this.player.setDepth(10);
    this.physics.add.existing(this.player);
    
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 20);
    body.setOffset(6, 10);
    body.setCollideWorldBounds(true);
    
    // アイドルアニメーション再生
    this.player.play('player-idle-down');
  }

  private createInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  private createFacilities(): void {
    for (const facility of FACILITIES) {
      const sprite = this.add.sprite(
        facility.position.x + TILE_SIZE,
        facility.position.y + TILE_SIZE,
        `building-${facility.buildingType}`
      );
      sprite.setScale(2);
      sprite.setDepth(5);
      sprite.setData('facility', facility);
      
      // 物理判定用
      this.physics.add.existing(sprite, true);
      const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(48, 48);
      body.setOffset(8, 8);
      
      this.facilities.set(facility.id, sprite);
      
      // 名前ラベル
      const label = this.add.text(
        facility.position.x + TILE_SIZE,
        facility.position.y - 20,
        facility.name,
        { font: '12px Noto Sans JP', color: '#ffffff', backgroundColor: '#00000080', padding: { x: 4, y: 2 } }
      ).setOrigin(0.5).setDepth(6);
    }
  }

  private createMonsters(): void {
    if (this.currentMap !== 'field') return;

    // Japanese subject → English texture key mapping
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
      return SUBJECT_MAP[key]?.emojis[difficulty as 1 | 2 | 3] || '❓';
    };

    // Spawn period label for display
    const spawnPeriodLabel: Record<string, { emoji: string; name: string }> = {
      morning: { emoji: '🌅', name: '朝' },
      afternoon: { emoji: '☀️', name: '昼' },
      evening: { emoji: '🌆', name: '夕方' },
      night: { emoji: '🌙', name: '夜' },
      overdue: { emoji: '⚠️', name: '期限切れ' },
    };

    // Get current JST hour for spawn filtering
    const now = new Date();
    const jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const currentHour = jstNow.getHours();

    // Determine which spawn periods are active now
    const isActivePeriod = (period: string): boolean => {
      if (period === 'overdue') return true; // Overdue always spawns
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

      // Use assignmentToMonster for HP/reward computation (includes spawnPeriod)
      const monsterResult = assignmentToMonster(
        { id: assignment.id, subject: assignment.subject, priority: assignment.priority, dueDate: assignment.dueDate } as any,
        this.playerData.level
      );

      const period = monsterResult.spawnPeriod || 'day';
      const periodInfo = spawnPeriodLabel[period] || { emoji: '❓', name: '不明' };
      const isActive = isActivePeriod(period);

      // Skip inactive period monsters (or spawn with reduced visibility)
      if (!isActive && period !== 'overdue') continue;

      const sprite = this.add.sprite(x, y, textureKey);
      sprite.setScale(1.5);
      sprite.setDepth(10);
      sprite.setData('subject', englishSubject);
      sprite.setData('difficulty', difficulty);
      sprite.setData('emoji', emoji);
      sprite.setData('assignmentId', assignment.id);
      sprite.setData('hp', monsterResult.hp);
      sprite.setData('maxHp', monsterResult.maxHp);
      sprite.setData('xpReward', monsterResult.xpReward);
      sprite.setData('goldReward', monsterResult.goldReward);
      sprite.setData('spawnPeriod', period);
      sprite.setData('isActivePeriod', isActive);

      this.physics.add.existing(sprite);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setSize(24, 24);
      body.setOffset(4, 4);
      body.setCollideWorldBounds(true);
      body.setBounce(0.1);

      // Night/overdue monsters move faster
      if (period === 'night' || period === 'overdue') {
        (sprite as any).moveSpeedMultiplier = 1.5;
      }

      this.scheduleRandomMovement(sprite);
      this.monsters.push(sprite);

      // Emoji label above sprite with period indicator
      const labelText = `${emoji} ${periodInfo.emoji}`;
      const label = this.add.text(x, y - 30, labelText, { font: '18px' }).setOrigin(0.5).setDepth(11);
      sprite.setData('label', label);
      
      // Add period name below for overdue
      if (period === 'overdue') {
        const periodLabel = this.add.text(x, y + 30, `⚠️ ${periodInfo.name}`, { 
          font: '12px Noto Sans JP', 
          color: '#EF4444',
          backgroundColor: '#000000AA',
          padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(11);
        sprite.setData('periodLabel', periodLabel);
      }
    }
  }
  
  private scheduleRandomMovement(monster: Phaser.GameObjects.Sprite): void {
    const move = () => {
      if (!monster.active) return;
      
      const body = monster.body as Phaser.Physics.Arcade.Body;
      const angle = Math.random() * Math.PI * 2;
      const baseSpeed = 30;
      const speedMultiplier = (monster as any).moveSpeedMultiplier || 1.0;
      const speed = baseSpeed * speedMultiplier;
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      
      const label = monster.getData('label');
      if (label) {
        label.setPosition(monster.x, monster.y - 30);
      }
      
      const periodLabel = monster.getData('periodLabel');
      if (periodLabel) {
        periodLabel.setPosition(monster.x, monster.y + 30);
      }
      
      // 次の移動をスケジュール (night/overdue move more frequently)
      const delayMultiplier = speedMultiplier > 1 ? 0.6 : 1.0;
      this.time.addEvent({
        delay: Phaser.Math.Between(2000, 5000) * delayMultiplier,
        callback: move,
      });
    };
    
    move();
  }

  private createTransitions(): void {
    for (const transition of MAP_TRANSITIONS) {
      if (this.currentMap === 'town' && transition.id === 'town-to-field') {
        const zone = this.add.zone(
          transition.x + transition.width / 2,
          transition.y + transition.height / 2,
          transition.width,
          transition.height
        );
        this.physics.add.existing(zone);
        zone.setData('transition', transition.properties);
        this.transitionObjects.push(transition);
      } else if (this.currentMap === 'field' && transition.id === 'field-to-town') {
        const zone = this.add.zone(
          transition.x + transition.width / 2,
          transition.y + transition.height / 2,
          transition.width,
          transition.height
        );
        this.physics.add.existing(zone);
        zone.setData('transition', transition.properties);
        this.transitionObjects.push(transition);
      }
    }
  }

  private createJoystick(): void {
    // タッチ操作用バーチャルジョイスティック（画面左下）
    const x = 80;
    const y = GAME_HEIGHT - 80;
    
    this.joystickBase = this.add.graphics();
    this.joystickBase.fillStyle(0x000000, 0.3);
    this.joystickBase.fillCircle(x, y, 60);
    this.joystickBase.setScrollFactor(0);
    this.joystickBase.setDepth(100);
    
    this.joystickStick = this.add.graphics();
    this.joystickStick.fillStyle(0x6B46C1, 0.8);
    this.joystickStick.fillCircle(x, y, 30);
    this.joystickStick.setScrollFactor(0);
    this.joystickStick.setDepth(101);
    
    this.joystickPosition = { x, y };
    
    this.input.on('pointerdown', this.onJoystickStart, this);
    this.input.on('pointermove', this.onJoystickMove, this);
    this.input.on('pointerup', this.onJoystickEnd, this);
  }
  
  private onJoystickStart(pointer: Phaser.Input.Pointer): void {
    const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.joystickPosition.x, this.joystickPosition.y);
    if (distance <= 80 && pointer.x < GAME_WIDTH / 2) {
      this.joystickActive = true;
      this.joystickPointer = pointer;
    }
  }
  
  private onJoystickMove(pointer: Phaser.Input.Pointer): void {
    if (!this.joystickActive || this.joystickPointer !== pointer) return;
    
    const dx = pointer.x - this.joystickPosition.x;
    const dy = pointer.y - this.joystickPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 50;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      this.joystickStick.x = this.joystickPosition.x + Math.cos(angle) * maxDistance;
      this.joystickStick.y = this.joystickPosition.y + Math.sin(angle) * maxDistance;
      this.moveDirection.x = Math.cos(angle);
      this.moveDirection.y = Math.sin(angle);
    } else {
      this.joystickStick.x = pointer.x;
      this.joystickStick.y = pointer.y;
      this.moveDirection.x = dx / maxDistance;
      this.moveDirection.y = dy / maxDistance;
    }
  }
  
  private onJoystickEnd(pointer: Phaser.Input.Pointer): void {
    if (this.joystickPointer === pointer) {
      this.joystickActive = false;
      this.joystickPointer = null;
      this.joystickStick.x = this.joystickPosition.x;
      this.joystickStick.y = this.joystickPosition.y;
      this.moveDirection = { x: 0, y: 0 };
    }
  }

  private createInteractionUI(): void {
    this.interactionText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 60,
      '',
      { 
        font: '16px Noto Sans JP', 
        color: '#F59E0B', 
        backgroundColor: '#000000CC', 
        padding: { x: 12, y: 6 },
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(100).setVisible(false).setScrollFactor(0);
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, MAP_CONFIG[this.currentMap].pixelWidth, MAP_CONFIG[this.currentMap].pixelHeight);
    this.cameras.main.setZoom(1);
  }

  private setupCollisions(): void {
    // プレイヤーと衝突レイヤー
    if (this.collisionLayer) {
      this.physics.add.collider(this.player, this.collisionLayer);
    }
    
    // プレイヤーと施設
    this.physics.add.overlap(this.player, Array.from(this.facilities.values()), this.onFacilityOverlap, undefined, this);
    
    // プレイヤーとモンスター
    this.physics.add.overlap(this.player, this.monsters, this.onMonsterOverlap, undefined, this);
    
    // プレイヤーとマップ遷移
    for (const transition of this.transitionObjects) {
      const zone = this.add.zone(
        transition.x + transition.width / 2,
        transition.y + transition.height / 2,
        transition.width,
        transition.height
      );
      this.physics.add.existing(zone);
      zone.setData('transition', transition.properties);
      this.physics.add.overlap(this.player, zone, this.onTransitionOverlap, undefined, this);
    }
    
    // モンスター同士・壁との衝突
    if (this.collisionLayer) {
      this.physics.add.collider(this.monsters, this.collisionLayer);
    }
    this.physics.add.collider(this.monsters, this.monsters);
  }

  private onFacilityOverlap(player: Phaser.GameObjects.GameObject, facilityObj: Phaser.GameObjects.GameObject): void {
    const facility = (facilityObj as Phaser.GameObjects.Sprite).getData('facility') as FacilityData;
    this.nearFacility = facility;
    this.showInteraction(`[Enter] ${facility.name} - ${facility.description.split('\n')[0]}`);
  }

  private onMonsterOverlap(player: Phaser.GameObjects.GameObject, monsterObj: Phaser.GameObjects.GameObject): void {
    const monster = monsterObj as Phaser.GameObjects.Sprite;
    this.nearMonster = monster;
    const subject = monster.getData('subject');
    const difficulty = monster.getData('difficulty');
    const emoji = monster.getData('emoji');
    const spawnPeriod = monster.getData('spawnPeriod');
    const isActive = monster.getData('isActivePeriod');
    const subjectName = this.getSubjectName(subject);
    
    const periodLabel: Record<string, string> = {
      morning: '🌅朝', afternoon: '☀️昼', evening: '🌆夕', night: '🌙夜', overdue: '⚠️期限切れ'
    };
    const periodText = spawnPeriod ? ` ${periodLabel[spawnPeriod] || ''}` : '';
    const activeText = isActive === false ? ' (非活性)' : '';
    
    this.showInteraction(`[Space] バトル! ${emoji} ${subjectName} (難易度${difficulty})${periodText}${activeText}`);
  }

  private onTransitionOverlap(player: Phaser.GameObjects.GameObject, zoneObj: Phaser.GameObjects.GameObject): void {
    const transition = (zoneObj as Phaser.GameObjects.GameObject).getData('transition');
    if (transition) {
      this.showInteraction(`[Enter] ${transition.targetMap === 'town' ? '街へ戻る' : 'フィールドへ出る'}`);
      // Enterキーで遷移
      const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      const handleEnter = () => {
        this.changeMap(transition.targetMap as 'town' | 'field', transition.targetPosition);
        enterKey.off('down', handleEnter);
      };
      enterKey.once('down', handleEnter);
    }
  }

  private showInteraction(text: string): void {
    this.interactionText.setText(text).setVisible(true);
  }
  
  private hideInteraction(): void {
    this.interactionText.setVisible(false);
    this.nearFacility = null;
    this.nearMonster = null;
  }

  private getSubjectName(subject: string): string {
    const names: Record<string, string> = {
      mathematics: '数学',
      english: '英語',
      japanese: '国語',
      science: '理科',
      social: '社会',
      physical: '体育',
      art: '芸術',
    };
    return names[subject] || subject;
  }

  private changeMap(targetMap: 'town' | 'field', position: { x: number; y: number }): void {
    this.scene.start('WorldScene', { 
      map: targetMap, 
      playerData: this.playerData,
      position,
    });
  }

  private setupEvents(): void {
    // 施設インタラクション
    this.input.keyboard!.on('keydown-ENTER', () => {
      if (this.nearFacility) {
        this.events.emit('facility-interact', this.nearFacility);
      } else if (this.nearMonster) {
        this.startBattle(this.nearMonster);
      }
    });
    
    // バトル開始（スペースキー）
    this.input.keyboard!.on('keydown-SPACE', () => {
      if (this.nearMonster) {
        this.startBattle(this.nearMonster);
      }
    });
  }
  
  private startBattle(monster: Phaser.GameObjects.Sprite): void {
    const subject = monster.getData('subject');
    const difficulty = monster.getData('difficulty');
    const assignmentId = monster.getData('assignmentId');
    const hp = monster.getData('hp') || 50;
    const maxHp = monster.getData('maxHp') || 50;
    const xpReward = monster.getData('xpReward') || 20;
    const goldReward = monster.getData('goldReward') || 10;
    const spawnPeriod = monster.getData('spawnPeriod');
    const isActivePeriod = monster.getData('isActivePeriod');

    const battleData = {
      subject,
      difficulty,
      assignmentId,
      monsterId: `monster-${Date.now()}`,
      hp,
      maxHp,
      xpReward,
      goldReward,
      spawnPeriod,
      isActivePeriod,
      playerData: this.playerData,
      onVictory: (reward: { xp: number; gold: number; items: any[] }) => {
        this.events.emit('battle-end', { type: 'victory', assignmentId, reward });
        this.scene.resume('WorldScene');
        this.scene.run('UIScene');
      },
      onDefeat: () => {
        this.events.emit('battle-end', { type: 'defeat', assignmentId });
        this.scene.resume('WorldScene');
        this.scene.run('UIScene');
      },
      onFlee: () => {
        this.events.emit('battle-end', { type: 'flee', assignmentId });
        this.scene.resume('WorldScene');
        this.scene.run('UIScene');
      },
    };

    this.scene.pause('WorldScene');
    this.scene.launch('BattleScene', battleData);
  }

  update(): void {
    this.handleMovement();
    this.checkInteractionDistance();
  }
  
  private handleMovement(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let velocityX = 0;
    let velocityY = 0;
    let moving = false;
    let animSuffix = 'down';
    
    // キーボード入力
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      velocityX = -this.playerSpeed;
      animSuffix = 'left';
      moving = true;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      velocityX = this.playerSpeed;
      animSuffix = 'right';
      moving = true;
    }
    
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      velocityY = -this.playerSpeed;
      if (!moving) animSuffix = 'up';
      moving = true;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      velocityY = this.playerSpeed;
      if (!moving) animSuffix = 'down';
      moving = true;
    }
    
    // ジョイスティック入力（キーボード優先、ジョイスティックは補助）
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
    
    body.setVelocity(velocityX, velocityY);
    
    // アニメーション切り替え
    if (moving) {
      this.player.play(`player-walk-${animSuffix}`, true);
    } else {
      this.player.play(`player-idle-${animSuffix}`, true);
    }
  }
  
  private checkInteractionDistance(): void {
    let nearFacility = false;
    let nearMonster = false;
    
    // 施設チェック
    for (const facility of this.facilities.values()) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, facility.x, facility.y);
      if (distance < 60) {
        nearFacility = true;
        break;
      }
    }
    
    // モンスターチェック
    for (const monster of this.monsters) {
      if (monster.active) {
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, monster.x, monster.y);
        if (distance < 50) {
          nearMonster = true;
          break;
        }
      }
    }
    
    if (!nearFacility && !nearMonster) {
      this.hideInteraction();
    }
  }
}
