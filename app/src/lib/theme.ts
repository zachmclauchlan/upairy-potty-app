// UpAiry design tokens: the "sticker sheet" look. Ink outlines, pastel stickers, one green.
// The page colour and the highlight colour come from the theme the parent picks in Settings.

export type ThemeKey = 'paper' | 'white' | 'pink' | 'blue' | 'yellow';
/** bg = the page, sunk = a quiet inset on the page, hi = the highlight (selected tab, ruler bead). */
export const THEMES: Record<ThemeKey, { name: string; bg: string; sunk: string; hi: string }> = {
  paper: { name: 'Paper', bg: '#F7F4EE', sunk: '#EDE8DD', hi: '#CFEAC4' },
  white: { name: 'White', bg: '#FFFFFF', sunk: '#F1F0EC', hi: '#CFEAC4' },
  pink: { name: 'Pink', bg: '#FDECEF', sunk: '#F6DADF', hi: '#FFBFCA' },
  blue: { name: 'Blue', bg: '#EAF2FB', sunk: '#D9E6F5', hi: '#BBD6FF' },
  yellow: { name: 'Yellow', bg: '#FFF6DC', sunk: '#F5EAC6', hi: '#FFD55A' },
};
export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

export const C = {
  bg: THEMES.paper.bg,
  sunk: THEMES.paper.sunk,
  hi: THEMES.paper.hi,
  surface: '#FFFFFF',
  /** dividers inside cards */
  line: 'rgba(31,27,22,0.16)',
  ink: '#1F1B16',
  ink2: '#5A5142',
  ink3: '#7B7266',
  brand: '#3E7F33',
  brandInk: '#2B5C23',
  brandSoft: '#CFEAC4',
  brandTint: '#A9D49B',
  acc: '#B5471F',
  accInk: '#7E2F12',
  accSoft: '#FFD3D8',
  water: '#2F65B0',
  waterInk: '#1F4370',
  waterSoft: '#CFE3FF',
  sun: '#A8651B',
  sunSoft: '#FFD9B8',
  poo: '#7A5539',
  pooSoft: '#EBDCCB',
  meal: '#6A4E9E',
  mealSoft: '#E2D6F7',
  star: '#FFB59E',
  night: '#141A2E',
  nightSurface: '#1E2540',
};

/** Switch the page and highlight colours. Screens pick the new values up on their next render. */
export function applyTheme(k: ThemeKey | undefined) {
  const t = THEMES[k ?? 'paper'] ?? THEMES.paper;
  C.bg = t.bg; C.sunk = t.sunk; C.hi = t.hi;
}

// Sticker colours: every icon is ink on its pastel.
export type Tone = 'ok' | 'acc' | 'try' | 'water' | 'sun' | 'poo' | 'meal';
export const TONES: Record<Tone, { bg: string; fg: string }> = {
  ok: { bg: C.brandSoft, fg: C.ink },
  acc: { bg: C.accSoft, fg: C.ink },
  try: { bg: '#FFFFFF', fg: C.ink },
  water: { bg: C.waterSoft, fg: C.ink },
  sun: { bg: C.sunSoft, fg: C.ink },
  poo: { bg: C.pooSoft, fg: C.ink },
  meal: { bg: C.mealSoft, fg: C.ink },
};

// Figtree for everything you read, Chewy for titles and big numbers.
export const F = {
  r: 'Figtree_400Regular',
  m: 'Figtree_500Medium',
  s: 'Figtree_600SemiBold',
  b: 'Figtree_600SemiBold',
  fun: 'Chewy_400Regular',
};

/** The sticker outline: a 2px ink border with a hard little shadow underneath. */
export const BW = 2;
export const outline = { borderWidth: BW, borderColor: C.ink };
export const shadow = { ...outline, boxShadow: `0px 3px 0px ${C.ink}` };

export const R = 20;
