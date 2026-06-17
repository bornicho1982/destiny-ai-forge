// ============================================================
// Destiny AI Forge — OAuth Callback Route Handler
// ============================================================
// GET /api/auth/callback?code=...&state=...
// Validates the state parameter, exchanges the auth code for tokens,
// fetches the user's Destiny membership info, creates an encrypted
// session, and redirects to the dashboard.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens } from '@/lib/bungie/auth';
import { createBungieClient } from '@/lib/bungie/api-client';
import { createSession } from '@/lib/auth/session';
import { STATE_COOKIE_NAME } from '@/lib/constants';
import type { SessionPayload, UserMembershipsResponse } from '@/lib/bungie/types';

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';

  try {
    // ── 1. Extract query parameters ────────────────────────
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      console.error('[Callback] Missing code or state parameter');
      return NextResponse.redirect(
        `${appUrl}/?error=missing_params`
      );
    }

    // ── 2. Validate CSRF state parameter ───────────────────
    const cookieStore = await cookies();
    const storedState = cookieStore.get(STATE_COOKIE_NAME)?.value;

    if (!storedState || storedState !== state) {
      console.error('[Callback] State mismatch — possible CSRF attack');
      // Clean up the state cookie
      cookieStore.delete(STATE_COOKIE_NAME);
      return NextResponse.redirect(
        `${appUrl}/?error=state_mismatch`
      );
    }

    // Clean up the state cookie (one-time use)
    cookieStore.delete(STATE_COOKIE_NAME);

    // ── 3. Exchange authorization code for tokens ──────────
    const tokenData = await exchangeCodeForTokens(code);

    const now = Date.now();
    const accessTokenExpiresAt = now + tokenData.expires_in * 1000;
    const refreshTokenExpiresAt = now + tokenData.refresh_expires_in * 1000;

    // ── 4. Fetch user membership data ──────────────────────
    const client = createBungieClient(tokenData.access_token);
    let displayName = '';
    let destinyMembershipId: string | undefined;
    let destinyMembershipType: number | undefined;

    try {
      const memberships = await client.get<UserMembershipsResponse>(
        '/User/GetMembershipsForCurrentUser/'
      );

      displayName =
        memberships.bungieNetUser?.displayName ||
        memberships.destinyMemberships?.[0]?.bungieGlobalDisplayName ||
        'Guardian';

      // Use primary membership or fall back to first
      const primaryId = memberships.primaryMembershipId;
      const primaryMembership = memberships.destinyMemberships.find(
        (m) => m.membershipId === primaryId
      );
      const activeMembership =
        primaryMembership || memberships.destinyMemberships[0];

      if (activeMembership) {
        destinyMembershipId = activeMembership.membershipId;
        destinyMembershipType = activeMembership.membershipType;
      }
    } catch (membershipError) {
      // Non-fatal: we can still create a session without membership data
      console.warn(
        '[Callback] Could not fetch memberships (non-fatal):',
        membershipError
      );
    }

    // ── 5. Create encrypted session ────────────────────────
    const sessionPayload: SessionPayload = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      bungieMembershipId: tokenData.membership_id,
      destinyMembershipId,
      destinyMembershipType,
      displayName,
    };

    await createSession(sessionPayload);

    // ── 6. Redirect to dashboard ───────────────────────────
    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (error) {
    console.error('[Callback] OAuth callback failed:', error);
    return NextResponse.redirect(
      `${appUrl}/?error=auth_failed`
    );
  }
}
