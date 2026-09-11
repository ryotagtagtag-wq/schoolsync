import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleTask,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle);
      setNewTaskTitle('');
      setIsAdding(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setNewTaskTitle('');
      setIsAdding(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="card p-4 animate-pop-in">
        {isAdding ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="新しいクエストを入力..."
              className="input-field flex-1"
              autoComplete="off"
              aria-label="新しいクエストのタイトル"
            />
            <button
              type="submit"
              className="btn-primary whitespace-nowrap"
              aria-label="クエストを追加"
            >
              追加
            </button>
            <button
              type="button"
              onClick={() => { setNewTaskTitle(''); setIsAdding(false); }}
              className="btn-secondary whitespace-nowrap"
              aria-label="キャンセル"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full btn-secondary text-left justify-start gap-2"
            aria-label="新しいクエストを追加"
          >
            <span className="text-2xl">➕</span>
            <span>新しいクエストを追加する</span>
          </button>
        )}
      </form>
      
      {tasks.length === 0 && !isAdding ? (
        <div className="card p-8 text-center text-forest-green/60">
          <p className="text-lg mb-2">📝 まだクエストがないよ</p>
          <p className="text-sm">上のボタンから新しいクエストを追加してね！</p>
        </div>
      ) : (
        <ul className="space-y-2" role="list" aria-label="クエスト一覧">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

const TaskItem: React.FC<{
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}> = ({ task, onToggle, onDelete }) => {
  return (
    <li className="card p-4 animate-pop-in flex items-center gap-3">
      <button
        onClick={onToggle}
        className={`relative w-6 h-6 rounded-lg border-2 flex-shrink-0 transition-all duration-200 ${
          task.completed
            ? 'bg-forest-green border-forest-green'
            : 'border-forest-green/30 hover:border-forest-green/60'
        }`}
        aria-checked={task.completed}
        aria-label={task.completed ? '未完了に戻す' : '完了にする'}
      >
        {task.completed && (
          <svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-soft-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      
      <span
        className={`flex-1 text-left break-words transition-colors ${
          task.completed ? 'line-through text-forest-green/40' : 'text-text-dark'
        }`}
      >
        {task.title}
      </span>
      
      <button
        onClick={onDelete}
        className="p-2 rounded-lg text-forest-green/40 hover:text-forest-green hover:bg-forest-green/10 transition-colors"
        aria-label={`「${task.title}」を削除`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
};
