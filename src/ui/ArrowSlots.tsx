import { StyleSheet, Text, View } from 'react-native';

import type { ArrowScore } from '@/domain/scoring';

import { type Palette, radius, type, useTheme } from './theme';

const bg = (s: ArrowScore, colors: Palette) => {
  if (s.value >= 9) return '#FFD21F';
  if (s.value >= 7) return '#E53935';
  if (s.value >= 5) return '#2F80ED';
  if (s.value >= 3) return '#1A1A1A';
  if (s.value >= 1) return '#FFFFFF';
  return colors.surfaceAlt;
};
// Cores das zonas do alvo (fixas); M usa as cores do tema.
const fg = (s: ArrowScore, colors: Palette) => (s.value === 0 ? colors.ink : s.value >= 3 && s.value <= 8 ? '#FFFFFF' : '#17171A');

/** Valores da série no formato do alvo, ordenados do maior ao menor como na súmula. */
export function ArrowSlots({ scores, slots, sort = false, size = 44 }: { scores: ArrowScore[]; slots?: number; sort?: boolean; size?: number }) {
  const { colors } = useTheme();
  const list = sort ? [...scores].sort((a, b) => b.value - a.value || Number(b.isX) - Number(a.isX)) : scores;
  const empty = Math.max(0, (slots ?? list.length) - list.length);
  return (
    <View style={styles.row}>
      {list.map((s, i) => (
        <View key={i} style={[styles.slot, { width: size, height: size, backgroundColor: bg(s, colors), borderColor: colors.line }]}>
          <Text style={[type.heading, { color: fg(s, colors), fontSize: size * 0.4 }]}>{s.label}</Text>
        </View>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <View key={`e${i}`} style={[styles.slot, styles.empty, { width: size, height: size, borderColor: colors.line }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  slot: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  empty: { borderStyle: 'dashed', backgroundColor: 'transparent' },
});
