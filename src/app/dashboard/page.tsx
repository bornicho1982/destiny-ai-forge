'use client';

// ============================================================
// Destiny AI Forge — Dashboard Principal Premium
// ============================================================
// Layout con Sidebar lateral, header premium y panel central.
// Integra todos los componentes del optimizador y bóveda.
// ============================================================

import { useEffect, useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useBuildStore } from '@/stores/build-store';
import { useArmorOptimizer } from '@/hooks/use-armor-optimizer';
import { useLocale } from '@/hooks/use-locale';
import { BuildPrompt } from '@/components/ai/build-prompt';
import { BuildStrategyCard } from '@/components/ai/build-strategy-card';
import { OptimizerResults } from '@/components/armor/optimizer-results';
import { InventoryManager } from '@/components/inventory/inventory-manager';
import { LoadoutManager } from '@/components/loadouts/loadout-manager';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { extractInventoryFromProfile, extractCharactersFromProfile, groupArmorBySlot } from '@/lib/bungie/inventory';
import { ensureManifestCached, type ManifestDownloadProgress } from '@/lib/bungie/manifest';
import type { OptimizerConfig } from '@/lib/armor/types';

/** Mapeo de clase → classType de Bungie */
const CLASS_TYPE_MAP: Record<string, number> = {
  titan: 0,
  hunter: 1,
  warlock: 2,
};

