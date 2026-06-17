// ============================================================
// Destiny AI Forge — Logout Route Handler
// ============================================================
// POST /api/auth/logout
// Destroys the encrypted session cookie and redirects to home.
// ============================================================

import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Logout] Failed to destroy session:', error);
    // Even if destruction fails, respond successfully
    // (the user wants to be "logged out" from their perspective)
    return NextResponse.json({ success: true });
  }
}

// Also support GET for simple redirect-based logout
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';

  try {
    await destroySession();
  } catch (error) {
    console.error('[Logout] Failed to destroy session:', error);
  }

  return NextResponse.redirect(`${appUrl}/`);
}
