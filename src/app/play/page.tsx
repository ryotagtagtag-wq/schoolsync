'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PlayGameClient from './PlayGameClient';

export default function PlayPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [playerData, setPlayerData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/play');
      return;
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      // Fetch player profile
      const profileRes = await fetch('/api/player/profile/full');
      const profileData = await profileRes.json();
      if (profileData.success) {
        setPlayerData(profileData.data);
      }

      // Fetch assignments
      const assignmentsRes = await fetch('/api/assignments?status=pending');
      const assignmentsData = await assignmentsRes.json();
      if (assignmentsData.success && assignmentsData.data) {
        setAssignments(assignmentsData.data.map((a: any) => ({
          id: a.id,
          subject: a.subject || '未知',
          priority: a.priority || 1,
          title: a.title || '',
          status: a.status || 'pending',
          dueDate: a.dueDate
        })));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6B46C1] border-t-transparent mx-auto mb-4" />
          <p className="text-white text-lg">Loading Questra...</p>
          <p className="text-gray-400 text-sm mt-2">冒険の準備をしています...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <PlayGameClient playerData={playerData} assignments={assignments} />
    </div>
  );
}
