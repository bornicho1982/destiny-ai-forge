// ============================================================
// Destiny AI Forge — AI Build Strategy API Route
// ============================================================
// POST /api/ai/build-strategy
// Receives a natural language prompt + guardian class, calls Gemini
// with our D2 expert system prompt, and returns a strict JSON
// BuildStrategy for the Web Worker to consume.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getGenAIClient, GEMINI_MODEL } from '@/lib/ai/gemini-client';
import { getSystemPrompt } from '@/lib/ai/system-prompt';
import { BUILD_STRATEGY_SCHEMA } from '@/lib/ai/build-schema';
import { GUARDIAN_CLASSES } from '@/lib/constants';
import { isAuthenticated } from '@/lib/auth/session';
import type { BuildStrategy, BuildStrategyRequest } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    // ── 1. Authentication check ────────────────────────────
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // ── 2. Validate request body ───────────────────────────
    let body: BuildStrategyRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body.' },
        { status: 400 }
      );
    }

    const { prompt, guardianClass, activityContext } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'A build prompt is required.' },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Prompt is too long (max 1000 characters).' },
        { status: 400 }
      );
    }

    if (!guardianClass || !GUARDIAN_CLASSES.includes(guardianClass)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid guardian class. Must be one of: ${GUARDIAN_CLASSES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // ── 3. Build the user prompt ───────────────────────────
    const userPrompt = buildUserPrompt(prompt, guardianClass, activityContext);

    // ── 4. Call Gemini with structured output ──────────────
    const client = getGenAIClient();

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: getSystemPrompt(),
        responseMimeType: 'application/json',
        responseSchema: BUILD_STRATEGY_SCHEMA,
        temperature: 0.7,       // Some creativity for varied builds
        maxOutputTokens: 1024,  // JSON output is compact
      },
    });

    // ── 5. Parse and validate the response ─────────────────
    const responseText = response.text;
    if (!responseText) {
      console.error('[AI Route] Gemini returned empty response');
      return NextResponse.json(
        { success: false, error: 'AI returned an empty response. Please try again.' },
        { status: 502 }
      );
    }

    let strategy: BuildStrategy;
    try {
      strategy = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[AI Route] Failed to parse Gemini JSON:', parseError);
      console.error('[AI Route] Raw response:', responseText);
      return NextResponse.json(
        { success: false, error: 'AI returned malformed data. Please try again.' },
        { status: 502 }
      );
    }

    // ── 6. Basic validation of the parsed strategy ─────────
    if (!strategy.subclass || !strategy.requiredExoticName || !strategy.statPriorities) {
      console.error('[AI Route] Strategy missing required fields:', strategy);
      return NextResponse.json(
        { success: false, error: 'AI response is incomplete. Please try again.' },
        { status: 502 }
      );
    }

    // ── 7. Return the validated strategy ───────────────────
    return NextResponse.json({
      success: true,
      strategy,
    });
  } catch (error) {
    console.error('[AI Route] Build strategy generation failed:', error);

    // Handle specific error types
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // Fallback Mock para Desarrollo: Si Gemini rechaza por cuota (muy común en Europa en el tier gratuito),
    // devolvemos una estrategia de prueba para no bloquear las pruebas del UI y del Web Worker.
    if (errorMessage.includes('429') || errorMessage.includes('quota')) {
      console.warn('[AI Route] Rate limit hit. Returning MOCK strategy for development testing.');
      return NextResponse.json({
        success: true,
        strategy: {
          subclass: 'solar',
          requiredExoticHash: 1054508495, // Celestial Nighthawk (Cazador) o un genérico
          requiredExoticName: 'Pieza Exótica Recomendada',
          recommendedAspectHashes: [],
          recommendedFragmentHashes: [],
          statPriorities: {
            tier1: ['resilience', 'intellect'],
            tier2: ['recovery', 'discipline'],
          },
          reasoning: 'MOCK DE DESARROLLO: Debido a que tu API Key de Gemini no tiene cuota gratuita disponible (Límite 0), FORGE-AI ha generado esta estrategia de prueba para que puedas testear el Optimizador de Armaduras.',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate build strategy.' },
      { status: 500 }
    );
  }
}

/**
 * Constructs the user prompt from the request parameters.
 * Adds class and activity context to guide the AI's recommendations.
 */
function buildUserPrompt(
  prompt: string,
  guardianClass: string,
  activityContext?: string
): string {
  let fullPrompt = `Guardian Class: ${guardianClass.charAt(0).toUpperCase() + guardianClass.slice(1)}\n`;

  if (activityContext) {
    fullPrompt += `Activity: ${activityContext}\n`;
  }

  fullPrompt += `\nPlayer Request: ${prompt}`;

  return fullPrompt;
}
