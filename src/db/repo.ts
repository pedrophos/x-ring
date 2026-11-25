import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';

import { handicapBonus, type HandicapType, rankEntries } from '@/domain/ranking';
import { scoreArrow } from '@/domain/scoring';
import { summarize, type ScoredArrow, type ScoredEnd, type Summary } from '@/domain/stats';
import type { TechniqueElement } from '@/domain/technique';

import type { Db } from './client';
import { archers, arrows, ends, participants, sessions, targetFaces, techniqueFocus, weeklyPlan } from './schema';
import { invalidate } from './store';

/**
 * Acesso a dados. O volume de um app pessoal é pequeno (milhares de flechas),
 * então as telas carregam a cadeia completa e calculam em memória; a
 * pontuação nunca é guardada.
 *
 * Toda escrita chama invalidate() para as telas recarregarem.
 */

export type Archer = typeof archers.$inferSelect;
export type TargetFace = typeof targetFaces.$inferSelect;
export type Session = typeof sessions.$inferSelect;

export type NewArrow = { xMm: number | null; yMm: number | null; spotIndex: number; isMiss: boolean };

export type LoadedEnd = {
  id: string;
  endNumber: number;
  shotAt: Date;
  arrows: (NewArrow & { id: string })[];
  scored: ScoredArrow[];
};

export type LoadedParticipant = typeof participants.$inferSelect & {
  archer: Archer;
  face: TargetFace;
  ends: LoadedEnd[];
  summary: Summary;
};

export type LoadedSession = Session & { participants: LoadedParticipant[] };

// ---------- Leitura ----------

export async function getMe(db: Db): Promise<Archer> {
  const [me] = await db.select().from(archers).where(eq(archers.isMe, true)).limit(1);
  return me;
}

export const listFaces = (db: Db) =>
  db.select().from(targetFaces).where(isNull(targetFaces.deletedAt)).orderBy(asc(targetFaces.createdAt));

/** Convidados e o principal, mais recentes primeiro. */
export const listArchers = (db: Db) =>
  db
    .select()
    .from(archers)
    .where(isNull(archers.deletedAt))
    .orderBy(desc(archers.isMe), desc(archers.lastSeenAt), asc(archers.name));

export function scoreEnd(
  arrowRows: NewArrow[],
  face: Pick<TargetFace, 'rings'>,
  arrowDiameterMm: number,
): ScoredArrow[] {
  return arrowRows.map((a) => ({
    ...scoreArrow(
      a.isMiss || a.xMm == null || a.yMm == null ? { isMiss: true } : { isMiss: false, xMm: a.xMm, yMm: a.yMm },
      face.rings,
      arrowDiameterMm,
    ),
    isMiss: a.isMiss,
    xMm: a.xMm,
    yMm: a.yMm,
  }));
}

