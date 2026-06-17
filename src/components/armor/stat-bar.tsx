'use client';

// ============================================================
// Destiny AI Forge — Barra de Stat de Armadura
// ============================================================
// Visualiza un stat individual con barra de progreso animada,
// tier numérico, y codificación por color.
// ============================================================

import type { StatName } from '@/lib/constants';

interface StatBarProps {
  /** Nombre del stat */
  stat: StatName;
  /** Valor total del stat */
  value: number;
  /** Tier del stat (0-10) */
  tier: number;
  /** ¿Es un stat de prioridad tier 1? */
  isTier1?: boolean;
  /** ¿Es un stat de prioridad tier 2? */
  isTier2?: boolean;
}

/** Colores por stat, inspirados en la UI de Destiny 2 */
const STAT_COLORS: Record<StatName, string> = {
  mobility: '#79bbe8',    // Azul Arc
  resilience: '#e8534a',  // Rojo
  recovery: '#e8e6e3',    // Blanco
  discipline: '#3ddc84',  // Verde Strand
  intellect: '#f5a623',   // Dorado Solar
  strength: '#b07be5',    // Púrpura Void
};

/** Nombres en español de los stats */
const STAT_LABELS: Record<StatName, string> = {
  mobility: 'Movilidad',
  resilience: 'Resiliencia',
  recovery: 'Recuperación',
  discipline: 'Disciplina',
  intellect: 'Intelecto',
  strength: 'Fuerza',
};

/** Iconos de stats */
const STAT_ICONS: Record<StatName, string> = {
  mobility: '🏃',
  resilience: '🛡️',
  recovery: '💚',
  discipline: '💎',
  intellect: '🧠',
  strength: '💪',
};

export function StatBar({ stat, value, tier, isTier1, isTier2 }: StatBarProps) {
  const color = STAT_COLORS[stat];
  const label = STAT_LABELS[stat];
  const icon = STAT_ICONS[stat];
  const percentage = Math.min((value / 100) * 100, 100);

  // Determinar badge de prioridad
  const priorityBadge = isTier1
    ? { text: 'T1', color: 'bg-[var(--forge-accent)] text-[var(--forge-bg-primary)]' }
    : isTier2
    ? { text: 'T2', color: 'bg-[var(--forge-bg-tertiary)] text-[var(--forge-text-secondary)]' }
    : null;

  return (
    <div className="group flex items-center gap-3 py-1.5">
      {/* Icono + Nombre */}
      <div className="flex items-center gap-2 w-32 shrink-0">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-[var(--forge-text-secondary)] font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="flex-1 relative h-3 rounded-full bg-[var(--forge-bg-tertiary)] overflow-hidden">
        {/* Segmentos de tier (marcas cada 10 puntos) */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-[rgba(255,255,255,0.06)] last:border-0"
            />
          ))}
        </div>

        {/* Barra de relleno */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: tier >= 8 ? `0 0 12px ${color}66` : 'none',
          }}
        />
      </div>

      {/* Valor numérico */}
      <div className="flex items-center gap-2 w-20 shrink-0 justify-end">
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: tier >= 10 ? color : 'var(--forge-text-primary)' }}
        >
          T{tier}
        </span>
        <span className="text-xs text-[var(--forge-text-muted)] tabular-nums">
          ({value})
        </span>
      </div>

      {/* Badge de prioridad */}
      {priorityBadge && (
        <span
          className={`
            text-[10px] font-bold px-1.5 py-0.5 rounded
            ${priorityBadge.color}
          `}
        >
          {priorityBadge.text}
        </span>
      )}
    </div>
  );
}

// ── Panel de Stats Completo ────────────────────────────────

interface StatsPanelProps {
  stats: Record<StatName, number>;
  tiers: Record<StatName, number>;
  tier1Stats?: string[];
  tier2Stats?: string[];
  totalTiers?: number;
  wastedStats?: number;
}

export function StatsPanel({
  stats,
  tiers,
  tier1Stats = [],
  tier2Stats = [],
  totalTiers,
  wastedStats,
}: StatsPanelProps) {
  const allStats: StatName[] = [
    'mobility', 'resilience', 'recovery',
    'discipline', 'intellect', 'strength',
  ];

  return (
    <div className="space-y-1">
      {allStats.map((stat) => (
        <StatBar
          key={stat}
          stat={stat}
          value={stats[stat]}
          tier={tiers[stat]}
          isTier1={tier1Stats.includes(stat)}
          isTier2={tier2Stats.includes(stat)}
        />
      ))}

      {/* Resumen */}
      {(totalTiers !== undefined || wastedStats !== undefined) && (
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-[var(--forge-border)]">
          {totalTiers !== undefined && (
            <span className="text-xs text-[var(--forge-text-secondary)]">
              Total Tiers:{' '}
              <span className="font-bold text-[var(--forge-accent)]">
                {totalTiers}
              </span>
              <span className="text-[var(--forge-text-muted)]">/60</span>
            </span>
          )}
          {wastedStats !== undefined && (
            <span className="text-xs text-[var(--forge-text-secondary)]">
              Stats desperdiciados:{' '}
              <span
                className={`font-bold ${
                  wastedStats <= 10
                    ? 'text-emerald-400'
                    : wastedStats <= 20
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {wastedStats}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
