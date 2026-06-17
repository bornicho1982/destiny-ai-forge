// ============================================================
// Destiny AI Forge — Calculadora de Stats de Armadura
// ============================================================
// Funciones puras para calcular stats totales, tiers, puntuación
// de calidad, y waste de un set de armaduras.
// Diseñado para ejecutarse dentro del Web Worker (sin dependencias DOM).
// ============================================================

import type { StatName } from '@/lib/constants';
import type { ArmorItem, ArmorStats, ArmorPermutation } from './types';
import { EMPTY_STATS } from './types';

export const ALL_STATS: StatName[] = [
  'mobility', 'resilience', 'recovery',
  'discipline', 'intellect', 'strength',
];

const MASTERWORK_BONUS_PER_PIECE = 2;
const MAX_TIER = 10;
const POINTS_PER_TIER = 10;

// ── Cálculo de Stats ─────────────────────────────────────────

export function sumBaseStats(
  pieces: ArmorItem[],
  assumeMasterwork: boolean,
  fragmentStatMods?: Partial<ArmorStats>
): ArmorStats {
  const total = { ...EMPTY_STATS };

  for (const piece of pieces) {
    for (const stat of ALL_STATS) {
      total[stat] += piece.baseStats[stat];
      if (assumeMasterwork || piece.isMasterworked) {
        total[stat] += MASTERWORK_BONUS_PER_PIECE;
      }
    }
  }

  if (fragmentStatMods) {
    for (const [statName, value] of Object.entries(fragmentStatMods)) {
      if (value) {
        total[statName as StatName] += value;
      }
    }
  }

  return total;
}

export function optimizeArtificeStats(
  baseStats: ArmorStats,
  artificeCount: number,
  tier1Stats: StatName[],
  tier2Stats: StatName[]
): ArmorStats {
  const extraStats = { ...EMPTY_STATS };
  if (artificeCount === 0) return extraStats;

  const statPriorities = [
    ...tier1Stats,
    ...tier2Stats,
    ...ALL_STATS.filter(s => !tier1Stats.includes(s) && !tier2Stats.includes(s))
  ];

  for (let i = 0; i < artificeCount; i++) {
    let bestStatToBoost: StatName | null = null;

    for (const stat of statPriorities) {
      const currentVal = baseStats[stat] + extraStats[stat];
      if (currentVal >= MAX_TIER * POINTS_PER_TIER) continue;

      const excess = currentVal % POINTS_PER_TIER;
      const neededForNextTier = POINTS_PER_TIER - excess;
      
      if (neededForNextTier > 0 && neededForNextTier <= 3) {
        bestStatToBoost = stat;
        break; 
      }
    }

    if (!bestStatToBoost) {
      for (const stat of statPriorities) {
         const currentVal = baseStats[stat] + extraStats[stat];
         if (currentVal < MAX_TIER * POINTS_PER_TIER) {
           bestStatToBoost = stat;
           break;
         }
      }
    }

    if (bestStatToBoost) {
      extraStats[bestStatToBoost] += 3;
    }
  }

  return extraStats;
}

/**
 * Asigna automáticamente mods de armadura (+10 o +5) para maximizar los Tiers.
 * Máximo 5 mods (uno por pieza).
 */
export function assignStatMods(
  currentStats: ArmorStats,
  tier1Stats: StatName[],
  tier2Stats: StatName[],
  maxMods = 5
): { stat: StatName; value: number }[] {
  const mods: { stat: StatName; value: number }[] = [];
  const stats = { ...currentStats };
  let remainingMods = maxMods;

  const statPriorities = [
    ...tier1Stats,
    ...tier2Stats,
    ...ALL_STATS.filter(s => !tier1Stats.includes(s) && !tier2Stats.includes(s))
  ];

  for (const stat of statPriorities) {
    while (remainingMods > 0 && stats[stat] < 100) {
       const needed = 100 - stats[stat];
       const excess = stats[stat] % 10;
       const neededForNextTier = 10 - excess;

       // Evitamos poner mods en stats negativos por fragmentos hasta que se recuperen,
       // o simplemente ponemos el +10 genérico.
       if (neededForNextTier > 0 && neededForNextTier <= 5 && stats[stat] >= 0) {
         mods.push({ stat, value: 5 });
         stats[stat] += 5;
         remainingMods--;
       } 
       else if (needed >= 10 || neededForNextTier > 5 || stats[stat] < 0) {
         mods.push({ stat, value: 10 });
         stats[stat] += 10;
         remainingMods--;
       } else {
         break;
       }
    }
  }

  return mods;
}

