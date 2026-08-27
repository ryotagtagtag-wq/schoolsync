import { getProfilePageData } from '@/actions/player';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await getProfilePageData();
  return NextResponse.json(result);
}
