/**
 * Scoring Engine - 5ヒューリスティック加重スコアリングエンジン
 * 締切圧力(40%) + 認知負荷(20%) + 完了履歴/遅延率(15%) + 教科多様性/クラスタリング防止(10%) + 期限超過自動優先(15%)
 */

import { differenceInDays, isPast, parseISO } from 'date-fns';
import type { 
  ScheduledTask, 
  SchedulerInputTask, 
  CompletionHistory, 
  ScoringWeights, 
  SchedulerConfig 
} from './types';
import { getSubjectCognitiveLoad, calculateContextSwitchCost } from './cognitiveLoad';

/**
 * 現在時刻を基準にした日数差分を取得
 */
function daysUntilDue(dueDate: string, now: Date = new Date()): number {
  const due = parseISO(dueDate);
  const diff = differenceInDays(due, now);
  return Math.max(0, diff); // 過去は0として扱う
}

/**
 * 締切圧力スコアを計算 (0-100)
 * 残り日数が少ないほど高スコア
 * - 今日/明日: 100
 * - 3日以内: 80
 * - 1週間以内: 60
 * - 2週間以内: 40
 * - それ以上: 20
 */
export function calculateDeadlinePressureScore(task: SchedulerInputTask, now: Date = new Date()): number {
  const daysLeft = daysUntilDue(task.dueDate, now);
  
  if (daysLeft <= 1) return 100;
  if (daysLeft <= 3) return 80;
  if (daysLeft <= 7) return 60;
  if (daysLeft <= 14) return 40;
  return 20;
}

/**
 * 認知負荷スコアを計算 (0-100)
 * 負荷が低い（取り組みやすい）ほど高スコア
 * baseLoad 1-10 → 100-10 に正規化
 */
export function calculateCognitiveLoadScore(task: SchedulerInputTask): number {
  const load = getSubjectCognitiveLoad(task.subject);
  // baseLoad が低い（易しい）ほど高スコア
  // 10 → 10, 9 → 20, ..., 1 → 100
  return Math.max(10, (11 - load.baseLoad) * 10);
}

/**
 * 完了履歴・遅延率スコアを計算 (0-100)
 * 過去に遅延が多い教科・タスクほど優先度を上げる
 * 遅延率 0% → 20, 50% → 60, 100% → 100
 */
export function calculateCompletionHistoryScore(
  task: SchedulerInputTask, 
  history: CompletionHistory[]
): number {
  // 該当教科の履歴をフィルタ
  const subjectHistory = history.filter(h => h.subject === task.subject);
  
  if (subjectHistory.length === 0) {
    return 50; // 履歴なしは中間値
  }
  
  const overdueCount = subjectHistory.filter(h => h.wasOverdue).length;
  const delayRate = overdueCount / subjectHistory.length;
  
  // 遅延率に応じてスコアリング
  return Math.round(20 + delayRate * 80);
}

/**
 * 教科多様性・クラスタリング防止スコア (0-100)
 * 直前のタスクと同じ教科ならペナルティ、異なるならボーナス
 */
export function calculateSubjectDiversityScore(
  task: SchedulerInputTask,
  previousSubject: string | null
): number {
  if (!previousSubject) return 50; // 最初のタスクは中間値
  
  if (task.subject === previousSubject) {
    // 同じ教科の連続はペナルティ
    const switchCost = calculateContextSwitchCost(previousSubject, task.subject);
    return Math.round(30 * (1 - switchCost)); // 0-30
  }
  
  // 異なる教科はボーナス
  return 80;
}

/**
 * 期限超過自動優先スコア (0-100)
 * 既に期限超過しているタスクは最優先
 */
export function calculateOverdueAutoPriorityScore(task: SchedulerInputTask, now: Date = new Date()): number {
  const due = parseISO(task.dueDate);
  if (isPast(due) && task.status !== 'completed') {
    const daysOverdue = differenceInDays(now, due);
    // 超過日数に応じて最大100まで上昇
    return Math.min(100, 80 + daysOverdue * 5);
  }
  return 0;
}

