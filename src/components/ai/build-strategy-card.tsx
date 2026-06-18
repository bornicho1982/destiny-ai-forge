'use client';

// ============================================================
// Destiny AI Forge — Tarjeta de Estrategia de Build (Premium)
// ============================================================
// Muestra el resultado de la IA: subclase, exótico recomendado,
// prioridades de stats, y razonamiento.
// ============================================================

import type { BuildAgentStrategy } from '@/lib/ai/build-agent-types';
import type { SubclassElement } from '@/lib/constants';

interface BuildStrategyCardProps {
  strategy: BuildAgentStrategy;
  onOptimize?: () => void;
  isOptimizing?: boolean;
}

const SUBCLASS_DISPLAY: Record<SubclassElement, { label: string; icon: string; color: string; gradient: string }> = {
  solar: {
    label: 'Solar',
    icon: '🔥',
    color: 'var(--forge-solar)',
    gradient: 'from-[#f5a623] to-[#e8742c]',
  },
  arc: {
    label: 'Arco',
    icon: '⚡',
    color: 'var(--forge-arc)',
    gradient: 'from-[#79bbe8] to-[#4d88ff]',
  },
  void: {
    label: 'Vacío',
    icon: '🔮',
    color: 'var(--forge-void)',
    gradient: 'from-[#b07be5] to-[#8b5cf6]',
  },
  stasis: {
    label: 'Estasis',
    icon: '❄️',
    color: 'var(--forge-stasis)',
    gradient: 'from-[#4d88ff] to-[#60a5fa]',
  },
  strand: {
    label: 'Hilos',
    icon: '🌿',
    color: 'var(--forge-strand)',
    gradient: 'from-[#3ddc84] to-[#22c55e]',
  },
  prismatic: {
    label: 'Prismático',
    icon: '💠',
    color: 'var(--forge-accent)',
    gradient: 'from-[#f5a623] via-[#b07be5] to-[#3ddc84]',
  },
};

const STAT_LABELS: Record<string, string> = {
  mobility: 'Movilidad',
  resilience: 'Resiliencia',
  recovery: 'Recuperación',
  discipline: 'Disciplina',
  intellect: 'Intelecto',
  strength: 'Fuerza',
};

