'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { ReactNode } from 'react';
import { NotificationProvider } from './NotificationProvider';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ThemeProvider>
      <Toaster position="bottom-right" />
    </SessionProvider>
  );
}
