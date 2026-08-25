import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGroupMembers } from '@/actions/groups';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = await params;
    const result = await getGroupMembers(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ members: result.data, userRole: result.userRole });
  } catch (error) {
    console.error('Get group members API error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
