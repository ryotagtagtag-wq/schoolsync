'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Bell, LogOut, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DashboardPage() {
  const { data: session } = useSession();

  const stats = [
    { label: '未着手', count: 3, icon: Clock, color: 'text-yellow-500' },
    { label: '進行中', count: 2, icon: AlertTriangle, color: 'text-blue-500' },
    { label: '完了', count: 5, icon: CheckCircle, color: 'text-green-500' },
    { label: '期限切れ', count: 1, icon: AlertTriangle, color: 'text-red-500' },
  ];

  const quickActions = [
    { href: '/dashboard/assignments/new', label: '課題を追加', icon: Plus },
    { href: '/calendar', label: 'カレンダーを見る', icon: Calendar },
    { href: '/groups', label: 'グループ管理', icon: Users },
    { href: '/notifications', label: '通知を見る', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              SchoolSync
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground hidden sm:block">{session?.user?.name || session?.user?.email}</span>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground mt-1">課題の進捗を一覧で確認できます</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.count}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex flex-col items-center py-6">
                  <action.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-center">{action.label}</CardTitle>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
