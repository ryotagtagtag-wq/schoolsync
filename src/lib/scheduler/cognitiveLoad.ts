/**
 * Cognitive Load - 教科認知負荷定数と計算関数
 */

import type { SubjectCognitiveLoad, SchedulerConfig } from './types';

/**
 * 教科ごとの認知負荷定義
 * baseLoad: 1-10 (低いほど負荷が小さい)
 * deepWorkFactor: 1.0-2.0 (高いほど集中が必要)
 * contextSwitchCost: 0-1 (他教科からの切り替えコスト)
 */
export const SUBJECT_COGNITIVE_LOADS: SubjectCognitiveLoad[] = [
  { subject: '数学', baseLoad: 8, deepWorkFactor: 1.8, contextSwitchCost: 0.7 },
  { subject: '物理', baseLoad: 9, deepWorkFactor: 1.9, contextSwitchCost: 0.8 },
  { subject: '化学', baseLoad: 7, deepWorkFactor: 1.6, contextSwitchCost: 0.6 },
  { subject: '生物', baseLoad: 5, deepWorkFactor: 1.3, contextSwitchCost: 0.4 },
  { subject: '地学', baseLoad: 4, deepWorkFactor: 1.2, contextSwitchCost: 0.3 },
  { subject: '英語', baseLoad: 6, deepWorkFactor: 1.4, contextSwitchCost: 0.5 },
  { subject: '国語', baseLoad: 5, deepWorkFactor: 1.3, contextSwitchCost: 0.4 },
  { subject: '現代文', baseLoad: 5, deepWorkFactor: 1.3, contextSwitchCost: 0.4 },
  { subject: '古文', baseLoad: 6, deepWorkFactor: 1.5, contextSwitchCost: 0.5 },
  { subject: '漢文', baseLoad: 6, deepWorkFactor: 1.5, contextSwitchCost: 0.5 },
  { subject: '世界史', baseLoad: 4, deepWorkFactor: 1.2, contextSwitchCost: 0.3 },
  { subject: '日本史', baseLoad: 4, deepWorkFactor: 1.2, contextSwitchCost: 0.3 },
  { subject: '地理', baseLoad: 5, deepWorkFactor: 1.3, contextSwitchCost: 0.4 },
  { subject: '政治経済', baseLoad: 5, deepWorkFactor: 1.3, contextSwitchCost: 0.4 },
  { subject: '倫理', baseLoad: 4, deepWorkFactor: 1.2, contextSwitchCost: 0.3 },
  { subject: '情報', baseLoad: 7, deepWorkFactor: 1.6, contextSwitchCost: 0.6 },
  { subject: 'プログラミング', baseLoad: 8, deepWorkFactor: 1.8, contextSwitchCost: 0.7 },
  { subject: 'アルゴリズム', baseLoad: 9, deepWorkFactor: 1.9, contextSwitchCost: 0.8 },
  { subject: 'データ構造', baseLoad: 8, deepWorkFactor: 1.7, contextSwitchCost: 0.7 },
  { subject: '理科', baseLoad: 6, deepWorkFactor: 1.4, contextSwitchCost: 0.5 },
  { subject: '社会', baseLoad: 4, deepWorkFactor: 1.2, contextSwitchCost: 0.3 },
];

/**
 * 教科の認知負荷を取得
 * @param subject 教科名
 * @returns 認知負荷設定（見つからない場合はデフォルト）
 */
export function getSubjectCognitiveLoad(subject: string): SubjectCognitiveLoad {
  const found = SUBJECT_COGNITIVE_LOADS.find(s => s.subject === subject);
  if (found) return found;
  
  // デフォルト値（中程度の負荷）
  return { subject, baseLoad: 5, deepWorkFactor: 1.3, contextSwitchCost: 0.4 };
}

/**
 * 教科の実効認知負荷を計算
 * baseLoad × deepWorkFactor で総合負荷を算出
 * @param subject 教科名
 * @returns 実効認知負荷 (1-20 程度)
 */
export function calculateEffectiveCognitiveLoad(subject: string): number {
  const load = getSubjectCognitiveLoad(subject);
  return load.baseLoad * load.deepWorkFactor;
}

/**
 * 教科間のコンテキスト切り替えコストを計算
 * @param fromSubject 前の教科
 * @param toSubject 次の教科
 * @returns 切り替えコスト (0-1)
 */
export function calculateContextSwitchCost(fromSubject: string, toSubject: string): number {
  if (fromSubject === toSubject) return 0;
  
  const fromLoad = getSubjectCognitiveLoad(fromSubject);
  const toLoad = getSubjectCognitiveLoad(toSubject);
  
  // 両方の切り替えコストの平均
  return (fromLoad.contextSwitchCost + toLoad.contextSwitchCost) / 2;
}

/**
 * 設定に教科負荷をマージ
 * @param config ベース設定
 * @returns 教科負荷を含む完全な設定
 */
export function mergeSubjectLoads(config: SchedulerConfig): SchedulerConfig {
  return {
    ...config,
    subjectLoads: SUBJECT_COGNITIVE_LOADS,
  };
}
