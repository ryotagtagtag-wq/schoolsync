import { Container, Graphics, Text, TextStyle, Application } from 'pixi.js';
import { Scene, SceneManager } from '../SceneManager';
import { generateAllAssets } from '../generateAssets';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

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

    this.updateProgress(1);
    this.percentText.text = '100%';
    this.tipText.text = '完了！';

    await new Promise(r => setTimeout(r, 300));

    this.sceneManager.start('world', { map: 'town' });
  }

  private updateProgress(value: number): void {
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
