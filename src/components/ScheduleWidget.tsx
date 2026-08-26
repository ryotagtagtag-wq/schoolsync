/**
 * ScheduleWidget - ダッシュボード用スケジュールウィジェット
 * 推奨順序、スコアバー、残り時間、優先度バッジを表示
 */

'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Clock, Flame, Target, Zap, Loader2 } from 'lucide-react';
import type { ScheduledTask, ScheduleRecommendation } from '@/lib/scheduler/types';

interface ScheduleWidgetProps {
  initialData?: ScheduleRecommendation | null;
}

export function ScheduleWidget({ initialData }: ScheduleWidgetProps) {
  const [data, setData] = useState<ScheduleRecommendation | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  const fetchSchedule = async () => {
    if (initialData) return; // 初期データがある場合はスキップ
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/schedule-recommendation');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '取得失敗');
      }
      
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スケジュール取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [initialData]);

  // 優先度バッジ
  const PriorityBadge = ({ priority }: { priority: ScheduledTask['priority'] }) => {
    const labels = { low: '低', medium: '中', high: '高' };
    const colors = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    const icons = {
      low: null,
      medium: <Target className="h-3 w-3" />,
      high: <Flame className="h-3 w-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
        {icons[priority]}
        {labels[priority]}
      </span>
    );
  };

  // スコアバー
  const ScoreBar = ({ score }: { score: number }) => {
    const percentage = Math.min(100, Math.max(0, score));
    const color = percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-blue-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-700 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
    );
  };

  // 残り時間表示
  const TimeRemaining = ({ dueDate }: { dueDate: string }) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="text-red-600 dark:text-red-400 font-medium">期限超過 {Math.abs(diffDays)}日</span>;
    }
    if (diffDays === 0) {
      return <span className="text-red-600 dark:text-red-400 font-medium animate-pulse">今日が期限</span>;
    }
    if (diffDays === 1) {
      return <span className="text-orange-600 dark:text-orange-400 font-medium">明日が期限</span>;
    }
    return <span className="text-gray-600 dark:text-gray-400">あと {diffDays} 日</span>;
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.tasks.length === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
        <Zap className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-gray-600 dark:text-gray-400">予定されている課題はありません</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">課題を追加してスケジュールを生成しましょう</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
      {/* ヘッダー */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">今日のおすすめスケジュール</h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {data.tasks.length}件・約{Math.round(data.totalEstimatedMinutes / 60 * 10) / 10}h・{data.totalPomodoroCount}ポモドーロ
        </span>
      </div>

      {/* タスクリスト */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {data.tasks.map((task, index) => (
          <div 
            key={task.id} 
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors animate-slide-in"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* 順位番号 */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-sm font-bold">
                {task.rank}
              </div>
              
              {/* タスク情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</h4>
                  <PriorityBadge priority={task.priority} />
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                      {task.subject}
                    </span>
                  </span>
                  <TimeRemaining dueDate={task.dueDate} />
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    約{task.estimatedMinutes}分
                  </span>
                </div>
                
                {/* スコアバー */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 max-w-xs">
                    <ScoreBar score={task.score} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{task.score}</span>
                </div>
                
                {/* 理由 */}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">{task.reason}</p>
              </div>
              
              {/* ポモドーロ表示 */}
              <div className="flex-shrink-0 flex items-center gap-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{task.recommendedPomodoro}</span>
                <span className="text-xs text-gray-400">ポモドーロ</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* サマリー */}
      {data.summary && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700 animate-slide-in">
          <p className="text-sm text-blue-800 dark:text-blue-300">{data.summary}</p>
        </div>
      )}
    </div>
  );
}
