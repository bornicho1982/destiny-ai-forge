import { LoginButton } from '@/components/auth/login-button';

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden bg-[var(--forge-bg-primary)] text-[var(--forge-text-primary)]">
      {/* Background Effects Premium Light/Frost */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         {/* Grid Pattern */}
         <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-multiply"></div>
         <div className="absolute inset-0" style={{ 
            backgroundImage: `radial-gradient(var(--forge-border) 1px, transparent 1px)`, 
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 10%, transparent 100%)',
            opacity: 0.6
         }}></div>
         
         {/* Clean Sci-Fi Glows */}
         <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-[#06b6d4]/10 to-[#8b5cf6]/5 blur-[150px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-[#0ea5e9]/10 to-transparent blur-[120px]" />
      </div>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10">
        <div className="animate-fade-in-up text-center max-w-4xl mx-auto">
          {/* Emblem */}
          <div className="mx-auto mb-12 relative w-24 h-24 group">
            <div className="absolute inset-0 rounded-3xl rotate-45 bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-700 animate-pulse-glow" />
            <div className="relative w-full h-full rounded-3xl rotate-45 border border-[var(--forge-border-accent)] bg-[var(--forge-bg-card)] backdrop-blur-xl flex items-center justify-center shadow-[var(--forge-shadow-lg)] overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent"></div>
               <svg className="w-10 h-10 -rotate-45 text-[#06b6d4] drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.66 3.83L12 11.83 4.34 8.01 12 4.18zM4 9.5l7 3.5v7.18l-7-3.5V9.5zm9 10.68V13l7-3.5v7.18l-7 3.5z" />
               </svg>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-[var(--forge-border)] mb-8 backdrop-blur-md shadow-sm">
             <span className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse shadow-[0_0_8px_#06b6d4]"></span>
             <span className="text-[10px] font-bold text-[var(--forge-text-secondary)] uppercase tracking-widest">Gemma 4.0 Powered</span>
          </div>

          <h1 className="font-[family-name:var(--font-orbitron)] text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800 drop-shadow-sm">DESTINY</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#8b5cf6]">AI FORGE</span>
          </h1>

          <p className="text-xl md:text-2xl text-[var(--forge-text-secondary)] mb-8 animate-fade-in-up delay-100 font-light tracking-wide max-w-2xl mx-auto">
            El primer <span className="font-bold text-[var(--forge-text-primary)]">Optimizador de Armaduras v2</span> con Inteligencia Artificial Integrada.
          </p>

          <p className="text-sm md:text-base text-[var(--forge-text-muted)] max-w-xl mx-auto mb-14 animate-fade-in-up delay-200 leading-relaxed">
            Dile a la IA qué quieres jugar. Ella diseñará la estrategia perfecta y un Web Worker calculará millones de permutaciones en milisegundos para forjar tu build definitivo.
          </p>

          <div className="animate-fade-in-up delay-300 relative inline-block group">
            <div className="absolute inset-0 bg-[#06b6d4] rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative">
              <LoginButton />
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full px-4 animate-fade-in-up delay-400">
          <FeatureCard
            icon="🧠"
            title="IA Conversacional"
            subtitle="Gemma 4.0"
            description="Dile a FORGE-AI 'quiero un build de supervivencia para Gran Maestro'. Él elegirá los exóticos, fragmentos y stats ideales."
            gradient="from-[#06b6d4]"
          />
          <FeatureCard
            icon="⚡"
            title="Motor de Poda"
            subtitle="Web Worker T/S"
            description="Algoritmo de permutación v2 que descarta automáticamente ítems basura (<58 stats) y procesa 50,000 combinaciones en <50ms."
            gradient="from-[#0ea5e9]"
          />
          <FeatureCard
            icon="💠"
            title="Prismático Ready"
            subtitle="The Final Shape"
            description="Soporte completo para objetos de clase prismáticos y los últimos balances de curación y resiliencia del Sandbox actual."
            gradient="from-[#8b5cf6]"
          />
        </div>
      </section>

      <footer className="relative z-10 text-center py-8 px-6 border-t border-[var(--forge-border)] bg-[var(--forge-bg-secondary)]/50 backdrop-blur-lg">
        <p className="text-[10px] text-[var(--forge-text-muted)] uppercase tracking-widest font-bold">
          Destiny AI Forge is not affiliated with Bungie, Inc.
        </p>
        <p className="mt-2 text-[10px] text-[var(--forge-text-muted)]/70">
          Powered by Bungie API & Google Gemini
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  subtitle,
  description,
  icon,
  gradient
}: {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string;
}) {
  return (
    <div className="relative group rounded-3xl p-[1px] overflow-hidden bg-gradient-to-b from-[var(--forge-border)] to-transparent transition-all duration-500 hover:shadow-[var(--forge-shadow-md)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      <div className="relative h-full bg-[var(--forge-bg-card)] backdrop-blur-md rounded-[23px] p-8 flex flex-col border border-[var(--forge-border-subtle)]">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} to-white/10 flex items-center justify-center text-2xl mb-6 shadow-sm`}>
           <span className="drop-shadow-sm">{icon}</span>
        </div>
        <h3 className="font-[family-name:var(--font-orbitron)] font-bold text-lg text-[var(--forge-text-primary)] tracking-wide mb-1">
          {title}
        </h3>
        <span className="text-[10px] font-bold text-[var(--forge-accent)] uppercase tracking-widest mb-4">
          {subtitle}
        </span>
        <p className="text-sm text-[var(--forge-text-muted)] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
