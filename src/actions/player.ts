'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import {
  userProfiles,
  userStats,
  userAchievements,
  achievements,
  userFacilities,
  facilities,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { xpProgress } from '@/lib/game/xp';
import { calculateStreak } from '@/lib/game/streak';
import type { PlayerState, UserAchievementState } from '@/lib/game/types';

/**
 * Get or create the player's profile.
 * Auto-creates profile + stats on first access.
 * Uses session userId directly (credentials auth guarantees it matches the database).
 */
export async function getPlayerProfile(): Promise<{
  success: boolean;
  data?: PlayerState;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return { success: false, error: '未認証' };

    const actualUserId = userId;

    // Get or create profile
    let [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, actualUserId))
      .limit(1);
    if (!profile) {
      [profile] = await db
        .insert(userProfiles)
        .values({ userId })
        .returning();
    }

    // Get or create stats
    let [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, actualUserId))
      .limit(1);
    if (!stats) {
      [stats] = await db
        .insert(userStats)
        .values({ userId })
        .returning();
    }

    // Update streak
    const today = new Date().toISOString().slice(0, 10);
    const streakResult = calculateStreak(
      profile.streak,
      profile.lastActiveDate,
      today,
    );
    if (
      streakResult.newStreak !== profile.streak ||
      profile.lastActiveDate !== today
    ) {
      [profile] = await db
        .update(userProfiles)
        .set({
          streak: streakResult.newStreak,
          lastActiveDate: today,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, actualUserId))
        .returning();
    }

    // Get user's facilities
    const userFacs = await db
      .select({
        facilityId: userFacilities.facilityId,
        level: userFacilities.level,
        name: facilities.name,
        icon: facilities.icon,
        maxLevel: facilities.maxLevel,
        effectType: facilities.effectType,
        effectPerLevel: facilities.effectPerLevel,
        baseCost: facilities.baseCost,
      })
      .from(userFacilities)
      .innerJoin(facilities, eq(userFacilities.facilityId, facilities.id))
      .where(eq(userFacilities.userId, actualUserId));

    // Get all achievements
    const userAchs = await db
      .select({
        achievementId: userAchievements.achievementId,
        name: achievements.name,
        icon: achievements.icon,
        description: achievements.description,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));

    const xpInfo = xpProgress(profile.xp);

    const playerState: PlayerState = {
      userId,
      level: xpInfo.currentLevel,
      xp: profile.xp,
      xpToNext: xpInfo.xpToNext,
      gold: profile.gold,
      streak: profile.streak,
      title: profile.title,
      stats: {
        int: stats.int,
        wis: stats.wis,
        str: stats.str,
        end: stats.end,
        cre: stats.cre,
        soc: stats.soc,
      },
      facilities: userFacs.map((f) => ({
        facilityId: f.facilityId,
        name: f.name,
        icon: f.icon,
        level: f.level,
        maxLevel: f.maxLevel,
        effectType: f.effectType,
        effectValue: f.effectPerLevel * f.level,
        upgradeCost: f.baseCost * (f.level + 1),
      })),
      achievements: userAchs.map((a) => ({
        achievementId: a.achievementId,
        name: a.name,
        icon: a.icon,
        description: a.description,
        unlockedAt: a.unlockedAt,
      })),
    };

    return { success: true, data: playerState };
  } catch (error) {
    console.error('getPlayerProfile error:', error);
    const message = error instanceof Error ? error.message : '不明なエラー';
    return { success: false, error: `プロフィール取得に失敗しました: ${message}` };
  }
}

/**
 * Get full profile data for the profile page.
 * Returns ALL achievements (locked + unlocked) via LEFT JOIN.
 */
