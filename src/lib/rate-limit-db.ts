/**
 * Database-based Rate Limiter using Neon PostgreSQL (Drizzle ORM)
 * Sliding Window Log algorithm - no external dependencies
 */

import { db } from '@/db';
import { rateLimits } from '@/db/schema';
import { eq, and, gte, lt, sql } from 'drizzle-orm';

export interface RateLimitConfig {
  /** 最大リクエスト数 */
  maxRequests: number;
  /** 時間窓（ミリ秒） */
  windowMs: number;
  /** エンドポイント名（ログ用） */
  endpoint: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (ms)
  retryAfterMs?: number;
}

// プリセット設定
export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  'parse-assignment': {
    maxRequests: 10,
    windowMs: 60_000, // 1分間
    endpoint: 'parse-assignment',
  },
  'schedule-recommendation': {
    maxRequests: 5,
    windowMs: 60_000, // 1分間
    endpoint: 'schedule-recommendation',
  },
} as const;

/**
 * スライディングウィンドウログ方式でレート制限チェック
 * 古いエントリを削除しつつ、現在のウィンドウ内のリクエスト数をカウント
 */
export async function checkRateLimit(
  identifier: string, // userId または IP アドレス
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const windowStartDate = new Date(windowStart);
  const nowDate = new Date(now);

  // トランザクションで原子的に実行: 古いエントリ削除 → 現在カウント取得 → 新規エントリ挿入（許可時のみ）
  const result = await db.transaction(async (tx) => {
    // 1. 古いエントリを削除（ウィンドウ外）
    await tx
      .delete(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.endpoint, config.endpoint),
          lt(rateLimits.createdAt, windowStartDate)
        )
      );

    // 2. 現在のウィンドウ内のリクエスト数をカウント
    const countResult = await tx
      .select({ count: sql<number>`count(*)` })
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.endpoint, config.endpoint),
          gte(rateLimits.createdAt, windowStartDate)
        )
      );

    const currentCount = countResult[0]?.count ?? 0;
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const allowed = currentCount < config.maxRequests;

    let resetAt = now + config.windowMs;

    if (allowed) {
      // 3. 新規エントリを挿入
      await tx.insert(rateLimits).values({
        identifier,
        endpoint: config.endpoint,
        createdAt: nowDate,
      });
      // リセット時刻 = 最古のエントリの時刻 + ウィンドウ
      const oldestResult = await tx
        .select({ oldest: sql<Date>`min(${rateLimits.createdAt})` })
        .from(rateLimits)
        .where(
          and(
            eq(rateLimits.identifier, identifier),
            eq(rateLimits.endpoint, config.endpoint),
            gte(rateLimits.createdAt, windowStartDate)
          )
        );
      if (oldestResult[0]?.oldest) {
        resetAt = oldestResult[0].oldest.getTime() + config.windowMs;
      }
    } else {
      // 制限超過時: 最古エントリからリセット時刻を計算
      const oldestResult = await tx
        .select({ oldest: sql<Date>`min(${rateLimits.createdAt})` })
        .from(rateLimits)
        .where(
          and(
            eq(rateLimits.identifier, identifier),
            eq(rateLimits.endpoint, config.endpoint),
            gte(rateLimits.createdAt, windowStartDate)
          )
        );
      if (oldestResult[0]?.oldest) {
        resetAt = oldestResult[0].oldest.getTime() + config.windowMs;
      }
    }

    return {
      allowed,
      remaining: allowed ? remaining - 1 : remaining,
      resetAt,
      retryAfterMs: allowed ? undefined : Math.max(0, resetAt - now),
    };
  });

  return result;
}

/**
 * IP アドレスを取得（プロキシ対応）
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  // 認証済みユーザーは userId ベース
  if (userId) {
    return `user:${userId}`;
  }

  // 未認証は IP ベース（X-Forwarded-For 対応）
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  return `ip:${ip}`;
}

/**
 * レート制限ヘッダーを生成
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': RATE_LIMIT_PRESETS[Object.keys(RATE_LIMIT_PRESETS).find(k => RATE_LIMIT_PRESETS[k].endpoint === 'parse-assignment') || 'parse-assignment']?.maxRequests.toString() || '10',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(), // Unix秒
  };

  if (result.retryAfterMs !== undefined) {
    headers['Retry-After'] = Math.ceil(result.retryAfterMs / 1000).toString();
  }

  return headers;
}

/**
 * エンドポイント別プリセットから設定を取得
 */
export function getRateLimitConfig(endpoint: keyof typeof RATE_LIMIT_PRESETS): RateLimitConfig {
  return RATE_LIMIT_PRESETS[endpoint];
}

/**
 * 手動でレート制限リセット（テスト・管理用）
 */
export async function resetRateLimit(identifier: string, endpoint: string): Promise<void> {
  await db
    .delete(rateLimits)
    .where(
      and(
        eq(rateLimits.identifier, identifier),
        eq(rateLimits.endpoint, endpoint)
      )
    );
}