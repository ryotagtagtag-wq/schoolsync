import { updatePassword } from '@/actions/settings';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await updatePassword(body);
    return Response.json(result);
  } catch (error) {
    console.error('settings/password error:', error);
    return Response.json({ success: false, error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}