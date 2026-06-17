import { LoginButton } from '@/components/auth/login-button';

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {/* Decorative floating orb */}
        <div
          className="
            absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[500px] h-[500px] rounded-full
            bg-gradient-to-br from-[rgba(232,185,74,0.06)] to-[rgba(176,123,229,0.04)]
            blur-[100px] pointer-events-none
          "
          aria-hidden="true"
        />

        {/* Logo / Brand */}
        <div className="animate-fade-in-up text-center max-w-3xl mx-auto relative z-10">
          {/* Forge emblem */}
          <div className="mx-auto mb-8 relative w-20 h-20">
            <div
              className="
                absolute inset-0 rounded-2xl rotate-45
                bg-gradient-to-br from-[var(--forge-accent)] to-[#c4953a]
                opacity-20 blur-xl animate-pulse-glow
              "
            />
            <div
              className="
                relative w-full h-full rounded-2xl rotate-45
                border border-[var(--forge-border-accent)]
                bg-[var(--forge-bg-secondary)]
                flex items-center justify-center
              "
            >
              <svg
                className="w-8 h-8 -rotate-45 text-[var(--forge-accent)]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.66 3.83L12 11.83 4.34 8.01 12 4.18zM4 9.5l7 3.5v7.18l-7-3.5V9.5zm9 10.68V13l7-3.5v7.18l-7 3.5z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-[family-name:var(--font-orbitron)] text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
            <span className="text-gradient-gold">DESTINY</span>
            <br />
            <span className="text-[var(--forge-text-primary)]">AI FORGE</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-[var(--forge-text-secondary)] mb-4 animate-fade-in-up delay-100">
            The AI-powered Buildcrafter for Guardians
          </p>

          {/* Description */}
          <p className="text-sm md:text-base text-[var(--forge-text-muted)] max-w-lg mx-auto mb-12 animate-fade-in-up delay-200 leading-relaxed">
            Describe your ideal build in plain language. Our AI advisor selects
            the optimal subclass, exotic, fragments, and stat priorities — then a
            Web Worker finds the perfect armor combination from your vault.
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up delay-300">
            <LoginButton />
          </div>
        </div>

        {/* ── Feature Cards ─────────────────────────────── */}
        <div
          className="
            mt-24 grid grid-cols-1 md:grid-cols-3 gap-6
            max-w-5xl mx-auto w-full px-4
            animate-fade-in-up delay-400
          "
        >
          <FeatureCard
            icon="🧠"
            title="AI Build Advisor"
            description="Powered by Google Gemini. Describe what you want in natural language and get expert-level build recommendations."
            accentColor="var(--forge-accent)"
          />
          <FeatureCard
            icon="⚡"
            title="Armor Optimizer"
            description="Web Worker-powered permutation engine tests thousands of armor combinations to hit your stat targets."
            accentColor="var(--forge-arc)"
          />
          <FeatureCard
            icon="🔮"
            title="Full Vault Access"
            description="OAuth-authenticated access to your complete Destiny 2 inventory. Everything cached locally via IndexedDB."
            accentColor="var(--forge-void)"
          />
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="text-center py-8 px-6 text-xs text-[var(--forge-text-muted)] border-t border-[var(--forge-border)]">
        <p>
          Destiny AI Forge is not affiliated with Bungie, Inc. Destiny 2 is a
          registered trademark of Bungie, Inc.
        </p>
        <p className="mt-1">
          Powered by the Bungie.net API and Google Gemini.
        </p>
      </footer>
    </main>
  );
}

/* ── Feature Card Component ─────────────────────────────── */
function FeatureCard({
  icon,
  title,
  description,
  accentColor,
}: {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
}) {
  return (
    <div
      className="
        glass-card p-6
        transition-all duration-300
        hover:border-[rgba(232,185,74,0.2)]
        hover:shadow-lg hover:shadow-[rgba(0,0,0,0.3)]
        hover:-translate-y-1
        group
      "
    >
      <div
        className="
          w-12 h-12 rounded-xl mb-4
          flex items-center justify-center text-2xl
          transition-transform duration-300
          group-hover:scale-110
        "
        style={{
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}30`,
        }}
      >
        {icon}
      </div>
      <h3
        className="
          font-[family-name:var(--font-orbitron)]
          text-sm font-semibold uppercase tracking-wider mb-2
          text-[var(--forge-text-primary)]
        "
      >
        {title}
      </h3>
      <p className="text-sm text-[var(--forge-text-secondary)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
