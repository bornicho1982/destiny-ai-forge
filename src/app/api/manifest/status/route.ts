// ============================================================
// Destiny AI Forge — Ruta API de Estado del Manifest
// ============================================================
// GET /api/manifest/status
// Retorna si el Manifest está cacheado y su versión.
// ============================================================

import { NextResponse } from 'next/server';
import {
  getCachedManifestVersion,
  getCachedTimestamp,
  getCachedTableStatus,
  isManifestCached,
} from '@/lib/db/manifest-store';

export async function GET() {
  try {
    const [version, timestamp, tableStatus, allCached] = await Promise.all([
      getCachedManifestVersion(),
      getCachedTimestamp(),
      getCachedTableStatus(),
      isManifestCached(),
    ]);

    return NextResponse.json({
      isCached: allCached,
      version: version || null,
      lastUpdated: timestamp || null,
      tables: tableStatus,
    });
  } catch (error) {
    console.error('[Manifest Status] Error:', error);
    return NextResponse.json(
      { isCached: false, version: null, lastUpdated: null, tables: {} },
      { status: 200 }
    );
  }
}
