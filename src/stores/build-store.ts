// ============================================================
// Destiny AI Forge — Zustand Build Store (v2 — Build Agent)
// ============================================================
// Estado global del flujo de buildcrafting.
// Ahora usa el nuevo endpoint /api/build-agent (Gemma 4) y
// el contrato BuildAgentStrategy con negativeStatFragments.
// ============================================================

import { create } from 'zustand';
import type { BuildAgentStrategy, BuildAgentRequest } from '@/lib/ai/build-agent-types';
import type { ArmorItem } from '@/lib/armor/types';
import type { DestinyCharacter } from '@/lib/bungie/inventory';

type BuildPhase = 'idle' | 'prompting' | 'ai-thinking' | 'optimizing' | 'results';

interface BuildState {
  /** Fase actual del flujo */
  phase: BuildPhase;

  /** Último prompt enviado */
  lastRequest: BuildAgentRequest | null;

  /** Estrategia generada por la IA (nuevo contrato con negativeStatFragments) */
  strategy: BuildAgentStrategy | null;

  /** Modelo de IA utilizado (para debug/display) */
  aiModel: string | null;

  /** Armaduras del inventario del jugador */
  armorInventory: ArmorItem[];

  /** Personajes de la cuenta del jugador */
  characters: DestinyCharacter[];

  /** ¿El Manifest está cacheado? */
  isManifestReady: boolean;

  /** Error actual */
  error: string | null;

  /** Cargando inventario */
  isLoadingInventory: boolean;

  // ── Acciones ─────────────────────────────────────────────

  /** Enviar prompt al Build Agent (Gemma 4) */
  requestBuildStrategy: (request: BuildAgentRequest) => Promise<void>;

  /** Establecer el inventario de armaduras */
  setArmorInventory: (items: ArmorItem[]) => void;

  /** Establecer los personajes de la cuenta */
  setCharacters: (chars: DestinyCharacter[]) => void;

  /** Marcar el Manifest como listo */
  setManifestReady: (ready: boolean) => void;

  /** Cambiar fase */
  setPhase: (phase: BuildPhase) => void;

  /** Limpiar todo */
  reset: () => void;

  /** Limpiar error */
  clearError: () => void;
}

export const useBuildStore = create<BuildState>((set) => ({
  phase: 'idle',
  lastRequest: null,
  strategy: null,
  aiModel: null,
  armorInventory: [],
  characters: [],
  isManifestReady: false,
  error: null,
  isLoadingInventory: false,

  requestBuildStrategy: async (request: BuildAgentRequest) => {
    try {
      set({
        phase: 'ai-thinking',
        error: null,
        lastRequest: request,
        strategy: null,
        aiModel: null,
      });

      // Llamar al endpoint Build Agent (ahora con Gemini 1.5 Flash)
      const response = await fetch('/api/build-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        set({
          phase: 'idle',
          error: data.error || 'Error al generar la estrategia con Gemini.',
        });
        return;
      }

      set({
        strategy: data.strategy,
        aiModel: data.model || 'Gemini 1.5 Flash',
        phase: 'optimizing',
      });
    } catch (error) {
      set({
        phase: 'idle',
        error:
          error instanceof Error
            ? error.message
            : 'Error de conexión con FORGE-AI.',
      });
    }
  },

  setArmorInventory: (items: ArmorItem[]) => set({ armorInventory: items }),

  setCharacters: (chars: DestinyCharacter[]) => set({ characters: chars }),

  setManifestReady: (ready: boolean) => set({ isManifestReady: ready }),

  setPhase: (phase: BuildPhase) => set({ phase }),

  reset: () =>
    set({
      phase: 'idle',
      lastRequest: null,
      strategy: null,
      aiModel: null,
      error: null,
    }),

  clearError: () => set({ error: null }),
}));
