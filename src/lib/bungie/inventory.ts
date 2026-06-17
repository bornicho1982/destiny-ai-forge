// ============================================================
// Destiny AI Forge — Servicio de Inventario del Guardián
// ============================================================
// Obtiene armas y armaduras del perfil del jugador vía Bungie API.
// ============================================================

import { STAT_HASHES, type StatName } from '@/lib/constants';
import { ARMOR_BUCKET_HASHES, EMPTY_STATS, type ArmorItem, type ArmorSlot, type ArmorStats, type ItemTier } from '@/lib/armor/types';
import { WEAPON_BUCKETS, DAMAGE_TYPES, type WeaponItem, type WeaponSlot, type AmmoType, type DamageType } from '@/lib/bungie/types-weapons';
import { getCachedDefinitionTable } from '@/lib/db/manifest-store';

/** Componentes de la API que necesitamos solicitar */
export const PROFILE_COMPONENTS = [
  102, // ProfileInventories (bóveda)
  200, // Characters (Personajes: emblema, luz, clase)
  201, // CharacterInventories (inventario de personaje)
  205, // CharacterEquipment (items equipados)
  300, // ItemInstances (stats reales de cada instancia)
  304, // ItemStats (Valores base)
].join(',');

const BUCKET_TO_ARMOR_SLOT: Record<number, ArmorSlot> = {};
for (const [slot, hash] of Object.entries(ARMOR_BUCKET_HASHES)) {
  BUCKET_TO_ARMOR_SLOT[hash] = slot as ArmorSlot;
}

const BUCKET_TO_WEAPON_SLOT: Record<number, WeaponSlot> = {
  [WEAPON_BUCKETS.KINETIC]: 'Kinetic',
  [WEAPON_BUCKETS.ENERGY]: 'Energy',
  [WEAPON_BUCKETS.POWER]: 'Power',
};

const CLASS_ITEM_BUCKET = ARMOR_BUCKET_HASHES.classItem;

const STAT_HASH_TO_NAME: Record<number, StatName> = {};
for (const [name, hash] of Object.entries(STAT_HASHES)) {
  STAT_HASH_TO_NAME[hash] = name as StatName;
}

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
  profileInventory?: { data?: { items: RawItem[] } };
  characters?: { data?: Record<string, RawCharacter> };
  characterInventories?: { data?: Record<string, { items: RawItem[] }> };
  characterEquipment?: { data?: Record<string, { items: RawItem[] }> };
  itemComponents?: {
    instances?: { data?: Record<string, RawItemInstance> };
    stats?: { data?: Record<string, { stats: Record<string, { statHash: number; value: number }> }> };
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
  damageType?: number;
  primaryStat?: { value: number }; // Power level
  energy?: { energyCapacity: number };
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
  displayProperties: { name: string; icon?: string };
  classType: number;
  inventory?: { tierType: number; bucketTypeHash: number };
  itemCategoryHashes?: number[];
  equippingBlock?: { ammoType: number };
  iconWatermark?: string;
}

export interface InventoryData {
  armors: ArmorItem[];
  weapons: WeaponItem[];
}

// ── Funciones principales ────────────────────────────────────

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

