'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { users, userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  title: z.string().max(30).optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export async function updateProfile(params: {
  name?: string;
  email?: string;
  title?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: '未認証' };

    const validated = updateProfileSchema.safeParse(params);
    if (!validated.success) {
      return { success: false, error: '入力内容に誤りがあります' };
    }

    const { name, email, title } = validated.data;

    // Update users table (name, email)
    if (name !== undefined || email !== undefined) {
      const updateData: { name?: string; email?: string; updatedAt: Date } = {
        updatedAt: new Date(),
      };
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      // Check if email is already taken
      if (email !== undefined) {
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (existing[0] && existing[0].id !== userId) {
          return { success: false, error: 'このメールアドレスは既に使用されています' };
        }
      }

      await db.update(users).set(updateData).where(eq(users.id, userId));
    }

    // Update userProfiles table (title)
    if (title !== undefined) {
      await db
        .update(userProfiles)
        .set({ title, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId));
    }

    return { success: true };
  } catch (error) {
    console.error('updateProfile error:', error);
    return { success: false, error: 'プロフィール更新に失敗しました' };
  }
}

export async function updatePassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: '未認証' };

    const validated = updatePasswordSchema.safeParse(params);
    if (!validated.success) {
      return { success: false, error: 'パスワードは8文字以上で入力してください' };
    }

    const { currentPassword, newPassword } = validated.data;

    // Get current user
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || !user.passwordHash) {
      return { success: false, error: 'パスワード認証が設定されていません' };
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: '現在のパスワードが正しくありません' };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error('updatePassword error:', error);
    return { success: false, error: 'パスワード変更に失敗しました' };
  }
}

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: '未認証' };

    // Delete user (cascades to all related tables)
    await db.delete(users).where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error('deleteAccount error:', error);
    return { success: false, error: 'アカウント削除に失敗しました' };
  }
}