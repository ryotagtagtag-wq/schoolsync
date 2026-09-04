/**
 * AI Schedule Recommendation API Route
 * スケジューラ用 LLM API - パーソナライズド学習推奨生成
 * 認証必須
 * レート制限: 5 req/min per user (Neon PostgreSQL based)
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getLLMScheduleInput } from '@/actions/schedule';
import { checkRateLimit, getClientIdentifier, getRateLimitConfig, createRateLimitHeaders } from '@/lib/rate-limit-db';

let openaiClient: OpenAI | null = null;

/**
 * 指数バックオフ付きリトライ関数
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // リトライ可能なエラーか判定
      const isRetryable = 
        lastError.name === 'TypeError' && lastError.message.includes('fetch') ||
        lastError.message.includes('timeout') ||
        lastError.message.includes('ETIMEDOUT') ||
        lastError.message.includes('429') ||
        lastError.message.includes('rate limit') ||
        lastError.message.includes('500') ||
        lastError.message.includes('502') ||
        lastError.message.includes('503') ||
        lastError.message.includes('504');
      
      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }
      
      // 指数バックオフ: 1000ms, 2000ms, 4000ms, ...
      const delay = baseDelay * Math.pow(2, attempt);
      const cappedDelay = Math.min(delay, 30000);
      const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);
      await new Promise(resolve => setTimeout(resolve, cappedDelay + jitter));
    }
  }
  
  throw lastError!;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error('NVIDIA_API_KEY is not set');
    }
    openaiClient = new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey,
      timeout: 15000,
      maxRetries: 0, // 独自のリトライロジックを使用
    });
  }
  return openaiClient;
}

const SYSTEM_PROMPT = `あなたは学習スケジュール最適化の専門AIです。ユーザーの課題リスト、現在時刻、完了履歴から、最適な取り組み順序と理由を生成してください。

入力:
- tasks: 課題配列（id, title, subject, dueDate, priority, score, reason, estimatedMinutes, recommendedPomodoro）
- currentTime: 現在時刻（ISO 8601）
- completionHistory: 教科別完了統計（totalCompleted, overdueCount, avgDelayDays）

出力形式（JSONのみ）:
{
  "recommendedOrder": [
    {
      "taskId": "課題ID",
      "order": 1,
      "reason": "この課題を最初にやる理由（50字以内）",
      "pomodoroPlan": 2
    }
  ],
  "summary": "今日の学習方針サマリー（100字以内）",
  "pomodoroSchedule": [
    {"session": 1, "taskId": "課題ID", "focusMinutes": 25, "breakMinutes": 5},
    {"session": 2, "taskId": "課題ID", "focusMinutes": 25, "breakMinutes": 5}
  ],
  "tips": ["学習のコツ1", "学習のコツ2"]
}

ルール:
- 期限超過・締切迫る課題を最優先
- 認知負荷の高い教科（数学・物理等）は朝一番や集中できる時間に配置
- 同教科の連続は避け、教科をローテーション
- 遅延傾向のある教科は早めに着手推奨
- ポモドーロは推奨回数に従い、長いタスクは分割`;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    // レート制限チェック（Neon PostgreSQL based）
    const identifier = getClientIdentifier(request, session.user.id);
    const config = getRateLimitConfig('schedule-recommendation');
    const rateLimitResult = await checkRateLimit(identifier, config);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `レート制限に達しました。${Math.ceil((rateLimitResult.retryAfterMs ?? 60000) / 1000)}秒後に再試行してください。` 
        },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult, 'schedule-recommendation')
        }
      );
    }

    // Server Action で LLM入力データ生成
    const result = await getLLMScheduleInput();
    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'データ生成失敗' },
        { status: 500 }
      );
    }

    const client = getOpenAIClient();
    const { tasks, currentTime, completionHistory } = result.data;

    // LLM 呼び出し（指数バックオフ付きリトライ）
    const response = await withRetry(async () => {
      return client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: JSON.stringify({ tasks, currentTime, completionHistory }, null, 2) 
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });
    }, 3, 1000);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned empty response');
    }

    const recommendation = JSON.parse(content);

    return NextResponse.json({
      success: true,
      data: recommendation,
    }, {
      headers: createRateLimitHeaders(rateLimitResult, 'schedule-recommendation')
    });
  } catch (error) {
    console.error('[AI Schedule Recommendation] Error:', error);
    
    const err = error as Error & { statusCode?: number; code?: string };
    const statusCode = err.statusCode ?? 500;
    let message = 'スケジュール推奨生成中にエラーが発生しました。';

    if (err.code === 'UNAUTHORIZED' || err.message?.includes('401')) {
      message = 'API認証エラー';
    } else if (err.code === 'RATE_LIMITED' || err.message?.includes('429')) {
      message = 'レート制限に達しました。しばらく待ってから再試行してください。';
    } else if (err.message?.includes('timeout') || err.message?.includes('ETIMEDOUT')) {
      message = 'リクエストがタイムアウトしました。';
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}
