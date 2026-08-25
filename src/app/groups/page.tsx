import { auth } from '@/auth';
import { getGroups } from '@/actions/groups';
import { GroupsClient } from './GroupsClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, ArrowRight } from 'lucide-react';

export default async function GroupsPage() {
  const session = await auth();
  const groupsResult = await getGroups();
  const groups = groupsResult.success ? groupsResult.data : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold">グループ</h1>
              <p className="text-sm text-muted-foreground">共有グループを管理</p>
            </div>
            <div className="flex gap-2">
              <GroupsClient />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-medium text-foreground">グループがありません</h2>
            <p className="text-muted-foreground mt-1">最初のグループを作成してみましょう</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map(({ group, role }) => (
              <Link key={group.id} href={`/groups/${group.id}`} className="text-decoration-none">
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{group.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{group.description || '説明なし'}</p>
                      </div>
                      <Badge variant="outline" className={role === 'owner' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                        {role === 'owner' ? '管理者' : 'メンバー'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
