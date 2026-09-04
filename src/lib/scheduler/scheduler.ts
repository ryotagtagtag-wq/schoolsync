/**
 * Main Scheduler - メインスケジューラロジック
 * 課題リスト + 完了履歴 → 推奨スケジュール生成
 * 
 * 注意: すべての日付計算は JST (Asia/Tokyo) 基準で行う
 */

import { differenceInDays, parseISO, isPast } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { 
  ScheduledTask, 
  ScheduleRecommendation, 
  SchedulerInputTask, 
  CompletionHistory,
  SchedulerConfig 
} from './types';
import { DEFAULT_CONFIG } from './types';
import { mergeSubjectLoads } from './cognitiveLoad';
import { scoreAndRankTasks, estimateTaskMinutes, calculateRecommendedPomodoro } from './scoringEngine';

const JST = 'Asia/Tokyo';

/**
 * JSTでの現在時刻を取得
 */
function getJSTNow(): Date {
  return toZonedTime(new Date(), JST);
}

/**
 * JSTでの今日の0:00を取得（Dateオブジェクトとして返す）
 */
function getJSTToday(): Date {
  const now = getJSTNow();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

import type { Assignment } from '@/db/schema';

/**
 * DB課題データをスケジューラ入力形式に変換
 */
function toISOStringOrUndefined(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  return date instanceof Date ? date.toISOString() : date;
}

/**
 * Date値をYYYY-MM-DD形式に変換
 */
function toDateString(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString().split('T')[0];
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
}

export function convertToSchedulerInput(assignments: Assignment[]): SchedulerInputTask[] {
  return assignments
    .filter(a => a.status !== 'completed') // 完了済みは除外
    .map(a => ({
      id: a.id,
      title: a.title,
      subject: a.subject ?? '数学',
      dueDate: toDateString(a.dueDate),
      priority: priorityNumberToString(a.priority),
      status: a.status,
      completedAt: toISOStringOrUndefined(a.completedAt),
      createdAt: toISOStringOrUndefined(a.createdAt) ?? new Date().toISOString(),
    }));
}

/**
 * 優先度数値を文字列に変換
 */
function priorityNumberToString(priority: number): 'low' | 'medium' | 'high' {
  if (priority <= 1) return 'low';
  if (priority >= 3) return 'high';
  return 'medium';
}

/**
 * 完了履歴を生成
 */
export function generateCompletionHistory(assignments: Assignment[]): CompletionHistory[] {
  return assignments
    .filter(a => a.status === 'completed' && a.completedAt)
    .map(a => {
      // dueDate を JST 0:00 として解釈
      const due = parseISO(toDateString(a.dueDate) + 'T00:00:00+09:00');
      const completed = parseISO(toISOStringOrUndefined(a.completedAt)!);
      const wasOverdue = isPast(due) && differenceInDays(completed, due) > 0;
      const delayDays = wasOverdue ? differenceInDays(completed, due) : 0;
      
      return {
        taskId: a.id,
        subject: a.subject ?? '数学',
        dueDate: toDateString(a.dueDate),
        completedAt: toISOStringOrUndefined(a.completedAt)!,
        wasOverdue,
        delayDays,
      };
    });
}

/**
 * スケジュール推奨を生成（メイン関数）
 * @param assignments 全課題データ
 * @param config オプション設定
 * @returns スケジュール推奨結果
 */
export function generateScheduleRecommendation(
  assignments: Assignment[],
  config: Partial<SchedulerConfig> = {}
): ScheduleRecommendation {
  // 設定マージ
  const fullConfig = mergeSubjectLoads({ ...DEFAULT_CONFIG, ...config });
  
  // 入力データ準備
  const schedulerInput = convertToSchedulerInput(assignments);
  const history = generateCompletionHistory(assignments);
  
  // スコアリング＆ランキング
  const rankedTasks = scoreAndRankTasks(schedulerInput, history, fullConfig);
  
  // 1日の作業時間制限でフィルタ
  const maxMinutesPerDay = fullConfig.workHoursPerDay * 60;
  const dailyTasks = selectDailyTasks(rankedTasks, maxMinutesPerDay, fullConfig.maxTasksPerDay);
  
  // 合計計算
  const totalEstimatedMinutes = dailyTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalPomodoroCount = dailyTasks.reduce((sum, t) => sum + t.recommendedPomodoro, 0);
  
  // サマリー生成
  const summary = generateSummary(dailyTasks, history);
  
  return {
    tasks: dailyTasks,
    generatedAt: getJSTNow().toISOString(),
    totalEstimatedMinutes,
    totalPomodoroCount,
    summary,
  };
}

/**
 * 1日の作業時間・タスク数制限内でタスクを選択
 */
function selectDailyTasks(
  rankedTasks: ScheduledTask[],
  maxMinutes: number,
  maxTasks: number
): ScheduledTask[] {
  let totalMinutes = 0;
  const selected: ScheduledTask[] = [];
  
  for (const task of rankedTasks) {
    if (selected.length >= maxTasks) break;
    if (totalMinutes + task.estimatedMinutes > maxMinutes) {
      // 時間オーバーでも最初の1タスクは許可
      if (selected.length === 0) {
        selected.push(task);
        totalMinutes += task.estimatedMinutes;
      }
      break;
    }
    selected.push(task);
    totalMinutes += task.estimatedMinutes;
  }
  
  return selected;
}

/**
 * ユーザー向けサマリー生成
 */
function generateSummary(tasks: ScheduledTask[], history: CompletionHistory[]): string {
  if (tasks.length === 0) {
    return '予定されている課題はありません。';
  }
  
  const overdueCount = tasks.filter(t => t.rank === 1 && t.reason.includes('期限超過')).length;
  const subjects = [...new Set(tasks.map(t => t.subject))];
  const highPriorityCount = tasks.filter(t => t.priority === 'high').length;
  
  let summary = `本日のおすすめ: ${tasks.length}件の課題（約${Math.round(tasks.reduce((s, t) => s + t.estimatedMinutes, 0) / 60 * 10) / 10}時間）`;
  
  if (overdueCount > 0) {
    summary += `、うち${overdueCount}件は期限超過`;
  }
  if (highPriorityCount > 0) {
    summary += `、高優先度${highPriorityCount}件`;
  }
  summary += `。教科: ${subjects.join('、')}`;
  
  // 遅延傾向があれば追記
  const today = getJSTToday();
  const recentDelays = history.filter(h => h.wasOverdue && differenceInDays(today, parseISO(h.completedAt)) <= 7).length;
  if (recentDelays > 0) {
    summary += `。直近${recentDelays}件の遅延あり、早めの着手を推奨`;
  }
  
  return summary;
}

/**
 * LLM用の推奨データ生成（API Routeで使用）
 * より詳細な推奨理由とポモドーロ計画を含む
 */
export function generateLLMScheduleInput(
  assignments: Assignment[],
  config: Partial<SchedulerConfig> = {}
): {
  tasks: Array<{
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    priority: string;
    score: number;
    reason: string;
    estimatedMinutes: number;
    recommendedPomodoro: number;
  }>;
  currentTime: string;
  completionHistory: Array<{
    subject: string;
    totalCompleted: number;
    overdueCount: number;
    avgDelayDays: number;
  }>;
} {
  const fullConfig = mergeSubjectLoads({ ...DEFAULT_CONFIG, ...config });
  const schedulerInput = convertToSchedulerInput(assignments);
  const history = generateCompletionHistory(assignments);
  const rankedTasks = scoreAndRankTasks(schedulerInput, history, fullConfig);
  
  // 教科別統計
  const subjectStats = new Map<string, { completed: number; overdue: number; totalDelay: number }>();
  
  for (const h of history) {
    const stat = subjectStats.get(h.subject) || { completed: 0, overdue: 0, totalDelay: 0 };
    stat.completed++;
    if (h.wasOverdue) {
      stat.overdue++;
      stat.totalDelay += h.delayDays;
    }
    subjectStats.set(h.subject, stat);
  }
  
  const completionHistory = Array.from(subjectStats.entries()).map(([subject, stat]) => ({
    subject,
    totalCompleted: stat.completed,
    overdueCount: stat.overdue,
    avgDelayDays: stat.completed > 0 ? Math.round(stat.totalDelay / stat.completed) : 0,
  }));
  
  return {
    tasks: rankedTasks.map(t => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      dueDate: t.dueDate,
      priority: t.priority,
      score: t.score,
      reason: t.reason,
      estimatedMinutes: t.estimatedMinutes,
      recommendedPomodoro: t.recommendedPomodoro,
    })),
    currentTime: getJSTNow().toISOString(),
    completionHistory,
  };
}
