// ============================================================
// Destiny AI Forge — Token Refresh Route Handler
// ============================================================
// POST /api/auth/refresh
// Reads the encrypted session, refreshes the access token via
// Bungie's token endpoint, and updates the session cookie.
// ============================================================

import { NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/auth/session';
import { refreshAccessToken } from '@/lib/bungie/auth';

export async function POST() {
  try {
    // ── 1. Read current session ────────────────────────────
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No active session. Please log in again.' },
        { status: 401 }
      );
    }

    // ── 2. Check if refresh token is still valid ───────────
    if (Date.now() > session.refreshTokenExpiresAt) {
      return NextResponse.json(
        { error: 'Refresh token expired. Please log in again.' },
        { status: 401 }
      );
    }

    // ── 3. Refresh the access token ────────────────────────
    const tokenData = await refreshAccessToken(session.refreshToken);

    const now = Date.now();
    const accessTokenExpiresAt = now + tokenData.expires_in * 1000;
    const refreshTokenExpiresAt = now + tokenData.refresh_expires_in * 1000;

    // ── 4. Update the session cookie ───────────────────────
    await updateSession({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    });

    return NextResponse.json({
      success: true,
      expiresAt: accessTokenExpiresAt,
    });
  } catch (error) {
    console.error('[Refresh] Token refresh failed:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token. Please log in again.' },
      { status: 500 }
    );
  }
}
