import { Container, Application } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config';

export type SceneName = 'boot' | 'world' | 'battle' | 'ui' | 'facility';

export interface Scene {
  name: SceneName;
  container: Container;
  init?(data?: any): void;
  create(): void;
  update?(delta: number): void;
  destroy(): void;
}

export class SceneManager {
  private app: Application;
  private scenes: Map<SceneName, Scene> = new Map();
  private currentScene: SceneName | null = null;
  private sceneStack: SceneName[] = [];

  constructor(app: Application) {
    this.app = app;
  }

  register(scene: Scene): void {
    this.scenes.set(scene.name, scene);
    this.app.stage.addChild(scene.container);
    scene.container.visible = false;
  }

  async start(name: SceneName, data?: any): Promise<void> {
    const scene = this.scenes.get(name);
    if (!scene) {
      console.error(`Scene ${name} not found`);
      return;
    }

    // Pause current scene
    if (this.currentScene) {
      const current = this.scenes.get(this.currentScene);
      if (current) {
        current.container.visible = false;
      }
    }

    this.currentScene = name;
    this.sceneStack.push(name);
    scene.container.visible = true;

    // Always call init if it exists
    scene.init?.(data);
    scene.create();
  }

  async launch(name: SceneName, data?: any): Promise<void> {
    // Overlay scene - doesn't pause current
    const scene = this.scenes.get(name);
    if (!scene) {
      console.error(`Scene ${name} not found`);
      return;
    }

    this.sceneStack.push(name);
    scene.container.visible = true;

    scene.init?.(data);
    scene.create();
  }

  pause(name: SceneName): void {
    const scene = this.scenes.get(name);
    if (scene) {
      scene.container.visible = false;
    }
  }

  resume(name: SceneName): void {
    const scene = this.scenes.get(name);
    if (scene) {
      scene.container.visible = true;
    }
  }

  stop(name: SceneName): void {
    const scene = this.scenes.get(name);
    if (scene) {
      scene.container.visible = false;
      scene.destroy();
      this.sceneStack = this.sceneStack.filter(s => s !== name);
      if (this.currentScene === name) {
        this.currentScene = this.sceneStack[this.sceneStack.length - 1] || null;
        if (this.currentScene) {
          this.scenes.get(this.currentScene)!.container.visible = true;
        }
      }
    }
  }

  getCurrent(): SceneName | null {
    return this.currentScene;
  }

  getScene(name: SceneName): Scene | undefined {
    return this.scenes.get(name);
  }

  update(delta: number): void {
    if (this.currentScene) {
      const scene = this.scenes.get(this.currentScene);
      scene?.update?.(delta);
    }
    // Also update overlay scenes
    for (const name of this.sceneStack) {
      if (name !== this.currentScene) {
        this.scenes.get(name)?.update?.(delta);
      }
    }
  }
}
