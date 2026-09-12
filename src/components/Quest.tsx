import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskCategory, TASK_CATEGORIES as IMPORTED_TASK_CATEGORIES } from '../types';

const TASK_CATEGORIES = IMPORTED_TASK_CATEGORIES;

interface QuestProps {
  tasks: Task[];
  onAddTask: (title: string, category?: TaskCategory, estimatedMinutes?: number) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  dailyStats: { questsCreated: number; questsCompleted: number; streakDays: number };
  createError: string | null;
  completeError: string | null;
  DAILY_QUEST_CREATE_LIMIT: number;
  DAILY_QUEST_COMPLETE_LIMIT: number;
  MIN_COMPLETION_MINUTES: number;
}

export const Quest: React.FC<QuestProps> = ({
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleTask,
  dailyStats,
  createError,
  completeError,
  DAILY_QUEST_CREATE_LIMIT,
  DAILY_QUEST_COMPLETE_LIMIT,
  MIN_COMPLETION_MINUTES,
}) => {
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('custom');
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  
  const titleInputRef = useRef<HTMLInputElement>(null);

  const filteredTasks = activeCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === activeCategory);

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const categoryColors: Record<TaskCategory, string> = {
    study: 'bg-pastel-blue', exercise: 'bg-pastel-green', household: 'bg-pastel-orange',
    hobby: 'bg-pastel-purple', health: 'bg-pastel-pink', social: 'bg-pastel-teal', custom: 'bg-forest-green/20',
  };

  useEffect(() => {
    if (showCreateModal && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showCreateModal]);

  const handleCreate = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle, selectedCategory === 'custom' ? undefined : selectedCategory, estimatedMinutes);
    setShowCreateModal(false);
    setNewTaskTitle('');
    setSelectedCategory('custom');
    setEstimatedMinutes(15);
    
  };

  const handleTemplateSelect = (template: string, category: TaskCategory) => {
    setNewTaskTitle(template);
    
    setSelectedCategory(category);
  };

  

  useEffect(() => {
    if (showCreateModal && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showCreateModal]);

  return (
    <div className="space-y-6 pb-24">
      {/* ヘッダー統計 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center animate-pop-in">
          <div className="text-2xl font-bold text-forest-green">{dailyStats.questsCompleted}/{DAILY_QUEST_COMPLETE_LIMIT}</div>
          <div className="text-xs text-forest-green/60">今日の完了</div>
        </div>
        <div className="card p-4 text-center animate-pop-in">
          <div className="text-2xl font-bold text-forest-green">{dailyStats.questsCreated}/{DAILY_QUEST_CREATE_LIMIT}</div>
          <div className="text-xs text-forest-green/60">今日の作成</div>
        </div>
        <div className="card p-4 text-center animate-pop-in">
          <div className="text-2xl font-bold text-forest-green">{dailyStats.streakDays}日</div>
          <div className="text-xs text-forest-green/60">連続達成</div>
        </div>
      </div>

      {/* エラー表示 */}
      {(createError || completeError) && (
        <div className="card p-3 bg-pastel-red/10 border-pastel-red/30 animate-shake">
          <p className="text-pastel-red text-sm text-center">{createError || completeError}</p>
        </div>
      )}

      {/* クイック追加: テンプレート */}
      <section aria-labelledby="templates-heading">
        <h2 id="templates-heading" className="text-xl font-bold text-forest-green mb-3 flex items-center gap-2">
          <span aria-hidden="true">⚡</span>
          よくあるクエスト（タップで即追加）
        </h2>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {TASK_CATEGORIES.flatMap(cat => cat.templates.map((tmpl, i) => (
            <button
              key={`${cat.id}-${i}`}
              onClick={() => onAddTask(tmpl, cat.id as TaskCategory, 15)}
              className="w-full card p-3 text-left animate-pop-in hover:bg-forest-green/5 transition-colors"
              disabled={dailyStats.questsCreated >= DAILY_QUEST_CREATE_LIMIT}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.emoji}</span>
                <span className="flex-1 text-forest-green font-medium text-sm">{tmpl}</span>
                <span className="text-xs text-forest-green/50 bg-forest-green/10 px-2 py-0.5 rounded">{cat.label}</span>
              </div>
            </button>
          )))}
        </div>
      </section>

      {/* カスタム作成ボタン */}
      <button
        onClick={() => { setSelectedCategory('custom'); setShowCreateModal(true); }}
        disabled={dailyStats.questsCreated >= DAILY_QUEST_CREATE_LIMIT}
        className="w-full btn-primary py-3 animate-pop-in"
      >
        {dailyStats.questsCreated >= DAILY_QUEST_CREATE_LIMIT ? '⚠️ 今日の作成上限に達しました' : '✨ 自分でクエストを作る'}
      </button>

      {/* カテゴリフィルタ */}
      <div className="flex gap-2 overflow-x-auto pb-2" role="tablist">
        <button
          onClick={() => setActiveCategory('all')}
          className={`tab-filter-btn ${activeCategory === 'all' ? 'active' : ''} whitespace-nowrap`}
          role="tab" aria-selected={activeCategory === 'all'}
        >
          すべて
        </button>
        {TASK_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as TaskCategory)}
            className={`tab-filter-btn ${activeCategory === cat.id ? 'active' : ''} whitespace-nowrap`}
            role="tab" aria-selected={activeCategory === cat.id}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* 進行中クエスト */}
      <section aria-labelledby="pending-heading">
        <h2 id="pending-heading" className="text-xl font-bold text-forest-green mb-3 flex items-center gap-2">
          <span aria-hidden="true">📝</span>
          進行中のクエスト ({pendingTasks.length})
        </h2>
        {pendingTasks.length === 0 ? (
          <div className="card p-8 text-center animate-pop-in">
            <span className="text-4xl mb-2 block">📭</span>
            <p className="text-forest-green/60">クエストがありません。上のテンプレートから追加しよう！</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map(task => (
              <QuestTaskCard
                key={task.id}
                task={task}
                onToggle={() => onToggleTask(task.id)}
                onDelete={() => onDeleteTask(task.id)}
                categoryColors={categoryColors}
              />
            ))}
          </div>
        )}
      </section>

      {/* 完了済みクエスト */}
      <section aria-labelledby="completed-heading">
        <h2 id="completed-heading" className="text-xl font-bold text-forest-green mb-3 flex items-center gap-2">
          <span aria-hidden="true">✅</span>
          今完了したクエスト ({completedTasks.length})
        </h2>
        {completedTasks.length === 0 ? (
          <p className="text-forest-green/50 text-center py-4">まだ完了したクエストはありません</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {completedTasks.map(task => (
              <QuestTaskCard
                key={task.id}
                task={task}
                onToggle={() => onToggleTask(task.id)}
                onDelete={() => onDeleteTask(task.id)}
                categoryColors={categoryColors}
                completed
              />
            ))}
          </div>
        )}
      </section>

      {/* ルール説明 */}
      <div className="card p-4 bg-forest-green/5 border-forest-green/20">
        <h3 className="font-bold text-forest-green mb-2 flex items-center gap-1">
          <span aria-hidden="true">📋</span> みんなが楽しく続けられるルール
        </h3>
        <ul className="text-sm text-forest-green/80 space-y-1">
          <li>• 1日 <strong>{DAILY_QUEST_CREATE_LIMIT}個</strong> までクエスト作成可能</li>
          <li>• 1日 <strong>{DAILY_QUEST_COMPLETE_LIMIT}個</strong> まで報酬付きで完了可能</li>
          <li>• 作成から <strong>{MIN_COMPLETION_MINUTES}分以上</strong> 経ってから完了すると満額報酬（未満だと30%）</li>
          <li>• 作成直後の削除は <strong>10分</strong> 待つ必要あり</li>
          <li>• 毎日コツコツ続けると <strong>連続ボーナス</strong> で報酬アップ！</li>
        </ul>
      </div>

      {/* カスタム作成モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl p-6 m-4 max-w-sm animate-pop-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-forest-green mb-4 text-center">新しいクエストを作る</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-forest-green/70 mb-1">カテゴリ</label>
              <div className="grid grid-cols-4 gap-2">
                {TASK_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setSelectedCategory(cat.id);  }}
                    className={`p-2 rounded-lg text-center ${selectedCategory === cat.id ? 'ring-2 ring-forest-green bg-forest-green/10' : 'bg-forest-green/5'}`}
                  >
                    <div className="text-xl">{cat.emoji}</div>
                    <div className="text-xs text-forest-green">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-forest-green/70 mb-1">クエスト名</label>
              <input
                ref={titleInputRef}
                type="text"
                value={newTaskTitle}
                onChange={e => { setNewTaskTitle(e.target.value);  }}
                placeholder="例：英単語20個覚える"
                className="w-full p-3 border border-forest-green/30 rounded-lg text-forest-green placeholder-forest-green/40 mb-4"
                maxLength={30}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              {TASK_CATEGORIES.find(c => c.id === selectedCategory)?.templates.length && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-forest-green/60">テンプレートから選ぶ：</p>
                  {TASK_CATEGORIES.find(c => c.id === selectedCategory)?.templates.map((tmpl, i) => (
                    <button key={i} type="button" onClick={() => handleTemplateSelect(tmpl, selectedCategory)} className="w-full text-left p-2 bg-forest-green/5 rounded-lg text-sm text-forest-green hover:bg-forest-green/10">
                      {tmpl}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm text-forest-green/70 mb-1">予想所要時間（分）</label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Math.max(1, Math.min(180, parseInt(e.target.value) || 15)))}
                min={1} max={180}
                className="w-full p-3 border border-forest-green/30 rounded-lg text-forest-green"
              />
              <p className="text-xs text-forest-green/50 mt-1">{MIN_COMPLETION_MINUTES}分以上で満額報酬</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setShowCreateModal(false); setNewTaskTitle(''); }} className="flex-1 btn-secondary">キャンセル</button>
              <button onClick={handleCreate} disabled={!newTaskTitle.trim()} className="flex-1 btn-primary">追加する ✨</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// タスクカードコンポーネント
interface QuestTaskCardProps {
  task: any;
  onToggle: () => void;
  onDelete: () => void;
  categoryColors: Record<string, string>;
  completed?: boolean;
}

const QuestTaskCard: React.FC<QuestTaskCardProps> = ({ task, onToggle, onDelete, categoryColors, completed }) => {
  const cat = task.category || 'custom';
  const catInfo = TASK_CATEGORIES.find(c => c.id === cat);
  
  
  return (
    <article className={`card p-3 animate-pop-in flex items-center gap-3 ${completed ? 'opacity-70' : ''}`}>
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded border-2 flex-shrink-0 ${completed ? 'bg-forest-green border-forest-green' : 'border-forest-green/30'}`}
        aria-label={completed ? '未完了に戻す' : '完了する'}
      >
        {completed && <span className="text-white text-xs flex items-center justify-center">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-forest-green truncate">{task.title}</span>
          {task.category && (
            <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[task.category]} text-forest-green`}>
              {catInfo?.emoji} {catInfo?.label}
            </span>
          )}
          {task.isTemplate && <span className="text-xs text-forest-green/50">📋 テンプレート</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-forest-green/60 mt-0.5">
          {task.estimatedMinutes && <span>⏱️ {task.estimatedMinutes}分予定</span>}
          {task.completedAt && <span>✅ {Math.round((Date.now() - task.completedAt) / 60000)}分前に完了</span>}
        </div>
      </div>
      <button onClick={onDelete} className="text-pastel-red/70 hover:text-pastel-red p-1" aria-label="削除">🗑️</button>
    </article>
  );
};
