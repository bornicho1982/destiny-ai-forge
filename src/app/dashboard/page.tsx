'use client';

// ============================================================
// Destiny AI Forge — Dashboard Principal
// ============================================================
// Integra todos los componentes: descarga del Manifest, prompt IA,
// tarjeta de estrategia, y resultados del optimizador de armadura.
// ============================================================

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useBuildStore } from '@/stores/build-store';
import { useArmorOptimizer } from '@/hooks/use-armor-optimizer';
import { BuildPrompt } from '@/components/ai/build-prompt';
import { BuildStrategyCard } from '@/components/ai/build-strategy-card';
import { OptimizerResults } from '@/components/armor/optimizer-results';
import { InventoryManager } from '@/components/inventory/inventory-manager';
import { LoadoutManager } from '@/components/loadouts/loadout-manager';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { extractArmorFromProfile, extractCharactersFromProfile, groupArmorBySlot } from '@/lib/bungie/inventory';
import { ensureManifestCached, type ManifestDownloadProgress } from '@/lib/bungie/manifest';
import type { OptimizerConfig } from '@/lib/armor/types';
import { useState } from 'react';

/** Mapeo de clase → classType de Bungie */
const CLASS_TYPE_MAP: Record<string, number> = {
  titan: 0,
  hunter: 1,
  warlock: 2,
};

