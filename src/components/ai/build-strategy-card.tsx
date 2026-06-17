'use client';

// ============================================================
// Destiny AI Forge — Tarjeta de Estrategia de Build (IA)
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
  // Normalizar la respuesta de la IA (por si devuelve "Solar" o "SOLAR" en vez de "solar")
  const normalizedSubclass = (strategy.subclass || 'prismatic').toLowerCase() as SubclassElement;
  
  // Usar fallback a prismatic si la IA local se inventa una subclase que no existe
  const subclass = SUBCLASS_DISPLAY[normalizedSubclass] || SUBCLASS_DISPLAY['prismatic'];

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up">
      {/* Cabecera con subclase */}
      <div
        className={`
          px-6 py-4 bg-gradient-to-r ${subclass.gradient}
          bg-opacity-10 border-b border-[var(--forge-border)]
        `}
        style={{ background: `linear-gradient(135deg, ${subclass.color}15, ${subclass.color}05)` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{subclass.icon}</span>
            <div>
              <h3 className="font-[family-name:var(--font-orbitron)] text-sm font-bold uppercase tracking-wider">
                Subclase {subclass.label}
              </h3>
              <p className="text-xs text-[var(--forge-text-muted)] mt-0.5">
                Recomendación de FORGE-AI
              </p>
            </div>
          </div>
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: subclass.color }}
          />
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Exótico Recomendado */}
        <div>
          <label className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-widest mb-2 block">
            Exótico Recomendado
          </label>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--forge-bg-secondary)] border border-[var(--forge-border)]">
            <div className="w-10 h-10 rounded-lg bg-[var(--forge-accent-dim)] border border-[var(--forge-border-accent)] flex items-center justify-center text-lg">
              👑
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--forge-accent)]">
                {strategy.requiredExoticName}
              </p>
              <p className="text-[10px] text-[var(--forge-text-muted)] font-mono">
                Hash: {strategy.requiredExoticHash || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Prioridades de Stats (array ordenado de mayor a menor) */}
        <div>
          <label className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-widest mb-2 block">
            Prioridad de Stats
          </label>
          <div className="flex flex-wrap gap-1.5">
            {strategy.statPriorities.map((stat, index) => (
              <div
                key={stat}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                  index < 2
                    ? 'bg-[var(--forge-accent-dim)] border-[var(--forge-border-accent)]'
                    : 'bg-[var(--forge-bg-secondary)] border-[var(--forge-border)]'
                }`}
              >
                <span className={`text-[10px] font-bold ${
                  index < 2 ? 'text-[var(--forge-accent)]' : 'text-[var(--forge-text-muted)]'
                }`}>#{index + 1}</span>
                <span className={`text-xs ${
                  index < 2 ? 'text-[var(--forge-text-primary)]' : 'text-[var(--forge-text-secondary)]'
                }`}>
                  {STAT_LABELS[stat] || stat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Penalizaciones de Fragmentos */}
        {strategy.negativeStatFragments && strategy.negativeStatFragments.length > 0 && (
          <div>
            <label className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-widest mb-2 block">
              ⚠️ Penalizaciones de Fragmentos
            </label>
            <div className="space-y-1">
              {strategy.negativeStatFragments.map((frag, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)]"
                >
                  <span className="text-xs text-[var(--forge-text-secondary)]">
                    {frag.fragmentName}
                  </span>
                  <span className="text-xs font-mono font-bold text-red-400">
                    {frag.penalty} {STAT_LABELS[frag.statName] || frag.statName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Razonamiento de la IA */}
        <div>
          <label className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-widest mb-2 block">
            Análisis de FORGE-AI
          </label>
          <p className="text-sm text-[var(--forge-text-secondary)] leading-relaxed bg-[var(--forge-bg-secondary)] rounded-xl p-4 border border-[var(--forge-border)] italic">
            &ldquo;{strategy.reasoning}&rdquo;
          </p>
        </div>

        {/* Botón de Optimizar */}
        {onOptimize && (
          <button
            id="optimize-armor-button"
            onClick={onOptimize}
            disabled={isOptimizing}
            className={`
              w-full py-3 rounded-xl font-semibold text-sm
              transition-all duration-300 cursor-pointer
              ${
                isOptimizing
                  ? 'bg-[var(--forge-bg-tertiary)] text-[var(--forge-text-muted)] cursor-wait'
                  : 'bg-gradient-to-r from-[var(--forge-void)] to-[var(--forge-arc)] text-white hover:shadow-lg hover:shadow-[rgba(176,123,229,0.25)] hover:scale-[1.01] active:scale-[0.99]'
              }
            `}
          >
            {isOptimizing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-[var(--forge-text-muted)] border-t-transparent rounded-full animate-spin" />
                Optimizando armadura...
              </span>
            ) : (
              '⚡ Optimizar Armadura'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
