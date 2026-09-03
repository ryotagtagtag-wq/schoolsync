/**
 * AI Schedule Recommendation API Route (Deprecated - Use /api/v1/ai/schedule-recommendation)
 * スケジューラ用 LLM API - パーソナライズド学習推奨生成
 * 認証必須
 * レート制限: 5 req/min per user
 * @deprecated Use /api/v1/ai/schedule-recommendation instead
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Redirect to v1 endpoint with deprecation warning
  const url = new URL(request.url);
  url.pathname = url.pathname.replace('/api/ai/', '/api/v1/ai/');
  
  console.warn('[DEPRECATION] /api/ai/schedule-recommendation is deprecated. Use /api/v1/ai/schedule-recommendation instead.');
  
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
      'X-Deprecation-Warning': 'This endpoint is deprecated. Please use /api/v1/ai/schedule-recommendation',
    },
  });
}
