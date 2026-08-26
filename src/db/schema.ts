import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const assignmentStatusEnum = pgEnum('assignment_status', ['pending', 'in_progress', 'completed']);
export const notificationTypeEnum = pgEnum('notification_type', ['deadline_approaching', 'deadline_today', 'deadline_passed', 'group_invite', 'assignment_shared']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  image: text('image'),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

// Assignments table
export const assignments = pgTable('assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  groupId: uuid('group_id'),
  title: text('title').notNull(),
  description: text('description'),
  subject: text('subject'),
  status: assignmentStatusEnum('status').default('pending').notNull(),
  priority: integer('priority').default(1).notNull(), // 1=low, 2=medium, 3=high
  dueDate: timestamp('due_date').notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('assignments_user_id_idx').on(table.userId),
  groupIdIdx: index('assignments_group_id_idx').on(table.groupId),
  dueDateIdx: index('assignments_due_date_idx').on(table.dueDate),
  statusIdx: index('assignments_status_idx').on(table.status),
}));

// Groups table
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  inviteCode: text('invite_code').notNull().unique(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  inviteCodeIdx: uniqueIndex('groups_invite_code_idx').on(table.inviteCode),
  ownerIdIdx: index('groups_owner_id_idx').on(table.ownerId),
}));

// Group members table
export const groupMembers = pgTable('group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').default('member').notNull(), // owner, admin, member
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  groupIdIdx: index('group_members_group_id_idx').on(table.groupId),
  userIdIdx: index('group_members_user_id_idx').on(table.userId),
  uniqueGroupUser: uniqueIndex('group_members_group_user_idx').on(table.groupId, table.userId),
}));

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message'),
  assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'set null' }),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  readIdx: index('notifications_read_idx').on(table.read),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
}));

// ===== RPG「賢者の書」Game Tables =====

// Player profiles - one per user
export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  level: integer('level').default(1).notNull(),
  xp: integer('xp').default(0).notNull(),
  gold: integer('gold').default(0).notNull(),
  streak: integer('streak').default(0).notNull(),
  lastActiveDate: text('last_active_date'), // YYYY-MM-DD, for streak tracking
  title: text('title').default('見習い賢者').notNull(), // unlocked title
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Player subject stats
export const userStats = pgTable('user_stats', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  int: integer('int').default(0).notNull(), // 数学
  wis: integer('wis').default(0).notNull(), // 英語
  str: integer('str').default(0).notNull(), // 体育
  end: integer('end').default(0).notNull(), // 理科
  cre: integer('cre').default(0).notNull(), // 芸術
  soc: integer('soc').default(0).notNull(), // 社会
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Achievement definitions
export const achievements = pgTable('achievements', {
  id: text('id').primaryKey(), // e.g. 'first_clear', 'streak_7'
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(), // emoji
  category: text('category').notNull(), // 'first_steps' | 'mastery' | 'streak' | 'social' | 'building'
  xpReward: integer('xp_reward').default(0).notNull(),
  goldReward: integer('gold_reward').default(0).notNull(),
  titleReward: text('title_reward'), // optional title unlock
  conditionType: text('condition_type').notNull(), // e.g. 'total_clears', 'streak_days', 'level_reach'
  conditionValue: integer('condition_value').notNull(),
});

// User achievements junction
export const userAchievements = pgTable('user_achievements', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  achievementId: text('achievement_id').references(() => achievements.id, { onDelete: 'cascade' }).notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
}, (table) => ({
  pk: uniqueIndex('user_achievements_pk').on(table.userId, table.achievementId),
}));

// Facility definitions
export const facilities = pgTable('facilities', {
  id: text('id').primaryKey(), // e.g. 'library', 'study_room', 'dojo', 'garden', 'tower'
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(), // emoji
  unlockLevel: integer('unlock_level').default(1).notNull(),
  maxLevel: integer('max_level').default(5).notNull(),
  baseCost: integer('base_cost').default(100).notNull(),
  effectType: text('effect_type').notNull(), // 'xp_bonus' | 'gold_bonus' | 'streak_protect'
  effectPerLevel: integer('effect_per_level').default(10).notNull(), // percentage
});

// User facilities - built/leveled
export const userFacilities = pgTable('user_facilities', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  facilityId: text('facility_id').references(() => facilities.id, { onDelete: 'cascade' }).notNull(),
  level: integer('level').default(1).notNull(),
  builtAt: timestamp('built_at').defaultNow().notNull(),
}, (table) => ({
  pk: uniqueIndex('user_facilities_pk').on(table.userId, table.facilityId),
}));

// Guild quests
export const guildQuests = pgTable('guild_quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  targetCount: integer('target_count').default(10).notNull(),
  rewardXp: integer('reward_xp').default(100).notNull(),
  rewardGold: integer('reward_gold').default(50).notNull(),
  subjectFilter: text('subject_filter'), // null = all subjects
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  groupIdIdx: index('guild_quests_group_id_idx').on(table.groupId),
}));

// Guild quest progress
export const guildQuestProgress = pgTable('guild_quest_progress', {
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }).notNull(),
  questId: uuid('quest_id').references(() => guildQuests.id, { onDelete: 'cascade' }).notNull(),
  currentCount: integer('current_count').default(0).notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  pk: uniqueIndex('guild_quest_progress_pk').on(table.groupId, table.questId),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  assignments: many(assignments),
  ownedGroups: many(groups),
  groupMemberships: many(groupMembers),
  notifications: many(notifications),
  profile: one(userProfiles),
  stats: one(userStats),
  achievements: many(userAchievements),
  facilities: many(userFacilities),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  user: one(users, { fields: [assignments.userId], references: [users.id] }),
  group: one(groups, { fields: [assignments.groupId], references: [groups.id] }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, { fields: [groups.ownerId], references: [users.id] }),
  members: many(groupMembers),
  assignments: many(assignments),
  guildQuests: many(guildQuests),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  assignment: one(assignments, { fields: [notifications.assignmentId], references: [assignments.id] }),
  group: one(groups, { fields: [notifications.groupId], references: [groups.id] }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, { fields: [userStats.userId], references: [users.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  unlockedBy: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

export const facilitiesRelations = relations(facilities, ({ many }) => ({
  builtBy: many(userFacilities),
}));

export const userFacilitiesRelations = relations(userFacilities, ({ one }) => ({
  user: one(users, { fields: [userFacilities.userId], references: [users.id] }),
  facility: one(facilities, { fields: [userFacilities.facilityId], references: [facilities.id] }),
}));

export const guildQuestsRelations = relations(guildQuests, ({ one }) => ({
  group: one(groups, { fields: [guildQuests.groupId], references: [groups.id] }),
}));

export const guildQuestProgressRelations = relations(guildQuestProgress, ({ one }) => ({
  group: one(groups, { fields: [guildQuestProgress.groupId], references: [groups.id] }),
  quest: one(guildQuests, { fields: [guildQuestProgress.questId], references: [guildQuests.id] }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// RPG Types
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type UserStats = typeof userStats.$inferSelect;
export type NewUserStats = typeof userStats.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type Facility = typeof facilities.$inferSelect;
export type UserFacility = typeof userFacilities.$inferSelect;
export type GuildQuest = typeof guildQuests.$inferSelect;
export type GuildQuestProgress = typeof guildQuestProgress.$inferSelect;
