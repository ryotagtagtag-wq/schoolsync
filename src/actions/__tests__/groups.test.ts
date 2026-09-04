import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', function() {
  return { auth: vi.fn() };
});

vi.mock('next/cache', function() {
  return { revalidatePath: vi.fn() };
});

vi.mock('nanoid', function() {
  return { nanoid: vi.fn(function() { return 'ABC123XY'; }) };
});

// Mock group data
const mockGroup = { id: 'group-1', name: 'Test Group', inviteCode: 'ABC123XY', ownerId: 'user-1', description: 'Test', createdAt: new Date() };
const mockMembership = { group: mockGroup, role: 'owner' };

// Create a thenable with limit method
function createQueryMock(data) {
  const promise = Promise.resolve(data);
  const thenable = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    limit: vi.fn(function() { return Promise.resolve(data); }),
    innerJoin: vi.fn(function() {
      return {
        where: vi.fn(function() {
          return {
            orderBy: vi.fn(function() { return Promise.resolve([mockMembership]); }),
            limit: vi.fn(function() { return Promise.resolve([mockMembership]); }),
          };
        }),
      };
    }),
  };
  thenable.where = vi.fn(function() {
    return {
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      limit: vi.fn(function() { return Promise.resolve(data); }),
    };
  });
  return thenable;
}

vi.mock('@/db', function() {
  return {
    db: {
      select: vi.fn(function() {
        return {
          from: vi.fn(function() {
            return createQueryMock([mockGroup]);
          }),
        };
      }),
      insert: vi.fn(function(table) {
        const tableName = table && (table.name || table._name || table.tableName || '');
        const isGroupMembers = table && table.groupId !== undefined;
        if (isGroupMembers || tableName === 'group_members' || tableName === 'groupMembers') {
          return {
            values: vi.fn(function() { return Promise.resolve({}); }),
          };
        }
        return {
          values: vi.fn(function() {
            return {
              returning: vi.fn(function() {
                return Promise.resolve([{ id: 'group-1', name: 'Test Group', inviteCode: 'ABC123XY' }]);
              }),
            };
          }),
        };
      }),
    },
  };
});

import { auth } from '@/auth';
import { db } from '@/db';
import { createGroup, getGroups, joinGroup, getGroupByInviteCode } from '@/actions/groups';

describe('Groups Actions', function() {
  beforeEach(function() {
    vi.clearAllMocks();
    auth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', name: 'Test User' },
    });
  });

  describe('createGroup', function() {
    it('creates a group successfully', async function() {
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

    it('fails with invalid data', async function() {
      const result = await createGroup({
        name: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('getGroups', function() {
    it('fetches user groups', async function() {
      const result = await getGroups();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('getGroupByInviteCode', function() {
    it('finds group by invite code', async function() {
      const result = await getGroupByInviteCode('ABC123XY');

      expect(result.success).toBe(true);
    });

    it('fails with invalid code', async function() {
      vi.mocked(db).select.mockImplementation(function() {
        return {
          from: vi.fn(function() {
            return {
              where: vi.fn(function() {
                return { limit: vi.fn(function() { return Promise.resolve([]); }) };
              }),
            };
          }),
        };
      });

      const result = await getGroupByInviteCode('INVALID');

      expect(result.success).toBe(false);
    });
  });

  describe('joinGroup', function() {
    it('joins group successfully', async function() {
      // Override mock for this test: first select returns group, second returns empty
      let callCount = 0;
      vi.mocked(db).select.mockImplementation(function() {
        callCount++;
        return {
          from: vi.fn(function() {
            if (callCount === 1) {
              return createQueryMock([mockGroup]);
            }
            return createQueryMock([]);
          }),
        };
      });

      const result = await joinGroup('ABC123XY');

      expect(result.success).toBe(true);
    });

    it('fails with invalid code', async function() {
      vi.mocked(db).select.mockImplementation(function() {
        return {
          from: vi.fn(function() {
            return {
              where: vi.fn(function() {
                return { limit: vi.fn(function() { return Promise.resolve([]); }) };
              }),
            };
          }),
        };
      });

      const result = await joinGroup('INVALID');

      expect(result.success).toBe(false);
    });
  });
});
