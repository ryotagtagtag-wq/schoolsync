import { Metadata } from 'next';
import { auth } from '@/auth';
import { db } from '@/db';
import { assignments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Calendar } from '@/components/calendar/Calendar';
import { Assignment } from '@/db/schema';

export const metadata: Metadata = {
  title: 'カレンダー - SchoolSync',
};

async function getAssignments(): Promise<Assignment[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db
    .select()
    .from(assignments)
    .where(eq(assignments.userId, session.user.id))
    .orderBy(desc(assignments.dueDate));
}

export default async function CalendarPage() {
  const session = await auth();
  const assignmentsList = await getAssignments();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold">カレンダー</h1>
              <p className="text-sm text-gray-600">課題の期限をカレンダーで確認</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Calendar assignments={assignmentsList} />
      </main>
    </div>
  );
}
