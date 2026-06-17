'use client';

import { useBuildStore } from '@/stores/build-store';
import { BUNGIE } from '@/lib/constants';
import type { ArmorItem } from '@/lib/armor/types';

export function InventoryManager() {
  const { characters, armorInventory, isLoadingInventory } = useBuildStore();
  
  if (isLoadingInventory || characters.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in flex flex-col items-center justify-center">
        <p className="text-4xl mb-4">📦</p>
        <h3 className="font-[family-name:var(--font-orbitron)] text-sm font-semibold uppercase tracking-wider mb-2 text-[var(--forge-text-primary)]">
          Cargando Armería...
        </h3>
        <p className="text-sm text-[var(--forge-text-muted)] max-w-sm mx-auto">
          Obteniendo personajes y extrayendo armaduras de la bóveda...
        </p>
      </div>
    );
  }

  // Agrupar inventario
  const vaultItems = armorInventory.filter(i => i.location === 'vault');
  const itemsByCharacter = characters.map(char => ({
    ...char,
    items: armorInventory.filter(i => i.characterId === char.id)
  }));

  // Ordenamos los personajes de mayor luz a menor
  itemsByCharacter.sort((a, b) => b.light - a.light);

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin items-start">
      {/* Columnas de personajes */}
      {itemsByCharacter.map(char => (
        <div key={char.id} className="min-w-[320px] max-w-[320px] flex-shrink-0 flex flex-col gap-4">
          <div 
             className="h-20 rounded-xl overflow-hidden relative shadow-lg"
             style={{ backgroundImage: `url(${BUNGIE.CDN_ROOT}${char.emblemBackgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
             <div className="absolute inset-0 bg-black/10" />
             <div className="relative h-full flex items-center p-3 gap-4">
               <img src={`${BUNGIE.CDN_ROOT}${char.emblemUrl}`} className="w-14 h-14 border-2 border-white/20" alt="Emblem" />
               <div className="flex flex-col drop-shadow-md">
                 <span className="text-white font-bold text-xl leading-tight">
                    {char.classType === 0 ? 'Titán' : char.classType === 1 ? 'Cazador' : 'Hechicero'}
                 </span>
                 <span className="text-[#f5d96a] font-semibold text-sm">✨ {char.light}</span>
               </div>
             </div>
          </div>
          <div className="flex-1 glass-card p-3 overflow-y-auto max-h-[65vh] space-y-2 scrollbar-thin">
            {['helmet', 'gauntlets', 'chest', 'legs', 'classItem'].map(slot => {
               const slotItems = char.items.filter(i => i.slot === slot);
               // Poner los equipados primero
               slotItems.sort((a, b) => (b.isEquipped ? 1 : 0) - (a.isEquipped ? 1 : 0));
               return slotItems.map(item => (
                 <InventoryItemRow key={item.instanceId} item={item} />
               ));
            })}
          </div>
        </div>
      ))}
      
      {/* Columna Bóveda */}
      <div className="min-w-[320px] max-w-[320px] flex-shrink-0 flex flex-col gap-4">
          <div className="h-20 rounded-xl overflow-hidden relative shadow-lg bg-gradient-to-r from-[var(--forge-bg-secondary)] to-[var(--forge-bg-tertiary)] border border-[var(--forge-border)]">
             <div className="relative h-full flex items-center p-3 gap-4">
               <div className="w-14 h-14 flex items-center justify-center bg-[var(--forge-bg-primary)] rounded border border-[var(--forge-border)]">
                 <span className="text-2xl">📦</span>
               </div>
               <div className="flex flex-col drop-shadow-md">
                 <span className="text-white font-bold text-xl leading-tight">Bóveda</span>
                 <span className="text-[var(--forge-text-muted)] font-semibold text-sm">{vaultItems.length} objetos</span>
               </div>
             </div>
          </div>
          <div className="flex-1 glass-card p-3 overflow-y-auto max-h-[65vh] space-y-2 scrollbar-thin">
             {vaultItems.map(item => (
                <InventoryItemRow key={item.instanceId} item={item} />
             ))}
          </div>
      </div>
    </div>
  );
}

function InventoryItemRow({ item }: { item: ArmorItem }) {
  const totalStats = Object.values(item.baseStats).reduce((a,b) => a + b, 0);

  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg bg-[var(--forge-bg-tertiary)] border transition-all 
        ${item.isEquipped ? 'border-[var(--forge-accent)] bg-[var(--forge-accent-dim)]' : 'border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)]'}`}>
      <div className="w-10 h-10 shrink-0 relative">
         <img src={`${BUNGIE.CDN_ROOT}${item.icon}`} alt={item.name} className="w-full h-full rounded" />
         {item.watermark && (
            <img src={`${BUNGIE.CDN_ROOT}${item.watermark}`} alt="Watermark" className="absolute inset-0 w-full h-full opacity-60" />
         )}
         {item.isMasterworked && (
            <div className="absolute inset-0 border-2 border-yellow-400 rounded"></div>
         )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs truncate font-semibold ${item.isExotic ? 'text-[#ceae33]' : 'text-[var(--forge-text-primary)]'}`}>
          {item.name}
        </p>
        <div className="flex gap-1.5 items-center text-[10px] text-[var(--forge-text-muted)]">
           <span className="capitalize">{item.slot}</span>
           {item.isEquipped && <span className="text-[var(--forge-accent)] font-bold px-1 rounded bg-[var(--forge-bg-primary)]">Eqp</span>}
           {item.isArtifice && <span className="text-emerald-400">Artífice</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-sm font-bold text-[var(--forge-text-secondary)] tabular-nums">{totalStats}</span>
      </div>
    </div>
  );
}
