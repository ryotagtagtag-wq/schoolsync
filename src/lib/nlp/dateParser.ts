/**
 * Japanese Date Parser - 日本語相対日付パーサー
 * date-fns v4 + ja locale を使用
 */

import { 
  parse, 
  format, 
  addDays, 
  addWeeks, 
  addMonths, 
  startOfDay, 
  startOfWeek, 
  startOfMonth,
  setDay,
  isValid,
  getDay,
  differenceInDays
} from 'date-fns';
import { ja } from 'date-fns/locale/ja';

/**
 * 現在日時を基準にした相対日付表現をパース
 * @param expression 日本語の日付表現（例: "明日", "来週金曜日", "9/15"）
 * @param baseDate 基準日（デフォルト: 今日）
 * @returns ISO 8601 形式の日付文字列 (YYYY-MM-DD)、パース失敗時は null
 */
export function parseJapaneseDate(expression: string, baseDate: Date = new Date()): string | null {
  const normalized = expression.trim().replace(/[\s\u3000]/g, '');
  const today = startOfDay(baseDate);
  
  // 1. 相対日付キーワード
  const relativePatterns: Array<{ pattern: RegExp; handler: (match: RegExpMatchArray) => Date | null }> = [
    // 今日・明日・明後日・明明後日
    { pattern: /^今日$/, handler: () => today },
    { pattern: /^明日$/, handler: () => addDays(today, 1) },
    { pattern: /^明後日$|^あさって$/, handler: () => addDays(today, 2) },
    { pattern: /^明明後日$|^しあさって$/, handler: () => addDays(today, 3) },
    
    // N日後・N日前
    { pattern: /^(\d+)日後$/, handler: (m) => addDays(today, parseInt(m[1], 10)) },
    { pattern: /^(\d+)日前$/, handler: (m) => addDays(today, -parseInt(m[1], 10)) },
    
    // 今週・来週・再来週
    { pattern: /^今週$/, handler: () => startOfWeek(today, { weekStartsOn: 1 }) },
    { pattern: /^来週$/, handler: () => addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1) },
    { pattern: /^再来週$/, handler: () => addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 2) },
    
    // 今月・来月
    { pattern: /^今月$/, handler: () => startOfMonth(today) },
    { pattern: /^来月$/, handler: () => addMonths(startOfMonth(today), 1) },
    
    // 曜日指定: 「月曜日」「来週火曜日」「今週金曜日」
    { pattern: /^(今週|来週|再来週)?(月曜日|火曜日|水曜日|木曜日|金曜日|土曜日|日曜日)$/, handler: (m) => {
      const weekOffset = m[1] === '来週' ? 1 : m[1] === '再来週' ? 2 : 0;
      const targetDay = weekdayToNumber(m[2]);
      if (targetDay === null) return null;
      
      const weekStart = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), weekOffset);
      const result = setDay(weekStart, targetDay, { weekStartsOn: 1 });
      
      // 過去の日付にならないよう調整
      if (differenceInDays(result, today) < 0) {
        return addWeeks(result, 1);
      }
      return result;
    }},
    
    // 「来月の○日」
    { pattern: /^来月(\d{1,2})日?$/, handler: (m) => {
      const day = parseInt(m[1], 10);
      if (day < 1 || day > 31) return null;
      const nextMonth = addMonths(startOfMonth(today), 1);
      return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day);
    }},
    
    // 「今月の○日」
    { pattern: /^今月(\d{1,2})日?$/, handler: (m) => {
      const day = parseInt(m[1], 10);
      if (day < 1 || day > 31) return null;
      return new Date(today.getFullYear(), today.getMonth(), day);
    }},
  ];
  
  // 相対パターンマッチング
  for (const { pattern, handler } of relativePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const result = handler(match);
      if (result && isValid(result)) {
        return format(startOfDay(result), 'yyyy-MM-dd');
      }
    }
  }
  
  // 2. 明示的な日付フォーマット
  const explicitPatterns: Array<{ pattern: RegExp; formatStr: string }> = [
    { pattern: /^(\d{4})[\/\-年](\d{1,2})[\/\-月](\d{1,2})日?$/, formatStr: 'yyyy-MM-dd' },
    { pattern: /^(\d{1,2})[\/\-月](\d{1,2})日?$/, formatStr: 'MM-dd' }, // 年なし → 今年または来年
    { pattern: /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, formatStr: 'yyyy-MM-dd' },
    { pattern: /^(\d{1,2})[\/\-](\d{1,2})$/, formatStr: 'MM-dd' },
  ];
  
  for (const { pattern, formatStr } of explicitPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      try {
        let year = today.getFullYear();
        let month: number;
        let day: number;
        
        if (formatStr === 'yyyy-MM-dd') {
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10);
          day = parseInt(match[3], 10);
        } else { // MM-dd
          month = parseInt(match[1], 10);
          day = parseInt(match[2], 10);
          
          // 過去の日付なら来年とする
          const candidate = new Date(year, month - 1, day);
          if (candidate < today) {
            year += 1;
          }
        }
        
        if (month < 1 || month > 12 || day < 1 || day > 31) continue;
        
        const result = new Date(year, month - 1, day);
        if (isValid(result)) {
          return format(startOfDay(result), 'yyyy-MM-dd');
        }
      } catch {
        continue;
      }
    }
  }
  
  // 3. date-fns parse で日本語ロケールでのパースを試行
  const jaPatterns = [
    'yyyy年M月d日',
    'yyyy/M/d',
    'M月d日',
    'yyyy-MM-dd',
    'MM/dd',
  ];
  
  for (const pattern of jaPatterns) {
    try {
      const parsed = parse(normalized, pattern, today, { locale: ja });
      if (isValid(parsed)) {
        // 年が指定されていないパターンの場合、過去なら来年扱い
        if (!normalized.match(/^\d{4}/) && parsed < today) {
          const nextYear = new Date(parsed.getFullYear() + 1, parsed.getMonth(), parsed.getDate());
          return format(startOfDay(nextYear), 'yyyy-MM-dd');
        }
        return format(startOfDay(parsed), 'yyyy-MM-dd');
      }
    } catch {
      continue;
    }
  }
  
  return null;
}

/**
 * 日本語曜日を数値に変換 (月=1, ..., 日=0)
 */
function weekdayToNumber(weekday: string): number | null {
  const map: Record<string, number> = {
    '月曜日': 1, '火曜日': 2, '水曜日': 3, '木曜日': 4,
    '金曜日': 5, '土曜日': 6, '日曜日': 0,
    '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0,
  };
  return map[weekday] ?? null;
}

/**
 * 複数の日付表現から最も早い有効な日付を抽出
 * @param expressions 日付表現の配列
 * @param baseDate 基準日
 * @returns 最初に見つかった有効な日付、なければ null
 */
export function extractFirstDate(expressions: string[], baseDate: Date = new Date()): string | null {
  for (const expr of expressions) {
    const parsed = parseJapaneseDate(expr, baseDate);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * テキストから日付らしい部分を抽出してパースを試行
 * @param text 入力テキスト
 * @param baseDate 基準日
 * @returns パースされた日付、なければ null
 */
export function extractDateFromText(text: string, baseDate: Date = new Date()): string | null {
  // 日付らしきパターンを抽出
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
  
  const matches = new Set<string>();
  for (const pattern of datePatterns) {
    const found = text.match(pattern);
    if (found) found.forEach(m => matches.add(m));
  }
  
  return extractFirstDate(Array.from(matches), baseDate);
}
