import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { Ring, SpotCenter } from '@/domain/target-face';
import { newId } from '@/domain/id';

/**
 * Colunas comuns a todas as tabelas: UUID gerado no cliente e carimbos de
 * tempo para a sincronização futura (envio do que mudou por updated_at).
 * deleted_at = exclusão lógica.
 */
const base = {
  id: text('id').primaryKey().$defaultFn(newId),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
};

export const archers = sqliteTable('archers', {
  ...base,
  name: text('name').notNull(),
  nickname: text('nickname'),
  isMe: integer('is_me', { mode: 'boolean' }).notNull().default(false),
  /** Diâmetro atual da haste; copiado para participants ao criar a sessão. */
  arrowDiameterMm: real('arrow_diameter_mm').notNull().default(5),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }),
});

export const targetFaces = sqliteTable('target_faces', {
  ...base,
  name: text('name').notNull(),
  /** Chave estável dos alvos padrão (seed idempotente); null no alvo livre. */
  builtinKey: text('builtin_key').unique(),
  rings: text('rings', { mode: 'json' }).$type<Ring[]>().notNull(),
  centers: text('centers', { mode: 'json' }).$type<SpotCenter[]>().notNull(),
  isBuiltin: integer('is_builtin', { mode: 'boolean' }).notNull().default(false),
});

export const sessionModes = ['training', 'competition'] as const;
export const handicapTypes = ['none', 'distance', 'target', 'points'] as const;

export const sessions = sqliteTable(
  'sessions',
  {
    ...base,
    startedAt: integer('started_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
    mode: text('mode', { enum: sessionModes }).notNull(),
    endsPlanned: integer('ends_planned'),
    arrowsPerEnd: integer('arrows_per_end').notNull().default(6),
    handicapType: text('handicap_type', { enum: handicapTypes }).notNull().default('none'),
    /** Competição fica fora das estatísticas de treino, salvo se marcado. */
    countForStats: integer('count_for_stats', { mode: 'boolean' }).notNull(),
    notes: text('notes'),
  },
  (t) => [index('sessions_started_at_idx').on(t.startedAt)],
);

export const participants = sqliteTable(
  'participants',
  {
    ...base,
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id),
    archerId: text('archer_id')
      .notNull()
      .references(() => archers.id),
    distanceM: real('distance_m').notNull(),
    targetFaceId: text('target_face_id')
      .notNull()
      .references(() => targetFaces.id),
    /** Snapshot: a regra da linha depende do diâmetro da haste. */
    arrowDiameterMm: real('arrow_diameter_mm').notNull(),
    handicapPoints: integer('handicap_points').notNull().default(0),
    /** Congelados ao encerrar a competição. */
    finalRank: integer('final_rank'),
    finalScore: integer('final_score'),
  },
  (t) => [
    index('participants_session_idx').on(t.sessionId),
    index('participants_archer_idx').on(t.archerId),
  ],
);

export const ends = sqliteTable(
  'ends',
  {
    ...base,
    participantId: text('participant_id')
      .notNull()
      .references(() => participants.id),
    endNumber: integer('end_number').notNull(),
    shotAt: integer('shot_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('ends_participant_idx').on(t.participantId)],
);

export const arrows = sqliteTable(
  'arrows',
  {
    ...base,
    endId: text('end_id')
      .notNull()
      .references(() => ends.id),
    arrowNumber: integer('arrow_number').notNull(),
    /** mm a partir do centro do spot; null quando is_miss. */
    xMm: real('x_mm'),
    yMm: real('y_mm'),
    spotIndex: integer('spot_index').notNull().default(0),
    isMiss: integer('is_miss', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [index('arrows_end_idx').on(t.endId)],
);

export const weeklyPlan = sqliteTable(
  'weekly_plan',
  {
    ...base,
    archerId: text('archer_id')
      .notNull()
      .references(() => archers.id),
    /** Segunda-feira da semana, data local 'YYYY-MM-DD'. */
    weekStart: text('week_start').notNull(),
    technicalDone: integer('technical_done', { mode: 'boolean' }).notNull().default(false),
    scoringDone: integer('scoring_done', { mode: 'boolean' }).notNull().default(false),
    /** Datas 'YYYY-MM-DD' com treino físico feito. */
    sptDays: text('spt_days', { mode: 'json' }).$type<string[]>().notNull().default([]),
  },
  (t) => [index('weekly_plan_week_idx').on(t.archerId, t.weekStart)],
);

export const techniqueElements = [
  'stance',
  'grip',
  'hook',
  'draw',
  'anchor',
  'release',
  'follow_through',
] as const;

export const techniqueFocus = sqliteTable(
  'technique_focus',
  {
    ...base,
    archerId: text('archer_id')
      .notNull()
      .references(() => archers.id),
    weekStart: text('week_start').notNull(),
    element: text('element', { enum: techniqueElements }).notNull(),
    videoUri: text('video_uri'),
    notes: text('notes'),
  },
  (t) => [index('technique_focus_week_idx').on(t.archerId, t.weekStart)],
);
