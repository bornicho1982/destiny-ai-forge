// ============================================================
// Destiny AI Forge — Google GenAI SDK Client Initialization
// ============================================================
// Initializes the @google/genai client with error handling.
// Uses gemini-2.0-flash (free tier) for development.
// ============================================================

import { GoogleGenAI } from '@google/genai';

/** The Gemini model to use. */
export const GEMINI_MODEL = 'gemini-2.5-flash';

/** Singleton GenAI client instance */
let genaiClient: GoogleGenAI | null = null;

/**
 * Returns a configured GoogleGenAI client instance.
 * Uses singleton pattern to avoid creating multiple clients.
 *
 * @throws Error if GEMINI_API_KEY is not configured
 */
export function getGenAIClient(): GoogleGenAI {
  if (genaiClient) return genaiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[Destiny AI Forge] GEMINI_API_KEY is not configured. ' +
      'Get a free key at: https://aistudio.google.com/apikey'
    );
  }

  genaiClient = new GoogleGenAI({ apiKey });
  return genaiClient;
}
