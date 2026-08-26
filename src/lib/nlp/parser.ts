/**
 * Unified Parser - LLM + フォールバック統合パーサー
 * NVIDIA Build API (GPT-OSS-120B) を使用し、失敗時は正規表現パーサーにフォールバック
 */

import OpenAI from 'openai';
import { regexParse, regexParseWithValidation } from './regexParser';
import type { ParsedAssignment, NLInputResult, ParseError, LLMParseRequest, LLMParseResponse } from './types';

// NVIDIA Build API クライアント（サーバーサイドのみで初期化）
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error('NVIDIA_API_KEY is not set');
    }
    openaiClient = new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey,
      // タイムアウト設定（10秒）
      timeout: 10000,
      maxRetries: 2,
    });
  }
  return openaiClient;
}

/**
 * システムプロンプト
 */
const SYSTEM_PROMPT_TEMPLATE = `あなたは課題管理アプリの自然言語パーサーです。ユーザーの日本語入力から構造化データを抽出してJSONで返してください。

出力形式（JSONのみ、余計なテキストは一切含めない）:
{
  "title": "課題のタイトル（簡潔に）",
  "subject": "教科名（数学/英語/国語/理科/社会/情報/物理/化学/生物/地学/世界史/日本史/地理/政治経済/倫理/プログラミング/アルゴリズム/データ構造 のいずれか）",
  "dueDate": "YYYY-MM-DD形式の締切日",
  "priority": "low|medium|high",
  "description": "元の入力文（省略可）"
}

ルール:
- 相対日付（明日、来週金曜日、3日後など）は基準日 {currentDate} から計算
- 教科が不明なら "数学" をデフォルトとする
- 優先度が不明なら "medium" をデフォルトとする
- タイトルは核心部分のみ（"数学の宿題" → "宿題" や "微分積分の問題集" → "微分積分の問題集"）
- 日付は必ず未来の日付とする（過去なら翌年/来月扱い）`;

/**
 * LLM で自然言語をパース
 * @param input ユーザー入力
 * @param currentDate 基準日（ISO 8601）
 * @returns パース結果
 */
export async function llmParse(input: string, currentDate: string): Promise<LLMParseResponse> {
  const client = getOpenAIClient();
  
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{currentDate}', currentDate);
  
  const response = await client.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ],
    temperature: 0.1,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });
  
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('LLM returned empty response');
  }
  
  const parsed = JSON.parse(content) as LLMParseResponse;
  
  // バリデーション
  if (!parsed.title || !parsed.subject || !parsed.dueDate || !parsed.priority) {
    throw new Error('LLM response missing required fields');
  }
  
  // 優先度の正規化
  const validPriorities = ['low', 'medium', 'high'] as const;
  if (!validPriorities.includes(parsed.priority)) {
    parsed.priority = 'medium';
  }
  
  // 日付形式の検証
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.dueDate)) {
    throw new Error('Invalid date format from LLM');
  }
  
  return parsed;
}

/**
 * 統合パース関数
 * LLM を試し、失敗時は正規表現パーサーにフォールバック
 * @param input ユーザー入力
 * @param currentDate 基準日（ISO 8601）
 * @returns NLInputResult（成功時は data、失敗時は error）
 */
export async function parseNaturalLanguage(
  input: string, 
  currentDate: string = new Date().toISOString().split('T')[0]
): Promise<NLInputResult> {
  // 入力検証
  if (!input || !input.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '入力が空です。',
        retryable: false,
      },
      source: 'regex',
    };
  }
  
  // 1. LLM パースを試行
  try {
    const llmResult = await llmParse(input, currentDate);
    
    return {
      success: true,
      data: {
        title: llmResult.title,
        subject: llmResult.subject,
        dueDate: llmResult.dueDate,
        priority: llmResult.priority,
        description: llmResult.description || input,
      },
      source: 'llm',
    };
  } catch (llmError) {
    // LLM エラーの詳細を解析
    const errorCode = categorizeLLMError(llmError);
    
    // 2. 正規表現フォールバック
    const regexResult = regexParseWithValidation(input, currentDate);
    
    if (regexResult.success) {
      return {
        success: true,
        data: regexResult.data,
        source: 'regex',
      };
    }
    
    // 3. 両方失敗 → エラー返却
    return {
      success: false,
      error: {
        code: errorCode,
        message: `解析に失敗しました: ${regexResult.error.message}`,
        details: {
          llmError: llmError instanceof Error ? llmError.message : String(llmError),
          regexError: regexResult.error,
        },
        retryable: errorCode === 'RATE_LIMITED' || errorCode === 'NETWORK_ERROR',
      },
      source: 'regex',
    };
  }
}

/**
 * LLM エラーを分類
 */
function categorizeLLMError(error: unknown): ParseError['code'] {
  if (error instanceof OpenAI.APIError) {
    switch (error.status) {
      case 401:
        return 'UNAUTHORIZED';
      case 429:
        return 'RATE_LIMITED';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'LLM_ERROR';
      default:
        return 'LLM_ERROR';
    }
  }
  
  if (error instanceof Error) {
    // ネットワークエラー判定
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return 'NETWORK_ERROR';
    }
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return 'RATE_LIMITED';
    }
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return 'UNAUTHORIZED';
    }
  }
  
  return 'LLM_ERROR';
}

/**
 * API Route 用のシンプルなパース関数（エラーを throw する版）
 */
export async function parseForAPI(
  input: string, 
  currentDate: string
): Promise<ParsedAssignment> {
  const result = await parseNaturalLanguage(input, currentDate);
  
  if (!result.success || !result.data) {
    const err = new Error(result.error?.message || 'Parse failed') as Error & { code?: string; statusCode?: number };
    err.code = result.error?.code;
    err.statusCode = result.error?.code === 'UNAUTHORIZED' ? 401 : 
                     result.error?.code === 'RATE_LIMITED' ? 429 : 500;
    throw err;
  }
  
  return result.data;
}
