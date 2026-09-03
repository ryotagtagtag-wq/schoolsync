/**
 * NaturalLanguageInput - 自然言語課題入力コンポーネント
 * 5状態ステートマシン: idle → loading → preview → (submitting | error) → idle
 */

'use client';

import { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import { Loader2, CheckCircle, AlertCircle, X, ArrowRight, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { ParsedAssignment, NLInputResult, NLInputState, PreviewData } from '@/lib/nlp/types';

interface NaturalLanguageInputProps {
  onSubmit: (data: ParsedAssignment) => Promise<void>;
  onCancel?: () => void;
}

export function NaturalLanguageInput({ onSubmit, onCancel }: NaturalLanguageInputProps) {
  // 5状態ステートマシン
  const [state, setState] = useState<NLInputState>('idle');
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 入力ハンドラ
  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (state === 'error') {
      setError(null);
      setState('idle');
    }
  }, [state]);

  // 解析実行
  const handleParse = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      toast.error('入力してください');
      return;
    }

    // クライアント側バリデーション
    if (trimmedInput.length > 5000) {
      toast.error('入力が長すぎます（最大5000文字）');
      return;
    }

    // 制御文字チェック
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmedInput)) {
      toast.error('無効な文字が含まれています');
      return;
    }

    setState('loading');
    setError(null);

    try {
      const response = await fetch('/api/v1/ai/parse-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmedInput }),
      });

      const result: NLInputResult = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || '解析に失敗しました');
      }

      setPreview({
        parsed: result.data,
        originalInput: trimmedInput,
        source: result.source,
      });
      setState('preview');
    } catch (err) {
      const message = err instanceof Error ? err.message : '解析に失敗しました';
      setError(message);
      setState('error');
      toast.error(message);
    }
  }, [input]);

  // 確定送信
  const handleConfirm = useCallback(async () => {
    if (!preview) return;

    setIsSubmitting(true);
    setState('submitting');
    
    try {
      await onSubmit(preview.parsed);
      toast.success('課題を作成しました');
      setState('idle');
      setInput('');
      setPreview(null);
      setIsSubmitting(false);
      onCancel?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : '作成に失敗しました';
      setError(message);
      setState('error');
      setIsSubmitting(false);
      toast.error(message);
    }
  }, [preview, onSubmit, onCancel]);

  // キャンセル/やり直し
  const handleRetry = useCallback(() => {
    setState('idle');
    setPreview(null);
    setError(null);
  }, []);

  const handleBack = useCallback(() => {
    setState('idle');
    setPreview(null);
  }, []);

  // 優先度バッジ
  const PriorityBadge = ({ priority }: { priority: ParsedAssignment['priority'] }) => {
    const labels = { low: '低', medium: '中', high: '高' };
    const colors = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
        優先度: {labels[priority]}
      </span>
    );
  };

  // ソースバッジ
  const SourceBadge = ({ source }: { source: 'llm' | 'regex' }) => (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
      {source === 'llm' ? <Zap className="mr-1 h-3 w-3" /> : ''}
      {source === 'llm' ? 'AI解析' : 'パターン解析'}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* 入力エリア */}
      <form onSubmit={handleParse} className="space-y-3 animate-fade-in">
        <label htmlFor="nl-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          自然言語で入力
        </label>
        <textarea
          id="nl-input"
          value={input}
          onChange={handleInputChange}
          placeholder="例: 明後日までに数学の微分積分の宿題をやる（高優先度）"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
          disabled={state !== 'idle' && state !== 'error'}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={state === 'loading' || !input.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                解析中...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                解析してプレビュー
              </>
            )}
          </button>
          {onCancel && state !== 'loading' && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {/* エラー表示 */}
      {state === 'error' && error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-slide-in">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button
            onClick={handleRetry}
            className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
          >
            やり直す
          </button>
        </div>
      )}

      {/* プレビューカード */}
      {state === 'preview' && preview && (
        <div className="animate-slide-in p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {preview.parsed.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                元の入力: {preview.originalInput}
              </p>
            </div>
            <SourceBadge source={preview.source} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1 animate-slide-in stagger-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">教科</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{preview.parsed.subject}</p>
            </div>
            <div className="space-y-1 animate-slide-in stagger-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">締切</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{preview.parsed.dueDate}</p>
            </div>
            <div className="space-y-1 sm:col-span-2 animate-slide-in stagger-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">優先度</p>
              <PriorityBadge priority={preview.parsed.priority} />
            </div>
          </div>

          {preview.parsed.description && preview.parsed.description !== preview.originalInput && (
            <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700 animate-slide-in stagger-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">説明</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{preview.parsed.description}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 animate-slide-in stagger-5">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              修正する
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  この内容で作成
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 入力例ヒント（idle 時のみ） */}
      {state === 'idle' && (
        <details className="group animate-fade-in">
          <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
            入力例を見る
            <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
          </summary>
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <p>「明日の数学の宿題（高優先度）」</p>
            <p>「来週金曜までに英語のレポート」</p>
            <p>「9/15 に物理の課題を提出」</p>
            <p>「3日後に化学の実験レポート（低優先度）」</p>
          </div>
        </details>
      )}
    </div>
  );
}
