// ============================================================
// Destiny AI Forge — Servicio de Inventario del Guardián
// ============================================================
// Obtiene las armaduras del perfil del jugador vía Bungie API
// (GetProfile con componentes de inventario), y las transforma
// en ArmorItems tipados para el motor de optimización.
// ============================================================

import { STAT_HASHES, type StatName } from '@/lib/constants';
import { ARMOR_BUCKET_HASHES, EMPTY_STATS, type ArmorItem, type ArmorSlot, type ArmorStats, type ItemTier } from '@/lib/armor/types';
import { getCachedDefinitionTable } from '@/lib/db/manifest-store';

/** Componentes de la API que necesitamos solicitar */
export const PROFILE_COMPONENTS = [
  102, // ProfileInventories (bóveda)
  200, // Characters (Personajes: emblema, luz, clase)
  201, // CharacterInventories (inventario de personaje)
  205, // CharacterEquipment (items equipados)
  300, // ItemInstances (stats reales de cada instancia)
  304, // ItemStats (Valores base de armadura)
].join(',');

/**
 * Los hashes de bucket invertidos para lookup rápido.
 */
const BUCKET_TO_SLOT: Record<number, ArmorSlot> = {};
for (const [slot, hash] of Object.entries(ARMOR_BUCKET_HASHES)) {
  BUCKET_TO_SLOT[hash] = slot as ArmorSlot;
}

/** Hash del bucket del item de clase */
const CLASS_ITEM_BUCKET = ARMOR_BUCKET_HASHES.classItem;

/** Mapping de stat hash → stat name */
const STAT_HASH_TO_NAME: Record<number, StatName> = {};
for (const [name, hash] of Object.entries(STAT_HASHES)) {
  STAT_HASH_TO_NAME[hash] = name as StatName;
}

/** Tier rarity basado en tierType del Manifest */
function getTierFromType(tierType: number): ItemTier {
  switch (tierType) {
    case 6: return 'exotic';
    case 5: return 'legendary';
    case 4: return 'rare';
    default: return 'common';
  }
}

// ── Interfaz de respuesta cruda de Bungie ─────────────────────

interface RawProfileResponse {
  profileInventory?: {
    data?: {
      items: RawItem[];
    };
  };
  characters?: {
    data?: Record<string, RawCharacter>;
  };
  characterInventories?: {
    data?: Record<string, { items: RawItem[] }>;
  };
  characterEquipment?: {
    data?: Record<string, { items: RawItem[] }>;
  };
  itemComponents?: {
    instances?: {
      data?: Record<string, RawItemInstance>;
    };
    stats?: {
      data?: Record<string, { stats: Record<string, { statHash: number; value: number }> }>;
    };
  };
}

interface RawItem {
  itemHash: number;
  itemInstanceId?: string;
  bucketHash: number;
  quantity: number;
}

interface RawItemInstance {
  isEquipped: boolean;
  canEquip: boolean;
  energy?: {
    energyCapacity: number;
  };
}

interface RawCharacter {
  characterId: string;
  classType: number;
  light: number;
  emblemPath: string;
  emblemBackgroundPath: string;
}

export interface DestinyCharacter {
  id: string;
  classType: number;
  light: number;
  emblemUrl: string;
  emblemBackgroundUrl: string;
}

// ── Interfaz de definición del Manifest ───────────────────────

interface ManifestItemDefinition {
  hash: number;
  displayProperties: {
    name: string;
    icon?: string;
  };
  classType: number;
  inventory?: {
    tierType: number;
    bucketTypeHash: number;
  };
  itemCategoryHashes?: number[];
  quality?: {
    versions?: Array<{ powerCapHash: number }>;
  };
  iconWatermark?: string;
  stats?: {
    statGroupHash?: number;
    stats?: Record<string, { statHash: number; value: number }>;
  };
}

// ── Funciones principales ────────────────────────────────────

/**
 * Extrae los personajes de la cuenta.
 */
export function extractCharactersFromProfile(profileData: RawProfileResponse): DestinyCharacter[] {
  const characters: DestinyCharacter[] = [];
  const charsData = profileData.characters?.data;
  
  if (!charsData) return characters;

  for (const char of Object.values(charsData)) {
    characters.push({
      id: char.characterId,
      classType: char.classType,
      light: char.light,
      emblemUrl: char.emblemPath,
      emblemBackgroundUrl: char.emblemBackgroundPath,
    });
  }

  return characters;
}

/**
 * Extrae todas las armaduras del perfil del jugador.
 * Combina items de la bóveda, inventario y equipados.
 *
 * @param profileData - Respuesta cruda de GetProfile de la API de Bungie
 * @returns Lista de ArmorItems procesados y tipados
 */
