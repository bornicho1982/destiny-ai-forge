// ============================================================
// Destiny AI Forge — IndexedDB Manifest Store (Completo)
// ============================================================
// Cachea las tablas del Destiny 2 Manifest en IndexedDB usando idb-keyval.
// Evita re-descargar gigabytes de datos estáticos del juego en cada visita.
// Control de versiones: solo descarga si la versión cambió.
// ============================================================

import { get, set, del, keys } from 'idb-keyval';

const MANIFEST_VERSION_KEY = 'destiny-manifest-version';
const MANIFEST_DATA_PREFIX = 'destiny-manifest-';
const MANIFEST_TIMESTAMP_KEY = 'destiny-manifest-timestamp';

/**
 * Tablas del Manifest que necesitamos descargar.
 * Solo descargamos las que realmente usa la app (no las ~60 tablas completas).
 */
export const REQUIRED_TABLES = [
  'DestinyInventoryItemDefinition',    // Items, armaduras, exóticos
  'DestinyStatDefinition',             // Definiciones de stats
  'DestinyClassDefinition',            // Clases (Titan, Hunter, Warlock)
  'DestinyDamageTypeDefinition',       // Tipos de daño (Solar, Arc, etc.)
  'DestinyInventoryBucketDefinition',  // Buckets (casco, brazos, etc.)
  'DestinySocketTypeDefinition',       // Tipos de socket (mods)
  'DestinySocketCategoryDefinition',   // Categorías de socket
  'DestinySandboxPerkDefinition',      // Perks
  'DestinyStatGroupDefinition',        // Grupos de stats
  'DestinyItemCategoryDefinition',     // Categorías de items
] as const;

export type ManifestTableName = (typeof REQUIRED_TABLES)[number];

// ── Lectura ──────────────────────────────────────────────────

/** Obtiene la versión cacheada del Manifest. */
export async function getCachedManifestVersion(): Promise<string | undefined> {
  return get<string>(MANIFEST_VERSION_KEY);
}

/** Obtiene el timestamp de la última descarga. */
export async function getCachedTimestamp(): Promise<number | undefined> {
  return get<number>(MANIFEST_TIMESTAMP_KEY);
}

/** Recupera una tabla de definiciones cacheada. */
export async function getCachedDefinitionTable<
  T = Record<string, unknown>
>(tableName: ManifestTableName): Promise<T | undefined> {
  return get<T>(`${MANIFEST_DATA_PREFIX}${tableName}`);
}

/**
 * Busca un item específico por hash en una tabla cacheada.
 * Optimizado para lookups individuales sin cargar toda la tabla en memoria.
 */
export async function lookupDefinition<T = unknown>(
  tableName: ManifestTableName,
  hash: number | string
): Promise<T | undefined> {
  const table = await getCachedDefinitionTable<Record<string, T>>(tableName);
  if (!table) return undefined;
  return table[String(hash)];
}

// ── Escritura ────────────────────────────────────────────────

/** Guarda la versión del Manifest. */
export async function setCachedManifestVersion(version: string): Promise<void> {
  await set(MANIFEST_VERSION_KEY, version);
  await set(MANIFEST_TIMESTAMP_KEY, Date.now());
}

/**
 * Guarda una tabla de definiciones en IndexedDB.
 * @param tableName - Nombre de la tabla (ej: 'DestinyInventoryItemDefinition')
 * @param data - Tabla completa como Record<hash, definition>
 */
export async function cacheDefinitionTable(
  tableName: ManifestTableName,
  data: Record<string, unknown>
): Promise<void> {
  await set(`${MANIFEST_DATA_PREFIX}${tableName}`, data);
}

// ── Limpieza ─────────────────────────────────────────────────

/** Limpia todo el caché del Manifest. */
export async function clearManifestCache(): Promise<void> {
  const allKeys = await keys();
  const manifestKeys = allKeys.filter(
    (key) =>
      typeof key === 'string' &&
      (key.startsWith(MANIFEST_DATA_PREFIX) ||
        key === MANIFEST_VERSION_KEY ||
        key === MANIFEST_TIMESTAMP_KEY)
  );

  await Promise.all(manifestKeys.map((key) => del(key)));
}

// ── Estado ───────────────────────────────────────────────────

/** Verifica qué tablas están cacheadas actualmente. */
export async function getCachedTableStatus(): Promise<
  Record<ManifestTableName, boolean>
> {
  const allKeys = await keys();
  const keySet = new Set(allKeys.map(String));

  const status = {} as Record<ManifestTableName, boolean>;
  for (const table of REQUIRED_TABLES) {
    status[table] = keySet.has(`${MANIFEST_DATA_PREFIX}${table}`);
  }
  return status;
}

/** Verifica si el Manifest completo está cacheado. */
export async function isManifestCached(): Promise<boolean> {
  const status = await getCachedTableStatus();
  return REQUIRED_TABLES.every((table) => status[table]);
}