export function statsToTiers(stats: ArmorStats): ArmorStats {
  const tiers = { ...EMPTY_STATS };
  for (const stat of ALL_STATS) {
    const finalVal = Math.max(0, stats[stat]);
    tiers[stat] = Math.min(Math.floor(finalVal / POINTS_PER_TIER), MAX_TIER);
  }
  return tiers;
}

export function totalTierCount(tiers: ArmorStats): number {
  let total = 0;
  for (const stat of ALL_STATS) {
    total += tiers[stat];
  }
  return total;
}

export function calculateWastedStats(stats: ArmorStats): number {
  let wasted = 0;
  for (const stat of ALL_STATS) {
    const finalVal = Math.max(0, stats[stat]);
    const excess = finalVal % POINTS_PER_TIER;
    if (finalVal < MAX_TIER * POINTS_PER_TIER) {
      wasted += excess;
    } else if (finalVal > MAX_TIER * POINTS_PER_TIER) {
       wasted += (finalVal - MAX_TIER * POINTS_PER_TIER);
    }
  }
  return wasted;
}

export function calculateScore(
  tiers: ArmorStats,
  wastedStats: number,
  tier1Stats: StatName[],
  tier2Stats: StatName[]
): number {
  let score = 0;
  for (const stat of tier1Stats) {
    score += tiers[stat] * 100;
  }
  for (const stat of tier2Stats) {
    score += tiers[stat] * 30;
  }
  for (const stat of ALL_STATS) {
    score += tiers[stat] * 5;
  }
  score -= wastedStats;
  return score;
}

export function meetsMinimumTargets(
  tiers: ArmorStats,
  minTargets: Partial<ArmorStats>
): boolean {
  for (const [stat, minTier] of Object.entries(minTargets)) {
    if (minTier !== undefined && tiers[stat as StatName] < minTier) {
      return false;
    }
  }
  return true;
}

// ── Evaluación Completa ──────────────────────────────────────

export function evaluatePermutation(
  pieces: {
    helmet: ArmorItem;
    gauntlets: ArmorItem;
    chest: ArmorItem;
    legs: ArmorItem;
    classItem: ArmorItem;
  },
  tier1Stats: StatName[],
  tier2Stats: StatName[],
  assumeMasterwork: boolean,
  minTargets?: Partial<ArmorStats>,
  fragmentStatMods?: Partial<ArmorStats>
): ArmorPermutation | null {
  const allPieces = [
    pieces.helmet,
    pieces.gauntlets,
    pieces.chest,
    pieces.legs,
    pieces.classItem,
  ];

  const baseStatsTotal = sumBaseStats(allPieces, assumeMasterwork, fragmentStatMods);
  const artificeCount = allPieces.filter(p => p.isArtifice).length;
  const artificeStats = optimizeArtificeStats(baseStatsTotal, artificeCount, tier1Stats, tier2Stats);
  
  const statsBeforeMods = { ...EMPTY_STATS };
  for (const stat of ALL_STATS) {
     statsBeforeMods[stat] = baseStatsTotal[stat] + artificeStats[stat];
  }

  // Comprobar targets mínimos con stats BASE + Artífice + Fragmentos
  const baseTiers = statsToTiers(statsBeforeMods);
  if (minTargets && !meetsMinimumTargets(baseTiers, minTargets)) {
    return null;
  }

  // Calcular los mods que se podrían equipar
  const statMods = assignStatMods(statsBeforeMods, tier1Stats, tier2Stats, 5);

  // Sumar los mods para los resultados finales
  const totalStatsWithMods = { ...statsBeforeMods };
  for (const mod of statMods) {
    totalStatsWithMods[mod.stat] += mod.value;
  }

  // Tiers finales (lo que mostraremos al usuario)
  const finalTiers = statsToTiers(totalStatsWithMods);
  const totalTiersCount = totalTierCount(finalTiers);
  
  // Para el scoring interno del worker, seguimos usando los tiers base sin mods
  // o con mods? Si usamos los tiers con mods, el algoritmo siempre buscará armaduras
  // que lleguen a los mejores tiers independientemente de si dependen de mods o no.
  // Usar los tiers CON mods es mejor porque refleja el "Max Potential".
  const wastedStats = calculateWastedStats(totalStatsWithMods);
  const score = calculateScore(finalTiers, wastedStats, tier1Stats, tier2Stats);

  return {
    pieces,
    totalStats: totalStatsWithMods, // Enviamos el total CON mods para el UI
    tiers: finalTiers,
    totalTiers: totalTiersCount,
    totalTiersWithMods: totalTiersCount, // Para compatibilidad
    wastedStats,
    score,
    artificeStats,
    statMods,
  };
}
