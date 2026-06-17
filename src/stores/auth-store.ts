// ============================================================
// Destiny AI Forge — Zustand Auth Store
// ============================================================
// Client-side auth state. NEVER stores tokens — only display info.
// Tokens live exclusively in encrypted HTTP-only cookies on the server.
// ============================================================

import { create } from 'zustand';
import type { ClientSessionInfo } from '@/lib/bungie/types';

interface AuthState {
  /** Whether we've finished checking auth status */
  isLoading: boolean;
  /** Client-safe session info (no tokens) */
  session: ClientSessionInfo | null;
  /** Error message from auth operations */
  error: string | null;

  /** Hydrate auth state from the server */
  checkAuth: () => Promise<void>;
  /** Trigger logout */
  logout: () => Promise<void>;
  /** Refresh the access token */
  refreshToken: () => Promise<boolean>;
  /** Clear error state */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  session: null,
  error: null,

  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        set({ session: null, isLoading: false });
        return;
      }

      const session: ClientSessionInfo = await response.json();
      set({ session, isLoading: false });
    } catch {
      set({ session: null, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ session: null, error: null });
      window.location.href = '/';
    } catch (error) {
      console.error('[AuthStore] Logout failed:', error);
      // Force redirect anyway
      window.location.href = '/';
    }
  },

  refreshToken: async () => {
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST' });
      if (!response.ok) {
        set({
          session: null,
          error: 'Session expired. Please log in again.',
        });
        return false;
      }

      // Re-check auth to update session info
      await get().checkAuth();
      return true;
    } catch {
      set({
        session: null,
        error: 'Failed to refresh session.',
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