/**
 * 単一タスクの総合スコアを計算
 */
export function calculateTaskScore(
  task: SchedulerInputTask,
  context: {
    now: Date;
    history: CompletionHistory[];
    previousSubject: string | null;
    weights: ScoringWeights;
  }
): { score: number; breakdown: Record<string, number> } {
  const { now, history, previousSubject, weights } = context;
  
  const deadlineScore = calculateDeadlinePressureScore(task, now);
  const cognitiveScore = calculateCognitiveLoadScore(task);
  const historyScore = calculateCompletionHistoryScore(task, history);
  const diversityScore = calculateSubjectDiversityScore(task, previousSubject);
  const overdueScore = calculateOverdueAutoPriorityScore(task, now);
  
  const breakdown = {
    deadlinePressure: deadlineScore,
    cognitiveLoad: cognitiveScore,
    completionHistory: historyScore,
    subjectDiversity: diversityScore,
    overdueAutoPriority: overdueScore,
  };
  
  const score = 
    breakdown.deadlinePressure * weights.deadlinePressure +
    breakdown.cognitiveLoad * weights.cognitiveLoad +
    breakdown.completionHistory * weights.completionHistory +
    breakdown.subjectDiversity * weights.subjectDiversity +
    breakdown.overdueAutoPriority * weights.overdueAutoPriority;
  
  return { score: Math.round(score), breakdown };
}

/**
 * タスクの推定所要時間を計算（分）
 */
export function estimateTaskMinutes(task: SchedulerInputTask): number {
  const baseMinutes = 30; // 基本30分
  const priorityMultiplier = { low: 0.8, medium: 1.0, high: 1.3 }[task.priority];
  const load = getSubjectCognitiveLoad(task.subject);
  const loadMultiplier = 0.5 + (load.baseLoad / 20); // 0.55-1.0
  
  return Math.round(baseMinutes * priorityMultiplier * loadMultiplier);
}

/**
 * 推奨ポモドーロ回数を計算
 */
export function calculateRecommendedPomodoro(minutes: number): number {
  const { workMinutes } = require('./types').POMODORO_SETTINGS;
  return Math.max(1, Math.ceil(minutes / workMinutes));
}

/**
 * 全タスクのスコアリングとランキング
 */
export function scoreAndRankTasks(
  tasks: SchedulerInputTask[],
  history: CompletionHistory[],
  config: SchedulerConfig
): ScheduledTask[] {
  const now = new Date();
  let previousSubject: string | null = null;
  
  // スコア計算
  const scored = tasks.map(task => {
    const { score, breakdown } = calculateTaskScore(task, {
      now,
      history,
      previousSubject,
      weights: config.weights,
    });
    
    const estimatedMinutes = estimateTaskMinutes(task);
    const recommendedPomodoro = calculateRecommendedPomodoro(estimatedMinutes);
    
    // 理由生成
    const reason = generateReason(breakdown, task);
    
    // 前の教科を更新（多様性計算用）
    previousSubject = task.subject;
    
    return {
      ...task,
      score,
      estimatedMinutes,
      recommendedPomodoro,
      reason,
    };
  });
  
  // スコア降順でソート
  scored.sort((a, b) => b.score - a.score);
  
  // ランク付け
  return scored.map((task, index) => ({
    ...task,
    rank: index + 1,
  }));
}

/**
 * スコア内訳から理由文字列を生成
 */
function generateReason(breakdown: Record<string, number>, task: SchedulerInputTask): string {
  const reasons: string[] = [];
  
  if (breakdown.overdueAutoPriority > 0) {
    reasons.push('期限超過');
  }
  if (breakdown.deadlinePressure >= 80) {
    reasons.push('締切迫る');
  }
  if (breakdown.completionHistory >= 70) {
    reasons.push('遅延傾向あり');
  }
  if (breakdown.subjectDiversity >= 70) {
    reasons.push('教科切り替え推奨');
  }
  if (breakdown.cognitiveLoad >= 70) {
    reasons.push('取り組みやすい');
  }
  
  return reasons.length > 0 ? reasons.join('、') : '標準優先度';
}
