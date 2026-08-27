import { updateProfile } from '@/actions/settings';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await updateProfile(body);
    return Response.json(result);
  } catch (error) {
    console.error('settings/profile error:', error);
    return Response.json({ success: false, error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}