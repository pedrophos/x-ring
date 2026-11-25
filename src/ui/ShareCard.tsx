import type { ComponentRef, ReactNode, Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { LoadedParticipant, LoadedSession, Standing } from '@/db/repo';

import { fmt, fmtDate } from './kit';
import { TallyStave } from './TallyStave';
import { type MarkedArrow, Target } from './Target';
import { FixedTheme, lightColors as c, type } from './theme';

/** Story 9:16; a captura sai em 1080 × 1920. */
export const SHARE_WIDTH = 360;
export const SHARE_HEIGHT = 640;

/**
 * Margens de cima e de baixo maiores: no story o Instagram cobre o topo
 * (perfil, barra de progresso) e a base (campo de resposta).
 */
const PAD_X = 24;
const PAD_TOP = 72;
const PAD_BOTTOM = 88;
const INNER_W = SHARE_WIDTH - PAD_X * 2;
const STAVE_H = 26;
const MAX_ROWS = 6;

type CardRef = Ref<ComponentRef<typeof View>>;

const hitsOf = (p: LoadedParticipant): MarkedArrow[] =>
  p.ends.flatMap((e) =>
    e.arrows.filter((a) => !a.isMiss).map((a) => ({ spotIndex: a.spotIndex, xMm: a.xMm!, yMm: a.yMm!, tone: 'current' as const })),
  );
const nameOf = (p: LoadedParticipant) => p.archer.nickname || p.archer.name;
const endTotals = (p: LoadedParticipant) => p.ends.map((e) => e.scored.reduce((t, a) => t + a.value, 0));

/** Fundo, margens do story e o cabeçalho com marca e data. Sempre na paleta clara da marca. */
function Frame({ cardRef, session, children }: { cardRef?: CardRef; session: LoadedSession; children: ReactNode }) {
  return (
    <FixedTheme scheme="light">
      {/* collapsable={false}: no Android, a View precisa existir de fato para ser capturada. */}
      <View ref={cardRef} collapsable={false} style={styles.card}>
        <View style={styles.row}>
          <Text style={[type.label, { color: c.onShell, fontSize: 22 }]}>X·Ring</Text>
          <Text style={[styles.small, type.number]}>{fmtDate(session.startedAt)}</Text>
        </View>
        {children}
      </View>
    </FixedTheme>
  );
}

/** Bastão com um entalhe por série e o total de cada série embaixo do entalhe. */
function EndsStave({ totals }: { totals: number[] }) {
  if (!totals.length) return null;
  // Mesma geometria do TallyStave para cada número cair sob o seu entalhe.
  const pad = STAVE_H / 2.6;
  const step = (INNER_W - pad * 2) / totals.length;
  const size = step >= 26 ? 15 : step >= 18 ? 12 : 0; // séries demais: só o bastão
  return (
    <View style={{ gap: 6 }}>
      <TallyStave height={STAVE_H} marks={totals.map(() => 'cut' as const)} />
      {size > 0 && (
        <View style={{ flexDirection: 'row', paddingHorizontal: pad }}>
          {totals.map((t, i) => (
            <Text key={i} style={[styles.endTotal, type.number, { width: step, fontSize: size }]}>
              {t}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.statValue, type.number]}>{value}</Text>
      <Text style={[type.label, { color: c.onShell, fontSize: 14, lineHeight: 17 }]}>{label}</Text>
    </View>
  );
}

/** Story de um atirador: treino, ou uma pessoa da competição (com a colocação). */
export function ShareCard({
  ref,
  session,
  participant: p,
  rank,
}: {
  ref?: CardRef;
  session: LoadedSession;
  participant: LoadedParticipant;
  rank?: { rank: number; of: number; final: number };
}) {
  const sum = p.summary;
  return (
    <Frame cardRef={ref} session={session}>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text style={[type.display, { color: c.onShell, fontSize: 32, lineHeight: 38 }]} numberOfLines={1}>
          {session.mode === 'competition' ? nameOf(p) : 'Treino'}
        </Text>
        <Text style={[styles.small, type.number]}>
          {rank ? `${rank.rank}º de ${rank.of} · ` : ''}
          {p.distanceM} m · {p.face.name}
        </Text>
      </View>

      <Target face={p.face} arrows={hitsOf(p)} arrowDiameterMm={p.arrowDiameterMm} maxHeight={250} />

      <View style={{ alignItems: 'center', gap: 10 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.total, type.number]}>{rank ? rank.final : sum.total}</Text>
          <Text style={[type.label, { color: c.onShell, fontSize: 16 }]}>pontos</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 28 }}>
          <Stat label="média/flecha" value={fmt(sum.average, 2)} />
          <Stat label="10 / X" value={`${sum.tens} / ${sum.xs}`} />
          <Stat label="flechas" value={String(sum.arrows)} />
        </View>
      </View>

      <EndsStave totals={endTotals(p)} />
    </Frame>
  );
}

/** Story do resultado da competição: classificação e o alvo de quem venceu. */
export function PodiumCard({ ref, session, rows }: { ref?: CardRef; session: LoadedSession; rows: Standing[] }) {
  const winner = rows[0]?.p;
  const shown = rows.slice(0, MAX_ROWS);
  const hidden = rows.length - shown.length;
  const distances = [...new Set(session.participants.map((p) => p.distanceM))];
  const ends = Math.max(0, ...session.participants.map((p) => p.ends.length));
  const details = [
    `${rows.length} atiradores`,
    distances.length === 1 ? `${distances[0]} m` : null,
    ends ? `${ends} ${ends === 1 ? 'série' : 'séries'} de ${session.arrowsPerEnd}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Frame cardRef={ref} session={session}>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text style={[type.display, { color: c.onShell, fontSize: 32, lineHeight: 38 }]}>Competição</Text>
        <Text style={[styles.small, type.number]}>{details}</Text>
      </View>

      {winner && (
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Target face={winner.face} arrows={hitsOf(winner)} arrowDiameterMm={winner.arrowDiameterMm} maxHeight={170} />
          <Text style={[type.label, { color: c.onShell, fontSize: 15 }]}>o alvo de {nameOf(winner)}</Text>
        </View>
      )}

      <View style={{ gap: 8 }}>
        {shown.map((r, i) => {
          const first = r.rank === 1;
          const tone = first ? c.primary : c.onShell;
          return (
            <View key={r.p.id} style={[styles.rankRow, i === shown.length - 1 && !hidden && { borderBottomWidth: 0 }]}>
              <Text style={[styles.rankNo, type.number, { color: tone, fontSize: first ? 22 : 17 }]}>{r.rank}º</Text>
              <Text
                style={[type.display, { color: tone, fontSize: first ? 26 : 20, lineHeight: first ? 30 : 24, flex: 1 }]}
                numberOfLines={1}
              >
                {nameOf(r.p)}
              </Text>
              <Text style={[styles.rankScore, type.number, { color: tone, fontSize: first ? 26 : 19 }]}>{r.final}</Text>
            </View>
          );
        })}
        {hidden > 0 && <Text style={[styles.small, { textAlign: 'center' }]}>e mais {hidden}</Text>}
      </View>

      {winner ? <EndsStave totals={endTotals(winner)} /> : null}
    </Frame>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SHARE_WIDTH,
    height: SHARE_HEIGHT,
    backgroundColor: c.shell,
    paddingHorizontal: PAD_X,
    paddingTop: PAD_TOP,
    paddingBottom: PAD_BOTTOM,
    justifyContent: 'space-between',
  },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  small: { color: c.onShell, fontSize: 13 },
  total: { color: c.primary, fontSize: 72, fontWeight: '800', lineHeight: 78 },
  statValue: { color: c.onShell, fontSize: 20, fontWeight: '700' },
  endTotal: { color: c.onShell, fontWeight: '700', textAlign: 'center' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingBottom: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.oakLight,
  },
  rankNo: { width: 34, fontWeight: '700' },
  rankScore: { fontWeight: '700' },
});