export function BuildStrategyCard({
  strategy,
  onOptimize,
  isOptimizing,
}: BuildStrategyCardProps) {
  const normalizedSubclass = (strategy.subclass || 'prismatic').toLowerCase() as SubclassElement;
  const subclass = SUBCLASS_DISPLAY[normalizedSubclass] || SUBCLASS_DISPLAY['prismatic'];

  return (
    <div className="bg-[var(--forge-bg-card)] border border-[var(--forge-border)] shadow-sm backdrop-blur-xl rounded-3xl overflow-hidden animate-fade-in-up relative group">
      {/* Glow effects de fondo */}
      <div 
        className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-20"
        style={{ backgroundColor: subclass.color }} 
      />

      {/* Cabecera Premium */}
      <div
        className={`px-6 py-5 bg-gradient-to-r ${subclass.gradient} bg-opacity-[0.05] border-b border-[var(--forge-border)] relative overflow-hidden`}
        style={{ background: `linear-gradient(135deg, ${subclass.color}15, ${subclass.color}05)` }}
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-multiply"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shadow-sm bg-[var(--forge-bg-card)] border border-[var(--forge-border-subtle)]">
               {subclass.icon}
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold uppercase tracking-widest text-[var(--forge-text-primary)]">
                {subclass.label}
              </h3>
              <p className="text-xs font-semibold tracking-wider uppercase mt-1" style={{ color: subclass.color }}>
                FORGE-AI TARGET SUBCLASS
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-[var(--forge-border)] backdrop-blur-md shadow-sm">
             <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: subclass.color }} />
             <span className="text-[10px] font-bold text-[var(--forge-text-secondary)] uppercase tracking-wider">AI Synced</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 relative z-10">
        
        {/* Core Elements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Exótico Recomendado */}
           <div className="bg-gradient-to-br from-[var(--forge-bg-secondary)] to-[var(--forge-bg-card)] p-4 rounded-xl border border-[var(--forge-border)] shadow-sm hover:border-[var(--forge-border-hover)] transition-colors">
              <label className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-widest mb-3 block flex items-center gap-2">
                <span className="w-1 h-3 rounded-full bg-[var(--forge-accent)]"></span>
                Exótico Core
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[var(--forge-accent-dim)] border border-[var(--forge-border-accent)] flex items-center justify-center text-2xl shadow-sm">
                  👑
                </div>
                <div>
                  <p className="text-base font-bold text-[var(--forge-accent)]">
                    {strategy.requiredExoticName}
                  </p>
                  <p className="text-[10px] text-[var(--forge-text-muted)] font-mono mt-0.5">
                    ID: {strategy.requiredExoticHash || 'N/A'}
                  </p>
                </div>
              </div>
           </div>

           {/* Stat Priorities */}
           <div className="bg-gradient-to-br from-[var(--forge-bg-secondary)] to-[var(--forge-bg-card)] p-4 rounded-xl border border-[var(--forge-border)] shadow-sm hover:border-[var(--forge-border-hover)] transition-colors">
              <label className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-widest mb-3 block flex items-center gap-2">
                <span className="w-1 h-3 rounded-full bg-[var(--forge-accent)]"></span>
                Focus Stats
              </label>
              <div className="flex flex-wrap gap-2">
                {strategy.statPriorities.map((stat, index) => (
                  <div
                    key={stat}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      index < 2
                        ? 'bg-[var(--forge-accent-dim)] border-[var(--forge-border-accent)] shadow-[0_0_10px_rgba(232,185,74,0.1)]'
                        : 'bg-[var(--forge-bg-primary)] border-[var(--forge-border)] opacity-80'
                    }`}
                  >
                    <span className={`text-[10px] font-black ${
                      index < 2 ? 'text-[var(--forge-accent)]' : 'text-[var(--forge-text-muted)]'
                    }`}>T{index + 1}</span>
                    <span className={`text-sm font-semibold ${
                      index < 2 ? 'text-[var(--forge-text-primary)]' : 'text-[var(--forge-text-secondary)]'
                    }`}>
                      {STAT_LABELS[stat] || stat}
                    </span>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Razonamiento de la IA - Premium Quote Block */}
        <div className="relative mt-6">
          <div className="absolute top-0 left-4 -translate-y-1/2 bg-[var(--forge-bg-primary)] px-2">
             <label className="text-[10px] text-[var(--forge-accent)] uppercase tracking-widest font-bold">
               Strategic Assessment
             </label>
          </div>
          <p className="text-sm text-[var(--forge-text-primary)] leading-relaxed bg-[var(--forge-bg-secondary)] rounded-xl p-6 pt-7 border border-[var(--forge-border-accent)]/30 shadow-sm">
            <span className="text-2xl text-[var(--forge-accent)] opacity-30 absolute top-4 left-2 leading-none">"</span>
            <span className="relative z-10 pl-2">{strategy.reasoning}</span>
            <span className="text-2xl text-[var(--forge-accent)] opacity-30 absolute bottom-0 right-4 leading-none">"</span>
          </p>
        </div>

        {/* Penalizaciones de Fragmentos */}
        {strategy.negativeStatFragments && strategy.negativeStatFragments.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4 shadow-sm">
            <label className="text-[10px] text-red-600 uppercase tracking-widest mb-3 block flex items-center gap-2 font-bold">
              ⚠️ Alerta de Penalizaciones
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {strategy.negativeStatFragments.map((frag, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-red-100 shadow-sm"
                >
                  <span className="text-xs text-[var(--forge-text-secondary)] font-medium">
                    {frag.fragmentName}
                  </span>
                  <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    {frag.penalty} {STAT_LABELS[frag.statName] || frag.statName}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[var(--forge-text-muted)] mt-2 italic">
               * El Optimizador Forge compensará automáticamente estas penalizaciones.
            </p>
          </div>
        )}

        {/* Botón de Optimizar (Hero Button) */}
        {onOptimize && (
          <div className="pt-4">
            <button
              id="optimize-armor-button"
              onClick={onOptimize}
              disabled={isOptimizing}
              className={`
                w-full py-4 rounded-xl font-bold text-base uppercase tracking-widest
                transition-all duration-300 cursor-pointer overflow-hidden relative group
                ${
                  isOptimizing
                    ? 'bg-[var(--forge-bg-tertiary)] text-[var(--forge-text-muted)] cursor-wait border border-[var(--forge-border)]'
                    : 'bg-gradient-to-r from-[var(--forge-void)] to-[var(--forge-arc)] text-white hover:shadow-[0_0_20px_rgba(176,123,229,0.4)] border border-white/10'
                }
              `}
            >
              {!isOptimizing && (
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              )}
              
              <div className="relative z-10 flex items-center justify-center gap-3">
                {isOptimizing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Forjando Armadura...
                  </>
                ) : (
                  <>
                    <span>⚡</span> 
                    <span>Iniciar Optimización</span>
                  </>
                )}
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
