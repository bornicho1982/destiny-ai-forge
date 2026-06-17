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
         // Fallback extra: buscar cualquier item (equipado o no) en el inventario del personaje de esta clase
         const anyCharItem = armorInventory.find(i => Number(i.classType) === Number(loadout.classType) && i.location === 'character' && i.characterId);
         if (anyCharItem) {
            targetCharacterId = anyCharItem.characterId;
         }
      }

      if (!targetCharacterId) {
        alert(`INFO DEBUG: loadout.classType=${loadout.classType}, chars=${characters.length}, armor=${armorInventory.length}. Fallo al buscar la ID.`);
        return;
      }
      
      const itemsToEquip = pieces.map(p => ({
        itemHash: p!.itemHash,
        instanceId: p!.instanceId,
        location: p!.location || 'vault',
        characterId: p!.characterId,
        isEquipped: p!.isEquipped,
      }));
      
      const res = await fetch('/api/destiny/equip-loadout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCharacterId: targetCharacterId,
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
        <p className="text-4xl mb-4">💾</p>
        <h3 className="font-[family-name:var(--font-orbitron)] text-sm font-semibold uppercase tracking-wider mb-2 text-[var(--forge-text-primary)]">
          No tienes Builds Guardadas
        </h3>
        <p className="text-sm text-[var(--forge-text-muted)] max-w-sm mx-auto">
          Ve al Constructor Forge AI, busca la combinación perfecta y pulsa en "Guardar Loadout" para que aparezca aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {loadouts.map(loadout => {
        // Encontrar los items en el inventario actual
        const pieces = [
          armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.helmet),
          armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.gauntlets),
          armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.chest),
          armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.legs),
          armorInventory.find(i => i.instanceId === loadout.armorInstanceIds.classItem),
        ].filter(Boolean);
        
        // Exótico para el header
        const exotic = pieces.find(p => p?.isExotic);
        
        const date = new Date(loadout.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

        return (
          <div key={loadout.id} className="glass-card overflow-hidden flex flex-col hover:border-[rgba(255,255,255,0.2)] transition-colors group">
             {/* Cabecera del Loadout */}
             <div className="p-4 bg-[var(--forge-bg-secondary)] border-b border-[rgba(255,255,255,0.05)] flex justify-between items-start">
               <div className="flex gap-3 items-center">
                 {exotic?.icon ? (
                   <img src={`${BUNGIE.CDN_ROOT}${exotic.icon}`} className="w-10 h-10 rounded border border-[var(--forge-accent)]" alt="Exotic" />
                 ) : (
                   <div className="w-10 h-10 rounded bg-[var(--forge-bg-tertiary)] flex items-center justify-center text-xl">🛡️</div>
                 )}
                 <div>
                    <h4 className="font-bold text-[var(--forge-text-primary)] leading-tight">{loadout.name}</h4>
                    <p className="text-[10px] text-[var(--forge-text-muted)] mt-0.5">
                      {loadout.classType === 0 ? 'Titán' : loadout.classType === 1 ? 'Cazador' : 'Hechicero'} • Guardado el {date}
                    </p>
                 </div>
               </div>
               <button 
                 onClick={() => deleteLoadout(loadout.id)}
                 className="text-[var(--forge-text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                 title="Borrar"
               >
                 ✕
               </button>
             </div>
             
             {/* Stats Resumen */}
             <div className="p-4 grid grid-cols-3 gap-2">
                <StatBadge icon="🏃‍♂️" val={loadout.tiers.mobility} max={100} />
                <StatBadge icon="🛡️" val={loadout.tiers.resilience} max={100} />
                <StatBadge icon="❤️" val={loadout.tiers.recovery} max={100} />
                <StatBadge icon="💣" val={loadout.tiers.discipline} max={100} />
                <StatBadge icon="🧠" val={loadout.tiers.intellect} max={100} />
                <StatBadge icon="💪" val={loadout.tiers.strength} max={100} />
             </div>
             
             {/* Footer con Total Tiers y Botón Equipar (futuro) */}
             <div className="mt-auto p-4 border-t border-[rgba(255,255,255,0.05)] bg-[var(--forge-bg-primary)]/50 flex justify-between items-center">
                <span className="font-[family-name:var(--font-orbitron)] font-bold text-xs text-[var(--forge-accent)]">
                   T{loadout.totalTiers} BUILD
                </span>
                <button 
                   onClick={() => handleEquipLoadout(loadout)}
                   disabled={equippingId === loadout.id}
                   className="px-3 py-1.5 rounded bg-[var(--forge-bg-tertiary)] border border-[rgba(255,255,255,0.1)] text-xs font-semibold text-[var(--forge-text-secondary)] hover:bg-[var(--forge-accent)] hover:text-black hover:border-[var(--forge-accent)] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {equippingId === loadout.id ? '⏳ Transfiriendo...' : '🚀 Equipar'}
                </button>
             </div>
          </div>
        );
      })}
    </div>
  );
}

function StatBadge({ icon, val, max }: { icon: string, val: number, max: number }) {
  const isMax = val >= 100;
  return (
    <div className={`flex items-center justify-between p-1.5 rounded border ${isMax ? 'border-[var(--forge-accent)] bg-[var(--forge-accent)]/10 text-[var(--forge-accent)]' : 'border-[rgba(255,255,255,0.05)] bg-[var(--forge-bg-tertiary)] text-[var(--forge-text-secondary)]'}`}>
       <span className="text-xs">{icon}</span>
       <span className="text-xs font-bold tabular-nums">{val}</span>
    </div>
  );
}
