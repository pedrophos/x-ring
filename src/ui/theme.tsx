import { Storage } from 'expo-sqlite/kv-store';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

/**
 * Tokens de cor por papel (não por aparência): a identidade visual futura
 * troca só os valores aqui, sem mexer nas telas.
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
  accent: string;
  accentInk: string;
  gold: string;
  danger: string;
  arrow: string;
  arrowLast: string;
  arrowOld: string;
  /** Linha dos gráficos (série 1 da paleta validada pela skill dataviz). */
  series: string;
  grid: string;
};

/** Claro: pensado para o sol na linha de tiro, contraste alto. */
export const lightColors: Palette = {
  bg: '#F4F1EA',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE7DC',
  ink: '#17171A',
  inkSoft: '#56535C',
  inkMuted: '#706D76',
  line: '#D9D3C6',
  accent: '#1E5B47',
  accentInk: '#FFFFFF',
  gold: '#E8B100',
  danger: '#B3261E',
  arrow: '#0B1F3A',
  arrowLast: '#FF6A00',
  arrowOld: '#5B6B80',
  series: '#2a78d6',
  grid: '#E4DFD4',
};

/** Escuro: indoor e à noite; superfícies elevadas mais claras, sem preto puro. */
export const darkColors: Palette = {
  bg: '#121315',
  surface: '#1C1D20',
  surfaceAlt: '#26282C',
  ink: '#F2F0EA',
  inkSoft: '#B8B4AC',
  inkMuted: '#8C8881',
  line: '#34363B',
  accent: '#4FB48F',
  accentInk: '#0B1A14',
  gold: '#F0C033',
  danger: '#F2B8B5',
  // Marcadores ficam sobre o alvo (cores fixas), então não mudam com o modo.
  arrow: '#0B1F3A',
  arrowLast: '#FF6A00',
  arrowOld: '#5B6B80',
  series: '#3987e5',
  grid: '#2C2E33',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

export const type = {
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700' as const },
  heading: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 16 },
  small: { fontSize: 13 },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
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

export function useTheme(): ThemeValue {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme fora do ThemeProvider');
  return t;
}
