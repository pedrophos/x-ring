import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { useDb } from '@/db/client';
import {
  competitionRanking,
  deleteSession,
  type LoadedParticipant,
  type LoadedSession,
  loadSession,
  setCountForStats,
  setSessionNotes,
} from '@/db/repo';
import { useData } from '@/db/store';
import { ringWidth } from '@/domain/geometry';
import { hits } from '@/domain/stats';
import { ArrowSlots } from '@/ui/ArrowSlots';
import { GroupReadingCard } from '@/ui/GroupReadingCard';
import { Button, Card, Chip, Field, fmt, fmtDate, Row, Screen, Section, Stat, T, ToggleRow } from '@/ui/kit';
import { type MarkedArrow, Target } from '@/ui/Target';
import { space, type, useTheme } from '@/ui/theme';

export default function Summary() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDb();
  const { data: s } = useData(() => loadSession(db, id), [db, id]);
  const [selected, setSelected] = useState<string | null>(null);

  if (!s) return null;
  const isComp = s.mode === 'competition';
  const p = s.participants.find((x) => x.id === selected) ?? s.participants[0];

  function remove() {
    Alert.alert('Excluir sessão?', 'Ela some do histórico e das estatísticas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(db, s!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: isComp ? 'Resultado' : 'Resumo do treino' }} />
      <T variant="small" color={colors.inkSoft}>
        {fmtDate(s.startedAt)} · {s.startedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        {s.endedAt ? '' : ' · em andamento'}
      </T>

      {!s.endedAt && <Button label="Voltar a atirar" onPress={() => router.replace(`/session/${s.id}`)} />}

      {isComp && <Ranking s={s} />}

      {isComp && (
        <Row style={{ flexWrap: 'wrap' }}>
          {s.participants.map((x) => (
            <Chip key={x.id} label={x.archer.nickname || x.archer.name} selected={x.id === p.id} onPress={() => setSelected(x.id)} />
          ))}
        </Row>
      )}

      <ParticipantSummary p={p} />

      {isComp && (
        <Card>
          <ToggleRow
            label="Contar para minhas estatísticas"
            hint="Desligado por padrão: tiro sob pressão não se mistura com treino."
            value={s.countForStats}
            onChange={(v) => setCountForStats(db, s.id, v)}
          />
        </Card>
      )}

      <Notes s={s} />

      <Button kind="danger" label="Excluir sessão" onPress={remove} />
    </Screen>
  );
}

function ParticipantSummary({ p }: { p: LoadedParticipant }) {
  const { colors } = useTheme();
  const sum = p.summary;
  const all: MarkedArrow[] = p.ends.flatMap((e, i) =>
    e.arrows
      .filter((a) => !a.isMiss)
      .map((a) => ({ spotIndex: a.spotIndex, xMm: a.xMm!, yMm: a.yMm!, tone: i === p.ends.length - 1 ? ('last' as const) : ('current' as const) })),
  );
  const drop = sum.firstEndAverage != null && sum.lastEndAverage != null ? sum.lastEndAverage - sum.firstEndAverage : null;

  return (
    <View style={{ gap: space.lg }}>
      <T variant="small" color={colors.inkSoft}>
        {p.distanceM} m · {p.face.name} · {sum.arrows} flechas em {sum.ends} séries
      </T>
      <Target face={p.face} arrows={all} arrowDiameterMm={p.arrowDiameterMm} maxHeight={380} />
      <T variant="small" color={colors.inkSoft} style={{ textAlign: 'center' }}>
        Todas as flechas do dia; a última série em laranja.
      </T>

      <Card>
        <Row style={{ flexWrap: 'wrap', gap: space.lg }}>
          <Stat label="Total" value={String(sum.total)} />
          <Stat label="Média/flecha" value={fmt(sum.average, 2)} />
          <Stat label="10 / X" value={`${sum.tens} / ${sum.xs}`} />
        </Row>
        <Row style={{ flexWrap: 'wrap', gap: space.lg }}>
          <Stat label="1ª série" value={fmt(sum.firstEndAverage, 2)} hint="média/flecha" />
          <Stat label="Última" value={fmt(sum.lastEndAverage, 2)} hint="média/flecha" />
          <Stat label="Dispersão" value={sum.dispersionMm == null ? '—' : `${fmt(sum.dispersionMm, 0)} mm`} hint="média por série" />
        </Row>
        {drop != null && drop <= -1 && (
          <T color={colors.danger}>
            Caiu {fmt(-drop, 1)} ponto por flecha da primeira para a última série: sinal de cansaço. Se acontece
            sempre, encurte a sessão ou reveja se 30 lb está pesado para o momento.
          </T>
        )}
      </Card>

      <GroupReadingCard title="Leitura do dia" points={p.ends.flatMap((e) => hits(e.scored))} ringWidthMm={ringWidth(p.face)} />

      <Section title="Séries">
        <Card>
          {p.ends.map((e) => (
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
          {p.ends.length === 0 && <T color={colors.inkSoft}>Nenhuma série salva.</T>}
        </Card>
      </Section>
    </View>
  );
}

function Ranking({ s }: { s: LoadedSession }) {
  const { colors } = useTheme();
  // Encerrada: usa o resultado congelado; em andamento: calcula.
  const live = competitionRanking(s);
  const rows = s.endedAt
    ? [...s.participants]
        .sort((a, b) => (a.finalRank ?? 99) - (b.finalRank ?? 99))
        .map((p) => ({ p, rank: p.finalRank ?? 0, final: p.finalScore ?? 0, total: p.summary.total, tens: p.summary.tens }))
    : live.map((r) => ({ p: s.participants.find((x) => x.id === r.participantId)!, rank: r.rank, final: r.final, total: r.total, tens: r.tens }));
  return (
    <Card>
      {rows.map(({ p, rank, final, total, tens }) => (
        <Row key={p.id}>
          <T variant="title" style={{ width: 40 }} color={rank === 1 ? colors.accent : colors.ink}>
            {rank}º
          </T>
          <View style={{ flex: 1 }}>
            <T variant="heading">{p.archer.nickname || p.archer.name}</T>
            <T variant="small" color={colors.inkSoft}>
              {p.distanceM} m · {total} pts{final !== total ? ` + ${final - total} hcp` : ''} · {tens}×10
            </T>
          </View>
          <T variant="title" style={type.number}>
            {final}
          </T>
        </Row>
      ))}
    </Card>
  );
}

function Notes({ s }: { s: LoadedSession }) {
  const db = useDb();
  const [text, setText] = useState(s.notes ?? '');
  return (
    <Field
      label="Anotações"
      multiline
      placeholder="Vento, cansaço, o que funcionou…"
      value={text}
      onChangeText={setText}
      onEndEditing={() => text !== (s.notes ?? '') && setSessionNotes(db, s.id, text)}
      style={{ minHeight: 88, textAlignVertical: 'top', paddingTop: space.md }}
    />
  );
}
