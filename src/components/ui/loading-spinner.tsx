'use client';

// ============================================================
// Destiny AI Forge — Spinner de Carga
// ============================================================

interface LoadingSpinnerProps {
  /** Texto debajo del spinner */
  text?: string;
  /** Tamaño en px */
  size?: number;
}

export function LoadingSpinner({ text, size = 48 }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Anillo exterior */}
        <div
          className="absolute inset-0 rounded-full border-2 border-[var(--forge-border)] border-t-[var(--forge-accent)] animate-spin"
          style={{ animationDuration: '1s' }}
        />
        {/* Anillo interior */}
        <div
          className="absolute rounded-full border-2 border-[var(--forge-border)] border-b-[var(--forge-void)] animate-spin"
          style={{
            inset: `${size * 0.15}px`,
            animationDuration: '1.5s',
            animationDirection: 'reverse',
          }}
        />
        {/* Punto central */}
        <div
          className="absolute rounded-full bg-[var(--forge-accent)] animate-pulse"
          style={{
            width: size * 0.15,
            height: size * 0.15,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
      {text && (
        <p className="text-sm text-[var(--forge-text-secondary)] font-[family-name:var(--font-orbitron)] uppercase tracking-wider">
          {text}
        </p>
      )}
    </div>
  );
}
