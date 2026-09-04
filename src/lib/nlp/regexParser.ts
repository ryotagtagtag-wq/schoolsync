/**
 * Regex Fallback Parser - 正規表現フォールバックパーサー
 * LLM API が失敗した際のフォールバック用
 * 
 * 注意: すべての日付計算は JST (Asia/Tokyo) 基準で行う
 */

import { parseJapaneseDate, extractDateFromText } from './dateParser';
import { extractSubjects, getDefaultSubject, SUBJECT_VARIANTS } from './subjectDictionary';
import type { ParsedAssignment, ParseError } from './types';

/**
 * 優先度キーワードマッピング
 * 長いキーワードを優先してマッチングするため、配列で順序を制御
 */
const PRIORITY_KEYWORDS: Array<{ keyword: string; priority: 'low' | 'medium' | 'high' }> = [
  // 高優先度（長い順）
  { keyword: '至急', priority: 'high' },
  { keyword: '緊急', priority: 'high' },
  { keyword: '重要', priority: 'high' },
  { keyword: '急ぎ', priority: 'high' },
  { keyword: '高', priority: 'high' },
  { keyword: 'urgent', priority: 'high' },
  { keyword: 'important', priority: 'high' },
  { keyword: 'high', priority: 'high' },
  // 低優先度（長い順）
  { keyword: 'いつでも', priority: 'low' },
  { keyword: '余裕', priority: 'low' },
  { keyword: 'あとで', priority: 'low' },
  { keyword: '低', priority: 'low' },
  { keyword: 'later', priority: 'low' },
  { keyword: 'low', priority: 'low' },
  // 中優先度（長い順）
  { keyword: '通常', priority: 'medium' },
  { keyword: '普通', priority: 'medium' },
  { keyword: '中', priority: 'medium' },
  { keyword: 'normal', priority: 'medium' },
  { keyword: 'medium', priority: 'medium' },
];

/**
 * タイトル抽出用パターン（教科・日付・優先度以外の部分）
 * 重複を削除
 */
const TITLE_STOP_WORDS = [
  'の課題', 'の宿題', 'のレポート',
  '課題', '宿題', 'レポート',
  '課題を', '宿題を', 'レポートを',
  '提出', 'やる', 'やること', 'タスク', 'task',
];

/**
 * 正規表現ベースで自然言語入力をパース
 * @param input ユーザー入力テキスト
 * @param currentDate 基準日（ISO 8601 形式）
 * @returns パース結果
 */
export function regexParse(input: string, currentDate: string): ParsedAssignment {
  const baseDate = new Date(currentDate);
  const text = input.trim();
  
  // 1. 日付抽出
  const dueDate = extractDateFromText(text, baseDate) || formatDefaultDueDate(baseDate);
  
  // 2. 教科抽出
  const subjects = extractSubjects(text);
  const subject = subjects[0] || getDefaultSubject();
  
  // 3. 優先度抽出
  const priority = extractPriority(text);
  
  // 4. タイトル抽出（教科・日付・優先度キーワードを除いた核心部分）
  const title = extractTitle(text, subject, priority);
  
  // 5. 説明文（元の入力全文を保持）
  const description = text;
  
  return {
    title,
    subject,
    dueDate,
    priority,
    description,
  };
}

/**
 * デフォルト締切日（明後日）を生成
 */
function formatDefaultDueDate(baseDate: Date): string {
  const defaultDate = new Date(baseDate);
  defaultDate.setDate(defaultDate.getDate() + 2);
  return defaultDate.toISOString().split('T')[0];
}

/**
 * 優先度を抽出
 * 長いキーワードから順にマッチング
 */
function extractPriority(text: string): 'low' | 'medium' | 'high' {
  const lowerText = text.toLowerCase();
  
  for (const { keyword, priority } of PRIORITY_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return priority;
    }
  }
  
  return 'medium'; // デフォルト
}

/**
 * タイトルを抽出
 * 教科名、日付表現、優先度キーワード、ストップワードを除去
 */
function extractTitle(text: string, subject: string, priority: 'low' | 'medium' | 'high'): string {
  let title = text;
  
  // 教科名のバリエーションを取得（該当する教科のもののみ）
  const subjectKeywords = [
    subject,
    ...Object.keys(SUBJECT_VARIANTS)
      .filter(k => SUBJECT_VARIANTS[k] === subject)
  ];
  
  for (const kw of subjectKeywords) {
    title = title.replace(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
  }
  
  // 日付表現を除去
  const datePatterns = [
    /\d{4}[\/\-年]\d{1,2}[\/\-月]\d{1,2}日?/g,
    /\d{1,2}[\/\-月]\d{1,2}日?/g,
    /\d{1,2}日後/g,
    /\d{1,2}日前/g,
    /(今日|明日|明後日|明明後日|あさって|しあさって)/g,
    /(今週|来週|再来週)?(月曜日|火曜日|水曜日|木曜日|金曜日|土曜日|日曜日)/g,
    /(今月|来月)\d{1,2}日?/g,
    /(今週|来週|再来週|今月|来月)/g,
  ];
  
  for (const pattern of datePatterns) {
    title = title.replace(pattern, '');
  }
  
  // 優先度キーワードを除去（長い順）
  for (const { keyword } of PRIORITY_KEYWORDS) {
    title = title.replace(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  }
  
  // ストップワードを除去
  for (const sw of TITLE_STOP_WORDS) {
    title = title.replace(new RegExp(sw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
  }
  
  // 記号・余分な空白を整理
  title = title
    .replace(/[のをがはにへでとや]/g, '')
    .replace(/[\s\u3000]+/g, ' ')
    .replace(/^[、。．,.\s\u3000]+|[、。．,.\s\u3000]+$/g, '')
    .trim();
  
  // 空になった場合のフォールバック
  if (!title) {
    return `${subject}の課題`;
  }
  
  // 長すぎる場合は切り詰め
  if (title.length > 100) {
    title = title.slice(0, 97) + '...';
  }
  
  return title;
}

/**
 * バリデーション付きパース
 * パース結果が不完全な場合はエラー情報を含めて返す
 */
export function regexParseWithValidation(
  input: string, 
  currentDate: string
): { success: true; data: ParsedAssignment } | { success: false; error: ParseError } {
  try {
    const data = regexParse(input, currentDate);
    
    // 必須フィールドの検証
    // フォールバックタイトル（"教科の課題")は、教科が入力から抽出された場合のみ許可
    // 教科も日付も特定できない曖昧な入力は失敗とする
    const extractedSubjects = extractSubjects(input);
    const isFallbackTitle = data.title === `${data.subject}の課題`;
    const hasExtractedSubject = extractedSubjects.length > 0;
    
    if (!data.title || (isFallbackTitle && !hasExtractedSubject)) {
      return {
        success: false,
        error: {
          code: 'REGEX_ERROR',
          message: 'タイトルを特定できませんでした。より具体的に入力してください。',
          retryable: false,
        },
      };
    }
    
    if (!data.dueDate) {
      return {
        success: false,
        error: {
          code: 'REGEX_ERROR',
          message: '締切日を特定できませんでした。日付を含めて入力してください。',
          retryable: false,
        },
      };
    }
    
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'REGEX_ERROR',
        message: '正規表現パース中にエラーが発生しました。',
        details: err instanceof Error ? err.message : String(err),
        retryable: false,
      },
    };
  }
}
