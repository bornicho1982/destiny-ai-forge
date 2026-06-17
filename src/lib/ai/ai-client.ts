// ============================================================
// Destiny AI Forge — Cliente IA (OpenRouter / Gemma 4)
// ============================================================
// Reemplaza el antiguo gemini-client.ts con llamadas HTTP puras
// al endpoint OpenAI-compatible de OpenRouter.
//
// Modelo: google/gemma-4-12b-it:free (sin coste, sin restricciones)
// Fallback: google/gemma-4-27b-it:free
// ============================================================

import { AI_CONFIG } from '@/lib/constants';

/**
 * Interfaz de la respuesta de OpenRouter (formato OpenAI-compatible)
 */
interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Llama al modelo de IA a través de OpenRouter para generar una estrategia de build.
 *
 * @param userPrompt - El mensaje del usuario (clase, actividad, solicitud)
 * @param systemPrompt - El system prompt con las instrucciones del experto D2
 * @returns El texto de respuesta de la IA (debería ser JSON)
 *
 * @throws Error si falla después de todos los reintentos
 */
export async function callBuildAgent(
  userPrompt: string,
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[AI Client] OPENROUTER_API_KEY no está configurada. ' +
      'Consigue una key gratuita en: https://openrouter.ai/'
    );
  }

  // Intentar con el modelo principal, luego fallback
  const models = [AI_CONFIG.MODEL, AI_CONFIG.FALLBACK_MODEL];

  for (const model of models) {
    try {
      const result = await callWithRetries(apiKey, model, userPrompt, systemPrompt);
      return result;
    } catch (error) {
      console.warn(`[AI Client] Modelo ${model} falló, intentando siguiente...`, error);
      // Si es el último modelo, lanzar el error
      if (model === models[models.length - 1]) {
        throw error;
      }
    }
  }

  // Nunca debería llegar aquí, pero TypeScript lo exige
  throw new Error('[AI Client] Todos los modelos de IA fallaron.');
}

/**
 * Ejecuta la llamada a OpenRouter con reintentos y backoff exponencial.
 */
async function callWithRetries(
  apiKey: string,
  model: string,
  userPrompt: string,
  systemPrompt: string
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < AI_CONFIG.MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${AI_CONFIG.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
          'X-Title': 'Destiny AI Forge',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: AI_CONFIG.TEMPERATURE,
          max_tokens: AI_CONFIG.MAX_TOKENS,
        }),
      });

      // Rate limit → esperar y reintentar
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
        console.warn(`[AI Client] Rate limited. Reintentando en ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown');
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('La IA devolvió una respuesta vacía.');
      }

      console.log(
        `[AI Client] ✅ Respuesta de ${model} — ` +
        `${data.usage?.prompt_tokens || '?'} prompt + ${data.usage?.completion_tokens || '?'} completion tokens`
      );

      return content;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // No reintentar errores de autenticación
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError;
      }

      // Backoff exponencial: 1s, 2s, 4s
      if (attempt < AI_CONFIG.MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[AI Client] Intento ${attempt + 1} fallido. Reintentando en ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('[AI Client] Todos los reintentos fallaron.');
}

/** Utilidad de sleep */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