export async function getProfilePageData(): Promise<{
  success: boolean;
  data?: PlayerState & { allAchievements: UserAchievementState[] };
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return { success: false, error: '未認証' };

    const actualUserId = userId;

    // Get or create profile
    let [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, actualUserId))
      .limit(1);
    if (!profile) {
      [profile] = await db
        .insert(userProfiles)
        .values({ userId })
        .returning();
    }

    // Get or create stats
    let [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, actualUserId))
      .limit(1);
    if (!stats) {
      [stats] = await db
        .insert(userStats)
        .values({ userId })
        .returning();
    }

    // Update streak
    const today = new Date().toISOString().slice(0, 10);
    const streakResult = calculateStreak(
      profile.streak,
      profile.lastActiveDate,
      today,
    );
    if (
      streakResult.newStreak !== profile.streak ||
      profile.lastActiveDate !== today
    ) {
      [profile] = await db
        .update(userProfiles)
        .set({
          streak: streakResult.newStreak,
          lastActiveDate: today,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, actualUserId))
        .returning();
    }

    // Get user's facilities
    const userFacs = await db
      .select({
        facilityId: userFacilities.facilityId,
        level: userFacilities.level,
        name: facilities.name,
        icon: facilities.icon,
        maxLevel: facilities.maxLevel,
        effectType: facilities.effectType,
        effectPerLevel: facilities.effectPerLevel,
        baseCost: facilities.baseCost,
      })
      .from(userFacilities)
      .innerJoin(facilities, eq(userFacilities.facilityId, facilities.id))
      .where(eq(userFacilities.userId, actualUserId));

    // Get ALL achievements (locked + unlocked) via LEFT JOIN
    const allAchievements = await db
      .select({
        achievementId: achievements.id,
        name: achievements.name,
        icon: achievements.icon,
        description: achievements.description,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(achievements)
      .leftJoin(
        userAchievements,
        and(
          eq(userAchievements.achievementId, achievements.id),
          eq(userAchievements.userId, actualUserId)
        )
      );

    const xpInfo = xpProgress(profile.xp);

    const playerState: PlayerState = {
      userId,
      level: xpInfo.currentLevel,
      xp: profile.xp,
      xpToNext: xpInfo.xpToNext,
      gold: profile.gold,
      streak: profile.streak,
      title: profile.title,
      stats: {
        int: stats.int,
        wis: stats.wis,
        str: stats.str,
        end: stats.end,
        cre: stats.cre,
        soc: stats.soc,
      },
      facilities: userFacs.map((f) => ({
        facilityId: f.facilityId,
        name: f.name,
        icon: f.icon,
        level: f.level,
        maxLevel: f.maxLevel,
        effectType: f.effectType,
        effectValue: f.effectPerLevel * f.level,
        upgradeCost: f.baseCost * (f.level + 1),
      })),
      achievements: allAchievements
        .filter((a) => a.unlockedAt !== null)
        .map((a) => ({
          achievementId: a.achievementId,
          name: a.name,
          icon: a.icon,
          description: a.description,
          unlockedAt: a.unlockedAt!,
        })),
    };

    const allAchievementsState: UserAchievementState[] = allAchievements.map((a) => ({
      achievementId: a.achievementId,
      name: a.name,
      icon: a.icon,
      description: a.description,
      unlockedAt: a.unlockedAt ?? undefined,
    }));

    return { success: true, data: { ...playerState, allAchievements: allAchievementsState } };
  } catch (error) {
    console.error('getProfilePageData error:', error);
    const message = error instanceof Error ? error.message : '不明なエラー';
    return { success: false, error: `プロフィール取得に失敗しました: ${message}` };
  }
}

/**
 * Award XP and gold to the player (called when a task is completed).
 */
export async function awardReward(params: {
  xp: number;
  gold: number;
  subjectStat?: { field: string; value: number };
}): Promise<{
  success: boolean;
  levelUp?: boolean;
  newLevel?: number;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return { success: false, error: '未認証' };

    const actualUserId = userId;

    // Get current profile (auto-create if missing)
    let [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, actualUserId))
      .limit(1);
    if (!profile) {
      [profile] = await db
        .insert(userProfiles)
        .values({ userId: actualUserId })
        .returning();
    }

    const oldLevel = xpProgress(profile.xp).currentLevel;
    const newXp = profile.xp + params.xp;
    const newLevel = xpProgress(newXp).currentLevel;
    const levelUp = newLevel > oldLevel;

    // Update profile XP and gold
    await db
      .update(userProfiles)
      .set({ xp: newXp, gold: profile.gold + params.gold, updatedAt: new Date() })
      .where(eq(userProfiles.userId, actualUserId));

    // Update subject stats if provided
    if (params.subjectStat) {
      const statField = params.subjectStat.field;
      const validFields = ['int', 'wis', 'str', 'end', 'cre', 'soc'];
      if (validFields.includes(statField)) {
        const currentStats = await db
          .select()
          .from(userStats)
          .where(eq(userStats.userId, actualUserId))
          .limit(1);
        if (currentStats[0]) {
          const currentValue =
            (currentStats[0] as unknown as Record<string, number>)[statField] ?? 0;
          await db
            .update(userStats)
            .set({
              [statField]: currentValue + params.subjectStat.value,
              updatedAt: new Date(),
            })
            .where(eq(userStats.userId, actualUserId));
        }
      }
    }

    return { success: true, levelUp, newLevel };
  } catch (error) {
    console.error('awardReward error:', error);
    const message = error instanceof Error ? error.message : '不明なエラー';
    return { success: false, error: `報酬付与に失敗しました: ${message}` };
  }
}
