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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignments: many(assignments),
  ownedGroups: many(groups),
  groupMemberships: many(groupMembers),
  notifications: many(notifications),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  user: one(users, { fields: [assignments.userId], references: [users.id] }),
  group: one(groups, { fields: [assignments.groupId], references: [groups.id] }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, { fields: [groups.ownerId], references: [users.id] }),
  members: many(groupMembers),
  assignments: many(assignments),
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
