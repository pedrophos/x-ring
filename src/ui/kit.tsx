import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MIN_TOUCH, radius, space, type, useTheme } from './theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]} edges={['bottom']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function T({
  children,
  variant = 'body',
  color,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  variant?: keyof typeof type;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[type[variant] as TextStyle, { color: color ?? colors.ink }, style]}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }, style]}>{children}</View>;
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <View style={styles.row}>
        <T variant="label" color={colors.inkSoft} style={{ flex: 1 }}>
          {title}
        </T>
        {right}
      </View>
      {children}
    </View>
  );
}

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  style,
  big,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  big?: boolean;
}) {
  const { colors } = useTheme();
  const palette: Record<ButtonKind, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.accent, fg: colors.accentInk, border: colors.accent },
    secondary: { bg: colors.surface, fg: colors.ink, border: colors.line },
    ghost: { bg: 'transparent', fg: colors.accent, border: 'transparent' },
    danger: { bg: colors.surface, fg: colors.danger, border: colors.line },
  };
  const p = palette[kind];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        big && { minHeight: 64 },
        { backgroundColor: p.bg, borderColor: p.border, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      <Text style={[type.heading, { color: p.fg, fontSize: big ? 19 : 16 }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: colors.line, backgroundColor: colors.surface },
        selected && { backgroundColor: colors.ink, borderColor: colors.ink },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <Text style={[type.body, { fontWeight: '600', color: selected ? colors.surface : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow<V extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <Chip key={String(o.value)} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: space.xs }}>
      <T variant="small" color={colors.inkSoft}>
        {label}
      </T>
      <TextInput
        placeholderTextColor={colors.inkMuted}
        style={[styles.input, { borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink }, style]}
        {...rest}
      />
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { minHeight: MIN_TOUCH }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <T>{label}</T>
        {hint ? (
          <T variant="small" color={colors.inkSoft}>
            {hint}
          </T>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.accent, false: colors.line }} />
    </View>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 90, gap: 2 }}>
      <T variant="label" color={colors.inkSoft}>
        {label}
      </T>
      <T variant="title" style={type.number}>
        {value}
      </T>
      {hint ? (
        <T variant="small" color={colors.inkSoft}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

export function Row({ children, style, gap = space.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[styles.row, { gap }, style]}>{children}</View>;
}

/** Linha divisória entre itens de uma lista dentro de um Card. */
export function Divided({ index, children }: { index: number; children: ReactNode }) {
  const { colors } = useTheme();
  return <View style={index > 0 ? { borderTopWidth: 1, borderTopColor: colors.line } : undefined}>{children}</View>;
}

export function ListItem({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.listItem,
        { backgroundColor: colors.surface },
        pressed && { backgroundColor: colors.surfaceAlt },
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="heading" numberOfLines={1}>
          {title}
        </T>
        {subtitle ? (
          <T variant="small" color={colors.inkSoft} numberOfLines={2}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

export function Empty({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: space.xl }}>
      <T color={colors.inkSoft} style={{ textAlign: 'center' }}>
        {text}
      </T>
    </Card>
  );
}

/** Formata número com vírgula decimal. */
export const fmt = (n: number | null | undefined, digits = 1): string =>
  n == null || Number.isNaN(n) ? '—' : n.toFixed(digits).replace('.', ',');

export const fmtDate = (d: Date): string =>
  d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl * 2 },
  card: {
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  button: {
    minHeight: MIN_TOUCH + 4,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: MIN_TOUCH,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    minHeight: 64,
  },
});
