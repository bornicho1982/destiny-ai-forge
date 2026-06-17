// ============================================================
// Destiny AI Forge — Ruta API de Perfil del Guardián
// ============================================================
// GET /api/destiny/profile
// Obtiene el perfil completo del jugador (inventario + stats)
// desde la API de Bungie y lo retorna al cliente.
// ============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createBungieClient } from '@/lib/bungie/api-client';
import { PROFILE_COMPONENTS } from '@/lib/bungie/inventory';

export async function GET() {
  try {
    // 1. Obtener sesión autenticada
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión primero.' },
        { status: 401 }
      );
    }

    // 2. Verificar que tenemos membership data
    const { destinyMembershipId, destinyMembershipType, accessToken } = session;

    if (!destinyMembershipId || !destinyMembershipType) {
      return NextResponse.json(
        { error: 'No se encontró un perfil de Destiny 2 vinculado.' },
        { status: 404 }
      );
    }

    // 3. Llamar a la API de Bungie
    const client = createBungieClient(accessToken);
    const profileData = await client.get(
      `/Destiny2/${destinyMembershipType}/Profile/${destinyMembershipId}/?components=${PROFILE_COMPONENTS}`
    );

    return NextResponse.json({ success: true, profile: profileData });
  } catch (error) {
    console.error('[Profile API] Error al obtener perfil:', error);
    return NextResponse.json(
      { error: 'Error al obtener el perfil de Destiny 2.' },
      { status: 500 }
    );
  }
}
