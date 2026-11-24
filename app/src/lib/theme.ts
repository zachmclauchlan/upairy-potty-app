// UpAiry design tokens, carried over from the prototype.
export const C = {
  bg: '#F5F4EF',
  surface: '#FFFFFF',
  sunk: '#EFEDE7',
  line: '#E6E3DB',
  ink: '#16181B',
  ink2: '#5E6269',
  ink3: '#9A9DA3',
  brand: '#3E7F33',
  brandInk: '#2B5C23',
  brandSoft: '#E8F2E3',
  brandTint: '#CFE5C6',
  acc: '#C9762A',
  accInk: '#8A4E15',
  accSoft: '#FBEEDF',
  water: '#3A78C9',
  waterInk: '#1F4370',
  waterSoft: '#E6EFFA',
  sun: '#C79A1E',
  sunSoft: '#FBF3DA',
  poo: '#8B6447',
  pooSoft: '#F3EAE2',
  meal: '#7559A8',
  mealSoft: '#F1ECF7',
  star: '#F2B705',
  night: '#141A2E',
  nightSurface: '#1E2540',
};

export type Tone = 'ok' | 'acc' | 'try' | 'water' | 'sun' | 'poo' | 'meal';
export const TONES: Record<Tone, { bg: string; fg: string }> = {
  ok: { bg: C.brandSoft, fg: C.brandInk },
  acc: { bg: C.accSoft, fg: C.acc },
  try: { bg: C.sunk, fg: C.ink2 },
  water: { bg: C.waterSoft, fg: C.water },
  sun: { bg: C.sunSoft, fg: C.sun },
  poo: { bg: C.pooSoft, fg: C.poo },
  meal: { bg: C.mealSoft, fg: C.meal },
};

export const F = {
  r: 'Poppins_400Regular',
  m: 'Poppins_500Medium',
  s: 'Poppins_600SemiBold',
  b: 'Poppins_700Bold',
  fun: 'Chewy_400Regular',
};

export const shadow = {
  shadowColor: '#16181B',
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

export const R = 22;
