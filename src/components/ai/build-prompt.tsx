'use client';

// ============================================================
// Destiny AI Forge — Formulario de Prompt para la IA
// ============================================================
// Permite al usuario describir el build que quiere en lenguaje
// natural, seleccionar clase y contexto de actividad.
// ============================================================

import { useState } from 'react';
import { GUARDIAN_CLASSES, type GuardianClass } from '@/lib/constants';
import { useBuildStore } from '@/stores/build-store';
import { useLocale } from '@/hooks/use-locale';

type ActivityOption = 'raid' | 'dungeon' | 'grandmaster' | 'pvp' | 'general' | '';

export function BuildPrompt() {
  const { t } = useLocale();

  const ACTIVITY_OPTIONS: { value: ActivityOption; label: string }[] = [
    { value: '', label: t('prompt.activity.general') },
    { value: 'raid', label: '⚔️ ' + t('prompt.activity.raid') },
    { value: 'dungeon', label: '🏰 ' + t('prompt.activity.dungeon') },
    { value: 'grandmaster', label: '💀 ' + t('prompt.activity.gm') },
    { value: 'pvp', label: '🎯 ' + t('prompt.activity.pvp') },
  ];

const CLASS_DISPLAY: Record<GuardianClass, { label: string; icon: string; color: string }> = {
  titan: { label: 'Titán', icon: '🛡️', color: 'var(--forge-solar)' },
  hunter: { label: 'Cazador', icon: '🗡️', color: 'var(--forge-arc)' },
  warlock: { label: 'Hechicero', icon: '✨', color: 'var(--forge-void)' },
};

const EXAMPLE_PROMPTS = [
  'Build para incursión con mucho daño de super',
  'Build de supervivencia para Gran Maestro',
  'Build agresivo de cuerpo a cuerpo para mazmorras',
  'Build de granadas infinitas para contenido general',
  'Build PvP competitivo con buen juego neutral',
];

  const [prompt, setPrompt] = useState('');
  const [guardianClass, setGuardianClass] = useState<GuardianClass>('hunter');
  const [activityContext, setActivityContext] = useState<'raid' | 'dungeon' | 'grandmaster' | 'pvp' | 'general' | ''>('');
  const { requestBuildStrategy, phase } = useBuildStore();

  const isThinking = phase === 'ai-thinking';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isThinking) return;

    await requestBuildStrategy({
      prompt: prompt.trim(),
      guardianClass,
      activityContext: activityContext || undefined,
    });
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="bg-[var(--forge-bg-card)] border border-[var(--forge-border)] shadow-sm backdrop-blur-xl rounded-3xl p-8 animate-fade-in-up">
      {/* Título */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--forge-accent-dim)] border border-[var(--forge-border-accent)] flex items-center justify-center text-lg">
          🧠
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-orbitron)] text-sm font-semibold uppercase tracking-wider text-[var(--forge-text-primary)]">
            {t('prompt.title')}
          </h2>
          <p className="text-xs text-[var(--forge-text-muted)]">
            {t('prompt.subtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Selector de Clase */}
        <div>
          <label className="text-xs text-[var(--forge-text-muted)] uppercase tracking-wider mb-2 block">
            {t('prompt.class')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {GUARDIAN_CLASSES.map((cls) => {
              const display = CLASS_DISPLAY[cls];
              const isSelected = guardianClass === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setGuardianClass(cls)}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                    text-sm font-medium transition-all duration-200
                    border cursor-pointer
                    ${
                      isSelected
                        ? 'border-[var(--forge-border-accent)] bg-[var(--forge-accent-dim)] text-[var(--forge-text-primary)]'
                        : 'border-[var(--forge-border)] bg-[var(--forge-bg-secondary)] text-[var(--forge-text-secondary)] hover:border-[var(--forge-border-accent)]'
                    }
                  `}
                >
                  <span className="text-lg">{display.icon}</span>
                  {t(`class.${cls}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de Actividad */}
        <div>
          <label className="text-xs text-[var(--forge-text-muted)] uppercase tracking-wider mb-2 block">
            {t('prompt.activityLabel')}
          </label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_OPTIONS.map((option) => {
              const isSelected = activityContext === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActivityContext(option.value)}
                  className={`
                    px-3 py-2 rounded-lg text-xs font-medium
                    transition-all duration-200 border cursor-pointer
                    ${
                      isSelected
                        ? 'border-[var(--forge-border-accent)] bg-[var(--forge-accent-dim)] text-[var(--forge-accent)]'
                        : 'border-[var(--forge-border)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]'
                    }
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Campo de Prompt */}
        <div>
          <label className="text-xs text-[var(--forge-text-muted)] uppercase tracking-wider mb-2 block">
            {t('prompt.fieldLabel')}
          </label>
          <textarea
            id="build-prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('prompt.placeholder')}
            maxLength={1000}
            rows={3}
            className="
              w-full px-4 py-3 rounded-xl
              bg-[var(--forge-bg-secondary)] border border-[var(--forge-border)]
              text-[var(--forge-text-primary)] placeholder:text-[var(--forge-text-muted)]
              text-sm leading-relaxed resize-none
              focus:outline-none focus:border-[var(--forge-border-accent)]
              focus:ring-1 focus:ring-[var(--forge-accent-dim)]
              transition-all duration-200
            "
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[var(--forge-text-muted)]">
              {prompt.length}/1000
            </span>
          </div>
        </div>

        {/* Ejemplos */}
        <div>
          <label className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wider mb-2 block">
            {t('prompt.examples.title')}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="
                  px-2.5 py-1.5 rounded-lg text-[11px]
                  border border-[var(--forge-border)]
                  text-[var(--forge-text-muted)]
                  hover:text-[var(--forge-text-secondary)]
                  hover:border-[var(--forge-border-accent)]
                  transition-all duration-200 cursor-pointer
                "
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Botón de Enviar */}
        <button
          id="submit-build-prompt"
          type="submit"
          disabled={!prompt.trim() || isThinking}
          className={`
            w-full py-3.5 rounded-xl font-semibold text-sm
            transition-all duration-300 cursor-pointer
            ${
              isThinking
                ? 'bg-[var(--forge-bg-tertiary)] text-[var(--forge-text-muted)] cursor-wait'
                : 'bg-gradient-to-r from-[var(--forge-accent)] to-[#c4953a] text-[var(--forge-bg-primary)] hover:shadow-lg hover:shadow-[rgba(232,185,74,0.25)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed'
            }
          `}
        >
          {isThinking ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-[var(--forge-text-muted)] border-t-transparent rounded-full animate-spin" />
              FORGE-AI está pensando...
            </span>
          ) : (
            '🔥 Forjar Build con IA'
          )}
        </button>
      </form>
    </div>
  );
}
