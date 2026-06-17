// ============================================================
// Destiny AI Forge — Zustand Build Store (v2 — Build Agent)
// ============================================================
// Estado global del flujo de buildcrafting e inventario completo.
// ============================================================

import { create } from 'zustand';
import type { BuildAgentStrategy, BuildAgentRequest } from '@/lib/ai/build-agent-types';
import type { ArmorItem } from '@/lib/armor/types';
import type { WeaponItem } from '@/lib/bungie/types-weapons';
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
  
  /** Armas del inventario del jugador */
  weaponInventory: WeaponItem[];

  /** Personajes de la cuenta del jugador */
  characters: DestinyCharacter[];

  /** ¿El Manifest está cacheado? */
  isManifestReady: boolean;

  /** Error actual */
  error: string | null;

  /** Cargando inventario */
  isLoadingInventory: boolean;

  // ── Acciones ─────────────────────────────────────────────

  /** Enviar prompt al Build Agent */
  requestBuildStrategy: (request: BuildAgentRequest) => Promise<void>;

  /** Establecer el inventario completo */
  setInventory: (armors: ArmorItem[], weapons: WeaponItem[]) => void;

  /** Establecer los personajes de la cuenta */
  setCharacters: (chars: DestinyCharacter[]) => void;

  /** Marcar el Manifest como listo */
  setManifestReady: (ready: boolean) => void;
  
  /** Set de estado de carga de inventario */
  setIsLoadingInventory: (loading: boolean) => void;

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
  weaponInventory: [],
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

      // Extraer los exóticos de la clase solicitada que el jugador ya posee
      const { armorInventory } = useBuildStore.getState();
      const playerExotics = Array.from(new Set(
         armorInventory
           .filter(a => a.isExotic)
           // Aquí podríamos filtrar por clase si tuviéramos un mapping estricto, 
           // pero como el prompt ya restringe por clase, podemos pasar todos los nombres
           // o solo los que coinciden vagamente. Pasaremos todos para que la IA decida.
           .map(a => a.name)
      ));

      // Llamar al endpoint Build Agent
      const response = await fetch('/api/build-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          playerExotics
        }),
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

  setInventory: (armors: ArmorItem[], weapons: WeaponItem[]) => set({ armorInventory: armors, weaponInventory: weapons }),

  setCharacters: (chars: DestinyCharacter[]) => set({ characters: chars }),

  setManifestReady: (ready: boolean) => set({ isManifestReady: ready }),
  
  setIsLoadingInventory: (loading: boolean) => set({ isLoadingInventory: loading }),

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