/** Carrega sessões completas (participantes → séries → flechas), pontuadas. */
export async function loadSessions(db: Db, sessionIds?: string[]): Promise<LoadedSession[]> {
  const sessionRows = await db
    .select()
    .from(sessions)
    .where(
      sessionIds ? and(isNull(sessions.deletedAt), inArray(sessions.id, sessionIds)) : isNull(sessions.deletedAt),
    )
    .orderBy(desc(sessions.startedAt));
  if (sessionRows.length === 0) return [];

  const ids = sessionRows.map((s) => s.id);
  const partRows = await db
    .select()
    .from(participants)
    .where(and(isNull(participants.deletedAt), inArray(participants.sessionId, ids)))
    .orderBy(asc(participants.position));
  const partIds = partRows.map((p) => p.id);
  const endRows = partIds.length
    ? await db
        .select()
        .from(ends)
        .where(and(isNull(ends.deletedAt), inArray(ends.participantId, partIds)))
        .orderBy(asc(ends.endNumber))
    : [];
  const endIds = endRows.map((e) => e.id);
  const arrowRows = endIds.length
    ? await db
        .select()
        .from(arrows)
        .where(and(isNull(arrows.deletedAt), inArray(arrows.endId, endIds)))
        .orderBy(asc(arrows.arrowNumber))
    : [];

  const [archerRows, faceRows] = await Promise.all([db.select().from(archers), db.select().from(targetFaces)]);
  const archerById = new Map(archerRows.map((a) => [a.id, a]));
  const faceById = new Map(faceRows.map((f) => [f.id, f]));

  const arrowsByEnd = new Map<string, typeof arrowRows>();
  for (const a of arrowRows) arrowsByEnd.set(a.endId, [...(arrowsByEnd.get(a.endId) ?? []), a]);
  const endsByPart = new Map<string, typeof endRows>();
  for (const e of endRows) endsByPart.set(e.participantId, [...(endsByPart.get(e.participantId) ?? []), e]);

  return sessionRows.map((s) => ({
    ...s,
    participants: partRows
      .filter((p) => p.sessionId === s.id)
      .map((p) => {
        const face = faceById.get(p.targetFaceId)!;
        const loadedEnds: LoadedEnd[] = (endsByPart.get(p.id) ?? []).map((e) => {
          const rows = (arrowsByEnd.get(e.id) ?? []).map((a) => ({
            id: a.id,
            xMm: a.xMm,
            yMm: a.yMm,
            spotIndex: a.spotIndex,
            isMiss: a.isMiss,
          }));
          return { id: e.id, endNumber: e.endNumber, shotAt: e.shotAt, arrows: rows, scored: scoreEnd(rows, face, p.arrowDiameterMm) };
        });
        const scoredEnds: ScoredEnd[] = loadedEnds.map((e) => ({ arrows: e.scored }));
        return { ...p, archer: archerById.get(p.archerId)!, face, ends: loadedEnds, summary: summarize(scoredEnds) };
      }),
  }));
}

export async function loadSession(db: Db, id: string): Promise<LoadedSession | null> {
  const [s] = await loadSessions(db, [id]);
  return s ?? null;
}

export async function openSession(db: Db): Promise<Session | null> {
  const [s] = await db
    .select()
    .from(sessions)
    .where(and(isNull(sessions.deletedAt), isNull(sessions.endedAt)))
    .orderBy(desc(sessions.startedAt))
    .limit(1);
  return s ?? null;
}

// ---------- Escrita ----------

export async function updateMe(db: Db, patch: { name?: string; arrowDiameterMm?: number }) {
  await db.update(archers).set(patch).where(eq(archers.isMe, true));
  invalidate();
}

export async function createArcher(db: Db, name: string): Promise<Archer> {
  const [a] = await db.insert(archers).values({ name: name.trim() }).returning();
  invalidate();
  return a;
}

export async function createTraining(
  db: Db,
  opts: { distanceM: number; targetFaceId: string; arrowsPerEnd: number; endsPlanned: number | null },
): Promise<string> {
  const me = await getMe(db);
  const id = db.transaction((tx) => {
    const [s] = tx
      .insert(sessions)
      .values({ mode: 'training', countForStats: true, arrowsPerEnd: opts.arrowsPerEnd, endsPlanned: opts.endsPlanned })
      .returning()
      .all();
    tx.insert(participants)
      .values({
        sessionId: s.id,
        archerId: me.id,
        distanceM: opts.distanceM,
        targetFaceId: opts.targetFaceId,
        arrowDiameterMm: me.arrowDiameterMm,
      })
      .run();
    return s.id;
  });
  invalidate();
  return id;
}

export type CompetitorSetup = { archerId: string; distanceM: number; targetFaceId: string; handicapPoints: number };

