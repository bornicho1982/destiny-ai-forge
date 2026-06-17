// ============================================================
// Destiny AI Forge — Transfer Queue Engine
// ============================================================
// Maneja las transferencias de items llamando a nuestra API interna.
// Asegura que las peticiones vayan en cola (concurrencia 1)
// con un rate limit para evitar ser bloqueados por Bungie.
// ============================================================

export interface TransferRequest {
  itemReferenceHash: number;
  itemId: string;
  transferToVault: boolean;
  characterId: string;
}

export interface EquipRequest {
  itemIds: string[];
  characterId: string;
}

export class TransferQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;
  // Bungie recomienda dejar al menos 200ms entre llamadas de transferencia/equipamiento
  // Para estar seguros usaremos 300ms.
  private readonly delayMs = 300; 

  /**
   * Encola una función para que se ejecute respetando el rate limit.
   */
  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
        // Esperar entre peticiones
        await new Promise(res => setTimeout(res, this.delayMs));
      }
    }
    
    this.isProcessing = false;
  }

  /**
   * Llama a nuestra API interna para transferir un item.
   * Lo encola automáticamente.
   */
  async transferItem(req: TransferRequest): Promise<any> {
    return this.enqueue(async () => {
      console.log(`[TransferQueue] Moviendo item ${req.itemId} a ${req.transferToVault ? 'Vault' : req.characterId}`);
      
      const res = await fetch('/api/destiny/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'transfer',
          itemReferenceHash: req.itemReferenceHash,
          itemId: req.itemId,
          transferToVault: req.transferToVault,
          characterId: req.characterId,
          membershipType: 3, // Asumiendo Steam, idealmente se extrae de auth-store
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(`Error transferItem: ${data.error}`);
      }
      return data;
    });
  }

  /**
   * Llama a nuestra API interna para equipar items.
   * Lo encola automáticamente.
   */
  async equipItems(req: EquipRequest): Promise<any> {
    return this.enqueue(async () => {
      console.log(`[TransferQueue] Equipando items en ${req.characterId}:`, req.itemIds);
      
      const res = await fetch('/api/destiny/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'equip',
          itemInstanceIds: req.itemIds,
          characterId: req.characterId,
          membershipType: 3,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(`Error equipItems: ${data.error}`);
      }
      return data;
    });
  }
}

// Singleton global de la cola para que sobreviva a las llamadas en el backend
export const globalTransferQueue = new TransferQueue();
