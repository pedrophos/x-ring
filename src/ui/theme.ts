/**
 * Uso na linha de tiro, muitas vezes no sol: fundo claro, contraste alto,
 * alvos de toque grandes. Um único tema (claro) de propósito.
 */
export const colors = {
  bg: '#F4F1EA',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE7DC',
  ink: '#17171A',
  inkSoft: '#56535C',
  inkMuted: '#8A8690',
  line: '#D9D3C6',
  accent: '#1E5B47', // verde escuro: ação principal
  accentInk: '#FFFFFF',
  gold: '#E8B100',
  danger: '#B3261E',
  arrow: '#0B1F3A',
  arrowLast: '#FF6A00',
  arrowOld: '#5B6B80',
} as const;

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
