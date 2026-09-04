import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          // Return a thenable that resolves to an array for getUnreadCount
          // and has orderBy/limit for getNotifications
          const data = [];
          const promise = Promise.resolve(data);
          return {
            then: promise.then.bind(promise),
            catch: promise.catch.bind(promise),
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve(data)),
            })),
          };
        }),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve({})),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve({})),
      })),
    })),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from '@/auth';
import { getNotifications, markAsRead, markAllAsRead, createNotification, getUnreadCount } from '@/actions/notifications';

describe('Notifications Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', name: 'Test User' },
    });
  });

  describe('getNotifications', () => {
    it('fetches all notifications', async () => {
      const result = await getNotifications();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it('filters by read status', async () => {
      const result = await getNotifications({ read: false });

      expect(result.success).toBe(true);
    });

    it('limits results', async () => {
      const result = await getNotifications({ limit: 10 });

      expect(result.success).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      const result = await markAsRead('notification-1');

      expect(result.success).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read', async () => {
      const result = await markAllAsRead();

      expect(result.success).toBe(true);
    });
  });

  describe('createNotification', () => {
    it('creates notification successfully', async () => {
      const result = await createNotification({
        userId: 'user-1',
        type: 'deadline_approaching',
        title: '期限が近い課題があります',
        message: '数学の宿題はあと2日で期限です',
      });

      expect(result.success).toBe(true);
    });

    it('creates notification with assignment reference', async () => {
      const result = await createNotification({
        userId: 'user-1',
        type: 'deadline_today',
        title: '本日期限の課題があります',
        assignmentId: 'assignment-1',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread count', async () => {
      const result = await getUnreadCount();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.count).toBe('number');
      }
    });
  });
});
