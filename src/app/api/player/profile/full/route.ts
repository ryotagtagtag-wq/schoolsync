import { getProfilePageData } from '@/actions/player';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await getProfilePageData();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json(result.data);
}