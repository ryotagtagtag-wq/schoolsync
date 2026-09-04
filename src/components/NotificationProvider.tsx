'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Initial permission check - safe to set synchronously during mount
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications?read=false');
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0 && permission === 'granted') {
            new Notification(`${data.length} 件の未読通知があります`, {
              body: '通知ページで確認してください',
              icon: '/icon-192.png',
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, permission]);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm;
    }
    return 'denied';
  };

  // 通知許可ボタンは不要（ブラウザのプロンプトで十分）
  return (
    <div>
      {children}
    </div>
  );
}
