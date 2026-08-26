/**
 * AI Schedule Recommendation API Route
 * スケジューラ用 LLM API - パーソナライズド学習推奨生成
 * 認証必須
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getLLMScheduleInput } from '@/actions/schedule';

let openaiClient: OpenAI | null = null;

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
      maxRetries: 2,
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

    // LLM 呼び出し
    const response = await client.chat.completions.create({
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

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned empty response');
    }

    const recommendation = JSON.parse(content);

    return NextResponse.json({
      success: true,
      data: recommendation,
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
