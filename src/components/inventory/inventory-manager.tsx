'use client';

import { useState, useMemo, useEffect } from 'react';
import { useBuildStore } from '@/stores/build-store';
import { BUNGIE } from '@/lib/constants';
import { useLocale } from '@/hooks/use-locale';
import { FilterEngine, type InventoryItem } from '@/lib/search/filter-engine';
import { SearchBar } from './search-bar';
import { ItemCard } from './item-card';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { globalTransferQueue } from '@/lib/bungie/transfer-queue';

export function InventoryManager() {
  const { characters, armorInventory, weaponInventory, isLoadingInventory, setInventory } = useBuildStore();
  const { t } = useLocale();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require movement of 8px before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  const allItems = useMemo(() => {
    return [...weaponInventory, ...armorInventory];
  }, [weaponInventory, armorInventory]);

  const filteredItems = useMemo(() => {
    return FilterEngine.filter(allItems, searchQuery);
  }, [allItems, searchQuery]);

  if (isLoadingInventory || characters.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in flex flex-col items-center justify-center">
        <p className="text-4xl mb-4 animate-float">📦</p>
        <h3 className="font-[family-name:var(--font-orbitron)] text-sm font-semibold uppercase tracking-wider mb-2 text-[var(--forge-text-primary)]">
          {t('inventory.loading')}
        </h3>
        <p className="text-sm text-[var(--forge-text-muted)] max-w-sm mx-auto">
          {t('inventory.loadingDesc')}
        </p>
      </div>
    );
  }

  // Agrupar inventario filtrado
  const vaultItems = filteredItems.filter(i => i.location === 'vault');
  const itemsByCharacter = characters.map(char => ({
    ...char,
    items: filteredItems.filter(i => i.characterId === char.id)
  }));
  itemsByCharacter.sort((a, b) => b.light - a.light);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const targetId = over.id as string; // 'vault' or characterId

    const item = allItems.find(i => ('id' in i ? i.id : i.instanceId) === itemId);
    if (!item) return;

    // Si no cambió de ubicación
    if (item.location === 'vault' && targetId === 'vault') return;
    if (item.location === 'character' && item.characterId === targetId) return;

    // Optimistic UI Update
    const originalArmors = [...armorInventory];
    const originalWeapons = [...weaponInventory];

    const updateItemLocation = (list: any[]) => {
      return list.map(i => {
        if (('id' in i ? i.id : i.instanceId) === itemId) {
          return {
            ...i,
            location: targetId === 'vault' ? 'vault' : 'character',
            characterId: targetId === 'vault' ? undefined : targetId,
            isEquipped: false // moving unequips it
          };
        }
        return i;
      });
    };

    setInventory(updateItemLocation(armorInventory), updateItemLocation(weaponInventory));

    try {
      const isTargetVault = targetId === 'vault';
      const actualCharacterId = item.characterId || targetId;

      // Si está en otro personaje y va a un personaje distinto
      if (item.location === 'character' && !isTargetVault && item.characterId !== targetId) {
        // Move to vault first
        await globalTransferQueue.transferItem({
          itemReferenceHash: item.itemHash,
          itemId: 'id' in item ? item.id : item.instanceId,
          transferToVault: true,
          characterId: item.characterId!
        });
        // Move to target character
        await globalTransferQueue.transferItem({
          itemReferenceHash: item.itemHash,
          itemId: 'id' in item ? item.id : item.instanceId,
          transferToVault: false,
          characterId: targetId
        });
      } else {
        // Move directly
        await globalTransferQueue.transferItem({
          itemReferenceHash: item.itemHash,
          itemId: 'id' in item ? item.id : item.instanceId,
          transferToVault: isTargetVault,
          characterId: actualCharacterId
        });
      }
    } catch (e) {
      console.error('Transfer failed:', e);
      // Revert UI
      setInventory(originalArmors, originalWeapons);
      alert('Transfer failed: ' + (e as Error).message);
    }
  };

  const activeItem = activeId ? allItems.find(i => ('id' in i ? i.id : i.instanceId) === activeId) : null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex justify-between items-center bg-[var(--forge-bg-secondary)] p-4 rounded-xl border border-[var(--forge-border)]">
        <SearchBar onSearch={setSearchQuery} />
        <div className="text-sm font-semibold text-[var(--forge-text-muted)]">
          {filteredItems.length} {t('inventory.items')}
        </div>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin items-start h-full">
          {/* Columnas de personajes */}
          {itemsByCharacter.map(char => (
            <div key={char.id} className="min-w-[340px] max-w-[340px] flex-shrink-0 flex flex-col gap-4 h-full">
              <CharacterHeader char={char} t={t} />
              <ItemColumn id={char.id} items={char.items} />
            </div>
          ))}
          
          {/* Columna Bóveda */}
          <div className="min-w-[340px] max-w-[340px] flex-shrink-0 flex flex-col gap-4 h-full">
              <div className="h-20 rounded-xl overflow-hidden relative shadow-lg bg-[var(--forge-bg-tertiary)] border border-[var(--forge-border)]">
                 <div className="relative h-full flex items-center p-3 gap-4">
                   <div className="w-14 h-14 flex items-center justify-center bg-[var(--forge-bg-primary)] rounded border border-[var(--forge-border)]">
                     <span className="text-2xl">📦</span>
                   </div>
                   <div className="flex flex-col drop-shadow-md">
                     <span className="text-[var(--forge-text-primary)] font-bold text-xl leading-tight">{t('inventory.vault')}</span>
                     <span className="text-[var(--forge-text-muted)] font-semibold text-sm">{vaultItems.length} {t('inventory.items')}</span>
                   </div>
                 </div>
              </div>
              <ItemColumn id="vault" items={vaultItems} />
          </div>
        </div>

        <DragOverlay zIndex={1000}>
          {activeItem ? <ItemCard id={activeId!} item={activeItem} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function CharacterHeader({ char, t }: { char: any, t: any }) {
  return (
    <div 
       className="h-20 rounded-xl overflow-hidden relative shadow-lg border border-[var(--forge-border)]"
       style={{ backgroundImage: `url(${BUNGIE.CDN_ROOT}${char.emblemBackgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
       <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
       <div className="relative h-full flex items-center p-3 gap-4">
         <img src={`${BUNGIE.CDN_ROOT}${char.emblemUrl}`} className="w-14 h-14 border border-[var(--forge-border)] rounded shadow-sm" alt="Emblem" />
         <div className="flex flex-col drop-shadow-md">
           <span className="text-white font-bold text-lg leading-tight">
              {char.classType === 0 ? t('class.titan') : char.classType === 1 ? t('class.hunter') : t('class.warlock')}
           </span>
           <span className="text-[var(--forge-accent)] font-bold text-sm">✨ {char.light}</span>
         </div>
       </div>
    </div>
  );
}

import { useDroppable } from '@dnd-kit/core';

function ItemColumn({ id, items }: { id: string, items: InventoryItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  // Agrupar por categoria básica para renderizado
  const weapons = items.filter(i => 'damageType' in i);
  const armors = items.filter(i => 'baseStats' in i);

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 glass-card p-4 overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-thin flex flex-col gap-6
        ${isOver ? 'drop-target-active' : ''}`}
    >
      {weapons.length > 0 && (
        <ItemSection title="Weapons" items={weapons} />
      )}
      {armors.length > 0 && (
        <ItemSection title="Armor" items={armors} />
      )}
    </div>
  );
}

function ItemSection({ title, items }: { title: string, items: InventoryItem[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-bold text-[var(--forge-text-muted)] uppercase tracking-wider">{title}</h4>
      <SortableContext items={items.map(i => ('id' in i ? i.id : i.instanceId)!)} strategy={verticalListSortingStrategy}>
        <div className="item-grid">
          {items.map(item => (
            <ItemCard key={'id' in item ? item.id : item.instanceId} id={('id' in item ? item.id : item.instanceId)!} item={item} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
