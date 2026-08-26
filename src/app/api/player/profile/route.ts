import { NextResponse } from 'next/server';
import { getPlayerProfile } from '@/actions/player';

export async function GET() {
  const result = await getPlayerProfile();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json(result.data);
}
