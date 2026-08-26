/**
 * Cognitive Load Adaptive Scheduler - 型定義
 * 認知負荷適応スケジューラの型定義
 */

import type { ParsedAssignment } from '@/lib/nlp/types';

/**
 * スケジューリング対象のタスク
 */
export interface ScheduledTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // ISO 8601 (YYYY-MM-DD)
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string | null;
  createdAt: string;
  score: number; // 0-100 の総合スコア
  rank: number; // 推奨順序（1から開始）
  reason: string; // スコアリング理由
  estimatedMinutes: number; // 推定所要時間
  recommendedPomodoro: number; // 推奨ポモドーロ回数
}

/**
 * スケジュール推奨結果
 */
export interface ScheduleRecommendation {
  tasks: ScheduledTask[];
  generatedAt: string; // ISO 8601
  totalEstimatedMinutes: number;
  totalPomodoroCount: number;
  summary: string; // ユーザー向けサマリー
}

/**
 * 課題入力データ（スケジューラ用）
 */
export interface SchedulerInputTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string | null;
  createdAt: string;
}

/**
 * 完了履歴データ
 */
export interface CompletionHistory {
  taskId: string;
  subject: string;
  dueDate: string;
  completedAt: string;
  wasOverdue: boolean;
  delayDays: number;
}

/**
 * 教科ごとの認知負荷設定
 */
export interface SubjectCognitiveLoad {
  subject: string;
  baseLoad: number; // 1-10 基本負荷
  deepWorkFactor: number; // 1.0-2.0 ディープワーク係数
  contextSwitchCost: number; // 0-1 切り替えコスト
}

/**
 * スコアリング重み設定
 */
export interface ScoringWeights {
  deadlinePressure: number; // 40%
  cognitiveLoad: number; // 20%
  completionHistory: number; // 15%
  subjectDiversity: number; // 10%
  overdueAutoPriority: number; // 15%
}

/**
 * デフォルト重み
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  deadlinePressure: 0.40,
  cognitiveLoad: 0.20,
  completionHistory: 0.15,
  subjectDiversity: 0.10,
  overdueAutoPriority: 0.15,
};

/**
 * ポモドーロ設定
 */
export const POMODORO_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
} as const;

/**
 * スケジューラ設定
 */
export interface SchedulerConfig {
  weights: ScoringWeights;
  maxTasksPerDay: number;
  workHoursPerDay: number; // 時間
  pomodoro: typeof POMODORO_SETTINGS;
  subjectLoads: SubjectCognitiveLoad[];
}

export const DEFAULT_CONFIG: SchedulerConfig = {
  weights: DEFAULT_WEIGHTS,
  maxTasksPerDay: 8,
  workHoursPerDay: 4,
  pomodoro: POMODORO_SETTINGS,
  subjectLoads: [],
};
