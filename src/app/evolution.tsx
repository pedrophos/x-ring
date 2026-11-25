import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useDb } from '@/db/client';
import { trainedWeeks, WEEKS_SHOWN } from '@/db/overview';
import { getMe, loadSessions } from '@/db/repo';
import { useData } from '@/db/store';
import { lastWeekKeys } from '@/domain/weeks';
import { Card, ChipRow, Empty, fmt, fmtDate, ListItem, Screen, Section, T } from '@/ui/kit';
import { LineChart } from '@/ui/LineChart';
import { colors, type } from '@/ui/theme';
import { WeekStrip } from '@/ui/WeekStrip';

export default function Evolution() {
  const db = useDb();
  const { data } = useData(async () => {
    const [me, sessions] = await Promise.all([getMe(db), loadSessions(db)]);
    // Estatísticas: só o atirador principal, só sessões que contam (competição só se marcada).
    const rows = sessions
      .filter((s) => s.countForStats)
      .flatMap((s) =>
        s.participants
          .filter((p) => p.archerId === me.id && p.summary.arrows > 0)
          .map((p) => ({ session: s, p })),
      )
      .reverse(); // mais antiga primeiro
    return { me, sessions, rows };
  }, [db]);
  const [distance, setDistance] = useState<number | null>(null);

  if (!data) return null;
  const distances = [...new Set(data.rows.map((r) => r.p.distanceM))].sort((a, b) => a - b);
  const d = distance ?? distances[0];
  const rows = data.rows.filter((r) => r.p.distanceM === d);
  const weeks = lastWeekKeys(WEEKS_SHOWN * 2, new Date());

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Evolução' }} />

      <Section title={`Semanas com treino (${WEEKS_SHOWN * 2})`}>
        <Card>
          <WeekStrip weeks={weeks} trained={trainedWeeks(data.sessions, data.me.id)} />
        </Card>
      </Section>

      {distances.length === 0 ? (
        <Empty text="Registre alguns treinos para ver a evolução." />
      ) : (
        <>
          <ChipRow options={distances.map((x) => ({ value: x, label: `${x} m` }))} value={d} onChange={setDistance} />

          <Section title="Média por flecha">
            <Card>
              <LineChart points={rows.map((r) => ({ date: r.session.startedAt, value: r.p.summary.average ?? 0 }))} format={(v) => fmt(v, 1)} />
            </Card>
          </Section>

          <Section title="Dispersão (mm) — menor é mais consistente">
            <Card>
              {rows.some((r) => r.p.summary.dispersionMm != null) ? (
                <LineChart
                  points={rows
                    .filter((r) => r.p.summary.dispersionMm != null)
                    .map((r) => ({ date: r.session.startedAt, value: r.p.summary.dispersionMm! }))}
                  format={(v) => fmt(v, 0)}
                />
              ) : (
                <T color={colors.inkSoft}>Precisa de séries com 3 ou mais flechas no alvo.</T>
              )}
              <T variant="small" color={colors.inkSoft}>
                Distância média das flechas ao centro do próprio grupo. Mede consistência mesmo com a mira desajustada.
              </T>
            </Card>
          </Section>

          <Section title="Sessões">
            <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
              {[...rows].reverse().map(({ session, p }, i) => (
                <View key={p.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.line } : undefined}>
                  <ListItem
                    title={fmtDate(session.startedAt)}
                    subtitle={`${p.face.name} · ${p.summary.arrows} flechas${session.mode === 'competition' ? ' · competição' : ''}`}
                    onPress={() => router.push(`/session/${session.id}/summary`)}
                    right={
                      <View style={{ alignItems: 'flex-end' }}>
                        <T variant="heading" style={type.number}>
                          {fmt(p.summary.average, 2)}
                        </T>
                        <T variant="small" color={colors.inkSoft}>
                          {p.summary.dispersionMm == null ? '—' : `${fmt(p.summary.dispersionMm, 0)} mm`}
                        </T>
                      </View>
                    }
                  />
                </View>
              ))}
            </Card>
          </Section>
        </>
      )}
    </Screen>
  );
}
