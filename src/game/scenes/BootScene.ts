import { Container, Graphics, Text, TextStyle, Application } from 'pixi.js';
import { Scene, SceneManager } from '../SceneManager';
import { generateAllAssets } from '../generateAssets';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

// Simple sound buffer cache for client-side procedural audio
const soundBufferCache = new Map<string, AudioBuffer>();

export class BootScene implements Scene {
  name: 'boot' = 'boot';
  container = new Container();
  private app: Application;
  private sceneManager: SceneManager;
  private progressBar!: Graphics;
  private progressBox!: Graphics;
  private loadingText!: Text;
  private percentText!: Text;
  private tipText!: Text;

  constructor(app: Application, sceneManager: SceneManager) {
    this.app = app;
    this.sceneManager = sceneManager;
  }

  init(): void {
    this.createUI();
  }

  create(): void {
    this.generateAssetsWithProgress();
  }

  private createUI(): void {
    if (this.progressBar) return;
    const width = GAME_WIDTH;
    const height = GAME_HEIGHT;

    this.progressBox = new Graphics();
    this.progressBox.roundRect(width / 2 - 160, height / 2 - 30, 320, 60, 10)
      .fill({ color: 0x1a1a2e, alpha: 0.9 })
      .stroke({ width: 2, color: 0x6B46C1 });
    this.container.addChild(this.progressBox);

    this.progressBar = new Graphics();
    this.container.addChild(this.progressBar);

    const titleStyle = new TextStyle({
      fontFamily: 'Noto Sans JP',
      fontSize: 28,
      fontWeight: 'bold',
      fill: 0xF59E0B,
      stroke: { color: 0x1a1a2e, width: 4 },
    });
    this.loadingText = new Text('Questra', titleStyle);
    this.loadingText.anchor.set(0.5);
    this.loadingText.position.set(width / 2, height / 2 - 55);
    this.container.addChild(this.loadingText);

    const subtitleStyle = new TextStyle({
      fontFamily: 'Noto Sans JP',
      fontSize: 14,
      fill: 0xA78BFA,
    });
    const subtitleText = new Text('見習い賢者の冒険録', subtitleStyle);
    subtitleText.anchor.set(0.5);
    subtitleText.position.set(width / 2, height / 2 - 20);
    this.container.addChild(subtitleText);

    const percentStyle = new TextStyle({
      fontFamily: 'Noto Sans JP',
      fontSize: 16,
      fill: 0xFFFFFF,
    });
    this.percentText = new Text('0%', percentStyle);
    this.percentText.anchor.set(0.5);
    this.percentText.position.set(width / 2, height / 2 + 10);
    this.container.addChild(this.percentText);

    const tipStyle = new TextStyle({
      fontFamily: 'Noto Sans JP',
      fontSize: 12,
      fill: 0x6B7280,
    });
    this.tipText = new Text('アセットを生成中...', tipStyle);
    this.tipText.anchor.set(0.5);
    this.tipText.position.set(width / 2, height / 2 + 45);
    this.container.addChild(this.tipText);
  }

  private async generateAssetsWithProgress(): Promise<void> {
    for (let i = 0; i <= 100; i += 10) {
      this.updateProgress(i / 100);
      await new Promise(r => setTimeout(r, 30));
    }

    this.tipText.text = 'アセットを生成中...';
    generateAllAssets(this.app);

    this.updateProgress(0.8);
    this.percentText.text = '80%';
    this.tipText.text = 'サウンドを生成中...';
    await this.generateSounds();

    this.updateProgress(1);
    this.percentText.text = '100%';
    this.tipText.text = '完了！';

    await new Promise(r => setTimeout(r, 300));

    this.sceneManager.start('world', { map: 'town' });
  }

  private async generateSounds(): Promise<void> {
    if (typeof window === 'undefined') return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const createTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        let value = 0;
        if (type === 'sine') value = Math.sin(2 * Math.PI * frequency * t);
        else if (type === 'square') value = Math.sign(Math.sin(2 * Math.PI * frequency * t));
        else if (type === 'sawtooth') value = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
        else if (type === 'triangle') value = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
        data[i] = value * volume * Math.exp(-t * 10);
      }
      return buffer;
    };

    const createNoise = (duration: number, volume: number = 0.2) => {
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * volume * Math.exp(-i / (audioContext.sampleRate * duration * 0.5));
      }
      return buffer;
    };

    const sounds: Record<string, AudioBuffer> = {
      'ui_click': createTone(800, 0.1, 'sine', 0.2),
      'ui_hover': createTone(1000, 0.05, 'sine', 0.1),
      'ui_error': createTone(200, 0.3, 'sawtooth', 0.3),
      'attack_swing': createTone(300, 0.15, 'triangle', 0.25),
      'attack_hit': createTone(200, 0.2, 'square', 0.3),
      'attack_crit': createTone(600, 0.3, 'sine', 0.4),
      'skill_cast': createTone(400, 0.4, 'sine', 0.35),
      'skill_heal': createTone(523, 0.5, 'sine', 0.3),
      'damage_taken': createTone(150, 0.25, 'sawtooth', 0.3),
      'enemy_attack': createTone(180, 0.2, 'triangle', 0.3),
      'status_burn': createNoise(0.5, 0.4),
      'status_stun': createTone(100, 0.5, 'square', 0.3),
      'status_poison': createTone(250, 0.4, 'triangle', 0.2),
      'status_cure': createTone(800, 0.3, 'sine', 0.2),
      'victory': createTone(523, 0.5, 'sine', 0.4),
      'defeat': createTone(150, 1.0, 'sawtooth', 0.4),
      'level_up': createTone(659, 0.8, 'sine', 0.5),
      'element_rock': createTone(180, 0.3, 'square', 0.3),
      'element_dragon': createNoise(0.4, 0.3),
      'element_mage': createTone(440, 0.4, 'sine', 0.3),
      'element_fire': createNoise(0.5, 0.4),
      'element_nature': createTone(220, 0.3, 'triangle', 0.3),
      'element_beast': createTone(150, 0.3, 'sawtooth', 0.3),
      'element_cat': createTone(880, 0.2, 'sine', 0.2),
      'facility_enter': createTone(523, 0.2, 'sine', 0.2),
      'facility_upgrade': createTone(659, 0.4, 'sine', 0.3),
      'shop_buy': createTone(784, 0.2, 'sine', 0.2),
      'item_get': createTone(880, 0.3, 'sine', 0.25),
      'gold_get': createTone(600, 0.2, 'sine', 0.2),
    };

    for (const [name, buffer] of Object.entries(sounds)) {
      soundBufferCache.set(name, buffer);
    }
  }

  private updateProgress(value: number): void {
    if (!this.progressBar) return;
    this.progressBar.clear();
    this.progressBar.rect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 10, 300 * value, 20)
      .fill(0x6B46C1);
    this.percentText.text = `${Math.floor(value * 100)}%`;
  }

  update(): void {}

  destroy(): void {
    this.container.destroy({ children: true });
  }
}

// Export the sound buffer cache for other scenes to use
export { soundBufferCache };
