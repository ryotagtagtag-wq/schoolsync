/**
 * Schedule Server Action
 * スケジューラ機能のサーバーアクション
 */

'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { assignments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateScheduleRecommendation, generateLLMScheduleInput } from '@/lib/scheduler/scheduler';
import type { ScheduleRecommendation } from '@/lib/scheduler/types';

/**
 * ユーザーの課題データを取得してスケジュール推奨を生成
 */
export async function getScheduledTasks(): Promise<{
  success: boolean;
  data?: ScheduleRecommendation;
  error?: string;
}> {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' };
    }

    // ユーザーの課題を取得（完了済み含む、作成日順）
    const userAssignments = await db
      .select()
      .from(assignments)
      .where(eq(assignments.userId, session.user.id))
      .orderBy(desc(assignments.createdAt));

    // スケジュール推奨生成
    const recommendation = generateScheduleRecommendation(userAssignments);

    return { success: true, data: recommendation };
  } catch (error) {
    console.error('[getScheduledTasks] Error:', error);
    return { success: false, error: 'スケジュール生成中にエラーが発生しました' };
  }
}

/**
 * LLM用のスケジュール入力データを生成
 */
export async function getLLMScheduleInput(): Promise<{
  success: boolean;
  data?: ReturnType<typeof generateLLMScheduleInput>;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' };
    }

    const userAssignments = await db
      .select()
      .from(assignments)
      .where(eq(assignments.userId, session.user.id))
      .orderBy(desc(assignments.createdAt));

    const llmInput = generateLLMScheduleInput(userAssignments);

    return { success: true, data: llmInput };
  } catch (error) {
    console.error('[getLLMScheduleInput] Error:', error);
    return { success: false, error: 'LLMスケジュール入力生成中にエラーが発生しました' };
  }
}