export async function createCompetition(
  db: Db,
  opts: {
    endsPlanned: number;
    arrowsPerEnd: number;
    handicapType: HandicapType;
    countForStats: boolean;
    competitors: CompetitorSetup[];
  },
): Promise<string> {
  const archerRows = await db.select().from(archers);
  const diameter = new Map(archerRows.map((a) => [a.id, a.arrowDiameterMm]));
  const now = new Date();
  const id = db.transaction((tx) => {
    const [s] = tx
      .insert(sessions)
      .values({
        mode: 'competition',
        endsPlanned: opts.endsPlanned,
        arrowsPerEnd: opts.arrowsPerEnd,
        handicapType: opts.handicapType,
        countForStats: opts.countForStats,
      })
      .returning()
      .all();
    opts.competitors.forEach((c, position) => {
      tx.insert(participants)
        .values({
          sessionId: s.id,
          archerId: c.archerId,
          position,
          distanceM: c.distanceM,
          targetFaceId: c.targetFaceId,
          arrowDiameterMm: diameter.get(c.archerId) ?? 5,
          handicapPoints: opts.handicapType === 'points' ? c.handicapPoints : 0,
        })
        .run();
      tx.update(archers).set({ lastSeenAt: now }).where(eq(archers.id, c.archerId)).run();
    });
    return s.id;
  });
  invalidate();
  return id;
}

export async function saveEnd(db: Db, participantId: string, endArrows: NewArrow[]): Promise<void> {
  const existing = await db
    .select({ n: ends.endNumber })
    .from(ends)
    .where(and(eq(ends.participantId, participantId), isNull(ends.deletedAt)))
    .orderBy(desc(ends.endNumber))
    .limit(1);
  const endNumber = (existing[0]?.n ?? 0) + 1;
  db.transaction((tx) => {
    const [e] = tx.insert(ends).values({ participantId, endNumber }).returning().all();
    endArrows.forEach((a, i) => {
      tx.insert(arrows)
        .values({ endId: e.id, arrowNumber: i + 1, xMm: a.xMm, yMm: a.yMm, spotIndex: a.spotIndex, isMiss: a.isMiss })
        .run();
    });
  });
  invalidate();
}

/** Exclusão lógica da última série do participante (e das flechas dela). */
export async function deleteLastEnd(db: Db, participantId: string): Promise<void> {
  const [last] = await db
    .select()
    .from(ends)
    .where(and(eq(ends.participantId, participantId), isNull(ends.deletedAt)))
    .orderBy(desc(ends.endNumber))
    .limit(1);
  if (!last) return;
  const now = new Date();
  db.transaction((tx) => {
    tx.update(arrows).set({ deletedAt: now }).where(eq(arrows.endId, last.id)).run();
    tx.update(ends).set({ deletedAt: now }).where(eq(ends.id, last.id)).run();
  });
  invalidate();
}

/** Ranking da competição a partir das séries salvas. */
export function competitionRanking(s: LoadedSession) {
  return rankEntries(
    s.participants.map((p) => ({
      participantId: p.id,
      total: p.summary.total,
      handicap: handicapBonus(s.handicapType, p.handicapPoints, p.ends.length),
      tens: p.summary.tens,
      xs: p.summary.xs,
    })),
  );
}

export type Standing = { p: LoadedParticipant; rank: number; final: number; total: number; tens: number };

/** Classificação para mostrar: a congelada se a competição foi encerrada, senão a calculada agora. */
export function standings(s: LoadedSession): Standing[] {
  if (s.endedAt) {
    return [...s.participants]
      .sort((a, b) => (a.finalRank ?? 99) - (b.finalRank ?? 99))
      .map((p) => ({ p, rank: p.finalRank ?? 0, final: p.finalScore ?? p.summary.total, total: p.summary.total, tens: p.summary.tens }));
  }
  const byId = new Map(s.participants.map((p) => [p.id, p]));
  return competitionRanking(s).map((r) => ({ p: byId.get(r.participantId)!, rank: r.rank, final: r.final, total: r.total, tens: r.tens }));
}

