import { router, Stack } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useDb } from '@/db/client';
import { loadOverview } from '@/db/overview';
import { useData } from '@/db/store';
import { nextElement, TECHNIQUE_GUIDE } from '@/domain/technique';
import { currentStreak } from '@/domain/weeks';
import { Button, Card, Row, Screen, Section, Struck, T } from '@/ui/kit';
import { radius, space, useTheme } from '@/ui/theme';
import { WeekStrip } from '@/ui/WeekStrip';

export default function Home() {
  const { colors } = useTheme();
  const db = useDb();
  const { data } = useData(() => loadOverview(db), [db]);
  if (!data) return null;

  const streak = currentStreak(data.weeks, data.trained);
  const element = data.focus?.element ?? nextElement(data.previousFocus?.element);
  const plan = data.plan;
  const sptCount = plan?.sptDays.length ?? 0;
  const planItems = [
    { label: 'Sessão técnica', done: !!plan?.technicalDone },
    { label: 'Sessão de pontuação', done: !!plan?.scoringDone },
    { label: `Treino físico (${sptCount} dia${sptCount === 1 ? '' : 's'})`, done: sptCount > 0 },
  ];

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <T variant="label" color={colors.onShell} style={{ fontSize: 30, lineHeight: 34 }}>
              X<T variant="label" color={colors.shellAccent} style={{ fontSize: 30, lineHeight: 34 }}>·</T>Ring
            </T>
          ),
          headerRight: () => <Button kind="bar" label="Ajustes" onPress={() => router.push('/settings')} />,
        }}
      />

      {data.open ? (
        <Card style={{ borderColor: colors.accent, borderWidth: 1.5 }}>
          <T variant="heading">{data.open.mode === 'competition' ? 'Competição em andamento' : 'Treino em andamento'}</T>
          <Button big label="Continuar" onPress={() => router.push(`/session/${data.open!.id}`)} />
        </Card>
      ) : (
        <View style={{ gap: space.sm }}>
          <Button big label="Novo treino" onPress={() => router.push('/session/new')} />
          <Button big kind="secondary" label="Competição com amigos" onPress={() => router.push('/competition/new')} />
        </View>
      )}

      <Section
        title="Semanas com treino"
        right={
          <T variant="small" color={colors.inkSoft}>
            {streak > 0 ? `${streak} seguida${streak === 1 ? '' : 's'}` : 'sem sequência'}
          </T>
        }
      >
        <Card>
          <WeekStrip weeks={data.weeks} trained={data.trained} />
          <T variant="small" color={colors.inkSoft}>
            O objetivo é não deixar buraco, não acumular volume.
          </T>
        </Card>
      </Section>

      <Section title="Esta semana">
        <Pressable onPress={() => router.push('/week')} style={({ pressed }) => pressed && { opacity: 0.8 }}>
          <Card>
            <View style={{ gap: 4 }}>
              <T variant="display">{TECHNIQUE_GUIDE[element].label}</T>
              <T variant="small" color={colors.inkSoft}>
                Foco técnico da semana. {TECHNIQUE_GUIDE[element].camera}
              </T>
            </View>
            <View style={{ height: 1, backgroundColor: colors.line }} />
            {planItems.map((i) => (
              <Row key={i.label}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: radius.sm,
                    borderWidth: 1.5,
                    borderColor: i.done ? colors.select : colors.line,
                    backgroundColor: i.done ? colors.select : 'transparent',
                  }}
                />
                <Struck done={i.done}>{i.label}</Struck>
              </Row>
            ))}
            <T variant="small" color={colors.accent} style={{ fontWeight: '700' }}>
              Abrir plano e foco →
            </T>
          </Card>
        </Pressable>
      </Section>

      <View style={{ gap: space.sm }}>
        <Row>
          <Button kind="secondary" label="Histórico" onPress={() => router.push('/history')} style={{ flex: 1 }} />
          <Button kind="secondary" label="Evolução" onPress={() => router.push('/evolution')} style={{ flex: 1 }} />
        </Row>
        <Button kind="secondary" label="Competições e retrospecto" onPress={() => router.push('/competition')} />
      </View>
    </Screen>
  );
}
