import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { useTheme } from './theme';

export type Tally = 'cut' | 'blank' | 'current';

/**
 * Bastão de contagem: a assinatura do X-Ring. Cada marca é um entalhe na
 * madeira — fundo quando houve (semana com treino, série atirada), raso
 * quando não, tracejado em palha quando está em aberto.
 */
export function TallyStave({
  marks,
  height = 46,
  accessibilityLabel,
}: {
  marks: Tally[];
  height?: number;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const pad = height / 2.6;
  const n = Math.max(1, marks.length);
  const step = (width - pad * 2) / n;
  const notchW = Math.min(step * 0.55, height * 0.26);
  const deep = height * 0.66;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={accessibilityLabel}
      style={{ height }}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <Rect x={0} y={0} width={width} height={height} rx={height / 2} fill={colors.oak} />
          {marks.map((m, i) => {
            const cx = pad + step * i + step / 2;
            const top = (height - deep) / 2;
            if (m === 'cut') {
              // Entalhe em V: mais largo em cima, estreito embaixo.
              return (
                <Path
                  key={i}
                  d={`M ${cx - notchW / 2} ${top} L ${cx + notchW / 2} ${top} L ${cx + notchW * 0.12} ${top + deep} L ${cx - notchW * 0.12} ${top + deep} Z`}
                  fill={colors.oakDeep}
                />
              );
            }
            if (m === 'current') {
              return (
                <Rect
                  key={i}
                  x={cx - notchW / 2}
                  y={top}
                  width={notchW}
                  height={deep}
                  rx={2}
                  fill="none"
                  stroke={colors.shellAccent}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
              );
            }
            return (
              <Rect key={i} x={cx - notchW * 0.32} y={height / 2 - 3} width={notchW * 0.64} height={6} rx={2} fill={colors.oakLight} />
            );
          })}
        </Svg>
      )}
    </View>
  );
}
