import { auth } from '@/auth';
import { getAssignmentStats } from '@/actions/assignments';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Bell, Plus, CheckCircle, Clock, AlertTriangle, Zap, Trophy, Sparkles } from 'lucide-react';
import { Header } from '@/components/Header';
import { ScheduleWidget } from '@/components/ScheduleWidget';
import { getScheduledTasks } from '@/actions/schedule';
import { DashboardPlayer } from '@/components/game/DashboardPlayer';

export default async function DashboardPage() {
  const session = await auth();
  const statsResult = await getAssignmentStats();
  const stats = statsResult.success ? statsResult.data : { pending: 0, in_progress: 0, completed: 0, overdue: 0 };
  
  // スケジュール推奨を取得
  const scheduleResult = await getScheduledTasks();
  const scheduleData = scheduleResult.success ? scheduleResult.data : null;

  const statsData = [
    { label: '未着手', count: stats.pending, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: '進行中', count: stats.in_progress, icon: AlertTriangle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: '完了', count: stats.completed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: '期限切れ', count: stats.overdue, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const quickActions = [
    { href: '/dashboard/assignments/new', label: '課題を追加', icon: Plus, color: 'text-primary', bg: 'bg-primary/10' },
    { href: '/calendar', label: 'カレンダー', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { href: '/groups', label: 'グループ', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { href: '/notifications', label: '通知', icon: Bell, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const totalTasks = stats.pending + stats.in_progress + stats.completed + stats.overdue;
  const completionRate = totalTasks > 0 ? Math.round((stats.completed / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header user={session?.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                ダッシュボード
              </h1>
              <p className="text-muted-foreground mt-1">
                {session?.user?.name ? `${session.user.name}さん、` : ''}今日も賢者の書を綴ろう
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    完了率 {completionRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Enhanced */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 animate-slide-in" style={{ animationDelay: '100ms' }}>
          {statsData.map((stat, index) => (
            <Link key={stat.label} href="/dashboard/assignments" className="group">
              <Card className={`relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 ${stat.bg} border`}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-current opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: stat.color.replace('text-', '') }} />
                <CardContent className="relative flex items-center justify-between p-5">
                  <div className="z-10">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.count}</p>
                  </div>
                  <div className={`z-10 p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="h-8 w-8" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions - Enhanced */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 animate-slide-in" style={{ animationDelay: '200ms' }}>
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 group-hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-current opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: action.color.replace('text-', '') }} />
                <CardContent className="relative flex flex-col items-center py-6 px-4 z-10">
                  <div className={`p-3 rounded-xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-10 w-10" />
                  </div>
                  <span className="mt-3 text-center font-medium text-foreground group-hover:text-primary transition-colors">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* RPG Section - Enhanced */}
        <div className="mb-8 animate-slide-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              賢者の書
            </h2>
            <Link href="/profile" className="text-sm text-primary hover:underline flex items-center gap-1">
              詳細を見る
              <Zap className="h-4 w-4" />
            </Link>
          </div>
          <DashboardPlayer />
        </div>

        {/* Schedule Widget */}
        <div className="animate-slide-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-500" />
              今日のおすすめスケジュール
            </h2>
          </div>
          <ScheduleWidget initialData={scheduleData} />
        </div>
      </main>
    </div>
  );
}