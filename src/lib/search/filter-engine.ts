// ============================================================
// Destiny AI Forge — Search & Filter Engine
// ============================================================
// Motor de búsqueda estilo DIM con soporte para queries 
// complejas (is:exotic, is:masterwork, stat:resilience:>20)
// ============================================================

import type { ArmorItem } from '@/lib/armor/types';
import type { WeaponItem } from '@/lib/bungie/types-weapons';

export type InventoryItem = ArmorItem | WeaponItem;

export function isArmor(item: InventoryItem): item is ArmorItem {
  return 'baseStats' in item;
}

export function isWeapon(item: InventoryItem): item is WeaponItem {
  return 'damageType' in item;
}

export class FilterEngine {
  /**
   * Filtra una lista de items basándose en una query de texto.
   * Soporta filtros por nombre y filtros avanzados estilo DIM.
   */
  static filter(items: InventoryItem[], query: string): InventoryItem[] {
    if (!query || query.trim() === '') return items;

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

    return items.filter(item => {
      // Si el item coincide con TODOS los términos
      return terms.every(term => this.matchesTerm(item, term));
    });
  }

  private static matchesTerm(item: InventoryItem, term: string): boolean {
    // Manejo de prefijos
    if (term.startsWith('is:')) {
      return this.matchIsFilter(item, term.slice(3));
    }
    if (term.startsWith('stat:')) {
      return this.matchStatFilter(item, term.slice(5));
    }

    // Búsqueda simple por nombre
    return item.name.toLowerCase().includes(term);
  }

  private static matchIsFilter(item: InventoryItem, value: string): boolean {
    switch (value) {
      case 'exotic':
        return item.tier.toLowerCase() === 'exotic';
      case 'legendary':
        return item.tier.toLowerCase() === 'legendary';
      case 'rare':
        return item.tier.toLowerCase() === 'rare';
      case 'common':
        return item.tier.toLowerCase() === 'common';
      case 'masterwork':
        if (isArmor(item)) return item.isMasterworked;
        if (isWeapon(item)) return item.isMasterwork;
        return false;
      case 'artifice':
        return isArmor(item) && item.isArtifice;
      case 'crafted':
        return isWeapon(item) && item.isCrafted;
      case 'equipped':
        return item.isEquipped;
      case 'vault':
        return item.location === 'vault';
      case 'armor':
        return isArmor(item);
      case 'weapon':
        return isWeapon(item);
      case 'kinetic':
        return isWeapon(item) && item.damageType === 'Kinetic';
      case 'energy':
        return isWeapon(item) && item.slot === 'Energy';
      case 'power':
      case 'heavy':
        return isWeapon(item) && item.slot === 'Power';
      default:
        // Por si es un slot (helmet, gauntlets, etc.)
        return item.slot.toLowerCase() === value;
    }
  }

  private static matchStatFilter(item: InventoryItem, value: string): boolean {
    // stat:resilience:>20
    if (!isArmor(item)) return false;

    const parts = value.split(':');
    if (parts.length < 2) return false;

    const statName = parts[0] as keyof ArmorItem['baseStats'];
    const operatorAndValue = parts[1]; // >20, <10, =15, 20

    if (!(statName in item.baseStats)) return false;

    const statValue = item.baseStats[statName];

    let operator = '=';
    let targetStr = operatorAndValue;

    if (operatorAndValue.startsWith('>=')) { operator = '>='; targetStr = operatorAndValue.slice(2); }
    else if (operatorAndValue.startsWith('<=')) { operator = '<='; targetStr = operatorAndValue.slice(2); }
    else if (operatorAndValue.startsWith('>')) { operator = '>'; targetStr = operatorAndValue.slice(1); }
    else if (operatorAndValue.startsWith('<')) { operator = '<'; targetStr = operatorAndValue.slice(1); }
    else if (operatorAndValue.startsWith('=')) { operator = '='; targetStr = operatorAndValue.slice(1); }

    const targetValue = parseInt(targetStr, 10);
    if (isNaN(targetValue)) return false;

    switch (operator) {
      case '>': return statValue > targetValue;
      case '>=': return statValue >= targetValue;
      case '<': return statValue < targetValue;
      case '<=': return statValue <= targetValue;
      case '=': return statValue === targetValue;
      default: return false;
    }
  }
}
