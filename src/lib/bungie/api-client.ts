// ============================================================
// Destiny AI Forge — Typed Bungie Platform API Client
// ============================================================
// Wraps fetch() with automatic X-API-Key headers, Bearer auth,
// error handling for Bungie-specific error codes, and retry logic.
// ============================================================

import { BUNGIE } from '@/lib/constants';
import type { BungieApiResponse } from './types';

/** Bungie Platform error codes that indicate retriable conditions. */
const RETRIABLE_ERROR_CODES = new Set([
  36,  // ThrottleLimitExceededMomentarily
  37,  // ThrottleLimitExceededMinutes
]);

/** Max retry attempts for retriable errors. */
const MAX_RETRIES = 3;

/**
 * Creates a configured Bungie API client.
 * @param accessToken - Optional OAuth access token for authenticated endpoints
 */
export function createBungieClient(accessToken?: string) {
  const apiKey = process.env.BUNGIE_API_KEY;
  if (!apiKey) {
    throw new Error('[BungieClient] BUNGIE_API_KEY is not configured');
  }

  // apiKey is guaranteed non-null after the check above
  const validatedApiKey: string = apiKey;

  /**
   * Internal fetch wrapper with retry logic and error handling.
   */
  async function request<T>(
    path: string,
    options: RequestInit = {},
    retries = 0
  ): Promise<T> {
    const url = path.startsWith('http') ? path : `${BUNGIE.API_ROOT}${path}`;

    const headers: Record<string, string> = {
      'X-API-Key': validatedApiKey,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle HTTP-level errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');

      // Rate limiting: retry after the specified delay
      if (response.status === 429 && retries < MAX_RETRIES) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
        console.warn(`[BungieClient] Rate limited. Retrying in ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        return request<T>(path, options, retries + 1);
      }

      throw new BungieApiError(
        `Bungie API HTTP error ${response.status}: ${errorBody}`,
        response.status
      );
    }

    const data: BungieApiResponse<T> = await response.json();

    // Handle Bungie application-level errors
    if (data.ErrorCode !== 1) {
      // Check for retriable throttle errors
      if (RETRIABLE_ERROR_CODES.has(data.ErrorCode) && retries < MAX_RETRIES) {
        const delay = Math.max(data.ThrottleSeconds || 1, 1) * 1000;
        console.warn(
          `[BungieClient] Throttled (${data.ErrorStatus}). Retrying in ${delay}ms...`
        );
        await sleep(delay);
        return request<T>(path, options, retries + 1);
      }

      throw new BungieApiError(
        `Bungie API error [${data.ErrorCode}] ${data.ErrorStatus}: ${data.Message}`,
        data.ErrorCode
      );
    }

    return data.Response;
  }

  return {
    /**
     * GET request to a Bungie Platform API endpoint.
     * @param path - API path (e.g., '/Destiny2/Manifest/')
     */
    async get<T>(path: string): Promise<T> {
      return request<T>(path, { method: 'GET' });
    },

    /**
     * POST request to a Bungie Platform API endpoint.
     * @param path - API path
     * @param body - Request body (will be JSON.stringify'd)
     */
    async post<T>(path: string, body?: unknown): Promise<T> {
      return request<T>(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
    },
  };
}

/**
 * Custom error class for Bungie API errors.
 * Includes the Bungie error code or HTTP status for programmatic handling.
 */
export class BungieApiError extends Error {
  constructor(
    message: string,
    public readonly code: number
  ) {
    super(message);
    this.name = 'BungieApiError';
  }
}

/** Utility: promise-based sleep */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
