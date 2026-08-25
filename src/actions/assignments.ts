'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { assignments } from '@/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const assignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  subject: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  priority: z.number().min(1).max(3).default(1),
  dueDate: z.string().datetime(),
  groupId: z.string().uuid().optional(),
});

export type AssignmentFormData = z.infer<typeof assignmentSchema>;
export type AssignmentActionResult = 
  | { success: true; data: any }
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
}): Promise<AssignmentActionResult> {
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

export async function getAssignment(id: string): Promise<AssignmentActionResult> {
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

export async function updateAssignment(id: string, data: Partial<AssignmentFormData>): Promise<AssignmentActionResult> {
  try {
    const userId = await getUserId();
    const validated = assignmentSchema.partial().parse(data);

    const updateData: any = { ...validated };
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

export async function deleteAssignment(id: string): Promise<AssignmentActionResult> {
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

export async function getAssignmentStats(): Promise<AssignmentActionResult> {
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
