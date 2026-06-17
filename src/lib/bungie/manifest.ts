// ============================================================
// Destiny AI Forge — Servicio de Descarga del Manifest
// ============================================================
// Descarga las tablas individuales del Destiny 2 Manifest usando
// jsonWorldComponentContentPaths, las cachea en IndexedDB, y
// verifica versiones para evitar re-descargas innecesarias.
// ============================================================

import { BUNGIE } from '@/lib/constants';
import type { DestinyManifestResponse } from '@/lib/bungie/types';
import {
  getCachedManifestVersion,
  setCachedManifestVersion,
  cacheDefinitionTable,
  isManifestCached,
  REQUIRED_TABLES,
  type ManifestTableName,
} from '@/lib/db/manifest-store';

/** Progreso de descarga del Manifest */
export interface ManifestDownloadProgress {
  /** Tabla actual siendo descargada */
  currentTable: string;
  /** Índice de la tabla actual (base 0) */
  currentIndex: number;
  /** Total de tablas a descargar */
  totalTables: number;
  /** Porcentaje completado (0-100) */
  percent: number;
}

/** Callback para reportar progreso */
export type ProgressCallback = (progress: ManifestDownloadProgress) => void;

/**
 * Obtiene la metadata del Manifest desde la API de Bungie.
 * Incluye versión, URLs de descarga para cada idioma y tabla.
 */
export async function fetchManifestMetadata(): Promise<DestinyManifestResponse> {
  const apiKey = process.env.NEXT_PUBLIC_BUNGIE_API_KEY || process.env.BUNGIE_API_KEY;

  const response = await fetch(`${BUNGIE.API_ROOT}/Destiny2/Manifest/`, {
    headers: {
      'X-API-Key': apiKey || '',
    },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener el Manifest: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.ErrorCode !== 1) {
    throw new Error(`Error de la API de Bungie: ${data.Message}`);
  }

  return data.Response;
}

/**
 * Verifica si necesitamos descargar/actualizar el Manifest.
 * Compara la versión remota con la cacheada localmente.
 *
 * @returns true si el Manifest necesita actualizarse
 */
export async function needsManifestUpdate(
  remoteVersion: string
): Promise<boolean> {
  const cachedVersion = await getCachedManifestVersion();

  // Si no hay versión cacheada, necesitamos descargar
  if (!cachedVersion) return true;

  // Si la versión cambió, necesitamos actualizar
  if (cachedVersion !== remoteVersion) return true;

  // Verificar que todas las tablas requeridas estén cacheadas
  const allCached = await isManifestCached();
  return !allCached;
}

/**
 * Descarga una tabla individual del Manifest.
 *
 * @param tablePath - Path relativo de la tabla (ej: '/common/destiny2_content/json/en/...')
 * @returns La tabla como Record<hash, definition>
 */
async function downloadTable(
  tablePath: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const url = `${BUNGIE.CDN_ROOT}${tablePath}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error al descargar tabla: HTTP ${response.status} — ${url}`);
  }

  return response.json();
}

/**
 * Descarga y cachea todas las tablas requeridas del Manifest.
 * Reporta progreso mediante un callback.
 *
 * @param language - Idioma de las definiciones (por defecto 'en')
 * @param onProgress - Callback opcional para reportar progreso
 */
export async function downloadAndCacheManifest(
  language: string = 'en',
  onProgress?: ProgressCallback
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_BUNGIE_API_KEY || process.env.BUNGIE_API_KEY;
  if (!apiKey) {
    throw new Error('BUNGIE_API_KEY no está configurada');
  }

  // 1. Obtener metadata del Manifest
  const metadata = await fetchManifestMetadata();
  const componentPaths = metadata.jsonWorldComponentContentPaths[language];

  if (!componentPaths) {
    throw new Error(`Idioma "${language}" no disponible en el Manifest`);
  }

  // 2. Descargar cada tabla requerida
  const totalTables = REQUIRED_TABLES.length;

  for (let i = 0; i < totalTables; i++) {
    const tableName = REQUIRED_TABLES[i];
    const tablePath = componentPaths[tableName];

    if (!tablePath) {
      console.warn(`[Manifest] Tabla "${tableName}" no encontrada en los paths — omitiendo`);
      continue;
    }

    // Reportar progreso
    onProgress?.({
      currentTable: tableName,
      currentIndex: i,
      totalTables,
      percent: Math.round((i / totalTables) * 100),
    });

    try {
      const tableData = await downloadTable(tablePath, apiKey);
      await cacheDefinitionTable(tableName, tableData);
    } catch (error) {
      console.error(`[Manifest] Error descargando ${tableName}:`, error);
      throw new Error(`Error al descargar la tabla ${tableName}`);
    }
  }

  // 3. Guardar la versión para futuras verificaciones
  await setCachedManifestVersion(metadata.version);

  // Progreso final
  onProgress?.({
    currentTable: 'Completado',
    currentIndex: totalTables,
    totalTables,
    percent: 100,
  });
}

/**
 * Flujo completo: verifica si el Manifest necesita actualización,
 * y lo descarga si es necesario. Retorna si se hizo algún cambio.
 */
export async function ensureManifestCached(
  language: string = 'en',
  onProgress?: ProgressCallback
): Promise<{ updated: boolean; version: string }> {
  // Obtener metadata remota
  const metadata = await fetchManifestMetadata();
  const needsUpdate = await needsManifestUpdate(metadata.version);

  if (!needsUpdate) {
    return { updated: false, version: metadata.version };
  }

  // Descargar y cachear
  await downloadAndCacheManifest(language, onProgress);

  return { updated: true, version: metadata.version };
}
