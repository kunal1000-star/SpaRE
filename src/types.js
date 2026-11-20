export const CATEGORIES = {
  COLLEGE: 'College',
  GATE: 'GATE',
  SELF: 'Self',
};

export const DEFAULT_CATEGORY_CONFIG = {
  [CATEGORIES.COLLEGE]: {
    id: CATEGORIES.COLLEGE,
    label: 'College Semester',
    badge: 'College',
    color: '#38BDF8', // Cyan
    bgLight: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    borderColor: 'border-sky-500/40',
    accentColor: 'text-sky-400',
    defaultMaintenanceMonths: 4,
    description: 'Semester subjects & lab coursework (auto-archives post semester end)',
    sampleSubjects: []
  },
  [CATEGORIES.GATE]: {
    id: CATEGORIES.GATE,
    label: 'GATE Preparation',
    badge: 'GATE',
    color: '#F59E0B', // Amber
    bgLight: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    borderColor: 'border-amber-500/40',
    accentColor: 'text-amber-400',
    defaultMaintenanceMonths: 18,
    description: 'Core competitive exam subjects (fully custom mastery loop)',
    sampleSubjects: []
  },
  [CATEGORIES.SELF]: {
    id: CATEGORIES.SELF,
    label: 'Self Study / Skills',
    badge: 'Self',
    color: '#10B981', // Emerald
    bgLight: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    borderColor: 'border-emerald-500/40',
    accentColor: 'text-emerald-400',
    defaultMaintenanceMonths: 6,
    description: 'Coding languages, embedded systems, hobbies & projects',
    sampleSubjects: []
  },
};

export const CATEGORY_CONFIG = DEFAULT_CATEGORY_CONFIG;

export const DEFAULT_CUSTOM_CATEGORIES = {
  'Nvidia': {
    id: 'Nvidia',
    label: 'Nvidia',
    badge: 'Nvidia',
    color: '#84CC16',
    bgLight: 'bg-lime-500/10 text-lime-400 border-lime-500/30',
    borderColor: 'border-lime-500/40',
    accentColor: 'text-[#84CC16]',
    defaultMaintenanceMonths: 6,
    description: 'Nvidia preparation track',
    sampleSubjects: []
  },
  'AMD': {
    id: 'AMD',
    label: 'AMD',
    badge: 'AMD',
    color: '#EF4444',
    bgLight: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    borderColor: 'border-rose-500/40',
    accentColor: 'text-[#EF4444]',
    defaultMaintenanceMonths: 6,
    description: 'AMD preparation track',
    sampleSubjects: []
  }
};

