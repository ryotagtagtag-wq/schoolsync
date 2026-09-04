/**
 * Subject Dictionary - 教科辞書
 * 自然言語入力から教科を抽出するためのマッピング
 * 
 * 注意: すべての日付計算は JST (Asia/Tokyo) 基準で行う
 */

import type { SupportedSubject } from './types';

/**
 * 教科名のバリエーションマッピング
 * キー: ユーザーが入力しそうな表記
 * 値: 正規化された教科名 (SUPPORTED_SUBJECTS のいずれか)
 */
export const SUBJECT_VARIANTS: Record<string, SupportedSubject> = {
  // 主要教科
  '数学': '数学',
  'すうがく': '数学',
  'スウガク': '数学',
  'math': '数学',
  'マス': '数学',
  '数Ⅰ': '数学',
  '数Ⅱ': '数学',
  '数Ⅲ': '数学',
  '数A': '数学',
  '数B': '数学',
  '数C': '数学',

  '英語': '英語',
  'えいご': '英語',
  'エイゴ': '英語',
  'english': '英語',
  'eng': '英語',
  '英単語': '英語',
  '英文法': '英語',
  'リスニング': '英語',
  'リーディング': '英語',

  '国語': '国語',
  'こくご': '国語',
  'コクゴ': '国語',
  '現代文': '国語',
  '古文': '国語',
  '漢文': '国語',
  '現国': '国語',
  '古典': '国語',

  '理科': '理科',
  'りか': '理科',
  'リカ': '理科',
  'science': '理科',

  '社会': '社会',
  'しゃかい': '社会',
  'シャカイ': '社会',
  'history': '社会',
  'geography': '社会',
  'civics': '社会',

  '情報': '情報',
  'じょうほう': '情報',
  'ジョウホウ': '情報',
  'information': '情報',
  'プログラミング': '情報',
  'programming': '情報',
  'コーディング': '情報',
  'coding': '情報',

  // 理科詳細
  '物理': '物理',
  'ぶつり': '物理',
  'ブツリ': '物理',
  'physics': '物理',
  '物理基礎': '物理',
  '物理応用': '物理',

  '化学': '化学',
  'かがく': '化学',
  'カガク': '化学',
  'chemistry': '化学',
  '化学基礎': '化学',
  '化学応用': '化学',

  '生物': '生物',
  'せいぶつ': '生物',
  'セイブツ': '生物',
  'biology': '生物',
  '生物基礎': '生物',
  '生物応用': '生物',

  '地学': '地学',
  'ちがく': '地学',
  'チガク': '地学',
  'earth science': '地学',
  '地学基礎': '地学',
  '地学応用': '地学',

  // 社会詳細
  '世界史': '世界史',
  'せかいし': '世界史',
  'セカイシ': '世界史',
  'world history': '世界史',
  '世史': '世界史',

  '日本史': '日本史',
  'にほんし': '日本史',
  'ニホンシ': '日本史',
  'japanese history': '日本史',
  '日史': '日本史',

  '地理': '地理',
  'ちり': '地理',
  'チリ': '地理',
  '地理総合': '地理',
  '地理探究': '地理',

  '政治経済': '政治経済',
  'せいじけいざい': '政治経済',
  'セイジケイザイ': '政治経済',
  '政経': '政治経済',

  '倫理': '倫理',
  'りんり': '倫理',
  'リンリ': '倫理',
  'ethics': '倫理',

  // 情報詳細（主要教科で定義済みのためコメントアウト）
  // 'プログラミング': 'プログラミング',
  // 'programming': 'プログラミング',
  'アルゴリズム': 'アルゴリズム',
  'algorithm': 'アルゴリズム',
  'データ構造': 'データ構造',
  'data structure': 'データ構造',
};

/**
 * 教科名を正規化する
 * @param input ユーザー入力文字列
 * @returns 正規化された教科名、見つからない場合は undefined
 */
export function normalizeSubject(input: string): SupportedSubject | undefined {
  const normalized = input.trim().toLowerCase();
  
  // 完全一致を試す
  for (const [variant, subject] of Object.entries(SUBJECT_VARIANTS)) {
    if (variant.toLowerCase() === normalized) {
      return subject;
    }
  }
  
  // 部分一致を試す（長いキーワード優先）
  const sortedVariants = Object.keys(SUBJECT_VARIANTS).sort((a, b) => b.length - a.length);
  for (const variant of sortedVariants) {
    if (normalized.includes(variant.toLowerCase())) {
      return SUBJECT_VARIANTS[variant];
    }
  }
  
  return undefined;
}

/**
 * 文字列から教科を抽出する（複数候補を返す）
 * @param text 入力テキスト
 * @returns 見つかった教科の配列（重複なし、優先度順）
 */
export function extractSubjects(text: string): SupportedSubject[] {
  const found = new Set<SupportedSubject>();
  const lowerText = text.toLowerCase();
  
  // 長いキーワードから順にマッチング
  const sortedVariants = Object.keys(SUBJECT_VARIANTS).sort((a, b) => b.length - a.length);
  
  for (const variant of sortedVariants) {
    if (lowerText.includes(variant.toLowerCase())) {
      found.add(SUBJECT_VARIANTS[variant]);
    }
  }
  
  return Array.from(found);
}

/**
 * デフォルト教科を取得
 */
export function getDefaultSubject(): SupportedSubject {
  return '数学';
}
