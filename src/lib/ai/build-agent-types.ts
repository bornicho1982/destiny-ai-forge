// ============================================================
// Destiny AI Forge — Tipos del Build Agent (Nuevo Contrato)
// ============================================================
// Define la interfaz BuildAgentStrategy con los campos avanzados
// incluyendo targetSubclassHash y negativeStatFragments.
// ============================================================

import type { SubclassElement, StatName, GuardianClass } from '@/lib/constants';

/**
 * Estrategia de build devuelta por el Build Agent (Gemma 4).
 * Este es el contrato JSON estricto entre la IA y el Web Worker.
 *
 * Campos clave:
 * - `targetSubclassHash`: Hash real del DestinyInventoryItemDefinition de la subclase
 * - `negativeStatFragments`: Penalizaciones de stats de los fragmentos recomendados
 */
export interface BuildAgentStrategy {
  /** Elemento de la subclase (para display rápido sin consultar el Manifest) */
  subclass: SubclassElement;

  /** Hash del DestinyInventoryItemDefinition de la subclase completa */
  targetSubclassHash: number;

  /** Hash del exótico de armadura recomendado */
  requiredExoticHash: number;

  /** Nombre legible del exótico (display antes de cargar Manifest) */
  requiredExoticName: string;

  /**
   * Stats ordenados de mayor a menor prioridad.
   * El optimizador usa esta lista para ponderar los tiers.
   * Ejemplo: ["resilience", "discipline", "recovery"] 
   */
  statPriorities: StatName[];

  /**
   * Penalizaciones de stats de los fragmentos recomendados.
   * Array de valores negativos que el Web Worker restará del cálculo total.
   *
   * Formato: hash del stat → penalización
   * Ejemplo: un fragmento que da -10 Discipline se expresaría
   * como una entrada en el array de fragmentos que el worker
   * debe descontar del resultado final.
   */
  negativeStatFragments: FragmentStatPenalty[];

  /** Hashes de los 2 Aspects recomendados */
  recommendedAspectHashes: number[];

  /** Hashes de los 3-5 Fragments recomendados */
  recommendedFragmentHashes: number[];

  /** Explicación de 2-4 frases sobre la sinergia y el loop de gameplay */
  reasoning: string;
}

/**
 * Penalización de stat de un fragmento específico.
 * El Web Worker resta estos valores del total calculado.
 */
export interface FragmentStatPenalty {
  /** Hash del fragmento (DestinyInventoryItemDefinition) */
  fragmentHash: number;
  /** Nombre legible del fragmento */
  fragmentName: string;
  /** Nombre del stat afectado */
  statName: StatName;
  /** Valor de la penalización (número negativo, ej: -10) */
  penalty: number;
}

/**
 * Request body para POST /api/build-agent
 */
export interface BuildAgentRequest {
  /** Prompt en lenguaje natural del usuario */
  prompt: string;
  /** Clase del guardián */
  guardianClass: GuardianClass;
  /** Contexto de actividad opcional */
  activityContext?: 'raid' | 'dungeon' | 'grandmaster' | 'pvp' | 'general';
  /** Nombres de los exóticos que el jugador posee en el inventario o bóveda */
  playerExotics?: string[];
}

/**
 * Respuesta del endpoint /api/build-agent
 */
export interface BuildAgentResponse {
  success: boolean;
  strategy?: BuildAgentStrategy;
  error?: string;
  /** Modelo de IA utilizado (para debug/display) */
  model?: string;
}
