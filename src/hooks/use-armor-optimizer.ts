'use client';

// ============================================================
// Destiny AI Forge — Hook del Optimizador de Armaduras
// ============================================================
// Maneja la comunicación con el Web Worker de permutación.
// Provee una API limpia de React para iniciar, cancelar y
// recibir resultados del optimizador.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  OptimizerConfig,
  OptimizerResult,
  WorkerOutMessage,
} from '@/lib/armor/types';

interface OptimizerState {
  /** Si el Worker está listo para recibir tareas */
  isReady: boolean;
  /** Si está ejecutando una optimización */
  isRunning: boolean;
  /** Progreso actual (0-100) */
  progress: number;
  /** Permutaciones evaluadas */
  evaluated: number;
  /** Resultados de la optimización */
  result: OptimizerResult | null;
  /** Error del Worker */
  error: string | null;
}

export function useArmorOptimizer() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<OptimizerState>({
    isReady: false,
    isRunning: false,
    progress: 0,
    evaluated: 0,
    result: null,
    error: null,
  });

  // Inicializar el Worker al montar el componente
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/armor-permutation.worker.ts', import.meta.url)
    );

    worker.addEventListener('message', (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'ready':
          setState((prev) => ({ ...prev, isReady: true }));
          break;

        case 'progress':
          setState((prev) => ({
            ...prev,
            progress: msg.percent,
            evaluated: msg.evaluated,
          }));
          break;

        case 'result':
          setState((prev) => ({
            ...prev,
            isRunning: false,
            progress: 100,
            result: msg.data,
          }));
          break;

        case 'error':
          setState((prev) => ({
            ...prev,
            isRunning: false,
            error: msg.message,
          }));
          break;
      }
    });

    worker.addEventListener('error', (event) => {
      setState((prev) => ({
        ...prev,
        isRunning: false,
        error: `Error del Worker: ${event.message}`,
      }));
    });

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  /** Iniciar la optimización */
  const optimize = useCallback((config: OptimizerConfig) => {
    if (!workerRef.current) return;

    setState((prev) => ({
      ...prev,
      isRunning: true,
      progress: 0,
      evaluated: 0,
      result: null,
      error: null,
    }));

    workerRef.current.postMessage({ type: 'optimize', config });
  }, []);

  /** Cancelar la optimización en curso */
  const cancel = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: 'cancel' });
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  /** Resetear el estado */
  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      progress: 0,
      evaluated: 0,
      result: null,
      error: null,
    }));
  }, []);

  return {
    ...state,
    optimize,
    cancel,
    reset,
  };
}
