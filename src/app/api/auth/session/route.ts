// ============================================================
// Destiny AI Forge — Session Info API Route
// ============================================================
// GET /api/auth/session
// Returns client-safe session info (no tokens) for the Zustand store.
// ============================================================

import { NextResponse } from 'next/server';
import { getClientSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getClientSession();
    return NextResponse.json(session);
  } catch (error) {
    console.error('[Session API] Failed to get session:', error);
    return NextResponse.json(
      { isAuthenticated: false, bungieMembershipId: '', expiresAt: 0 },
      { status: 200 } // Not a server error — just no session
    );
  }
}
