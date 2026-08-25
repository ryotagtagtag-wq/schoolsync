import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assignments, notifications, users } from '@/db/schema';
import { eq, and, gte, lt, ne } from 'drizzle-orm';
import { createNotification } from '@/actions/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const pendingAssignments = await db
      .select({
        assignment: assignments,
        user: users,
      })
      .from(assignments)
      .innerJoin(users, eq(assignments.userId, users.id))
      .where(
        and(
          ne(assignments.status, 'completed'),
          gte(assignments.dueDate, now),
          lt(assignments.dueDate, threeDaysLater),
        )
      );

    let createdCount = 0;

    for (const { assignment, user } of pendingAssignments) {
      const dueDate = new Date(assignment.dueDate);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let type: 'deadline_approaching' | 'deadline_today' | 'deadline_passed';
      let title: string;
      let message: string;

      if (diffDays <= 0) {
        type = 'deadline_passed';
        title = '期限切れの課題があります';
        message = `「${assignment.title}」の期限が切れています`;
      } else if (diffDays === 1) {
        type = 'deadline_today';
        title = '明日期限の課題があります';
        message = `「${assignment.title}」は明日が期限です`;
      } else {
        type = 'deadline_approaching';
        title = '期限が近い課題があります';
        message = `「${assignment.title}」はあと ${diffDays} 日で期限です`;
      }

      const existingNotification = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, user.id),
            eq(notifications.assignmentId, assignment.id),
            eq(notifications.type, type),
          )
        )
        .limit(1);

      if (existingNotification.length === 0) {
        await createNotification({
          userId: user.id,
          type,
          title,
          message,
          assignmentId: assignment.id,
        });
        createdCount++;
      }
    }

    return NextResponse.json({ success: true, created: createdCount });
  } catch (error) {
    console.error('Cron deadline reminders error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
