/**
 * regexParser ユニットテスト
 */

import { regexParse, regexParseWithValidation } from '../regexParser';
import type { ParsedAssignment } from '../types';

describe('regexParse', () => {
  const currentDate = '2026-08-26';

  describe('基本的なパース', () => {
    test('シンプルな入力', () => {
      const result = regexParse('数学の宿題', currentDate);
      expect(result.title).toBeTruthy();
      expect(result.subject).toBe('数学');
      expect(result.priority).toBe('medium');
      expect(result.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('教科・日付・優先度すべて含む', () => {
      const result = regexParse('明日の英語のレポート（高優先度）', currentDate);
      expect(result.subject).toBe('英語');
      expect(result.dueDate).toBe('2026-08-27');
      expect(result.priority).toBe('high');
    });

    test('来週金曜までに物理の課題', () => {
      const result = regexParse('来週金曜までに物理の課題', currentDate);
      expect(result.subject).toBe('物理');
      expect(result.dueDate).toBe('2026-09-04'); // 来週の金曜日
    });

    test('9/15 に化学の実験レポート', () => {
      const result = regexParse('9/15 に化学の実験レポート', currentDate);
      expect(result.subject).toBe('化学');
      expect(result.dueDate).toBe('2026-09-15');
    });

    test('3日後に生物の宿題（低優先度）', () => {
      const result = regexParse('3日後に生物の宿題（低優先度）', currentDate);
      expect(result.subject).toBe('生物');
      expect(result.dueDate).toBe('2026-08-29');
      expect(result.priority).toBe('low');
    });
  });

  describe('優先度キーワード', () => {
    const priorityTests: Array<{ input: string; expected: 'low' | 'medium' | 'high' }> = [
      { input: '重要な宿題', expected: 'high' },
      { input: '急ぎの課題', expected: 'high' },
      { input: '至急やること', expected: 'high' },
      { input: '緊急のレポート', expected: 'high' },
      { input: 'あとでやる宿題', expected: 'low' },
      { input: '余裕がある課題', expected: 'low' },
      { input: 'いつでもいいレポート', expected: 'low' },
      { input: '普通の宿題', expected: 'medium' },
      { input: '通常の課題', expected: 'medium' },
    ];

    test.each(priorityTests)('$input → $expected', ({ input, expected }) => {
      const result = regexParse(input, currentDate);
      expect(result.priority).toBe(expected);
    });
  });

  describe('教科バリエーション', () => {
    const subjectTests: Array<{ input: string; expected: ParsedAssignment['subject'] }> = [
      { input: '数学の宿題', expected: '数学' },
      { input: 'すうがくの課題', expected: '数学' },
      { input: 'math homework', expected: '数学' },
      { input: '英語のレポート', expected: '英語' },
      { input: 'えいごの課題', expected: '英語' },
      { input: 'english report', expected: '英語' },
      { input: '国語の宿題', expected: '国語' },
      { input: '現代文の課題', expected: '国語' },
      { input: '古文の宿題', expected: '国語' },
      { input: '理科のレポート', expected: '理科' },
      { input: '社会の課題', expected: '社会' },
      { input: '情報の宿題', expected: '情報' },
      { input: 'プログラミングの課題', expected: '情報' },
      { input: '物理の実験', expected: '物理' },
      { input: '化学のレポート', expected: '化学' },
      { input: '生物の観察', expected: '生物' },
      { input: '地学の課題', expected: '地学' },
      { input: '世界史のレポート', expected: '世界史' },
      { input: '日本史の宿題', expected: '日本史' },
      { input: '地理の課題', expected: '地理' },
      { input: '政治経済のレポート', expected: '政治経済' },
      { input: '倫理の課題', expected: '倫理' },
      { input: 'アルゴリズムの問題', expected: 'アルゴリズム' },
      { input: 'データ構造の演習', expected: 'データ構造' },
    ];

    test.each(subjectTests)('$input → $expected', ({ input, expected }) => {
      const result = regexParse(input, currentDate);
      expect(result.subject).toBe(expected);
    });
  });

  describe('デフォルト値', () => {
    test('教科が不明な場合は数学', () => {
      const result = regexParse('適当な課題', currentDate);
      expect(result.subject).toBe('数学');
    });

    test('優先度が不明な場合はmedium', () => {
      const result = regexParse('数学の宿題', currentDate);
      expect(result.priority).toBe('medium');
    });

    test('日付が不明な場合は明後日', () => {
      const result = regexParse('数学の宿題', currentDate);
      expect(result.dueDate).toBe('2026-08-28'); // 明後日
    });
  });
});

describe('regexParseWithValidation', () => {
  const currentDate = '2026-08-26';

  test('有効な入力で成功', () => {
    const result = regexParseWithValidation('明日の数学の宿題', currentDate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBeTruthy();
      expect(result.data.dueDate).toBe('2026-08-27');
    }
  });

  test('タイトルが特定できない場合は失敗', () => {
    const result = regexParseWithValidation('課題', currentDate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('REGEX_ERROR');
      expect(result.error.message).toContain('タイトル');
    }
  });
});
