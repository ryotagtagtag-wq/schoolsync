import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getNotifications, markAllAsRead } from '@/actions/notifications';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const read = searchParams.get('read');
    const filters = {
      read: read === 'true' ? true : read === 'false' ? false : undefined,
    };

    const result = await getNotifications(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Get notifications API error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'read-all') {
      const result = await markAllAsRead();
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '無効なアクションです' }, { status: 400 });
  } catch (error) {
    console.error('Notifications POST API error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
