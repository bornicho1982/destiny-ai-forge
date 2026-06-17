import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ArmorPermutation, ArmorItem } from '@/lib/armor/types';

export interface SavedLoadout {
  id: string;
  name: string;
  createdAt: number;
  classType: number;
  
  /** IDs de las instancias de armadura para poder buscarlas en el inventario real */
  armorInstanceIds: {
    helmet: string;
    gauntlets: string;
    chest: string;
    legs: string;
    classItem: string;
  };
  
  /** Tiers de stats totales para mostrar rápidamente */
  totalTiers: number;
  tiers: Record<string, number>;
  
  /** Hash del exótico para poner el icono bonito en la lista */
  exoticHash?: number;
}

interface LoadoutState {
  loadouts: SavedLoadout[];
  saveLoadout: (name: string, permutation: ArmorPermutation, classType: number) => void;
  deleteLoadout: (id: string) => void;
}

export const useLoadoutStore = create<LoadoutState>()(
  persist(
    (set) => ({
      loadouts: [],
      
      saveLoadout: (name, permutation, classType) => {
        // Encontrar el exótico
        const exotic = Object.values(permutation.pieces).find(p => p.isExotic);
        
        const newLoadout: SavedLoadout = {
          id: crypto.randomUUID(),
          name,
          createdAt: Date.now(),
          classType,
          armorInstanceIds: {
            helmet: permutation.pieces.helmet.instanceId || '',
            gauntlets: permutation.pieces.gauntlets.instanceId || '',
            chest: permutation.pieces.chest.instanceId || '',
            legs: permutation.pieces.legs.instanceId || '',
            classItem: permutation.pieces.classItem.instanceId || '',
          },
          totalTiers: permutation.totalTiersWithMods ?? permutation.totalTiers,
          tiers: { ...permutation.tiers },
          exoticHash: exotic?.itemHash,
        };

        set((state) => ({
          loadouts: [newLoadout, ...state.loadouts]
        }));
      },
      
      deleteLoadout: (id) => {
        set((state) => ({
          loadouts: state.loadouts.filter(l => l.id !== id)
        }));
      }
    }),
    {
      name: 'forge-loadouts', // key in localStorage
    }
  )
);
