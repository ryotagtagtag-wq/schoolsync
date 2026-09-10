import { Container, Graphics, Text, TextStyle, Sprite, Texture, Application, Ticker } from 'pixi.js';
import { Sound } from '@pixi/sound';
import { Scene } from '../SceneManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { SUBJECT_MAP, SUBJECT_ADVANTAGE, MONSTER_SPECIAL_MOVES, SUBJECT_PLAYER_SKILLS } from '../config';

interface BattleData {
  subject: string;
  difficulty: number;
  assignmentId: string;
  monsterId: string;
  hp: number;
  maxHp: number;
  xpReward: number;
  goldReward: number;
  spawnPeriod?: string;
  isActivePeriod?: boolean;
  playerData: {
    userId: string;
    level: number;
    xp: number;
    xpToNext: number;
    gold: number;
    streak: number;
    stats: { int: number; wis: number; str: number; end: number; cre: number; soc: number };
  };
  onVictory: (reward: { xp: number; gold: number; items: any[] }) => void;
  onDefeat: () => void;
  onFlee: () => void;
}

type BattlePhase = 'player_turn' | 'monster_turn' | 'victory' | 'defeat' | 'flee' | 'animating';
type StatusEffect = 'stun' | 'burn' | 'silence' | 'confuse' | 'poison' | 'defense_up' | 'attack_up' | 'defense_down' | 'crit_up';

interface ActiveStatus {
  type: StatusEffect;
  turns: number;
  value?: number;
}

interface Combatant {
  hp: number;
  maxHp: number;
  stats: { int: number; wis: number; str: number; end: number; cre: number; soc: number };
  statuses: ActiveStatus[];
  cooldowns: Record<string, number>;
  buffs: { attack: number; defense: number; crit: number };
}

export class BattleScene implements Scene {
  name: 'battle' = 'battle';
  container = new Container();
  
  private battleData!: BattleData;
  private phase: BattlePhase = 'player_turn';
  private turnCount = 0;
  private animating = false;
  
  private player: Combatant;
  private monster: Combatant;
  
  private monsterSprite!: Sprite;
  private monsterHpBar!: Graphics;
  private monsterHpText!: Text;
  private playerHpBar!: Graphics;
  private playerHpText!: Text;
  private actionButtons: Map<string, { btn: Graphics; label: Text }> = new Map();
  private logText!: Text;
  private phaseText!: Text;
  private turnIndicator!: Graphics;
  
  private app: Application;

  constructor(app: Application) {
    this.app = app;
    this.player = this.createEmptyCombatant();
    this.monster = this.createEmptyCombatant();
  }

  private createEmptyCombatant(): Combatant {
    return {
      hp: 0,
      maxHp: 0,
      stats: { int: 0, wis: 0, str: 0, end: 0, cre: 0, soc: 0 },
      statuses: [],
      cooldowns: {},
      buffs: { attack: 0, defense: 0, crit: 0 },
    };
  }

  init(data: BattleData): void {
    this.battleData = data;
    this.phase = 'player_turn';
    this.turnCount = 0;
    this.animating = false;

    const pData = data.playerData;
    const maxPlayerHp = 50 + pData.stats.end * 5 + pData.level * 3;
    this.player = {
      hp: maxPlayerHp,
      maxHp: maxPlayerHp,
      stats: { ...pData.stats },
      statuses: [],
      cooldowns: {},
      buffs: { attack: 0, defense: 0, crit: 0 },
    };

    const subjectKey = data.subject as keyof typeof SUBJECT_MAP;
    const subjectData = SUBJECT_MAP[subjectKey];
    this.monster = {
      hp: data.hp,
      maxHp: data.maxHp,
      stats: this.generateMonsterStats(subjectKey, data.difficulty),
      statuses: [],
      cooldowns: {},
      buffs: { attack: 0, defense: 0, crit: 0 },
    };

    if (data.spawnPeriod === 'night' || data.spawnPeriod === 'overdue') {
      this.monster.buffs.attack = 1;
      this.monster.buffs.crit = 0.1;
    }
  }

