// ============================================================
// Destiny AI Forge — API de Equipamiento de Loadouts
// ============================================================
// Endpoint para transferir piezas de armadura desde la bóveda
// u otros personajes, y equiparlas de golpe usando la API de Bungie.
// ============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createBungieClient } from '@/lib/bungie/api-client';

export interface EquipLoadoutRequest {
  targetCharacterId: string;
  items: {
    itemHash: number;
    instanceId: string;
    location: 'vault' | 'character';
    characterId?: string;
    isEquipped: boolean;
  }[];
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { targetCharacterId, items } = (await req.json()) as EquipLoadoutRequest;
    if (!targetCharacterId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const client = createBungieClient(session.accessToken);
    const membershipType = session.destinyMembershipType!;

    // ── Paso 1: Mover todo al personaje de destino ──
    for (const item of items) {
      // Si el item ya está en este personaje
      if (item.location === 'character' && item.characterId === targetCharacterId) {
        // No hay que transferir
        continue;
      }

      // Si está equipado en OTRO personaje, primero debe desequiparse.
      // Pero como la API no tiene un "Unequip", hay que equipar algo básico o falla.
      // D2ArmorPicker y DIM manejan esto de forma compleja equipando blancos.
      // Por simplicidad en V1, si falla moverlo porque está equipado, el try/catch lo ignorará y seguirá.
      
      // Si está en otro personaje, mover primero a la bóveda
      if (item.location === 'character' && item.characterId !== targetCharacterId) {
        await client.post('/Destiny2/Actions/Items/TransferItem/', {
          itemReferenceHash: item.itemHash,
          stackSize: 1,
          transferToVault: true,
          itemId: item.instanceId,
          characterId: item.characterId,
          membershipType,
        }).catch(e => console.warn('Error moviendo a bóveda:', e));
      }

      // Mover de la bóveda al personaje destino
      await client.post('/Destiny2/Actions/Items/TransferItem/', {
        itemReferenceHash: item.itemHash,
        stackSize: 1,
        transferToVault: false,
        itemId: item.instanceId,
        characterId: targetCharacterId,
        membershipType,
      }).catch(e => console.warn('Error moviendo al personaje:', e));
      
      // Esperar un poco entre transferencias para no saturar a Bungie
      await new Promise(r => setTimeout(r, 200));
    }

    // ── Paso 2: Equipar todos de golpe ──
    const equipResponse = await client.post('/Destiny2/Actions/Items/EquipItems/', {
      itemIds: items.map(i => i.instanceId),
      characterId: targetCharacterId,
      membershipType,
    });

    return NextResponse.json({ success: true, equipResult: equipResponse });

  } catch (error) {
    console.error('[Equip API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Desconocido';
    return NextResponse.json(
      { error: `Bungie dice: ${errorMessage}` },
      { status: 500 }
    );
  }
}
