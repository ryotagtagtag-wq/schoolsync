/**
 * Cognitive Load Adaptive Scheduler - 型定義
 * 認知負荷適応スケジューラの型定義
 * 
 * 注意: すべての日付計算は JST (Asia/Tokyo) 基準で行う
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

export type PomodoroSettings = typeof POMODORO_SETTINGS;

/**
 * Scheduler Config
 * Environment variables can override defaults:
 * - SCHEDULER_MAX_TASKS_PER_DAY
 * - SCHEDULER_WORK_HOURS_PER_DAY
 * - SCHEDULER_POMODORO_WORK_MINUTES
 * - SCHEDULER_POMODORO_SHORT_BREAK_MINUTES
 * - SCHEDULER_POMODORO_LONG_BREAK_MINUTES
 * - SCHEDULER_POMODORO_SESSIONS_BEFORE_LONG_BREAK
 * Weights (sum must equal 1.0):
 * - SCHEDULER_WEIGHT_DEADLINE_PRESSURE
 * - SCHEDULER_WEIGHT_COGNITIVE_LOAD
 * - SCHEDULER_WEIGHT_COMPLETION_HISTORY
 * - SCHEDULER_WEIGHT_SUBJECT_DIVERSITY
 * - SCHEDULER_WEIGHT_OVERDUE_AUTO_PRIORITY
 */
export interface SchedulerConfig {
  weights: ScoringWeights;
  maxTasksPerDay: number;
  workHoursPerDay: number; // 時間
  pomodoro: {
    workMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    sessionsBeforeLongBreak: number;
  };
  subjectLoads: SubjectCognitiveLoad[];
}

function getEnvNumber(key: string, fallback: number): number {
  const val = process.env[key];
  if (val === undefined) return fallback;
  const parsed = Number(val);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function getEnvWeights(): ScoringWeights {
  return {
    deadlinePressure: getEnvNumber('SCHEDULER_WEIGHT_DEADLINE_PRESSURE', DEFAULT_WEIGHTS.deadlinePressure),
    cognitiveLoad: getEnvNumber('SCHEDULER_WEIGHT_COGNITIVE_LOAD', DEFAULT_WEIGHTS.cognitiveLoad),
    completionHistory: getEnvNumber('SCHEDULER_WEIGHT_COMPLETION_HISTORY', DEFAULT_WEIGHTS.completionHistory),
    subjectDiversity: getEnvNumber('SCHEDULER_WEIGHT_SUBJECT_DIVERSITY', DEFAULT_WEIGHTS.subjectDiversity),
    overdueAutoPriority: getEnvNumber('SCHEDULER_WEIGHT_OVERDUE_AUTO_PRIORITY', DEFAULT_WEIGHTS.overdueAutoPriority),
  };
}

export function getSchedulerConfig(): SchedulerConfig {
  const weights = getEnvWeights();
  
  // Validate weights sum to 1.0 (with small epsilon for floating point)
  const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const validatedWeights = Math.abs(weightSum - 1.0) < 0.001 ? weights : DEFAULT_WEIGHTS;

  return {
    weights: validatedWeights,
    maxTasksPerDay: getEnvNumber('SCHEDULER_MAX_TASKS_PER_DAY', 8),
    workHoursPerDay: getEnvNumber('SCHEDULER_WORK_HOURS_PER_DAY', 4),
    pomodoro: {
      workMinutes: getEnvNumber('SCHEDULER_POMODORO_WORK_MINUTES', POMODORO_SETTINGS.workMinutes),
      shortBreakMinutes: getEnvNumber('SCHEDULER_POMODORO_SHORT_BREAK_MINUTES', POMODORO_SETTINGS.shortBreakMinutes),
      longBreakMinutes: getEnvNumber('SCHEDULER_POMODORO_LONG_BREAK_MINUTES', POMODORO_SETTINGS.longBreakMinutes),
      sessionsBeforeLongBreak: getEnvNumber('SCHEDULER_POMODORO_SESSIONS_BEFORE_LONG_BREAK', POMODORO_SETTINGS.sessionsBeforeLongBreak),
    },
    subjectLoads: [],
  };
}

// Backward compatibility - lazy init
let cachedConfig: SchedulerConfig | null = null;
export const DEFAULT_CONFIG: SchedulerConfig = new Proxy({} as SchedulerConfig, {
  get(_, prop) {
    if (!cachedConfig) {
      cachedConfig = getSchedulerConfig();
    }
    return cachedConfig[prop as keyof SchedulerConfig];
  },
});
