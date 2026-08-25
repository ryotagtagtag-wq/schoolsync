import { Metadata } from 'next';
import { auth } from '@/auth';
import { db } from '@/db';
import { assignments } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Edit, Trash2, Filter, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export const metadata: Metadata = {
  title: '課題一覧 - SchoolSync',
};

async function getAssignments() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db
    .select()
    .from(assignments)
    .where(eq(assignments.userId, session.user.id))
    .orderBy(desc(assignments.dueDate));
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  };
  const labels: Record<string, string> = {
    pending: '未着手',
    in_progress: '進行中',
    completed: '完了',
  };
  return <Badge variant="outline" className={variants[status] || 'bg-gray-100 text-gray-800'}>{labels[status] || status}</Badge>;
}

function PriorityBadge({ priority }: { priority: number }) {
  const variants = {
    1: 'bg-gray-100 text-gray-800',
    2: 'bg-orange-100 text-orange-800',
    3: 'bg-red-100 text-red-800',
  };
  const labels = { 1: '低', 2: '中', 3: '高' };
  return <Badge variant="outline" className={variants[priority as keyof typeof variants] || variants[1]}>{labels[priority as keyof typeof labels] || '低'}</Badge>;
}

export default async function AssignmentsPage() {
  const session = await auth();
  const assignmentsList = await getAssignments();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold">課題一覧</h1>
              <p className="text-sm text-gray-600">{assignmentsList.length} 件の課題</p>
            </div>
            <Link href="/dashboard/assignments/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新規作成
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {assignmentsList.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900">課題がありません</h2>
            <p className="text-gray-500 mt-1">最初の課題を作成してみましょう</p>
            <Link href="/dashboard/assignments/new" className="mt-4 inline-block">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                課題を作成
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assignmentsList.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold truncate">{assignment.title}</h3>
                        <StatusBadge status={assignment.status} />
                        <PriorityBadge priority={assignment.priority} />
                      </div>
                      {assignment.subject && (
                        <p className="text-sm text-gray-500 mb-1">{assignment.subject}</p>
                      )}
                      {assignment.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          期限: {format(new Date(assignment.dueDate), 'yyyy/MM/dd (EEE)', { locale: ja })}
                        </span>
                        {assignment.completedAt && (
                          <span className="flex items-center gap-1 text-green-600">
                            完了: {format(new Date(assignment.completedAt), 'yyyy/MM/dd', { locale: ja })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/assignments/${assignment.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <form action={async () => {
                        'use server';
                        const { deleteAssignment } = await import('@/actions/assignments');
                        await deleteAssignment(assignment.id);
                      }}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
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
