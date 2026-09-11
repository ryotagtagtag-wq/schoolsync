import { auth } from '@/auth';
import { getPlayerProfile } from '@/actions/player';
import { getAssignments } from '@/actions/assignments';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import PlayGameClient from './PlayGameClient';

export const metadata: Metadata = {
  title: 'Questra - 見習い賢者の冒険録',
  description: '学校課題管理をRPGで楽しく！冒険しながらタスクをクリアしよう',
};

export default async function PlayPage() {
  const session = await auth();
  
  // 未認証の場合はログインページへリダイレクト
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/play');
  }

  // プレイヤープロフィール取得
  let playerData = null;
  try {
    const profileResult = await getPlayerProfile();
    if (profileResult.success) {
      playerData = profileResult.data;
    } else {
      console.warn('getPlayerProfile failed:', profileResult.error);
    }
  } catch (error) {
    console.error('getPlayerProfile threw:', error);
  }

  // 未完了の課題を取得してモンスターとして表示（期限・ステータス込み）
  let assignments = [];
  try {
    const assignmentsResult = await getAssignments({ status: 'pending' });
    if (assignmentsResult.success && assignmentsResult.data) {
      assignments = assignmentsResult.data.map((a) => ({
        id: a.id,
        subject: a.subject || '未知',
        priority: a.priority || 1,
        title: a.title || '',
        status: a.status || 'pending',
        dueDate: a.dueDate,
      }));
    } else {
      console.warn('getAssignments failed:', assignmentsResult.error);
    }
  } catch (error) {
    console.error('getAssignments threw:', error);
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <PlayGameClient playerData={playerData} assignments={assignments} />
    </div>
  );
}
