/**
 * Natural Language Assignment Input - Type Definitions
 * 自然言語課題入力の型定義
 */

// パース結果の基本型
export interface ParsedAssignment {
  title: string;
  subject: string;
  dueDate: string; // ISO 8601 format (YYYY-MM-DD)
  priority: 'low' | 'medium' | 'high';
  description?: string;
}

// 自然言語入力の結果型
export interface NLInputResult {
  success: boolean;
  data?: ParsedAssignment;
  error?: ParseError;
  source: 'llm' | 'regex';
}

// パースエラー型
export interface ParseError {
  code: 'LLM_ERROR' | 'REGEX_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'RATE_LIMITED' | 'UNAUTHORIZED';
  message: string;
  details?: unknown;
  retryable: boolean;
}

// LLM API リクエスト/レスポンス型
export interface LLMParseRequest {
  input: string;
  currentDate: string; // ISO 8601 format
}

export interface LLMParseResponse {
  title: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  description?: string;
}

// サポート教科一覧
export const SUPPORTED_SUBJECTS = [
  '数学', '英語', '国語', '理科', '社会', '情報',
  '物理', '化学', '生物', '地学',
  '世界史', '日本史', '地理', '政治経済', '倫理',
  'プログラミング', 'アルゴリズム', 'データ構造',
] as const;

export type SupportedSubject = typeof SUPPORTED_SUBJECTS[number];

// 優先度マッピング
export const PRIORITY_LABELS: Record<'low' | 'medium' | 'high', string> = {
  low: '低',
  medium: '中',
  high: '高',
};

// ステータス遷移: idle → loading → preview → (submitting | error) → idle
export type NLInputState = 'idle' | 'loading' | 'preview' | 'error' | 'submitting';

// プレビュー表示用データ
export interface PreviewData {
  parsed: ParsedAssignment;
  originalInput: string;
  source: 'llm' | 'regex';
}
