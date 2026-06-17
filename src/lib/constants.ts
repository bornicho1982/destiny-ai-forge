// ============================================================
// Destiny AI Forge — Constants & Configuration
// ============================================================

// ── Bungie API URLs ──────────────────────────────────────────
export const BUNGIE = {
  API_ROOT: 'https://www.bungie.net/Platform',
  AUTH_URL: 'https://www.bungie.net/en/OAuth/Authorize',
  TOKEN_URL: 'https://www.bungie.net/Platform/App/OAuth/token/',
  CDN_ROOT: 'https://www.bungie.net',
} as const;

// ── OAuth Scopes ─────────────────────────────────────────────
// These are implicit in the Bungie app registration, not sent as params.
// Listed here for documentation purposes.
export const BUNGIE_SCOPES = [
  'ReadBasicUserProfile',
  'ReadDestinyInventoryAndVault',
  'MoveEquipDestinyItems',
] as const;

// ── Destiny 2 Damage Types ──────────────────────────────────
// From DestinyDamageTypeDefinition in the Manifest
export const DAMAGE_TYPE_HASHES = {
  KINETIC: 3373582085,
  ARC: 2303181850,
  SOLAR: 1847026933,
  VOID: 3454344768,
  STASIS: 151347233,
  STRAND: 3949783978,
} as const;

// ── Guardian Classes ────────────────────────────────────────
export const GUARDIAN_CLASSES = ['titan', 'hunter', 'warlock'] as const;
export type GuardianClass = (typeof GUARDIAN_CLASSES)[number];

// ── Subclass Elements ───────────────────────────────────────
export const SUBCLASS_ELEMENTS = [
  'solar',
  'arc',
  'void',
  'stasis',
  'strand',
  'prismatic',
] as const;
export type SubclassElement = (typeof SUBCLASS_ELEMENTS)[number];

// ── Character Stats ─────────────────────────────────────────
export const STAT_NAMES = [
  'mobility',
  'resilience',
  'recovery',
  'discipline',
  'intellect',
  'strength',
] as const;
export type StatName = (typeof STAT_NAMES)[number];

// ── Stat Hash IDs (from DestinyStatDefinition) ──────────────
export const STAT_HASHES: Record<StatName, number> = {
  mobility: 2996146975,
  resilience: 392767087,
  recovery: 1943323491,
  discipline: 1735777505,
  intellect: 144602215,
  strength: 4244567218,
} as const;

// ── Session Cookie Config ───────────────────────────────────
export const SESSION_COOKIE_NAME = 'destiny-forge-session';
export const STATE_COOKIE_NAME = 'destiny-forge-oauth-state';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

// ── OpenRouter AI Config ────────────────────────────────────
export const AI_CONFIG = {
  OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
  MODEL: 'meta-llama/llama-3-8b-instruct:free',
  FALLBACK_MODEL: 'mistralai/mistral-7b-instruct:free',
  MAX_RETRIES: 3,
  MAX_TOKENS: 1024,
  TEMPERATURE: 0.7,
} as const;

// ── WebLLM Local AI Config ──────────────────────────────────
export const LOCAL_AI_CONFIG = {
  // Gemma 2 2B (2000 millones de parámetros) optimizado a 4-bits.
  // Es extremadamente rápido y requiere ~1.6 GB de RAM de video.
  MODEL_ID: 'gemma-2-2b-it-q4f32_1-MLC',
  SYSTEM_PROMPT_TEMPERATURE: 0.7,
};
