// ============================================================
// Destiny AI Forge — i18n (Internationalization)
// ============================================================
// Simple client-side translation system.
// Supports: English (en), Spanish (es)
// ============================================================

export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Navigation
    'nav.forgeAi': 'Forge AI',
    'nav.armory': 'Armory',
    'nav.loadouts': 'My Builds',
    'nav.logout': 'Sign Out',

    // Header
    'header.manifest': 'Manifest',
    'header.inventory': 'Inventory',
    'header.ai': 'AI',
    'header.pieces': 'pieces',

    // Landing
    'landing.title1': 'DESTINY',
    'landing.title2': 'AI FORGE',
    'landing.subtitle': 'The AI-powered Buildcrafter for Guardians',
    'landing.description': 'Describe your ideal build in plain language. Our AI advisor selects the optimal subclass, exotic, fragments, and stat priorities — then a Web Worker finds the perfect armor combination from your vault.',
    'landing.login': 'Sign in with Bungie.net',
    'landing.feature1.title': 'AI Build Advisor',
    'landing.feature1.desc': 'Powered by Google Gemini. Describe what you want in natural language and get expert-level build recommendations.',
    'landing.feature2.title': 'Armor Optimizer',
    'landing.feature2.desc': 'Web Worker-powered permutation engine tests thousands of armor combinations to hit your stat targets.',
    'landing.feature3.title': 'Full Vault Access',
    'landing.feature3.desc': 'OAuth-authenticated access to your complete Destiny 2 inventory. Everything cached locally via IndexedDB.',

    // Dashboard
    'dashboard.title.forge': 'AI Buildcrafter',
    'dashboard.title.armory': 'Inventory Vault',
    'dashboard.title.loadouts': 'Saved Loadouts',
    'dashboard.manifest.updating': 'Updating Manifest: ',
    'dashboard.optimizing': '⚡ Pruning & Permuting Active',
    'dashboard.authenticating': 'Authenticating guardian...',
    'dashboard.pathsEvaluated': 'paths evaluated',

    // Prompt
    'prompt.activity.general': 'General',
    'prompt.activity.raid': 'Raid',
    'prompt.activity.dungeon': 'Dungeon',
    'prompt.activity.gm': 'Grandmaster',
    'prompt.activity.pvp': 'PvP / Crucible',
    'prompt.class': 'Guardian Class',
    'prompt.title': 'AI Advisor',
    'prompt.subtitle': 'Describe the build you need in natural language',
    'prompt.examples.title': 'Examples:',
    'prompt.placeholder': 'E.g. A solar titan build for raids with lots of survivability...',
    'prompt.button.think': 'Analyzing...',
    'prompt.button.forge': 'Forge Build',
    'prompt.activityLabel': 'Activity (Optional)',
    'prompt.fieldLabel': 'What build do you need?',

    // Classes
    'class.titan': 'Titan',
    'class.hunter': 'Hunter',
    'class.warlock': 'Warlock',
    
    // Stats
    'stat.mobility': 'Mobility',
    'stat.resilience': 'Resilience',
    'stat.recovery': 'Recovery',
    'stat.discipline': 'Discipline',
    'stat.intellect': 'Intellect',
    'stat.strength': 'Strength',
    
    // Inventory
    'inventory.vault': 'Vault',
    'inventory.items': 'items',
    'inventory.loading': 'Loading Armory...',
    'inventory.loadingDesc': 'Fetching characters and extracting armor from vault...',
    'inventory.equipped': 'Eqp',
    'inventory.artifice': 'Artifice',
    
    // Build
    'build.readyTitle': 'Ready to Forge',
    'build.readyDesc': 'Describe the build you need in the left panel. FORGE-AI will analyze your request and recommend the optimal strategy.',
    'build.thinking': 'FORGE-AI is analyzing...',
    'build.evaluating': 'Evaluating armor permutations...',
    'build.permutations': 'permutations evaluated',
    'build.downloadingManifest': 'Downloading Manifest',
    
    // Loadouts
    'loadouts.empty': 'No Saved Builds',
    'loadouts.emptyDesc': 'Go to the Forge AI tab, find the perfect combination and click "Save Loadout" to see it here.',
    'loadouts.equip': 'Equip',
    'loadouts.equipping': 'Transferring...',
    'loadouts.equipped': 'Loadout equipped on your character!',
    'loadouts.saved': 'Saved on',
    
    // Common
    'common.close': 'Close',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.cancel': 'Cancel',
    'common.error': 'Error',
    'common.search': 'Search...',
  },

  es: {
    // Navegación
    'nav.forgeAi': 'Forge IA',
    'nav.armory': 'Armería',
    'nav.loadouts': 'Mis Builds',
    'nav.logout': 'Salir',
    
    // Cabecera
    'header.manifest': 'Manifest',
    'header.inventory': 'Inventario',
    'header.ai': 'IA',
    'header.pieces': 'piezas',
    
    // Landing
    'landing.title1': 'DESTINY',
    'landing.title2': 'AI FORGE',
    'landing.subtitle': 'El Constructor de Builds con IA para Guardianes',
    'landing.description': 'Describe tu build ideal en lenguaje natural. Nuestro asesor IA selecciona la subclase, exótico, fragmentos y prioridades de stats óptimas — luego un Web Worker encuentra la combinación perfecta de armadura de tu bóveda.',
    'landing.login': 'Iniciar sesión con Bungie.net',
    'landing.feature1.title': 'Asesor IA de Builds',
    'landing.feature1.desc': 'Potenciado por Google Gemini. Describe lo que quieres en lenguaje natural y obtén recomendaciones de nivel experto.',
    'landing.feature2.title': 'Optimizador de Armadura',
    'landing.feature2.desc': 'Motor de permutaciones en Web Worker que evalúa miles de combinaciones de armadura para alcanzar tus stats objetivo.',
    'landing.feature3.title': 'Acceso Total a la Bóveda',
    'landing.feature3.desc': 'Acceso autenticado con OAuth a todo tu inventario de Destiny 2. Todo cacheado localmente vía IndexedDB.',

    // Dashboard
    'dashboard.title.forge': 'Constructor de Builds AI',
    'dashboard.title.armory': 'Bóveda de Inventario',
    'dashboard.title.loadouts': 'Loadouts Guardados',
    'dashboard.manifest.updating': 'Actualizando Manifest: ',
    'dashboard.optimizing': '⚡ Poda y Permutación Activa',
    'dashboard.authenticating': 'Autenticando guardián...',
    'dashboard.pathsEvaluated': 'paths evaluados',

    // Prompt
    'prompt.activity.general': 'General',
    'prompt.activity.raid': 'Incursión',
    'prompt.activity.dungeon': 'Mazmorra',
    'prompt.activity.gm': 'Gran Maestro',
    'prompt.activity.pvp': 'PvP / Crisol',
    'prompt.class': 'Clase del Guardián',
    'prompt.title': 'Consejero IA',
    'prompt.subtitle': 'Describe el build que necesitas en lenguaje natural',
    'prompt.examples.title': 'Ejemplos:',
    'prompt.placeholder': 'Ej. Una build de titán solar para incursiones con mucha supervivencia...',
    'prompt.button.think': 'Analizando...',
    'prompt.button.forge': 'Forjar Build',
    'prompt.activityLabel': 'Actividad (Opcional)',
    'prompt.fieldLabel': '¿Qué build necesitas?',

    // Clases
    'class.titan': 'Titán',
    'class.hunter': 'Cazador',
    'class.warlock': 'Hechicero',

    // Stats
    'stat.mobility': 'Movilidad',
    'stat.resilience': 'Resiliencia',
    'stat.recovery': 'Recuperación',
    'stat.discipline': 'Disciplina',
    'stat.intellect': 'Intelecto',
    'stat.strength': 'Fuerza',

    // Inventario
    'inventory.vault': 'Bóveda',
    'inventory.items': 'objetos',
    'inventory.loading': 'Cargando Armería...',
    'inventory.loadingDesc': 'Obteniendo personajes y extrayendo armaduras de la bóveda...',
    'inventory.equipped': 'Eqp',
    'inventory.artifice': 'Artífice',

    // Build
    'build.readyTitle': 'Listo para Forjar',
    'build.readyDesc': 'Describe la build que necesitas en el panel izquierdo. FORGE-AI analizará tu solicitud y recomendará la estrategia óptima.',
    'build.thinking': 'FORGE-AI está analizando...',
    'build.evaluating': 'Evaluando permutaciones de armadura...',
    'build.permutations': 'permutaciones evaluadas',
    'build.downloadingManifest': 'Descargando Manifest',

    // Loadouts
    'loadouts.empty': 'No tienes Builds Guardadas',
    'loadouts.emptyDesc': 'Ve al Constructor Forge IA, busca la combinación perfecta y pulsa en "Guardar Loadout" para que aparezca aquí.',
    'loadouts.equip': 'Equipar',
    'loadouts.equipping': 'Transfiriendo...',
    'loadouts.equipped': '¡Loadout equipado exitosamente en tu personaje!',
    'loadouts.saved': 'Guardado el',

    // Común
    'common.close': 'Cerrar',
    'common.save': 'Guardar',
    'common.delete': 'Borrar',
    'common.cancel': 'Cancelar',
    'common.error': 'Error',
    'common.search': 'Buscar...',
  },
};

/** Get the user's preferred locale */
export function getPreferredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  const saved = localStorage.getItem('forge-locale') as Locale | null;
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;

  const browserLang = navigator.language.slice(0, 2);
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) return browserLang as Locale;

  return 'en';
}

/** Save the locale preference */
export function setLocale(locale: Locale): void {
  localStorage.setItem('forge-locale', locale);
}

/** Translate a key */
export function t(key: string, locale?: Locale): string {
  const lang = locale || getPreferredLocale();
  return translations[lang]?.[key] || translations.en[key] || key;
}

/** Get all translations for a locale */
export function getTranslations(locale: Locale): Record<string, string> {
  return translations[locale] || translations.en;
}
