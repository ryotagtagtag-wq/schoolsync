'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { groups, groupMembers } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

const groupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('認証が必要です');
  return session.user.id;
}

export async function createGroup(data: z.infer<typeof groupSchema>) {
  try {
    const userId = await getUserId();
    const validated = groupSchema.parse(data);

    const inviteCode = nanoid(8).toUpperCase();

    const [group] = await db.insert(groups).values({
      ownerId: userId,
      name: validated.name,
      description: validated.description,
      inviteCode,
    }).returning();

    await db.insert(groupMembers).values({
      groupId: group.id,
      userId,
      role: 'owner',
    });

    revalidatePath('/groups');
    return { success: true as const, data: group };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: '入力内容が正しくありません' };
    console.error('Create group error:', error);
    return { success: false as const, error: 'グループの作成に失敗しました' };
  }
}

export async function getGroups() {
  try {
    const userId = await getUserId();
    const memberships = await db
      .select({ group: groups, role: groupMembers.role })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, userId))
      .orderBy(desc(groups.createdAt));

    return { success: true as const, data: memberships };
  } catch (error) {
    console.error('Get groups error:', error);
    return { success: false as const, error: 'グループの取得に失敗しました' };
  }
}

export async function getGroup(groupId: string) {
  try {
    const userId = await getUserId();
    const [membership] = await db
      .select({ group: groups, role: groupMembers.role })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!membership) return { success: false as const, error: 'グループが見つかりません' };
    return { success: true as const, data: membership };
  } catch (error) {
    console.error('Get group error:', error);
    return { success: false as const, error: 'グループの取得に失敗しました' };
  }
}

export async function getGroupByInviteCode(inviteCode: string) {
  try {
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.inviteCode, inviteCode))
      .limit(1);

    if (!group) return { success: false as const, error: '招待コードが無効です' };
    return { success: true as const, data: group };
  } catch (error) {
    console.error('Get group by invite code error:', error);
    return { success: false as const, error: 'グループの取得に失敗しました' };
  }
}

export async function joinGroup(inviteCode: string) {
  try {
    const userId = await getUserId();
    const groupResult = await getGroupByInviteCode(inviteCode);
    if (!groupResult.success) return groupResult;

    const group = groupResult.data;
    const existing = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, userId)))
      .limit(1);

    if (existing.length > 0) return { success: false as const, error: '既に参加しています' };

    await db.insert(groupMembers).values({
      groupId: group.id,
      userId,
      role: 'member',
    });

    revalidatePath('/groups');
    return { success: true as const, data: group };
  } catch (error) {
    console.error('Join group error:', error);
    return { success: false as const, error: 'グループへの参加に失敗しました' };
  }
}

export async function getGroupMembers(groupId: string) {
  try {
    const userId = await getUserId();
    const membership = await getGroup(groupId);
    if (!membership.success) return membership;

    const members = await db
      .select({
        member: groupMembers,
      })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));

    return { success: true as const, data: members, userRole: membership.data.role };
  } catch (error) {
    console.error('Get group members error:', error);
    return { success: false as const, error: 'メンバーの取得に失敗しました' };
  }
}
