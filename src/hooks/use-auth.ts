'use client';

// ============================================================
// Destiny AI Forge — Auth Hook
// ============================================================
// Convenience hook that initializes auth state on mount.
// ============================================================

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook that checks auth status on mount and returns the store.
 * Use in any client component that needs auth awareness.
 */
export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
