import { View } from 'react-native';

import { parseDateKey } from '@/domain/weeks';

import { T } from './kit';
import { type Tally, TallyStave } from './TallyStave';
import { useTheme } from './theme';

/** Semanas no bastão de contagem: entalhe = houve treino. A última é a semana atual. */
export function WeekStrip({ weeks, trained }: { weeks: string[]; trained: ReadonlySet<string> }) {
  const { colors } = useTheme();
  const last = weeks.length - 1;
  const marks: Tally[] = weeks.map((w, i) => (trained.has(w) ? 'cut' : i === last ? 'current' : 'blank'));
  const count = weeks.filter((w) => trained.has(w)).length;
  return (
    <View style={{ gap: 6 }}>
      <TallyStave
        marks={marks}
        accessibilityLabel={`${count} de ${weeks.length} semanas com treino${trained.has(weeks[last]) ? ', incluindo esta' : ''}`}
      />
      <View style={{ flexDirection: 'row' }}>
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
