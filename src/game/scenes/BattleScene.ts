import { Container, Graphics, Text, TextStyle, Sprite, Texture, Application } from 'pixi.js';
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

type BattlePhase = 'player_turn' | 'monster_turn' | 'victory' | 'defeat' | 'flee';

export class BattleScene implements Scene {
  name: 'battle' = 'battle';
  container = new Container();
  
  private battleData!: BattleData;
  private phase: BattlePhase = 'player_turn';
  private turnCount = 0;
  private cooldowns: Record<string, number> = {};
  private statusEffects: Record<string, number> = {};
  
  private monsterSprite!: Sprite;
  private monsterHpBar!: Graphics;
  private playerHpBar!: Graphics;
  private actionButtons: Graphics[] = [];
  private logText!: Text;
  private phaseText!: Text;
  
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  init(data: BattleData): void {
    this.battleData = data;
    this.phase = 'player_turn';
    this.turnCount = 0;
    this.cooldowns = {};
    this.statusEffects = {};
  }

  create(): void {
    this.createBackground();
    this.createMonster();
    this.createPlayerUI();
    this.createActionButtons();
    this.createLog();
    this.createPhaseIndicator();
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
  }

  private createMonster(): void {
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

    const infoText = new Text(
      `${subjectData?.emojis[this.battleData.difficulty as 1 | 2 | 3] || '❓'} ${subjectData?.monster || 'モンスター'} (難易度 ${this.battleData.difficulty})`,
      new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 20, fontWeight: 'bold', fill: 0xFFFFFF })
    );
    infoText.anchor.set(0.5);
    infoText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 230);
    this.container.addChild(infoText);

    const hpText = new Text(`${this.battleData.hp} / ${this.battleData.maxHp}`, new TextStyle({
      fontFamily: 'Noto Sans JP', fontSize: 16, fill: 0xFFFFFF
    }));
    hpText.anchor.set(0.5);
    hpText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170);
    (hpText as any).isHpText = true;
    this.container.addChild(hpText);
  }

  private updateMonsterHpBar(): void {
    this.monsterHpBar.clear();
    const ratio = this.battleData.hp / this.battleData.maxHp;
    this.monsterHpBar.rect(0, 0, 300, 20).fill({ color: 0x000000, alpha: 0.5 });
    this.monsterHpBar.rect(0, 0, 300 * ratio, 20).fill(0xEF4444);
    this.monsterHpBar.rect(0, 0, 300 * ratio, 8).fill({ color: 0xFFFFFF, alpha: 0.3 });
  }

  private createPlayerUI(): void {
    const player = this.battleData.playerData;
    
    const maxPlayerHp = 50 + player.stats.end * 5;
    const currentPlayerHp = maxPlayerHp;
    
    this.playerHpBar = new Graphics();
    this.playerHpBar.position.set(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 + 150);
    this.playerHpBar.rect(0, 0, 300, 20).fill({ color: 0x000000, alpha: 0.5 });
    this.playerHpBar.rect(0, 0, 300, 20).fill(0x10B981);
    this.playerHpBar.rect(0, 0, 300, 8).fill({ color: 0xFFFFFF, alpha: 0.3 });
    this.playerHpBar.zIndex = 11;
    this.container.addChild(this.playerHpBar);

    const infoText = new Text(
      `Lv.${player.level} ${player.stats.int > 0 ? '知力' : '冒険者'} | HP: ${currentPlayerHp}/${maxPlayerHp}`,
      new TextStyle({ fontFamily: 'Noto Sans JP', fontSize: 16, fill: 0xFFFFFF })
    );
    infoText.anchor.set(0.5);
    infoText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
    this.container.addChild(infoText);
  }

  private createActionButtons(): void {
    const actions = [
      { id: 'attack', label: '⚔️ 攻撃', color: 0xEF4444, x: -180 },
      { id: 'skill', label: '✨ スキル', color: 0x8B5CF6, x: 0 },
      { id: 'item', label: '🎒 アイテム', color: 0xF59E0B, x: 180 },
      { id: 'flee', label: '🏃 逃げる', color: 0x6B7280, x: 360 },
    ];

    actions.forEach(action => {
      const btn = new Graphics();
      btn.roundRect(action.x - 80, 180, 160, 50, 10)
        .fill(action.color)
        .stroke({ width: 2, color: 0xFFFFFF, alpha: 0.5 });
      btn.zIndex = 20;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', () => this.handleAction(action.id));
      this.container.addChild(btn);

      const label = new Text(action.label, new TextStyle({
        fontFamily: 'Noto Sans JP', fontSize: 16, fontWeight: 'bold', fill: 0xFFFFFF
      }));
      label.anchor.set(0.5);
      label.position.set(action.x, 205);
      label.zIndex = 21;
      this.container.addChild(label);

      this.actionButtons.push(btn);
    });
  }

  private createLog(): void {
    this.logText = new Text('', new TextStyle({
      fontFamily: 'Noto Sans JP',
      fontSize: 14,
      fill: 0xFFFFFF,
      wordWrap: true,
      wordWrapWidth: 380,
      lineHeight: 22,
    }));
    this.logText.position.set(GAME_WIDTH / 2 - 400 + 20, GAME_HEIGHT / 2 - 180);
    this.logText.zIndex = 15;
    this.container.addChild(this.logText);
    this.addLog('バトル開始！');
  }

  private createPhaseIndicator(): void {
    this.phaseText = new Text('あなたのターン', new TextStyle({
      fontFamily: 'Noto Sans JP',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xF59E0B,
    }));
    this.phaseText.anchor.set(0.5);
    this.phaseText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 260);
    this.phaseText.zIndex = 15;
    this.container.addChild(this.phaseText);
  }

  private addLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    this.logText.text = `[${timestamp}] ${message}\n${this.logText.text}`;
    const lines = this.logText.text.split('\n');
    if (lines.length > 10) this.logText.text = lines.slice(0, 10).join('\n');
  }

  private handleAction(actionId: string): void {
    if (this.phase !== 'player_turn') return;

    switch (actionId) {
      case 'attack':
        this.playerAttack();
        break;
      case 'skill':
        this.playerSkill();
        break;
      case 'item':
        this.playerItem();
        break;
      case 'flee':
        this.playerFlee();
        break;
    }
  }

  private playerAttack(): void {
    const baseDamage = 10 + this.battleData.playerData.stats.str * 2;
    const subjectKey = this.battleData.subject as keyof typeof SUBJECT_MAP;
    const subjectData = SUBJECT_MAP[subjectKey];
    
    let multiplier = 1.0;
    const advantageTargets = SUBJECT_ADVANTAGE[subjectKey] || [];
    const playerType = this.getPlayerAttackType();
    if (advantageTargets.includes(playerType)) {
      multiplier = 1.5;
      this.addLog(`弱点を突いた！ 1.5倍ダメージ！`);
    }

    const damage = Math.floor(baseDamage * multiplier);
    this.battleData.hp = Math.max(0, this.battleData.hp - damage);
    this.addLog(`攻撃！ ${damage} のダメージ！`);

    this.updateMonsterHpBar();
    this.updateMonsterHpText();

    if (this.battleData.hp <= 0) {
      this.victory();
    } else {
      this.endPlayerTurn();
    }
  }

  private getPlayerAttackType(): keyof typeof SUBJECT_MAP {
    const stats = this.battleData.playerData.stats;
    const maxStat = Math.max(stats.int, stats.wis, stats.str, stats.end, stats.cre, stats.soc);
    if (maxStat === stats.int) return 'mathematics';
    if (maxStat === stats.wis) return 'english';
    if (maxStat === stats.str) return 'physical';
    if (maxStat === stats.end) return 'science';
    if (maxStat === stats.cre) return 'art';
    return 'social';
  }

  private playerSkill(): void {
    const subjectKey = this.battleData.subject as keyof typeof SUBJECT_MAP;
    const skill = SUBJECT_PLAYER_SKILLS[subjectKey];
    const playerType = this.getPlayerAttackType();
    const playerSkill = SUBJECT_PLAYER_SKILLS[playerType];
    
    if (this.cooldowns[playerSkill.name] > 0) {
      this.addLog(`${playerSkill.name} はクールダウン中 (${this.cooldowns[playerSkill.name]}ターン)`);
      return;
    }

    this.cooldowns[playerSkill.name] = playerSkill.cooldown;
    
    switch (playerSkill.effect) {
      case 'attack_up':
        this.addLog(`${playerSkill.name}！ 攻撃力上昇！`);
        (this as any).attackBuff = 2;
        break;
      case 'defense_up':
        this.addLog(`${playerSkill.name}！ 防御力上昇！`);
        (this as any).defenseBuff = 2;
        break;
      case 'heal':
        this.addLog(`${playerSkill.name}！ HP回復！`);
        break;
      case 'magic_up':
        this.addLog(`${playerSkill.name}！ 魔法威力上昇！`);
        break;
      case 'reveal_weakness':
        this.addLog(`${playerSkill.name}！ 弱点発見！`);
        break;
      case 'random_buff':
        this.addLog(`${playerSkill.name}！ ランダムな効果！`);
        break;
      default:
        this.addLog(`${playerSkill.name} を発動！`);
    }

    this.endPlayerTurn();
  }

  private playerItem(): void {
    this.addLog('アイテムを使おうとしたが、実装中です...');
    this.endPlayerTurn();
  }

  private playerFlee(): void {
    const fleeChance = 0.7;
    if (Math.random() < fleeChance) {
      this.addLog('逃げ切った！');
      this.phase = 'flee';
      setTimeout(() => this.battleData.onFlee(), 1000);
    } else {
      this.addLog('逃げられなかった！');
      this.endPlayerTurn();
    }
  }

  private endPlayerTurn(): void {
    this.phase = 'monster_turn';
    this.phaseText.text = '敵のターン';
    this.phaseText.style.fill = 0xEF4444;
    
    for (const key of Object.keys(this.cooldowns)) {
      this.cooldowns[key] = Math.max(0, this.cooldowns[key] - 1);
    }
    
    setTimeout(() => this.monsterTurn(), 1000);
  }

  private monsterTurn(): void {
    if (this.battleData.hp <= 0) return;

    const subjectKey = this.battleData.subject as keyof typeof SUBJECT_MAP;
    const specialMove = MONSTER_SPECIAL_MOVES[subjectKey];
    const useSpecial = specialMove && this.turnCount % specialMove.cooldown === 0 && Math.random() < 0.5;

    let damage = 8 + this.battleData.difficulty * 3;
    let message = '';

    if (useSpecial) {
      damage = Math.floor(damage * specialMove.power);
      message = `${specialMove.name}！ `;
      
      switch (specialMove.effect) {
        case 'stun':
          message += 'スタン！ 次のターン行動不能！';
          (this as any).playerStunned = true;
          break;
        case 'burn':
          message += '火傷！ ターン終了時にダメージ！';
          this.statusEffects.burn = 3;
          break;
        case 'silence':
          message += '沈黙！ スキル使用不可！';
          this.statusEffects.silence = 2;
          break;
        case 'aoe_burn':
          message += '範囲火傷！';
          this.statusEffects.burn = 2;
          break;
        case 'defense_down':
          message += '防御力低下！';
          (this as any).defenseDebuff = 2;
          break;
        case 'crit_up':
          message += '会心率上昇！';
          (this as any).critBuff = 2;
          break;
        case 'confuse':
          message += '混乱！';
          this.statusEffects.confuse = 2;
          break;
      }
    } else {
      message = '敵の攻撃！';
    }

    const defense = this.battleData.playerData.stats.end * 1.5;
    const actualDamage = Math.max(1, damage - defense);
    
    this.addLog(`${message} ${actualDamage} のダメージ！`);

    this.processStatusEffects();

    this.turnCount++;
    this.phase = 'player_turn';
    this.phaseText.text = 'あなたのターン';
    this.phaseText.style.fill = 0xF59E0B;
  }

  private processStatusEffects(): void {
    if (this.statusEffects.burn > 0) {
      this.addLog('火傷のダメージ！ 5ダメージ');
      this.statusEffects.burn--;
    }
    if (this.statusEffects.confuse > 0) {
      this.addLog('混乱している...');
      this.statusEffects.confuse--;
    }
  }

  private updateMonsterHpText(): void {
    const hpText = this.container.children.find((c: any) => c.isHpText);
    if (hpText) {
      hpText.text = `${this.battleData.hp} / ${this.battleData.maxHp}`;
    }
  }

  private victory(): void {
    this.phase = 'victory';
    this.addLog('勝利！');
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
      this.addLog('夜間ボーナス！ 報酬1.3倍');
    } else if (this.battleData.spawnPeriod === 'overdue') {
      xp = Math.floor(xp * 1.5);
      gold = Math.floor(gold * 1.5);
      this.addLog('期限切れボーナス！ 報酬1.5倍');
    }

    if (this.battleData.difficulty >= 3 && Math.random() < 0.3) {
      items.push({ itemId: 'item-xp-book', quantity: 1 });
      this.addLog('アイテム入手：経験値の本');
    }

    this.addLog(`報酬: XP +${xp}, ゴールド +${gold}`);

    setTimeout(() => this.battleData.onVictory({ xp, gold, items }), 1500);
  }

  update(): void {}

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
