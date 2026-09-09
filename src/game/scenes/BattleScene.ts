import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import {
  SUBJECT_MAP,
  SUBJECT_ADVANTAGE,
  MONSTER_SPECIAL_MOVES,
  SUBJECT_PLAYER_SKILLS,
  type Monster,
  type QuestReward,
  type SubjectStats,
} from '../../lib/game/types';
import { getRandomDrop, getSubjectDrops, type ItemDrop, ITEMS_BY_ID, RARITY } from '../../lib/game/items';

interface BattleSceneData {
  subject: string;
  difficulty: 1 | 2 | 3;
  monsterId: string;
  assignmentId?: string;
  playerData: {
    userId: string;
    level: number;
    xp: number;
    gold: number;
    streak: number;
  };
  playerStats?: {
    int: number;
    wis: number;
    str: number;
    end: number;
    cre: number;
    soc: number;
  };
  spawnPeriod?: string;
  isActivePeriod?: boolean;
  onVictory: (reward: QuestReward) => void;
  onDefeat: () => void;
  onFlee: () => void;
}

export class BattleScene extends Phaser.Scene {
  private battleData!: BattleSceneData;
  private monster!: Phaser.GameObjects.Sprite;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private monsterHp!: number;
  private monsterMaxHp!: number;
  private playerHp!: number;
  private playerMaxHp!: number;
  private turn: 'player' | 'monster' = 'player';
  private battleLog: Phaser.GameObjects.Text[] = [];
  private logContainer!: Phaser.GameObjects.Container;
  private actionButtons: Phaser.GameObjects.Container[] = [];
  private isAnimating = false;
  private playerStats!: SubjectStats;
  private nextCrit = false;
  private damageBoost = false;
  private defenseUp = false;
  private poisonTurns = 0;
  private stunTurns = 0;
  private monsterSpecialCooldown = 0;
  
  // 報酬計算用
  private baseXp = 0;
  private baseGold = 0;

  constructor() {
    super('BattleScene');
  }

  init(data: BattleSceneData): void {
    this.battleData = data;
    // Assign playerStats from data if provided
    if (data.playerStats) {
      this.playerStats = {
        int: data.playerStats.int || 0,
        wis: data.playerStats.wis || 0,
        str: data.playerStats.str || 0,
        end: data.playerStats.end || 0,
        cre: data.playerStats.cre || 0,
        soc: data.playerStats.soc || 0,
      };
    }
    this.setupBattleData();
  }

  private setupBattleData(): void {
    const { subject, difficulty, spawnPeriod, isActivePeriod } = this.battleData;
    const subjectData = SUBJECT_MAP[subject];
    
    // Spawn period modifiers
    const periodModifiers: Record<string, { hpMult: number; atkMult: number; defMult: number; xpMult: number; goldMult: number }> = {
      morning: { hpMult: 0.9, atkMult: 1.0, defMult: 0.9, xpMult: 1.2, goldMult: 1.0 },    // 朝: 弱いがXP多め
      afternoon: { hpMult: 1.0, atkMult: 1.0, defMult: 1.0, xpMult: 1.0, goldMult: 1.0 },  // 昼: 標準
      evening: { hpMult: 1.1, atkMult: 1.1, defMult: 1.0, xpMult: 1.1, goldMult: 1.1 },   // 夕方: 少し強い
      night: { hpMult: 1.3, atkMult: 1.3, defMult: 1.2, xpMult: 1.3, goldMult: 1.3 },     // 夜: 強いが報酬多め
      overdue: { hpMult: 1.5, atkMult: 1.5, defMult: 1.3, xpMult: 1.5, goldMult: 1.5 },    // 期限切れ: 最強
    };
    
    const mod = periodModifiers[spawnPeriod || 'afternoon'] || periodModifiers.afternoon;
    
    // 非活性期間なら弱体化
    const inactiveMult = isActivePeriod === false ? 0.7 : 1.0;
    
    // モンスターステータス計算
    const hpMultiplier = { 1: 1, 2: 1.5, 3: 2.5 }[difficulty];
    const atkMultiplier = { 1: 1, 2: 1.3, 3: 1.8 }[difficulty];
    
    this.monsterMaxHp = Math.floor(50 * hpMultiplier * (1 + this.battleData.playerData.level * 0.1) * mod.hpMult * inactiveMult);
    this.monsterHp = this.monsterMaxHp;
    
    // プレイヤーHP（レベルとスタミナステータス依存）
    this.playerMaxHp = 100 + this.battleData.playerData.level * 10 + (this.playerStats?.end || 0) * 5;
    this.playerHp = this.playerMaxHp;
    
    // 基礎報酬（spawnPeriod修正込み）
    this.baseXp = Math.floor(difficulty * 10 * (1 + this.battleData.playerData.streak * 0.05) * mod.xpMult);
    this.baseGold = Math.floor(difficulty * 10 * (1 + this.battleData.playerData.streak * 0.05) * mod.goldMult);
    
    // Store modifiers for damage calculation
    (this as any).monsterAtkMult = atkMultiplier * mod.atkMult * inactiveMult;
    (this as any).monsterDefMult = mod.defMult * inactiveMult;
  }