// 25 Distinct, Non-Conflicting Colors for Multi-Track Scaling
export const TRACK_COLOR_PALETTE = [
  { id: 'sky', color: '#38BDF8', label: 'Sky Blue (College)', bgLight: 'bg-sky-500/10 text-sky-400 border-sky-500/30', borderColor: 'border-sky-500/40', accentColor: 'text-sky-400', badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { id: 'amber', color: '#F59E0B', label: 'Amber Gold (GATE)', bgLight: 'bg-amber-500/10 text-amber-400 border-amber-500/30', borderColor: 'border-amber-500/40', accentColor: 'text-amber-400', badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'emerald', color: '#10B981', label: 'Emerald Green (Self)', bgLight: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', borderColor: 'border-emerald-500/40', accentColor: 'text-emerald-400', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'nvidia-green', color: '#76B900', label: 'Nvidia Lime', bgLight: 'bg-[#76B900]/10 text-[#76B900] border-[#76B900]/30', borderColor: 'border-[#76B900]/40', accentColor: 'text-[#76B900]', badgeBg: 'bg-[#76B900]/20 text-[#76B900] border-[#76B900]/30' },
  { id: 'amd-red', color: '#EF4444', label: 'AMD Crimson', bgLight: 'bg-rose-500/10 text-rose-400 border-rose-500/30', borderColor: 'border-rose-500/40', accentColor: 'text-rose-400', badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { id: 'violet', color: '#8B5CF6', label: 'Electric Violet', bgLight: 'bg-violet-500/10 text-violet-300 border-violet-500/30', borderColor: 'border-violet-500/40', accentColor: 'text-violet-400', badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { id: 'indigo', color: '#6366F1', label: 'Royal Indigo', bgLight: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30', borderColor: 'border-indigo-500/40', accentColor: 'text-indigo-400', badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'cyan', color: '#06B6D4', label: 'Cyan / Cloud', bgLight: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', borderColor: 'border-cyan-500/40', accentColor: 'text-cyan-400', badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { id: 'orange', color: '#F97316', label: 'Sunset Orange', bgLight: 'bg-orange-500/10 text-orange-400 border-orange-500/30', borderColor: 'border-orange-500/40', accentColor: 'text-orange-400', badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'pink', color: '#EC4899', label: 'Hot Pink / Apple', bgLight: 'bg-pink-500/10 text-pink-400 border-pink-500/30', borderColor: 'border-pink-500/40', accentColor: 'text-pink-400', badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'fuchsia', color: '#D946EF', label: 'Cyber Fuchsia', bgLight: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30', borderColor: 'border-fuchsia-500/40', accentColor: 'text-fuchsia-400', badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' },
  { id: 'purple', color: '#A855F7', label: 'Purple Glow', bgLight: 'bg-purple-500/10 text-purple-400 border-purple-500/30', borderColor: 'border-purple-500/40', accentColor: 'text-purple-400', badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'teal', color: '#14B8A6', label: 'Ocean Teal', bgLight: 'bg-teal-500/10 text-teal-400 border-teal-500/30', borderColor: 'border-teal-500/40', accentColor: 'text-teal-400', badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { id: 'yellow', color: '#EAB308', label: 'Cyber Yellow', bgLight: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', borderColor: 'border-yellow-500/40', accentColor: 'text-yellow-400', badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { id: 'rose', color: '#F43F5E', label: 'Rose Coral', bgLight: 'bg-rose-500/10 text-rose-300 border-rose-500/30', borderColor: 'border-rose-500/40', accentColor: 'text-rose-300', badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { id: 'blue', color: '#3B82F6', label: 'Cobalt Blue / Google', bgLight: 'bg-blue-500/10 text-blue-400 border-blue-500/30', borderColor: 'border-blue-500/40', accentColor: 'text-blue-400', badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'lime', color: '#84CC16', label: 'Lime Mint', bgLight: 'bg-lime-500/10 text-lime-400 border-lime-500/30', borderColor: 'border-lime-500/40', accentColor: 'text-lime-400', badgeBg: 'bg-lime-500/20 text-lime-300 border-lime-500/30' },
  { id: 'ruby', color: '#DC2626', label: 'Ruby Red', bgLight: 'bg-red-600/10 text-red-400 border-red-500/30', borderColor: 'border-red-500/40', accentColor: 'text-red-400', badgeBg: 'bg-red-600/20 text-red-300 border-red-500/30' },
  { id: 'grape', color: '#9333EA', label: 'Grape Purple', bgLight: 'bg-purple-600/10 text-purple-300 border-purple-500/30', borderColor: 'border-purple-500/40', accentColor: 'text-purple-300', badgeBg: 'bg-purple-600/20 text-purple-300 border-purple-500/30' },
  { id: 'cerulean', color: '#0284C7', label: 'Deep Cerulean', bgLight: 'bg-sky-600/10 text-sky-300 border-sky-600/30', borderColor: 'border-sky-600/40', accentColor: 'text-sky-300', badgeBg: 'bg-sky-600/20 text-sky-300 border-sky-600/30' },
  { id: 'crimson', color: '#BE123C', label: 'Dark Crimson', bgLight: 'bg-rose-700/10 text-rose-300 border-rose-600/30', borderColor: 'border-rose-600/40', accentColor: 'text-rose-300', badgeBg: 'bg-rose-700/20 text-rose-300 border-rose-600/30' },
  { id: 'bronze', color: '#D97706', label: 'Bronze Gold', bgLight: 'bg-amber-600/10 text-amber-300 border-amber-600/30', borderColor: 'border-amber-600/40', accentColor: 'text-amber-300', badgeBg: 'bg-amber-600/20 text-amber-300 border-amber-600/30' },
  { id: 'slate', color: '#64748B', label: 'Steel Slate', bgLight: 'bg-slate-500/10 text-slate-300 border-slate-500/30', borderColor: 'border-slate-500/40', accentColor: 'text-slate-300', badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  { id: 'zinc', color: '#71717A', label: 'Titanium Silver', bgLight: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30', borderColor: 'border-zinc-500/40', accentColor: 'text-zinc-300', badgeBg: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' },
  { id: 'gold', color: '#FBBF24', label: 'Imperial Gold', bgLight: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/30', borderColor: 'border-yellow-400/40', accentColor: 'text-yellow-300', badgeBg: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30' },
];

export const CUSTOM_CATEGORY_PALETTES = TRACK_COLOR_PALETTE;

// Deterministic non-contradicting color assignment for any track name
export const getPaletteColorForName = (name) => {
  if (!name) return TRACK_COLOR_PALETTE[0];
  const lower = String(name).toLowerCase().trim();

  // Known brand & track anchors
  if (lower.includes('college')) return TRACK_COLOR_PALETTE.find(c => c.id === 'sky') || TRACK_COLOR_PALETTE[0];
  if (lower.includes('gate')) return TRACK_COLOR_PALETTE.find(c => c.id === 'amber') || TRACK_COLOR_PALETTE[1];
  if (lower.includes('self')) return TRACK_COLOR_PALETTE.find(c => c.id === 'emerald') || TRACK_COLOR_PALETTE[2];
  if (lower.includes('nvidia')) return TRACK_COLOR_PALETTE.find(c => c.id === 'nvidia-green') || TRACK_COLOR_PALETTE[3];
  if (lower.includes('amd')) return TRACK_COLOR_PALETTE.find(c => c.id === 'amd-red') || TRACK_COLOR_PALETTE[4];
  if (lower.includes('apple')) return TRACK_COLOR_PALETTE.find(c => c.id === 'pink') || TRACK_COLOR_PALETTE[9];
  if (lower.includes('google')) return TRACK_COLOR_PALETTE.find(c => c.id === 'blue') || TRACK_COLOR_PALETTE[15];
  if (lower.includes('amazon')) return TRACK_COLOR_PALETTE.find(c => c.id === 'orange') || TRACK_COLOR_PALETTE[8];

  // Hash-based deterministic assignment across 25 colors
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = (hash << 5) - hash + lower.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TRACK_COLOR_PALETTE.length;
  return TRACK_COLOR_PALETTE[index];
};

/**
 * Computes shortest unique prefixes for any dynamic set of category / track names.
 * Example:
 * ['College', 'GATE', 'Nvidia'] => { College: 'c', GATE: 'g', Nvidia: 'n' }
 * ['AMD', 'Apple', 'GATE'] => { AMD: 'am', Apple: 'ap', GATE: 'g' }
 * ['AMD', 'Amazon', 'Apple'] => { AMD: 'amd', Amazon: 'ama', Apple: 'ap' }
 */
export function computeShortestUniquePrefixes(names) {
  if (!Array.isArray(names) || names.length === 0) return {};

  const cleanNames = names.map(n => ({
    original: n,
    clean: String(n).toLowerCase().replace(/[^a-z0-9]/g, '')
  })).filter(x => x.clean.length > 0);

  const result = {};

  cleanNames.forEach(({ original, clean }) => {
    let prefixLen = 1;
    while (prefixLen <= clean.length) {
      const candidate = clean.slice(0, prefixLen);
      const otherMatches = cleanNames.filter(other => 
        other.original !== original && other.clean.startsWith(candidate)
      );
      if (otherMatches.length === 0) {
        result[original] = candidate;
        return;
      }
      prefixLen++;
    }
    result[original] = clean;
  });

  return result;
}

/**
 * Removes the legacy auto-assigned "General" category from syllabus subjects
 * and modules. Older versions of the Add Subject form stamped every new subject
 * with category "General", which then leaked into the Add Topic track picker.
 */
export const normalizeSyllabusTracks = (syllabus) => {
  if (!Array.isArray(syllabus)) return [];

  const cleanCats = (categories) =>
    Array.isArray(categories)
      ? categories.filter((c) => c && String(c).trim().toLowerCase() !== 'general')
      : [];

  return syllabus.map((sub) => {
    if (!sub || typeof sub !== 'object') return sub;

    const categories = cleanCats(sub.categories);
    const category = sub.category && String(sub.category).trim().toLowerCase() !== 'general'
      ? sub.category
      : (categories[0] || '');

    const modules = Array.isArray(sub.modules)
      ? sub.modules.map((mod) => {
          if (!mod || typeof mod !== 'object') return mod;
          const modCategories = cleanCats(mod.categories);
          const modCategory = mod.category && String(mod.category).trim().toLowerCase() !== 'general'
            ? mod.category
            : (modCategories[0] || '');
          return { ...mod, category: modCategory, categories: modCategories };
        })
      : sub.modules;

    return { ...sub, category, categories, modules };
  });
};

export const getCategoryMeta = (catId, customCategories = {}) => {
  if (!catId) return DEFAULT_CATEGORY_CONFIG[CATEGORIES.COLLEGE];
  if (DEFAULT_CATEGORY_CONFIG[catId]) return DEFAULT_CATEGORY_CONFIG[catId];
  if (customCategories[catId]) return customCategories[catId];
  if (DEFAULT_CUSTOM_CATEGORIES[catId]) return DEFAULT_CUSTOM_CATEGORIES[catId];
  
  const assigned = getPaletteColorForName(catId);

  return {
    id: catId,
    label: catId,
    badge: catId,
    color: assigned.color,
    bgLight: assigned.bgLight,
    borderColor: assigned.borderColor,
    accentColor: assigned.accentColor,
    defaultMaintenanceMonths: 6,
    description: `${catId} track`,
    sampleSubjects: []
  };
};

export const TOPIC_STATUS = {
  QUOTA_ACTIVE: 'QUOTA_ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  ARCHIVED: 'ARCHIVED',
};

export const MILESTONE_STATE = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
};

export const MAINTENANCE_TYPE = {
  MONTHS: 'MONTHS',
  DAYS: 'DAYS',
  TARGET_DATE: 'TARGET_DATE',
  INFINITE: 'INFINITE',
};

export const TOPIC_DIFFICULTY = {
  EASY: { id: 'Easy', label: 'Easy', badge: 'Easy', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  MEDIUM: { id: 'Medium', label: 'Medium', badge: 'Medium', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  HARD: { id: 'Hard', label: 'Hard', badge: 'Hard', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
};

export const TOPIC_IMPORTANCE = {
  LOW: { id: 'Low', label: 'Low', badge: 'Low Priority', color: 'text-slate-400 bg-white/[0.04] border-white/10' },
  MEDIUM: { id: 'Medium', label: 'Medium', badge: 'Medium Priority', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  HIGH: { id: 'High', label: 'High Priority 🔥', badge: 'High Yield 🔥', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
};
