// ============================================================
// Destiny AI Forge — Tipos de Armadura e Inventario
// ============================================================
// Interfaces TypeScript para representar las piezas de armadura
// del guardián, sus stats, y los resultados de la optimización.
// ============================================================

import type { StatName } from '@/lib/constants';

// ── Enums de Armadura ────────────────────────────────────────

/** Slots de armadura (buckets en el Manifest) */
export const ARMOR_SLOTS = ['helmet', 'gauntlets', 'chest', 'legs', 'classItem'] as const;
export type ArmorSlot = (typeof ARMOR_SLOTS)[number];

/** Bucket hashes del Manifest para cada slot de armadura */
export const ARMOR_BUCKET_HASHES: Record<ArmorSlot, number> = {
  helmet: 3448274439,
  gauntlets: 3551918588,
  chest: 14239492,
  legs: 20886954,
  classItem: 1585787867,
} as const;

/** Tier de rareza */
export type ItemTier = 'exotic' | 'legendary' | 'rare' | 'common';

// ── Pieza de Armadura ────────────────────────────────────────

/** Representa una pieza de armadura del inventario del jugador */
export interface ArmorItem {
  /** Hash del item en el Manifest (identificador del tipo de armadura) */
  itemHash: number;
  /** ID de instancia único (identifica esta copia específica) */
  instanceId: string;
  /** Nombre del item (resuelto desde el Manifest) */
  name: string;
  /** Icono del item (path relativo desde bungie.net) */
  icon: string;
  /** Slot de armadura */
  slot: ArmorSlot;
  /** Clase del guardián (0=Titan, 1=Hunter, 2=Warlock, 3=Universal) */
  classType: number;
  /** Tier de rareza */
  tier: ItemTier;
  /** ¿Es exótico? */
  isExotic: boolean;
  /** ¿Está masterworked? (+2 a todos los stats) */
  isMasterworked: boolean;
  /** ¿Es armadura Artifice? (slot extra de +3) */
  isArtifice: boolean;
  /** Stats base de la armadura (sin mods, sin masterwork) */
  baseStats: ArmorStats;
  /** ¿Está actualmente equipado? */
  isEquipped: boolean;
  /** Ubicación del item: en la bóveda o en un personaje */
  location?: 'vault' | 'character';
  /** ID del personaje si location === 'character' */
  characterId?: string;
  /** Marca de agua (season/expansion) */
  watermark?: string;
}

/** Stats de armadura como record tipado */
export type ArmorStats = Record<StatName, number>;

/** Stats vacíos (útil como valor por defecto) */
export const EMPTY_STATS: ArmorStats = {
  mobility: 0,
  resilience: 0,
  recovery: 0,
  discipline: 0,
  intellect: 0,
  strength: 0,
};

// ── Motor de Optimización ────────────────────────────────────

/** Configuración de entrada para el Web Worker */
export interface OptimizerConfig {
  /** Piezas de armadura disponibles agrupadas por slot */
  armorBySlot: Record<ArmorSlot, ArmorItem[]>;
  /** Hash del exótico requerido (de la estrategia IA) — 0 si no hay restricción */
  requiredExoticHash: number;
  /** Stats de prioridad tier 1 (maximizar primero) */
  tier1Stats: StatName[];
  /** Stats de prioridad tier 2 (maximizar después) */
  tier2Stats: StatName[];
  /** Targets mínimos de stats (opcionales) */
  minStatTargets?: Partial<ArmorStats>;
  /** ¿Asumir que todas las piezas están masterworked? */
  assumeMasterwork: boolean;
  /** Modificadores fijos de stats que provienen de fragmentos (ej: { discipline: -10, recovery: 10 }) */
  fragmentStatMods?: Partial<ArmorStats>;
}

/** Una combinación de 5 piezas de armadura + sus stats resultantes */
export interface ArmorPermutation {
  /** Las piezas que forman este set */
  pieces: {
    helmet: ArmorItem;
    gauntlets: ArmorItem;
    chest: ArmorItem;
    legs: ArmorItem;
    classItem: ArmorItem;
  };
  /** Stats totales del set (base + masterwork si aplica) */
  totalStats: ArmorStats;
  /** Tiers de stats (stat / 10, redondeado abajo, máx 10) */
  tiers: ArmorStats;
  /** Total de tiers combinados */
  totalTiers: number;
  /** Stats desperdiciados (puntos sobre el siguiente tier) */
  wastedStats: number;
  /** Puntuación de calidad (mayor = mejor según las prioridades) */
  score: number;
  /** Puntos asignados por piezas de Artificio para cuadrar tiers */
  artificeStats?: ArmorStats;
  /** Lista de mods de armadura recomendados para alcanzar los Tiers calculados */
  statMods?: { stat: StatName; value: number }[];
  /** Tiers finales contando mods de armadura (el Max Tier Posible) */
  totalTiersWithMods?: number;
}

/** Resultado completo del optimizador */
export interface OptimizerResult {
  /** Las mejores N permutaciones ordenadas por score */
  topResults: ArmorPermutation[];
  /** Total de permutaciones evaluadas */
  totalPermutations: number;
  /** Tiempo de ejecución en ms */
  executionTimeMs: number;
  /** Si se completó la búsqueda (podría cortarse por timeout) */
  completed: boolean;
}

// ── Mensajes del Web Worker ──────────────────────────────────

/** Mensajes que el hilo principal envía al Worker */
export type WorkerInMessage =
  | { type: 'optimize'; config: OptimizerConfig }
  | { type: 'ping' }
  | { type: 'cancel' };

/** Mensajes que el Worker envía al hilo principal */
export type WorkerOutMessage =
  | { type: 'ready' }
  | { type: 'pong' }
  | { type: 'progress'; percent: number; evaluated: number }
  | { type: 'result'; data: OptimizerResult }
  | { type: 'error'; message: string };
