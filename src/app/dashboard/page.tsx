import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  
  // ダッシュボードはゲーム画面へリダイレクト
  if (session) {
    redirect('/play');
  }
  
  redirect('/login');
}