export default function DashboardPage() {
  const { session, isLoading: authLoading, checkAuth, logout } = useAuthStore();
  const { t } = useLocale();
  const {
    phase,
    strategy,
    armorInventory,
    isManifestReady,
    error: buildError,
    setInventory,
    setCharacters,
    setManifestReady,
    setPhase,
    lastRequest,
    clearError,
  } = useBuildStore();

  const optimizer = useArmorOptimizer();

  // Estado local
  const [manifestProgress, setManifestProgress] = useState<ManifestDownloadProgress | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'forge' | 'armory' | 'loadouts'>('forge');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Inicialización ─────────────────────────────────────────

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Descargar Manifest al montar
  useEffect(() => {
    if (authLoading || !session?.isAuthenticated) return;
    const initManifest = async () => {
      try {
        const { updated } = await ensureManifestCached('en', setManifestProgress);
        setManifestReady(true);
        if (updated) console.log('[Dashboard] Manifest descargado y cacheado');
        setManifestProgress(null);
      } catch (err) {
        setManifestError(err instanceof Error ? err.message : 'Error al descargar el Manifest');
      }
    };
    initManifest();
  }, [authLoading, session?.isAuthenticated, setManifestReady]);

  // Cargar inventario
  useEffect(() => {
    if (!isManifestReady || !session?.isAuthenticated || armorInventory.length > 0) return;
    const loadInventory = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await fetch('/api/destiny/profile');
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error);
        const inventoryData = await extractInventoryFromProfile(data.profile);
        const chars = extractCharactersFromProfile(data.profile);
        setInventory(inventoryData.armors, inventoryData.weapons);
        setCharacters(chars);
      } catch (err) {
        console.error('[Dashboard] Error al procesar inventario:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadInventory();
  }, [isManifestReady, session?.isAuthenticated, armorInventory.length, setInventory, setCharacters]);

  // ── Optimizador ──────────────────────────────────────────

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
      tier1Stats: strategy.statPriorities.slice(0, 2),
      tier2Stats: strategy.statPriorities.slice(2),
      assumeMasterwork: true,
      fragmentStatMods,
    };

    setPhase('optimizing');
    optimizer.optimize(config);
  }, [strategy, armorInventory, lastRequest, optimizer, setPhase]);

  useEffect(() => {
    if (optimizer.result && phase === 'optimizing') setPhase('results');
  }, [optimizer.result, phase, setPhase]);

  // ── Loading State ──────────────────────────────────────────

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[var(--forge-bg-primary)] flex items-center justify-center">
        <LoadingSpinner text={t('dashboard.authenticating')} />
      </main>
    );
  }

  // ── Render Principal ───────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--forge-bg-primary)] text-[var(--forge-text-primary)]">
      
      {/* ── Sidebar (Mobile overlay & Desktop sticky) ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--forge-bg-card)] backdrop-blur-xl border-r border-[var(--forge-border)] transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64 flex flex-col shadow-[var(--forge-shadow-md)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-[var(--forge-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg rotate-45 bg-gradient-to-br from-[#06b6d4] to-[#0ea5e9] flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 -rotate-45 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.66 3.83L12 11.83 4.34 8.01 12 4.18z" /></svg>
            </div>
            <span className="font-[family-name:var(--font-orbitron)] font-bold tracking-widest text-[var(--forge-text-primary)]">FORGE</span>
          </div>
          <button className="md:hidden text-[var(--forge-text-primary)]" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
           <SidebarLink active={activeTab === 'forge'} onClick={() => { setActiveTab('forge'); setSidebarOpen(false); }} icon="🧠" label={t('nav.forgeAi')} />
           <SidebarLink active={activeTab === 'armory'} onClick={() => { setActiveTab('armory'); setSidebarOpen(false); }} icon="🛡️" label={t('nav.armory')} />
           <SidebarLink active={activeTab === 'loadouts'} onClick={() => { setActiveTab('loadouts'); setSidebarOpen(false); }} icon="💾" label={t('nav.loadouts')} />
        </nav>

        <div className="p-6 border-t border-[var(--forge-border)]">
          {session?.displayName && (
            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] p-[2px]">
                  <div className="w-full h-full rounded-full bg-[var(--forge-bg-secondary)] flex items-center justify-center text-xs font-bold text-[var(--forge-text-primary)]">{session.displayName.substring(0, 2).toUpperCase()}</div>
               </div>
               <span className="text-sm font-bold text-[var(--forge-text-primary)] truncate">{session.displayName}</span>
            </div>
          )}
          <button onClick={logout} className="w-full py-2 rounded-lg bg-[var(--forge-bg-secondary)] border border-[var(--forge-border)] text-xs font-bold uppercase tracking-widest text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-hover)] transition-colors">{t('nav.logout')}</button>
        </div>
      </aside>

      {/* ── Overlay Mobile ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Decorative BG Grid for Light Mode */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-multiply pointer-events-none z-0"></div>

        {/* Header Mobile / Status Bar */}
        <header className="h-16 border-b border-[var(--forge-border)] bg-[var(--forge-bg-card)] backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0 shadow-sm">
           <button className="md:hidden text-[var(--forge-text-primary)] p-2" onClick={() => setSidebarOpen(true)}>☰</button>
           <h2 className="font-[family-name:var(--font-orbitron)] font-bold text-lg tracking-widest uppercase text-[var(--forge-text-primary)] drop-shadow-sm hidden md:block">
              {activeTab === 'forge' ? t('dashboard.title.forge') : activeTab === 'armory' ? t('dashboard.title.armory') : t('dashboard.title.loadouts')}
           </h2>
           <div className="flex items-center gap-4">
              <StatusBadge label="DB" status={isManifestReady ? 'online' : manifestProgress ? 'loading' : 'offline'} />
              <StatusBadge label="INV" status={armorInventory.length > 0 ? 'online' : isLoadingProfile ? 'loading' : 'offline'} />
           </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 z-10 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Alertas Globales */}
            {(manifestError || buildError || optimizer.error) && (
              <div className="bg-red-50 p-4 border border-red-200 rounded-xl flex items-center justify-between shadow-sm">
                <p className="text-sm text-red-600 font-medium">⚠️ {manifestError || buildError || optimizer.error}</p>
                {buildError && <button onClick={clearError} className="text-xs text-red-500 hover:text-red-700 font-bold uppercase">{t('common.close')}</button>}
              </div>
            )}

            {manifestProgress && manifestProgress.percent < 100 && (
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl shadow-sm">
                <div className="flex justify-between text-xs mb-2 text-sky-700 font-bold tracking-widest uppercase">
                  <span>{t('dashboard.manifest.updating')}{manifestProgress.currentTable}</span>
                  <span>{manifestProgress.percent}%</span>
                </div>
                <div className="h-1 bg-sky-200 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 transition-all" style={{ width: `${manifestProgress.percent}%` }} />
                </div>
              </div>
            )}

            {/* Render de Pestañas */}
            {activeTab === 'armory' && <InventoryManager />}
            {activeTab === 'loadouts' && <LoadoutManager />}
            
            {activeTab === 'forge' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Panel IA */}
                <div className="xl:col-span-5 space-y-6">
                   <BuildPrompt />
                </div>

                {/* Resultados y Estrategia */}
                <div className="xl:col-span-7 space-y-6">
                  {phase === 'ai-thinking' && (
                    <div className="bg-[var(--forge-bg-card)] rounded-2xl border border-[var(--forge-border-accent)] p-16 flex items-center justify-center shadow-[var(--forge-shadow-md)]">
                      <LoadingSpinner text={t('build.thinking')} size={64} />
                    </div>
                  )}

                  {strategy && (phase === 'optimizing' || phase === 'results' || phase === 'idle') && (
                    <BuildStrategyCard strategy={strategy} onOptimize={armorInventory.length > 0 ? handleOptimize : undefined} isOptimizing={optimizer.isRunning} />
                  )}

                  {optimizer.isRunning && (
                    <div className="bg-sky-50 p-6 rounded-2xl border border-sky-200 shadow-[var(--forge-shadow-md)]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-sky-700 tracking-widest uppercase animate-pulse">{t('dashboard.optimizing')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-sky-900">{optimizer.progress}%</span>
                          <LoadingSpinner size={16} />
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-sky-200 overflow-hidden shadow-inner">
                        <div className="h-full bg-sky-500 transition-all duration-200" style={{ width: `${optimizer.progress}%` }} />
                      </div>
                      <p className="text-[10px] text-sky-600 mt-2 text-right font-mono font-semibold">{optimizer.evaluated.toLocaleString('es-ES')} {t('dashboard.pathsEvaluated')}</p>
                    </div>
                  )}

                  {optimizer.result && phase === 'results' && strategy && (
                    <OptimizerResults result={optimizer.result} tier1Stats={strategy.statPriorities.slice(0, 2)} tier2Stats={strategy.statPriorities.slice(2)} />
                  )}

                  {phase === 'idle' && !strategy && (
                    <div className="bg-[var(--forge-bg-card)] backdrop-blur-md p-16 text-center border border-dashed border-[var(--forge-border)] rounded-3xl shadow-sm">
                      <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-4xl border border-slate-200 mb-6 shadow-sm">🔮</div>
                      <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold uppercase tracking-widest text-[var(--forge-text-primary)] mb-3">A la espera de Directivas</h3>
                      <p className="text-sm text-[var(--forge-text-muted)] max-w-sm mx-auto leading-relaxed">
                        Ingresa un prompt en el panel izquierdo para que el Asesor IA comience a forjar tu build perfecta.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all w-full text-left ${
        active 
        ? 'bg-gradient-to-r from-[var(--forge-accent-dim)] to-transparent border-l-4 border-[var(--forge-accent)] text-[var(--forge-accent)] shadow-sm' 
        : 'text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-hover)] border-l-4 border-transparent'
      }`}
    >
      <span className="text-lg grayscale">{icon}</span>
      {label}
    </button>
  );
}

function StatusBadge({ label, status }: { label: string, status: 'online' | 'offline' | 'loading' }) {
  const bg = status === 'online' ? 'bg-emerald-500' : status === 'offline' ? 'bg-red-500' : 'bg-[#ceae33]';
  const pulse = status === 'loading' ? 'animate-pulse' : '';
  
  return (
    <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-2.5 py-1 rounded-full">
       <span className={`w-2 h-2 rounded-full ${bg} ${pulse} shadow-[0_0_5px_currentColor]`}></span>
       <span className="text-[10px] font-bold text-white tracking-widest uppercase">{label}</span>
    </div>
  );
}
