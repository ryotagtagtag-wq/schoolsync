import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
    themes: ['light', 'dark', 'system'],
  })),
}));

vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, fmt: string) => date.toISOString()),
  formatDistanceToNow: vi.fn(() => '数分前'),
  startOfMonth: vi.fn((d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)),
  endOfMonth: vi.fn((d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  startOfWeek: vi.fn((d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }),
  endOfWeek: vi.fn((d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() + (6 - day);
    return new Date(d.setDate(diff));
  }),
  addDays: vi.fn((d: Date, days: number) => new Date(d.getTime() + days * 86400000)),
  isSameMonth: vi.fn((a: Date, b: Date) => a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()),
  isSameDay: vi.fn((a: Date, b: Date) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()),
  isToday: vi.fn((d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }),
  isPast: vi.fn((d: Date) => d < new Date()),
  differenceInDays: vi.fn((a: Date, b: Date) => Math.ceil((a.getTime() - b.getTime()) / 86400000)),
}));

vi.mock('lucide-react', () => {
  const icons = ['Calendar', 'Users', 'Bell', 'LogOut', 'Plus', 'CheckCircle', 'Clock', 'AlertTriangle', 'Sun', 'Moon', 'Monitor', 'ChevronLeft', 'ChevronRight', 'ArrowLeft', 'ArrowRight', 'Copy', 'Check', 'CheckCheck', 'Share2', 'Edit', 'Trash2', 'Filter', 'X'];
  const mockIcons: Record<string, any> = {};
  for (const icon of icons) {
    mockIcons[icon] = function MockIcon(props: any) {
      return null;
    };
  }
  return mockIcons;
});
