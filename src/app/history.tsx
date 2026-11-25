import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { useDb } from '@/db/client';
import { loadSessions } from '@/db/repo';
import { useData } from '@/db/store';
import { dateKey } from '@/domain/weeks';
import { Card, Empty, fmt, fmtDate, ListItem, Screen, Section, T } from '@/ui/kit';
import { type, useTheme } from '@/ui/theme';

export default function History() {
  const { colors } = useTheme();
  const db = useDb();
  const { data } = useData(() => loadSessions(db), [db]);
  if (!data) return null;

  const byDay = new Map<string, typeof data>();
  for (const s of data) {
    const k = dateKey(s.startedAt);
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Histórico' }} />
      {data.length === 0 && <Empty text="Nenhuma sessão ainda. Os treinos e competições aparecem aqui." />}
      {[...byDay.values()].map((list) => (
        <Section key={dateKey(list[0].startedAt)} title={fmtDate(list[0].startedAt)}>
          <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
            {list.map((s, i) => {
              const me = s.participants.find((p) => p.archer.isMe) ?? s.participants[0];
              const isComp = s.mode === 'competition';
              const winner = isComp
                ? [...s.participants].sort((a, b) => (a.finalRank ?? 99) - (b.finalRank ?? 99))[0]
                : null;
              const subtitle = isComp
                ? `${s.participants.length} atiradores${winner?.finalRank ? ` · venceu ${winner.archer.nickname || winner.archer.name}` : ' · em andamento'}`
                : `${me?.distanceM} m · ${me?.face.name} · ${me?.summary.arrows ?? 0} flechas${s.endedAt ? '' : ' · em andamento'}`;
              return (
                <View key={s.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.line } : undefined}>
                  <ListItem
                    title={isComp ? 'Competição' : 'Treino'}
                    subtitle={subtitle}
                    onPress={() => router.push(`/session/${s.id}/summary`)}
                    right={
                      me && (
                        <View style={{ alignItems: 'flex-end' }}>
                          <T variant="heading" style={type.number}>
                            {fmt(me.summary.average, 2)}
                          </T>
                          <T variant="small" color={colors.inkSoft}>
                            média · {me.summary.total}
                          </T>
                        </View>
                      )
                    }
                  />
                </View>
              );
            })}
          </Card>
        </Section>
      ))}
    </Screen>
  );
}
