import { NextResponse } from 'next/server';
import { getBuildAgentSystemPrompt } from '@/lib/ai/build-agent-prompt';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { BuildAgentRequest, BuildAgentStrategy } from '@/lib/ai/build-agent-types';

export async function POST(request: Request) {
  try {
    const body: BuildAgentRequest = await request.json();

    if (!body) {
      return NextResponse.json(
        { success: false, error: 'JSON inválido en el cuerpo de la petición.' },
        { status: 400 }
      );
    }

    const { prompt, guardianClass, activityContext } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un prompt de build.' },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'El prompt no puede exceder los 1000 caracteres.' },
        { status: 400 }
      );
    }

    // ── 1. Construir Prompts ───────────────────────────────
    let userPrompt = `Clase del Guardián: ${guardianClass.charAt(0).toUpperCase() + guardianClass.slice(1)}\n`;
    if (activityContext) {
      userPrompt += `Actividad: ${activityContext}\n`;
    }
    userPrompt += `\nNecesidad del jugador:\n${prompt}`;

    const systemInstruction = getBuildAgentSystemPrompt(guardianClass);

    // ── 2. Inicializar SDK de Google Premium ─────────────
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Falta la API Key de Google Gemini.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    // ── 3. Llamada al Servidor de Facturación de Google ──
    let responseText: string;
    try {
      const result = await model.generateContent(userPrompt);
      responseText = result.response.text();
    } catch (error) {
      console.error('[Build Agent] Error llamando a Gemini:', error);
      return NextResponse.json(
        { success: false, error: 'Error del servidor premium de Google AI Studio.' },
        { status: 502 }
      );
    }

    // ── 4. Parsear JSON ──────────────────────────────────
    let strategy: BuildAgentStrategy;
    try {
      const cleanJsonText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      strategy = JSON.parse(cleanJsonText);
    } catch (parseError) {
      console.error('[Build Agent] Error parseando JSON de la IA:', parseError, responseText);
      return NextResponse.json(
        { success: false, error: 'La IA devolvió un formato no válido. Inténtalo de nuevo.' },
        { status: 500 }
      );
    }

    // ── 5. Retornar la estrategia validada ───────────────
    return NextResponse.json({
      success: true,
      strategy,
      model: 'gemini-2.5-flash',
    });
  } catch (error) {
    console.error('[Build Agent] Error inesperado:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno conectando con el AI Server.' },
      { status: 500 }
    );
  }
}