  create(): void {
    this.createBackground();
    this.createPlayer();
    this.createMonster();
    this.createUI();
    this.createActionButtons();
    this.createBattleLog();
    this.showBattleStart();
  }

  private createBackground(): void {
    // バトル背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // 装飾的なパターン
    bg.lineStyle(1, 0x6B46C1, 0.1);
    for (let i = 0; i < GAME_WIDTH; i += 40) {
      bg.lineBetween(i, 0, i, GAME_HEIGHT);
    }
    for (let i = 0; i < GAME_HEIGHT; i += 40) {
      bg.lineBetween(0, i, GAME_WIDTH, i);
    }
  }

  private createPlayer(): void {
    // プレイヤースプライト（左側）
    this.playerSprite = this.add.sprite(200, GAME_HEIGHT - 150, 'player');
    this.playerSprite.setScale(2.5);
    this.playerSprite.setDepth(10);
    this.playerSprite.play('player-idle-right');
    
    // プレイヤーHPバー
    this.createHpBar(100, GAME_HEIGHT - 220, this.playerHp, this.playerMaxHp, 'player-hp', 0x10B981);
  }

  private createMonster(): void {
    const { subject, difficulty, spawnPeriod, isActivePeriod } = this.battleData;
    const subjectData = SUBJECT_MAP[subject];
    const emoji = subjectData.emojis[difficulty];
    
    // Spawn period info
    const periodLabel: Record<string, { emoji: string; name: string }> = {
      morning: { emoji: '🌅', name: '朝' },
      afternoon: { emoji: '☀️', name: '昼' },
      evening: { emoji: '🌆', name: '夕方' },
      night: { emoji: '🌙', name: '夜' },
      overdue: { emoji: '⚠️', name: '期限切れ' },
    };
    const periodInfo = spawnPeriod ? periodLabel[spawnPeriod] : null;
    
    // モンスタースプライト（右側）
    const subjectToMonster: Record<string, string> = {
      数学: 'golem',
      英語: 'dragon',
      国語: 'mage',
      理科: 'phoenix',
      社会: 'titan',
      体育: 'berserker',
      芸術: 'nekomata',
    };
    const monsterKey = `monster-${subjectToMonster[subject] || 'golem'}`;
    
    this.monster = this.add.sprite(GAME_WIDTH - 200, 200, monsterKey);
    this.monster.setScale(2.5);
    this.monster.setDepth(10);
    this.monster.setFlipX(true); // 左を向く
    this.monster.play('monster-idle');
    
    // モンスター名・情報
    let monsterName = `${emoji} ${subjectData.monster} Lv.${this.battleData.playerData.level + difficulty}`;
    if (periodInfo) {
      monsterName += ` ${periodInfo.emoji}${periodInfo.name}`;
    }
    if (isActivePeriod === false) {
      monsterName += ' (非活性)';
    }
    
    this.add.text(
      GAME_WIDTH - 200,
      100,
      monsterName,
      { font: '18px Noto Sans JP', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(0.5).setDepth(10);
    
    // 難易度星
    const stars = '★'.repeat(difficulty) + '☆'.repeat(3 - difficulty);
    this.add.text(
      GAME_WIDTH - 200,
      130,
      stars,
      { font: '16px', color: '#F59E0B' }
    ).setOrigin(0.5).setDepth(10);
    
    // Spawn period detail
    if (periodInfo) {
      const activeText = isActivePeriod === false ? ' (非活性: 弱体化)' : ' (活性)';
      this.add.text(
        GAME_WIDTH - 200,
        155,
        `${periodInfo.emoji} ${periodInfo.name}出現${activeText}`,
        { font: '12px Noto Sans JP', color: isActivePeriod === false ? '#F59E0B' : '#10B981', stroke: '#000000', strokeThickness: 2 }
      ).setOrigin(0.5).setDepth(10);
    }
    
    // モンスターHPバー
    this.createHpBar(GAME_WIDTH - 300, 160, this.monsterHp, this.monsterMaxHp, 'monster-hp', 0xEF4444);
  }
  
  private createHpBar(x: number, y: number, current: number, max: number, name: string, color: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setName(name);
    container.setDepth(20);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(-150, -10, 300, 20, 10);
    
    const fill = this.add.graphics();
    fill.fillStyle(color, 1);
    fill.fillRoundedRect(-148, -8, 296 * (current / max), 16, 8);
    fill.setName('fill');
    
    const text = this.add.text(0, 0, `${current} / ${max}`, { 
      font: '12px Noto Sans JP', 
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2 
    }).setOrigin(0.5).setName('text');
    
    container.add([bg, fill, text]);
    return container;
  }
  
  private updateHpBar(name: string, current: number, max: number): void {
    const container = this.children.getByName(name) as Phaser.GameObjects.Container;
    if (container) {
      const fill = container.getByName('fill') as Phaser.GameObjects.Graphics;
      const text = container.getByName('text') as Phaser.GameObjects.Text;
      
      fill.clear();
      fill.fillStyle(name === 'player-hp' ? 0x10B981 : 0xEF4444, 1);
      fill.fillRoundedRect(-148, -8, Math.max(0, 296 * (current / max)), 16, 8);
      text.setText(`${Math.max(0, current)} / ${max}`);
    }
  }

  private createUI(): void {
    // ターン表示
    this.add.text(
      GAME_WIDTH / 2,
      50,
      '⚔️ バトル開始！',
      { font: '24px Noto Sans JP', color: '#F59E0B', stroke: '#000000', strokeThickness: 4 }
    ).setOrigin(0.5).setDepth(20).setName('turn-text');
  }

  private createActionButtons(): void {
    const actions = [
      { key: 'attack', label: '⚔️ 攻撃', color: 0xEF4444, callback: () => this.playerAttack() },
      { key: 'skill', label: '✨ スキル', color: 0x8B5CF6, callback: () => this.playerSkill() },
      { key: 'item', label: '🎁 アイテム', color: 0xF59E0B, callback: () => this.playerItem() },
      { key: 'flee', label: '🏃 逃げる', color: 0x6B7280, callback: () => this.playerFlee() },
    ];
    
    const buttonWidth = 180;
    const buttonHeight = 50;
    const startX = (GAME_WIDTH - (buttonWidth * 4 + 20 * 3)) / 2;
    const y = GAME_HEIGHT - 100;
    
    actions.forEach((action, index) => {
      const x = startX + index * (buttonWidth + 20);
      
      const container = this.add.container(x, y);
      container.setDepth(20);
      container.setName(`btn-${action.key}`);
      
      const bg = this.add.graphics();
      bg.fillStyle(action.color, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      
      const text = this.add.text(0, 0, action.label, { 
        font: '16px Noto Sans JP', 
        color: '#ffffff' 
      }).setOrigin(0.5);
      
      container.add([bg, text]);
      container.setSize(buttonWidth, buttonHeight);
      container.setInteractive(new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
      
      container.on('pointerdown', action.callback);
      container.on('pointerover', () => bg.fillStyle(action.color, 0.8));
      container.on('pointerout', () => bg.fillStyle(action.color, 1));
      
      this.actionButtons.push(container);
    });
  }
  
  private setButtonsEnabled(enabled: boolean): void {
    this.actionButtons.forEach(btn => {
      btn.setVisible(enabled);
      (btn as any).input.enabled = enabled;
    });
  }

  private createBattleLog(): void {
    this.logContainer = this.add.container(50, GAME_HEIGHT - 300);
    this.logContainer.setDepth(20);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(0, 0, 400, 200, 10);
    this.logContainer.add(bg);
    
    const title = this.add.text(10, 10, '📜 バトルログ', { font: '14px Noto Sans JP', color: '#F59E0B' });
    this.logContainer.add(title);
  }
  
  private addLog(message: string, color: string = '#ffffff'): void {
    const y = 35 + this.battleLog.length * 22;
    const text = this.add.text(10, y, message, { font: '13px Noto Sans JP', color }).setOrigin(0, 0);
    this.logContainer.add(text);
    this.battleLog.push(text);
    
    // 最大8行まで
    if (this.battleLog.length > 8) {
      const old = this.battleLog.shift()!;
      old.destroy();
      this.battleLog.forEach((log, i) => {
        log.setY(35 + i * 22);
      });
    }
  }

  private showBattleStart(): void {
    this.addLog('⚔️ バトル開始！', '#F59E0B');
    this.addLog(`敵: ${SUBJECT_MAP[this.battleData.subject].monster} (難易度${this.battleData.difficulty})`, '#ffffff');
    this.setTurn('player');
  }
  
  private setTurn(turn: 'player' | 'monster'): void {
    this.turn = turn;
    const turnText = this.children.getByName('turn-text') as Phaser.GameObjects.Text;
    if (turnText) {
      turnText.setText(turn === 'player' ? '🎯 あなたのターン' : '👾 敵のターン');
      turnText.setColor(turn === 'player' ? '#10B981' : '#EF4444');
    }
    this.setButtonsEnabled(turn === 'player' && !this.isAnimating);
  }

  private async playerAttack(): Promise<void> {
    if (this.isAnimating || this.turn !== 'player') return;
    this.isAnimating = true;
    this.setButtonsEnabled(false);
    
    // 攻撃アニメーション
    this.playerSprite.play('player-attack');
    
    // 移動して攻撃
    await this.tweenPromise(this.playerSprite, { x: this.monster.x - 100 }, 300);
    
    // ダメージ計算
    const baseDamage = 20 + this.battleData.playerData.level * 3 + (this.playerStats?.str || 0) * 2;
    const variance = Phaser.Math.Between(-5, 5);
    let damage = Math.max(1, baseDamage + variance + (this.nextCrit ? baseDamage : 0));
    this.nextCrit = false;
    
    // 科目相性ボーナス（プレイヤーの科目 vs モンスターの科目）
    const playerSubject = this.battleData.subject;
    const monsterSubject = this.battleData.subject; // モンスターは同じ科目
    if (SUBJECT_ADVANTAGE[playerSubject]?.includes(monsterSubject)) {
      damage = Math.floor(damage * 1.5);
      this.addLog('⚡ 相性抜群！', '#F59E0B');
    }
    
    // ダメージブースト効果
    if (this.damageBoost) {
      damage = Math.floor(damage * 1.5);
      this.addLog('💪 ダメージブースト発動！', '#F59E0B');
    }
    
    // ヒットエフェクト
    this.createHitEffect(this.monster.x, this.monster.y, damage);
    
    this.addLog(`⚔️ 攻撃！ ${damage} ダメージ`, '#EF4444');
    
    this.monsterHp -= damage;
    this.updateHpBar('monster-hp', this.monsterHp, this.monsterMaxHp);
    
    // モンスターひるみアニメーション
    this.monster.play('monster-hit');
    this.tweens.add({
      targets: this.monster,
      alpha: 0.5,
      yoyo: true,
      repeat: 2,
      duration: 100,
    });
    
    // 元の位置に戻る
    await this.tweenPromise(this.playerSprite, { x: 200 }, 300);
    this.playerSprite.play('player-idle-right');
    
    // 勝利判定
    if (this.monsterHp <= 0) {
      await this.victory();
      return;
    }
    
    // 敵のターンへ
    this.time.delayedCall(500, () => this.monsterTurn());
  }
  
  private async playerSkill(): Promise<void> {
    if (this.isAnimating || this.turn !== 'player') return;
    this.isAnimating = true;
    this.setButtonsEnabled(false);
    
    const subject = this.battleData.subject;
    const skill = SUBJECT_PLAYER_SKILLS[subject];
    
    if (skill) {
      this.addLog(`✨ スキル「${skill.name}」を使った！`, '#8B5CF6');
      this.addLog(skill.description, '#8B5CF6');
      
      // スキル効果適用
      switch (skill.effect) {
        case 'crit_boost':
          // 次の攻撃クリティカル率50%UP（簡易実装：nextCritフラグ）
          this.nextCrit = true;
          break;
        case 'damage_boost':
          // 次の攻撃ダメージ+30%
          this.damageBoost = true;
          break;
        case 'heal_and_boost':
          // HP30回復 + 次の攻撃+20%
          this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 30);
          this.updateHpBar('player-hp', this.playerHp, this.playerMaxHp);
          this.addLog(`💚 HP +30 回復！`, '#10B981');
          this.damageBoost = true;
          break;
        case 'fixed_damage_poison':
          // 固定ダメージ + 確率で毒（3ターン継続ダメージ）
          const fixedDamage = 40;
          this.monsterHp -= fixedDamage;
          this.updateHpBar('monster-hp', this.monsterHp, this.monsterMaxHp);
          this.createHitEffect(this.monster.x, this.monster.y, fixedDamage);
          this.addLog(`🧪 固定ダメージ ${fixedDamage}！`, '#EF4444');
          // 30%で毒付与
          if (Math.random() < 0.3) {
            this.poisonTurns = 3;
            this.addLog('☠️ 毒を付与した！（3ターン継続）', '#A855F7');
          }
          break;
        case 'defense_up':
          // 防御力UP（ダメージ半減1ターン）
          this.defenseUp = true;
          this.addLog('🛡️ 防御態勢をとった！', '#3B82F6');
          break;
        case 'heavy_attack_recoil':
          // 大ダメージだが反動15
          const heavyDamage = 60;
          this.monsterHp -= heavyDamage;
          this.updateHpBar('monster-hp', this.monsterHp, this.monsterMaxHp);
          this.createHitEffect(this.monster.x, this.monster.y, heavyDamage);
          this.addLog(`⚡ 突撃！ ${heavyDamage} ダメージ！`, '#EF4444');
          // 反動ダメージ
          this.playerHp = Math.max(1, this.playerHp - 15);
          this.updateHpBar('player-hp', this.playerHp, this.playerMaxHp);
          this.addLog(`💥 反動で 15 ダメージ！`, '#EF4444');
          break;
        case 'random_buff':
          // ランダム効果（回復/攻撃UP/防御UP）
          const rand = Math.random();
          if (rand < 0.33) {
            this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 40);
            this.updateHpBar('player-hp', this.playerHp, this.playerMaxHp);
            this.addLog('💚 HP +40 回復！', '#10B981');
          } else if (rand < 0.66) {
            this.damageBoost = true;
            this.addLog('💪 攻撃力アップ！', '#F59E0B');
          } else {
            this.defenseUp = true;
            this.addLog('🛡️ 防御力アップ！', '#3B82F6');
          }
          break;
      }
    } else {
      // フォールバック
      this.addLog('✨ スキル「集中」を使った！', '#8B5CF6');
      this.addLog('次の攻撃が必ずクリティカルになる', '#8B5CF6');
      this.nextCrit = true;
    }
    
    this.time.delayedCall(500, () => {
      this.isAnimating = false;
      this.setTurn('monster');
    });
  }
  
  private async playerItem(): Promise<void> {
    if (this.isAnimating || this.turn !== 'player') return;
    this.isAnimating = true;
    this.setButtonsEnabled(false);
    
    // 簡易実装：HP回復
    const heal = 30;
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + heal);
    this.updateHpBar('player-hp', this.playerHp, this.playerMaxHp);
    
    this.addLog(`🎁 回復アイテムを使用！ HP +${heal}`, '#10B981');
    
    this.time.delayedCall(500, () => {
      this.isAnimating = false;
      this.setTurn('monster');
    });
  }
  
  private playerFlee(): void {
    if (this.isAnimating || this.turn !== 'player') return;
    
    // 逃走判定（70%成功）
    if (Math.random() < 0.7) {
      this.addLog('🏃 逃げ出した！', '#F59E0B');
      this.time.delayedCall(1000, () => {
        this.battleData.onFlee();
        this.scene.stop();
      });
    } else {
      this.addLog('🏃 逃げられなかった！', '#EF4444');
      this.time.delayedCall(500, () => this.monsterTurn());
    }
  }
  
  private async monsterTurn(): Promise<void> {
    this.setTurn('monster');
    this.isAnimating = true;
    
    await this.delay(500);
    
    // スタンチェック
    if (this.stunTurns > 0) {
      this.addLog('💫 敵はスタンして動けない！', '#A855F7');
      this.stunTurns--;
      await this.delay(1000);
      this.isAnimating = false;
      this.setTurn('player');
      return;
    }
    
    // モンスター必殺技判定（クールダウン管理）
    const subject = this.battleData.subject;
    const specialMove = MONSTER_SPECIAL_MOVES[subject];
    let useSpecial = false;
    let damage = 0;
    let effect: string | undefined;
    
    if (specialMove && this.monsterSpecialCooldown <= 0) {
      // 50%の確率で必殺技を使用
      if (Math.random() < 0.5) {
        useSpecial = true;
        this.monsterSpecialCooldown = 3; // 3ターンクールダウン
      }
    }
    
    if (useSpecial && specialMove) {
      // 必殺技使用
      this.addLog(`💥 敵の必殺技「${specialMove.name}」！`, '#EF4444');
      this.addLog(specialMove.description, '#EF4444');
      
      const baseDamage = 10 + this.battleData.difficulty * 5 + this.battleData.playerData.level * 2;
      const variance = Phaser.Math.Between(-3, 3);
      const atkMult = (this as any).monsterAtkMult || 1.0;
      damage = Math.max(1, Math.floor((baseDamage + variance) * specialMove.damageMultiplier * atkMult));
      effect = specialMove.effect;
      
      // 必殺技の追加効果
      switch (effect) {
        case 'defense_down':
          // プレイヤーの防御ダウン（次ターンダメージ1.5倍）
          this.damageBoost = true; // プレイヤー視点ではダメージ増加
          this.addLog('🛡️ 防御力が下がった！', '#EF4444');
          break;
        case 'miss_chance':
          // 命中率80% - 20%でミス
          if (Math.random() < 0.2) {
            damage = 0;
            this.addLog('💨 攻撃は外れた！', '#6B7280');
          }
          break;
        case 'stun':
          // 次のターン行動不能
          this.stunTurns = 1;
          this.addLog('💫 スタン効果！', '#A855F7');
          break;
        case 'self_heal':
          // モンスターHP回復
          const heal = Math.floor(this.monsterMaxHp * 0.15);
          this.monsterHp = Math.min(this.monsterMaxHp, this.monsterHp + heal);
          this.updateHpBar('monster-hp', this.monsterHp, this.monsterMaxHp);
          this.addLog(`💚 敵が ${heal} 回復した！`, '#10B981');
          break;
      }
    } else {
      // 通常攻撃
      this.monster.play('monster-hit'); // 攻撃モーション代用
      
      const baseDamage = 10 + this.battleData.difficulty * 5 + this.battleData.playerData.level * 2;
      const variance = Phaser.Math.Between(-3, 3);
      const atkMult = (this as any).monsterAtkMult || 1.0;
      damage = Math.max(1, Math.floor((baseDamage + variance) * atkMult));
      
      // 科目相性ボーナス（モンスターの科目 vs プレイヤーの科目）
      if (SUBJECT_ADVANTAGE[subject]?.includes(subject)) {
        damage = Math.floor(damage * 1.5);
        this.addLog('⚡ 相性抜群！', '#F59E0B');
      }
      
      // クールダウン減少
      if (this.monsterSpecialCooldown > 0) {
        this.monsterSpecialCooldown--;
      }
    }
    
    // 防御アップ効果適用（ダメージ半減）
    if (this.defenseUp && damage > 0) {
      damage = Math.floor(damage * 0.5);
      this.addLog('🛡️ 防御でダメージ軽減！', '#3B82F6');
      this.defenseUp = false; // 1ターンで解除
    }
    
    // プレイヤーにヒットエフェクト
    if (damage > 0) {
      this.createHitEffect(this.playerSprite.x, this.playerSprite.y, damage);
      this.addLog(`👾 敵の攻撃！ ${damage} ダメージ`, '#EF4444');
      
      this.playerHp -= damage;
      this.updateHpBar('player-hp', this.playerHp, this.playerMaxHp);
      
      // プレイヤーひるみ
      this.tweens.add({
        targets: this.playerSprite,
        alpha: 0.5,
        yoyo: true,
        repeat: 2,
        duration: 100,
      });
    }
    
    // 敗北判定
    if (this.playerHp <= 0) {
      await this.defeat();
      return;
    }
    
    // 毒ダメージ処理（ターン終了時）
    if (this.poisonTurns > 0) {
      const poisonDamage = Math.floor(this.playerMaxHp * 0.05); // 最大HPの5%
      this.playerHp = Math.max(1, this.playerHp - poisonDamage);
      this.updateHpBar('player-hp', this.playerHp, this.playerMaxHp);
      this.addLog(`☠️ 毒ダメージ ${poisonDamage}！`, '#A855F7');
      this.poisonTurns--;
      if (this.poisonTurns === 0) {
        this.addLog('☠️ 毒が治った！', '#10B981');
      }
      
      if (this.playerHp <= 0) {
        await this.defeat();
        return;
      }
    }
    
    await this.delay(500);
    this.isAnimating = false;
    this.setTurn('player');
  }
  
  private createHitEffect(x: number, y: number, damage: number): void {
    // ダメージ数字ポップアップ
    const text = this.add.text(x, y - 50, `-${damage}`, { 
      font: 'bold 24px Noto Sans JP', 
      color: '#EF4444',
      stroke: '#000000',
      strokeThickness: 3 
    }).setOrigin(0.5).setDepth(30);
    
    this.tweens.add({
      targets: text,
      y: y - 100,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
    
    // パーティクルエフェクト
    const particles = this.add.particles(0, 0, 'particle', {
      x,
      y,
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: 10,
      blendMode: 'ADD',
      tint: 0xEF4444,
    });
    
    this.time.delayedCall(500, () => particles.destroy());
  }

  private async victory(): Promise<void> {
    this.isAnimating = true;
    this.setButtonsEnabled(false);
    
    // モンスター死亡アニメーション
    this.monster.play('monster-death');
    
    await this.delay(800);
    
    // 消えるエフェクト
    this.tweens.add({
      targets: this.monster,
      alpha: 0,
      scale: 0,
      duration: 500,
      onComplete: () => this.monster.destroy(),
    });
    
    // 勝利演出
    this.addLog('🎉 勝利！', '#10B981');
    
    // 経験値・ゴールド計算
    const streakBonus = Math.min(this.battleData.playerData.streak * 0.05, 0.5);
    const xpReward = Math.floor(this.baseXp * (1 + streakBonus));
    const goldReward = Math.floor(this.baseGold * (1 + streakBonus));
    
    // アイテムドロップ判定
    const drops: ItemDrop[] = [];

    // 科目別ドロップ（30%確率）
    const subjectDrops = getSubjectDrops(this.battleData.subject);
    if (subjectDrops.length > 0) {
      subjectDrops.forEach((d) => drops.push(d));
    }

    // 一般ドロップ
    const generalDrop = getRandomDrop();
    if (generalDrop) drops.push(generalDrop);

    // ドロップ表示
    drops.forEach((d) => {
      const item = ITEMS_BY_ID[d.itemId];
      if (item) {
        const rarityName = RARITY[item.rarity]?.name || item.rarity;
        this.addLog(`🎁 ${item.name} を入手！ (${rarityName})`, '#F59E0B');
      }
    });
    
    this.addLog(`✨ 経験値 +${xpReward}`, '#8B5CF6');
    this.addLog(`💰 ゴールド +${goldReward}`, '#F59E0B');
    
    // 勝利パーティクル
    this.createVictoryParticles();
    
    await this.delay(1500);
    
    // 報酬コールバック
    const reward: QuestReward = {
      xp: xpReward,
      gold: goldReward,
      streakBonus: streakBonus,
      earlyBonus: false,
      items: drops.length > 0 ? drops : [],
    };
    
    this.battleData.onVictory(reward);
    this.scene.stop();
  }
  
  private createVictoryParticles(): void {
    const particles = this.add.particles(0, 0, 'particle', {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 1500,
      quantity: 5,
      frequency: 50,
      blendMode: 'ADD',
      tint: [0xF59E0B, 0x8B5CF6, 0x10B981, 0xEF4444],
    });
    
    this.time.delayedCall(2000, () => particles.destroy());
  }
  
  private async defeat(): Promise<void> {
    this.isAnimating = true;
    this.addLog('💀 敗北…', '#EF4444');
    
    // プレイヤー倒れる演出
    this.tweens.add({
      targets: this.playerSprite,
      angle: 90,
      alpha: 0.5,
      duration: 1000,
    });
    
    await this.delay(2000);
    this.battleData.onDefeat();
    this.scene.stop();
  }
  
  private tweenPromise(target: Phaser.GameObjects.GameObject, props: any, duration: number): Promise<void> {
    return new Promise(resolve => {
      this.tweens.add({
        targets: target,
        ...props,
        duration,
        ease: 'Power2',
        onComplete: resolve,
      });
    });
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }
}
