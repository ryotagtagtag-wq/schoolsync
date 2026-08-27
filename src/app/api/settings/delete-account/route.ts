import { deleteAccount } from '@/actions/settings';

export async function POST() {
  try {
    const result = await deleteAccount();
    return Response.json(result);
  } catch (error) {
    console.error('settings/delete-account error:', error);
    return Response.json({ success: false, error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}