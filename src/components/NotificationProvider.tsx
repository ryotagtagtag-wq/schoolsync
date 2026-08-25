'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
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

  return (
    <div>
      {children}
      <button
        onClick={requestPermission}
        className="fixed bottom-4 right-4 z-50 p-2 bg-primary text-primary-foreground rounded-full shadow-lg"
        title="通知許可をリクエスト"
      >
        {permission === 'granted' ? '🔔' : '🔕'}
      </button>
    </div>
  );
}
