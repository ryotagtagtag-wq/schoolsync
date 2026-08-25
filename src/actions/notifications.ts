'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('認証が必要です');
  return session.user.id;
}

export async function getNotifications(filters?: { read?: boolean; limit?: number }) {
  try {
    const userId = await getUserId();
    const conditions = [eq(notifications.userId, userId)];
    
    if (filters?.read !== undefined) {
      conditions.push(eq(notifications.read, filters.read));
    }

    const result = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(filters?.limit || 50);

    return { success: true as const, data: result };
  } catch (error) {
    console.error('Get notifications error:', error);
    return { success: false as const, error: '通知の取得に失敗しました' };
  }
}

export async function markAsRead(notificationId: string) {
  try {
    const userId = await getUserId();
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));

    revalidatePath('/notifications');
    return { success: true as const };
  } catch (error) {
    console.error('Mark as read error:', error);
    return { success: false as const, error: '既読に失敗しました' };
  }
}

export async function markAllAsRead() {
  try {
    const userId = await getUserId();
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    revalidatePath('/notifications');
    return { success: true as const };
  } catch (error) {
    console.error('Mark all as read error:', error);
    return { success: false as const, error: '全て既読に失敗しました' };
  }
}

export async function createNotification(data: {
  userId: string;
  type: 'deadline_approaching' | 'deadline_today' | 'deadline_passed' | 'group_invite' | 'assignment_shared';
  title: string;
  message?: string;
  assignmentId?: string;
  groupId?: string;
}) {
  try {
    await db.insert(notifications).values(data);
    return { success: true as const };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false as const, error: '通知の作成に失敗しました' };
  }
}

export async function getUnreadCount() {
  try {
    const userId = await getUserId();
    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    return { success: true as const, count: result.length };
  } catch (error) {
    console.error('Get unread count error:', error);
    return { success: false as const, error: '未読数の取得に失敗しました' };
  }
}
