// ============================================================
// Destiny AI Forge — Web Worker de Permutación de Armaduras
// ============================================================
// Motor de búsqueda combinatoria que evalúa TODAS las permutaciones
// posibles de armadura (casco × brazos × pecho × piernas × clase)
// y retorna las mejores combinaciones según las prioridades de la IA.
//
// Se ejecuta en un hilo separado para no bloquear la UI.
// Reporta progreso periódicamente al hilo principal.
// ============================================================

import type {
  ArmorItem,
  ArmorSlot,
  OptimizerConfig,
  OptimizerResult,
  ArmorPermutation,
  WorkerInMessage,
  WorkerOutMessage,
} from '@/lib/armor/types';
import { evaluatePermutation } from '@/lib/armor/stat-calculator';

const ctx: Worker = self as unknown as Worker;

/** Cuántos resultados top retornar */
const MAX_TOP_RESULTS = 25;

/** Cada cuántas permutaciones reportar progreso */
const PROGRESS_INTERVAL = 5000;

/** Bandera de cancelación */
let cancelled = false;

// ── Listener Principal ───────────────────────────────────────

ctx.addEventListener('message', (event: MessageEvent<WorkerInMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'ping':
      postMsg({ type: 'pong' });
      break;

    case 'cancel':
      cancelled = true;
      break;

    case 'optimize':
      cancelled = false;
      try {
        const result = runOptimizer(message.config);
        postMsg({ type: 'result', data: result });
      } catch (error) {
        postMsg({
          type: 'error',
          message: error instanceof Error ? error.message : 'Error desconocido en el optimizador',
        });
      }
      break;
  }
});

// Señalar que el Worker está listo
postMsg({ type: 'ready' });

// ── Motor de Optimización ────────────────────────────────────

function runOptimizer(config: OptimizerConfig): OptimizerResult {
  const startTime = performance.now();

  const {
    armorBySlot,
    requiredExoticHash,
    tier1Stats,
    tier2Stats,
    minStatTargets,
    assumeMasterwork,
  } = config;

  // Preparar pools de armadura con lógica de exóticos
  const pools = prepareArmorPools(armorBySlot, requiredExoticHash);

  // Calcular total de permutaciones
  const totalPerms =
    pools.helmet.length *
    pools.gauntlets.length *
    pools.chest.length *
    pools.legs.length *
    pools.classItem.length;

  if (totalPerms === 0) {
    return {
      topResults: [],
      totalPermutations: 0,
      executionTimeMs: performance.now() - startTime,
      completed: true,
    };
  }

  // Array de mejores resultados (ordered insert)
  const topResults: ArmorPermutation[] = [];
  let evaluated = 0;

  // Iterar TODAS las permutaciones
  for (const helmet of pools.helmet) {
    if (cancelled) break;

    for (const gauntlets of pools.gauntlets) {
      if (cancelled) break;

      for (const chest of pools.chest) {
        if (cancelled) break;

        for (const legs of pools.legs) {
          if (cancelled) break;

          for (const classItem of pools.classItem) {
            evaluated++;

            // Reportar progreso periódicamente
            if (evaluated % PROGRESS_INTERVAL === 0) {
              const percent = Math.round((evaluated / totalPerms) * 100);
              postMsg({ type: 'progress', percent, evaluated });
            }

            // Verificar regla de exóticos: máximo 1 exótico por set
            // (ya manejado en prepareArmorPools, pero double-check)
            const exoticCount =
              (helmet.isExotic ? 1 : 0) +
              (gauntlets.isExotic ? 1 : 0) +
              (chest.isExotic ? 1 : 0) +
              (legs.isExotic ? 1 : 0) +
              (classItem.isExotic ? 1 : 0);

            if (exoticCount > 1) continue;

            // Evaluar la permutación
            const result = evaluatePermutation(
              { helmet, gauntlets, chest, legs, classItem },
              tier1Stats,
              tier2Stats,
              assumeMasterwork,
              minStatTargets,
              config.fragmentStatMods
            );

            // null = no cumple los targets mínimos
            if (!result) continue;

            // Insertar en los top results (mantener ordenado por score)
            insertSorted(topResults, result, MAX_TOP_RESULTS);
          }
        }
      }
    }
  }

  return {
    topResults,
    totalPermutations: evaluated,
    executionTimeMs: performance.now() - startTime,
    completed: !cancelled,
  };
}

// ── Preparación de Pools ─────────────────────────────────────

/**
 * Prepara los pools de armadura respetando la regla de exóticos de D2:
 * - Solo puedes equipar 1 pieza exótica de armadura
 * - Si la IA recomienda un exótico específico, se fija en su slot
 *   y todos los demás slots solo tienen legendarias
 */
function prepareArmorPools(
  armorBySlot: Record<ArmorSlot, ArmorItem[]>,
  requiredExoticHash: number
): Record<ArmorSlot, ArmorItem[]> {
  const pools: Record<ArmorSlot, ArmorItem[]> = {
    helmet: [],
    gauntlets: [],
    chest: [],
    legs: [],
    classItem: [],
  };

  // Si hay un exótico requerido, encontrar en qué slot está
  let exoticSlot: ArmorSlot | null = null;

  if (requiredExoticHash > 0) {
    for (const [slot, items] of Object.entries(armorBySlot)) {
      const hasExotic = items.some(
        (item) => item.itemHash === requiredExoticHash
      );
      if (hasExotic) {
        exoticSlot = slot as ArmorSlot;
        break;
      }
    }
  }

  for (const slot of Object.keys(pools) as ArmorSlot[]) {
    const items = armorBySlot[slot] || [];

    if (exoticSlot && slot === exoticSlot) {
      // Este slot: solo el exótico requerido
      pools[slot] = items.filter(
        (item) => item.itemHash === requiredExoticHash
      );
    } else if (exoticSlot && slot !== exoticSlot) {
      // Otros slots: solo legendarias (ya hay un exótico fijado)
      pools[slot] = items.filter((item) => !item.isExotic);
    } else {
      // Sin exótico requerido: incluir todo (la validación se hace en el loop)
      pools[slot] = items;
    }
  }

  return pools;
}

// ── Utilidades ───────────────────────────────────────────────

/** Inserta una permutación en un array ordenado por score (desc) */
function insertSorted(
  arr: ArmorPermutation[],
  item: ArmorPermutation,
  maxSize: number
): void {
  // Si el array está lleno y el item es peor que el último, ignorar
  if (arr.length >= maxSize && item.score <= arr[arr.length - 1].score) {
    return;
  }

  // Búsqueda binaria para encontrar la posición correcta
  let low = 0;
  let high = arr.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (arr[mid].score > item.score) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  arr.splice(low, 0, item);

  // Recortar si excede el tamaño máximo
  if (arr.length > maxSize) {
    arr.pop();
  }
}

/** Envía un mensaje tipado al hilo principal */
function postMsg(msg: WorkerOutMessage): void {
  ctx.postMessage(msg);
}
