'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Bell, LogOut, Plus, CheckCircle, Clock, AlertTriangle, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
  user?: { name?: string | null; email?: string | null } | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            SchoolSync
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/profile" className="text-sm text-muted-foreground hidden sm:block hover:text-foreground transition-colors">
              {user?.name || user?.email}
            </Link>
            <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg" aria-label="設定">
              <Settings className="h-5 w-5" />
            </Link>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
