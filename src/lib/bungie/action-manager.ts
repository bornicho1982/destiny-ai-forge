// ============================================================
// Destiny AI Forge — BungieActionManager
// ============================================================
// Servicio de acciones del inventario: transferir items entre
// bóveda y personaje, y equipar items en batch.
// Este es el "clon interno de DIM" para gestión de inventario.
//
// Endpoints utilizados:
//   POST /Destiny2/Actions/Items/TransferItem/
//   POST /Destiny2/Actions/Items/EquipItems/
// ============================================================

import { createBungieClient } from './api-client';
import type {
  TransferItemRequest,
  EquipItemsRequest,
  EquipItemsResponse,
  EquipResult,
} from './types';

/** Máximo de items por llamada a EquipItems (límite de Bungie) */
const MAX_EQUIP_BATCH_SIZE = 10;

/** Pausa entre llamadas secuenciales para respetar rate limits (ms) */
const ACTION_THROTTLE_MS = 250;

/**
 * Códigos de error específicos de Bungie para acciones de inventario.
 * Referencia: https://bungie-net.github.io/multi/schema_Exceptions-PlatformErrorCodes.html
 */
export const BUNGIE_ACTION_ERRORS: Record<number, string> = {
  1623: 'El item no se puede transferir (está equipado o bloqueado).',
  1642: 'No hay espacio en el destino. Libera un slot antes de continuar.',
  1627: 'El personaje no puede equipar este item (clase incorrecta).',
  1641: 'No puedes mover un item equipado directamente. Desequípalo primero.',
  1671: 'No puedes equipar más de un exótico de armadura a la vez.',
};

/**
 * BungieActionManager — Gestor de acciones de inventario.
 *
 * Encapsula las llamadas POST a la API de Bungie para mover y equipar
 * items. Diseñado para ser instanciado con un accessToken OAuth2 válido.
 *
 * @example
 * ```ts
 * const manager = new BungieActionManager(accessToken);
 * await manager.transferItem({ ... });
 * await manager.equipItems({ ... });
 * ```
 */
export class BungieActionManager {
  private client: ReturnType<typeof createBungieClient>;

  constructor(accessToken: string) {
    this.client = createBungieClient(accessToken);
  }

  // ── Transferir Item ──────────────────────────────────────

  /**
   * Mueve un item entre la bóveda y un personaje.
   *
   * @param params.itemReferenceHash - Hash del item en el Manifest
   * @param params.itemId - itemInstanceId (instancia específica del item)
   * @param params.characterId - ID del personaje involucrado
   * @param params.membershipType - Plataforma (Steam=3, Xbox=1, PSN=2)
   * @param params.transferToVault - true = mover AL vault, false = DEL vault
   * @param params.stackSize - Cantidad (1 para items no apilables)
   *
   * @throws {BungieActionError} Si Bungie rechaza la transferencia
   */
  async transferItem(params: {
    itemReferenceHash: number;
    itemId: string;
    characterId: string;
    membershipType: number;
    transferToVault: boolean;
    stackSize?: number;
  }): Promise<void> {
    const body: TransferItemRequest = {
      itemReferenceHash: params.itemReferenceHash,
      stackSize: params.stackSize ?? 1,
      transferToVault: params.transferToVault,
      itemId: params.itemId,
      characterId: params.characterId,
      membershipType: params.membershipType,
    };

    try {
      await this.client.post<number>(
        '/Destiny2/Actions/Items/TransferItem/',
        body
      );
    } catch (error) {
      throw this.wrapError('transferItem', error);
    }
  }

  // ── Equipar Items (Batch) ────────────────────────────────

  /**
   * Equipa múltiples items en un personaje.
   * Si hay más de 10 items, los divide en batches automáticamente.
   *
   * @param params.characterId - ID del personaje donde equipar
   * @param params.membershipType - Plataforma del membership
   * @param params.itemInstanceIds - Array de IDs de instancia a equipar
   *
   * @returns Array de resultados individuales por item
   */
  async equipItems(params: {
    characterId: string;
    membershipType: number;
    itemInstanceIds: string[];
  }): Promise<EquipResult[]> {
    const { characterId, membershipType, itemInstanceIds } = params;

    // Bungie limita a 10 items por llamada
    const batches = this.chunk(itemInstanceIds, MAX_EQUIP_BATCH_SIZE);
    const allResults: EquipResult[] = [];

    for (let i = 0; i < batches.length; i++) {
      if (i > 0) {
        await this.sleep(ACTION_THROTTLE_MS);
      }

      const body: EquipItemsRequest = {
        itemIds: batches[i],
        characterId,
        membershipType,
      };

      try {
        const response = await this.client.post<EquipItemsResponse>(
          '/Destiny2/Actions/Items/EquipItems/',
          body
        );
        allResults.push(...response.equipResults);
      } catch (error) {
        throw this.wrapError('equipItems', error);
      }
    }

    return allResults;
  }

  // ── Flujo Orquestado: Vault → Equipar ────────────────────

  /**
   * Flujo completo: saca items de la bóveda y los equipa en el personaje.
   *
   * Secuencia:
   * 1. Para cada item, llama transferItem (vault → personaje)
   * 2. Espera un throttle entre cada transferencia
   * 3. Llama equipItems con todos los instanceIds en batch
   *
   * @param params.characterId - Personaje destino
   * @param params.membershipType - Plataforma
   * @param params.items - Array de items a mover y equipar
   *
   * @returns Resultados del equip (puede tener fallos individuales)
   */
  async equipFromVault(params: {
    characterId: string;
    membershipType: number;
    items: Array<{
      itemHash: number;
      instanceId: string;
    }>;
  }): Promise<EquipResult[]> {
    const { characterId, membershipType, items } = params;

    // Paso 1: Transferir cada pieza de la bóveda al personaje
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      await this.transferItem({
        itemReferenceHash: item.itemHash,
        itemId: item.instanceId,
        characterId,
        membershipType,
        transferToVault: false, // false = DEL vault AL personaje
      });

      // Throttle entre transferencias para evitar rate limiting
      if (i < items.length - 1) {
        await this.sleep(ACTION_THROTTLE_MS);
      }
    }

    // Pequeña pausa antes de equipar
    await this.sleep(ACTION_THROTTLE_MS);

    // Paso 2: Equipar todos los items en batch
    const results = await this.equipItems({
      characterId,
      membershipType,
      itemInstanceIds: items.map((i) => i.instanceId),
    });

    return results;
  }

  // ── Utilidades Internas ──────────────────────────────────

  /** Divide un array en chunks de tamaño máximo */
  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  /** Sleep con promesa */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Envuelve errores de Bungie en un formato descriptivo */
  private wrapError(method: string, error: unknown): BungieActionError {
    if (error instanceof Error) {
      // Intentar extraer el código de error de Bungie del mensaje
      const codeMatch = error.message.match(/\[(\d+)\]/);
      const code = codeMatch ? parseInt(codeMatch[1], 10) : 0;
      const friendlyMessage = BUNGIE_ACTION_ERRORS[code];

      return new BungieActionError(
        friendlyMessage
          ? `[${method}] ${friendlyMessage}`
          : `[${method}] ${error.message}`,
        code
      );
    }
    return new BungieActionError(
      `[${method}] Error desconocido al ejecutar acción de inventario.`,
      0
    );
  }
}

/**
 * Error específico de acciones de inventario de Bungie.
 * Incluye el código de error de Bungie para manejo programático.
 */
export class BungieActionError extends Error {
  constructor(
    message: string,
    public readonly bungieCode: number
  ) {
    super(message);
    this.name = 'BungieActionError';
  }
}
