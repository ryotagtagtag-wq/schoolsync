/**
 * dateParser ユニットテスト
 */

import { parseJapaneseDate, extractDateFromText, extractFirstDate } from '../dateParser';

describe('parseJapaneseDate', () => {
  const baseDate = new Date('2026-08-26T12:00:00'); // 水曜日

  describe('相対日付キーワード', () => {
    test('今日', () => {
      expect(parseJapaneseDate('今日', baseDate)).toBe('2026-08-26');
    });

    test('明日', () => {
      expect(parseJapaneseDate('明日', baseDate)).toBe('2026-08-27');
    });

    test('明後日', () => {
      expect(parseJapaneseDate('明後日', baseDate)).toBe('2026-08-28');
    });

    test('あさって（ひらがな）', () => {
      expect(parseJapaneseDate('あさって', baseDate)).toBe('2026-08-28');
    });

    test('明明後日', () => {
      expect(parseJapaneseDate('明明後日', baseDate)).toBe('2026-08-29');
    });

    test('しあさって（ひらがな）', () => {
      expect(parseJapaneseDate('しあさって', baseDate)).toBe('2026-08-29');
    });

    test('N日後', () => {
      expect(parseJapaneseDate('3日後', baseDate)).toBe('2026-08-29');
      expect(parseJapaneseDate('10日後', baseDate)).toBe('2026-09-05');
    });

    test('N日前', () => {
      expect(parseJapaneseDate('3日前', baseDate)).toBe('2026-08-23');
      expect(parseJapaneseDate('1日前', baseDate)).toBe('2026-08-25');
    });
  });

  describe('週単位', () => {
    test('今週（月曜日始まり）', () => {
      // 2026-08-26 は水曜日 → 今週の月曜日は 2026-08-24
      expect(parseJapaneseDate('今週', baseDate)).toBe('2026-08-24');
    });

    test('来週', () => {
      expect(parseJapaneseDate('来週', baseDate)).toBe('2026-08-31');
    });

    test('再来週', () => {
      expect(parseJapaneseDate('再来週', baseDate)).toBe('2026-09-07');
    });
  });

  describe('月単位', () => {
    test('今月', () => {
      expect(parseJapaneseDate('今月', baseDate)).toBe('2026-08-01');
    });

    test('来月', () => {
      expect(parseJapaneseDate('来月', baseDate)).toBe('2026-09-01');
    });
  });

  describe('曜日指定', () => {
    test('月曜日（今週）', () => {
      expect(parseJapaneseDate('月曜日', baseDate)).toBe('2026-08-24');
    });

    test('金曜日（今週）', () => {
      expect(parseJapaneseDate('金曜日', baseDate)).toBe('2026-08-28');
    });

    test('来週金曜日', () => {
      expect(parseJapaneseDate('来週金曜日', baseDate)).toBe('2026-09-04');
    });

    test('今週火曜日', () => {
      expect(parseJapaneseDate('今週火曜日', baseDate)).toBe('2026-08-25');
    });

    test('再来週月曜日', () => {
      expect(parseJapaneseDate('再来週月曜日', baseDate)).toBe('2026-09-07');
    });
  });

  describe('明示的日付フォーマット', () => {
    test('YYYY/MM/DD', () => {
      expect(parseJapaneseDate('2026/09/15', baseDate)).toBe('2026-09-15');
    });

    test('YYYY-MM-DD', () => {
      expect(parseJapaneseDate('2026-09-15', baseDate)).toBe('2026-09-15');
    });

    test('YYYY年M月D日', () => {
      expect(parseJapaneseDate('2026年9月15日', baseDate)).toBe('2026-09-15');
    });

    test('M/D（年なし・未来）', () => {
      expect(parseJapaneseDate('9/15', baseDate)).toBe('2026-09-15');
    });

    test('M/D（年なし・過去→来年）', () => {
      // 8/26基準で8/15は過去 → 翌年
      expect(parseJapaneseDate('8/15', baseDate)).toBe('2027-08-15');
    });

    test('来月15日', () => {
      expect(parseJapaneseDate('来月15日', baseDate)).toBe('2026-09-15');
    });

    test('来月15', () => {
      expect(parseJapaneseDate('来月15', baseDate)).toBe('2026-09-15');
    });

    test('今月20日', () => {
      expect(parseJapaneseDate('今月20日', baseDate)).toBe('2026-08-20');
    });
  });

  describe('無効な入力', () => {
    test('空文字列', () => {
      expect(parseJapaneseDate('', baseDate)).toBeNull();
    });

    test('不明な文字列', () => {
      expect(parseJapaneseDate('適当な文字列', baseDate)).toBeNull();
    });

    test('存在しない日付', () => {
      expect(parseJapaneseDate('2026/02/30', baseDate)).toBeNull();
    });
  });
});

describe('extractDateFromText', () => {
  const baseDate = new Date('2026-08-26T12:00:00');

  test('文中から日付を抽出', () => {
    expect(extractDateFromText('明日の宿題をやる', baseDate)).toBe('2026-08-27');
    expect(extractDateFromText('来週金曜までにレポート', baseDate)).toBe('2026-09-04');
    expect(extractDateFromText('9/15 に提出', baseDate)).toBe('2026-09-15');
  });

  test('複数の日付表現がある場合は最初のもの', () => {
    expect(extractDateFromText('明日と明後日', baseDate)).toBe('2026-08-27');
  });

  test('日付表現がない場合', () => {
    expect(extractDateFromText('数学の宿題', baseDate)).toBeNull();
  });
});

describe('extractFirstDate', () => {
  const baseDate = new Date('2026-08-26T12:00:00');

  test('配列から最初の有効な日付を返す', () => {
    expect(extractFirstDate(['不明', '明日', '来週'], baseDate)).toBe('2026-08-27');
  });

  test('すべて無効な場合', () => {
    expect(extractFirstDate(['aaa', 'bbb'], baseDate)).toBeNull();
  });

  test('空配列', () => {
    expect(extractFirstDate([], baseDate)).toBeNull();
  });
});
