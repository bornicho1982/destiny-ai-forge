// ============================================================
// Destiny AI Forge — OAuth Login Route Handler
// ============================================================
// GET /api/auth/login
// Generates a CSRF state token, stores it in a short-lived cookie,
// and redirects the user to Bungie's OAuth authorization page.
// ============================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { buildAuthorizationUrl } from '@/lib/bungie/auth';
import { STATE_COOKIE_NAME } from '@/lib/constants';

export async function GET() {
  try {
    // Generate a random state parameter for CSRF protection
    const state = randomBytes(32).toString('hex');

    // Store state in a short-lived HTTP-only cookie (5 minutes)
    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 300, // 5 minutes — enough time for the user to authorize
      path: '/',
    });

    // Build Bungie authorization URL and redirect
    const authUrl = buildAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[Login] Failed to initiate OAuth flow:', error);
    return NextResponse.json(
      { error: 'Failed to initiate login. Please try again.' },
      { status: 500 }
    );
  }
}