  private generateMonsterStats(subject: keyof typeof SUBJECT_MAP, difficulty: number): Combatant['stats'] {
    const baseStats: Record<keyof typeof SUBJECT_MAP, Combatant['stats']> = {
      mathematics: { int: 15, wis: 5, str: 12, end: 10, cre: 3, soc: 2 },
      english: { int: 8, wis: 12, str: 8, end: 8, cre: 5, soc: 6 },
      japanese: { int: 10, wis: 15, str: 5, end: 8, cre: 8, soc: 4 },
      science: { int: 12, wis: 8, str: 8, end: 12, cre: 6, soc: 3 },
      social: { int: 10, wis: 10, str: 5, end: 8, cre: 4, soc: 12 },
      physical: { int: 5, wis: 5, str: 18, end: 15, cre: 3, soc: 4 },
      art: { int: 6, wis: 8, str: 6, end: 6, cre: 18, soc: 5 },
    };
    const base = baseStats[subject] || { int: 10, wis: 10, str: 10, end: 10, cre: 10, soc: 10 };
    const mult = 1 + difficulty * 0.3;
    return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.floor(v * mult)])) as Combatant['stats'];
  }

  create(): void {
    this.createBackground();
    this.createMonsterUI();
    this.createPlayerUI();
    this.createActionButtons();
    this.createLog();
    this.createPhaseIndicator();
    this.createTurnIndicator();
    this.addLog('バトル開始！');
    this.checkElementalAdvantage();
  }

  private createBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill(0x0f0f1a);
    this.container.addChild(bg);

    const arena = new Graphics();
    arena.roundRect(GAME_WIDTH / 2 - 400, GAME_HEIGHT / 2 - 200, 800, 400, 16)
      .fill({ color: 0x1a1a2e, alpha: 0.95 })
      .stroke({ width: 3, color: 0x6B46C1 });
    this.container.addChild(arena);

    for (let i = 0; i < 20; i++) {
      const p = new Graphics();
      p.circle(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, Math.random() * 2 + 1)
        .fill({ color: 0x6B46C1, alpha: Math.random() * 0.3 + 0.1 });
      this.container.addChild(p);
    }
  }

  private createMonsterUI(): void {
    const subjectKey = this.battleData.subject as keyof typeof SUBJECT_MAP;
    const subjectData = SUBJECT_MAP[subjectKey];
    const textureKey = `monster-${this.battleData.subject}_0_0`;
    const texture = Texture.from(textureKey);
    
    this.monsterSprite = new Sprite(texture || Texture.WHITE);
    this.monsterSprite.scale.set(3);
    this.monsterSprite.anchor.set(0.5);
    this.monsterSprite.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);
    this.monsterSprite.zIndex = 10;
    this.container.addChild(this.monsterSprite);

    this.monsterHpBar = new Graphics();
    this.monsterHpBar.position.set(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 200);
    this.updateMonsterHpBar();
    this.monsterHpBar.zIndex = 11;
    this.container.addChild(this.monsterHpBar);

    this.monsterHpText = new Text(`${this.monster.hp} / ${this.monster.maxHp}`, new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 14, fontWeight: 'bold', fill: 0xFFFFFF,
      stroke: { color: 0x000000, width: 2 }
    }));
    this.monsterHpText.anchor.set(0.5);
    this.monsterHpText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170);
    this.monsterHpText.zIndex = 12;
    this.container.addChild(this.monsterHpText);

    const infoText = new Text(
      `${subjectData?.emojis[this.battleData.difficulty as 1 | 2 | 3] || '❓'} ${subjectData?.monster || 'モンスター'} (難易度 ${this.battleData.difficulty})`,
      new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 20, fontWeight: 'bold', fill: 0xFFFFFF, stroke: { color: 0x000000, width: 3 } })
    );
    infoText.anchor.set(0.5);
    infoText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 230);
    this.container.addChild(infoText);

    const elementIcon = new Text(this.getElementIcon(this.battleData.subject), new TextStyle({ fontSize: 24 }));
    elementIcon.anchor.set(0.5);
    elementIcon.position.set(GAME_WIDTH / 2 - 250, GAME_HEIGHT / 2 - 230);
    this.container.addChild(elementIcon);
  }

  private getElementIcon(subject: string): string {
    const icons: Record<string, string> = {
      mathematics: '🗿', english: '🐉', japanese: '🧙',
      science: '🔥', social: '🗿', physical: '💪', art: '🐱'
    };
    return icons[subject] || '❓';
  }

  private updateMonsterHpBar(): void {
    this.monsterHpBar.clear();
    const ratio = this.monster.hp / this.monster.maxHp;
    this.monsterHpBar.roundRect(0, 0, 300, 20, 10).fill({ color: 0x000000, alpha: 0.5 });
    const hpColor = ratio > 0.5 ? 0x10B981 : ratio > 0.25 ? 0xF59E0B : 0xEF4444;
    this.monsterHpBar.roundRect(0, 0, 300 * ratio, 20, 10).fill(hpColor);
    this.monsterHpBar.roundRect(0, 0, 300 * ratio, 8).fill({ color: 0xFFFFFF, alpha: 0.3 });
    this.monsterHpText.text = `${this.monster.hp} / ${this.monster.maxHp}`;
  }

  private createPlayerUI(): void {
    const p = this.battleData.playerData;
    const maxPlayerHp = this.player.maxHp;
    
    this.playerHpBar = new Graphics();
    this.playerHpBar.position.set(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 + 150);
    this.updatePlayerHpBar();
    this.playerHpBar.zIndex = 11;
    this.container.addChild(this.playerHpBar);

    this.playerHpText = new Text(`${this.player.hp} / ${this.player.maxHp}`, new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 14, fontWeight: 'bold', fill: 0xFFFFFF,
      stroke: { color: 0x000000, width: 2 }
    }));
    this.playerHpText.anchor.set(0.5);
    this.playerHpText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180);
    this.playerHpText.zIndex = 12;
    this.container.addChild(this.playerHpText);

    const playerType = this.getPlayerElement();
    const elementIcon = this.getElementIcon(playerType);
    const infoText = new Text(
      `Lv.${p.level} ${elementIcon} ${this.getSubjectName(playerType)} | HP: ${this.player.hp}/${this.player.maxHp}`,
      new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 16, fill: 0xFFFFFF })
    );
    infoText.anchor.set(0.5);
    infoText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
    this.container.addChild(infoText);

    const statsText = new Text(
      `知力:${p.stats.int} 精神:${p.stats.wis} 腕力:${p.stats.str} 耐久:${p.stats.end} 創造:${p.stats.cre} 社交:${p.stats.soc}`,
      new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 12, fill: 0xAAAAAA })
    );
    statsText.anchor.set(0.5);
    statsText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140);
    this.container.addChild(statsText);
  }

  private getPlayerElement(): keyof typeof SUBJECT_MAP {
    const stats = this.battleData.playerData.stats;
    const maxStat = Math.max(stats.int, stats.wis, stats.str, stats.end, stats.cre, stats.soc);
    if (maxStat === stats.int) return 'mathematics';
    if (maxStat === stats.wis) return 'english';
    if (maxStat === stats.str) return 'physical';
    if (maxStat === stats.end) return 'science';
    if (maxStat === stats.cre) return 'art';
    return 'social';
  }

  private updatePlayerHpBar(): void {
    this.playerHpBar.clear();
    const ratio = this.player.hp / this.player.maxHp;
    this.playerHpBar.roundRect(0, 0, 300, 20, 10).fill({ color: 0x000000, alpha: 0.5 });
    this.playerHpBar.roundRect(0, 0, 300 * ratio, 20, 10).fill(0x10B981);
    this.playerHpBar.roundRect(0, 0, 300 * ratio, 8).fill({ color: 0xFFFFFF, alpha: 0.3 });
    this.playerHpText.text = `${this.player.hp} / ${this.player.maxHp}`;
  }

  private createActionButtons(): void {
    const actions = [
      { id: 'attack', label: '⚔️ 攻撃', color: 0xEF4444, x: -180, desc: '通常攻撃' },
      { id: 'skill', label: '✨ スキル', color: 0x8B5CF6, x: 0, desc: '必殺技' },
      { id: 'item', label: '🎒 アイテム', color: 0xF59E0B, x: 180, desc: 'アイテム使用' },
      { id: 'flee', label: '🏃 逃げる', color: 0x6B7280, x: 360, desc: '戦闘から逃走' },
    ];

    actions.forEach(action => {
      const btnContainer = new Container();
      btnContainer.position.set(GAME_WIDTH / 2 + action.x, GAME_HEIGHT / 2 + 180);
      btnContainer.zIndex = 20;

      const btn = new Graphics();
      btn.roundRect(-80, -25, 160, 50, 10).fill(action.color).stroke({ width: 2, color: 0xFFFFFF, alpha: 0.5 });
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', () => this.handleAction(action.id));
      btn.on('pointerover', () => btn.clear().roundRect(-80, -25, 160, 50, 10).fill(action.color).stroke({ width: 3, color: 0xFFFFFF }));
      btn.on('pointerout', () => btn.clear().roundRect(-80, -25, 160, 50, 10).fill(action.color).stroke({ width: 2, color: 0xFFFFFF, alpha: 0.5 }));
      btnContainer.addChild(btn);

      const label = new Text(action.label, new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 16, fontWeight: 'bold', fill: 0xFFFFFF }));
      label.anchor.set(0.5);
      label.position.set(0, 0);
      btnContainer.addChild(label);

      const cdOverlay = new Graphics();
      cdOverlay.visible = false;
      cdOverlay.roundRect(-80, -25, 160, 50, 10).fill({ color: 0x000000, alpha: 0.7 });
      btnContainer.addChild(cdOverlay);
      const cdText = new Text('', new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 18, fontWeight: 'bold', fill: 0xFFFFFF }));
      cdText.anchor.set(0.5);
      cdText.visible = false;
      btnContainer.addChild(cdText);
      (cdOverlay as any).cdText = cdText;

      this.actionButtons.set(action.id, { btn: btnContainer, label, cdOverlay, cdText });
    });
  }

  private createLog(): void {
    this.logText = new Text('', new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 13, fill: 0xFFFFFF,
      wordWrap: true, wordWrapWidth: 380, lineHeight: 20,
    }));
    this.logText.position.set(GAME_WIDTH / 2 - 400 + 20, GAME_HEIGHT / 2 - 180);
    this.logText.zIndex = 15;
    this.container.addChild(this.logText);
  }

  private createPhaseIndicator(): void {
    this.phaseText = new Text('あなたのターン', new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 24, fontWeight: 'bold', fill: 0xF59E0B, stroke: { color: 0x000000, width: 3 }
    }));
    this.phaseText.anchor.set(0.5);
    this.phaseText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 260);
    this.phaseText.zIndex = 15;
    this.container.addChild(this.phaseText);
  }

  private createTurnIndicator(): void {
    this.turnIndicator = new Graphics();
    this.turnIndicator.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 300);
    this.turnIndicator.zIndex = 15;
    this.container.addChild(this.turnIndicator);
    this.updateTurnIndicator();
  }

  private updateTurnIndicator(): void {
    this.turnIndicator.clear();
    this.turnIndicator.circle(0, 0, 20).fill(0x6B46C1).stroke({ width: 2, color: 0xF59E0B });
    const turnText = new Text(`TURN ${this.turnCount + 1}`, new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 14, fontWeight: 'bold', fill: 0xF59E0B }));
    turnText.anchor.set(0.5);
    turnText.position.set(0, 5);
    this.turnIndicator.addChild(turnText);
  }

  private addLog(message: string, color: number = 0xFFFFFF): void {
    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const lines = this.logText.text.split('\n').filter(l => l);
    lines.unshift(`[${timestamp}] ${message}`);
    this.logText.text = lines.slice(0, 12).join('\n');
  }

  private addColoredLog(message: string, color: number): void {
    this.addLog(message, color);
  }

  private checkElementalAdvantage(): void {
    const monsterElement = this.battleData.subject as keyof typeof SUBJECT_MAP;
    const playerElement = this.getPlayerElement();
    const advantages = SUBJECT_ADVANTAGE[playerElement] || [];
    
    if (advantages.includes(monsterElement)) {
      this.addColoredLog(`⚡ ${this.getSubjectName(playerElement)}は${this.getSubjectName(monsterElement)}に有利だ！ (1.5倍ダメージ)`, 0xF59E0B);
    } else {
      const monsterAdvantages = SUBJECT_ADVANTAGE[monsterElement] || [];
      if (monsterAdvantages.includes(playerElement)) {
        this.addColoredLog(`⚠️ ${this.getSubjectName(monsterElement)}は${this.getSubjectName(playerElement)}に有利だ！ (被ダメージ1.5倍)`, 0xEF4444);
      }
    }
  }

  private getSubjectName(element: keyof typeof SUBJECT_MAP): string {
    return SUBJECT_MAP[element]?.monster || element;
  }

  private handleAction(actionId: string): void {
    if (this.phase !== 'player_turn' || this.animating) return;

    switch (actionId) {
      case 'attack': this.playerAttack(); break;
      case 'skill': this.playerSkill(); break;
      case 'item': this.playerItem(); break;
      case 'flee': this.playerFlee(); break;
    }
  }

  private playerAttack(): void {
    this.animating = true;
    this.disableButtons();

    const baseDamage = this.calculateBaseDamage('attack');
    const { damage, multiplier, isCrit } = this.calculateFinalDamage(baseDamage, 'attack');
    
    this.playSound('attack_swing', 0.5);
    this.animateAttack('player', () => {
      this.monster.hp = Math.max(0, this.monster.hp - damage);
      this.updateMonsterHpBar();
      this.playSound(isCrit ? 'attack_crit' : 'attack_hit', 0.6);
      
      let msg = `攻撃！ ${damage} のダメージ！`;
      if (multiplier > 1) { 
        msg += ` 弱点突破！`; 
        this.playElementalSound(this.getPlayerElement()); 
      }
      if (isCrit) msg += ` 会心の一撃！`;
      this.addColoredLog(msg, isCrit ? 0xF59E0B : 0xFFFFFF);

      if (this.monster.hp <= 0) {
        this.victory();
      } else {
        this.endPlayerTurn();
      }
    });
  }

  private playerSkill(): void {
    const playerElement = this.getPlayerElement();
    const skill = SUBJECT_PLAYER_SKILLS[playerElement];
    
    if (this.player.cooldowns[skill.name] > 0) {
      this.addColoredLog(`${skill.name} はクールダウン中 (${this.player.cooldowns[skill.name]}ターン)`, 0xEF4444);
      this.animating = false;
      this.enableButtons();
      return;
    }

    this.animating = true;
    this.disableButtons();
    this.player.cooldowns[skill.name] = skill.cooldown;
    this.updateButtonCooldowns();

    this.playSound('skill_cast', 0.5);
    this.animateSkill(skill, () => {
      this.executeSkill(skill);
      this.endPlayerTurn();
    });
  }

  private executeSkill(skill: { name: string; effect: string; cooldown: number }): void {
    switch (skill.effect) {
      case 'attack_up':
        this.player.buffs.attack = 3;
        this.addColoredLog(`${skill.name}！ 攻撃力が3ターン上昇！`, 0xF59E0B);
        break;
      case 'defense_up':
        this.player.buffs.defense = 3;
        this.addColoredLog(`${skill.name}！ 防御力が3ターン上昇！`, 0x3B82F6);
        break;
      case 'heal':
        const healAmount = Math.floor(this.player.maxHp * 0.3);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
        this.updatePlayerHpBar();
        this.addColoredLog(`${skill.name}！ HPが${healAmount}回復！`, 0x10B981);
        this.playSound('skill_heal', 0.5);
        break;
      case 'magic_up':
        this.player.buffs.attack = 2;
        this.player.buffs.crit = 0.2;
        this.addColoredLog(`${skill.name}！ 魔法威力と会心率上昇！`, 0x8B5CF6);
        break;
      case 'reveal_weakness':
        this.addColoredLog(`${skill.name}！ 敵の弱点を看破！ 次の攻撃は必ず弱点突破！`, 0xF59E0B);
        (this as any).nextAttackGuaranteedAdvantage = true;
        break;
      case 'random_buff':
        const buffs = ['attack_up', 'defense_up', 'heal', 'magic_up'];
        const random = buffs[Math.floor(Math.random() * buffs.length)];
        this.executeSkill({ name: skill.name, effect: random, cooldown: skill.cooldown });
        break;
      case 'aoe_damage':
        const dmg = Math.floor((15 + this.player.stats.int * 2) * 1.5);
        this.monster.hp = Math.max(0, this.monster.hp - dmg);
        this.updateMonsterHpBar();
        this.addColoredLog(`${skill.name}！ 範囲攻撃で${dmg}ダメージ！`, 0xEF4444);
        if (this.monster.hp <= 0) { this.victory(); return; }
        break;
      default:
        this.addColoredLog(`${skill.name} を発動！`, 0xFFFFFF);
    }
  }

  private playerItem(): void {
    this.animating = true;
    this.disableButtons();
    this.addColoredLog('アイテム欄を開いた... 実装予定', 0xF59E0B);
    setTimeout(() => {
      this.animating = false;
      this.enableButtons();
    }, 1000);
  }

  private playerFlee(): void {
    this.animating = true;
    this.disableButtons();
    const fleeChance = 0.65 + this.player.stats.soc * 0.01;
    
    this.addLog('逃走を試みる...', 0xF59E0B);
    
    setTimeout(() => {
      if (Math.random() < fleeChance) {
        this.addColoredLog('逃げ切った！', 0x10B981);
        this.playSound('ui_click', 0.5);
        this.phase = 'flee';
        setTimeout(() => this.battleData.onFlee(), 1000);
      } else {
        this.addColoredLog('逃げられなかった！', 0xEF4444);
        this.endPlayerTurn();
      }
    }, 1000);
  }

  private endPlayerTurn(): void {
    this.phase = 'monster_turn';
    this.turnCount++;
    this.updateTurnIndicator();
    this.phaseText.text = '敵のターン';
    this.phaseText.style.fill = 0xEF4444;
    
    for (const key of Object.keys(this.player.cooldowns)) {
      this.player.cooldowns[key] = Math.max(0, this.player.cooldowns[key] - 1);
    }
    for (const key of Object.keys(this.monster.cooldowns)) {
      this.monster.cooldowns[key] = Math.max(0, this.monster.cooldowns[key] - 1);
    }
    this.updateButtonCooldowns();

    if (this.player.buffs.attack > 0) this.player.buffs.attack--;
    if (this.player.buffs.defense > 0) this.player.buffs.defense--;
    if (this.player.buffs.crit > 0) this.player.buffs.crit = Math.max(0, this.player.buffs.crit - 0.1);
    if (this.monster.buffs.attack > 0) this.monster.buffs.attack--;
    if (this.monster.buffs.defense > 0) this.monster.buffs.defense--;

    this.processStatusEffects('player', 'turn_start');
    
    setTimeout(() => this.monsterTurn(), 1200);
  }

  private monsterTurn(): void {
    if (this.monster.hp <= 0 || this.phase !== 'monster_turn') return;

    this.animating = true;
    this.phaseText.text = '敵のターン';
    this.phaseText.style.fill = 0xEF4444;

    if (this.hasStatus(this.monster, 'stun')) {
      this.addColoredLog('敵はスタンして動けない！', 0xF59E0B);
      this.removeStatus(this.monster, 'stun');
      setTimeout(() => this.endMonsterTurn(), 1000);
      return;
    }

    if (this.hasStatus(this.monster, 'confuse') && Math.random() < 0.5) {
      this.addColoredLog('敵は混乱して自分を攻撃した！', 0xF59E0B);
      const dmg = Math.floor(10 + this.monster.stats.str * 0.5);
      this.monster.hp = Math.max(0, this.monster.hp - dmg);
      this.updateMonsterHpBar();
      this.addColoredLog(`敵は自分を傷つけた！ ${dmg}ダメージ`, 0xEF4444);
      this.removeStatus(this.monster, 'confuse');
      setTimeout(() => this.endMonsterTurn(), 1000);
      return;
    }

    const subjectKey = this.battleData.subject as keyof typeof SUBJECT_MAP;
    const specialMove = MONSTER_SPECIAL_MOVES[subjectKey];
    const canUseSpecial = specialMove && 
      this.monster.cooldowns[specialMove.name] <= 0 && 
      Math.random() < 0.4;

    let damage = this.calculateMonsterBaseDamage();
    let message = '';
    let effectApplied = '';

    if (canUseSpecial) {
      this.monster.cooldowns[specialMove.name] = specialMove.cooldown;
      damage = Math.floor(damage * specialMove.power);
      message = `${specialMove.name}！ `;
      
      switch (specialMove.effect) {
        case 'stun':
          effectApplied = 'player_stun';
          this.addStatus(this.player, 'stun', 1);
          message += 'スタン！ プレイヤーは次のターン行動不能！';
          break;
        case 'burn':
          effectApplied = 'player_burn';
          this.addStatus(this.player, 'burn', 3);
          message += '火傷！ ターン終了時にダメージ！';
          break;
        case 'silence':
          effectApplied = 'player_silence';
          this.addStatus(this.player, 'silence', 2);
          message += '沈黙！ スキル使用不可！';
          break;
        case 'aoe_burn':
          effectApplied = 'player_burn';
          this.addStatus(this.player, 'burn', 2);
          message += '範囲火傷！';
          break;
        case 'defense_down':
          effectApplied = 'player_defense_down';
          this.addStatus(this.player, 'defense_down', 2);
          message += '防御力低下！';
          break;
        case 'crit_up':
          this.monster.buffs.crit = 2;
          message += '会心率上昇！';
          break;
        case 'confuse':
          effectApplied = 'player_confuse';
          this.addStatus(this.player, 'confuse', 2);
          message += '混乱！';
          break;
      }
    } else {
      message = '敵の攻撃！';
    }

    const defense = this.getEffectiveDefense(this.player);
    const actualDamage = Math.max(1, damage - defense);
    const finalDamage = Math.max(1, actualDamage - this.player.buffs.defense * 3);
    
    this.player.hp = Math.max(0, this.player.hp - finalDamage);
    this.updatePlayerHpBar();
    this.playSound('damage_taken', 0.5);

    let msg = `${message} ${finalDamage} のダメージ！`;
    if (effectApplied) msg += ` (${this.getEffectName(effectApplied)})`;
    this.addColoredLog(msg, 0xEF4444);
    this.playSound('enemy_attack', 0.5);

    this.processStatusEffects('monster', 'turn_end');

    this.turnCount++;
    this.updateTurnIndicator();
    
    if (this.player.hp <= 0) {
      this.defeat();
    } else {
      setTimeout(() => this.endMonsterTurn(), 1000);
    }
  }

  private endMonsterTurn(): void {
    this.phase = 'player_turn';
    this.phaseText.text = 'あなたのターン';
    this.phaseText.style.fill = 0xF59E0B;
    
    this.processStatusEffects('player', 'turn_start');
    
    this.animating = false;
    this.enableButtons();
  }

  private calculateBaseDamage(type: 'attack' | 'skill'): number {
    const stats = this.player.stats;
    if (type === 'attack') {
      return 8 + stats.str * 2 + stats.int + this.player.buffs.attack * 5;
    }
    return 12 + stats.int * 2 + stats.wis + this.player.buffs.attack * 5;
  }

  private calculateFinalDamage(baseDamage: number, type: string): { damage: number; multiplier: number; isCrit: boolean } {
    let damage = baseDamage;
    let multiplier = 1.0;
    let isCrit = false;

    const playerElement = this.getPlayerElement();
    const monsterElement = this.battleData.subject as keyof typeof SUBJECT_MAP;
    const advantages = SUBJECT_ADVANTAGE[playerElement] || [];
    
    const guaranteedAdvantage = (this as any).nextAttackGuaranteedAdvantage;
    if (guaranteedAdvantage) {
      (this as any).nextAttackGuaranteedAdvantage = false;
      multiplier = 1.5;
    } else if (advantages.includes(this.battleData.subject)) {
      multiplier = 1.5;
    } else {
      const monsterAdvantages = SUBJECT_ADVANTAGE[this.battleData.subject as keyof typeof SUBJECT_MAP] || [];
      if (monsterAdvantages.includes(playerElement)) {
        multiplier = 0.75;
      }
    }

    damage = Math.floor(damage * multiplier);

    const critChance = 0.05 + this.player.stats.soc * 0.005 + this.player.buffs.crit;
    if (Math.random() < critChance) {
      damage = Math.floor(damage * 1.5);
      isCrit = true;
    }

    const monsterDefense = this.monster.stats.end * 1.2 + this.monster.buffs.defense * 3;
    damage = Math.max(1, damage - monsterDefense);

    return { damage, multiplier, isCrit };
  }

  private calculateMonsterBaseDamage(): number {
    return 8 + this.monster.stats.str * 1.5 + this.monster.stats.int * 0.5 + this.monster.buffs.attack * 3;
  }

  private getEffectiveDefense(combatant: Combatant): number {
    return combatant.stats.end * 1.5 + combatant.buffs.defense * 3;
  }

  private addStatus(target: Combatant, type: string, turns: number, value?: number): void {
    if (this.hasStatus(target, type as any)) {
      const existing = target.statuses.find(s => s.type === type);
      if (existing) existing.turns = Math.max(existing.turns, turns);
      return;
    }
    target.statuses.push({ type: type as any, turns, value });
    this.addColoredLog(`${this.getCombatantName(target)}は${this.getStatusName(type as any)}状態になった！`, this.getStatusColor(type as any));
    this.playStatusSound(type);
  }

  private hasStatus(target: Combatant, type: string): boolean {
    return target.statuses.some(s => s.type === type);
  }

  private removeStatus(target: Combatant, type: string): void {
    target.statuses = target.statuses.filter(s => s.type !== type);
  }

  private processStatusEffects(targetName: 'player' | 'monster', timing: 'turn_start' | 'turn_end'): void {
    const target = targetName === 'player' ? this.player : this.monster;
    const name = targetName === 'player' ? 'あなた' : '敵';

    for (const status of [...target.statuses]) {
      if (timing === 'turn_start') {
        switch (status.type) {
          case 'burn':
            const burnDmg = Math.floor(target.maxHp * 0.08);
            target.hp = Math.max(0, target.hp - burnDmg);
            this.addColoredLog(`${name}は火傷で${burnDmg}ダメージを受けた！`, 0xEF4444);
            this.playStatusSound('burn');
            break;
          case 'poison':
            const poisonDmg = Math.floor(target.maxHp * 0.05);
            target.hp = Math.max(0, target.hp - poisonDmg);
            this.addColoredLog(`${name}は毒で${poisonDmg}ダメージを受けた！`, 0x8B5CF6);
            this.playStatusSound('poison');
            break;
        }
        if (targetName === 'player') this.updatePlayerHpBar();
        else this.updateMonsterHpBar();
      }

      if (timing === 'turn_end') {
        status.turns--;
        if (status.turns <= 0) {
          this.removeStatus(target, status.type);
          this.addColoredLog(`${name}の${this.getStatusName(status.type)}が解けた！`, 0x10B981);
          this.playStatusSound('cure');
        }
      }
    }

    if (targetName === 'player') this.updatePlayerHpBar();
    else this.updateMonsterHpBar();

    if (this.player.hp <= 0) this.defeat();
    if (this.monster.hp <= 0) this.victory();
  }

  private getStatusName(type: string): string {
    const names: Record<string, string> = {
      stun: 'スタン', burn: '火傷', silence: '沈黙', confuse: '混乱',
      poison: '毒', defense_up: '防御アップ', attack_up: '攻撃アップ',
      defense_down: '防御ダウン', crit_up: '会心率アップ'
    };
    return names[type] || type;
  }

  private getStatusColor(type: string): number {
    const colors: Record<string, number> = {
      stun: 0xF59E0B, burn: 0xEF4444, silence: 0x6B7280, confuse: 0xEC4899,
      poison: 0x8B5CF6, defense_up: 0x3B82F6, attack_up: 0xF59E0B,
      defense_down: 0xEF4444, crit_up: 0xF59E0B
    };
    return colors[type] || 0xFFFFFF;
  }

  private getCombatantName(target: Combatant): string {
    return target === this.player ? 'あなた' : '敵';
  }

  private getEffectName(key: string): string {
    const names: Record<string, string> = {
      player_stun: 'スタン', player_burn: '火傷', player_silence: '沈黙',
      player_confuse: '混乱', player_defense_down: '防御ダウン'
    };
    return names[key] || key;
  }

  private playSound(name: string, volume: number = 1.0): void {
    try {
      const sound = Sound.find(name);
      if (sound) {
        sound.volume = volume;
        sound.play();
      }
    } catch (e) {}
  }

  private playElementalSound(element: string): void {
    const sounds: Record<string, string> = {
      mathematics: 'element_rock',
      english: 'element_dragon',
      japanese: 'element_mage',
      science: 'element_fire',
      social: 'element_nature',
      physical: 'element_beast',
      art: 'element_cat',
    };
    this.playSound(sounds[element] || 'attack_hit');
  }

  private playStatusSound(status: string): void {
    const sounds: Record<string, string> = {
      burn: 'status_burn',
      stun: 'status_stun',
      poison: 'status_poison',
      cure: 'status_cure',
    };
    this.playSound(sounds[status] || 'ui_click');
  }

  private animateAttack(attacker: 'player' | 'monster', onComplete: () => void): void {
    const sprite = attacker === 'player' ? null : this.monsterSprite;
    const target = attacker === 'player' ? this.monsterSprite : null;
    
    if (!sprite || !target) {
      onComplete();
      return;
    }

    const originalX = sprite.x;
    const originalY = sprite.y;
    const targetX = target.x;
    const targetY = target.y;

    const duration = 200;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      sprite.x = originalX + (targetX - originalX - 50) * eased;
      sprite.y = originalY + (targetY - originalY) * eased;
      sprite.scale.set(3 * (1 + 0.1 * Math.sin(progress * Math.PI * 4)));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const returnStart = Date.now();
        const returnAnimate = () => {
          const retElapsed = Date.now() - returnStart;
          const retProgress = Math.min(retElapsed / 200, 1);
          const retEased = retProgress < 0.5 ? 2 * retProgress * retProgress : 1 - Math.pow(-2 * retProgress + 2, 2) / 2;
          
          sprite.x = originalX + (targetX - originalX - 50) * (1 - retEased);
          sprite.y = originalY + (targetY - originalY) * (1 - retEased);
          sprite.scale.set(3);
          
          if (retProgress < 1) requestAnimationFrame(returnAnimate);
          else {
            sprite.x = originalX;
            sprite.y = originalY;
            sprite.scale.set(3);
            onComplete();
          }
        };
        requestAnimationFrame(returnAnimate);
      }
    };
    requestAnimationFrame(animate);
  }

  private animateSkill(skill: { name: string; effect: string; cooldown: number }, onComplete: () => void): void {
    const flash = new Graphics();
    flash.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x8B5CF6, alpha: 0.3 });
    this.container.addChild(flash);
    
    let alpha = 0.3;
    const fade = () => {
      alpha *= 0.85;
      flash.clear().rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x8B5CF6, alpha });
      if (alpha > 0.01) requestAnimationFrame(fade);
      else { flash.destroy(); onComplete(); }
    };
    requestAnimationFrame(fade);
  }

  private victory(): void {
    this.phase = 'victory';
    this.addColoredLog('勝利！', 0x10B981);
    this.playSound('victory', 0.7);
    this.phaseText.text = '勝利！';
    this.phaseText.style.fill = 0x10B981;

    let xp = this.battleData.xpReward;
    let gold = this.battleData.goldReward;
    const items: any[] = [];

    xp = Math.floor(xp * (1 + this.battleData.difficulty * 0.2));
    gold = Math.floor(gold * (1 + this.battleData.difficulty * 0.2));

    if (this.battleData.spawnPeriod === 'night') {
      xp = Math.floor(xp * 1.3);
      gold = Math.floor(gold * 1.3);
      this.addColoredLog('夜間ボーナス！ 報酬1.3倍', 0xF59E0B);
    } else if (this.battleData.spawnPeriod === 'overdue') {
      xp = Math.floor(xp * 1.5);
      gold = Math.floor(gold * 1.5);
      this.addColoredLog('期限切れボーナス！ 報酬1.5倍', 0xEF4444);
    }

    if (this.battleData.difficulty >= 3 && Math.random() < 0.3) {
      items.push({ itemId: 'item-xp-book', quantity: 1 });
      this.addColoredLog('アイテム入手：経験値の本', 0x8B5CF6);
    }

    this.addColoredLog(`報酬: XP +${xp}, ゴールド +${gold}`, 0xF59E0B);

    setTimeout(() => this.battleData.onVictory({ xp, gold, items }), 1500);
  }

  private defeat(): void {
    this.phase = 'defeat';
    this.addColoredLog('敗北...', 0xEF4444);
    this.playSound('defeat', 0.7);
    this.phaseText.text = '敗北';
    this.phaseText.style.fill = 0xEF4444;
    setTimeout(() => this.battleData.onDefeat(), 1500);
  }

  private playSound(name: string, volume: number = 1.0): void {
    try {
      const sound = Sound.find(name);
      if (sound) {
        sound.volume = volume;
        sound.play();
      }
    } catch (e) {}
  }

  private playElementalSound(element: string): void {
    const sounds: Record<string, string> = {
      mathematics: 'element_rock',
      english: 'element_dragon',
      japanese: 'element_mage',
      science: 'element_fire',
      social: 'element_nature',
      physical: 'element_beast',
      art: 'element_cat',
    };
    this.playSound(sounds[element] || 'attack_hit');
  }

  private playStatusSound(status: string): void {
    const sounds: Record<string, string> = {
      burn: 'status_burn',
      stun: 'status_stun',
      poison: 'status_poison',
      cure: 'status_cure',
    };
    this.playSound(sounds[status] || 'ui_click');
  }

  private animateAttack(attacker: 'player' | 'monster', onComplete: () => void): void {
    const sprite = attacker === 'player' ? null : this.monsterSprite;
    const target = attacker === 'player' ? this.monsterSprite : null;
    
    if (!sprite || !target) {
      onComplete();
      return;
    }

    const originalX = sprite.x;
    const originalY = sprite.y;
    const targetX = target.x;
    const targetY = target.y;

    const duration = 200;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      sprite.x = originalX + (targetX - originalX - 50) * eased;
      sprite.y = originalY + (targetY - originalY) * eased;
      sprite.scale.set(3 * (1 + 0.1 * Math.sin(progress * Math.PI * 4)));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const returnStart = Date.now();
        const returnAnimate = () => {
          const retElapsed = Date.now() - returnStart;
          const retProgress = Math.min(retElapsed / 200, 1);
          const retEased = retProgress < 0.5 ? 2 * retProgress * retProgress : 1 - Math.pow(-2 * retProgress + 2, 2) / 2;
          
          sprite.x = originalX + (targetX - originalX - 50) * (1 - retEased);
          sprite.y = originalY + (targetY - originalY) * (1 - retEased);
          sprite.scale.set(3);
          
          if (retProgress < 1) requestAnimationFrame(returnAnimate);
          else {
            sprite.x = originalX;
            sprite.y = originalY;
            sprite.scale.set(3);
            onComplete();
          }
        };
        requestAnimationFrame(returnAnimate);
      }
    };
    requestAnimationFrame(animate);
  }

  private animateSkill(skill: { name: string; effect: string; cooldown: number }, onComplete: () => void): void {
    const flash = new Graphics();
    flash.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x8B5CF6, alpha: 0.3 });
    this.container.addChild(flash);
    
    let alpha = 0.3;
    const fade = () => {
      alpha *= 0.85;
      flash.clear().rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x8B5CF6, alpha });
      if (alpha > 0.01) requestAnimationFrame(fade);
      else { flash.destroy(); onComplete(); }
    };
    requestAnimationFrame(fade);
  }

  private victory(): void {
    this.phase = 'victory';
    this.addColoredLog('勝利！', 0x10B981);
    this.playSound('victory', 0.7);
    this.phaseText.text = '勝利！';
    this.phaseText.style.fill = 0x10B981;

    let xp = this.battleData.xpReward;
    let gold = this.battleData.goldReward;
    const items: any[] = [];

    xp = Math.floor(xp * (1 + this.battleData.difficulty * 0.2));
    gold = Math.floor(gold * (1 + this.battleData.difficulty * 0.2));

    if (this.battleData.spawnPeriod === 'night') {
      xp = Math.floor(xp * 1.3);
      gold = Math.floor(gold * 1.3);
      this.addColoredLog('夜間ボーナス！ 報酬1.3倍', 0xF59E0B);
    } else if (this.battleData.spawnPeriod === 'overdue') {
      xp = Math.floor(xp * 1.5);
      gold = Math.floor(gold * 1.5);
      this.addColoredLog('期限切れボーナス！ 報酬1.5倍', 0xEF4444);
    }

    if (this.battleData.difficulty >= 3 && Math.random() < 0.3) {
      items.push({ itemId: 'item-xp-book', quantity: 1 });
      this.addColoredLog('アイテム入手：経験値の本', 0x8B5CF6);
    }

    this.addColoredLog(`報酬: XP +${xp}, ゴールド +${gold}`, 0xF59E0B);

    setTimeout(() => this.battleData.onVictory({ xp, gold, items }), 1500);
  }

  private defeat(): void {
    this.phase = 'defeat';
    this.addColoredLog('敗北...', 0xEF4444);
    this.playSound('defeat', 0.7);
    this.phaseText.text = '敗北';
    this.phaseText.style.fill = 0xEF4444;
    setTimeout(() => this.battleData.onDefeat(), 1500);
  }

  private playSound(name: string, volume: number = 1.0): void {
    try {
      const sound = Sound.find(name);
      if (sound) {
        sound.volume = volume;
        sound.play();
      }
    } catch (e) {}
  }

  private playElementalSound(element: string): void {
    const sounds: Record<string, string> = {
      mathematics: 'element_rock',
      english: 'element_dragon',
      japanese: 'element_mage',
      science: 'element_fire',
      social: 'element_nature',
      physical: 'element_beast',
      art: 'element_cat',
    };
    this.playSound(sounds[element] || 'attack_hit');
  }

  private playStatusSound(status: string): void {
    const sounds: Record<string, string> = {
      burn: 'status_burn',
      stun: 'status_stun',
      poison: 'status_poison',
      cure: 'status_cure',
    };
    this.playSound(sounds[status] || 'ui_click');
  }

  private animateAttack(attacker: 'player' | 'monster', onComplete: () => void): void {
    const sprite = attacker === 'player' ? null : this.monsterSprite;
    const target = attacker === 'player' ? this.monsterSprite : null;
    
    if (!sprite || !target) {
      onComplete();
      return;
    }

    const originalX = sprite.x;
    const originalY = sprite.y;
    const targetX = target.x;
    const targetY = target.y;

    const duration = 200;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      sprite.x = originalX + (targetX - originalX - 50) * eased;
      sprite.y = originalY + (targetY - originalY) * eased;
      sprite.scale.set(3 * (1 + 0.1 * Math.sin(progress * Math.PI * 4)));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const returnStart = Date.now();
        const returnAnimate = () => {
          const retElapsed = Date.now() - returnStart;
          const retProgress = Math.min(retElapsed / 200, 1);
          const retEased = retProgress < 0.5 ? 2 * retProgress * retProgress : 1 - Math.pow(-2 * retProgress + 2, 2) / 2;
          
          sprite.x = originalX + (targetX - originalX - 50) * (1 - retEased);
          sprite.y = originalY + (targetY - originalY) * (1 - retEased);
          sprite.scale.set(3);
          
          if (retProgress < 1) requestAnimationFrame(returnAnimate);
          else {
            sprite.x = originalX;
            sprite.y = originalY;
            sprite.scale.set(3);
            onComplete();
          }
        };
        requestAnimationFrame(returnAnimate);
      }
    };
    requestAnimationFrame(animate);
  }

  private animateSkill(skill: { name: string; effect: string; cooldown: number }, onComplete: () => void): void {
    const flash = new Graphics();
    flash.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x8B5CF6, alpha: 0.3 });
    this.container.addChild(flash);
    
    let alpha = 0.3;
    const fade = () => {
      alpha *= 0.85;
      flash.clear().rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x8B5CF6, alpha });
      if (alpha > 0.01) requestAnimationFrame(fade);
      else { flash.destroy(); onComplete(); }
    };
    requestAnimationFrame(fade);
  }

  private victory(): void {
    this.phase = 'victory';
    this.addColoredLog('勝利！', 0x10B981);
    this.playSound('victory', 0.7);
    this.phaseText.text = '勝利！';
    this.phaseText.style.fill = 0x10B981;

    let xp = this.battleData.xpReward;
    let gold = this.battleData.goldReward;
    const items: any[] = [];

    xp = Math.floor(xp * (1 + this.battleData.difficulty * 0.2));
    gold = Math.floor(gold * (1 + this.battleData.difficulty * 0.2));

    if (this.battleData.spawnPeriod === 'night') {
      xp = Math.floor(xp * 1.3);
      gold = Math.floor(gold * 1.3);
      this.addColoredLog('夜間ボーナス！ 報酬1.3倍', 0xF59E0B);
    } else if (this.battleData.spawnPeriod === 'overdue') {
      xp = Math.floor(xp * 1.5);
      gold = Math.floor(gold * 1.5);
      this.addColoredLog('期限切れボーナス！ 報酬1.5倍', 0xEF4444);
    }

    if (this.battleData.difficulty >= 3 && Math.random() < 0.3) {
      items.push({ itemId: 'item-xp-book', quantity: 1 });
      this.addColoredLog('アイテム入手：経験値の本', 0x8B5CF6);
    }

    this.addColoredLog(`報酬: XP +${xp}, ゴールド +${gold}`, 0xF59E0B);

    setTimeout(() => this.battleData.onVictory({ xp, gold, items }), 1500);
  }

  private defeat(): void {
    this.phase = 'defeat';
    this.addColoredLog('敗北...', 0xEF4444);
    this.playSound('defeat', 0.7);
    this.phaseText.text = '敗北';
    this.phaseText.style.fill = 0xEF4444;
    setTimeout(() => this.battleData.onDefeat(), 1500);
  }

  private playSound(name: string, volume: number = 1.0): void {
    try {
      const sound = Sound.find(name);
      if (sound) {
        sound.volume = volume;
        sound.play();
      }
    } catch (e) {}
  }

  private playElementalSound(element: string): void {
    const sounds: Record<string, string> = {
      mathematics: 'element_rock',
      english: 'element_dragon',
      japanese: 'element_mage',
      science: 'element_fire',
      social: 'element_nature',
      physical: 'element_beast',
      art: 'element_cat',
    };
    this.playSound(sounds[element] || 'attack_hit');
  }

  private playStatusSound(status: string): void {
    const sounds: Record<string, string> = {
      burn: 'status_burn',
      stun: 'status_stun',
      poison: 'status_poison',
      cure: 'status_cure',
    };
    this.playSound(sounds[status] || 'ui_click');
  }

  private animateAttack(attacker: 'player' | 'monster', onComplete: () => void): void {
    const sprite = attacker === 'player' ? null : this.monsterSprite;
    const target = attacker === 'player' ? this.monsterSprite : null;
    
    if (!sprite || !target) {
      onComplete();
      return;
    }

    const originalX = sprite.x;
    const originalY = sprite.y;
    const targetX = target.x;
    const targetY = target.y;

    const duration = 200;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      sprite.x = originalX + (targetX - originalX - 50) * eased;
      sprite.y = originalY + (targetY - originalY) * eased;
      sprite.scale.set(3 * (1 + 0.1 * Math.sin(progress * Math.PI * 4)));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const returnStart = Date.now();
        const returnAnimate = () => {
          const retElapsed = Date.now() - returnStart;
          const retProgress = Math.min(retElapsed / 200, 1);
          const retEased = retProgress < 0.5 ? 2 * retProgress * retProgress : 1 - Math.pow(-2 * retProgress + 2, 2) / 2;
          
          sprite.x = originalX + (targetX - originalX - 50) * (1 - retEased);
          sprite.y = originalY + (targetY - originalY) * (1 - retEased);
          sprite.scale.set(3);
          
          if (retProgress < 1) requestAnimationFrame(returnAnimate);
          else {
            sprite.x = originalX;
            sprite.y = originalY;
            sprite.scale.set(3);
            onComplete();
          }
        };
        requestAnimationFrame(returnAnimate);
      }
    };
    requestAnimationFrame(animate);
  }

  private animateSkill(skill: { name: string; effect: string; cooldown: number }, onComplete: () => void): void {
    const flash = new Graphics();
    flash.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x8B5CF6, alpha: 0.3 });
    this.container.addChild(flash);
    
    let alpha = 0.3;
    const fade = () => {
      alpha *= 0.85;
      flash.clear().rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x8B5CF6, alpha });
      if (alpha > 0.01) requestAnimationFrame(fade);
      else { flash.destroy(); onComplete(); }
    };
    requestAnimationFrame(fade);
  }

  private defeat(): void {
    this.phase = 'defeat';
    this.addColoredLog('敗北...', 0xEF4444);
    this.playSound('defeat', 0.7);
    this.phaseText.text = '敗北';
    this.phaseText.style.fill = 0xEF4444;
    setTimeout(() => this.battleData.onDefeat(), 1500);
  }

  private playSound(name: string, volume: number = 1.0): void {
    try {
      const sound = Sound.find(name);
      if (sound) {
        sound.volume = volume;
        sound.play();
      }
    } catch (e) {}
  }

  private playElementalSound(element: string): void {
    const sounds: Record<string, string> = {
      mathematics: 'element_rock',
      english: 'element_dragon',
      japanese: 'element_mage',
      science: 'element_fire',
      social: 'element_nature',
      physical: 'element_beast',
      art: 'element_cat',
    };
    this.playSound(sounds[element] || 'attack_hit');
  }

  private playStatusSound(status: string): void {
    const sounds: Record<string, string> = {
      burn: 'status_burn',
      stun: 'status_stun',
      poison: 'status_poison',
      cure: 'status_cure',
    };
    this.playSound(sounds[status] || 'ui_click');
  }

  private animateAttack(attacker: 'player' | 'monster', onComplete: () => void): void {
    const sprite = attacker === 'player' ? null : this.monsterSprite;
    const target = attacker === 'player' ? this.monsterSprite : null;
    
    if (!sprite || !target) {
      onComplete();
      return;
    }

    const originalX = sprite.x;
    const originalY = sprite.y;
    const targetX = target.x;
    const targetY = target.y;

    const duration = 200;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      sprite.x = originalX + (targetX - originalX - 50) * eased;
      sprite.y = originalY + (targetY - originalY) * eased;
      sprite.scale.set(3 * (1 + 0.1 * Math.sin(progress * Math.PI * 4)));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const returnStart = Date.now();
        const returnAnimate = () => {
          const retElapsed = Date.now() - returnStart;
          const retProgress = Math.min(retElapsed / 200, 1);
          const retEased = retProgress < 0.5 ? 2 * retProgress * retProgress : 1 - Math.pow(-2 * retProgress + 2, 2) / 2;
          
          sprite.x = originalX + (targetX - originalX - 50) * (1 - retEased);
          sprite.y = originalY + (targetY - originalY) * (1 - retEased);
          sprite.scale.set(3);
          
          if (retProgress < 1) requestAnimationFrame(returnAnimate);
          else {
            sprite.x = originalX;
            sprite.y = originalY;
            sprite.scale.set(3);
            onComplete();
          }
        };
        requestAnimationFrame(returnAnimate);
      }
    };
    requestAnimationFrame(animate);
  }

  private animateSkill(skill: { name: string; effect: string; cooldown: number }, onComplete: () => void): void {
    const flash = new Graphics();
    flash.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x8B5CF6, alpha: 0.3 });
    this.container.addChild(flash);
    
    let alpha = 0.3;
    const fade = () => {
      alpha *= 0.85;
      flash.clear().rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x8B5CF6, alpha });
      if (alpha > 0.01) requestAnimationFrame(fade);
      else { flash.destroy(); onComplete(); }
    };
    requestAnimationFrame(fade);
  }

  private disableButtons(): void {
    for (const [id, { btn }] of this.actionButtons) {
      (btn as any).buttonMode = false;
      btn.alpha = 0.5;
    }
  }

  private enableButtons(): void {
    for (const [id, { btn, cdOverlay }] of this.actionButtons) {
      (btn as any).buttonMode = true;
      btn.alpha = cdOverlay.visible ? 0.7 : 1;
    }
  }

  private updateButtonCooldowns(): void {
    const playerElement = this.getPlayerElement();
    const skill = SUBJECT_PLAYER_SKILLS[playerElement];
    
    for (const [id, { cdOverlay, cdText }] of this.actionButtons) {
      if (id === 'skill' && this.player.cooldowns[skill.name] > 0) {
        cdOverlay.visible = true;
        cdText.visible = true;
        cdText.text = this.player.cooldowns[skill.name].toString();
        cdText.position.set(0, 0);
      } else {
        cdOverlay.visible = false;
        cdText.visible = false;
      }
    }
  }

  update(): void {}

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
