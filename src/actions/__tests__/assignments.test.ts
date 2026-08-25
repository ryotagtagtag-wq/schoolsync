import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([])),
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'test-id', title: 'Test' }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 'test-id', title: 'Updated' }])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve({})),
    })),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('hashed')),
    compare: vi.fn(() => Promise.resolve(true)),
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'ABC123XY'),
}));

import { auth } from '@/auth';
import { createAssignment, getAssignments, updateAssignment, deleteAssignment, getAssignmentStats } from '@/actions/assignments';

describe('Assignments Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', name: 'Test User' },
    });
  });

  describe('createAssignment', () => {
    it('creates an assignment successfully', async () => {
      const result = await createAssignment({
        title: '数学の宿題',
        description: '教科書P.10',
        subject: '数学',
        status: 'pending',
        priority: 2,
        dueDate: '2026-09-01T23:59:00.000Z',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }
    });

    it('fails with invalid data (missing required fields)', async () => {
      const result = await createAssignment({
        title: '',
        status: 'pending',
        priority: 1,
        dueDate: '2026-09-01T23:59:00.000Z',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('getAssignments', () => {
    it('fetches assignments for user', async () => {
      const result = await getAssignments();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it('applies filters correctly', async () => {
      const result = await getAssignments({
        status: 'pending',
        subject: '数学',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('updateAssignment', () => {
    it('updates assignment successfully', async () => {
      const result = await updateAssignment('test-id', {
        title: '更新されたタイトル',
        status: 'completed',
      });

      expect(result.success).toBe(true);
    });

    it('fails with invalid data', async () => {
      const result = await updateAssignment('test-id', {
        title: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('deleteAssignment', () => {
    it('deletes assignment successfully', async () => {
      const result = await deleteAssignment('test-id');

      expect(result.success).toBe(true);
    });
  });

  describe('getAssignmentStats', () => {
    it('returns assignment statistics', async () => {
      const result = await getAssignmentStats();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('pending');
        expect(result.data).toHaveProperty('in_progress');
        expect(result.data).toHaveProperty('completed');
        expect(result.data).toHaveProperty('overdue');
      }
    });
  });
});
