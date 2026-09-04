import { 
  parse, 
  isValid,
  addMonths,
  startOfMonth
} from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const JST = 'Asia/Tokyo';

/**
 * Japanese Date Parser - 日本語相対日付パーサー
 * date-fns v4 + ja locale + date-fns-tz を使用（JST固定で処理）
 */

/**
 * baseDate を JST として解釈し、その日の 0:00 JST を UTC の Date として返す
 */
function getJSTToday(baseDate: Date = new Date()): Date {
  const jst = toZonedTime(baseDate, JST);
  const year = jst.getFullYear();
  const month = jst.getMonth();
  return new Date(Date.UTC(year, month, jst.getDate() - 1, 15, 0, 0));
}

/**
 * JSTでの週初め（月曜日0:00）を取得
 */
function getJSTStartOfWeek(date: Date): Date {
  const jst = toZonedTime(date, JST);
  const year = jst.getFullYear();
  const month = jst.getMonth();
  const dayOfMonth = jst.getDate();
  
  // Zellerの合同式（グレゴリオ暦）
  // h = (q + [13(m+1)/5] + K + [K/4] + [J/4] + 5J) mod 7
  // h: 0=土曜日, 1=日曜日, 2=月曜日, ..., 6=金曜日
  let m = month + 1;
  let y = year;
  if (m < 3) { m += 12; y -= 1; }
  const q = dayOfMonth;
  const K = y % 100;
  const J = Math.floor(y / 100);
  const h = (q + Math.floor(13 * (m + 1) / 5) + K + Math.floor(K / 4) + Math.floor(J / 4) + 5 * J) % 7;
  // 月曜日=0基準に変換: h=2(月曜日) -> 0, h=3(火曜日) -> 1, ...
  const mondayBased = (h + 5) % 7;
  const diff = -mondayBased;
  
  return new Date(Date.UTC(year, month, dayOfMonth + diff - 1, 15, 0, 0));
}

/**
 * JSTでの週内の指定曜日を取得（月曜日=1基準）
 */
function getJSTWeekday(weekStart: Date, targetDay: number): Date {
  const jst = toZonedTime(weekStart, JST);
  const year = jst.getFullYear();
  const month = jst.getMonth();
  const day = jst.getDate() + (targetDay === 0 ? 6 : targetDay - 1);
  return new Date(Date.UTC(year, month, day - 1, 15, 0, 0));
}

/**
 * JST基準のヘルパー関数
 */