export async function extractArmorFromProfile(
  profileData: RawProfileResponse
): Promise<ArmorItem[]> {
  // Cargar las definiciones de items del Manifest cacheado
  const itemDefs = await getCachedDefinitionTable<
    Record<string, ManifestItemDefinition>
  >('DestinyInventoryItemDefinition');

  if (!itemDefs) {
    throw new Error(
      'El Manifest no está cacheado. Descárgalo primero antes de procesar el inventario.'
    );
  }

  // Recoger todos los items crudos de todas las fuentes
  const allRawItems: Array<{ item: RawItem; isEquipped: boolean; location: 'vault' | 'character'; characterId?: string }> = [];

  // Bóveda (profile inventory)
  if (profileData.profileInventory?.data?.items) {
    for (const item of profileData.profileInventory.data.items) {
      allRawItems.push({ item, isEquipped: false, location: 'vault' });
    }
  }

  // Inventarios de personajes
  if (profileData.characterInventories?.data) {
    for (const [charId, charItems] of Object.entries(profileData.characterInventories.data)) {
      for (const item of charItems.items) {
        allRawItems.push({ item, isEquipped: false, location: 'character', characterId: charId });
      }
    }
  }

  // Items equipados
  if (profileData.characterEquipment?.data) {
    for (const [charId, charItems] of Object.entries(profileData.characterEquipment.data)) {
      for (const item of charItems.items) {
        allRawItems.push({ item, isEquipped: true, location: 'character', characterId: charId });
      }
    }
  }

  // Datos de instancias (stats reales)
  const instanceData = profileData.itemComponents?.instances?.data || {};
  const statsData = profileData.itemComponents?.stats?.data || {};

  // Filtrar y transformar a ArmorItems
  const armorItems: ArmorItem[] = [];

  for (const { item, isEquipped, location, characterId } of allRawItems) {
    // Solo items con instancia (no stacks genéricos)
    if (!item.itemInstanceId) continue;

    // Solo items que están en slots de armadura
    const slot = BUCKET_TO_SLOT[item.bucketHash];
    if (!slot) continue;

    // Buscar la definición en el Manifest
    const def = itemDefs[String(item.itemHash)];
    if (!def) continue;

    // Verificar que es armadura (categoría 20 = Armor)
    const isArmor = def.itemCategoryHashes?.includes(20) ?? false;
    if (!isArmor && item.bucketHash !== CLASS_ITEM_BUCKET) continue;

    // Determinar tier
    const tier = getTierFromType(def.inventory?.tierType || 0);

    // Solo legendary y exotic (no raras ni comunes)
    if (tier !== 'legendary' && tier !== 'exotic') continue;

    // Obtener stats de la instancia
    const baseStats = extractBaseStats(item.itemInstanceId, statsData);

    // Verificar si es masterworked
    const instance = instanceData[item.itemInstanceId];
    const isMasterworked = (instance?.energy?.energyCapacity || 0) >= 10;

    // Verificar si es Artifice (tiene categoría específica)
    const isArtifice = def.itemCategoryHashes?.includes(3124905401) ?? false;

    armorItems.push({
      itemHash: item.itemHash,
      instanceId: item.itemInstanceId,
      name: def.displayProperties?.name || 'Desconocido',
      icon: def.displayProperties?.icon || '',
      slot,
      classType: def.classType,
      tier,
      isExotic: tier === 'exotic',
      isMasterworked,
      isArtifice,
      baseStats,
      isEquipped,
      location,
      characterId,
      watermark: def.iconWatermark,
    });
  }

  return armorItems;
}

/**
 * Extrae los stats base de una instancia de item.
 */
function extractBaseStats(
  instanceId: string,
  statsData: Record<string, { stats: Record<string, { statHash: number; value: number }> }>
): ArmorStats {
  const stats = { ...EMPTY_STATS };
  const instanceStats = statsData[instanceId]?.stats;

  if (!instanceStats) return stats;

  for (const statEntry of Object.values(instanceStats)) {
    const statName = STAT_HASH_TO_NAME[statEntry.statHash];
    if (statName) {
      stats[statName] = statEntry.value;
    }
  }

  return stats;
}

/**
 * Agrupa las armaduras por slot para el optimizador.
 */
export function groupArmorBySlot(
  items: ArmorItem[],
  classType: number
): Record<ArmorSlot, ArmorItem[]> {
  const result: Record<ArmorSlot, ArmorItem[]> = {
    helmet: [],
    gauntlets: [],
    chest: [],
    legs: [],
    classItem: [],
  };

  for (const item of items) {
    // Solo items de la clase correcta o universales (classType 3)
    if (item.classType !== classType && item.classType !== 3) continue;
    result[item.slot].push(item);
  }

  return result;
}
