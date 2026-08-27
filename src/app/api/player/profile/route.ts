import { NextResponse } from 'next/server';
import { getPlayerProfile } from '@/actions/player';

export async function GET() {
  const result = await getPlayerProfile();
  return NextResponse.json(result);
}
