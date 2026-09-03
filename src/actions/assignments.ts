'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { assignments, type Assignment } from '@/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const assignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  subject: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  priority: z.number().min(1).max(3).default(1),
  // datetime-local (2026-09-10T23:59) と ISO 8601 両対応
  dueDate: z.string().refine((val) => {
    // datetime-local format: YYYY-MM-DDTHH:mm
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) return true;
    // ISO 8601 with timezone
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(val)) return true;
    return false;
  }, '無効な日時形式です'),
  groupId: z.string().uuid().optional(),
});

export type AssignmentFormData = z.infer<typeof assignmentSchema>;
export type AssignmentActionResult<T = Assignment> = 
  | { success: true; data: T }
  | { success: false; error: string };

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }
  return session.user.id;
}

export async function createAssignment(data: AssignmentFormData): Promise<AssignmentActionResult> {
  try {
    const userId = await getUserId();
    const validated = assignmentSchema.parse(data);

    const [assignment] = await db.insert(assignments).values({
      userId,
      ...validated,
      dueDate: new Date(validated.dueDate),
    }).returning();

    revalidatePath('/dashboard/assignments');
    return { success: true, data: assignment };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: '入力内容が正しくありません' };
    }
    console.error('Create assignment error:', error);
    return { success: false, error: '課題の作成に失敗しました' };
  }
}

export async function getAssignments(filters?: {
  status?: string;
  subject?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AssignmentActionResult<Assignment[]>> {
  try {
    const userId = await getUserId();

    const conditions = [eq(assignments.userId, userId)];
    
    if (filters?.status) {
      conditions.push(eq(assignments.status, filters.status as any));
    }
    if (filters?.subject) {
      conditions.push(eq(assignments.subject, filters.subject));
    }
    if (filters?.startDate) {
      conditions.push(gte(assignments.dueDate, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      conditions.push(lte(assignments.dueDate, new Date(filters.endDate)));
    }

    const result = await db
      .select()
      .from(assignments)
      .where(and(...conditions))
      .orderBy(desc(assignments.dueDate));

    return { success: true, data: result };
  } catch (error) {
    console.error('Get assignments error:', error);
    return { success: false, error: '課題の取得に失敗しました' };
  }
}

export async function getAssignment(id: string): Promise<AssignmentActionResult<Assignment>> {
  try {
    const userId = await getUserId();
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, id), eq(assignments.userId, userId)))
      .limit(1);

    if (!assignment) {
      return { success: false, error: '課題が見つかりません' };
    }

    return { success: true, data: assignment };
  } catch (error) {
    console.error('Get assignment error:', error);
    return { success: false, error: '課題の取得に失敗しました' };
  }
}

export async function updateAssignment(id: string, data: Partial<AssignmentFormData>): Promise<AssignmentActionResult<Assignment>> {
  try {
    const userId = await getUserId();
    const validated = assignmentSchema.partial().parse(data);

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.dueDate) {
      updateData.dueDate = new Date(validated.dueDate);
    }
    if (validated.status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [assignment] = await db
      .update(assignments)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(assignments.id, id), eq(assignments.userId, userId)))
      .returning();

    if (!assignment) {
      return { success: false, error: '課題が見つかりません' };
    }

    revalidatePath('/dashboard/assignments');
    return { success: true, data: assignment };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: '入力内容が正しくありません' };
    }
    console.error('Update assignment error:', error);
    return { success: false, error: '課題の更新に失敗しました' };
  }
}

export async function deleteAssignment(id: string): Promise<AssignmentActionResult<unknown>> {
  try {
    const userId = await getUserId();
    const result = await db
      .delete(assignments)
      .where(and(eq(assignments.id, id), eq(assignments.userId, userId)));

    revalidatePath('/dashboard/assignments');
    return { success: true, data: result };
  } catch (error) {
    console.error('Delete assignment error:', error);
    return { success: false, error: '課題の削除に失敗しました' };
  }
}

export async function getAssignmentStats(): Promise<AssignmentActionResult<{
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}>> {
  try {
    const userId = await getUserId();
    const all = await db.select().from(assignments).where(eq(assignments.userId, userId));

    const stats = {
      pending: all.filter(a => a.status === 'pending').length,
      in_progress: all.filter(a => a.status === 'in_progress').length,
      completed: all.filter(a => a.status === 'completed').length,
      overdue: all.filter(a => a.status !== 'completed' && new Date(a.dueDate) < new Date()).length,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Get assignment stats error:', error);
    return { success: false, error: '統計の取得に失敗しました' };
  }
}
