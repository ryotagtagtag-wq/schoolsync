'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, Filter, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  createdAt: string;
  assignmentId: string | null;
  groupId: string | null;
}

const typeLabels: Record<string, string> = {
  deadline_approaching: '期限接近',
  deadline_today: '本日期限',
  deadline_passed: '期限切れ',
  group_invite: 'グループ招待',
  assignment_shared: '課題共有',
};

const typeColors: Record<string, string> = {
  deadline_approaching: 'bg-yellow-100 text-yellow-800',
  deadline_today: 'bg-blue-100 text-blue-800',
  deadline_passed: 'bg-red-100 text-red-800',
  group_invite: 'bg-green-100 text-green-800',
  assignment_shared: 'bg-purple-100 text-purple-800',
};

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('read', filter === 'read' ? 'true' : 'false');
      const res = await fetch(`/api/notifications?${params}`);
      const data = await res.json();
      setNotifications(data);
    } catch {
      toast.error('通知の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      toast.error('既読に失敗しました');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('全て既読にしました');
    } catch {
      toast.error('全て既読に失敗しました');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.read;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                通知
              </h1>
              <p className="text-sm text-gray-600">
                {notifications.filter(n => !n.read).length} 件の未読
              </p>
            </div>
            {notifications.some(n => !n.read) && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                全て既読
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6">
          {(['all', 'unread', 'read'] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'すべて' : f === 'unread' ? '未読' : '既読'}
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                {notifications.filter(n => f === 'all' ? true : f === 'unread' ? !n.read : n.read).length}
              </span>
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900">通知がありません</h2>
              <p className="text-gray-500 mt-1">
                {filter === 'unread' ? '未読の通知はありません' : '通知はありません'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} className={notification.read ? '' : 'border-primary/50 bg-primary/5'}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{notification.title}</h3>
                        <Badge variant="outline" className={typeColors[notification.type] || 'bg-gray-100 text-gray-800'}>
                          {typeLabels[notification.type] || notification.type}
                        </Badge>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-sm text-gray-600">{notification.message}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ja })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button variant="ghost" size="icon" onClick={() => handleMarkAsRead(notification.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
