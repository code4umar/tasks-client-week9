'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

// Wraps /tasks and everything beneath it. Renders nothing until the
// session has been restored, so a signed-in user is never bounced to
// /login on a refresh (the "flash of signed-out" bug).
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !token) {
      router.replace('/login');
    }
  }, [ready, token, router]);

  if (!ready || !token) {
    return null;
  }

  return <>{children}</>;
}
