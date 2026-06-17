// ============================================================
// Destiny AI Forge — AI Build Strategy TypeScript Interfaces
// ============================================================
// These types define the strict contract between the Gemini AI
// and the future Web Worker permutation engine.
// The AI outputs STRATEGY (what to build), not MATH (how to build it).
// ============================================================

import type { SubclassElement, StatName, GuardianClass } from '@/lib/constants';

export interface NegativeStatFragment {
  fragmentHash: number;
  fragmentName: string;
  statName: StatName;
  penalty: number;
}

/**
 * The core output from the AI build advisor.
 * This is what Gemini returns (via structured output) and what
 * the Web Worker will consume to optimize armor stats.
 */
export interface BuildStrategy {
  /** The recommended subclass element */
  subclass: SubclassElement;

  /** The required exotic armor piece's Manifest hash */
  requiredExoticHash: number;

  /** Human-readable name of the exotic (for display before Manifest loads) */
  requiredExoticName: string;

  /** Recommended Aspect hashes from the Manifest */
  recommendedAspectHashes: number[];

  /** Recommended Fragment hashes from the Manifest */
  recommendedFragmentHashes: number[];

  /** Fragmentos que modifican los stats fijos (penalizaciones o bonus) */
  negativeStatFragments?: NegativeStatFragment[];

  /** Stat priority tiers for the armor optimizer (es un array porque el prompt devuelve ["res", "rec", "dis"]) */
  statPriorities: StatName[];

  /** Brief explanation of WHY this build works (synergies, strategy) */
  reasoning: string;
}

/**
 * Request body for the /api/ai/build-strategy endpoint.
 */
export interface BuildStrategyRequest {
  /** The user's natural language prompt (e.g., "Hunter build for raids") */
  prompt: string;

  /** The guardian class to build for */
  guardianClass: GuardianClass;

  /** Optional: specific activity context */
  activityContext?: 'raid' | 'dungeon' | 'grandmaster' | 'pvp' | 'general';
}

/**
 * Full API response wrapping the BuildStrategy.
 */
export interface BuildStrategyResponse {
  success: boolean;
  strategy?: BuildStrategy;
  error?: string;
}
