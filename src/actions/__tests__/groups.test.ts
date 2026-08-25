import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
        where: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([])),
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'group-1', name: 'Test Group', inviteCode: 'ABC123XY' }])),
      })),
    })),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'ABC123XY'),
}));

import { auth } from '@/auth';
import { createGroup, getGroups, joinGroup, getGroupByInviteCode } from '@/actions/groups';

describe('Groups Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', name: 'Test User' },
    });
  });

  describe('createGroup', () => {
    it('creates a group successfully', async () => {
      const result = await createGroup({
        name: '数学クラス',
        description: '数学の課題を共有',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.inviteCode).toBeDefined();
      }
    });

    it('fails with invalid data', async () => {
      const result = await createGroup({
        name: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('getGroups', () => {
    it('fetches user groups', async () => {
      const result = await getGroups();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('getGroupByInviteCode', () => {
    it('finds group by invite code', async () => {
      const result = await getGroupByInviteCode('ABC123XY');

      expect(result.success).toBe(true);
    });

    it('fails with invalid code', async () => {
      const result = await getGroupByInviteCode('INVALID');

      expect(result.success).toBe(false);
    });
  });

  describe('joinGroup', () => {
    it('joins group successfully', async () => {
      const result = await joinGroup('ABC123XY');

      expect(result.success).toBe(true);
    });

    it('fails with invalid code', async () => {
      const result = await joinGroup('INVALID');

      expect(result.success).toBe(false);
    });
  });
});
