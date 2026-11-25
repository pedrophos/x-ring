import { Storage } from 'expo-sqlite/kv-store';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

/**
 * Tokens de cor por papel (não por aparência): as telas usam só os papéis,
 * a identidade vive nos valores aqui.
 *
 * O alvo em si não usa estes tokens: as cores dos anéis são as da World
 * Archery nos dois modos, porque representam o objeto físico.
 */
export type Palette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  line: string;
  /** Barra de topo (o gramado) e o que vai sobre ela. */
  shell: string;
  onShell: string;
  shellAccent: string;
  /** Ação principal: a palha. */
  primary: string;
  onPrimary: string;
  /** Seleção (chips, opção ativa). */
  select: string;
  onSelect: string;
  /** Texto de link/ação secundária e trilho dos switches. */
  accent: string;
  accentInk: string;
  /** Madeira do bastão de contagem. */
  oak: string;
  oakDeep: string;
  oakLight: string;
  /** Traço de "feito" desenhado à mão. */
  strike: string;
  gold: string;
  danger: string;
  arrow: string;
  arrowLast: string;
  arrowOld: string;
  /** Linha dos gráficos (série 1 da paleta validada pela skill dataviz). */
  series: string;
  grid: string;
};

/**
 * "Os alvos da vila": gramado, palha e carvalho. Cor chapada, sem textura.
 * Claro: chão verde-líquen, pensado para o sol.
 */
export const lightColors: Palette = {
  bg: '#EEF0E8',
  surface: '#FFFFFF',
  surfaceAlt: '#E2E6DA',
  ink: '#1A1D1A',
  inkSoft: '#4A5246',
  inkMuted: '#5F675B',
  line: '#D2D7C9',
  shell: '#1F3D2B',
  onShell: '#F3EEDD',
  shellAccent: '#D9A62E',
  primary: '#D9A62E',
  onPrimary: '#1F2A1E',
  select: '#1F3D2B',
  onSelect: '#F3EEDD',
  accent: '#1F5A3C',
  accentInk: '#FFFFFF',
  oak: '#6B4A2B',
  oakDeep: '#2E1F12',
  oakLight: '#8A6A47',
  strike: '#C9951F',
  gold: '#D9A62E',
  danger: '#A23B2A',
  arrow: '#0B1F3A',
  arrowLast: '#FF6A00',
  arrowOld: '#5B6B80',
  series: '#2a78d6',
  grid: '#DDE1D5',
};

/** Escuro: o gramado à noite; superfícies elevadas mais claras, sem preto puro. */
export const darkColors: Palette = {
  bg: '#0F1A14',
  surface: '#17241C',
  surfaceAlt: '#203026',
  ink: '#EDEFE6',
  inkSoft: '#B3BBAE',
  inkMuted: '#949D8F',
  line: '#2C3B31',
  shell: '#0A130E',
  onShell: '#EDE6D0',
  shellAccent: '#E3B547',
  primary: '#E3B547',
  onPrimary: '#1A1408',
  select: '#E3B547',
  onSelect: '#1A1408',
  accent: '#6CC79C',
  accentInk: '#0B1A14',
  oak: '#7A5634',
  oakDeep: '#24170C',
  oakLight: '#A07E5A',
  strike: '#E3B547',
  gold: '#E3B547',
  danger: '#F2A89A',
  // Marcadores ficam sobre o alvo (cores fixas), então não mudam com o modo.
  arrow: '#0B1F3A',
  arrowLast: '#FF6A00',
  arrowOld: '#5B6B80',
  series: '#3987e5',
  grid: '#26352B',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

/** Letra antiga (IM Fell) só em títulos e rótulos; corpo e números ficam na fonte do sistema. */
export const fonts = {
  fell: 'IMFellEnglish_400Regular',
  fellSC: 'IMFellEnglishSC_400Regular',
} as const;

export const type = {
  /** Títulos em letra antiga: nome do foco, títulos de cartão. Nunca números. */
  display: { fontFamily: fonts.fell, fontSize: 28, fontWeight: '400' as const, lineHeight: 34 },
  title: { fontSize: 22, fontWeight: '700' as const },
  heading: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 16 },
  small: { fontSize: 13 },
  /** Rótulo de seção/cartão em versalete antigo. */
  label: { fontFamily: fonts.fellSC, fontSize: 18, fontWeight: '400' as const, letterSpacing: 0.3, lineHeight: 22 },
  number: { fontVariant: ['tabular-nums' as const] },
};

export const MIN_TOUCH = 48;

// ---------- Preferência e contexto ----------

export type ThemePreference = 'system' | 'light' | 'dark';
const PREF_KEY = 'theme-preference';

function readPreference(): ThemePreference {
  const v = Storage.getItemSync(PREF_KEY);
  return v === 'light' || v === 'dark' ? v : 'system';
}

type ThemeValue = {
  colors: Palette;
  scheme: 'light' | 'dark';
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>(readPreference);
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeValue>(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      scheme,
      preference,
      setPreference: (p) => {
        Storage.setItemSync(PREF_KEY, p);
        setPref(p);
      },
    }),
    [scheme, preference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Tema fixo para um trecho (ex.: a imagem de compartilhar sai sempre igual, qualquer que seja o modo). */
export function FixedTheme({ scheme, children }: { scheme: 'light' | 'dark'; children: ReactNode }) {
  const parent = useTheme();
  const value = useMemo<ThemeValue>(
    () => ({ ...parent, colors: scheme === 'dark' ? darkColors : lightColors, scheme }),
    [parent, scheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme fora do ThemeProvider');
  return t;
}
