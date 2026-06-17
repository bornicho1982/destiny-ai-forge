'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BUNGIE } from '@/lib/constants';
import { Tooltip } from '@/components/ui/tooltip';
import { isArmor, isWeapon, type InventoryItem } from '@/lib/search/filter-engine';

interface ItemCardProps {
  item: InventoryItem;
  id: string; // The dnd-kit id
  isOverlay?: boolean;
}

export function ItemCard({ item, id, isOverlay = false }: ItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  const armorStats = isArmor(item) ? Object.values(item.baseStats).reduce((a, b) => a + b, 0) : null;
  const powerLevel = isWeapon(item) ? item.powerLevel : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`item-tile select-none ${isOverlay ? 'drag-overlay' : ''}`}
      data-tier={item.tier.toLowerCase()}
      data-masterwork={isArmor(item) ? item.isMasterworked : item.isMasterwork}
      data-equipped={item.isEquipped}
    >
      <Tooltip 
         content={
           <div className="flex flex-col gap-1">
             <span className="font-bold">{item.name}</span>
             <span className="text-[10px] text-[var(--forge-text-muted)] capitalize">{item.slot}</span>
             {isArmor(item) && <span className="text-[10px] text-[var(--forge-accent)]">Stats Base: {armorStats}</span>}
             {isWeapon(item) && <span className="text-[10px] text-[var(--forge-accent)]">Power: {powerLevel}</span>}
             {isWeapon(item) && <span className="text-[10px] text-[var(--forge-text-muted)]">{item.damageType}</span>}
           </div>
         }
         delay={300}
      >
        <div className="w-full h-full relative">
          <img src={`${BUNGIE.CDN_ROOT}${item.icon}`} alt={item.name} className="w-full h-full pointer-events-none" />
          
          {item.watermark && (
            <img src={`${BUNGIE.CDN_ROOT}${item.watermark}`} alt="" className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" />
          )}

          {/* Little number at bottom right: Stats for armor, Power for weapon */}
          <div className="absolute bottom-0 right-0 bg-black/60 px-1 rounded-tl text-[10px] font-bold text-white leading-none pb-[1px] pointer-events-none">
            {armorStats ?? powerLevel}
          </div>
          
          {/* Damage type icon for weapons (simplified to colored circle for now) */}
          {isWeapon(item) && item.slot !== 'Kinetic' && (
             <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full border border-black pointer-events-none" 
                  style={{
                    backgroundColor: 
                      item.damageType === 'Solar' ? '#f5a623' : 
                      item.damageType === 'Arc' ? '#79bbe8' : 
                      item.damageType === 'Void' ? '#b07be5' : 
                      item.damageType === 'Stasis' ? '#4d88ff' : 
                      item.damageType === 'Strand' ? '#3ddc84' : 'transparent'
                  }} 
             />
          )}
        </div>
      </Tooltip>
    </div>
  );
}
