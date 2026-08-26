/**
 * AI Parse Assignment API Route
 * 自然言語入力を構造化データに変換
 * 認証必須（既存 assignments/route.ts と同パターン）
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { parseForAPI } from '@/lib/nlp/parser';
import type { NLInputResult, ParseError } from '@/lib/nlp/types';

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

    // 現在日を取得（タイムゾーン考慮）
    const currentDate = new Date().toISOString().split('T')[0];

    // パース実行
    const parsed = await parseForAPI(input, currentDate);

    return NextResponse.json({
      success: true,
      data: parsed,
      source: 'llm',
    } as NLInputResult);
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
