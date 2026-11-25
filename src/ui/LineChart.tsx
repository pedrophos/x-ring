import { useState } from 'react';
import { type GestureResponderEvent, Pressable, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { T } from './kit';
import { colors } from './theme';

/** Série 1 da paleta de referência (validada: luminosidade, croma, contraste). */
const SERIES = '#2a78d6';
const GRID = '#E4DFD4';
const SURFACE = colors.surface;

export type ChartPoint = { date: Date; value: number };

type Props = {
  points: ChartPoint[];
  format: (v: number) => string;
  height?: number;
};

const PAD = { top: 16, right: 44, bottom: 22, left: 36 };

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const raw = (max - min) / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(Number(v.toFixed(6)));
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

const shortDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

/** Linha única com marcadores; toque para ver o valor de um ponto. */
export function LineChart({ points, format, height = 180 }: Props) {
  const [width, setWidth] = useState(0);
  const [sel, setSel] = useState<number | null>(null);

  if (points.length === 0) return null;
  const values = points.map((p) => p.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const plotW = Math.max(1, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin || 1)) * plotH;

  const onPress = (e: GestureResponderEvent) => {
    const px = e.nativeEvent.locationX;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    setSel(best === sel ? null : best);
  };

  const last = points.length - 1;
  const shown = sel ?? last;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ gap: 6 }}>
      <T variant="small" color={colors.inkSoft}>
        {sel == null ? 'Último' : 'Selecionado'}: {shortDate(points[shown].date)} ·{' '}
        <T variant="small" style={{ fontWeight: '700' }}>
          {format(points[shown].value)}
        </T>
        {sel == null && points.length > 1 ? '  (toque num ponto para ver outro)' : ''}
      </T>
      {width > 0 && (
        <Pressable onPress={onPress} accessibilityLabel="Gráfico; toque para ver o valor de um ponto">
          <Svg width={width} height={height}>
            {ticks.map((t) => (
              <Line key={t} x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            ))}
            {ticks.map((t) => (
              <SvgText key={`l${t}`} x={PAD.left - 6} y={y(t) + 4} fontSize={11} fill={colors.inkSoft} textAnchor="end">
                {format(t)}
              </SvgText>
            ))}
            <SvgText x={PAD.left} y={height - 4} fontSize={11} fill={colors.inkSoft}>
              {shortDate(points[0].date)}
            </SvgText>
            {points.length > 1 && (
              <SvgText x={width - PAD.right} y={height - 4} fontSize={11} fill={colors.inkSoft} textAnchor="end">
                {shortDate(points[last].date)}
              </SvgText>
            )}
            {points.length > 1 && (
              <Polyline
                points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')}
                fill="none"
                stroke={SERIES}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {sel != null && (
              <Line x1={x(sel)} x2={x(sel)} y1={PAD.top} y2={PAD.top + plotH} stroke={colors.inkMuted} strokeWidth={1} />
            )}
            {points.map((p, i) => (
              <Circle
                key={i}
                cx={x(i)}
                cy={y(p.value)}
                r={i === shown ? 6 : 4}
                fill={SERIES}
                stroke={SURFACE}
                strokeWidth={2}
              />
            ))}
            {/* rótulo direto só no fim da linha */}
            <SvgText x={x(last) + 8} y={y(points[last].value) + 4} fontSize={12} fontWeight="700" fill={colors.ink}>
              {format(points[last].value)}
            </SvgText>
          </Svg>
        </Pressable>
      )}
    </View>
  );
}
