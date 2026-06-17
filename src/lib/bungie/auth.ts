// ============================================================
// Destiny AI Forge — Bungie OAuth 2.0 Helper Functions
// ============================================================
// Implements the Authorization Code Flow for Bungie.net:
// 1. Build authorization URL → redirect user to Bungie
// 2. Exchange auth code for tokens → POST to token endpoint
// 3. Refresh expired tokens → POST with refresh_token grant
// ============================================================

import { BUNGIE } from '@/lib/constants';
import type { BungieTokenResponse } from './types';

/**
 * Validates that required Bungie environment variables are set.
 * Throws descriptive errors if any are missing.
 */
function getEnvVars() {
  const apiKey = process.env.BUNGIE_API_KEY;
  const clientId = process.env.BUNGIE_CLIENT_ID;
  const clientSecret = process.env.BUNGIE_CLIENT_SECRET;
  const redirectUrl = process.env.BUNGIE_REDIRECT_URL;

  if (!apiKey) throw new Error('[Bungie Auth] BUNGIE_API_KEY is not configured');
  if (!clientId) throw new Error('[Bungie Auth] BUNGIE_CLIENT_ID is not configured');
  if (!clientSecret) throw new Error('[Bungie Auth] BUNGIE_CLIENT_SECRET is not configured');
  if (!redirectUrl) throw new Error('[Bungie Auth] BUNGIE_REDIRECT_URL is not configured');

  return { apiKey, clientId, clientSecret, redirectUrl };
}

/**
 * Builds the Bungie authorization URL for the OAuth redirect.
 * @param state - CSRF protection token (should be a random string stored in a cookie)
 */
export function buildAuthorizationUrl(state: string): string {
  const { clientId } = getEnvVars();

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    state,
  });

  return `${BUNGIE.AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for access + refresh tokens.
 * This is step 2 of the OAuth flow, called from the callback handler.
 *
 * @param code - The authorization code received from Bungie's redirect
 * @returns Token response containing access_token, refresh_token, and expiry info
 * @throws Error with descriptive message on failure
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<BungieTokenResponse> {
  const { clientId, clientSecret } = getEnvVars();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(BUNGIE.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Bungie Auth] Token exchange failed:', response.status, errorText);
    throw new Error(
      `Token exchange failed (HTTP ${response.status}): ${errorText}`
    );
  }

  const data: BungieTokenResponse = await response.json();

  if (!data.access_token || !data.refresh_token) {
    throw new Error('[Bungie Auth] Token response missing required fields');
  }

  return data;
}

/**
 * Refreshes an expired access token using the refresh token.
 * Bungie access tokens last ~1 hour; refresh tokens last ~90 days.
 *
 * @param refreshToken - The refresh token from the previous token exchange
 * @returns New token response with fresh access_token and refresh_token
 * @throws Error if the refresh token is expired or invalid
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<BungieTokenResponse> {
  const { clientId, clientSecret } = getEnvVars();

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(BUNGIE.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Bungie Auth] Token refresh failed:', response.status, errorText);
    throw new Error(
      `Token refresh failed (HTTP ${response.status}): ${errorText}`
    );
  }

  const data: BungieTokenResponse = await response.json();

  if (!data.access_token || !data.refresh_token) {
    throw new Error('[Bungie Auth] Refresh response missing required fields');
  }

  return data;
}
