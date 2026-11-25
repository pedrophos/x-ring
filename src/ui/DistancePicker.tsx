import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  clampDistance,
  DISTANCE_MAX_M,
  DISTANCE_MIN_M,
  distanceToFraction,
  fractionToDistance,
  STANDARD_DISTANCES_M,
} from '@/domain/distance-scale';

import { MIN_TOUCH, type, useTheme } from './theme';

const H = 56; // altura da raia
const CY = H / 2;
const R = 19; // raio do alvo que se arrasta
const PAD = R + 3; // o alvo nunca sai do bastão
const STAVE_H = 18;

/** Anéis do alvo em miniatura: cores da World Archery, iguais nos dois modos (é o objeto físico). */
const MINI_RINGS = [
  { r: 1, fill: '#FFFFFF' },
  { r: 0.8, fill: '#1A1A1A' },
  { r: 0.6, fill: '#00A2E8' },
  { r: 0.4, fill: '#ED1C24' },
  { r: 0.2, fill: '#FFE552' },
];

/**
 * Seletor de distância na temática da raia: o bastão de carvalho é o trilho,
 * o alvo se arrasta ao longo dele e a flecha sai do atirador (à esquerda) até o alvo.
 * Atalhos nas distâncias oficiais, − e + para o ajuste fino.
 */
export function DistancePicker({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  // Último valor enviado: evita repetir onChange e a vibração antes de a tela redesenhar.
  const sent = useRef(value);
  useEffect(() => {
    sent.current = value; // valor mudado de fora (ex.: distância base da competição)
  }, [value]);

  const trackW = Math.max(1, width - PAD * 2);
  const xOf = (m: number) => PAD + distanceToFraction(m) * trackW;

  const set = (m: number) => {
    const d = clampDistance(m);
    if (d === sent.current) return;
    sent.current = d;
    onChange(d);
    Haptics.selectionAsync().catch(() => {});
  };
  const fromTouch = (e: GestureResponderEvent) => set(fractionToDistance((e.nativeEvent.locationX - PAD) / trackW));

  const thumbX = xOf(value);
  const tail = 6;
  const tip = thumbX - R - 1;
  const showShaft = tip - tail > 26;

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.header}>
        <Text style={[styles.value, type.number, { color: colors.ink }]}>
          {value}
          <Text style={[styles.unit, { color: colors.inkSoft }]}> m</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Step label="−" a11y="Diminuir um metro" onPress={() => set(value - 1)} disabled={value <= DISTANCE_MIN_M} />
          <Step label="+" a11y="Aumentar um metro" onPress={() => set(value + 1)} disabled={value >= DISTANCE_MAX_M} />
        </View>
      </View>

      {/* A raia: toque ou arraste em qualquer ponto. Os desenhos não recebem toque, então locationX é sempre da raia. */}
      <View
        style={{ height: H }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Distância até o alvo"
        accessibilityValue={{ min: DISTANCE_MIN_M, max: DISTANCE_MAX_M, now: value, text: `${value} metros` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => set(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          fromTouch(e);
          return true; // impede a rolagem da tela de roubar o arrasto
        }}
        onResponderMove={fromTouch}
      >
        {width > 0 && (
          <View pointerEvents="none">
          <Svg width={width} height={H}>
            <Rect x={2} y={CY - STAVE_H / 2} width={width - 4} height={STAVE_H} rx={STAVE_H / 2} fill={colors.oak} />
            {/* Entalhes a cada 5 m; os de 10 em 10 mais fundos. */}
            {Array.from({ length: DISTANCE_MAX_M / 5 }, (_, i) => (i + 1) * 5).map((m) => {
              const x = xOf(m);
              const deep = m % 10 === 0 ? STAVE_H * 0.7 : STAVE_H * 0.42;
              const top = CY - deep / 2;
              return <Path key={m} d={`M ${x - 2.4} ${top} L ${x + 2.4} ${top} L ${x + 0.5} ${top + deep} L ${x - 0.5} ${top + deep} Z`} fill={colors.oakDeep} />;
            })}
            {/* A flecha: penas na palha, haste e ponta em creme. */}
            {showShaft && (
              <>
                <Line x1={tail} y1={CY} x2={tip - 6} y2={CY} stroke={colors.onShell} strokeWidth={2.6} strokeLinecap="round" />
                <Path d={`M ${tail + 2} ${CY} L ${tail + 15} ${CY} L ${tail + 19} ${CY - 6.5} L ${tail + 6} ${CY - 6.5} Z`} fill={colors.primary} />
                <Path d={`M ${tail + 2} ${CY} L ${tail + 15} ${CY} L ${tail + 19} ${CY + 6.5} L ${tail + 6} ${CY + 6.5} Z`} fill={colors.primary} />
              </>
            )}
            <Path d={`M ${tip} ${CY} L ${tip - 9} ${CY - 4.5} L ${tip - 9} ${CY + 4.5} Z`} fill={colors.onShell} />
            {MINI_RINGS.map((ring) => (
              <Circle key={ring.r} cx={thumbX} cy={CY} r={R * ring.r} fill={ring.fill} stroke="#1A1A1A" strokeWidth={ring.r === 1 ? 1 : 0} />
            ))}
          </Svg>
          </View>
        )}
      </View>

      {/* Distâncias oficiais: marcadas sob o bastão, um toque leva até elas. */}
      <View style={{ height: 28 }}>
        {width > 0 &&
          STANDARD_DISTANCES_M.map((m) => {
            const active = m === value;
            return (
              <Pressable
                key={m}
                onPress={() => set(m)}
                hitSlop={{ top: 10, bottom: 10 }}
                accessibilityRole="button"
                accessibilityLabel={`${m} metros`}
                style={[styles.preset, { left: xOf(m) - 20 }]}
              >
                <Text style={[styles.presetText, type.number, { color: active ? colors.ink : colors.inkSoft, fontWeight: active ? '800' : '500' }]}>{m}</Text>
              </Pressable>
            );
          })}
      </View>
    </View>
  );
}

function Step({ label, a11y, onPress, disabled }: { label: string; a11y: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [
        styles.step,
        { borderColor: colors.line, backgroundColor: pressed ? colors.surfaceAlt : colors.surface, opacity: disabled ? 0.4 : 1 },
      ]}
    >
      <Text style={[styles.stepText, { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { fontSize: 36, fontWeight: '800' },
  unit: { fontSize: 20, fontWeight: '600' },
  step: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 26, fontWeight: '600', lineHeight: 30 },
  preset: { position: 'absolute', top: 0, width: 40, height: 28, alignItems: 'center', justifyContent: 'center' },
  presetText: { fontSize: 14 },
});
