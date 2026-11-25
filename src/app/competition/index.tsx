import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { useDb } from '@/db/client';
import { getMe, loadSessions } from '@/db/repo';
import { useData } from '@/db/store';
import { type CompetitionResult, headToHead } from '@/domain/ranking';
import { Button, Card, Empty, fmtDate, ListItem, Row, Screen, Section, T } from '@/ui/kit';
import { colors, type } from '@/ui/theme';

export default function Competitions() {
  const db = useDb();
  const { data } = useData(async () => {
    const [me, sessions] = await Promise.all([getMe(db), loadSessions(db)]);
    return { me, comps: sessions.filter((s) => s.mode === 'competition' && s.endedAt) };
  }, [db]);
  if (!data) return null;
  const { me, comps } = data;

  const results: CompetitionResult[] = comps.map((s) =>
    s.participants.map((p) => ({ archerId: p.archerId, rank: p.finalRank ?? 99, score: p.finalScore ?? 0 })),
  );

  // Retrospecto: confronto de você contra cada adversário e recorde de cada atirador.
  const people = new Map<string, { name: string; best: number; bestAvg: number; comps: number }>();
  for (const s of comps) {
    for (const p of s.participants) {
      const cur = people.get(p.archerId) ?? { name: p.archer.nickname || p.archer.name, best: 0, bestAvg: 0, comps: 0 };
      cur.best = Math.max(cur.best, p.finalScore ?? 0);
      cur.bestAvg = Math.max(cur.bestAvg, p.summary.average ?? 0);
      cur.comps++;
      people.set(p.archerId, cur);
    }
  }
  const rivals = [...people.entries()].filter(([id]) => id !== me.id);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Competições' }} />
      <Button big label="Nova competição" onPress={() => router.push('/competition/new')} />

      {comps.length === 0 ? (
        <Empty text="Nenhuma competição encerrada ainda." />
      ) : (
        <>
          {rivals.length > 0 && (
            <Section title="Confronto direto">
              <Card>
                {rivals.map(([id, r]) => {
                  const h = headToHead(results, me.id, id);
                  if (h.wins + h.losses + h.draws === 0) return null;
                  return (
                    <Row key={id}>
                      <T style={{ flex: 1 }}>Você × {r.name}</T>
                      <T variant="heading" style={type.number}>
                        {h.wins} × {h.losses}
                        {h.draws ? ` (${h.draws} emp.)` : ''}
                      </T>
                    </Row>
                  );
                })}
              </Card>
            </Section>
          )}

          <Section title="Recordes">
            <Card>
              {[...people.values()]
                .sort((a, b) => b.best - a.best)
                .map((p) => (
                  <Row key={p.name}>
                    <T style={{ flex: 1 }}>{p.name}</T>
                    <T variant="small" color={colors.inkSoft}>
                      {p.comps} comp. · melhor média {p.bestAvg.toFixed(2).replace('.', ',')}
                    </T>
                    <T variant="heading" style={[type.number, { width: 48, textAlign: 'right' }]}>
                      {p.best}
                    </T>
                  </Row>
                ))}
            </Card>
          </Section>

          <Section title="Histórico">
            <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
              {comps.map((s, i) => {
                const sorted = [...s.participants].sort((a, b) => (a.finalRank ?? 99) - (b.finalRank ?? 99));
                const w = sorted[0];
                return (
                  <View key={s.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.line } : undefined}>
                    <ListItem
                      title={`${fmtDate(s.startedAt)} · venceu ${w.archer.nickname || w.archer.name}`}
                      subtitle={sorted.map((p) => `${p.archer.nickname || p.archer.name} ${p.finalScore}`).join(' · ')}
                      onPress={() => router.push(`/session/${s.id}/summary`)}
                    />
                  </View>
                );
              })}
            </Card>
          </Section>
        </>
      )}
    </Screen>
  );
}
