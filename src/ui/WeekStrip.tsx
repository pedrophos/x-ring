import { StyleSheet, View } from 'react-native';

import { parseDateKey } from '@/domain/weeks';

import { T } from './kit';
import { radius, useTheme } from './theme';

/** Faixa das últimas semanas: cheia = houve treino. A última é a semana atual. */
export function WeekStrip({ weeks, trained }: { weeks: string[]; trained: ReadonlySet<string> }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.row}>
        {weeks.map((w, i) => {
          const on = trained.has(w);
          const current = i === weeks.length - 1;
          return (
            <View
              key={w}
              accessibilityLabel={`Semana de ${w}: ${on ? 'com treino' : 'sem treino'}`}
              style={[
                styles.cell,
                { borderColor: colors.line, backgroundColor: colors.surface },
                on ? { backgroundColor: colors.accent, borderColor: colors.accent } : null,
                current && !on ? { borderColor: colors.ink, borderStyle: 'dashed' } : null,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.row}>
        <T variant="small" color={colors.inkMuted} style={{ flex: 1 }}>
          {label(weeks[0])}
        </T>
        <T variant="small" color={colors.inkMuted}>
          esta semana
        </T>
      </View>
    </View>
  );
}

const label = (key?: string) =>
  key ? parseDateKey(key).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  cell: {
    flex: 1,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1.5,
  },
});
