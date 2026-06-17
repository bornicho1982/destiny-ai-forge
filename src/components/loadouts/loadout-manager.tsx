'use client';

import { useState } from 'react';
import { useLoadoutStore, type SavedLoadout } from '@/stores/loadout-store';
import { BUNGIE } from '@/lib/constants';
import { useBuildStore } from '@/stores/build-store';

export function LoadoutManager() {
  const { loadouts, deleteLoadout } = useLoadoutStore();
  const { armorInventory, characters } = useBuildStore();
  
  const [equippingId, setEquippingId] = useState<string | null>(null);

  const handleEquipLoadout = async (loadout: SavedLoadout) => {
    try {
      setEquippingId(loadout.id);
      
      const pieces = [
        armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.helmet),
        armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.gauntlets),
        armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.chest),
        armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.legs),
        armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.classItem),
      ].filter(Boolean);
      
      const char = characters.find(c => Number(c.classType) === Number(loadout.classType));
      let targetCharacterId = char?.id;

      if (!targetCharacterId) {
         const anyCharItem = armorInventory.find(i => Number(i.classType) === Number(loadout.classType) && i.location === 'character' && i.characterId);
         if (anyCharItem) targetCharacterId = anyCharItem.characterId;
      }

      if (!targetCharacterId) {
        alert(`No se encontró un personaje de esta clase.`);
        return;
      }
      
      const itemsToEquip = pieces.map(p => ({
        itemHash: p!.itemHash,
        instanceId: p!.instanceId,
        location: p!.location || 'vault',
        characterId: p!.characterId,
        isEquipped: p!.isEquipped,
      }));
      
      const res = await fetch('/api/destiny/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'equip-from-vault',
          characterId: targetCharacterId,
          membershipType: 3,
          items: itemsToEquip,
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('¡Loadout equipado exitosamente en tu personaje!');
    } catch (err: any) {
      alert(`Error al equipar: ${err.message}`);
    } finally {
      setEquippingId(null);
    }
  };

  if (loadouts.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in flex flex-col items-center justify-center">
        <p className="text-4xl mb-4 animate-float">💾</p>
        <h3 className="font-[family-name:var(--font-orbitron)] text-sm font-semibold uppercase tracking-wider mb-2 text-[var(--forge-text-primary)]">
          Bóveda Vacía
        </h3>
        <p className="text-sm text-[var(--forge-text-muted)] max-w-sm mx-auto">
          Ve al Constructor Forge AI, busca la combinación perfecta y pulsa en "Guardar Loadout".
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in">
      {loadouts.map(loadout => {
        const pieces = [
          armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.helmet),
          armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.gauntlets),
          armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.chest),
          armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.legs),
          armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.classItem),
        ];
        
        const exotic = pieces.find(p => p?.isExotic);
        const date = new Date(loadout.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

        return (
          <div key={loadout.id} className="glass-card overflow-hidden flex flex-col hover:border-[rgba(255,255,255,0.2)] transition-colors group relative">
             {/* Glow decorativo del exótico */}
             {exotic && (
                <div 
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 pointer-events-none"
                  style={{ backgroundColor: '#ceae33' }}
                />
             )}

             {/* Cabecera */}
             <div className="p-4 bg-gradient-to-r from-[var(--forge-bg-secondary)] to-transparent border-b border-[var(--forge-border)] flex justify-between items-start relative z-10">
               <div className="flex gap-4 items-center">
                 {exotic?.icon ? (
                   <img src={`${BUNGIE.CDN_ROOT}${exotic.icon}`} className="w-12 h-12 rounded-lg border-2 border-[#ceae33] shadow-[0_0_10px_rgba(206,174,51,0.3)]" alt="Exotic" />
                 ) : (
                   <div className="w-12 h-12 rounded-lg bg-[var(--forge-bg-tertiary)] flex items-center justify-center text-xl border border-[var(--forge-border)]">🛡️</div>
                 )}
                 <div>
                    <h4 className="font-[family-name:var(--font-orbitron)] font-bold text-lg text-[var(--forge-text-primary)] leading-tight tracking-wider">{loadout.name}</h4>
                    <p className="text-xs font-semibold text-[var(--forge-text-muted)] mt-1 uppercase tracking-widest">
                      {loadout.classType === 0 ? 'Titán' : loadout.classType === 1 ? 'Cazador' : 'Hechicero'} 
                      <span className="mx-2 opacity-50">|</span> 
                      {date}
                    </p>
                 </div>
               </div>
               <button 
                 onClick={() => deleteLoadout(loadout.id)}
                 className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--forge-text-muted)] hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                 title="Eliminar Loadout"
               >
                 ✕
               </button>
             </div>
             
             <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-[var(--forge-border)]">
               
               {/* Stats Resumen */}
               <div className="p-4 flex-1 grid grid-cols-3 gap-3 bg-[var(--forge-bg-tertiary)]/30">
                  <StatBadge icon="🏃‍♂️" val={loadout.tiers.mobility || 0} max={100} label="Mob" />
                  <StatBadge icon="🛡️" val={loadout.tiers.resilience || 0} max={100} label="Res" />
                  <StatBadge icon="❤️" val={loadout.tiers.recovery || 0} max={100} label="Rec" />
                  <StatBadge icon="💣" val={loadout.tiers.discipline || 0} max={100} label="Dis" />
                  <StatBadge icon="🧠" val={loadout.tiers.intellect || 0} max={100} label="Int" />
                  <StatBadge icon="💪" val={loadout.tiers.strength || 0} max={100} label="Str" />
               </div>

               {/* Armaduras Grid (Mini iconos) */}
               <div className="p-4 w-full sm:w-48 flex-shrink-0 flex items-center justify-center bg-[var(--forge-bg-secondary)]">
                 <div className="flex gap-1.5 flex-wrap justify-center">
                    {pieces.map((p, idx) => p ? (
                      <div key={p.instanceId} className="w-10 h-10 rounded overflow-hidden relative border border-[var(--forge-border)] shadow-sm">
                         <img src={`${BUNGIE.CDN_ROOT}${p.icon}`} className="w-full h-full" alt={p.name} title={p.name} />
                         {p.isMasterworked && <div className="absolute inset-0 border-2 border-[#ceae33] rounded"></div>}
                      </div>
                    ) : (
                      <div key={idx} className="w-10 h-10 rounded border border-dashed border-[var(--forge-border)] bg-[var(--forge-bg-tertiary)] flex items-center justify-center opacity-50">?</div>
                    ))}
                 </div>
               </div>
             </div>
             
             {/* Footer con Total Tiers y Botón Equipar */}
             <div className="mt-auto p-4 border-t border-[var(--forge-border)] bg-[var(--forge-bg-primary)] flex justify-between items-center relative z-10">
                <span className="font-[family-name:var(--font-orbitron)] font-bold text-sm tracking-widest text-[var(--forge-accent)] flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-[var(--forge-accent)] animate-pulse"></span>
                   T{loadout.totalTiers} BUILD
                </span>
                <button 
                   onClick={() => handleEquipLoadout(loadout)}
                   disabled={equippingId === loadout.id}
                   className="px-6 py-2 rounded-lg bg-gradient-to-r from-[var(--forge-bg-tertiary)] to-[var(--forge-bg-secondary)] border border-[rgba(255,255,255,0.1)] text-xs font-bold text-white hover:border-[var(--forge-accent)] hover:shadow-[0_0_10px_rgba(232,185,74,0.2)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                   {equippingId === loadout.id ? (
                     <><span className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin"/> Transfiriendo...</>
                   ) : '🚀 Equipar en Juego'}
                </button>
             </div>
          </div>
        );
      })}
    </div>
  );
}

function StatBadge({ icon, val, max, label }: { icon: string, val: number, max: number, label: string }) {
  const isMax = val >= 100;
  return (
    <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg border ${isMax ? 'border-[var(--forge-accent)] bg-[var(--forge-accent)]/10 text-[var(--forge-accent)] shadow-[0_0_5px_rgba(232,185,74,0.2)]' : 'border-[rgba(255,255,255,0.05)] bg-[var(--forge-bg-primary)] text-[var(--forge-text-primary)]'}`}>
       <div className="flex items-center gap-1.5">
         <span className="text-sm">{icon}</span>
         <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 hidden md:block">{label}</span>
       </div>
       <span className="text-sm font-black tabular-nums">{val}</span>
    </div>
  );
}
