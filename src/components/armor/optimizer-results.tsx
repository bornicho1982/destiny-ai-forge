'use client';

// ============================================================
// Destiny AI Forge — Resultados del Optimizador de Armadura
// ============================================================
// Muestra las mejores combinaciones de armadura encontradas
// por el Web Worker, con stats visualizados.
// ============================================================

import { useState } from 'react';
import type { OptimizerResult, ArmorPermutation } from '@/lib/armor/types';
import { StatsPanel } from '@/components/armor/stat-bar';
import { BUNGIE } from '@/lib/constants';
import { useLoadoutStore } from '@/stores/loadout-store';
import { useBuildStore } from '@/stores/build-store';

const CLASS_TYPE_MAP: Record<string, number> = {
  titan: 0,
  hunter: 1,
  warlock: 2,
};

interface OptimizerResultsProps {
  result: OptimizerResult;
  tier1Stats: string[];
  tier2Stats: string[];
}

export function OptimizerResults({
  result,
  tier1Stats,
  tier2Stats,
}: OptimizerResultsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedSet = result.topResults[selectedIndex];
  
  const saveLoadout = useLoadoutStore(state => state.saveLoadout);
  const { lastRequest } = useBuildStore();

  if (result.topResults.length === 0) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in-up">
        <p className="text-4xl mb-4">😔</p>
        <h3 className="font-[family-name:var(--font-orbitron)] text-sm font-semibold uppercase tracking-wider mb-2">
          Sin Resultados
        </h3>
        <p className="text-sm text-[var(--forge-text-secondary)]">
          No se encontraron combinaciones de armadura que cumplan los requisitos.
          Intenta reducir los targets de stats mínimos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Resumen */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="font-[family-name:var(--font-orbitron)] text-sm font-semibold uppercase tracking-wider">
                Resultados del Optimizador
              </h3>
              <p className="text-xs text-[var(--forge-text-muted)]">
                {result.topResults.length} builds encontrados de{' '}
                {result.totalPermutations.toLocaleString('es-ES')} permutaciones
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--forge-text-muted)]">Tiempo</p>
            <p className="text-sm font-bold text-[var(--forge-accent)] tabular-nums">
              {result.executionTimeMs < 1000
                ? `${Math.round(result.executionTimeMs)}ms`
                : `${(result.executionTimeMs / 1000).toFixed(1)}s`}
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Set */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {result.topResults.slice(0, 10).map((perm, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            className={`
              shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium
              transition-all duration-200 border cursor-pointer
              ${
                i === selectedIndex
                  ? 'border-[var(--forge-border-accent)] bg-[var(--forge-accent-dim)] text-[var(--forge-accent)]'
                  : 'border-[var(--forge-border)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]'
              }
            `}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-bold">#{i + 1}</span>
              <span className="text-[10px] tabular-nums">
                T{perm.totalTiersWithMods ?? perm.totalTiers} | W{perm.wastedStats}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Detalle del Set Seleccionado */}
      {selectedSet && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Piezas de Armadura */}
          <div className="glass-card p-5">
            <h4 className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-widest mb-4">
              Piezas de Armadura
            </h4>
            <div className="space-y-3">
              <ArmorPieceRow slot="Casco" item={selectedSet.pieces.helmet} />
              <ArmorPieceRow slot="Brazos" item={selectedSet.pieces.gauntlets} />
              <ArmorPieceRow slot="Pecho" item={selectedSet.pieces.chest} />
              <ArmorPieceRow slot="Piernas" item={selectedSet.pieces.legs} />
              <ArmorPieceRow slot="Marca" item={selectedSet.pieces.classItem} />
            </div>
          </div>

          {/* Stats del Set */}
          <div className="glass-card p-5">
            <h4 className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-widest mb-4">
              Stats del Set
            </h4>
            <StatsPanel
              stats={selectedSet.totalStats}
              tiers={selectedSet.tiers}
              tier1Stats={tier1Stats}
              tier2Stats={tier2Stats}
              totalTiers={selectedSet.totalTiersWithMods ?? selectedSet.totalTiers}
              wastedStats={selectedSet.wastedStats}
            />
          </div>

          {/* Mods Recomendados */}
          {selectedSet.statMods && selectedSet.statMods.length > 0 && (
            <div className="glass-card p-5 lg:col-span-2">
              <h4 className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-lg">⚙️</span> Mods de Stat Requeridos
              </h4>
              <div className="flex flex-wrap gap-3">
                {selectedSet.statMods.map((mod, index) => (
                  <div key={index} className="px-3 py-1.5 rounded-lg bg-[var(--forge-bg-secondary)] border border-[rgba(255,255,255,0.1)] flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[var(--forge-text-secondary)]">
                       {mod.stat === 'resilience' ? 'Resiliencia' :
                        mod.stat === 'recovery' ? 'Recuperación' :
                        mod.stat === 'discipline' ? 'Disciplina' :
                        mod.stat === 'mobility' ? 'Movilidad' :
                        mod.stat === 'intellect' ? 'Intelecto' :
                        mod.stat === 'strength' ? 'Fuerza' : mod.stat}
                    </span>
                    <span className="text-xs text-[var(--forge-accent)] font-bold">
                       +{mod.value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[var(--forge-text-muted)] mt-3">
                * Asigna estos {selectedSet.statMods.length} mods en cualquier pieza de armadura con energía disponible.
              </p>
            </div>
          )}

          {/* Acción Guardar Loadout */}
          <div className="lg:col-span-2 flex justify-end mt-2">
             <button
                onClick={() => {
                   const name = prompt('Dale un nombre a este Loadout:', 'Mi Build Perfecta');
                   if (name && lastRequest) {
                      saveLoadout(name, selectedSet, CLASS_TYPE_MAP[lastRequest.guardianClass] ?? 1);
                      alert('¡Loadout guardado en tu Armería local!');
                   }
                }}
                className="px-6 py-2 bg-[var(--forge-accent)] text-black font-bold font-[family-name:var(--font-orbitron)] rounded-lg hover:bg-[#d8a83b] transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-[var(--forge-accent)]/20"
             >
                <span>💾</span> Guardar Loadout
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente de pieza de armadura ──────────────────────────

function ArmorPieceRow({
  slot,
  item,
}: {
  slot: string;
  item: ArmorPermutation['pieces']['helmet'];
}) {
  const iconUrl = item.icon
    ? `${BUNGIE.CDN_ROOT}${item.icon}`
    : undefined;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--forge-bg-secondary)] border border-[var(--forge-border)] group hover:border-[rgba(255,255,255,0.08)] transition-colors">
      {/* Icono */}
      <div className="w-10 h-10 rounded-lg bg-[var(--forge-bg-tertiary)] overflow-hidden flex items-center justify-center shrink-0">
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg">🛡️</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-medium truncate ${
            item.isExotic
              ? 'text-[var(--forge-accent)]'
              : 'text-[var(--forge-text-primary)]'
          }`}
        >
          {item.name}
        </p>
        <p className="text-[10px] text-[var(--forge-text-muted)]">
          {slot}
          {item.isMasterworked && ' • MW'}
          {item.isArtifice && ' • Artifice'}
        </p>
      </div>

      {/* Stat total base */}
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-[var(--forge-text-secondary)] tabular-nums">
          {Object.values(item.baseStats).reduce((a, b) => a + b, 0)}
        </p>
        <p className="text-[10px] text-[var(--forge-text-muted)]">total</p>
      </div>
    </div>
  );
}
