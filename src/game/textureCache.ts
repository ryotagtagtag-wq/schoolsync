// Simple texture cache for PixiJS v8 (Texture.addToCache was removed in v8)
import { Texture, BaseTexture } from 'pixi.js';

const textureCache = new Map<string, Texture>();

export function addToCache(texture: Texture, key: string): void {
  textureCache.set(key, texture);
}

export function getFromCache(key: string): Texture | undefined {
  return textureCache.get(key);
}

export function hasCache(key: string): boolean {
  return textureCache.has(key);
}

export function removeFromCache(key: string): boolean {
  return textureCache.delete(key);
}

export function clearCache(): void {
  textureCache.clear();
}

// Override Texture.from to check our cache first
const originalFrom = Texture.from.bind(Texture);
Texture.from = (source: any, options?: any) => {
  if (typeof source === 'string' && textureCache.has(source)) {
    return textureCache.get(source)!;
  }
  return originalFrom(source, options);
};

export { Texture };
