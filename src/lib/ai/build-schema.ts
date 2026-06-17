// ============================================================
// Destiny AI Forge — JSON Schema for Gemini Structured Output
// ============================================================
// This schema is passed to Gemini's `responseSchema` config to enforce
// strict JSON structure. Gemini will ONLY return data matching this shape.
// ============================================================

import type { Type } from '@google/genai';

/**
 * JSON Schema for the BuildStrategy response.
 * Uses the Google GenAI SDK schema format (subset of JSON Schema).
 *
 * This ensures Gemini's output is machine-parseable and matches
 * our TypeScript BuildStrategy interface exactly.
 */
export const BUILD_STRATEGY_SCHEMA: Record<string, unknown> = {
  type: 'OBJECT' as Type,
  properties: {
    subclass: {
      type: 'STRING' as Type,
      enum: ['solar', 'arc', 'void', 'stasis', 'strand', 'prismatic'],
      description: 'The recommended subclass element for this build.',
    },
    requiredExoticHash: {
      type: 'NUMBER' as Type,
      description:
        'The Destiny 2 Manifest hash (unsigned 32-bit integer) of the recommended exotic armor piece. Use 0 if uncertain.',
    },
    requiredExoticName: {
      type: 'STRING' as Type,
      description: 'Human-readable name of the recommended exotic armor piece.',
    },
    recommendedAspectHashes: {
      type: 'ARRAY' as Type,
      items: {
        type: 'NUMBER' as Type,
      },
      description:
        'Array of 2 Manifest hashes for recommended Aspects. Use 0 for any uncertain hashes.',
    },
    recommendedFragmentHashes: {
      type: 'ARRAY' as Type,
      items: {
        type: 'NUMBER' as Type,
      },
      description:
        'Array of 3-5 Manifest hashes for recommended Fragments. Use 0 for any uncertain hashes.',
    },
    statPriorities: {
      type: 'OBJECT' as Type,
      properties: {
        tier1: {
          type: 'ARRAY' as Type,
          items: {
            type: 'STRING' as Type,
            enum: [
              'mobility',
              'resilience',
              'recovery',
              'discipline',
              'intellect',
              'strength',
            ],
          },
          description:
            'Array of 2-3 stat names that are the highest priority for the armor optimizer.',
        },
        tier2: {
          type: 'ARRAY' as Type,
          items: {
            type: 'STRING' as Type,
            enum: [
              'mobility',
              'resilience',
              'recovery',
              'discipline',
              'intellect',
              'strength',
            ],
          },
          description:
            'Array of 2-3 stat names that are secondary priority for the armor optimizer.',
        },
      },
      required: ['tier1', 'tier2'],
    },
    reasoning: {
      type: 'STRING' as Type,
      description:
        'A 2-4 sentence explanation of why this build works, describing the synergy chain and gameplay loop.',
    },
  },
  required: [
    'subclass',
    'requiredExoticHash',
    'requiredExoticName',
    'recommendedAspectHashes',
    'recommendedFragmentHashes',
    'statPriorities',
    'reasoning',
  ],
};