function addDaysJST(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addWeeksJST(date: Date, weeks: number): Date {
  return new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
}

function addMonthsJST(date: Date, months: number): Date {
  const jst = toZonedTime(date, JST);
  const year = jst.getFullYear();
  const month = jst.getMonth() + months;
  return new Date(Date.UTC(year, month, 0, 15, 0, 0));
}

function getJSTStartOfMonth(date: Date): Date {
  const jst = toZonedTime(date, JST);
  const year = jst.getFullYear();
  const month = jst.getMonth();
  return new Date(Date.UTC(year, month, 0, 15, 0, 0));
}

function differenceInDaysJST(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}

function weekdayToNumber(weekday: string): number | null {
  const map: Record<string, number> = {
    '月曜日': 1, '火曜日': 2, '水曜日': 3, '木曜日': 4,
    '金曜日': 5, '土曜日': 6, '日曜日': 0,
    '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0,
  };
  return map[weekday] ?? null;
}

/**
 * 現在日時を基準にした相対日付表現をパース
 * @param expression 日本語の日付表現（例: "明日", "来週金曜日", "9/15"）
 * @param baseDate 基準日（デフォルト: 今日）。任意のタイムゾーンの Date で渡せる。内部で JST に変換して処理。
 * @returns ISO 8601 形式の日付文字列 (YYYY-MM-DD)、パース失敗時は null
 */
export function parseJapaneseDate(expression: string, baseDate: Date = new Date()): string | null {
  const normalized = expression.trim().replace(/[\s　]/g, '');
  const today = getJSTToday(baseDate);
  const baseYear = toZonedTime(baseDate, JST).getFullYear();
  
  // 1. 相対日付キーワード
  const relativePatterns: Array<{ pattern: RegExp; handler: (match: RegExpMatchArray, today: Date) => Date | null }> = [
    { pattern: /^今日$/, handler: (_, today) => today },
    { pattern: /^明日$/, handler: (_, today) => addDaysJST(today, 1) },
    { pattern: /^明後日$|^あさって$/, handler: (_, today) => addDaysJST(today, 2) },
    { pattern: /^明明後日$|^しあさって$/, handler: (_, today) => addDaysJST(today, 3) },
    { pattern: /^(\d+)日後$/, handler: (m, today) => addDaysJST(today, parseInt(m[1], 10)) },
    { pattern: /^(\d+)日前$/, handler: (m, today) => addDaysJST(today, -parseInt(m[1], 10)) },
    { pattern: /^今週$/, handler: (_, today) => getJSTStartOfWeek(today) },
    { pattern: /^来週$/, handler: (_, today) => addWeeksJST(getJSTStartOfWeek(today), 1) },
    { pattern: /^再来週$/, handler: (_, today) => addWeeksJST(getJSTStartOfWeek(today), 2) },
    { pattern: /^今月$/, handler: (_, today) => getJSTStartOfMonth(today) },
    { pattern: /^来月$/, handler: (_, today) => addMonthsJST(getJSTStartOfMonth(today), 1) },
    
    // 曜日指定: 過去調整なし
    { pattern: /^(今週|来週|再来週)?(月曜日|火曜日|水曜日|木曜日|金曜日|土曜日|日曜日|月|火|水|木|金|土|日)$/, handler: (m, today) => {
      const weekOffset = m[1] === '来週' ? 1 : m[1] === '再来週' ? 2 : 0;
      const targetDay = weekdayToNumber(m[2]);
      if (targetDay === null) return null;
      const weekStart = addWeeksJST(getJSTStartOfWeek(today), weekOffset);
      return getJSTWeekday(weekStart, targetDay);
    }},
    
    { pattern: /^来月(\d{1,2})日?$/, handler: (m, today) => {
      const day = parseInt(m[1], 10);
      if (day < 1 || day > 31) return null;
      const jst = toZonedTime(today, JST);
      const nextMonth = addMonths(startOfMonth(jst), 1);
      const year = nextMonth.getFullYear();
      const month = nextMonth.getMonth();
      return new Date(Date.UTC(year, month, day - 1, 15, 0, 0));
    }},
    { pattern: /^今月(\d{1,2})日?$/, handler: (m, today) => {
      const day = parseInt(m[1], 10);
      if (day < 1 || day > 31) return null;
      const jst = toZonedTime(today, JST);
      const year = jst.getFullYear();
      const month = jst.getMonth();
      return new Date(Date.UTC(year, month, day - 1, 15, 0, 0));
    }},
  ];
  
  
  // 1. 相対パターン
  for (const { pattern, handler } of relativePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const result = handler(match, today);
      if (result && isValid(result)) {
        return formatInTimeZone(result, JST, 'yyyy-MM-dd');
      }
    }
  }
  
  // 2. 明示的な日付フォーマット
  const explicitPatterns: Array<{ pattern: RegExp; handler: (match: RegExpMatchArray) => string | null }> = [
    { 
      pattern: /^(\d{4})[/年\-](\d{1,2})[/月\-](\d{1,2})日?$/, 
      handler: (m) => {
        const year = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        const day = parseInt(m[3], 10);
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        const result = new Date(Date.UTC(year, month - 1, day - 1, 15, 0, 0));
        const check = toZonedTime(result, JST);
        if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) return null;
        return formatInTimeZone(result, JST, 'yyyy-MM-dd');
      }
    },
    { 
      pattern: /^(\d{1,2})[/月\-](\d{1,2})日?$/, 
      handler: (m) => {
        const month = parseInt(m[1], 10);
        const day = parseInt(m[2], 10);
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        let year = baseYear;
        const result = new Date(Date.UTC(year, month - 1, day - 1, 15, 0, 0));
        const check = toZonedTime(result, JST);
        if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) return null;
        // 過去の日付なら来年へ
        if (result < today) {
          year += 1;
          const resultNext = new Date(Date.UTC(year, month - 1, day - 1, 15, 0, 0));
          const checkNext = toZonedTime(resultNext, JST);
          if (checkNext.getFullYear() === year && checkNext.getMonth() === month - 1 && checkNext.getDate() === day) {
            return formatInTimeZone(resultNext, JST, 'yyyy-MM-dd');
          }
        }
        return formatInTimeZone(result, JST, 'yyyy-MM-dd');
      }
    },
    { 
      pattern: /^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/, 
      handler: (m) => {
        const year = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        const day = parseInt(m[3], 10);
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        const result = new Date(Date.UTC(year, month - 1, day - 1, 15, 0, 0));
        const check = toZonedTime(result, JST);
        if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) return null;
        return formatInTimeZone(result, JST, 'yyyy-MM-dd');
      }
    },
    { 
      pattern: /^(\d{1,2})[/\-](\d{1,2})$/, 
      handler: (m) => {
        const month = parseInt(m[1], 10);
        const day = parseInt(m[2], 10);
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        let year = baseYear;
        const result = new Date(Date.UTC(year, month - 1, day - 1, 15, 0, 0));
        const check = toZonedTime(result, JST);
        if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) return null;
        // 過去の日付なら来年へ
        if (result < today) {
          year += 1;
          const resultNext = new Date(Date.UTC(year, month - 1, day - 1, 15, 0, 0));
          const checkNext = toZonedTime(resultNext, JST);
          if (checkNext.getFullYear() === year && checkNext.getMonth() === month - 1 && checkNext.getDate() === day) {
            return formatInTimeZone(resultNext, JST, 'yyyy-MM-dd');
          }
        }
        return formatInTimeZone(result, JST, 'yyyy-MM-dd');
      }
    },
  ];
  
  // 明示的フォーマット
  for (const { pattern, handler } of explicitPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const result = handler(match);
      if (result) return result;
    }
  }
  
  // 3. date-fns parse で日本語ロケールでのパースを試行
  const todayForParse = getJSTToday(baseDate);
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
        if (!normalized.match(/^\d{4}/) && parsed < getJSTToday(baseDate)) {
          const nextYear = new Date(parsed.getFullYear() + 1, parsed.getMonth(), parsed.getDate(), 15, 0, 0);
          return formatInTimeZone(nextYear, JST, 'yyyy-MM-dd');
        }
        const check = toZonedTime(parsed, JST);
        const expectedMonth = parsed.getMonth();
        const expectedDate = parsed.getDate();
        if (check.getUTCMonth() !== expectedMonth || check.getUTCDate() !== expectedDate) {
          continue;
        }
        return formatInTimeZone(parsed, JST, 'yyyy-MM-dd');
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
export function extractFirstDate(expressions: string[], baseDate: Date = new Date()): string | null {
  for (const expr of expressions) {
    const parsed = parseJapaneseDate(expr, baseDate);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * テキストから日付らしい部分を抽出してパースを試行
 */
export function extractDateFromText(text: string, baseDate: Date = new Date()): string | null {
  const datePatterns = [
    /\d{4}[/年\-]\d{1,2}[/月\-]\d{1,2}日?/g,
    /\d{1,2}[/月\-]\d{1,2}日?/g,
    /\d{1,2}日後/g,
    /\d{1,2}日前/g,
    /(今日|明日|明後日|明明後日|あさって|しあさって)/g,
    /(今週|来週|再来週)?(月曜日|火曜日|水曜日|木曜日|金曜日|土曜日|日曜日|月|火|水|木|金|土|日)/g,
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
