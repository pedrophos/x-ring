import { View } from 'react-native';

import { type GroupReading, MIN_ARROWS_FOR_READING, readGroup, type Point } from '@/domain/group-analysis';

import { Card, fmt, T } from './kit';
import { space, useTheme } from './theme';

const H = { left: 'esquerda', right: 'direita' } as const;
const V = { up: 'cima', down: 'baixo' } as const;

export function describeSight(r: GroupReading): string | null {
  const parts = [r.sight.vertical && V[r.sight.vertical], r.sight.horizontal && H[r.sight.horizontal]].filter(Boolean);
  if (!parts.length) return null;
  return `Mova a mira para ${parts.join(' e ')} (a mira segue a flecha).`;
}

const PATTERN = {
  vertical: 'Espalhado na vertical',
  horizontal: 'Espalhado na horizontal',
  round: 'Espalhamento parelho',
} as const;

export function GroupReadingCard({ title, points, ringWidthMm }: { title: string; points: Point[]; ringWidthMm: number }) {
  const { colors } = useTheme();
  const r = readGroup(points, ringWidthMm);
  if (!r) {
    return (
      <Card>
        <T variant="label" color={colors.inkSoft}>
          {title}
        </T>
        <T color={colors.inkSoft}>
          A leitura aparece a partir de {MIN_ARROWS_FOR_READING} flechas no alvo ({points.length} até agora).
        </T>
      </Card>
    );
  }
  const sight = describeSight(r);
  const tight = !r.causes.length;
  return (
    <Card>
      <T variant="label" color={colors.inkSoft}>
        {title}
      </T>
      {r.offCenter && sight ? (
        <View style={{ gap: 2 }}>
          <T variant="heading">Grupo {tight ? 'fechado ' : ''}fora do centro</T>
          <T>{sight}</T>
          <T variant="small" color={colors.inkSoft}>
            Centro do grupo a {fmt(r.offsetMm, 0)} mm do centro do alvo.
          </T>
        </View>
      ) : (
        <T variant="heading">{tight ? 'Grupo fechado e centrado' : PATTERN[r.pattern]}</T>
      )}
      {r.causes.length > 0 && (
        <View style={{ gap: space.xs }}>
          {r.offCenter && <T variant="heading">{PATTERN[r.pattern]}</T>}
          <T variant="small" color={colors.inkSoft}>
            Causas prováveis:
          </T>
          {r.causes.map((c) => (
            <T key={c}>• {c}</T>
          ))}
        </View>
      )}
      <T variant="small" color={colors.inkSoft}>
        Dispersão média {fmt(r.meanRadiusMm, 0)} mm · vertical {fmt(r.sdYMm, 0)} · horizontal {fmt(r.sdXMm, 0)}
      </T>
    </Card>
  );
}
