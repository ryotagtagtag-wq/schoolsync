/**
 * AI Parse Assignment API Route (Deprecated - Use /api/v1/ai/parse-assignment)
 * 自然言語入力を構造化データに変換
 * 認証必須（既存 assignments/route.ts と同パターン）
 * レート制限: 10 req/min per user
 * @deprecated Use /api/v1/ai/parse-assignment instead
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Redirect to v1 endpoint with deprecation warning
  const url = new URL(request.url);
  url.pathname = url.pathname.replace('/api/ai/', '/api/v1/ai/');
  
  console.warn('[DEPRECATION] /api/ai/parse-assignment is deprecated. Use /api/v1/ai/parse-assignment instead.');
  
  // Forward request to v1 endpoint
  const response = await fetch(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual',
  });
  
  const data = await response.json();
  
  return NextResponse.json(data, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'X-API-Version': 'v1',
      'X-Deprecation-Warning': 'This endpoint is deprecated. Please use /api/v1/ai/parse-assignment',
    },
  });
}
