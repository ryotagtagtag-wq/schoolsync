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

// date-fns mock - all functions used by the codebase
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, fmt: string) => date.toISOString()),
  formatDistanceToNow: vi.fn(() => '数分前'),
  startOfDay: vi.fn((d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())),
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
  addWeeks: vi.fn((d: Date, weeks: number) => new Date(d.getTime() + weeks * 7 * 86400000)),
  addMonths: vi.fn((d: Date, months: number) => new Date(d.getFullYear(), d.getMonth() + months, d.getDate())),
  setDay: vi.fn((d: Date, day: number, options?: { weekStartsOn?: number }) => {
    const weekStartsOn = options?.weekStartsOn ?? 0;
    const currentDay = d.getDay();
    const diff = (day - currentDay + 7) % 7;
    return new Date(d.getTime() + diff * 86400000);
  }),
  isSameMonth: vi.fn((a: Date, b: Date) => a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()),
  isSameDay: vi.fn((a: Date, b: Date) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()),
  isToday: vi.fn((d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }),
  isPast: vi.fn((d: Date) => d < new Date()),
  isValid: vi.fn((d: Date) => d instanceof Date && !isNaN(d.getTime())),
  differenceInDays: vi.fn((a: Date, b: Date) => Math.ceil((a.getTime() - b.getTime()) / 86400000)),
  getDay: vi.fn((d: Date) => d.getDay()),
  parse: vi.fn((str: string, fmt: string, ref: Date) => new Date(str)),
}));

vi.mock('lucide-react', () => {
  const icons = ['Calendar', 'Users', 'Bell', 'LogOut', 'Plus', 'CheckCircle', 'Clock', 'AlertTriangle', 'Sun', 'Moon', 'Monitor', 'ChevronLeft', 'ChevronRight', 'ArrowLeft', 'ArrowRight', 'Copy', 'Check', 'CheckCheck', 'Share2', 'Edit', 'Trash2', 'Filter', 'X', 'Zap', 'ArrowRight', 'Loader2', 'CheckCircle', 'AlertCircle'];
  const mockIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {};
  for (const icon of icons) {
    mockIcons[icon] = function MockIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
      return null;
    };
  }
  return mockIcons;
});
