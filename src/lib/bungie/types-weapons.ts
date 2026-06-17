// ============================================================
// Destiny AI Forge — Tipos de Armas
// ============================================================
// Interfaces y hashes constantes para el manejo de armas
// en el inventario completo.
// ============================================================

export type WeaponSlot = 'Kinetic' | 'Energy' | 'Power';
export type AmmoType = 'Primary' | 'Special' | 'Heavy';
export type DamageType = 'Kinetic' | 'Arc' | 'Solar' | 'Void' | 'Stasis' | 'Strand';

export interface WeaponItem {
  id: string; // instanceId
  itemHash: number;
  name: string;
  icon: string;
  watermark?: string;
  tier: 'Exotic' | 'Legendary' | 'Rare' | 'Common';
  
  slot: WeaponSlot;
  ammoType: AmmoType;
  damageType: DamageType;
  
  powerLevel: number;
  isMasterwork: boolean;
  isCrafted: boolean;
  
  location: 'vault' | 'character' | 'postmaster';
  characterId?: string;
  isEquipped: boolean;
  
  // Perks relevantes (opcional, para tooltips)
  perks?: {
    hash: number;
    name: string;
    icon: string;
  }[];
}

// ============================================================
// Hashes de los Buckets de Armas (InventoryBucketDefinition)
// ============================================================
export const WEAPON_BUCKETS = {
  KINETIC: 1498876634,
  ENERGY: 2465295065,
  POWER: 953998645,
};

// ============================================================
// Hashes de Damage Types (DestinyDamageTypeDefinition)
// ============================================================
export const DAMAGE_TYPES: Record<number, DamageType> = {
  1: 'Kinetic',
  2: 'Arc',
  3: 'Solar',
  4: 'Void',
  6: 'Stasis',
  7: 'Strand',
};
