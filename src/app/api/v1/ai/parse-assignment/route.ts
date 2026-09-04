/**
 * AI Parse Assignment API Route
 * 自然言語入力を構造化データに変換
 * 認証必須（既存 assignments/route.ts と同パターン）
 * レート制限: 10 req/min per user (Neon PostgreSQL based)
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { parseForAPI } from '@/lib/nlp/parser';
import type { NLInputResult, ParseError } from '@/lib/nlp/types';
import { checkRateLimit, getClientIdentifier, getRateLimitConfig, createRateLimitHeaders } from '@/lib/rate-limit-db';

type ErrorCode = ParseError['code'];

export async function POST(request: NextRequest): Promise<NextResponse<NLInputResult>> {
  try {
    // 認証チェック（既存 assignments/route.ts:6-9 と同パターン）
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です。ログインしてください。',
            retryable: false,
          },
          source: 'llm',
        } as NLInputResult,
        { status: 401 }
      );
    }

    // レート制限チェック（Neon PostgreSQL based）
    const identifier = getClientIdentifier(request, session.user.id);
    const config = getRateLimitConfig('parse-assignment');
    const rateLimitResult = await checkRateLimit(identifier, config);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `レート制限に達しました。${Math.ceil((rateLimitResult.retryAfterMs ?? 60000) / 1000)}秒後に再試行してください。`,
            retryable: true,
          },
          source: 'llm',
        } as NLInputResult,
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult, 'parse-assignment')
        }
      );
    }

    // リクエストボディ取得
    const body = await request.json();
    const { input } = body as { input?: string };

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力テキストが必要です。',
            retryable: false,
          },
          source: 'llm',
        } as NLInputResult,
        { status: 400 }
      );
    }

    // 入力サニタイズ（長さ制限、制御文字除去）
    const sanitizedInput = sanitizeInput(input);
    if (!sanitizedInput) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力が無効です。',
            retryable: false,
          },
          source: 'llm',
        } as NLInputResult,
        { status: 400 }
      );
    }

    // 現在日を取得（タイムゾーン考慮）
    const currentDate = new Date().toISOString().split('T')[0];

    // パース実行
    const parsed = await parseForAPI(sanitizedInput, currentDate);

    return NextResponse.json({
      success: true,
      data: parsed,
      source: 'llm',
    } as NLInputResult, {
      headers: createRateLimitHeaders(rateLimitResult, 'parse-assignment')
    });
  } catch (error) {
    console.error('[AI Parse Assignment] Error:', error);

    // エラー種別に応じたステータスコード
    const err = error as Error & { statusCode?: number; code?: string };
    const statusCode = err.statusCode ?? 500;
    const errorCode = (err.code ?? 'LLM_ERROR') as ErrorCode;

    let message = '解析中にエラーが発生しました。';
    let retryable = false;

    switch (errorCode) {
      case 'UNAUTHORIZED':
        message = 'API認証エラー: NVIDIA API キーが無効です。設定を確認してください。';
        break;
      case 'RATE_LIMITED':
        message = 'レート制限に達しました。しばらく待ってから再試行してください。';
        retryable = true;
        break;
      case 'NETWORK_ERROR':
        message = 'ネットワークエラーが発生しました。接続を確認してください。';
        retryable = true;
        break;
      case 'VALIDATION_ERROR':
        message = err.message;
        break;
      default:
        message = `解析エラー: ${err.message}`;
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorCode,
          message,
          retryable,
        },
        source: 'llm',
      } as NLInputResult,
      { status: statusCode }
    );
  }
}

/**
 * 入力サニタイズ
 * - 最大文字数制限
 * - 制御文字除去
 * - プロンプトインジェクション対策のための基本フィルタ
 */
function sanitizeInput(input: string): string | null {
  // 最大5000文字
  if (input.length > 5000) {
    return null;
  }

  // 制御文字除去（改行・タブは許可）
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 基本的なプロンプトインジェクションパターン検出
  const suspiciousPatterns = [
    /ignore\s+(previous|above|system)\s+(instructions?|prompt)/i,
    /system\s*:\s*you\s+are/i,
    /<\|im_start\|>/i,
    /<\|im_end\|>/i,
    /\[INST\]/i,
    /\[\/INST\]/i,
    /```/g, // コードブロック記法
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(cleaned)) {
      console.warn('[AI Parse] Suspicious input pattern detected:', pattern);
      // 警告のみでブロックはしない（誤検知防止）
    }
  }

  return cleaned.trim();
}