export async function extractInventoryFromProfile(
  profileData: RawProfileResponse
): Promise<InventoryData> {
  const itemDefs = await getCachedDefinitionTable<Record<string, ManifestItemDefinition>>('DestinyInventoryItemDefinition');
  if (!itemDefs) throw new Error('Manifest no cacheado.');

  const allRawItems: Array<{ item: RawItem; isEquipped: boolean; location: 'vault' | 'character'; characterId?: string }> = [];

  if (profileData.profileInventory?.data?.items) {
    for (const item of profileData.profileInventory.data.items) {
      allRawItems.push({ item, isEquipped: false, location: 'vault' });
    }
  }

  if (profileData.characterInventories?.data) {
    for (const [charId, charItems] of Object.entries(profileData.characterInventories.data)) {
      for (const item of charItems.items) {
        allRawItems.push({ item, isEquipped: false, location: 'character', characterId: charId });
      }
    }
  }

  if (profileData.characterEquipment?.data) {
    for (const [charId, charItems] of Object.entries(profileData.characterEquipment.data)) {
      for (const item of charItems.items) {
        allRawItems.push({ item, isEquipped: true, location: 'character', characterId: charId });
      }
    }
  }

  const instanceData = profileData.itemComponents?.instances?.data || {};
  const statsData = profileData.itemComponents?.stats?.data || {};

  const armors: ArmorItem[] = [];
  const weapons: WeaponItem[] = [];

  for (const { item, isEquipped, location, characterId } of allRawItems) {
    if (!item.itemInstanceId) continue;
    const def = itemDefs[String(item.itemHash)];
    if (!def) continue;

    const instance = instanceData[item.itemInstanceId];
    const tier = getTierFromType(def.inventory?.tierType || 0);
    const isMasterworked = (instance?.energy?.energyCapacity || 0) >= 10;
    
    // Check if Armor
    const armorSlot = BUCKET_TO_ARMOR_SLOT[item.bucketHash];
    if (armorSlot) {
      const isArmor = def.itemCategoryHashes?.includes(20) ?? false;
      if (isArmor || item.bucketHash === CLASS_ITEM_BUCKET) {
        if (tier === 'legendary' || tier === 'exotic') {
          const baseStats = extractBaseStats(item.itemInstanceId, statsData);
          const isArtifice = def.itemCategoryHashes?.includes(3124905401) ?? false;

          armors.push({
            itemHash: item.itemHash,
            instanceId: item.itemInstanceId,
            name: def.displayProperties?.name || 'Desconocido',
            icon: def.displayProperties?.icon || '',
            slot: armorSlot,
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
      }
      continue;
    }

    // Check if Weapon
    const weaponSlot = BUCKET_TO_WEAPON_SLOT[item.bucketHash];
    if (weaponSlot) {
      const isWeapon = def.itemCategoryHashes?.includes(1) ?? false;
      if (isWeapon) {
        // En Destiny, ammoType = 1 (Primary), 2 (Special), 3 (Heavy)
        let ammo: AmmoType = 'Primary';
        if (def.equippingBlock?.ammoType === 2) ammo = 'Special';
        if (def.equippingBlock?.ammoType === 3) ammo = 'Heavy';

        const damageTypeHash = instance?.damageType || 1;
        const damageType = DAMAGE_TYPES[damageTypeHash] || 'Kinetic';
        const powerLevel = instance?.primaryStat?.value || 1900;
        
        // Asumimos masterwork si es exótico, o tiene masterwork trackable (simplificado por ahora)
        const isWepMasterwork = tier === 'exotic' || (def.itemCategoryHashes?.includes(3109687656) ?? false);

        weapons.push({
          id: item.itemInstanceId,
          itemHash: item.itemHash,
          name: def.displayProperties?.name || 'Desconocido',
          icon: def.displayProperties?.icon || '',
          tier: tier === 'exotic' ? 'Exotic' : tier === 'legendary' ? 'Legendary' : tier === 'rare' ? 'Rare' : 'Common',
          slot: weaponSlot,
          ammoType: ammo,
          damageType,
          powerLevel,
          isMasterwork: isWepMasterwork,
          isCrafted: def.itemCategoryHashes?.includes(3072652150) ?? false,
          location,
          characterId,
          isEquipped,
          watermark: def.iconWatermark,
        });
      }
    }
  }

  return { armors, weapons };
}

function extractBaseStats(instanceId: string, statsData: Record<string, any>): ArmorStats {
  const stats = { ...EMPTY_STATS };
  const instanceStats = statsData[instanceId]?.stats;
  if (!instanceStats) return stats;

  for (const statEntry of Object.values<any>(instanceStats)) {
    const statName = STAT_HASH_TO_NAME[statEntry.statHash];
    if (statName) {
      stats[statName] = statEntry.value;
    }
  }
  return stats;
}

export function groupArmorBySlot(items: ArmorItem[], classType: number): Record<ArmorSlot, ArmorItem[]> {
  const result: Record<ArmorSlot, ArmorItem[]> = { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] };
  for (const item of items) {
    if (item.classType !== classType && item.classType !== 3) continue;
    result[item.slot].push(item);
  }
  return result;
}
