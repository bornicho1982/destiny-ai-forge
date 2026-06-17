import { LoginButton } from '@/components/auth/login-button';

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden bg-[var(--forge-bg-primary)]">
      {/* Background Effects Premium */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         {/* Grid Pattern */}
         <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
         <div className="absolute inset-0" style={{ 
            backgroundImage: `radial-gradient(var(--forge-border) 1px, transparent 1px)`, 
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 10%, transparent 100%)',
            opacity: 0.3
         }}></div>
         
         {/* The Final Shape Glows */}
         <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-[#c4953a]/20 to-[#b07be5]/10 blur-[150px] mix-blend-screen" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-[var(--forge-accent)]/10 to-transparent blur-[120px] mix-blend-screen" />
      </div>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10">
        <div className="animate-fade-in-up text-center max-w-4xl mx-auto">
          {/* Emblem */}
          <div className="mx-auto mb-12 relative w-24 h-24 group">
            <div className="absolute inset-0 rounded-3xl rotate-45 bg-gradient-to-br from-[#ceae33] to-[#b07be5] opacity-30 blur-2xl group-hover:opacity-60 transition-opacity duration-700 animate-pulse-glow" />
            <div className="relative w-full h-full rounded-3xl rotate-45 border border-white/20 bg-black/60 backdrop-blur-xl flex items-center justify-center shadow-2xl overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
               <svg className="w-10 h-10 -rotate-45 text-[#ceae33] drop-shadow-[0_0_10px_rgba(206,174,51,0.5)]" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.66 3.83L12 11.83 4.34 8.01 12 4.18zM4 9.5l7 3.5v7.18l-7-3.5V9.5zm9 10.68V13l7-3.5v7.18l-7 3.5z" />
               </svg>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
             <span className="w-2 h-2 rounded-full bg-[#ceae33] animate-pulse"></span>
             <span className="text-[10px] font-bold text-white uppercase tracking-widest">Gemma 4.0 Powered</span>
          </div>

          <h1 className="font-[family-name:var(--font-orbitron)] text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-lg">DESTINY</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ceae33] via-[#e8b94a] to-[#b07be5] drop-shadow-[0_0_20px_rgba(206,174,51,0.3)]">AI FORGE</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-fade-in-up delay-100 font-light tracking-wide max-w-2xl mx-auto">
            El primer <span className="font-bold text-white">Optimizador de Armaduras v2</span> con Inteligencia Artificial Integrada.
          </p>

          <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto mb-14 animate-fade-in-up delay-200 leading-relaxed">
            Dile a la IA qué quieres jugar. Ella diseñará la estrategia perfecta y un Web Worker calculará millones de permutaciones en milisegundos para forjar tu build definitivo.
          </p>

          <div className="animate-fade-in-up delay-300 relative inline-block group">
            <div className="absolute inset-0 bg-[#ceae33] rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
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
            gradient="from-[#ceae33]"
          />
          <FeatureCard
            icon="⚡"
            title="Motor de Poda"
            subtitle="Web Worker T/S"
            description="Algoritmo de permutación v2 que descarta automáticamente ítems basura (<58 stats) y procesa 50,000 combinaciones en <50ms."
            gradient="from-[#79bbe8]"
          />
          <FeatureCard
            icon="💠"
            title="Prismático Ready"
            subtitle="The Final Shape"
            description="Soporte completo para objetos de clase prismáticos y los últimos balances de curación y resiliencia del Sandbox actual."
            gradient="from-[#b07be5]"
          />
        </div>
      </section>

      <footer className="relative z-10 text-center py-8 px-6 border-t border-white/5 bg-black/50 backdrop-blur-lg">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
          Destiny AI Forge is not affiliated with Bungie, Inc.
        </p>
        <p className="mt-2 text-[10px] text-gray-700">
          Powered by Bungie API & Google Gemini
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  subtitle,
  description,
  gradient,
}: {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="glass-card relative p-1 overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>
      <div className="bg-black/40 backdrop-blur-xl p-8 h-full rounded-2xl border border-white/10 relative z-10">
        <div className={`w-14 h-14 rounded-xl mb-6 flex items-center justify-center text-3xl bg-gradient-to-br ${gradient} to-black/50 border border-white/10 shadow-lg shadow-black/50`}>
          {icon}
        </div>
        <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold text-white tracking-wider mb-1">
          {title}
        </h3>
        <p className={`text-xs font-bold uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r ${gradient} to-gray-500 mb-4`}>
          {subtitle}
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
