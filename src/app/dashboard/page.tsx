import { auth } from '@/auth';
import { getAssignmentStats } from '@/actions/assignments';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Bell, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/Header';
import { ScheduleWidget } from '@/components/ScheduleWidget';
import { getScheduledTasks } from '@/actions/schedule';

export default async function DashboardPage() {
  const session = await auth();
  const statsResult = await getAssignmentStats();
  const stats = statsResult.success ? statsResult.data : { pending: 0, in_progress: 0, completed: 0, overdue: 0 };
  
  // スケジュール推奨を取得
  const scheduleResult = await getScheduledTasks();
  const scheduleData = scheduleResult.success ? scheduleResult.data : null;

  const statsData = [
    { label: '未着手', count: stats.pending, icon: Clock, color: 'text-yellow-500' },
    { label: '進行中', count: stats.in_progress, icon: AlertTriangle, color: 'text-blue-500' },
    { label: '完了', count: stats.completed, icon: CheckCircle, color: 'text-green-500' },
    { label: '期限切れ', count: stats.overdue, icon: AlertTriangle, color: 'text-red-500' },
  ];

  const quickActions = [
    { href: '/dashboard/assignments/new', label: '課題を追加', icon: Plus },
    { href: '/calendar', label: 'カレンダーを見る', icon: Calendar },
    { href: '/groups', label: 'グループ管理', icon: Users },
    { href: '/notifications', label: '通知を見る', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header user={session?.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground mt-1">課題の進捗を一覧で確認できます</p>
        </div>

        {/* 統計カード */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsData.map((stat) => (
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

        {/* クイックアクション */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex flex-col items-center py-6">
                  <action.icon className="h-10 w-10 text-primary mb-2" />
                  <span className="text-center font-medium">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* スケジュールウィジェット */}
        <ScheduleWidget initialData={scheduleData} />
      </main>
    </div>
  );
}