/** Encerra a sessão; na competição congela final_rank/final_score. */
export async function finishSession(db: Db, sessionId: string): Promise<void> {
  const s = await loadSession(db, sessionId);
  if (!s) return;
  const now = new Date();
  const ranking = s.mode === 'competition' ? competitionRanking(s) : [];
  db.transaction((tx) => {
    for (const r of ranking) {
      tx.update(participants)
        .set({ finalRank: r.rank, finalScore: r.final })
        .where(eq(participants.id, r.participantId))
        .run();
    }
    tx.update(sessions).set({ endedAt: now }).where(eq(sessions.id, sessionId)).run();
  });
  invalidate();
}

export async function setSessionNotes(db: Db, sessionId: string, notes: string) {
  await db.update(sessions).set({ notes }).where(eq(sessions.id, sessionId));
  invalidate();
}

export async function setCountForStats(db: Db, sessionId: string, value: boolean) {
  await db.update(sessions).set({ countForStats: value }).where(eq(sessions.id, sessionId));
  invalidate();
}

export async function deleteSession(db: Db, sessionId: string): Promise<void> {
  await db.update(sessions).set({ deletedAt: new Date() }).where(eq(sessions.id, sessionId));
  invalidate();
}

// ---------- Plano semanal e foco ----------

export type WeekPlan = typeof weeklyPlan.$inferSelect;
export type Focus = typeof techniqueFocus.$inferSelect;

export async function getWeekPlan(db: Db, archerId: string, weekKey: string): Promise<WeekPlan | null> {
  const [p] = await db
    .select()
    .from(weeklyPlan)
    .where(and(eq(weeklyPlan.archerId, archerId), eq(weeklyPlan.weekStart, weekKey), isNull(weeklyPlan.deletedAt)))
    .limit(1);
  return p ?? null;
}

export async function updateWeekPlan(
  db: Db,
  archerId: string,
  weekKey: string,
  patch: Partial<Pick<WeekPlan, 'technicalDone' | 'scoringDone' | 'sptDays'>>,
): Promise<void> {
  const current = await getWeekPlan(db, archerId, weekKey);
  if (current) await db.update(weeklyPlan).set(patch).where(eq(weeklyPlan.id, current.id));
  else await db.insert(weeklyPlan).values({ archerId, weekStart: weekKey, ...patch });
  invalidate();
}

export async function listFocus(db: Db, archerId: string): Promise<Focus[]> {
  return db
    .select()
    .from(techniqueFocus)
    .where(and(eq(techniqueFocus.archerId, archerId), isNull(techniqueFocus.deletedAt)))
    .orderBy(desc(techniqueFocus.weekStart));
}

export async function setFocus(
  db: Db,
  archerId: string,
  weekKey: string,
  patch: { element?: TechniqueElement; videoUri?: string | null; notes?: string | null },
): Promise<void> {
  const [current] = await db
    .select()
    .from(techniqueFocus)
    .where(
      and(eq(techniqueFocus.archerId, archerId), eq(techniqueFocus.weekStart, weekKey), isNull(techniqueFocus.deletedAt)),
    )
    .limit(1);
  if (current) await db.update(techniqueFocus).set(patch).where(eq(techniqueFocus.id, current.id));
  else await db.insert(techniqueFocus).values({ archerId, weekStart: weekKey, element: patch.element ?? 'stance', ...patch });
  invalidate();
}

// ---------- Exportar ----------

/** Todas as tabelas, inclusive linhas excluídas logicamente: é um backup. */
export async function exportAll(db: Db) {
  const [a, tf, s, p, e, ar, wp, f] = await Promise.all([
    db.select().from(archers),
    db.select().from(targetFaces),
    db.select().from(sessions),
    db.select().from(participants),
    db.select().from(ends),
    db.select().from(arrows),
    db.select().from(weeklyPlan),
    db.select().from(techniqueFocus),
  ]);
  return {
    app: 'x-ring',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      archers: a,
      target_faces: tf,
      sessions: s,
      participants: p,
      ends: e,
      arrows: ar,
      weekly_plan: wp,
      technique_focus: f,
    },
  };
}
