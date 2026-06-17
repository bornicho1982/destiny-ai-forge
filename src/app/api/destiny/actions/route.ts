// ============================================================
// Destiny AI Forge — API de Acciones de Inventario
// ============================================================
// POST /api/destiny/actions
//
// Proxy autenticado para las acciones de inventario de Bungie:
// - action: "transfer" → TransferItem
// - action: "equip" → EquipItems
// - action: "equip-from-vault" → Orquestación completa
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { BungieActionManager, BungieActionError } from '@/lib/bungie/action-manager';

export async function POST(request: NextRequest) {
  try {
    // ── 1. Autenticación ───────────────────────────────────
    const session = await getSession();
    if (!session || Date.now() > session.accessTokenExpiresAt) {
      return NextResponse.json(
        { success: false, error: 'Sesión expirada. Vuelve a iniciar sesión.' },
        { status: 401 }
      );
    }

    // ── 2. Parsear body ────────────────────────────────────
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Falta el campo "action" en la petición.' },
        { status: 400 }
      );
    }

    // ── 3. Crear el Action Manager con el token del usuario ─
    const manager = new BungieActionManager(session.accessToken);

    // ── 4. Ejecutar la acción correspondiente ──────────────

    switch (action) {
      case 'transfer': {
        const { itemReferenceHash, itemId, characterId, membershipType, transferToVault, stackSize } = body;

        if (!itemReferenceHash || !itemId || !characterId || !membershipType) {
          return NextResponse.json(
            { success: false, error: 'Faltan campos requeridos para transferir.' },
            { status: 400 }
          );
        }

        await manager.transferItem({
          itemReferenceHash,
          itemId,
          characterId,
          membershipType,
          transferToVault: transferToVault ?? false,
          stackSize: stackSize ?? 1,
        });

        return NextResponse.json({ success: true, message: 'Item transferido correctamente.' });
      }

      case 'equip': {
        const { characterId, membershipType, itemInstanceIds } = body;

        if (!characterId || !membershipType || !Array.isArray(itemInstanceIds) || itemInstanceIds.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Faltan campos requeridos para equipar.' },
            { status: 400 }
          );
        }

        const results = await manager.equipItems({
          characterId,
          membershipType,
          itemInstanceIds,
        });

        // Verificar si algún equip falló
        const failures = results.filter((r) => r.equipStatus !== 1);

        return NextResponse.json({
          success: failures.length === 0,
          results,
          message:
            failures.length === 0
              ? `${results.length} items equipados correctamente.`
              : `${results.length - failures.length} de ${results.length} items equipados. ${failures.length} fallaron.`,
        });
      }

      case 'equip-from-vault': {
        const { characterId, membershipType, items } = body;

        if (!characterId || !membershipType || !Array.isArray(items) || items.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Faltan campos requeridos para equipar desde bóveda.' },
            { status: 400 }
          );
        }

        const results = await manager.equipFromVault({
          characterId,
          membershipType,
          items,
        });

        const failures = results.filter((r) => r.equipStatus !== 1);

        return NextResponse.json({
          success: failures.length === 0,
          results,
          message:
            failures.length === 0
              ? `${results.length} items transferidos y equipados.`
              : `${failures.length} items fallaron al equipar.`,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Acción desconocida: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Actions API] Error:', error);

    if (error instanceof BungieActionError) {
      return NextResponse.json(
        { success: false, error: error.message, bungieCode: error.bungieCode },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno al ejecutar la acción.' },
      { status: 500 }
    );
  }
}