export default function DashboardPage() {
  const { session, isLoading: authLoading, checkAuth, logout } = useAuthStore();
  const {
    phase,
    strategy,
    armorInventory,
    isManifestReady,
    error: buildError,
    setArmorInventory,
    setCharacters,
    setManifestReady,
    setPhase,
    lastRequest,
    clearError,
  } = useBuildStore();

  const optimizer = useArmorOptimizer();

  // Estado local para el Manifest
  const [manifestProgress, setManifestProgress] = useState<ManifestDownloadProgress | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'forge' | 'armory' | 'loadouts'>('forge');

  // ── Inicialización ─────────────────────────────────────────

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Descargar Manifest al montar (si no está cacheado)
  useEffect(() => {
    if (authLoading || !session?.isAuthenticated) return;

    const initManifest = async () => {
      try {
        const { updated } = await ensureManifestCached('en', (progress) => {
          setManifestProgress(progress);
        });

        setManifestReady(true);
        if (updated) {
          console.log('[Dashboard] Manifest descargado y cacheado');
        }
        setManifestProgress(null);
      } catch (err) {
        setManifestError(
          err instanceof Error ? err.message : 'Error al descargar el Manifest'
        );
      }
    };

    initManifest();
  }, [authLoading, session?.isAuthenticated, setManifestReady]);

  // Cargar inventario cuando el Manifest esté listo
  useEffect(() => {
    if (!isManifestReady || !session?.isAuthenticated || armorInventory.length > 0) return;

    const loadInventory = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await fetch('/api/destiny/profile');
        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error('[Dashboard] Error al cargar perfil:', data.error);
          return;
        }

        const armor = await extractArmorFromProfile(data.profile);
        const chars = extractCharactersFromProfile(data.profile);
        
        setArmorInventory(armor);
        setCharacters(chars);
      } catch (err) {
        console.error('[Dashboard] Error al procesar inventario:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadInventory();
  }, [isManifestReady, session?.isAuthenticated, armorInventory.length, setArmorInventory, setCharacters]);

  // ── Lanzar optimización cuando la IA da resultado ──────────

  const handleOptimize = useCallback(() => {
    if (!strategy || armorInventory.length === 0 || !lastRequest) return;

    const classType = CLASS_TYPE_MAP[lastRequest.guardianClass] ?? 1;
    const armorBySlot = groupArmorBySlot(armorInventory, classType);

    const fragmentStatMods: Partial<Record<string, number>> = {};
    if (strategy.negativeStatFragments) {
      for (const frag of strategy.negativeStatFragments) {
        fragmentStatMods[frag.statName] = (fragmentStatMods[frag.statName] || 0) + frag.penalty;
      }
    }

    const config: OptimizerConfig = {
      armorBySlot,
      requiredExoticHash: strategy.requiredExoticHash,
      // Los primeros 2 stats son tier1, el resto tier2
      tier1Stats: strategy.statPriorities.slice(0, 2),
      tier2Stats: strategy.statPriorities.slice(2),
      assumeMasterwork: true,
      fragmentStatMods,
    };

    setPhase('optimizing');
    optimizer.optimize(config);
  }, [strategy, armorInventory, lastRequest, optimizer, setPhase]);

  // Actualizar fase cuando el optimizador termina
  useEffect(() => {
    if (optimizer.result && phase === 'optimizing') {
      setPhase('results');
    }
  }, [optimizer.result, phase, setPhase]);

  // ── Loading State ──────────────────────────────────────────

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Cargando datos del guardián..." />
      </main>
    );
  }

  // ── Render Principal ───────────────────────────────────────

  return (
    <main className="min-h-screen">
      {/* ── Barra Superior ──────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--forge-border)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg rotate-45 bg-gradient-to-br from-[var(--forge-accent)] to-[#c4953a] flex items-center justify-center">
              <svg className="w-4 h-4 -rotate-45 text-[var(--forge-bg-primary)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.66 3.83L12 11.83 4.34 8.01 12 4.18z" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-orbitron)] text-sm font-semibold tracking-wider text-[var(--forge-text-primary)]">
              AI FORGE
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Indicadores de estado */}
            <div className="hidden md:flex items-center gap-3">
              <StatusDot
                label="Manifest"
                status={isManifestReady ? 'online' : manifestProgress ? 'loading' : 'offline'}
              />
              <StatusDot
                label="Inventario"
                status={
                  armorInventory.length > 0
                    ? 'online'
                    : isLoadingProfile
                    ? 'loading'
                    : 'offline'
                }
                detail={armorInventory.length > 0 ? `${armorInventory.length} piezas` : undefined}
              />
              <StatusDot label="IA" status="online" />
            </div>

            {session?.displayName && (
              <span className="text-sm text-[var(--forge-text-secondary)]">
                <span className="text-[var(--forge-accent)] font-medium">
                  {session.displayName}
                </span>
              </span>
            )}
            <button
              id="logout-button"
              onClick={logout}
              className="px-4 py-2 rounded-lg text-sm border border-[var(--forge-border)] text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-200 cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenido Principal ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Barra de progreso del Manifest */}
        {manifestProgress && manifestProgress.percent < 100 && (
          <div className="mb-6 glass-card p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--forge-text-secondary)]">
                📥 Descargando Manifest: {manifestProgress.currentTable}
              </span>
              <span className="text-xs font-bold text-[var(--forge-accent)] tabular-nums">
                {manifestProgress.percent}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--forge-bg-tertiary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--forge-accent)] to-[#c4953a] transition-all duration-300"
                style={{ width: `${manifestProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Error del Manifest */}
        {manifestError && (
          <div className="mb-6 glass-card p-4 border-red-500/30 animate-fade-in">
            <p className="text-sm text-red-400">❌ {manifestError}</p>
          </div>
        )}

        {/* Error del build */}
        {buildError && (
          <div className="mb-6 glass-card p-4 border-red-500/30 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-400">❌ {buildError}</p>
              <button
                onClick={clearError}
                className="text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Pestañas de Navegación */}
        <div className="flex gap-4 mb-6 border-b border-[var(--forge-border)] pb-px">
          <button
            onClick={() => setActiveTab('forge')}
            className={`px-4 py-2 font-[family-name:var(--font-orbitron)] font-bold text-sm tracking-widest uppercase transition-all border-b-2 ${
              activeTab === 'forge'
                ? 'border-[var(--forge-accent)] text-[var(--forge-accent)] drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                : 'border-transparent text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]'
            }`}
          >
            Forge AI
          </button>
          <button
            onClick={() => setActiveTab('armory')}
            className={`px-4 py-2 font-[family-name:var(--font-orbitron)] font-bold text-sm tracking-widest uppercase transition-all border-b-2 ${
              activeTab === 'armory'
                ? 'border-[var(--forge-accent)] text-[var(--forge-accent)] drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                : 'border-transparent text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]'
            }`}
          >
            Armería
          </button>
          <button
            onClick={() => setActiveTab('loadouts')}
            className={`px-4 py-2 font-[family-name:var(--font-orbitron)] font-bold text-sm tracking-widest uppercase transition-all border-b-2 ${
              activeTab === 'loadouts'
                ? 'border-[var(--forge-accent)] text-[var(--forge-accent)] drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                : 'border-transparent text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]'
            }`}
          >
            Mis Builds
          </button>
        </div>

        {activeTab === 'armory' && <InventoryManager />}
        
        {activeTab === 'loadouts' && <LoadoutManager />}

        {activeTab === 'forge' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna izquierda: Prompt IA */}
          <div className="lg:col-span-5">
            <BuildPrompt />
          </div>

          {/* Columna derecha: Resultados */}
          <div className="lg:col-span-7 space-y-6">
            {/* Estado: IA pensando */}
            {phase === 'ai-thinking' && (
              <div className="glass-card p-12 flex items-center justify-center animate-fade-in">
                <LoadingSpinner text="FORGE-AI está analizando..." size={56} />
              </div>
            )}

            {/* Tarjeta de Estrategia de la IA */}
            {strategy && (phase === 'optimizing' || phase === 'results' || phase === 'idle') && (
              <BuildStrategyCard
                strategy={strategy}
                onOptimize={armorInventory.length > 0 ? handleOptimize : undefined}
                isOptimizing={optimizer.isRunning}
              />
            )}

            {/* Progreso del Optimizador */}
            {optimizer.isRunning && (
              <div className="glass-card p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--forge-text-secondary)]">
                    ⚡ Evaluando permutaciones de armadura...
                  </span>
                  <span className="text-xs font-bold text-[var(--forge-accent)] tabular-nums">
                    {optimizer.progress}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--forge-bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--forge-void)] to-[var(--forge-arc)] transition-all duration-200"
                    style={{ width: `${optimizer.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--forge-text-muted)] mt-1">
                  {optimizer.evaluated.toLocaleString('es-ES')} permutaciones evaluadas
                </p>
              </div>
            )}

            {/* Resultados del Optimizador */}
            {optimizer.result && phase === 'results' && strategy && (
              <OptimizerResults
                result={optimizer.result}
                tier1Stats={strategy.statPriorities.slice(0, 2)}
                tier2Stats={strategy.statPriorities.slice(2)}
              />
            )}

            {/* Estado vacío */}
            {phase === 'idle' && !strategy && (
              <div className="glass-card p-12 text-center animate-fade-in">
                <p className="text-4xl mb-4">🔮</p>
                <h3 className="font-[family-name:var(--font-orbitron)] text-sm font-semibold uppercase tracking-wider mb-2 text-[var(--forge-text-primary)]">
                  Listo para Forjar
                </h3>
                <p className="text-sm text-[var(--forge-text-muted)] max-w-sm mx-auto">
                  Describe el build que necesitas en el panel izquierdo.
                  FORGE-AI analizará tu solicitud y recomendará la estrategia óptima.
                </p>
              </div>
            )}

            {/* Error del optimizador */}
            {optimizer.error && (
              <div className="glass-card p-4 border-red-500/30 animate-fade-in">
                <p className="text-sm text-red-400">❌ {optimizer.error}</p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </main>
  );
}

// ── Componente auxiliar: Punto de estado ─────────────────────

function StatusDot({
  label,
  status,
  detail,
}: {
  label: string;
  status: 'online' | 'offline' | 'loading';
  detail?: string;
}) {
  const colors = {
    online: 'bg-emerald-400',
    offline: 'bg-[var(--forge-text-muted)]',
    loading: 'bg-amber-400 animate-pulse',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${colors[status]}`} />
      <span className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-wider">
        {label}
      </span>
      {detail && (
        <span className="text-[10px] text-[var(--forge-text-muted)]">
          ({detail})
        </span>
      )}
    </div>
  );
}
