import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDb } from '@/db/client';
import {
  competitionRanking,
  deleteLastEnd,
  finishSession,
  type LoadedParticipant,
  type LoadedSession,
  loadSession,
  type NewArrow,
  saveEnd,
  scoreEnd,
} from '@/db/repo';
import { useData } from '@/db/store';
import { ringWidth } from '@/domain/geometry';
import { hits } from '@/domain/stats';
import { ArrowSlots } from '@/ui/ArrowSlots';
import { GroupReadingCard } from '@/ui/GroupReadingCard';
import { Button, Card, Chip, fmt, Row, T } from '@/ui/kit';
import { type MarkedArrow, Target } from '@/ui/Target';
import { space, type, useTheme } from '@/ui/theme';

/** Próximo a atirar: quem tem menos séries; empate pela ordem de vez. */
function nextShooter(s: LoadedSession): LoadedParticipant {
  return [...s.participants].sort((a, b) => a.ends.length - b.ends.length || a.position - b.position)[0];
}

export default function Shoot() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDb();
  const { data: s } = useData(() => loadSession(db, id), [db, id]);

  const [manualId, setManualId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, NewArrow[]>>({});
  const [showDay, setShowDay] = useState(false);
  const [touching, setTouching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (s?.endedAt) router.replace(`/session/${s.id}/summary`);
  }, [s]);

  const active = useMemo(() => {
    if (!s) return null;
    return s.participants.find((p) => p.id === manualId) ?? nextShooter(s);
  }, [s, manualId]);

  if (!s || !active) return null;

  const isComp = s.mode === 'competition';
  const draft = drafts[active.id] ?? [];
  const scored = scoreEnd(draft, active.face, active.arrowDiameterMm);
  const full = draft.length >= s.arrowsPerEnd;
  // Na competição, quem já atirou as séries planejadas não atira mais.
  const participantDone = isComp && !!s.endsPlanned && active.ends.length >= s.endsPlanned;
  const locked = full || participantDone;
  const endNo = active.ends.length + 1;
  const allDone = !!s.endsPlanned && s.participants.every((p) => p.ends.length >= s.endsPlanned!);
  const rw = ringWidth(active.face);

  const setDraft = (next: NewArrow[]) => setDrafts((d) => ({ ...d, [active.id]: next }));

  const marked: MarkedArrow[] = [
    ...(showDay
      ? active.ends.flatMap((e) => e.arrows.filter((a) => !a.isMiss).map((a) => ({ spotIndex: a.spotIndex, xMm: a.xMm!, yMm: a.yMm!, tone: 'old' as const })))
      : []),
    ...draft
      .filter((a) => !a.isMiss)
      .map((a, i, arr) => ({ spotIndex: a.spotIndex, xMm: a.xMm!, yMm: a.yMm!, tone: i === arr.length - 1 ? ('last' as const) : ('current' as const) })),
  ];

  const place = (p: { spotIndex: number; xMm: number; yMm: number }) => {
    if (locked) return;
    setDraft([...draft, { ...p, isMiss: false }]);
  };

  async function save() {
    if (!draft.length || saving) return;
    setSaving(true);
    try {
      await saveEnd(db, active!.id, draft);
      setDraft([]);
      setManualId(null); // competição: passa para o próximo
    } finally {
      setSaving(false);
    }
  }

  function removeLastEnd() {
    if (!active!.ends.length) return;
    Alert.alert('Apagar última série?', `Série ${active!.ends.length} de ${active!.archer.name}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => deleteLastEnd(db, active!.id) },
    ]);
  }

  function finish() {
    const pending = Object.values(drafts).some((d) => d.length > 0);
    Alert.alert(
      isComp ? 'Encerrar competição?' : 'Encerrar treino?',
      pending ? 'Há flechas não salvas, que serão descartadas.' : isComp ? 'O placar final será congelado.' : undefined,
      [
        { text: 'Continuar atirando', style: 'cancel' },
        {
          text: 'Encerrar',
          onPress: async () => {
            await finishSession(db, s!.id);
            router.replace(`/session/${s!.id}/summary`);
          },
        },
      ],
    );
  }

  const dayPoints = active.ends.flatMap((e) => hits(e.scored));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: isComp ? 'Competição' : `${active.distanceM} m · ${active.face.name}`,
          headerRight: () => <Button kind="ghost" label="Encerrar" onPress={finish} />,
        }}
      />
      <ScrollView scrollEnabled={!touching} contentContainerStyle={styles.content}>
        {isComp && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {s.participants.map((p) => (
              <Chip
                key={p.id}
                label={`${p.archer.nickname || p.archer.name} · ${p.ends.length}${s.endsPlanned ? `/${s.endsPlanned}` : ''}`}
                selected={p.id === active.id}
                onPress={() => setManualId(p.id)}
              />
            ))}
          </ScrollView>
        )}

        <Row>
          <View style={{ flex: 1 }}>
            <T variant="title">
              {isComp ? `${active.archer.nickname || active.archer.name} · ` : ''}Série {endNo}
              {s.endsPlanned ? ` de ${s.endsPlanned}` : ''}
            </T>
            <T variant="small" color={colors.inkSoft}>
              {isComp ? `${active.distanceM} m · ${active.face.name} · ` : ''}
              {draft.length}/{s.arrowsPerEnd} flechas · total {active.summary.total + scored.reduce((t, a) => t + a.value, 0)}
            </T>
          </View>
          <Pressable onPress={() => setShowDay(!showDay)} hitSlop={8}>
            <T variant="small" color={colors.accent} style={{ fontWeight: '700' }}>
              {showDay ? 'Ocultar dia' : 'Ver dia'}
            </T>
          </Pressable>
        </Row>

        <Target
          face={active.face}
          arrows={marked}
          arrowDiameterMm={active.arrowDiameterMm}
          onPlace={locked ? undefined : place}
          onTouchingChange={setTouching}
          maxHeight={460}
        />

        <ArrowSlots scores={scored} slots={s.arrowsPerEnd} />

        <Row>
          <Button kind="secondary" label="M (fora)" onPress={() => setDraft([...draft, { xMm: null, yMm: null, spotIndex: 0, isMiss: true }])} disabled={locked} style={{ flex: 1 }} />
          <Button kind="secondary" label="Desfazer" onPress={() => setDraft(draft.slice(0, -1))} disabled={!draft.length} style={{ flex: 1 }} />
        </Row>
        {participantDone && !allDone ? (
          <T color={colors.inkSoft}>{active.archer.nickname || active.archer.name} já atirou todas as séries. Escolha outro atirador acima.</T>
        ) : (
          <Button big label={full ? 'Salvar série' : `Salvar série (${draft.length})`} onPress={save} disabled={!draft.length || saving} />
        )}

        {allDone && (
          <Card style={{ borderColor: colors.accent, borderWidth: 1.5 }}>
            <T variant="heading">Todas as séries planejadas foram atiradas.</T>
            <Button label={isComp ? 'Encerrar e ver resultado' : 'Encerrar e ver resumo'} onPress={finish} />
          </Card>
        )}

        {isComp && <Scoreboard s={s} />}

        <GroupReadingCard
          title={draft.length >= 3 ? 'Leitura desta série' : 'Leitura da última série'}
          points={draft.length >= 3 ? hits(scored) : hits(active.ends.at(-1)?.scored ?? [])}
          ringWidthMm={rw}
        />
        {active.ends.length > 1 && <GroupReadingCard title="Leitura do dia" points={dayPoints} ringWidthMm={rw} />}

        {active.ends.length > 0 && (
          <Card>
            <Row>
              <T variant="label" color={colors.inkSoft} style={{ flex: 1 }}>
                Séries salvas
              </T>
              <Pressable onPress={removeLastEnd} hitSlop={8}>
                <T variant="small" color={colors.danger} style={{ fontWeight: '700' }}>
                  Apagar última
                </T>
              </Pressable>
            </Row>
            {[...active.ends].reverse().map((e) => (
              <Row key={e.id}>
                <T variant="small" color={colors.inkSoft} style={{ width: 28 }}>
                  S{e.endNumber}
                </T>
                <View style={{ flex: 1 }}>
                  <ArrowSlots scores={e.scored} sort size={32} />
                </View>
                <T variant="heading" style={type.number}>
                  {e.scored.reduce((t, a) => t + a.value, 0)}
                </T>
              </Row>
            ))}
            <T variant="small" color={colors.inkSoft}>
              Média por flecha {fmt(active.summary.average, 2)}
            </T>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Scoreboard({ s }: { s: LoadedSession }) {
  const { colors } = useTheme();
  const ranking = competitionRanking(s);
  const byId = new Map(s.participants.map((p) => [p.id, p]));
  const showHandicap = s.handicapType === 'points';
  return (
    <Card>
      <T variant="label" color={colors.inkSoft}>
        Placar
      </T>
      {ranking.map((r) => {
        const p = byId.get(r.participantId)!;
        return (
          <Row key={r.participantId}>
            <T variant="heading" style={{ width: 28 }}>
              {r.rank}º
            </T>
            <T style={{ flex: 1 }} numberOfLines={1}>
              {p.archer.nickname || p.archer.name}
            </T>
            <T variant="small" color={colors.inkSoft} style={type.number}>
              {r.total}
              {showHandicap ? ` +${r.handicap}` : ''}
              {`  ·  ${r.tens}×10`}
            </T>
            <T variant="heading" style={[type.number, { width: 48, textAlign: 'right' }]}>
              {r.final}
            </T>
          </Row>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
});
