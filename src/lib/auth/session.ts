// ============================================================
// Destiny AI Forge — Cookie-Based Session Management
// ============================================================
// Stores encrypted OAuth tokens in HTTP-only, Secure, SameSite=Lax cookies.
// Tokens never reach the client — only a derived "client session info" is exposed.
// ============================================================

import { cookies } from 'next/headers';
import { encrypt, decrypt } from './crypto';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from '@/lib/constants';
import type { SessionPayload, ClientSessionInfo } from '@/lib/bungie/types';

/**
 * Creates an encrypted session cookie from the token payload.
 * Call this after a successful OAuth token exchange.
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const cookieStore = await cookies();
  const encrypted = encrypt(JSON.stringify(payload));

  cookieStore.set(SESSION_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: true,                // Required: Bungie mandates HTTPS
    sameSite: 'lax',             // Allows redirect flow back from Bungie
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Reads and decrypts the session from the cookie.
 * Returns null if no session exists or decryption fails (tampered cookie).
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!cookie?.value) return null;

    const decrypted = decrypt(cookie.value);
    const payload: SessionPayload = JSON.parse(decrypted);

    return payload;
  } catch (error) {
    console.error('[Session] Failed to decrypt session:', error);
    return null;
  }
}

/**
 * Updates the session with new token data (e.g., after a refresh).
 */
export async function updateSession(
  updates: Partial<SessionPayload>
): Promise<void> {
  const current = await getSession();
  if (!current) {
    throw new Error('[Session] No active session to update');
  }

  const updated: SessionPayload = { ...current, ...updates };
  await createSession(updated);
}

/**
 * Destroys the session by clearing the cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Returns client-safe session info (no tokens, no secrets).
 * Safe to send to the browser via API response or server component.
 */
export async function getClientSession(): Promise<ClientSessionInfo> {
  const session = await getSession();

  if (!session) {
    return { isAuthenticated: false, bungieMembershipId: '', expiresAt: 0 };
  }

  const isExpired = Date.now() > session.accessTokenExpiresAt;

  return {
    isAuthenticated: !isExpired,
    bungieMembershipId: session.bungieMembershipId,
    destinyMembershipId: session.destinyMembershipId,
    destinyMembershipType: session.destinyMembershipType,
    displayName: session.displayName,
    expiresAt: session.accessTokenExpiresAt,
  };
}

/**
 * Checks if the current session has a valid (non-expired) access token.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return Date.now() < session.accessTokenExpiresAt;
}
