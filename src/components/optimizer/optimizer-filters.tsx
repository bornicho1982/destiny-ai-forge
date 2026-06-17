'use client';

import { useBuildStore } from '@/stores/build-store';
import { useLocale } from '@/hooks/use-locale';

export function OptimizerFilters() {
  const { characters, armorInventory } = useBuildStore();
  const { t } = useLocale();

  // Basic stats placeholder
  const exoticCount = armorInventory.filter(a => a.isExotic).length;
  const legendaryCount = armorInventory.filter(a => !a.isExotic).length;
  const artificeCount = armorInventory.filter(a => a.isArtifice).length;

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-4">
      <h3 className="font-bold text-[var(--forge-text-primary)]">Optimizer Pre-Filters</h3>
      <p className="text-sm text-[var(--forge-text-muted)]">
        El worker descartará automáticamente armaduras legendarias con &lt;58 de stats base para acelerar el cálculo.
      </p>

      <div className="grid grid-cols-3 gap-2">
         <div className="bg-[var(--forge-bg-secondary)] p-2 rounded text-center border border-[var(--forge-border)]">
            <span className="block text-2xl font-bold text-[#ceae33]">{exoticCount}</span>
            <span className="text-xs text-[var(--forge-text-muted)]">Exóticos</span>
         </div>
         <div className="bg-[var(--forge-bg-secondary)] p-2 rounded text-center border border-[var(--forge-border)]">
            <span className="block text-2xl font-bold text-[#79bbe8]">{legendaryCount}</span>
            <span className="text-xs text-[var(--forge-text-muted)]">Legendarias</span>
         </div>
         <div className="bg-[var(--forge-bg-secondary)] p-2 rounded text-center border border-[var(--forge-border)]">
            <span className="block text-2xl font-bold text-emerald-400">{artificeCount}</span>
            <span className="text-xs text-[var(--forge-text-muted)]">Artífice</span>
         </div>
      </div>
    </div>
  );
}
