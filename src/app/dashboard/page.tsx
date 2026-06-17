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
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass border-r border-[var(--forge-border)] transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-[var(--forge-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg rotate-45 bg-gradient-to-br from-[#ceae33] to-[#e8b94a] flex items-center justify-center shadow-[0_0_10px_rgba(206,174,51,0.3)]">
              <svg className="w-4 h-4 -rotate-45 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.66 3.83L12 11.83 4.34 8.01 12 4.18z" /></svg>
            </div>
            <span className="font-[family-name:var(--font-orbitron)] font-bold tracking-widest text-white">FORGE</span>
          </div>
          <button className="md:hidden text-white" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
           <SidebarLink active={activeTab === 'forge'} onClick={() => { setActiveTab('forge'); setSidebarOpen(false); }} icon="🧠" label={t('nav.forgeAi')} />
           <SidebarLink active={activeTab === 'armory'} onClick={() => { setActiveTab('armory'); setSidebarOpen(false); }} icon="🛡️" label={t('nav.armory')} />
           <SidebarLink active={activeTab === 'loadouts'} onClick={() => { setActiveTab('loadouts'); setSidebarOpen(false); }} icon="💾" label={t('nav.loadouts')} />
        </nav>

        <div className="p-6 border-t border-[var(--forge-border)]">
          {session?.displayName && (
            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--forge-void)] to-[var(--forge-arc)] p-0.5">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold">{session.displayName.substring(0, 2).toUpperCase()}</div>
               </div>
               <span className="text-sm font-bold text-white truncate">{session.displayName}</span>
            </div>
          )}
          <button onClick={logout} className="w-full py-2 rounded-lg bg-[var(--forge-bg-secondary)] border border-[var(--forge-border)] text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">{t('nav.logout')}</button>
        </div>
      </aside>

      {/* ── Overlay Mobile ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Decorative Grid BG */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>

        {/* Header Mobile / Status Bar */}
        <header className="h-16 border-b border-[var(--forge-border)] glass flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
           <button className="md:hidden text-white p-2" onClick={() => setSidebarOpen(true)}>☰</button>
           <h2 className="font-[family-name:var(--font-orbitron)] font-bold text-lg tracking-widest uppercase text-white/90 drop-shadow-md hidden md:block">
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
              <div className="glass-card p-4 border-red-500/30 flex items-center justify-between bg-red-500/5">
                <p className="text-sm text-red-400 font-medium">⚠️ {manifestError || buildError || optimizer.error}</p>
                {buildError && <button onClick={clearError} className="text-xs text-red-400 hover:text-white">{t('common.close')}</button>}
              </div>
            )}

            {manifestProgress && manifestProgress.percent < 100 && (
              <div className="glass-card p-4 border-[#ceae33]/30 bg-[#ceae33]/5">
                <div className="flex justify-between text-xs mb-2 text-[#ceae33] font-bold tracking-widest uppercase">
                  <span>{t('dashboard.manifest.updating')}{manifestProgress.currentTable}</span>
                  <span>{manifestProgress.percent}%</span>
                </div>
                <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ceae33] transition-all" style={{ width: `${manifestProgress.percent}%` }} />
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
                    <div className="glass-card p-16 flex items-center justify-center border-[var(--forge-border-accent)] bg-[var(--forge-accent-dim)]">
                      <LoadingSpinner text={t('build.thinking')} size={64} />
                    </div>
                  )}

                  {strategy && (phase === 'optimizing' || phase === 'results' || phase === 'idle') && (
                    <BuildStrategyCard strategy={strategy} onOptimize={armorInventory.length > 0 ? handleOptimize : undefined} isOptimizing={optimizer.isRunning} />
                  )}

                  {optimizer.isRunning && (
                    <div className="glass-card p-6 border-[var(--forge-arc)]/30 bg-[var(--forge-arc)]/5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[var(--forge-arc)] tracking-widest uppercase animate-pulse">{t('dashboard.optimizing')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{optimizer.progress}%</span>
                          <LoadingSpinner size={16} />
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-black/50 overflow-hidden shadow-inner">
                        <div className="h-full bg-[var(--forge-arc)] transition-all duration-200" style={{ width: `${optimizer.progress}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 text-right font-mono">{optimizer.evaluated.toLocaleString('es-ES')} {t('dashboard.pathsEvaluated')}</p>
                    </div>
                  )}

                  {optimizer.result && phase === 'results' && strategy && (
                    <OptimizerResults result={optimizer.result} tier1Stats={strategy.statPriorities.slice(0, 2)} tier2Stats={strategy.statPriorities.slice(2)} />
                  )}

                  {phase === 'idle' && !strategy && (
                    <div className="glass-card p-16 text-center border-dashed border-white/10">
                      <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center text-4xl border border-white/10 mb-6">🔮</div>
                      <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold uppercase tracking-widest text-white mb-3">A la espera de Directivas</h3>
                      <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
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
        ? 'bg-gradient-to-r from-[var(--forge-accent-dim)] to-transparent border-l-4 border-[var(--forge-accent)] text-white shadow-[inset_0_0_20px_rgba(206,174,51,0.1)]' 
        : 'text-gray-500 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
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
